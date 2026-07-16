# TicketMatchr Frontend — Work Split (Soham + Parinita)

> How the two of us divide the frontend so we don't collide, duplicate files, or block
> each other. Backend is a separate person and not ready yet — **we build against mock
> data**, so the frontend is fully independent.
>
> Stack (decided): **Next.js (App Router) + TypeScript + Redux Toolkit + react-bootstrap +
> Storybook.** Tailwind is being removed (react-bootstrap replaces it).

---

## The golden rules (read first)

1. **Foundation lands before anyone builds a feature.** One person builds the shared base
   (below) and pushes to `main`. Only then do we branch off and work in parallel.
2. **One file = one owner.** If you need to change a file someone else owns, ask them / do it
   in their branch. The only shared file we both touch is `store/index.ts`, and it's stubbed
   up front so we rarely edit it.
3. **Contracts are agreed before implementation.** Types, the API/mock function signatures,
   the Redux state shape, and shared component props are all defined in the foundation. After
   that we code against the interface, even if the other person's part isn't done yet.
4. **Feature branches per person**, small PRs into `main`, review each other. Pull `main` every
   morning, push end of day.
5. **Shared components are built once, in `components/ui` + `components/tickets`.** Parinita owns
   them; Soham imports them — nobody re-creates a button or a card.

---

## Phase 0 — Foundation (Soham, solo, ~half day) — DO THIS FIRST

Nobody starts their feature until this is pushed. Deliverables:

- **Tooling swap:** remove Tailwind (config, `@import "tailwindcss"`, deps), add react-bootstrap
  + bootstrap CSS, add a custom theme in `src/styles/` — palette: navy `#001F3F` (brand/primary),
  gold `#C5A059` (accent / priority bolts), white `#FFFFFF` (surfaces), light gray `#E5E5E5`
  (borders/dividers); fonts Space Grotesk / Inter / JetBrains Mono. See CLAUDE.md §3.
- **Redux store:** `src/store/index.ts` with the store + `<Provider>` wired into `app/layout.tsx`,
  plus typed hooks (`useAppDispatch`, `useAppSelector`). Register **two empty slice stubs**:
  `authSlice`, `ticketsSlice` (each owner fills their own file later).
- **Types:** `src/types/index.ts` — `Ticket`, `Employee`, `Category`, `User`, `ApiEnvelope<T>`
  (the real backend envelope `{ status, msg, data }`). *Updated 2026-07-16 to match Nishita's API;
  `Employee`/`User` now use `id`/`name`/`designation`.*
- **Constants:** `src/constants/index.ts` — statuses, priorities, category list, sidebar nav items.
- **API + mock layer:** `src/lib/api.ts` (fetch wrapper: base URL, auth header, envelope parsing,
  error handling) **and** `src/lib/mockData.ts` (fixtures: ~8 GuestMatchr tickets, employees,
  categories) so both of us develop with no backend.
- **App shell skeleton:** `components/layout/AppShell`, `Sidebar`, `TopBar` as static placeholders
  (Parinita styles/fills them later).
- **Storybook init** so Parinita can start immediately.

> While Soham does Phase 0, **Parinita can start now** on pure presentational leaf components in
> Storybook that need no store/api: `PriorityBolt`, `Avatar`, `CategoryTag`. They're driven only
> by props, so they won't touch anything Soham is building.

---

## Phase 1+ — Parallel tracks

### Soham — Auth + Board (the agent flow)

Owns: `store/authSlice.ts`, `store/ticketsSlice.ts`, `app/login/`, `app/board/`,
`components/auth/`, `components/board/`.

> **Status (2026-07-16):** the auth vertical is DONE against Nishita's real cookie-based API —
> `authSlice` (login/logout/restoreSession), `/login`, `LoginForm`, `RouteGuard`, and the
> `lib/api.ts` refresh interceptor. **`ticketsSlice` + `/board` are still pending**, so Parinita's
> `/queue` reads tickets through the mock `api.*` methods for now (swap to the slice when it lands).

- `authSlice` — login/logout/restoreSession thunks, current user. **Cookie-based** sessions (no
  localStorage token); a refresh interceptor in `lib/api.ts` retries once on a 401 and replays.
- `/login` page + `LoginForm` — email/password, calls login, redirects by role.
- Route guard / redirect-by-role helper.
- `ticketsSlice` — `fetchTickets`, `createTicket`, `patchTicket` thunks + selectors (grouped by
  status). *Owns this slice because both board & queue read it — expose clean selectors.*
- `/board` — Kanban 3 columns (To do / In progress / Done), grouping tickets by status.
- `CreateTicketPanel` (POST) + `AssigneeDropdown` (PATCH) — agent-only.

### Parinita — Component library + Queue (the developer flow)

Owns: `components/ui/`, `components/tickets/`, Storybook stories, `app/queue/`, `app/team/`,
`app/settings/`, and finishing the shell (`Sidebar`/`TopBar` visuals).

- **UI kit (with a Storybook story each):** `PriorityBolt`, `Avatar`, `CategoryTag`, `Badge`,
  `Button`/wrappers over react-bootstrap, `Modal`/`Panel`.
- **`TicketCard`** — the shared card (ID, title, category tag, priority bolts, estimate, assignee
  avatar). Build this early — Soham's board and your queue both use it.
- Shell visuals: `Sidebar` nav (Board / My queue / Team / Settings), `TopBar` search + letter
  avatar.
- `/queue` — developer's own assigned tickets + `StatusControl` (uses `ticketsSlice.patchTicket`
  + a `selectMyTickets` selector — agree the selector name with Soham up front).
- `/team` + `/settings` — simple placeholder pages.
- Shared empty / loading / error state components.

---

## Dependency handshakes (agree these in Phase 0 so nobody is blocked)

| Interface | Owner | Consumer needs |
|---|---|---|
| `Ticket` / `Employee` / `Category` types | Soham (foundation) | both |
| `ticketsSlice` state shape + selector names (`selectMyTickets`, `selectByStatus`) | Soham | Parinita's `/queue` |
| `patchTicket(id, patch)` thunk signature | Soham | Parinita's `StatusControl` |
| `TicketCard` props | Parinita | Soham's `/board` |
| `mockData` shape | Soham (foundation) | both |

If an interface isn't ready, stub it and keep going — swap the real one in when it lands.

---

## Suggested day mapping (matches CLAUDE.md build order)

- **Day 1:** Soham → Phase 0 foundation + `authSlice` + `/login`. Parinita → UI kit leaf
  components + `TicketCard` in Storybook + shell visuals.
- **Day 2:** Soham → `ticketsSlice` + `/board` + create/assign. Parinita → `/queue` + status
  controls, wire against mock data.
- **Day 3:** both → empty/error/loading states, validation, responsive/keyboard polish, swap
  mock layer for the real API once backend is up, README + demo rehearsal.

---

## Notes / gotchas

- react-bootstrap interactive components must be **client components** — add `"use client"`.
- Import bootstrap CSS once in `app/layout.tsx`; keep custom overrides in `src/styles/`.
- Keep `node_modules` out of git (already in `.gitignore`).
- The `.gitkeep` files disappear as real files land in each folder — that's expected.
