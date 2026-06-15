import { useState } from 'react'
import { Modal } from './Modal'

const SEEN_KEY = 'bountytimer:onboarded'

export function hasOnboarded(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return true
  }
}

const steps = [
  {
    icon: '🎯',
    title: 'Every task carries a bounty',
    body: 'Set how much break time a task is worth. Estimate the time, and the bounty defaults to match — adjust it whenever you like.',
  },
  {
    icon: '⏱️',
    title: 'The stopwatch tracks the truth',
    body: 'Start the timer when you begin. It records how long work actually took, so you can compare it against your estimate over time.',
  },
  {
    icon: '🏦',
    title: 'Completing tasks earns rest',
    body: 'Finish a task and its bounty lands in your Break Bank. Spend it on a guilt-free countdown break whenever you’ve earned it.',
  },
]

/** First-run onboarding explaining the bounty mechanic (PRD §6, M6). */
export function Onboarding({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0)
  const last = i === steps.length - 1
  const step = steps[i]

  const finish = () => {
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* ignore */
    }
    onClose()
  }

  return (
    <Modal onClose={finish}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 6 }}>{step.icon}</div>
        <h3 style={{ marginBottom: 8 }}>{step.title}</h3>
        <p className="hint" style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 18 }}>
          {step.body}
        </p>
        <div className="dots">
          {steps.map((_, idx) => (
            <span key={idx} className={idx === i ? 'dot active' : 'dot'} />
          ))}
        </div>
        <div className="btn-row" style={{ marginTop: 18 }}>
          {!last ? (
            <>
              <button className="btn primary" style={{ flex: 1 }} onClick={() => setI(i + 1)}>
                Next
              </button>
              <button className="btn ghost" onClick={finish}>
                Skip
              </button>
            </>
          ) : (
            <button className="btn primary" style={{ flex: 1 }} onClick={finish}>
              Let’s go
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
