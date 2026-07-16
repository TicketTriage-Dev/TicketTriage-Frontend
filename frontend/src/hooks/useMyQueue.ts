// useMyQueue — data for the developer's own queue.
//
// SWAP SEAM: this is the ONE place that reads ticket data. Today it calls the
// `api.*` methods directly (mock-backed). When Soham's `ticketsSlice` lands,
// swap the body to `useAppSelector(selectMyTickets)` + `dispatch(fetchTickets)`
// + `dispatch(patchTicket(...))` — the returned shape stays the same, so
// `/queue` doesn't change.
import { useCallback, useEffect, useState } from "react";
import { api, ApiClientError } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import type { Ticket, TicketStatus } from "@/types";

export interface UseMyQueue {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  /** Re-fetch the queue. */
  reload: () => void;
  /** Optimistically change a ticket's status; rolls back and re-throws on failure. */
  updateStatus: (id: number, status: TicketStatus) => Promise<void>;
}

export function useMyQueue(): UseMyQueue {
  const userId = useAppSelector((s) => s.auth.user?.id);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTickets(await api.getMyTickets());
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load your tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever the signed-in user changes (and on mount).
  useEffect(() => {
    void load();
  }, [load, userId]);

  const updateStatus = useCallback(async (id: number, status: TicketStatus) => {
    let rollback: Ticket[] = [];
    setTickets((prev) => {
      rollback = prev;
      return prev.map((t) => (t.ticket_id === id ? { ...t, status } : t));
    });
    try {
      await api.updateTicket(id, { status });
    } catch (err) {
      setTickets(rollback); // revert the optimistic change
      throw err;
    }
  }, []);

  return { tickets, loading, error, reload: load, updateStatus };
}