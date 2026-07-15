// Shared domain types. Mirror of the backend data model (CLAUDE.md §4).

export type Role = "agent" | "developer";
export type TicketStatus = "todo" | "doing" | "done";
export type Priority = "normal" | "urgent" | "severe";

export interface Employee {
  employee_id: number;
  username: string;
  email: string;
  role: Role;
}

/** The authenticated user (employee without the password hash). */
export type User = Employee;

export interface Category {
  category_id: number;
  name: string;
}

export interface Ticket {
  ticket_id: number;
  name: string;
  description: string;
  category_id: number;
  status: TicketStatus;
  priority: Priority;
  assigned_to: number | null;
  time_to_complete?: string | number | null;
  created_at: string;
}

/** Payload the agent submits to create a ticket. */
export interface CreateTicketInput {
  name: string;
  description: string;
  category_id: number;
  priority: Priority;
  assigned_to?: number | null;
  time_to_complete?: string | number | null;
}

/** Fields that may be updated via PATCH /api/tickets/{id}. */
export interface UpdateTicketInput {
  status?: TicketStatus;
  priority?: Priority;
  assigned_to?: number | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

/** Standard JSON envelope (CLAUDE.md §5). */
export interface ApiError {
  code: string;
  message: string;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };
