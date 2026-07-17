"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Alert, Form } from "react-bootstrap";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAppDispatch } from "@/store/hooks";
import { patchTicket } from "@/store/ticketsSlice";
import { PRIORITIES } from "@/constants";
import type { Category, Employee, Priority, Ticket } from "@/types";

interface EditTicketPanelProps {
  show: boolean;
  onHide: () => void;
  /** The ticket being edited; null when the modal is closed. */
  ticket: Ticket | null;
  categories: Category[];
  developers: Employee[];
}

const BLANK = {
  name: "",
  description: "",
  category_id: "",
  priority: "normal" as Priority,
  assigned_to: "",
  time_to_complete: "",
};

/**
 * Agent-only modal to edit a ticket (PATCH /tickets/{id}). Prefilled from the
 * ticket. Edits assignee / priority / category / title / description — NOT
 * status (that stays the developer's control on /queue).
 */
export function EditTicketPanel({ show, onHide, ticket, categories, developers }: EditTicketPanelProps) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState(BLANK);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill the form whenever the target ticket changes.
  useEffect(() => {
    if (ticket) {
      setForm({
        name: ticket.name,
        description: ticket.description,
        category_id: String(ticket.category_id),
        priority: ticket.priority,
        assigned_to: ticket.assigned_to != null ? String(ticket.assigned_to) : "",
        time_to_complete: ticket.time_to_complete != null ? String(ticket.time_to_complete) : "",
      });
      setError(null);
    }
  }, [ticket]);

  function set<K extends keyof typeof BLANK>(key: K, value: (typeof BLANK)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ticket) return;
    if (!form.name.trim() || !form.category_id) {
      setError("Title and category are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await dispatch(
      patchTicket({
        id: ticket.ticket_id,
        patch: {
          name: form.name.trim(),
          description: form.description.trim(),
          category_id: Number(form.category_id),
          priority: form.priority,
          assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
          time_to_complete: form.time_to_complete ? Math.trunc(Number(form.time_to_complete)) : null,
        },
      }),
    );
    setSubmitting(false);
    if (patchTicket.fulfilled.match(result)) {
      onHide();
    } else {
      setError((result.payload as string) ?? "Failed to update ticket.");
    }
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      title={ticket ? `Edit ticket #${ticket.ticket_id}` : "Edit ticket"}
      footer={
        <>
          <Button variant="outline-secondary" onClick={onHide} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            Save changes
          </Button>
        </>
      }
    >
      <Form onSubmit={handleSubmit}>
        {error && (
          <Alert variant="danger" className="py-2">
            {error}
          </Alert>
        )}

        <Form.Group className="mb-3" controlId="edit-name">
          <Form.Label>Title</Form.Label>
          <Form.Control
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Short summary"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="edit-description">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What needs doing?"
          />
        </Form.Group>

        <div className="d-flex gap-3 mb-3">
          <Form.Group className="flex-fill" controlId="edit-category">
            <Form.Label>Category</Form.Label>
            <Form.Select
              value={form.category_id}
              onChange={(e) => set("category_id", e.target.value)}
              required
            >
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="flex-fill" controlId="edit-priority">
            <Form.Label>Priority</Form.Label>
            <Form.Select
              value={form.priority}
              onChange={(e) => set("priority", e.target.value as Priority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>

        <div className="d-flex gap-3">
          <Form.Group className="flex-fill" controlId="edit-assignee">
            <Form.Label>Assignee</Form.Label>
            <Form.Select
              value={form.assigned_to}
              onChange={(e) => set("assigned_to", e.target.value)}
            >
              <option value="">Unassigned</option>
              {developers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.designation ? ` — ${d.designation}` : ""}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="flex-fill" controlId="edit-estimate">
            <Form.Label>Estimate (hours)</Form.Label>
            <Form.Control
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={form.time_to_complete}
              onChange={(e) => set("time_to_complete", e.target.value)}
              placeholder="e.g. 3"
            />
          </Form.Group>
        </div>
      </Form>
    </Modal>
  );
}
