// Tickets slice — STUB (owned by Soham; read by both board & queue).
// Fill in fetchTickets/createTicket/patchTicket thunks and selectors
// (e.g. selectByStatus, selectMyTickets) here. Agree selector names with Parinita.
import { createSlice } from "@reduxjs/toolkit";
import type { Ticket } from "@/types";

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

const ticketsSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    // TODO(soham): set tickets, upsert one, etc.
  },
});

export default ticketsSlice.reducer;
