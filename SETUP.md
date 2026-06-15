# BountyTimer — Setup & Deployment

BountyTimer runs in two modes:

- **Local-only** (default): no backend. All data lives in the browser via
  `localStorage`. Just run the frontend — great for trying the core mechanic.
- **Synced**: set `VITE_API_URL` to a deployed API. The app then requires
  sign-in and syncs across devices (PRD §5).

## Frontend (local dev)

```bash
npm install
npm run dev          # http://localhost:5173
```

To enable sync against a backend, create `.env.local`:

```
VITE_API_URL=https://your-api.example.com
```

## Backend

See `server/README.md`. Quick local run (needs Postgres):

```bash
cd server
cp .env.example .env          # set DATABASE_URL + JWT_SECRET
npm install && npm run migrate && npm start
```

---

## 🚩 ACTIONS REQUIRED BY YOU (cannot be automated from here)

These need your accounts/credentials and external dashboards:

1. **Provision a database.** Create a free Supabase project (or any Postgres).
   Copy its connection string.
2. **Deploy the API.** In Render: **New → Blueprint → pick this repo** (uses
   `render.yaml`). It sets the service up automatically, **generates
   `JWT_SECRET` for you**, and prompts you to paste the `DATABASE_URL` from
   step 1. The database schema is applied **automatically on boot** — no Shell
   access or manual migrate step is needed (Render's free tier has no Shell).
3. **Deploy the frontend.** Import this repo into Vercel (it auto-detects Vite).
   Add one Environment Variable: `VITE_API_URL` = your deployed API origin.
4. **(Optional) Replace PWA icons.** Swap the generated placeholder PNGs in
   `public/` for branded art, or run `npm run icons` to regenerate.
5. **(Optional) Email recovery.** Wire an email provider if you want password
   reset; the schema already reserves an optional `email` field.

Until steps 1–3 are done, the app runs perfectly in local-only mode.
