import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  onClose: () => void
  children: ReactNode
}

/** A simple bottom-sheet (mobile) / centred (desktop) modal. */
export function Modal({ onClose, children }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
