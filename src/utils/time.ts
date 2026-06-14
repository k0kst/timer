// Time formatting helpers.

/** Format a number of seconds as HH:MM:SS (PRD §4.1.3). */
export function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(sec)}`
}

/**
 * Format minutes for the Break Bank balance.
 * Uses H:MM above an hour, otherwise MM:SS-style M min (PRD §4.2.1).
 */
export function formatBankMins(totalMins: number): string {
  const mins = Math.max(0, Math.round(totalMins))
  if (mins >= 60) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}:${m.toString().padStart(2, '0')}`
  }
  return `${mins} min`
}

/** Human label like "1h 30m", "45m", or "0m". */
export function formatDuration(totalMins: number): string {
  const mins = Math.max(0, Math.round(totalMins))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

/** Live elapsed seconds for a task given accumulated time and an optional run start. */
export function liveElapsedSeconds(
  accumulatedSeconds: number,
  runningSince: string | null,
  now: number = Date.now(),
): number {
  if (!runningSince) return accumulatedSeconds
  const delta = Math.floor((now - new Date(runningSince).getTime()) / 1000)
  return accumulatedSeconds + Math.max(0, delta)
}

/** Whether two ISO timestamps fall on the same calendar day (local time). */
export function isSameDay(iso: string, ref: Date = new Date()): boolean {
  const d = new Date(iso)
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  )
}

/** A short, dependency-free unique id. */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
