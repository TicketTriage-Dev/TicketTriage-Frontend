// Typed API client — the ONE place for fetch + auth header + error handling.
//
// Until the backend is live we serve responses from the mock layer. Flip to the
// real API by setting NEXT_PUBLIC_USE_MOCK=false and NEXT_PUBLIC_API_URL. Callers
// (slices, components) never change — only this file does.
//
// Each endpoint is declared once via `endpoint(real, mock)`: `real` runs against
// the backend, `mock` against the fixtures. No per-method if/else branching.
import type {
  Category,
  CreateTicketInput,
  Employee,
  LoginResponse,
  Role,
  Ticket,
  TicketStatus,
  Priority,
  UpdateTicketInput,
  User,
} from "@/types";
import { TOKEN_STORAGE_KEY } from "@/constants";
import { mockCategories, mockEmployees, mockTickets } from "./mockData";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

/** Raised when an API call fails; carries the envelope error code. */
export class ApiClientError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
  }
}

/**
 * Picks the real or mock implementation for an endpoint based on USE_MOCK.
 * This is the one branch point — every method below stays a single declaration.
 */
function endpoint<T>(real: () => Promise<T>, mock: () => Promise<T>): () => Promise<T> {
  return USE_MOCK ? mock : real;
}

// --- Real transport ---------------------------------------------------------

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) qs.set(key, String(value));
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

/**
 * Real fetch wrapper: attaches JSON + auth headers, parses the standard
 * { ok, data } | { ok:false, error } envelope, and throws ApiClientError on failure.
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new ApiClientError("BAD_JSON", `Expected JSON from ${path} (HTTP ${res.status}).`);
  }

  const env = body as
    | { ok: true; data: T }
    | { ok: false; error: { code: string; message: string } };

  if (!env || typeof env !== "object" || !("ok" in env)) {
    throw new ApiClientError("BAD_ENVELOPE", `Malformed response from ${path}.`);
  }
  if (!env.ok) throw new ApiClientError(env.error.code, env.error.message);
  return env.data;
}

// --- Mock transport ---------------------------------------------------------

let ticketsStore: Ticket[] = [...mockTickets];
let nextTicketId = Math.max(...mockTickets.map((t) => t.ticket_id)) + 1;

/** Resolve after a short delay to mimic network latency. */
function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// --- Public API -------------------------------------------------------------
//
// Signature convention: methods take their args, endpoint() chooses transport.

export const api = {
  login: (email: string, password: string) =>
    endpoint<LoginResponse>(
      () => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
      () => {
        const user = mockEmployees.find((e) => e.email === email) ?? mockEmployees[0];
        return delay({ token: `mock-token-${user.employee_id}`, user });
      },
    )(),

  me: () =>
    endpoint<User>(
      () => request("/me"),
      () => delay(mockEmployees[0]),
    )(),

  getTickets: (filters?: { status?: TicketStatus; priority?: Priority; assigned_to?: number }) =>
    endpoint<Ticket[]>(
      () => request(`/tickets${buildQuery({ ...filters })}`),
      () => {
        let items = [...ticketsStore];
        if (filters?.status) items = items.filter((t) => t.status === filters.status);
        if (filters?.priority) items = items.filter((t) => t.priority === filters.priority);
        if (filters?.assigned_to != null)
          items = items.filter((t) => t.assigned_to === filters.assigned_to);
        return delay(items);
      },
    )(),

  getMyTickets: () =>
    endpoint<Ticket[]>(
      () => request("/tickets/mine"),
      () => delay(ticketsStore.filter((t) => t.assigned_to === mockEmployees[1].employee_id)),
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
        if (!updated) throw new ApiClientError("NOT_FOUND", `Ticket ${id} not found.`);
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
