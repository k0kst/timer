import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal typing for the one build-time env var we read, so the config
// type-checks without depending on @types/node.
declare const process: { env: Record<string, string | undefined> }

// https://vitejs.dev/config/
//
// `base` controls the public path the built assets are served from. It must
// match where the site is hosted:
//   - root domain / Vercel / custom domain  → '/'  (the default)
//   - GitHub Pages project site             → '/<repo>/'
// Set it at build time via VITE_BASE, e.g. `VITE_BASE=/timer/ npm run build`.
// The Pages workflow injects this automatically.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
})
