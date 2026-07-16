# TicketMatchr — Project Context

> Working brief. Defines what we're building, the boundaries, and the build order.
> **Stay inside the scope below** — this is a 3-day learning project, not a production product.
>
> **This repo builds the FRONTEND ONLY.** The PHP/MySQL backend is documented here for reference
> (so the API client matches), but is not implemented in this repo.

---

## Progress log — Parinita

> Running record of completed phases/tasks (mine, Parinita). **Newest entry first.**
> Add an entry whenever a phase or task is finished: what was done, commit hashes,
> and anything carried over. This is a human-readable record separate from git history.

> **📥 Handoff from Soham (2026-07-16) — pull `main` before your next session.**
> Two things landed that your `/queue` work depends on:
> 1. **Contract change:** `Employee`/`User` is now `{ id, name, email, role, designation }`
>    (was `employee_id`/`username`), and the API envelope is `{ status, msg, data }`. Auth is
>    cookie-based. Your `TicketCard.stories.tsx` was already updated for this.
> 2. **`ticketsSlice` is ready:** use `selectMyTickets(userId)` for the queue and `patchTicket({ id, patch })`
>    to change a ticket's status. The `TicketCard` `actions` slot is where your `StatusControl` goes.

### 2026-07-16 — Day 1 shell visuals (Day 1 COMPLETE ✅)

**Completed:**
- Finished the **app-shell visuals** (took `components/layout/` over from Soham's Phase 0 skeletons):
  - **Sidebar** — navy surface, gold active state, hover states, and hand-built outline nav icons (board / queue / team / settings) — no icon dependency added.
  - **TopBar** — search box with an inline search icon; wired in the shared **Avatar** (letter avatar) plus the current user's name.
  - Added Storybook stories: `Layout/Sidebar`, `Layout/TopBar`, `Layout/AppShell` (full-shell preview). `tsc --noEmit` + `build-storybook` both clean.
- To commit: `Sidebar.tsx` + `TopBar.tsx` (modified) and 3 new `layout/*.stories.tsx`.

**Day 1 status: COMPLETE ✅** — UI kit ✅ · TicketCard ✅ · shell visuals ✅.

### 2026-07-15 — Day 1

**Completed:**
- Verified Soham's **Phase 0** foundation is in place — tooling swap to react-bootstrap + theme/palette, Redux store + typed hooks + `authSlice`/`ticketsSlice` stubs, shared `types`, `constants`, `lib/api.ts` + `lib/mockData.ts`, app-shell skeletons, and Storybook init.
- Built the shared **UI component library** in Storybook — every component has a story; `tsc --noEmit` and `build-storybook` both clean:
  - Leaf components: **PriorityBolt** (priority-as-bolt), **Avatar** (letter avatar), **CategoryTag** (issue-style pill)
  - react-bootstrap wrappers: **Button** (adds a `loading` state), **Badge**, **Modal** (title/body/footer slots)
  - Shared **TicketCard** — composes PriorityBolt + CategoryTag + Avatar; takes resolved `categoryName`/`assigneeName`, plus an `onClick` and an `actions` slot so board & queue reuse it.
- Fixed a Phase 0 gap: created `frontend/public/` so Storybook's `staticDirs` resolves (build was failing without it).
- Wrote the **TicketCard props contract** and handed it to Soham (his `/board` consumes the card).
- Committed to `main`: `3eceb7e` (leaf components + TicketCard + `public/`), `6b88233` (Button/Badge/Modal wrappers).

**Carried over (still Day 1 scope):**
- **Shell visuals** — restyle `Sidebar` + `TopBar` and wire in the new `Avatar`. Gated on confirming Soham is clear of `components/layout/` (his Phase 0 files).

**Day 1 status:** UI kit ✅ · TicketCard ✅ · shell visuals ⏳ pending.

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
POST   /api/auth/login              -> { token, user }
GET    /api/me                      -> current user (from JWT)

GET    /api/tickets                 -> all tickets (board view); supports ?status= &priority= &assigned_to=
POST   /api/tickets                 -> create ticket (agent only)
PATCH  /api/tickets/{id}            -> update status / assignee / priority
GET    /api/tickets/mine            -> developer's own queue (from JWT)

GET    /api/categories              -> list categories
GET    /api/employees?role=developer-> for the assignee picker
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