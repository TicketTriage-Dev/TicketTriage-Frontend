# TicketMatchr — Project Context

> Working brief. Defines what we're building, the boundaries, and the build order.
> **Stay inside the scope below** — this is a 3-day learning project, not a production product.
>
> **This repo builds the FRONTEND ONLY.** The PHP/MySQL backend is documented here for reference
> (so the API client matches), but is not implemented in this repo.

---

## Progress log — Soham

> Running record of my completed phases/tasks. **Newest entry first.** Add an entry
> whenever a phase or task is finished: what was done and anything carried over.

### 2026-07-17 — Board validation + loading/error polish + role-aware nav ✅

- **Nav bug** — the sidebar showed "My queue" to everyone, but `/queue` is developer-only, so an
  agent clicking it got bounced to `/board` ("redirects to nothing"). `NAV_ITEMS` now carries a
  `roles` list and `Sidebar` filters by the logged-in role (agent: Board/Team/Settings; developer
  adds My queue).
- **Create/Edit validation** — title, category, **and assignee** are now required, shown as
  per-field inline errors (react-bootstrap `isInvalid` + `Form.Control.Feedback`) instead of one
  generic alert; the top alert is reserved for server errors.
- **Board loading/error polish** — first load uses the shared `LoadingState` / `ErrorState`
  (with a "Try again" retry) matching `/queue`; once the board has data, a failed refetch only
  shows a non-blocking banner instead of blanking the board. `tsc` clean.

**Soham's Day-3 remaining:** just the end-to-end demo rehearsal.

### 2026-07-17 — Post-demo bug fixes (board assignee + estimate) ✅

Two issues caught while testing with Parinita:
- **Board showed "Unassigned" for a ticket the developer saw in their queue.** The board was
  rebuilding the assignee name via an id→name lookup against the separately-fetched `/developers`
  list (fragile — misses if the list is incomplete). The backend already sends `assignee_name` /
  `category_name` **inline on every ticket**, but the adapter was dropping them. Fix: carry both
  through `adaptTicket` onto the `Ticket` (optional), and `BoardColumn` now prefers the inline name,
  falling back to the resolver map for mock data. Robust regardless of the `/developers` list.
- **Estimate (`time_to_complete`) was free text and displayed as a bare number.** Create/Edit now
  use an integer `type="number"` input labelled "Estimate (hours)" and send an int; `TicketCard`
  renders it as `⏱ 3h` (numeric → `{n}h`; legacy non-numeric like mock "1d" shown as-is). Also added
  the estimate field to `EditTicketPanel` (+ `time_to_complete` in `UpdateTicketInput` / the PATCH
  adapter) so an agent can correct it. `tsc` clean.

### 2026-07-17 — Mock→real cutover (tickets/categories/developers) ✅

The backend published the ticket/category/employee routes, so I did the full cutover —
**all contained in `lib/api.ts` + one thunk**, zero changes to components, types, constants,
or Parinita's files (we chose *adapt-in-the-client* over *adopt-everywhere*).

- **Adapter layer in `lib/api.ts`** — the backend shape ≠ our frontend types, so I map it in
  the one network seam: `id→ticket_id`, `title→name`, `assignee_id→assigned_to`, `category.id→
  category_id`, and priority casing `Normal↔normal` (`toPriority`/`fromPriority`). List payloads
  are unwrapped from their envelope (`data.tickets` / `data.categories` / `data.developers`) via
  a defensive `unwrapList` (tolerates a bare array too). `adaptEmployee` defaults `email`/`role`
  because `/developers` objects only carry `{id, name, designation}`.
- **Role-aware `fetchTickets`** (`ticketsSlice`) — developers → `GET /tickets/mine`, agents →
  `GET /tickets`. Fixes the `/queue` **403 "requires role agent"** (it was calling the agent-only
  list). One thunk, both personas.
- **Status vs edit routing** (`updateTicket`) — a **status-only** patch → `PATCH /tickets/{id}/status`
  (developer-permitted); any other patch → `PATCH /tickets/{id}` (agent edit). Fixes the developer
  status change 403.
- **Create/edit payloads** now send `title`/`assignee_id`/capitalized `priority`; responses unwrap
  `data.ticket`. **Assignee picker** moved `/employees` → `GET /developers`.
- **Board crash fixed** — the un-unwrapped `{tickets:[...]}` object was reaching `tickets.filter(...)`.
- **Verified live** against the tunnel (agent1@triage.local): `/tickets`, `/categories`,
  `/developers` all return the shapes the adapter expects. `tsc --noEmit` clean.

**Left to complete (Day 3):** root `README` (currently a stub); board create/edit validation +
loading/error polish; demo rehearsal. *(Backend `Secure` cookie flag — done by Nishita 2026-07-17.)*

