// Shared domain types. Auth shapes mirror the real backend (see CLAUDE.md §5);
// ticket/category shapes track the data model until those endpoints are finalized.

export type Role = "agent" | "developer";
export type TicketStatus = "todo" | "doing" | "done";
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
  designation: string;
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

/** Fields that may be updated via PATCH. */
export interface UpdateTicketInput {
  status?: TicketStatus;
  priority?: Priority;
  assigned_to?: number | null;
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
