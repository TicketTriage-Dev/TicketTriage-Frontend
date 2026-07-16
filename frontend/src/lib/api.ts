// Typed API client — the ONE place for fetch + auth + error handling.
//
// Auth is COOKIE-based (httpOnly access_token ~15min + refresh_token ~7d), so we
// send `credentials: "include"` and keep NO token in JS. On a 401 the client
// calls /auth/refresh ONCE, then replays the original request; if the refresh
// itself fails, the session is dead and we surface an auth error (→ re-login).
//
// Backend envelope: { status, msg, data }. Until the ticket/category/employee
// endpoints are finalized we serve those from the mock layer; auth talks to the
// real backend when NEXT_PUBLIC_USE_MOCK=false. Callers never change — only here.
import type {
  Category,
  CreateTicketInput,
  Employee,
  LoginInput,
  RegisterInput,
  Role,
  Ticket,
  TicketStatus,
  Priority,
  UpdateTicketInput,
  User,
} from "@/types";
import { mockCategories, mockEmployees, mockTickets } from "./mockData";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/ticketTriage").replace(/\/$/, "");

/** Raised when an API call fails; carries HTTP status + backend message. */
export class ApiClientError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

/** Picks the real or mock implementation — the one branch point. */
function endpoint<T>(real: () => Promise<T>, mock: () => Promise<T>): () => Promise<T> {
  return USE_MOCK ? mock : real;
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) qs.set(key, String(value));
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

// --- Refresh interceptor (single-flight) ------------------------------------

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Calls /auth/refresh at most once concurrently. Returns true if the session was
 * refreshed. Never retries itself (guarded in request), so it can't loop.
 */
function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = request<null>("/auth/refresh", { method: "POST" }, { isRetry: true })
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/**
 * Real fetch wrapper: sends cookies, parses the { status, msg, data } envelope,
 * and on 401 refreshes once + replays. Throws ApiClientError on failure.
 */
async function request<T>(
  path: string,
  init: RequestInit = {},
  opts: { isRetry?: boolean } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });

  // Access token expired → refresh once, then replay the original request.
  if (res.status === 401 && !opts.isRetry && path !== "/auth/refresh") {
    const refreshed = await refreshSession();
    if (refreshed) return request<T>(path, init, { isRetry: true });
    throw new ApiClientError(401, "UNAUTHENTICATED", "Session expired. Please log in again.");
  }

  let body: { status?: number; msg?: string; data?: T } | null = null;
  try {
    body = await res.json();
  } catch {
    throw new ApiClientError(res.status, "BAD_JSON", `Expected JSON from ${path} (HTTP ${res.status}).`);
  }

  const status = typeof body?.status === "number" ? body.status : res.status;
  if (!res.ok || status >= 400) {
    throw new ApiClientError(status, "API_ERROR", body?.msg ?? `Request to ${path} failed.`);
  }
  return body?.data as T;
}

// --- Mock transport ---------------------------------------------------------

let ticketsStore: Ticket[] = [...mockTickets];
let nextTicketId = Math.max(...mockTickets.map((t) => t.ticket_id)) + 1;
let mockCurrentUser: User = mockEmployees[0];

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// --- Public API -------------------------------------------------------------

export const api = {
  // Auth (real backend contract) --------------------------------------------
  login: (input: LoginInput) =>
    endpoint<User>(
      () => request<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(input) }).then((d) => d.user),
      () => {
        mockCurrentUser = mockEmployees.find((e) => e.email === input.email) ?? mockEmployees[0];
        return delay(mockCurrentUser);
      },
    )(),

  register: (input: RegisterInput) =>
    endpoint<User>(
      () => request<{ user: User }>("/auth/register", { method: "POST", body: JSON.stringify(input) }).then((d) => d.user),
      () => delay({ id: 99, name: input.name, email: input.email, role: "developer", designation: input.designation }),
    )(),

  logout: () =>
    endpoint<null>(
      () => request<null>("/auth/logout", { method: "POST" }),
      () => delay(null),
    )(),

  me: () =>
    endpoint<User>(
      () => request<{ user: User }>("/auth/me").then((d) => d.user),
      () => delay(mockCurrentUser),
    )(),

  refresh: () =>
    endpoint<boolean>(
      () => refreshSession(),
      () => delay(true),
    )(),

  // Tickets / categories / employees (endpoints provisional — mock-backed until
  // the backend publishes these routes; adjust paths here when it does) --------
  getTickets: (filters?: { status?: TicketStatus; priority?: Priority; assigned_to?: number }) =>
    endpoint<Ticket[]>(
      () => request(`/tickets${buildQuery({ ...filters })}`),
      () => {
        let items = [...ticketsStore];
        if (filters?.status) items = items.filter((t) => t.status === filters.status);
        if (filters?.priority) items = items.filter((t) => t.priority === filters.priority);
        if (filters?.assigned_to != null) items = items.filter((t) => t.assigned_to === filters.assigned_to);
        return delay(items);
      },
    )(),

  getMyTickets: () =>
    endpoint<Ticket[]>(
      () => request("/tickets/mine"),
      () => delay(ticketsStore.filter((t) => t.assigned_to === mockCurrentUser.id)),
    )(),

  createTicket: (input: CreateTicketInput) =>
    endpoint<Ticket>(
      () => request("/tickets", { method: "POST", body: JSON.stringify(input) }),
      () => {
        const ticket: Ticket = {
          ticket_id: nextTicketId++,
          status: "todo",
          assigned_to: input.assigned_to ?? null,
          time_to_complete: input.time_to_complete ?? null,
          created_at: new Date().toISOString(),
          name: input.name,
          description: input.description,
          category_id: input.category_id,
          priority: input.priority,
        };
        ticketsStore = [ticket, ...ticketsStore];
        return delay(ticket);
      },
    )(),

  updateTicket: (id: number, patch: UpdateTicketInput) =>
    endpoint<Ticket>(
      () => request(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
      () => {
        ticketsStore = ticketsStore.map((t) => (t.ticket_id === id ? { ...t, ...patch } : t));
        const updated = ticketsStore.find((t) => t.ticket_id === id);
        if (!updated) throw new ApiClientError(404, "NOT_FOUND", `Ticket ${id} not found.`);
        return delay(updated);
      },
    )(),

  getCategories: () =>
    endpoint<Category[]>(
      () => request("/categories"),
      () => delay(mockCategories),
    )(),

  getEmployees: (role?: Role) =>
    endpoint<Employee[]>(
      () => request(`/employees${buildQuery({ role })}`),
      () => delay(role ? mockEmployees.filter((e) => e.role === role) : mockEmployees),
    )(),
};