### 2026-07-16 — Auth live fixes + logout + cleanup

- **Logout** — `AppShell` dispatches the `logout` thunk and redirects to `/login`; `TopBar` got an
  optional `onLogout` prop + "Log out" button.
- **Session-expired bug (cross-site cookies)** — backend originally set `SameSite=Lax` cookies, so the
  browser dropped them cross-origin (localhost → tunnel) → every post-login call 401'd. Briefly worked
  around with a Next.js `/backend` proxy, then **removed it** once Nishita fixed the backend
  (CORS + `SameSite=None`). Client now calls the backend directly via `NEXT_PUBLIC_API_URL`.
  ⚠️ **Still pending:** backend cookies are `SameSite=None` **without `Secure`** — browsers require
  `Secure` for `SameSite=None`, so the session can still drop in-browser until Nishita adds it.
- **Designation validation** — backend introduced a strict whitelist; synced `DESIGNATIONS` to its
  exact strings ("Frontend Developer", …). Also made `api.ts` surface `data.errors` so validation
  messages are actionable, not just "Validation failed". Aligned mock designations.
- **Selector warning** — memoized `selectByStatus` / `selectMyTickets` with `createSelector`.
- **Cleanup** — removed Storybook demo boilerplate (`src/stories/`), `debug-storybook.log`, unused
  `STATUS_LABELS` and the unused `setUser` action. `tsc` clean.

### 2026-07-16 — Auth UX: registration + modern login, designations

**Team decisions folded in:** designations are now a **predefined list** (no free text) picked
from a dropdown at registration; the assignee picker shows the designation beside the name (no
filter); registration is **in frontend scope**.

**Built (all reusing existing components — Button, Form, palette; one small shared `AuthLayout`):**
- `constants/DESIGNATIONS` (+ `Designation` type) — the predefined list. Swap to a
  `GET /designations` fetch later if it goes data-driven (like categories).
- `Employee.designation` is now `string | null` (null for agents, per backend); mock agent aligned.
- `authSlice.register` thunk — registers then auto-logs-in so cookies are set.
- `components/auth/RegisterForm` (name/email/password + designation `<select>`) → redirects by role.
- `components/auth/AuthLayout` — shared navy brand panel + form card; both `/login` and `/register`
  use it. Login page restyled to the modern two-column look.
- `/register` page added. Login ↔ register cross-links.
- `CreateTicketPanel` + `EditTicketPanel` assignee options now show `{name} — {designation}`.
- `tsc` clean; `/login`, `/register`, `/board`, `/queue` all serve 200.

**Open items:** (1) confirm the exact `DESIGNATIONS` strings with Nishita so FE/BE match; (2)
decide DB-table vs constant for the list long-term; (3) register response doesn't set cookies, so
we register-then-login — confirm that's fine with the backend.

### 2026-07-16 — Day 2: Board vertical

