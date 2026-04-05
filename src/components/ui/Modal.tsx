import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => { document.removeEventListener('keydown', handleEscape); document.body.style.overflow = '' }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center animate-[fadeIn_0.15s_ease-out]">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative bg-white w-full md:max-w-lg rounded-t-lg md:rounded-lg border border-[var(--color-border)] flex flex-col z-10 max-h-[90vh] md:max-h-[80vh] focus:outline-none shadow-xl"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)] shrink-0">
          <h2 className="text-base font-semibold text-[var(--color-text)]">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer text-[var(--color-text-secondary)]" aria-label="Zavřít">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-[var(--color-border)] flex justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
