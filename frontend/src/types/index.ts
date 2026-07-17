// Shared domain types. Auth shapes mirror the real backend (see CLAUDE.md §5);
// ticket/category shapes track the data model until those endpoints are finalized.

export type Role = "agent" | "developer";
export type TicketStatus = "Assigned" | "In Progress" | "Done";
export type Priority = "normal" | "urgent" | "severe";

/**
 * A person in the system. The backend's employee/user record.
 * Fields match the real auth payload: id, name, email, role, designation.
 */
export interface Employee {
  id: number;
  name: string;
  email: string;
  role: Role;
  /** Developer's role title (e.g. "Frontend Dev"); null for agents (backend contract). */
  designation: string | null;
  created_at?: string;
}

/** The authenticated user (same shape as Employee). */
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
  assigned_to: number | null; // Employee.id
  time_to_complete?: string | number | null;
  created_at: string;
  /**
   * Display names the backend sends inline on each ticket. Preferred over an
   * id→name lookup (which can miss if the reference list is incomplete). Absent
   * on mock data, so callers fall back to their resolver maps.
   */
  category_name?: string | null;
  assignee_name?: string | null;
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

/**
 * Fields that may be updated via PATCH /tickets/{id}. All optional — send only
 * what changed. `status` is the developer's control (queue); the agent's Edit
 * modal sends the rest.
 */
export interface UpdateTicketInput {
  name?: string;
  description?: string;
  category_id?: number;
  status?: TicketStatus;
  priority?: Priority;
  assigned_to?: number | null;
  time_to_complete?: string | number | null;
}

/** Credentials for POST /auth/login. */
export interface LoginInput {
  email: string;
  password: string;
}

/** Payload for POST /auth/register. */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  designation: string;
}

/**
 * Standard backend JSON envelope (CLAUDE.md §5):
 *   { "status": 200, "msg": "OK", "data": { ... } }
 * `data` is null on messages that carry no payload (logout, refresh).
 */
export interface ApiEnvelope<T> {
  status: number;
  msg: string;
  data: T;
}
