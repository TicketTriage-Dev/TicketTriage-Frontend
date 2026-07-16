// Auth slice (owned by Soham). Cookie-based sessions — no token is stored in JS;
// "logged in" simply means `user` is set. login/logout/restoreSession thunks.
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { api, ApiClientError } from "@/lib/api";
import type { LoginInput, User } from "@/types";

export interface AuthState {
  user: User | null;
  /** idle → before any check; loading → login in flight; ready → session check done. */
  status: "idle" | "loading" | "authenticated" | "unauthenticated" | "error";
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
};

/** Log in with email + password. The backend sets the auth cookies. */
export const login = createAsyncThunk<User, LoginInput, { rejectValue: string }>(
  "auth/login",
  async (input, { rejectWithValue }) => {
    try {
      return await api.login(input);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Login failed. Try again.";
      return rejectWithValue(message);
    }
  },
);

/** Restore the session on app load (cookie is sent automatically; refreshes if needed). */
export const restoreSession = createAsyncThunk<User | null>("auth/restore", async () => {
  try {
    return await api.me();
  } catch {
    return null; // no valid session
  }
});

/** Clear the session (server clears cookies). */
export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await api.logout();
  } catch {
    // ignore — we clear local state regardless
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.status = "authenticated";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "Login failed.";
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = action.payload ? "authenticated" : "unauthenticated";
      })
      .addCase(restoreSession.rejected, (state) => {
        state.status = "unauthenticated";
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = "unauthenticated";
        state.error = null;
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
