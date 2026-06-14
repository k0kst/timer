// Registers the service worker in production builds. In dev we skip it so
// hot-module reloading isn't fighting a cache.

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  if (import.meta.env.DEV) return
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.error('SW registration failed', err))
  })
}
