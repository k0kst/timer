# BountyTimer API

Node + Express + Postgres backend providing authentication and cross-device
state sync for BountyTimer (PRD §5).

## KEY DECISION (flagged for review)

PRD §5.3 offers **Supabase Auth or custom JWT**. This server implements
**custom JWT + bcrypt against plain Postgres** (the "Node.js + Express on
Railway/Render" row of the recommended stack). Rationale: self-contained,
portable across Supabase/Railway/Render, and no vendor lock-in for a solo tool.

PRD §8 specifies a fully **normalized** schema. For v1 this server syncs the
client `AppState` as a **JSONB snapshot per user** (`user_state` table) with an
optimistic `version` for last-write-wins conflict handling. This is a deliberate
simplification suited to a single-user-per-account tool; it makes cross-device
sync work end-to-end immediately. The normalized PRD §8 schema is the documented
migration target (see `schema.sql`).

If you'd prefer Supabase Auth or the fully normalized schema for v1, say so and
I'll switch.

## Run locally

```bash
cd server
cp .env.example .env        # set DATABASE_URL + JWT_SECRET
npm install
npm run migrate             # apply schema.sql
npm start                   # http://localhost:4000
```

## Endpoints

| Method | Path             | Auth | Purpose                                  |
|--------|------------------|------|------------------------------------------|
| GET    | `/health`        | —    | Liveness check                           |
| POST   | `/auth/register` | —    | Create account → `{ token, username }`   |
| POST   | `/auth/login`    | —    | Sign in → `{ token, username }`          |
| GET    | `/state`         | JWT  | Fetch `{ state, version }`               |
| PUT    | `/state`         | JWT  | Save `{ state, baseVersion }` → `version`|

## Deploy (ACTION REQUIRED — see repo root SETUP.md)

1. Provision Postgres (Supabase free tier recommended).
2. Deploy via the **Render Blueprint** (`render.yaml` at the repo root):
   New → Blueprint → pick this repo. `JWT_SECRET` is auto-generated; paste your
   `DATABASE_URL` when prompted.
3. Set `VITE_API_URL` in the frontend to the deployed API origin.

The schema is applied automatically on every boot via the `prestart` script
(idempotent `CREATE ... IF NOT EXISTS`), so **no manual migrate / Shell step is
required** — important since Render's free tier has no Shell. To migrate by hand
against any database you can still run `npm run migrate`.
