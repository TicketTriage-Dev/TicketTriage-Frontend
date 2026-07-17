"use client";

// TicketCard — the shared ticket card used by BOTH the board (Soham) and the
// queue (Parinita). Presentational: it takes a Ticket plus the already-resolved
// category name and assignee name (the parent looks those up from IDs), so the
// card stays free of the data layer. An optional `actions` slot lets each caller
// drop in its own control (board -> Edit button, queue -> StatusControl)
// without changing this component.
import type { KeyboardEvent, ReactNode } from "react";
import { Card } from "react-bootstrap";
import type { Ticket } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { CategoryTag } from "./CategoryTag";
import { PriorityBolt } from "./PriorityBolt";

export interface TicketCardProps {
  /** The ticket to render. */
  ticket: Ticket;
  /** Category name resolved from ticket.category_id by the parent. */
  categoryName?: string;
  /** Assignee display name resolved from ticket.assigned_to; null/undefined = unassigned. */
  assigneeName?: string | null;
  /** Optional whole-card click (e.g. open a detail view). Makes the card keyboard-focusable. */
  onClick?: () => void;
  /** Optional control rendered in the footer — StatusControl (queue) or Edit button (board). */
  actions?: ReactNode;
}

/**
 * Render the estimate as a clear duration. The backend stores it as an integer
 * number of hours, so `3` → "3h"; any non-numeric legacy value (mock "1d") is
 * shown as-is. Returns null when there's nothing to show.
 */
function formatEstimate(value: string | number | null | undefined): string | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? `${n}h` : String(value);
}

export function TicketCard({ ticket, categoryName, assigneeName, onClick, actions }: TicketCardProps) {
  const clickable = typeof onClick === "function";
  const estimate = formatEstimate(ticket.time_to_complete);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <Card
      onClick={onClick}
      onKeyDown={clickable ? handleKeyDown : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      className="shadow-sm"
      style={{
        border: "1px solid var(--light-gray)",
        borderRadius: 10,
        cursor: clickable ? "pointer" : "default",
        background: "var(--surface)",
      }}
    >
      <Card.Body style={{ padding: "0.85rem 1rem" }}>
        {/* ID + priority */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span
            className="text-muted"
            style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.75rem" }}
          >
            #{ticket.ticket_id}
          </span>
          <PriorityBolt priority={ticket.priority} />
        </div>

        {/* Title */}
        <div style={{ fontWeight: 600, color: "var(--navy)", lineHeight: 1.3, marginBottom: 8 }}>
          {ticket.name}
        </div>

        {/* Category + estimate */}
        <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
          {categoryName && <CategoryTag name={categoryName} />}
          {estimate && (
            <span
              className="text-muted"
              title="Estimated time (hours)"
              style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "0.75rem" }}
            >
              ⏱ {estimate}
            </span>
          )}
        </div>

        {/* Assignee + actions slot */}
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            {assigneeName ? (
              <>
                <Avatar name={assigneeName} size={24} />
                <span style={{ fontSize: "0.8rem", color: "var(--navy)" }}>{assigneeName}</span>
              </>
            ) : (
              <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                Unassigned
              </span>
            )}
          </div>
          {actions && (
            // stop clicks on the control from triggering the card's onClick
            <div onClick={(e) => e.stopPropagation()}>{actions}</div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
