import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
  accent?: 'blue' | 'green' | 'yellow' | 'red' | 'none'
}

export default function Card({ title, subtitle, children, footer, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg border border-[var(--color-border)] ${className}`}>
      {(title || subtitle) && (
        <div className="px-5 pt-4 pb-0">
          {title && <h2 className="text-base font-semibold text-[var(--color-text)]">{title}</h2>}
          {subtitle && <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-[var(--color-border)]">
          {footer}
        </div>
      )}
    </div>
  )
}
