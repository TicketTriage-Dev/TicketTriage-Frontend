// Auth slice — STUB (owned by Soham).
// Fill in login/logout thunks, token persistence, and current-user state here.
import { createSlice } from "@reduxjs/toolkit";
import type { User } from "@/types";

export interface AuthState {
  user: User | null;
  token: string | null;
  status: "idle" | "loading" | "authenticated" | "error";
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // TODO(soham): setCredentials, logout, etc.
  },
});

export default authSlice.reducer;
