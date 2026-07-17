"use client";

import { useState, type FormEvent } from "react";
import { Alert, Form } from "react-bootstrap";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAppDispatch } from "@/store/hooks";
import { createTicket } from "@/store/ticketsSlice";
import { PRIORITIES } from "@/constants";
import type { Category, Employee, Priority } from "@/types";

interface CreateTicketPanelProps {
  show: boolean;
  onHide: () => void;
  categories: Category[];
  developers: Employee[];
}

const EMPTY = {
  name: "",
  description: "",
  category_id: "",
  priority: "normal" as Priority,
  assigned_to: "",
  time_to_complete: "",
};

/** Agent-only modal form to create a ticket (POST /tickets). */
export function CreateTicketPanel({ show, onHide, categories, developers }: CreateTicketPanelProps) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  // Required fields (backend requires title, category, and an assignee).
  const fieldErrors = {
    name: form.name.trim() ? "" : "Title is required.",
    category_id: form.category_id ? "" : "Category is required.",
    assigned_to: form.assigned_to ? "" : "Assignee is required.",
  };
  const isValid = !fieldErrors.name && !fieldErrors.category_id && !fieldErrors.assigned_to;

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function close() {
    setForm(EMPTY);
    setError(null);
    setShowErrors(false);
    onHide();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await dispatch(
      createTicket({
        name: form.name.trim(),
        description: form.description.trim(),
        category_id: Number(form.category_id),
        priority: form.priority,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
        time_to_complete: form.time_to_complete ? Math.trunc(Number(form.time_to_complete)) : null,
      }),
    );
    setSubmitting(false);
    if (createTicket.fulfilled.match(result)) {
      close();
    } else {
      setError((result.payload as string) ?? "Failed to create ticket.");
    }
  }

  return (
    <Modal
      show={show}
      onHide={close}
      title="New ticket"
      footer={
        <>
          <Button variant="outline-secondary" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            Create ticket
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

        <Form.Group className="mb-3" controlId="ticket-name">
          <Form.Label>Title</Form.Label>
          <Form.Control
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Short summary"
            isInvalid={showErrors && !!fieldErrors.name}
          />
          <Form.Control.Feedback type="invalid">{fieldErrors.name}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="ticket-description">
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
          <Form.Group className="flex-fill" controlId="ticket-category">
            <Form.Label>Category</Form.Label>
            <Form.Select
              value={form.category_id}
              onChange={(e) => set("category_id", e.target.value)}
              isInvalid={showErrors && !!fieldErrors.category_id}
            >
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.name}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{fieldErrors.category_id}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="flex-fill" controlId="ticket-priority">
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
          <Form.Group className="flex-fill" controlId="ticket-assignee">
            <Form.Label>Assignee</Form.Label>
            <Form.Select
              value={form.assigned_to}
              onChange={(e) => set("assigned_to", e.target.value)}
              isInvalid={showErrors && !!fieldErrors.assigned_to}
            >
              <option value="">Select…</option>
              {developers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.designation ? ` — ${d.designation}` : ""}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{fieldErrors.assigned_to}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="flex-fill" controlId="ticket-estimate">
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
