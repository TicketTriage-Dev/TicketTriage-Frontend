"use client";

import { useState } from "react";
import { Form } from "react-bootstrap";
import { useAppDispatch } from "@/store/hooks";
import { patchTicket } from "@/store/ticketsSlice";
import type { Employee } from "@/types";

interface AssigneeDropdownProps {
  ticketId: number;
  assignedTo: number | null;
  developers: Employee[];
}

/** Agent control: reassign a ticket's developer via PATCH. */
export function AssigneeDropdown({ ticketId, assignedTo, developers }: AssigneeDropdownProps) {
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const assigned_to = value === "" ? null : Number(value);
    setSaving(true);
    try {
      await dispatch(patchTicket({ id: ticketId, patch: { assigned_to } }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Form.Select
      size="sm"
      value={assignedTo ?? ""}
      onChange={handleChange}
      disabled={saving}
      aria-label="Assign developer"
      style={{ maxWidth: 150, fontSize: "0.8rem" }}
    >
      <option value="">Unassigned</option>
      {developers.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </Form.Select>
  );
}
