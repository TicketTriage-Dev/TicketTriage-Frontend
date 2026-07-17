"use client";

// /queue — the developer's own assigned tickets, with inline status controls.
// Guarded to the `developer` role. Ticket data comes from `useMyQueue` (the swap
// seam); category names are resolved via the API client. Assignee is always the
// signed-in developer (these are their tickets), so no employee lookup needed.
import { useEffect, useState } from "react";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { AppShell } from "@/components/layout/AppShell";
import { StatusControl } from "@/components/tickets/StatusControl";
import { TicketCard } from "@/components/tickets/TicketCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { useMyQueue } from "@/hooks/useMyQueue";
import { api } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";

function QueueBody() {
  const user = useAppSelector((s) => s.auth.user);
  const { tickets, loading, error, reload, updateStatus, updatingId } = useMyQueue();
  const [categories, setCategories] = useState<Record<number, string>>({});

  useEffect(() => {
    let active = true;
    api
      .getCategories()
      .then((cats) => {
        if (active) setCategories(Object.fromEntries(cats.map((c) => [c.category_id, c.name])));
      })
      .catch(() => {
        /* category tags are non-critical; ignore */
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <h1 style={{ color: "var(--navy)", fontSize: "1.5rem", marginBottom: "1.25rem" }}>My queue</h1>

      {loading ? (
        <LoadingState label="Loading your queue…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No tickets assigned"
          message="Tickets your team assigns to you will show up here."
        />
      ) : (
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {tickets.map((t) => (
            <TicketCard
              key={t.ticket_id}
              ticket={t}
              categoryName={categories[t.category_id]}
              assigneeName={user?.name ?? null}
              actions={
                <StatusControl
                  status={t.status}
                  disabled={updatingId === t.ticket_id}
                  onChange={(next) => {
                    void updateStatus(t.ticket_id, next);
                  }}
                />
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function QueuePage() {
  const user = useAppSelector((s) => s.auth.user);
  return (
    <RouteGuard roles={["developer"]}>
      <AppShell userName={user?.name}>
        <QueueBody />
      </AppShell>
    </RouteGuard>
  );
}
