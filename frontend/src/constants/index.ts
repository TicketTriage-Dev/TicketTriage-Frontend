import type { Priority, Role, TicketStatus } from "@/types";

/** Board columns, in display order. */
export const STATUSES: { value: TicketStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "doing", label: "In progress" },
  { value: "done", label: "Done" },
];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  todo: "To do",
  doing: "In progress",
  done: "Done",
};

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

/** Sidebar navigation items. */
export const NAV_ITEMS = [
  { href: "/board", label: "Board" },
  { href: "/queue", label: "My queue" },
  { href: "/team", label: "Team" },
  { href: "/settings", label: "Settings" },
] as const;

/** Where each role lands after login (and the guard's default redirect). */
export const HOME_BY_ROLE: Record<Role, string> = {
  agent: "/board",
  developer: "/queue",
};
