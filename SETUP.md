# BountyTimer — Setup & Deployment

BountyTimer runs in two modes:

- **Browser-only** (default): no backend, no sign-in. All data lives in the
  browser via `localStorage` and persists between sessions on that device.
  This is the recommended way to run the app.
- **Synced** (optional): set `VITE_API_URL` to a deployed API. The app then
  requires sign-in and syncs across devices (PRD §5).

## Browser-only (default)

```bash
npm install
npm run dev          # http://localhost:5173 — runs fully in the browser
npm run build        # static bundle in dist/, hostable anywhere
npm run preview      # serve the production build locally
```

No environment variables, database, or server are required. To deploy, host the
static `dist/` output on any static host (Vercel, Netlify, GitHub Pages, S3, …).

### Deploy to GitHub Pages (branch / `docs/` folder)

GitHub Pages serves files **as-is with no build step**, but this is a compiled
app — so the *built* output (not the source) must be committed and served. A
project site is also served from a subpath (`https://<user>.github.io/<repo>/`),
so the build must use that subpath as its base or every asset 404s and the page
loads blank. The prebuilt site lives in [`docs/`](./docs) for exactly this.

**To deploy / redeploy:**

1. Rebuild the `docs/` folder (bakes in the `/timer/` base, copies the static
   output, adds `.nojekyll` and an SPA `404.html`):

   ```bash
   npm run build:pages
   ```

   > Note: the base `/timer/` is hard-coded in this script to match the repo
   > name. If you rename the repo, update it (and the `start_url` is already
   > relative, so it needs no change).

2. Commit and push `docs/` to `main`.

3. One-time setup: in the repo, go to **Settings → Pages → Build and
   deployment**, set **Source = "Deploy from a branch"**, then choose
   **Branch = `main`** and **Folder = `/docs`**, and Save.

Pages publishes the contents of `docs/` at `https://<user>.github.io/<repo>/`.
No GitHub Actions required.

**Deploying to a root host instead** (Vercel, Netlify, a custom domain, or a
`<user>.github.io` *user* site): just run `npm run build` and serve `dist/` —
the default base is `/`.

Everything below is **only** needed if you want optional cross-device sync.

## Optional: enable cross-device sync

To sync across devices, deploy the backend (below) and create `.env.local`:

```
VITE_API_URL=https://your-api.example.com
```

Leaving this unset keeps the app browser-only.

## Backend (optional)

See `server/README.md`. Quick local run (needs Postgres):

```bash
cd server
cp .env.example .env          # set DATABASE_URL + JWT_SECRET
npm install && npm run migrate && npm start
```

---

## 🚩 OPTIONAL ACTIONS (only for cross-device sync)

None of these are needed for the default browser-only app. They apply only if
you chose to enable sync, and need your accounts/credentials and external
dashboards:

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

Until steps 1–3 are done, the app runs perfectly in the default browser-only
mode.
