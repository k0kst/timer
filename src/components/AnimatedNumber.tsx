import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  format: (n: number) => string
  durationMs?: number
}

/**
 * Tween a number toward `value` with requestAnimationFrame. This powers the
 * one expressive animated moment in the app: the bank balance ticking up on
 * task completion (PRD §6.3). Respects prefers-reduced-motion.
 */
export function AnimatedNumber({ value, format, durationMs = 650 }: Props) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const from = fromRef.current
    if (reduce || from === value) {
      fromRef.current = value
      setDisplay(value)
      return
    }
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(from + (value - from) * eased)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = value
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      fromRef.current = value
    }
  }, [value, durationMs])

  return <>{format(display)}</>
}
