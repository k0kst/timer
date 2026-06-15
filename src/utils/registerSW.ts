// Registers the service worker in production builds. In dev we skip it so
// hot-module reloading isn't fighting a cache.

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  if (import.meta.env.DEV) return
  // Register relative to the app's base path so the worker and its scope are
  // correct whether the app is hosted at the domain root or under a subpath
  // (e.g. GitHub Pages project sites). BASE_URL always ends with '/'.
  const base = import.meta.env.BASE_URL
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .catch((err) => console.error('SW registration failed', err))
  })
}
