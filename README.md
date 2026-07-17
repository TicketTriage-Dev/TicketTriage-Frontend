# TicketMatchr

A small Jira-style internal ticket triage tool. **Agents** raise tickets and assign them to
**developers**; developers work their queue across three states (To do → In progress → Done).
Demo data is themed around GuestMatchr (a podcast guest–host matching platform).

> **This repo is the FRONTEND.** The PHP/MySQL backend is a separate repo; it's documented here
> only so the API client and types match.

## Run it

```bash
cd frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL (+ NEXT_PUBLIC_USE_MOCK)
npm run dev                  # http://localhost:3000
```

Set `NEXT_PUBLIC_USE_MOCK=true` to run entirely on in-repo mock data with no backend. See
[`frontend/README.md`](frontend/README.md) for details.

## Stack

Next.js (App Router) + TypeScript · Redux Toolkit · react-bootstrap (navy/gold theme) · Storybook ·
a typed API client with a backend adapter + mock fallback. Auth is cookie-based (httpOnly access +
refresh tokens); the client keeps no token in JS.

## Docs

| File | What |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Canonical brief — scope, palette, data model, live API contract. |
| [`FRONTEND_WORKPLAN.md`](FRONTEND_WORKPLAN.md) | Who-owns-what (Soham + Parinita) + Day-3 remaining. |
| [`frontend/docs/ARCHITECTURE.md`](frontend/docs/ARCHITECTURE.md) | File-by-file map of the frontend. |
| `Soham_CLAUDE.md` / `Parinita_CLAUDE.md` | Per-person progress logs + handoff notes. |
