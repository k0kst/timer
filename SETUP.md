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
2. **Deploy the API.** Push `server/` to Railway or Render. Set env vars
   `DATABASE_URL` and a strong random `JWT_SECRET`. Run `npm run migrate` once.
3. **Deploy the frontend.** Connect this repo to Vercel. Set
   `VITE_API_URL` to your deployed API origin.
4. **Generate PWA icons.** Replace the placeholder icons in `public/` with real
   192px and 512px PNGs (see M4 / `public/README.md`).
5. **(Optional) Email recovery.** Wire an email provider if you want password
   reset; the schema already reserves an optional `email` field.

Until steps 1–3 are done, the app runs perfectly in local-only mode.
