# TicketMatchr Frontend — Architecture (detailed)

> The in-depth engineering reference for the frontend: the stack, how data flows,
> how auth works, the API/adapter seam, the state model, every route and component,
> the backend contract, known runtime behaviors, and deployment.
>
> For product scope, palette, and the canonical API contract see the root
> [`CLAUDE.md`](../../CLAUDE.md); for who-builds-what see
> [`FRONTEND_WORKPLAN.md`](../../FRONTEND_WORKPLAN.md).

---

## 1. What this is

A small Jira-style internal ticket-triage tool. Two personas share one board:

- **Agent** — creates tickets, sets category/priority, assigns a developer, edits tickets, sees the team roster.
- **Developer** — sees the tickets assigned to them and moves them across statuses.

Tickets move through three statuses: **To do → In progress → Done** (stored as `Assigned` / `In Progress` / `Done`). This repo is the **frontend only**; the PHP/MySQL backend is a separate repo, documented here so the client matches it.

---

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16 (App Router)** + React 19 | React Compiler on (`next.config.ts`). |
| Language | **TypeScript** (strict) | `@/*` → `src/*` alias (`tsconfig.json`). |
| State | **Redux Toolkit** + react-redux | One slice per domain (`authSlice`, `ticketsSlice`), typed hooks. |
| UI | **react-bootstrap** + Bootstrap 5 CSS | Custom navy/gold theme via SCSS. Tailwind was removed. |
| Styling | **Sass** (`theme.scss`) + inline styles | CSS variables for palette/fonts. |
| Data | Typed **API client** (`lib/api.ts`) + **mock layer** (`lib/mockData.ts`) | One network seam; mock fallback via env flag. |
| Workshop | **Storybook 10** | Every reusable `ui/` + `tickets/` component has a story. |

Interactive components are client components (`"use client"`). The app is effectively a client-rendered SPA behind the App Router — pages fetch on the client and guard/redirect on the client.

---

## 3. How data flows

```
Component ──dispatch──► Redux thunk (slice) ──► api.ts ──► ┌─ real backend (fetch + cookies)
   ▲                         │                   │         └─ mock layer (mockData.ts)
   └──── useAppSelector ◄─────┘                   │
                                                  └─ adapter: backend shape ⇄ frontend types
Some pages (Team, category lookups) call api.ts directly for one-off reads
that don't belong in the shared store.
```

- Components never call `fetch`. They either dispatch thunks / read the store (tickets, auth) or call `api.*` for local one-off data (categories, developers, team roster).
- **`lib/api.ts` is the ONLY place with network logic.** It selects the real backend or the mock layer based on `NEXT_PUBLIC_USE_MOCK`, parses the envelope, runs the refresh interceptor, and **adapts** the backend shape to our types — so nothing else in the app ever sees the backend's field names.

---

## 4. Auth & session lifecycle

Auth is **cookie-based**. The backend sets two httpOnly cookies — `access_token` (~15 min) and `refresh_token` (~7 days). **No token is ever stored in JS**; "logged in" means the Redux `auth.user` is set. The client sends `credentials: "include"` on every request.