**Built the triage board (agent flow):**
- `store/ticketsSlice.ts` — `fetchTickets` / `createTicket` / `patchTicket` thunks + selectors
  (`selectByStatus` for columns, `selectMyTickets` for Parinita's queue, `selectAllTickets`).
- `components/board/BoardColumn.tsx` — a Kanban column (titled, counted, empty state) rendering
  Parinita's `TicketCard`.
- `components/board/AssigneeDropdown.tsx` — agent reassign control → PATCH.
- `components/board/CreateTicketPanel.tsx` — agent-only modal form (uses her `Modal`) → POST.
- `app/board/page.tsx` — `RouteGuard` + `AppShell`; loads tickets + categories + developers,
  renders the 3 columns, gates create/assign to agents, feeds the user name to the top bar.
- `tsc --noEmit` clean; `/board` compiles + serves.

**Carried over / dependencies:**
- Board is **mock-backed** — backend has only published AUTH endpoints so far. To see it render
  now, set `NEXT_PUBLIC_USE_MOCK=true`; to go live, confirm the real `/tickets`, `/categories`,
  `/employees` routes with the backend dev and adjust the paths in `lib/api.ts`.
- Day 3 next: developer `/queue` + status controls (Parinita), then empty/error/loading polish.

### 2026-07-16 — Phase 1: Auth vertical

**Reconciled the client to the REAL backend contract** (the earlier Phase 0 assumptions
were replaced once the backend auth APIs were shared):
- **Cookie-based auth**, not bearer tokens. Backend sets httpOnly `access_token` (~15 min) +
  `refresh_token` (~7 days). Client sends `credentials: "include"` and keeps no token in JS.
- **Envelope is `{ status, msg, data }`** (was `{ ok, data }`). Modeled as `ApiEnvelope<T>` in `types`.
- **User/Employee shape is `{ id, name, email, role, designation }`** (was `employee_id`/`username`).
  Updated `types`, `mockData`, and fixed the ripple into Parinita's `TicketCard.stories.tsx`.
- Base URL `http://localhost/ticketTriage` via `NEXT_PUBLIC_API_URL`.

**Built the auth vertical:**
- `lib/api.ts` — cookie transport + `{status,msg,data}` parsing + **refresh interceptor**:
  on 401 it calls `/auth/refresh` once (single-flight guard) then replays the request; if
  refresh fails → auth error (force re-login). No loops. Auth methods: login/register/logout/
  me/refresh. Ticket/category/employee endpoints remain **mock-backed** (backend not published yet).
- `store/authSlice.ts` — `login` / `logout` / `restoreSession` thunks; no token in state
  (session = `user` set).
- `components/auth/LoginForm.tsx` + `app/login/page.tsx` — email/password, redirect by role
  (agent → `/board`, developer → `/queue`).
- `components/auth/RouteGuard.tsx` — restores session on load, redirects unauth → `/login`,
  optional per-page role gating.
- Updated canonical `CLAUDE.md` §4–5 to the real contract. `tsc --noEmit` clean; dev server
  boots, `/login` renders, `/` redirects.

**Carried over:** login flow tested against the **mock** layer (`NEXT_PUBLIC_USE_MOCK` defaults on);
still to smoke-test against the live PHP backend once it's reachable. Board/queue wiring is next.

### 2026-07-15 — Phase 0: Foundation

- Tooling swap Tailwind → **react-bootstrap** + bootstrap + sass; themed to the navy/gold
  palette via Bootstrap CSS variables; wired the three fonts.
- **Redux Toolkit** store + typed hooks + `Providers`; `authSlice`/`ticketsSlice` stubs.
- Shared `types`, `constants`, `lib/api.ts` + `lib/mockData.ts` (GuestMatchr fixtures).
- App-shell skeletons (`AppShell`/`Sidebar`/`TopBar`) — later finished by Parinita.
- **Storybook** initialized with a themed preview.

---

## 1. What we're building

A small Jira-style internal ticket tool for a dev team. **Agents** raise tickets and assign them to **developers**; developers work through their assigned tickets across three states (To do → In progress → Done). The demo data is themed around our real project, GuestMatchr (a podcast guest–host matching platform), so tickets read like a real backlog.

**Goal:** learn the full stack end to end and produce something clean and demo-able. Deadline: Friday 6pm.

**Two personas**
- **Agent** — creates tickets, sets category + priority, assigns a developer.
- **Developer** — sees the tickets assigned to them, moves them across statuses.

---

## 2. Scope (read this before writing anything)

**In scope**
- Auth (login) with JWT, two roles: `agent`, `developer`.
- Agent: create ticket, set category, set priority (manual), assign a developer.
- Developer: view own queue, change ticket status.
- Triage board (Kanban: To do / In progress / Done) — shared view.
- Category chosen at creation, GitHub-issue style.
- Priority is **manual only**: `normal` / `urgent` / `severe`. No weighted/auto-priority logic.

**Explicitly OUT of scope** (do not build unless asked)
- Comments / threads on tickets.
- Notifications (in-app, email, push).
- Auto-matching devs by skill or current load (the "matchr" logic is a future idea, not now).
- Weighted priority from category.
- File attachments, activity log, SLA timers, analytics dashboards.
- Multi-project / multi-org support.

If a feature isn't listed under "In scope," ask before implementing it.

---

## 3. Tech stack

**Frontend**
- Next.js (App Router) + TypeScript + Tailwind CSS.
- Client components where state is needed (`"use client"`).
- Calls the PHP API over HTTP; expects **JSON responses only**.

**Backend** (reference only — NOT built in this repo)
- PHP with a layered **Controller → Service → Repository** architecture.
- MySQL (via XAMPP locally).
- Pixie query builder.
- JWT for authentication.
- Redis for caching, with a graceful **fallback to MySQL** if Redis is unavailable.
- PSR-4 autoloading; Front Controller pattern.

**Hard API rule:** every endpoint returns JSON with the correct `Content-Type: application/json` header — including errors. Never let PHP emit an HTML error/warning page into an API response. Set up a global error/exception handler early that catches everything and returns a JSON envelope.

---

## 4. Data model

Keep it to three tables. `assigned_to` lives on the ticket as a nullable FK (simplest for this scope). A separate `assignment` join table is only needed if we later allow many devs per ticket — we don't, so skip it for now.

**employee**
| column | type | notes |
|---|---|---|
| employee_id | INT PK AI | |
| username | VARCHAR | |
| email | VARCHAR UNIQUE | |
| password_hash | VARCHAR | store a hash, never plaintext |
| role | ENUM('agent','developer') | |

**category**
| column | type | notes |
|---|---|---|
| category_id | INT PK AI | |
| name | VARCHAR | e.g. Backend, Frontend, Auth, Database, Infra |

**ticket**
| column | type | notes |
|---|---|---|
| ticket_id | INT PK AI | |
| name | VARCHAR | short summary |
| description | TEXT | |
| category_id | INT FK → category | |
| status | ENUM('todo','doing','done') | default 'todo' |
| priority | ENUM('normal','urgent','severe') | set manually by agent |
| assigned_to | INT FK → employee, NULLABLE | the developer |
| time_to_complete | VARCHAR / INT | rough estimate, optional |
| created_at | DATETIME | default now |

Add an index on `assigned_to` and `status` — they drive the two main queries (board grouping, developer queue).

---

## 5. API surface

Prefix everything with `/api`. All responses JSON. Protect write routes with JWT + role checks.

```
POST   /api/auth/login              -> { token, user }
GET    /api/me                      -> current user (from JWT)

GET    /api/tickets                 -> all tickets (board view); supports ?status= &priority= &assigned_to=
POST   /api/tickets                 -> create ticket (agent only)
PATCH  /api/tickets/{id}            -> update status / assignee / priority
GET    /api/tickets/mine            -> developer's own queue (from JWT)

GET    /api/categories              -> list categories
GET    /api/employees?role=developer-> for the assignee picker
```

**Standard JSON envelope**
```json
// success
{ "ok": true, "data": { } }
// error
{ "ok": false, "error": { "code": "VALIDATION", "message": "…" } }
```

Suggested Redis caching: cache `GET /api/categories` and `GET /api/employees` (rarely change); invalidate ticket-list cache on any ticket write, and fall back to MySQL if Redis is down.

---

## 6. Frontend pages

- **`/login`** — email + password, stores JWT, redirects by role.
- **`/board`** — the Kanban triage board (To do / In progress / Done). Cards show ticket ID, title, category tag, priority (shown as a lightning "bolt" — 1/2/3 bolts for normal/urgent/severe), estimate, and assignee avatar. Agents can create + assign here.
- **`/queue`** — developer's own assigned tickets, with status controls.
- Shared shell: slim left sidebar (Board / My queue / Team / Settings) + top bar with search and the current user's avatar (letter avatar from their name).

Visual language: light theme, Space Grotesk + Inter + JetBrains Mono, palette navy `#001F3F` (brand) / gold `#C5A059` (accent) / white `#FFFFFF` (surface) / light gray `#E5E5E5` (borders), priority-as-bolt as the signature element. Define these as react-bootstrap theme overrides / CSS variables in `src/styles/`.

> **Note:** the canonical, up-to-date brief is now [`CLAUDE.md`](CLAUDE.md) in the repo root (decided stack, palette, folder structure, work split). This file is kept for history.

---

## 7. Suggested build order (3 days)

**Day 1 — foundation**
- Frontend: project scaffold, Tailwind, login page, auth token handling, app shell.
- (Backend, reference only: DB schema + seed data, Front Controller + router + global JSON error handler, Auth login/JWT/`/api/me`.)

**Day 2 — core loop**
- Frontend: wire the board to `/api/tickets`, the create-ticket panel to `POST /api/tickets`, and the assignee dropdown to `PATCH`.
- (Backend, reference only: tickets CRUD, categories + employees endpoints, role guards, Redis caching.)

**Day 3 — polish + demo**
- Developer `/queue` view + status changes.
- Empty/error/loading states, form validation, responsive check, keyboard focus.
- Seed a clean demo dataset, write a short README with run steps, rehearse the walkthrough.

---

## 8. Conventions

- **Backend layering** (reference): Controllers parse the request and shape the response; Services hold business rules; Repositories do data access via Pixie. Controllers never touch the DB directly.
- **Auth:** verify JWT in middleware/front controller; attach the decoded user; role-guard write endpoints.
- **Validation:** validate on the server; return the JSON error envelope, never a thrown HTML page.
- **Security basics:** hashed passwords, parameterized queries (Pixie handles this), no secrets in the repo.
- **Frontend:** typed API client, one place for fetch + auth header + error handling. Optimistic UI is fine for status/assignee changes.
- **Git:** feature branches per person, merge to main. Keep `node_modules` / `vendor` out of the repo.

## 9. Definition of done

- Agent can log in, create a ticket with category + priority, and assign a developer.
- Developer can log in, see their queue, and move a ticket to done.
- Board reflects all three states and updates after actions.
- Every API response is valid JSON, including errors.
- Runs cleanly from a documented `README` (frontend on `npm run dev`).
