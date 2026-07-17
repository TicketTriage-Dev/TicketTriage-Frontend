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
// Backend base URL comes from .env (NEXT_PUBLIC_API_URL) — never hardcoded here.
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

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
    // Surface field-level validation errors (data.errors) so messages are actionable,
    // not just a generic "Validation failed".
    const errors = (body?.data as { errors?: Record<string, string> } | undefined)?.errors;
    const detail = errors ? Object.values(errors).join(" ") : null;
    const msg = body?.msg ?? `Request to ${path} failed.`;
    throw new ApiClientError(status, "API_ERROR", detail ? `${msg}: ${detail}` : msg);
  }
  return body?.data as T;
}

// --- Backend adapter --------------------------------------------------------
// The real backend speaks a different shape than our frontend types (id vs
// ticket_id, title vs name, assignee_id vs assigned_to, capitalized priority,
// list payloads nested under data.tickets/categories/developers). We map it
// here, in the one network seam, so NOTHING downstream (types, store, cards,
// constants) has to change. Status casing already matches (Assigned/In Progress/Done).

interface RawTicket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: string; // "Normal" | "Urgent" | "Severe"
  time_to_complete: number | string | null;
  category_id: number;
  category_name?: string;
  reporter_id?: number;
  reporter_name?: string;
  assignee_id: number | null;
  assignee_name?: string | null;
  created_at: string;
  updated_at?: string;
}

interface RawCategory {
  id: number;
  name: string;
}

interface RawEmployee {
  id: number;
  name: string;
  email?: string;
  role?: Role;
  designation?: string | null;
}

/** Backend "Normal"/"Urgent"/"Severe" → our lowercase Priority (unknown → normal). */
function toPriority(raw: string | undefined): Priority {
  const v = (raw ?? "").toLowerCase();
  return v === "urgent" || v === "severe" ? v : "normal";
}

/** Our lowercase Priority → backend "Normal"/"Urgent"/"Severe" for request bodies. */
function fromPriority(p: Priority): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function adaptTicket(r: RawTicket): Ticket {
  return {
    ticket_id: r.id,
    name: r.title,
    description: r.description,
    category_id: r.category_id,
    status: r.status,
    priority: toPriority(r.priority),
    assigned_to: r.assignee_id ?? null,
    time_to_complete: r.time_to_complete ?? null,
    created_at: r.created_at,
  };
}

function adaptCategory(r: RawCategory): Category {
  return { category_id: r.id, name: r.name };
}

function adaptEmployee(r: RawEmployee): Employee {
  return {
    id: r.id,
    name: r.name,
    email: r.email ?? "",
    role: r.role ?? "developer",
    designation: r.designation ?? null,
  };
}

/** Pull an array out of a { key: [...] } envelope, tolerating a bare array too. */
function unwrapList<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  const nested = (data as Record<string, unknown> | null)?.[key];
  return Array.isArray(nested) ? (nested as T[]) : [];
}

/** Map our UpdateTicketInput (frontend field names) → the backend PATCH body. */
function toUpdateBody(patch: UpdateTicketInput): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (patch.name !== undefined) body.title = patch.name;
  if (patch.description !== undefined) body.description = patch.description;
  if (patch.category_id !== undefined) body.category_id = patch.category_id;
  if (patch.assigned_to !== undefined) body.assignee_id = patch.assigned_to;
  if (patch.priority !== undefined) body.priority = fromPriority(patch.priority);
  return body;
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
      () =>
        request<unknown>(
          `/tickets${buildQuery({
            status: filters?.status,
            priority: filters?.priority ? fromPriority(filters.priority) : undefined,
            assigned_to: filters?.assigned_to,
          })}`,
        ).then((d) => unwrapList<RawTicket>(d, "tickets").map(adaptTicket)),
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
      () => request<unknown>("/tickets/mine").then((d) => unwrapList<RawTicket>(d, "tickets").map(adaptTicket)),
      () => delay(ticketsStore.filter((t) => t.assigned_to === mockCurrentUser.id)),
    )(),

  createTicket: (input: CreateTicketInput) =>
    endpoint<Ticket>(
      () =>
        request<{ ticket: RawTicket }>("/tickets", {
          method: "POST",
          body: JSON.stringify({
            title: input.name,
            description: input.description,
            category_id: input.category_id,
            assignee_id: input.assigned_to ?? null,
            priority: fromPriority(input.priority),
            time_to_complete: input.time_to_complete ?? null,
          }),
        }).then((d) => adaptTicket(d.ticket)),
      () => {
        const ticket: Ticket = {
          ticket_id: nextTicketId++,
          status: "Assigned",
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
      () => {
        // Two backend routes: a status-only change is the DEVELOPER's control
        // (PATCH /tickets/{id}/status), everything else is the AGENT's edit
        // (PATCH /tickets/{id}). The queue only ever sends { status }, so a
        // status-only payload routes to the developer-permitted endpoint.
        const keys = Object.keys(patch);
        const statusOnly = patch.status !== undefined && keys.length === 1;
        if (statusOnly) {
          return request<{ ticket: RawTicket }>(`/tickets/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: patch.status }),
          }).then((d) => adaptTicket(d.ticket));
        }
        return request<{ ticket: RawTicket }>(`/tickets/${id}`, {
          method: "PATCH",
          body: JSON.stringify(toUpdateBody(patch)),
        }).then((d) => adaptTicket(d.ticket));
      },
      () => {
        ticketsStore = ticketsStore.map((t) => (t.ticket_id === id ? { ...t, ...patch } : t));
        const updated = ticketsStore.find((t) => t.ticket_id === id);
        if (!updated) throw new ApiClientError(404, "NOT_FOUND", `Ticket ${id} not found.`);
        return delay(updated);
      },
    )(),

  getCategories: () =>
    endpoint<Category[]>(
      () => request<unknown>("/categories").then((d) => unwrapList<RawCategory>(d, "categories").map(adaptCategory)),
      () => delay(mockCategories),
    )(),

  // Assignee picker. The backend exposes developers at GET /developers (not
  // /employees); an optional ?designation= filter narrows the list.
  getEmployees: (role?: Role) =>
    endpoint<Employee[]>(
      () =>
        request<unknown>("/developers").then((d) =>
          unwrapList<RawEmployee>(d, "developers").map(adaptEmployee),
        ),
      () => delay(role ? mockEmployees.filter((e) => e.role === role) : mockEmployees),
    )(),
};
