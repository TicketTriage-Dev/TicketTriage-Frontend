// Tickets slice (owned by Soham; read by board & queue).
// fetch / create / patch thunks + selectors. Board groups by status;
// queue filters by assignee via selectMyTickets.
import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import { api, ApiClientError } from "@/lib/api";
import type {
  CreateTicketInput,
  Ticket,
  TicketStatus,
  UpdateTicketInput,
} from "@/types";
import type { RootState } from "./index";

export interface TicketsState {
  items: Ticket[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: TicketsState = {
  items: [],
  status: "idle",
  error: null,
};

function errMessage(err: unknown, fallback: string): string {
  return err instanceof ApiClientError ? err.message : fallback;
}

export const fetchTickets = createAsyncThunk<
  Ticket[],
  { status?: TicketStatus; assigned_to?: number } | undefined,
  { state: RootState; rejectValue: string }
>("tickets/fetch", async (filters, { getState, rejectWithValue }) => {
  try {
    // Developers may only read their own queue (GET /tickets/mine); the full
    // board (GET /tickets) is agent-only. Route by role so both personas share
    // this one thunk without hitting a 403.
    const role = getState().auth.user?.role;
    return role === "developer" ? await api.getMyTickets() : await api.getTickets(filters);
  } catch (err) {
    return rejectWithValue(errMessage(err, "Failed to load tickets."));
  }
});

export const createTicket = createAsyncThunk<Ticket, CreateTicketInput, { rejectValue: string }>(
  "tickets/create",
  async (input, { rejectWithValue }) => {
    try {
      return await api.createTicket(input);
    } catch (err) {
      return rejectWithValue(errMessage(err, "Failed to create ticket."));
    }
  },
);

export const patchTicket = createAsyncThunk<
  Ticket,
  { id: number; patch: UpdateTicketInput },
  { rejectValue: string }
>("tickets/patch", async ({ id, patch }, { rejectWithValue }) => {
  try {
    return await api.updateTicket(id, patch);
  } catch (err) {
    return rejectWithValue(errMessage(err, "Failed to update ticket."));
  }
});

function upsert(items: Ticket[], ticket: Ticket): Ticket[] {
  const idx = items.findIndex((t) => t.ticket_id === ticket.ticket_id);
  if (idx === -1) return [ticket, ...items];
  const next = items.slice();
  next[idx] = ticket;
  return next;
}

const ticketsSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to load tickets.";
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.items = upsert(state.items, action.payload);
      })
      .addCase(patchTicket.fulfilled, (state, action) => {
        state.items = upsert(state.items, action.payload);
      });
  },
});

export default ticketsSlice.reducer;

// --- Selectors --------------------------------------------------------------
export const selectAllTickets = (s: RootState) => s.tickets.items;
export const selectTicketsStatus = (s: RootState) => s.tickets.status;
export const selectTicketsError = (s: RootState) => s.tickets.error;

/**
 * Tickets in a given column (board). Agreed signature: (state, status).
 * Memoized so it returns a stable array reference (avoids rerender churn).
 */
export const selectByStatus = createSelector(
  [(s: RootState) => s.tickets.items, (_s: RootState, status: TicketStatus) => status],
  (items, status) => items.filter((t) => t.status === status),
);

/**
 * The current developer's own tickets (for /queue). Cross-slice: reads the
 * logged-in user from auth, so callers don't pass an id. Memoized for a stable ref.
 */
export const selectMyTickets = createSelector(
  [(s: RootState) => s.tickets.items, (s: RootState) => s.auth.user?.id],
  (items, userId) => (userId == null ? [] : items.filter((t) => t.assigned_to === userId)),
);
