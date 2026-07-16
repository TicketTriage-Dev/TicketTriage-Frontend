# TicketMatchr — Project Context (canonical brief)

> **Read this first, every session.** This is the single source of truth for the project.
> If you're picking up after a `git pull`, also read [`FRONTEND_WORKPLAN.md`](FRONTEND_WORKPLAN.md)
> for who-owns-what, then check `git log`/`git status` to see what changed.
>
> **This repo builds the FRONTEND ONLY.** The PHP/MySQL backend is a separate person's repo;
> it is documented here (sections 4–5) only so the frontend API client and types match. We
> develop the frontend against a **mock data layer** so we are never blocked on the backend.
>
> **Team:** frontend is built by **two people — Soham & Parinita** (see the work split in
> `FRONTEND_WORKPLAN.md`); backend is a third person. Stay inside the scope in section 2 — this
> is a 3-day learning project, not production. Deadline: Friday 6pm.

---

## 0. Decided stack & conventions (READ — these override older notes)

- **Framework:** Next.js (App Router) + TypeScript.
- **State:** Redux Toolkit (typed `useAppSelector` / `useAppDispatch`, one slice per domain:
  `authSlice`, `ticketsSlice`).
- **UI / styling:** **react-bootstrap** (Bootstrap CSS + a custom theme). **Tailwind is being
  removed** — do not add Tailwind classes or utilities. Interactive components must be client
  components (`"use client"`).
- **Component workshop:** Storybook — every reusable component in `components/ui` and
  `components/tickets` gets a story.
- **Data:** typed API client in `src/lib/api.ts` (one place for fetch + auth header + error
  handling), backed by `src/lib/mockData.ts` until the backend is live.
- **Dev proxy:** the browser calls the relative `/backend/*`, which `next.config.ts` proxies to
  `BACKEND_ORIGIN` server-side — this keeps the backend's `SameSite=Lax` auth cookies working
  cross-origin in dev (no CORS). Set `NEXT_PUBLIC_API_URL=/backend` + `BACKEND_ORIGIN` in `.env.local`.
- **Designations:** `DESIGNATIONS` in `constants/` must match the backend's whitelist exactly
  (registration validates against it).
- **Git:** feature branch per person → PR into `main` → review each other. Pull `main` every
  morning, push small commits end of day. `node_modules` stays out of git.

---

## 1. What we're building

A small Jira-style internal ticket tool for a dev team. **Agents** raise tickets and assign them
to **developers**; developers work through their assigned tickets across three states
(To do → In progress → Done). Demo data is themed around GuestMatchr (a podcast guest–host
matching platform) so tickets read like a real backlog.

**Two personas**
- **Agent** — creates tickets, sets category + priority, assigns a developer.
- **Developer** — sees the tickets assigned to them, moves them across statuses.

---

## 2. Scope

**In scope**
- Auth (login **+ registration**) via **cookie-based sessions** (short-lived access token + rotating refresh token), two roles: `agent`, `developer`. Registration picks a **designation** from a predefined list (`DESIGNATIONS` in `constants/`), not free text; on success the user is auto-logged-in.
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

## 3. Color scheme & visual language

Light theme. Signature element is **priority-as-bolt** (a lightning bolt shown 1/2/3 times for
normal / urgent / severe).

| Token | Hex | Use |
|---|---|---|
| **Navy (brand / primary)** | `#001F3F` | Sidebar, headings, primary buttons, key text |
| **Gold (accent)** | `#C5A059` | Accents, active/selected states, priority bolts, highlights |
| **White (surface)** | `#FFFFFF` | Page background, cards |
| **Light gray (muted)** | `#E5E5E5` | Borders, dividers, column backgrounds, subtle fills |

- Fonts: Space Grotesk (headings) + Inter (body) + JetBrains Mono (IDs / mono bits).
- Define these as CSS variables / Bootstrap theme overrides in `src/styles/`, not hardcoded
  per-component.

---

## 4. Data model (backend reference — mirror in `src/types`)

Three tables. `assigned_to` lives on the ticket as a nullable FK.

**employee**: `id` (INT PK), `name` (VARCHAR), `email` (VARCHAR UNIQUE),
`password_hash` (VARCHAR), `role` (ENUM `agent`|`developer`), `designation` (VARCHAR — e.g.
"Frontend Dev"), `created_at`. *(The auth payload returns `id`/`name`/`role`/`designation`,
never the hash — mirrored as `Employee`/`User` in `src/types`.)*

