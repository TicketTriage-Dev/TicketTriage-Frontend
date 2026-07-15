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
- A reference implementation of the board UI exists (`TicketMatchr.jsx`); reuse its visual
  language but re-skin it to the palette above (it originally used a different brand color).

---

## 4. Data model (backend reference — mirror in `src/types`)

Three tables. `assigned_to` lives on the ticket as a nullable FK.

**employee**: `employee_id` (INT PK), `username` (VARCHAR), `email` (VARCHAR UNIQUE),
`password_hash` (VARCHAR), `role` (ENUM `agent`|`developer`).

**category**: `category_id` (INT PK), `name` (VARCHAR — e.g. Backend, Frontend, Auth, Database, Infra).

**ticket**: `ticket_id` (INT PK), `name` (VARCHAR summary), `description` (TEXT),
`category_id` (FK), `status` (ENUM `todo`|`doing`|`done`, default `todo`),
`priority` (ENUM `normal`|`urgent`|`severe`), `assigned_to` (FK → employee, NULLABLE),
`time_to_complete` (VARCHAR/INT, optional), `created_at` (DATETIME).

---

## 5. API surface (what the client calls)

Prefix everything with `/api`. All responses JSON. Write routes require JWT + role checks.

```
POST   /api/auth/login              -> { token, user }
GET    /api/me                      -> current user (from JWT)

GET    /api/tickets                 -> all tickets (board view); ?status= &priority= &assigned_to=
POST   /api/tickets                 -> create ticket (agent only)
PATCH  /api/tickets/{id}            -> update status / assignee / priority
GET    /api/tickets/mine            -> developer's own queue (from JWT)

GET    /api/categories              -> list categories
GET    /api/employees?role=developer-> for the assignee picker
```

**Standard JSON envelope** — model `ApiResult<T>` in `src/types` on this:
```json
{ "ok": true, "data": { } }
{ "ok": false, "error": { "code": "VALIDATION", "message": "…" } }
```

---

## 6. Frontend pages

- **`/login`** — email + password, stores JWT, redirects by role.
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
types/          shared TS types (Ticket, Employee, Category, User, ApiResult)
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
