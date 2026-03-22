import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export default function Card({ title, children, footer, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-[var(--color-border)] ${className}`}>
      {title && (
        <div className="px-5 pt-5">
          <h2 className="text-xl font-bold text-[var(--color-text)]">{title}</h2>
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-4 border-t border-[var(--color-border)]">
          {footer}
        </div>
      )}
    </div>
  )
}
