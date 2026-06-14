// Thin wrapper over the browser Notification API (PRD §5.3, §4.2.2).
// Falls back gracefully when notifications are unavailable or denied.

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

/** Fire a notification if permitted; returns true if shown natively. */
export function notify(title: string, body?: string): boolean {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false
  try {
    new Notification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png' })
    return true
  } catch {
    return false
  }
}
