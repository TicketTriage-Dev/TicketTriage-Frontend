// useMyQueue — data for the developer's own queue.
//
// Reads from the shared `ticketsSlice` (owned by Soham) so board & queue stay in
// sync off one store. This hook is the only place /queue touches ticket data —
// the returned shape is stable, so the page never changes when the source does.
import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchTickets,
  patchTicket,
  selectMyTickets,
  selectTicketsError,
  selectTicketsStatus,
} from "@/store/ticketsSlice";
import type { Ticket, TicketStatus } from "@/types";

export interface UseMyQueue {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  /** Re-fetch the ticket list. */
  reload: () => void;
  /** Change a ticket's status (persists via patchTicket → store updates on success). */
  updateStatus: (id: number, status: TicketStatus) => Promise<void>;
}

export function useMyQueue(): UseMyQueue {
  const dispatch = useAppDispatch();
  const tickets = useAppSelector(selectMyTickets);
  const status = useAppSelector(selectTicketsStatus);
  const error = useAppSelector(selectTicketsError);
  const userId = useAppSelector((s) => s.auth.user?.id);

  const reload = useCallback(() => {
    void dispatch(fetchTickets());
  }, [dispatch]);

  // Populate the shared store on mount / when the signed-in user changes.
  useEffect(() => {
    void dispatch(fetchTickets());
  }, [dispatch, userId]);

  const updateStatus = useCallback(
    async (id: number, next: TicketStatus) => {
      // Don't unwrap: a rejected patch resolves the dispatch without throwing, so
      // the caller's fire-and-forget onChange can't leak an unhandled rejection.
      // The store is the source of truth — on success `patchTicket.fulfilled`
      // upserts the ticket; on failure it stays as-is.
      await dispatch(patchTicket({ id, patch: { status: next } }));
    },
    [dispatch],
  );

  return {
    tickets,
    // "idle" = before the first fetch resolves → treat as loading.
    loading: status === "idle" || status === "loading",
    error,
    reload,
    updateStatus,
  };
}
