"use client";

import type { ReactNode } from "react";
import { TicketCard } from "@/components/tickets/TicketCard";
import type { Ticket } from "@/types";

interface BoardColumnProps {
  label: string;
  tickets: Ticket[];
  categoryName: (id: number) => string | undefined;
  assigneeName: (id: number | null) => string | null;
  /** Per-ticket control rendered in the card footer (e.g. AssigneeDropdown). */
  renderActions?: (ticket: Ticket) => ReactNode;
}

/** One Kanban column: a titled, scrollable stack of TicketCards. */
export function BoardColumn({
  label,
  tickets,
  categoryName,
  assigneeName,
  renderActions,
}: BoardColumnProps) {
  return (
    <section
      style={{
        flex: 1,
        minWidth: 260,
        background: "var(--light-gray)",
        borderRadius: 12,
        padding: "0.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <header className="d-flex align-items-center justify-content-between px-1">
        <span style={{ fontWeight: 600, color: "var(--navy)" }}>{label}</span>
        <span
          style={{
            fontSize: "0.8rem",
            color: "var(--navy)",
            background: "var(--surface)",
            borderRadius: 999,
            padding: "1px 9px",
            fontFamily: "var(--font-jetbrains-mono)",
          }}
        >
          {tickets.length}
        </span>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {tickets.length === 0 ? (
          <p className="text-muted text-center m-0 py-4" style={{ fontSize: "0.85rem" }}>
            No tickets
          </p>
        ) : (
          tickets.map((t) => (
            <TicketCard
              key={t.ticket_id}
              ticket={t}
              categoryName={categoryName(t.category_id)}
              assigneeName={assigneeName(t.assigned_to)}
              actions={renderActions?.(t)}
            />
          ))
        )}
      </div>
    </section>
  );
}
