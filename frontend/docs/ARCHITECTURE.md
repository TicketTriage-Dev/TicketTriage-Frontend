# TicketMatchr Frontend — Architecture

> A file-by-file map of the frontend: what each piece is and why it exists.
> For scope, palette, and the API contract see the root [`CLAUDE.md`](../../CLAUDE.md);
> for the who-builds-what split see [`FRONTEND_WORKPLAN.md`](../../FRONTEND_WORKPLAN.md).

**Stack:** Next.js (App Router) + TypeScript · Redux Toolkit · react-bootstrap (themed to a
navy/gold palette) · Storybook · a typed API client with a mock-data fallback.

---

## How data flows

```
Component → Redux thunk (slice) → api.ts → { real fetch  | mock layer }
                                              (cookies)     (mockData.ts)
```

- Components never call `fetch` directly — they dispatch thunks or read the store.
- `lib/api.ts` is the ONLY place with network logic. It picks the real backend or the mock
  layer based on `NEXT_PUBLIC_USE_MOCK`, so nothing else changes when the backend comes online.
- Auth is **cookie-based** (httpOnly `access_token` + `refresh_token`); no token is kept in JS.

---

## Directory layout

```
frontend/
  .env.local / .env.example   env config (backend URL + mock toggle)
  .storybook/                 Storybook config
  docs/ARCHITECTURE.md        this file
  src/
    app/                      routes (App Router)
    components/               UI, split by area
    constants/                enums & fixed lists
    hooks/                    reusable hooks (empty for now)
    lib/                      API client + mock data
    store/                    Redux store + slices
    styles/                   theme
    types/                    shared TypeScript types
```

---

## File-by-file

### Config (`frontend/`)

| File | What / why |
|---|---|
| `package.json` | Dependencies + scripts (`dev`, `build`, `storybook`). |
| `tsconfig.json` | TypeScript config; defines the `@/*` → `src/*` import alias. |
| `next.config.ts` | Next.js config (React Compiler on). |
| `eslint.config.mjs` | Lint rules (Next + Storybook presets). |
| `.env.local` | **Gitignored.** Local backend URL + `NEXT_PUBLIC_USE_MOCK`. |
| `.env.example` | Committed template of the env vars for teammates to copy. |
| `next-env.d.ts` | Auto-generated Next type shims — do not edit. |

### Routing (`src/app/`)

| File | What / why |
|---|---|
| `layout.tsx` | Root layout. Loads Bootstrap CSS + `theme.scss`, sets up the three fonts, mounts the Redux `<Providers>`. Wraps every page. |
| `page.tsx` | `/` route — redirects to `/login`. |
| `login/page.tsx` | `/login` — branded card hosting the login form. |
| `board/page.tsx` | `/board` — the Kanban triage board (3 columns). Agents get create + assign; everyone views. Wrapped in `RouteGuard` + `AppShell`. |
| `queue/`, `team/`, `settings/` | Route folders for pages still to be built. |

### Types & constants

| File | What / why |
|---|---|
| `types/index.ts` | All shared types: `Employee`/`User`, `Category`, `Ticket`, input types, `Role`/`TicketStatus`/`Priority`, and the `ApiEnvelope<T>` shape. The shared contract between components and the API. |
| `constants/index.ts` | Fixed lists: statuses, priorities (+ bolt counts), categories, sidebar nav items, `HOME_BY_ROLE` (role → landing page). Avoids magic strings. |

### Data layer (`src/lib/`)

| File | What / why |
|---|---|
| `api.ts` | The single typed API client: fetch wrapper, cookie auth (`credentials:"include"`), `{status,msg,data}` envelope parsing, error handling, and the **refresh-token interceptor** (on 401 → refresh once → replay; single-flight guard prevents loops). `endpoint(real, mock)` selects transport. |
| `mockData.ts` | GuestMatchr-themed fixtures (employees, categories, 8 tickets) so the app runs with no backend. |