**Flows (`authSlice` thunks):**
- `login(email, password)` → backend sets cookies → returns `user`.
- `register(name, email, password, designation)` → registers, then immediately logs in (register doesn't set cookies), so a session is established → returns `user`.
- `restoreSession()` → on app load calls `GET /auth/me`; if the access token expired, the refresh interceptor silently rotates it. Returns `user` or `null`.
- `logout()` → `POST /auth/logout` (server clears cookies); local state cleared regardless of the response.

**`auth.status` state machine:** `idle` → (no check yet) → `loading` (login/register in flight) → `authenticated` / `unauthenticated` / `error`. `restoreSession` resolves to `authenticated` or `unauthenticated`.

**Refresh interceptor (`lib/api.ts`)** — the resilience core:
- On any `401` (except on `/auth/refresh` itself, and except a replay), the client calls `POST /auth/refresh` **once**, then **replays** the original request.
- A **single-flight guard** (`refreshInFlight`) means concurrent 401s trigger only one refresh; all wait on the same promise.
- If the refresh itself fails, the session is dead → an `ApiClientError(401)` surfaces → the guard redirects to `/login`. The `isRetry` flag prevents infinite loops.

**Route protection (`components/auth/RouteGuard`):**
- On mount (when `status === "idle"`) it dispatches `restoreSession()`.
- `unauthenticated` → `router.replace("/login")`.
- If `roles` is passed and the user's role isn't in it → `router.replace(HOME_BY_ROLE[user.role])`.
- Until allowed, it renders a centered spinner (never the protected content).

---

## 5. The API client & adapter (`lib/api.ts`) — the network seam

This is the most important file. Everything network-related lives here.

### 5.1 Transport selection
```
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";   // anything but "false" → mock
endpoint(real, mock)  // returns real() or mock() based on USE_MOCK — the one branch point
```

### 5.2 `request<T>()` — the real fetch wrapper
- Prepends `NEXT_PUBLIC_API_URL`, sends `credentials:"include"` + JSON headers.
- Runs the 401 → refresh-once → replay logic (see §4).
- Parses the `{ status, msg, data }` envelope. Throws `ApiClientError(status, code, message)` on a non-OK status or a `status >= 400` in the body.
- **Field-level errors:** if the body carries `data.errors` (e.g. `{ description: "The Description minimum is 2" }`), it joins them into the thrown message so the UI shows something actionable instead of a generic "Validation failed".

### 5.3 The adapter — backend shape ⇄ frontend types
The backend and our types deliberately differ; the adapter is the only translator.

| Concept | Backend (wire) | Frontend (our types) |
|---|---|---|
| Ticket id | `id` | `ticket_id` |
| Title | `title` | `name` |
| Assignee id | `assignee_id` | `assigned_to` |
| Priority | `Normal` / `Urgent` / `Severe` | `normal` / `urgent` / `severe` |
| Status | `Assigned` / `In Progress` / `Done` | **same** (no mapping) |
| Category | `{ id, name }` | `{ category_id, name }` |
| Lists | nested: `data.tickets`, `data.categories`, `data.developers` | plain arrays |
| Inline names | `category_name`, `assignee_name`, `reporter_name` on each ticket | carried through as optional `category_name` / `assignee_name` |

Helpers:
- `adaptTicket` / `adaptCategory` / `adaptEmployee` — map one record. `adaptEmployee` defaults `email` and `role` because `/developers` objects only carry `{id, name, designation}`.
- `toPriority` / `fromPriority` — casing conversion both directions.
- `unwrapList(data, key)` — pulls the array out of `{ [key]: [...] }`, tolerating a bare array (defensive against envelope differences).
- `toUpdateBody(patch)` — maps our `UpdateTicketInput` field names to the backend PATCH body (`name→title`, `assigned_to→assignee_id`, capitalized priority, plus `time_to_complete`).

**Why carry inline names?** The board resolves each ticket's category/assignee name. It *prefers* the ticket's inline `category_name`/`assignee_name` and only falls back to an id→name lookup for mock data. This fixed a real bug where the board showed "Unassigned" for a ticket the developer clearly had — the id→name lookup against a separately-fetched `/developers` list was fragile; the inline name is authoritative.

### 5.4 Endpoint map

| `api.*` method | Real call | Role | Returns |
|---|---|---|---|
| `login` | `POST /auth/login` | — | `User` |
| `register` | `POST /auth/register` | — | `User` (via register-then-login) |
| `logout` | `POST /auth/logout` | — | — |
| `me` | `GET /auth/me` | — | `User` |
| `refresh` | `POST /auth/refresh` | — | rotates cookies |
| `getTickets(filters?)` | `GET /tickets?status=&priority=&assigned_to=` | agent | `Ticket[]` (from `data.tickets`) |
| `getMyTickets()` | `GET /tickets/mine` | developer | `Ticket[]` |
| `createTicket(input)` | `POST /tickets` | agent | `Ticket` (from `data.ticket`) |
| `updateTicket(id, patch)` | `PATCH /tickets/{id}` **or** `PATCH /tickets/{id}/status` | agent / developer | `Ticket` |
| `getCategories()` | `GET /categories` | any | `Category[]` |
| `getEmployees(role?)` | `GET /developers` | agent | `Employee[]` |

**Status vs edit routing** — `updateTicket` inspects the patch: a **status-only** payload (`{ status }`, the developer's queue control) routes to `PATCH /tickets/{id}/status` (developer-permitted); anything else (the agent Edit modal) routes to `PATCH /tickets/{id}`. Callers don't choose — the seam does.

**Not consumed from the backend (by choice):** `GET /designations` (we use the `DESIGNATIONS` constant) and `GET /developers/me/workload` (it's "me"-only, so the agent Team page computes per-developer workload client-side from `GET /tickets`).

---

## 6. State management (`src/store/`)

`configureStore` combines two reducers: `auth` and `tickets`. `RootState` / `AppDispatch` are exported; `hooks.ts` gives typed `useAppSelector` / `useAppDispatch`; `Providers.tsx` wraps the tree in the Redux `<Provider>` (mounted in `app/layout.tsx`).

### `authSlice` — see §4. State: `{ user, status, error }`.

### `ticketsSlice` — the shared ticket store read by BOTH board and queue.
State: `{ items: Ticket[], status: "idle"|"loading"|"succeeded"|"failed", error }`.

Thunks:
- `fetchTickets(filters?)` — **role-aware**: reads `auth.user.role` from `getState()`; developers call `getMyTickets()`, agents call `getTickets(filters)`. This is why one thunk serves both personas without a 403.
- `createTicket(input)` — POST; on success `upsert`s into `items`.
- `patchTicket({ id, patch })` — PATCH (status route or edit route, decided in `api.ts`); on success `upsert`s.

`upsert(items, ticket)` replaces by `ticket_id` or prepends. Selectors:
- `selectAllTickets` / `selectTicketsStatus` / `selectTicketsError` — plain reads.
- `selectByStatus(state, status)` — memoized (`createSelector`); board columns.
- `selectMyTickets(state)` — memoized, cross-slice (reads `auth.user.id`); the developer's own tickets for `/queue`.

---

## 7. Data-flow walkthroughs

**Agent creates a ticket:** `CreateTicketPanel` validates (title + category + assignee required) → `dispatch(createTicket(input))` → `api.createTicket` maps to `{title, assignee_id, priority:"Normal", …}` → `POST /tickets` → `data.ticket` adapted → `createTicket.fulfilled` upserts → board re-renders the new card in the "To do" column.

**Developer moves a ticket:** `StatusControl.onChange(next)` → `useMyQueue.updateStatus(id, next)` sets `updatingId` (disables that card's control) → `dispatch(patchTicket({id, patch:{status}}))` → `api.updateTicket` sees a status-only patch → `PATCH /tickets/{id}/status` → adapted `data.ticket` upserts → card reflects the new status; `updatingId` clears in `finally`.

**Board loads:** `board/page` dispatches `fetchTickets()` (agent → `/tickets`) and separately fetches categories + developers for the create/edit dropdowns. First load shows `LoadingState`; a failed first load shows `ErrorState` with retry; a failed refetch while data exists shows a non-blocking banner.

---

## 8. Routing, pages & role model (`src/app/`)

| Route | Guard | Who | What |
|---|---|---|---|
| `/` | — | — | redirects to `/login`. |
| `/login` | — | — | `AuthLayout` + `LoginForm`; redirects by role on success. |
| `/register` | — | — | `AuthLayout` + `RegisterForm` (name/email/password + designation `<select>`); auto-login. |
| `/board` | `RouteGuard` (no role) | agent + developer | Kanban board. Everyone views; **agents** get "+ New ticket" and per-card "Edit" (gated by `isAgent`, not the guard). |
| `/queue` | `RouteGuard(["developer"])` | developer | The developer's own tickets + `StatusControl`. |
| `/team` | `RouteGuard(["agent"])` | agent | Developer roster from `GET /developers` + per-dev **open workload** (non-Done assigned tickets, computed client-side). |
| `/settings` | `RouteGuard` (no role) | any | Placeholder. |

**Role model in the UI has three layers:**
1. **Route guard** — hard redirect if the role can't be on the page (`/queue` dev-only, `/team` agent-only).
2. **Sidebar nav gating** — `NAV_ITEMS` each carry a `roles` list; `Sidebar` filters by `auth.user.role`. Agent sees **Board · Team · Settings**; developer sees **Board · My queue · Settings**. (This fixed the bug where an agent clicking a visible "My queue" got bounced to `/board`.)
3. **In-page affordances** — e.g. the board renders create/edit controls only when `isAgent`.

The shell (`AppShell`) = `Sidebar` + `TopBar` (search, letter avatar, **Log out**) + scrollable `<main>`. Wrap every authenticated page in `RouteGuard` → `AppShell`.

---

## 9. Component catalog (`src/components/`)

**`auth/`**
- `AuthLayout` — branded two-column shell (navy brand panel + form card) shared by login/register.
- `LoginForm` / `RegisterForm` — email/password (+ designation select); dispatch `login`/`register`; redirect by role.
- `RouteGuard` — session restore + auth/role gating (see §4).

**`layout/`**
- `AppShell` — frame + logout wiring.
- `Sidebar` — navy nav, gold active state, hand-built SVG icons (no icon dep), **role-filtered** items.
- `TopBar` — search box, letter `Avatar`, `onLogout` "Log out" button.

**`ui/` (primitives, each with a story)**
- `Avatar` (letter avatar), `Button` (adds a `loading` state), `Badge`, `Modal` (title/body/footer slots), `States` (`LoadingState` / `EmptyState` / `ErrorState` — the shared non-happy-path views, `ErrorState` takes an `onRetry`).

**`tickets/` (shared by board + queue, each with a story)**
- `PriorityBolt` — the signature priority-as-bolt (1/2/3 gold bolts for normal/urgent/severe).
- `CategoryTag` — issue-style pill.
- `TicketCard` — composes the above + `Avatar`; **presentational**, takes resolved `categoryName`/`assigneeName` (parent looks them up) plus an `actions` slot (board → Edit button, queue → `StatusControl`). Renders the estimate as `⏱ {n}h` (numeric hours → `{n}h`; legacy non-numeric shown as-is).
- `StatusControl` — controlled To do/In progress/Done `<select>`; `disabled` while a patch is in flight.

**`board/`**
- `BoardColumn` — one Kanban column (title, count, empty text); prefers each ticket's inline `category_name`/`assignee_name`, falls back to the resolver maps.
- `CreateTicketPanel` — agent modal → `createTicket` (POST). Per-field validation (title/category/assignee required, `isInvalid` + `Form.Control.Feedback`); estimate is an integer hours input.
- `EditTicketPanel` — agent modal → `patchTicket` (PATCH); prefilled; edits title/desc/category/priority/assignee/estimate — **not status** (that's the developer's control). Same per-field validation.

---

## 10. Types, constants, styling (`src/types`, `src/constants`, `src/styles`)

**Types (`types/index.ts`):** `Role`, `TicketStatus`, `Priority`; `Employee`/`User` (`id, name, email, role, designation`); `Category` (`category_id, name`); `Ticket` (incl. optional `category_name`/`assignee_name`); `CreateTicketInput` / `UpdateTicketInput` (incl. `time_to_complete`); `LoginInput` / `RegisterInput`; `ApiEnvelope<T>`.

**Constants (`constants/index.ts`):** `STATUSES` (value → display label), `PRIORITIES` + `PRIORITY_BOLTS` (lowercase, 1/2/3), `DESIGNATIONS` (+ `Designation` type — must match the backend whitelist), `NAV_ITEMS` (with `roles`), `HOME_BY_ROLE` (agent→`/board`, developer→`/queue`).

**Styling (`styles/theme.scss`):** re-themes Bootstrap to the navy `#001F3F` / gold `#C5A059` / white / light-gray palette via CSS variables; loads the three fonts (Space Grotesk headings, Inter body, JetBrains Mono for IDs/mono bits — wired in `app/layout.tsx` via `next/font`). Components read `var(--navy)` etc. rather than hardcoding hex.

**Mock layer (`lib/mockData.ts`):** GuestMatchr fixtures (employees, categories, 8 tickets) in our frontend shape (no inline names). Powers `NEXT_PUBLIC_USE_MOCK=true` with no backend.

---

## 11. Known runtime behaviors & backend rules

These are backend-enforced facts the frontend must respect (learned by testing the live API):

- **Status is forward-only; `Done` is terminal.** The backend rejects backward moves with `422 "Cannot change status from Done to In Progress"` (and `…to Assigned`). ⚠️ **Known UX gap:** the queue's `StatusControl` still *offers* backward options, and `useMyQueue.updateStatus` intentionally doesn't surface a rejected patch — so trying to un-Done a ticket silently snaps back with no message. Follow-up options: lock the control once Done, or surface the backend message.
- **Description minimum 2 characters** — `POST /tickets` returns `422 { errors: { description: "The Description minimum is 2" } }`. Surfaced via the field-level error handling in `request()`.
- **Create requires** title, description (≥2), category, priority, and an assignee (the frontend enforces title + category + assignee before submit).
- **Cookies are `SameSite=None; Secure`** — cross-origin dev works; see deployment for the third-party-cookie caveat.

---

## 12. Environment & configuration

`.env.local` (gitignored; template in `.env.example`):
```
NEXT_PUBLIC_API_URL=<backend-base>/ticketTriage   # e.g. a stable HTTPS host or tunnel
NEXT_PUBLIC_USE_MOCK=false                          # "true" = run entirely on mock data
```
- `USE_MOCK` defaults to mock when the var is anything but the exact string `"false"`.
- Restart `npm run dev` after any `.env.local` change (Next inlines `NEXT_PUBLIC_*` at build/boot).
- For real-backend cross-origin: the backend must send `Access-Control-Allow-Credentials: true` with an **exact** `Access-Control-Allow-Origin` (not `*`) and set the cookies `SameSite=None; Secure`.

Scripts: `dev`, `build`, `start`, `lint`, `storybook`, `build-storybook`.

---

## 13. Deployment notes

The frontend is deploy-ready and env-driven — **no code change is needed to deploy**.

- **Mock-only demo (zero backend):** deploy to any Next host (Vercel) with `NEXT_PUBLIC_USE_MOCK=true`. Nothing else changes.
- **Live against the backend:** set `NEXT_PUBLIC_API_URL` in the host's env (not `.env.local`), the backend needs a **stable public HTTPS URL** (not an ephemeral quick tunnel), and its CORS `Access-Control-Allow-Origin` must be updated to the deployed frontend origin.
- ⚠️ **Third-party cookies:** deployed on a different domain than the API, the auth cookies become third-party — Safari blocks these and Chrome is phasing them out. The durable fix is to make the API **same-site**: host it on the same registrable domain (e.g. `api.example.com` + `app.example.com` with `Domain=.example.com`) or reverse-proxy the API under the frontend origin.

---

## 14. Storybook & tests

- `.storybook/main.ts` (story globs + addons) and `preview.tsx` (loads Bootstrap + theme so stories render on-brand).
- Every reusable `ui/` and `tickets/` component has a colocated `*.stories.tsx`.
- A Vitest/Playwright rig is present in devDependencies but unused for this project's scope.

---

## 15. Conventions

- Interactive components are client components (`"use client"`).
- Import shared components from `@/components/...`; never re-create a button/card/avatar.
- One file = one owner (see the workplan). Shared foundation (`types`, `lib`, `store`, docs) is coordinated.
- Add a new endpoint in `api.ts` only — pair a real call (with adapter) and a mock in `endpoint(real, mock)`.
- `DESIGNATIONS` must match the backend whitelist exactly (registration validates against it).
