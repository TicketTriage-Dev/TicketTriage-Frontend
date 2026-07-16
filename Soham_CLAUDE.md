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
