# BountyTimer

**Focus. Earn. Rest. Repeat.**

A personal productivity PWA that ties focused work to guilt-free rest. Every
task carries a **time bounty** — completing it deposits break time into your
**Break Bank**, which you spend on countdown breaks. A per-task stopwatch records
how long work actually took versus your estimate, building a focus dataset over
time.

Built from [`BountyTimer-PRD.md`](./BountyTimer-PRD.md).

## Stack

- **Frontend:** React + TypeScript + Vite, installable PWA (service worker +
  manifest), calm navy/teal theme. State in a pure reducer, persisted to
  `localStorage`.
- **Backend (optional):** Node + Express + Postgres — JWT/bcrypt auth and
  per-user state sync. The app runs fully local until `VITE_API_URL` is set.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173  (local-only mode)
npm run build        # production build
npm run icons        # regenerate PWA icons
```

For cross-device sync and deployment, see [`SETUP.md`](./SETUP.md) and
[`server/README.md`](./server/README.md).

## Features (by milestone)

| Milestone | What shipped |
|-----------|--------------|
| M1 | Task list, per-task stopwatch (single-runner rule), bounty logic |
| M2 | Break Bank, take-a-break countdown, extend/early-return, reset |
| M3 | Backend auth + cross-device state sync |
| M4 | PWA install, service worker, offline handling, notifications |
| M5 | Daily summary, trend charts, task log, CSV export |
| M6 | Bank tick-up animation, onboarding, error boundary, drag-reorder |

## Project layout

```
src/            React PWA frontend
  state/        reducer, store, auth, selectors, analytics
  components/   UI building blocks (cards, charts, dialogs)
  views/        Tasks · Bank · History · Auth
  utils/        time, notifications, online status, SW registration
server/         Node/Express/Postgres API (auth + sync)
scripts/        icon generator
```

## Status & known gaps

See the **Flags & Decisions** summary in the build notes. Notable v1 scoping:
backend uses a JSONB state snapshot (not the fully normalized PRD §8 schema);
real-time push uses debounced polling-style sync rather than websockets; PWA
icons are generated placeholders. None block local use.
