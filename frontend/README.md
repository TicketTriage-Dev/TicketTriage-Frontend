# TicketMatchr — Frontend

Next.js (App Router) + TypeScript + Tailwind CSS frontend for the TicketMatchr
ticket triage tool. See [`../CLAUDE.md`](../CLAUDE.md) for the full project brief.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root redirects to `/login`.

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
