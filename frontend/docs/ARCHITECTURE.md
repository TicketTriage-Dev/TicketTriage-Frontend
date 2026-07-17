# TicketMatchr Frontend — Architecture

> A file-by-file map of the frontend: what each piece is and why it exists.
> For scope, palette, and the API contract see the root [`CLAUDE.md`](../../CLAUDE.md);
> for the who-builds-what split see [`FRONTEND_WORKPLAN.md`](../../FRONTEND_WORKPLAN.md).

**Stack:** Next.js (App Router) + TypeScript · Redux Toolkit · react-bootstrap (themed to a
navy/gold palette) · Storybook · a typed API client with a mock-data fallback.

---

## How data flows

```
Component → Redux thunk (slice) → api.ts → { real backend  |  mock layer }
                                              (cookies)        (mockData.ts)
```

- Components never call `fetch` directly — they dispatch thunks or read the store.
- `lib/api.ts` is the ONLY place with network logic. It picks the real backend or the mock
  layer based on `NEXT_PUBLIC_USE_MOCK`, so nothing else changes when the backend comes online.
- Auth is **cookie-based** (httpOnly `access_token` + `refresh_token`); no token is kept in JS.
  The client sets `credentials:"include"`; the backend must send CORS with
  `Access-Control-Allow-Credentials: true` and set cookies `SameSite=None; Secure` for
  cross-origin dev to work.

---

## File-by-file

### Config (`frontend/`)

| File | What / why |
|---|---|
| `package.json` | Dependencies + scripts (`dev`, `build`, `storybook`). |
| `tsconfig.json` | TypeScript config; defines the `@/*` → `src/*` import alias. |
| `next.config.ts` | Next.js config (React Compiler on). |
| `.env.local` | **Gitignored.** `NEXT_PUBLIC_API_URL` (backend base) + `NEXT_PUBLIC_USE_MOCK`. |
| `.env.example` | Committed template of the env vars for teammates to copy. |

### Routing (`src/app/`)

| File | What / why |
|---|---|
| `layout.tsx` | Root layout. Loads Bootstrap CSS + `theme.scss`, sets up fonts, mounts the Redux `<Providers>`. |
| `page.tsx` | `/` → redirects to `/login`. |
| `login/page.tsx` | `/login` — modern two-column `AuthLayout` + `LoginForm`. |
| `register/page.tsx` | `/register` — `AuthLayout` + `RegisterForm` (name/email/password + designation). |
| `board/page.tsx` | `/board` — Kanban triage board (3 columns). Agents create + edit/assign; everyone views. |
| `queue/page.tsx` | `/queue` — developer's own tickets + status controls. |
| `team/page.tsx`, `settings/page.tsx` | Placeholder pages (guarded shell). |

### Types & constants

| File | What / why |
|---|---|
| `types/index.ts` | Shared types: `Employee`/`User`, `Category`, `Ticket`, input types, `Role`/`TicketStatus`/`Priority`, `ApiEnvelope<T>`. |
| `constants/index.ts` | `STATUSES`, `PRIORITIES`/`PRIORITY_BOLTS`, `DESIGNATIONS` (+ `Designation` type — must match backend), `NAV_ITEMS`, `HOME_BY_ROLE`. |

### Data layer (`src/lib/`)

| File | What / why |
|---|---|
| `api.ts` | The single typed API client: cookie auth (`credentials:"include"`), `{status,msg,data}` parsing, field-level error surfacing, and the **refresh interceptor** (401 → refresh once → replay; single-flight guard). `endpoint(real, mock)` selects transport. **Also holds the backend↔frontend ADAPTER** (`adaptTicket`/`adaptCategory`/`adaptEmployee`, `to/fromPriority`, `unwrapList`): the real backend speaks `id`/`title`/`assignee_id` + capitalized priority + nested list envelopes, and this is the one place that maps it to our types — so nothing downstream changes. Ticket/category/developer routes are **live** (cutover 2026-07-17). |
| `mockData.ts` | GuestMatchr fixtures (employees, categories, 8 tickets) — the `NEXT_PUBLIC_USE_MOCK=true` fallback so the app runs with no backend. |

### State (`src/store/`)

| File | What / why |
|---|---|
| `index.ts` | Configures the store, combines slices, exports `RootState`/`AppDispatch`. |
| `hooks.ts` | Typed `useAppDispatch` / `useAppSelector`. |
| `Providers.tsx` | Client wrapper for the Redux `<Provider>`. |
| `authSlice.ts` | `login` / `register` (registers then auto-logs-in) / `logout` / `restoreSession` thunks. Session = `user` set. |
| `ticketsSlice.ts` | `fetchTickets` / `createTicket` / `patchTicket` thunks + **memoized** selectors (`selectByStatus`, `selectMyTickets`). |

### Hooks (`src/hooks/`)

| File | What / why |
|---|---|
| `useMyQueue.ts` | Queue data seam — current user + their tickets via `ticketsSlice` (`selectMyTickets` / `patchTicket`). |

### Styling (`src/styles/`)

| File | What / why |
|---|---|
| `theme.scss` | Retheme of Bootstrap to the navy/gold palette via CSS variables; fonts; button recoloring. |

### Components

| Area | Files |
|---|---|
| `layout/` | `AppShell` (frame + logout wiring), `Sidebar` (nav), `TopBar` (search, avatar, **Log out**). |
| `ui/` | `Avatar`, `Button` (+`loading`), `Badge`, `Modal`, `States` (Loading/Empty/Error). |
| `tickets/` | `PriorityBolt`, `CategoryTag`, `TicketCard` (shared; `actions` slot), `StatusControl` (queue). |
| `board/` | `BoardColumn`, `CreateTicketPanel` (POST), `EditTicketPanel` (agent Edit → PATCH; title/desc/category/priority/assignee). |
| `auth/` | `AuthLayout` (branded two-column shell), `LoginForm`, `RegisterForm`, `RouteGuard`. |

Each reusable `ui/` and `tickets/` component has a colocated `*.stories.tsx`.

### Storybook (`.storybook/`)

`main.ts` (story globs + addons) and `preview.tsx` (loads Bootstrap + theme so stories render on-brand).

---

## Notes

- Interactive components are client components (`"use client"`).
- Import shared components from `@/components/...`; never re-create a button/card/avatar.
- One file = one owner (see the workplan). Shared foundation (`types`, `lib`, `store`) is coordinated.
- Add a new endpoint in `api.ts` only — pair a real call with a mock in `endpoint(real, mock)`.
- `DESIGNATIONS` must match the backend's whitelist exactly (registration validates against it) —
  candidate to make data-driven via a future `GET /designations`.
- Optional cleanup still available: the Vitest/Playwright test rig (`vitest.config.ts`,
  `vitest.shims.d.ts` + related devDeps) is unused for this project.
