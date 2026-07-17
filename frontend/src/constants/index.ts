import type { Priority, Role, TicketStatus } from "@/types";

/** Board columns, in display order. */
export const STATUSES: { value: TicketStatus; label: string }[] = [
  { value: "Assigned", label: "To do" },
  { value: "In Progress", label: "In progress" },
  { value: "Done", label: "Done" },
];

/** Priorities, with the bolt count that drives the priority-as-bolt UI. */
export const PRIORITIES: { value: Priority; label: string; bolts: number }[] = [
  { value: "normal", label: "Normal", bolts: 1 },
  { value: "urgent", label: "Urgent", bolts: 2 },
  { value: "severe", label: "Severe", bolts: 3 },
];

export const PRIORITY_BOLTS: Record<Priority, number> = {
  normal: 1,
  urgent: 2,
  severe: 3,
};

/** Fallback category list; the live list comes from GET /api/categories. */
export const DEFAULT_CATEGORIES = [
  "Backend",
  "Frontend",
  "Auth",
  "Database",
  "Infra",
] as const;

/**
 * Predefined developer designations (team decision 2026-07-16 — no more free text).
 * Registration picks from this list; the assignee picker shows it beside the name.
 * Keep in sync with the backend's designation list. Swap to a GET /designations
 * fetch later if it becomes data-driven (like categories).
 */
export const DESIGNATIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile Developer",
  "DevOps Engineer",
  "QA Engineer",
  "Data Engineer",
  "Machine Learning Engineer",
  "Security Engineer",
  "Site Reliability Engineer",
] as const;

export type Designation = (typeof DESIGNATIONS)[number];

/**
 * Sidebar navigation items. `roles` gates visibility — "My queue" is a
 * developer's personal queue (agents have none, and `/queue` is role-guarded),
 * so it only shows for developers. The board is a shared view.
 */
export const NAV_ITEMS: { href: string; label: string; roles: Role[] }[] = [
  { href: "/board", label: "Board", roles: ["agent", "developer"] },
  { href: "/queue", label: "My queue", roles: ["developer"] },
  { href: "/team", label: "Team", roles: ["agent"] },
  { href: "/settings", label: "Settings", roles: ["agent", "developer"] },
];

/** Where each role lands after login (and the guard's default redirect). */
export const HOME_BY_ROLE: Record<Role, string> = {
  agent: "/board",
  developer: "/queue",
};