**category**: `category_id` (INT PK), `name` (VARCHAR — e.g. Backend, Frontend, Auth, Database, Infra).

**ticket**: `ticket_id` (INT PK), `name` (VARCHAR summary), `description` (TEXT),
`category_id` (FK), `status` (ENUM `todo`|`doing`|`done`, default `todo`),
`priority` (ENUM `normal`|`urgent`|`severe`), `assigned_to` (FK → employee, NULLABLE),
`time_to_complete` (VARCHAR/INT, optional), `created_at` (DATETIME).

---

## 5. API surface (what the client calls)

Base URL `http://localhost/ticketTriage` (configurable via `NEXT_PUBLIC_API_URL`). All responses JSON.

**Auth is COOKIE-based, not bearer tokens.** The backend sets two httpOnly cookies:
`access_token` (~15 min) and `refresh_token` (~7 days). The client sends
`credentials: "include"` on every request and stores **no** token in JS.

**Auth endpoints (confirmed against the real backend):**
```
POST   /auth/login     { email, password }        -> data.user
POST   /auth/register  { name,email,password,designation } -> data.user
POST   /auth/logout                                -> data: null
GET    /auth/me                                    -> data.user (current session)
POST   /auth/refresh                               -> data: null (rotates cookies)
```

**Refresh flow (implemented in `lib/api.ts`):** on a `401`, the client calls
`/auth/refresh` **once**, then replays the original request. If the refresh itself
`401`s, the refresh token is dead → surface an auth error and force re-login. A
single-flight guard prevents concurrent refreshes; the retry flag prevents loops.

**Ticket / category / employee endpoints (provisional — backend not yet published;
mock-backed until then):**
```
GET    /tickets            ?status= &priority= &assigned_to=   (board view)
POST   /tickets            create (agent only)
PATCH  /tickets/{id}       update status / assignee / priority
GET    /tickets/mine       developer's own queue
GET    /categories         list categories
GET    /employees?role=    assignee picker
```

**Standard JSON envelope** — modeled as `ApiEnvelope<T>` in `src/types`:
```json
{ "status": 200, "msg": "OK", "data": { } }
```
Errors use the same shape with a 4xx/5xx `status` and a human message in `msg`.

---

## 6. Frontend pages

- **`/login`** — email + password; backend sets auth cookies, then redirects by role
  (agent → `/board`, developer → `/queue`).
- **`/register`** — name, email, password, and a **designation** dropdown (predefined list);
  auto-logs-in and redirects by role on success.
- **`/board`** — Kanban board (To do / In progress / Done). Cards show ticket ID, title, category
  tag, priority (bolts), estimate, assignee avatar. Agents can create + assign here.
- **`/queue`** — developer's own assigned tickets, with status controls.
- **`/team`, `/settings`** — simple placeholder pages reached from the sidebar.
- Shared shell: slim left sidebar (Board / My queue / Team / Settings) + top bar with search and a
  letter avatar of the current user.

---

## 7. Folder structure (`frontend/src`)

```
app/            App Router pages: login, board, queue, team, settings (+ layout, globals)
components/
  auth/         login form, route/role guards
  layout/       AppShell, Sidebar, TopBar
  board/        board columns, create-ticket panel, assignee dropdown
  tickets/      TicketCard, PriorityBolt, CategoryTag (shared, prop-driven)
  ui/           primitives / react-bootstrap wrappers (Button, Badge, Avatar, Modal…)
lib/            api.ts (fetch client) + mockData.ts (fixtures until backend is live)
hooks/          reusable hooks
store/          Redux store + slices (authSlice, ticketsSlice)
constants/      statuses, priorities, categories, nav items
types/          shared TS types (Ticket, Employee, Category, User, ApiEnvelope)
styles/         theme tokens (palette above), fonts
```

Empty folders currently hold a `.gitkeep`; it disappears as real files land.

---

## 8. Definition of done

- Agent can log in, create a ticket with category + priority, and assign a developer.
- Developer can log in, see their queue, and move a ticket to done.
- Board reflects all three states and updates after actions.
- Every API response is handled as valid JSON, including errors.
- Runs cleanly from a documented `README` (frontend on `npm run dev`).
