# TicketMatchr — Frontend

Next.js (App Router) + TypeScript + Tailwind CSS frontend for the TicketMatchr
ticket triage tool. See [`../CLAUDE.md`](../CLAUDE.md) for the full project brief.

## Getting started

```bash
npm install
cp .env.example .env.local   # then edit .env.local (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root redirects to `/login`.

### Environment (`.env.local`)

```
BACKEND_ORIGIN=<backend-base-url>/ticketTriage   # e.g. a Cloudflare tunnel URL
NEXT_PUBLIC_API_URL=/backend                     # calls go through the same-origin dev proxy
NEXT_PUBLIC_USE_MOCK=false                        # true = run entirely on mock data, no backend
```

The app calls the relative `/backend/*`, which `next.config.ts` proxies to `BACKEND_ORIGIN`
server-side. This keeps the backend's `SameSite=Lax` auth cookies working in dev (same-origin) —
no CORS setup needed. Set `NEXT_PUBLIC_USE_MOCK=true` to develop with no backend at all.
Restart `npm run dev` after any `.env.local` change.

## Structure

```
src/
  app/            App Router pages: login, board, queue, team, settings
  components/     UI by area: auth, layout, board, tickets, ui
  lib/            Typed API client (fetch + auth header + error handling)
  hooks/          Reusable hooks
  store/          Client/session state
  constants/      Statuses, priorities, categories
  types/          Shared TS types (Ticket, Employee, Category, API envelope)
  styles/         Global styles / fonts
```