### State (`src/store/`)

| File | What / why |
|---|---|
| `index.ts` | Configures the store, combines slices, exports `RootState`/`AppDispatch`. |
| `hooks.ts` | Typed `useAppDispatch` / `useAppSelector`. |
| `Providers.tsx` | Client component wrapping the app in the Redux `<Provider>`. |
| `authSlice.ts` | Auth state + `login` / `logout` / `restoreSession` thunks. Session = `user` set (no token in state). |
| `ticketsSlice.ts` | Ticket state + `fetchTickets` / `createTicket` / `patchTicket` thunks and selectors (`selectByStatus` for the board columns, `selectMyTickets` for the queue). |

### Styling (`src/styles/`)

| File | What / why |
|---|---|
| `theme.scss` | Retheme of Bootstrap to the navy/gold palette via CSS variables; font wiring; button recoloring. Brand in one place. |

### Layout components (`src/components/layout/`)

| File | What / why |
|---|---|
| `AppShell.tsx` | Shared frame: sidebar + top bar + scrollable content. Every authenticated page uses it. |
| `Sidebar.tsx` | Navy left nav, gold active state, hand-drawn icons. |
| `TopBar.tsx` | Search box + current-user `Avatar`. |

### Reusable UI kit (`src/components/ui/`)

| File | What / why |
|---|---|
| `Avatar.tsx` | Letter avatar (initials in a circle). |
| `Button.tsx` | react-bootstrap Button + a `loading` spinner state. |
| `Badge.tsx` | Badge wrapper defaulting to the navy brand color. |
| `Modal.tsx` | Modal wrapper standardizing title/body/footer. |
| `*.stories.tsx` | Storybook stories — each component in isolation with its variants. |

### Ticket components (`src/components/tickets/`)

| File | What / why |
|---|---|
| `PriorityBolt.tsx` | Signature element: 1/2/3 gold bolts for normal/urgent/severe. |
| `CategoryTag.tsx` | GitHub-issue-style category pill. |
| `TicketCard.tsx` | Shared card (ID, title, category, bolts, estimate, assignee) used by both board & queue; has an `actions` slot for per-surface controls. |
| `*.stories.tsx` | Their Storybook stories. |

### Board components (`src/components/board/`)

| File | What / why |
|---|---|
| `BoardColumn.tsx` | One Kanban column — a titled, counted stack of `TicketCard`s with an empty state. |
| `AssigneeDropdown.tsx` | Agent control on a card: reassign the developer → `patchTicket` (PATCH). |
| `CreateTicketPanel.tsx` | Agent-only modal form (title/description/category/priority/assignee/estimate) → `createTicket` (POST). |

### Auth components (`src/components/auth/`)

| File | What / why |
|---|---|
| `LoginForm.tsx` | Email/password form; dispatches `login`, redirects by role on success. |
| `RouteGuard.tsx` | Wraps protected pages: restores the session on load, redirects unauth → `/login`, optional role gating. |

### Storybook (`.storybook/`)

| File | What / why |
|---|---|
| `main.ts` | Storybook config (story globs, addons). |
| `preview.tsx` | Loads Bootstrap CSS + `theme.scss` so stories render on-brand. |

---

## Known extras (from `npx storybook init`, safe to trim)

- `src/stories/` — Storybook's demo examples (Button/Header/Page + assets). Not used by the app.
- `vitest.config.ts`, `vitest.shims.d.ts` — a browser component-testing rig; optional for this project.
- `debug-storybook.log`, `tsconfig.tsbuildinfo` — logs/caches (gitignored).

---

## Conventions

- Interactive components are client components (`"use client"`).
- Import shared components from `@/components/...`; never re-create a button/card/avatar.
- One file = one owner (see the workplan). Shared foundation (`types`, `lib`, `store`) is
  coordinated, not edited ad hoc.
- Add a new endpoint in `api.ts` only — pair a real call with a mock in `endpoint(real, mock)`.
