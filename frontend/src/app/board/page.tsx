"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-bootstrap";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { AppShell } from "@/components/layout/AppShell";
import { BoardColumn } from "@/components/board/BoardColumn";
import { CreateTicketPanel } from "@/components/board/CreateTicketPanel";
import { EditTicketPanel } from "@/components/board/EditTicketPanel";
import { Button } from "@/components/ui/Button";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchTickets,
  selectAllTickets,
  selectTicketsError,
  selectTicketsStatus,
} from "@/store/ticketsSlice";
import { api } from "@/lib/api";
import { STATUSES } from "@/constants";
import type { Category, Employee, Ticket } from "@/types";

function BoardInner() {
  const dispatch = useAppDispatch();
  const tickets = useAppSelector(selectAllTickets);
  const status = useAppSelector(selectTicketsStatus);
  const error = useAppSelector(selectTicketsError);
  const user = useAppSelector((s) => s.auth.user);

  const [categories, setCategories] = useState<Category[]>([]);
  const [developers, setDevelopers] = useState<Employee[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);

  const isAgent = user?.role === "agent";

  useEffect(() => {
    dispatch(fetchTickets());
    api.getCategories().then(setCategories).catch(() => setCategories([]));
    api.getEmployees("developer").then(setDevelopers).catch(() => setDevelopers([]));
  }, [dispatch]);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.category_id, c.name]));
    return (id: number) => map.get(id);
  }, [categories]);

  const assigneeName = useMemo(() => {
    const map = new Map(developers.map((d) => [d.id, d.name]));
    return (id: number | null) => (id == null ? null : (map.get(id) ?? null));
  }, [developers]);

  // First load (nothing to show yet) gets a full loading/error state; once the
  // board has data, a failed refetch only shows a non-blocking banner.
  const initialLoading = (status === "idle" || status === "loading") && tickets.length === 0;
  const initialError = status === "failed" && tickets.length === 0;

  return (
    <AppShell userName={user?.name}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 style={{ fontFamily: "var(--font-space-grotesk)", color: "var(--navy)", fontSize: "1.4rem", margin: 0 }}>
          Triage board
        </h1>
        {isAgent && (
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            + New ticket
          </Button>
        )}
      </div>

      {error && tickets.length > 0 && <Alert variant="danger" className="py-2">{error}</Alert>}

      {initialLoading ? (
        <LoadingState label="Loading the board…" />
      ) : initialError ? (
        <ErrorState message={error ?? undefined} onRetry={() => dispatch(fetchTickets())} />
      ) : (
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          {STATUSES.map((col) => (
            <BoardColumn
              key={col.value}
              label={col.label}
              tickets={tickets.filter((t) => t.status === col.value)}
              categoryName={categoryName}
              assigneeName={assigneeName}
              renderActions={
                isAgent
                  ? (t) => (
                      <Button variant="outline-secondary" size="sm" onClick={() => setEditing(t)}>
                        Edit
                      </Button>
                    )
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {isAgent && (
        <>
          <CreateTicketPanel
            show={showCreate}
            onHide={() => setShowCreate(false)}
            categories={categories}
            developers={developers}
          />
          <EditTicketPanel
            show={editing != null}
            ticket={editing}
            onHide={() => setEditing(null)}
            categories={categories}
            developers={developers}
          />
        </>
      )}
    </AppShell>
  );
}

export default function BoardPage() {
  return (
    <RouteGuard>
      <BoardInner />
    </RouteGuard>
  );
}
