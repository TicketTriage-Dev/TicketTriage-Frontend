"use client";

// StatusControl — lets a developer move a ticket across statuses (To do →
// In progress → Done). Presentational + controlled: it renders the current
// `status` and calls `onChange` with the next one. No store access — the parent
// (the queue) owns the update, so this is reusable and easy to story.
import { Form } from "react-bootstrap";
import type { TicketStatus } from "@/types";
import { STATUSES } from "@/constants";

export interface StatusControlProps {
  /** Current status (controlled). */
  status: TicketStatus;
  /** Called with the newly-selected status. */
  onChange: (next: TicketStatus) => void;
  /** Disable while an update is in flight. */
  disabled?: boolean;
  size?: "sm" | "lg";
}

export function StatusControl({ status, onChange, disabled, size = "sm" }: StatusControlProps) {
  return (
    <Form.Select
      size={size}
      value={status}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as TicketStatus)}
      aria-label="Change ticket status"
      style={{ width: "auto", minWidth: 132, fontSize: "0.8rem" }}
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </Form.Select>
  );
}
