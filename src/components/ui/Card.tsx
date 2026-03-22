import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
  accent?: 'blue' | 'green' | 'yellow' | 'red' | 'none'
}

const accentClasses: Record<string, string> = {
  blue: 'border-l-4 border-l-[var(--color-primary)]',
  green: 'border-l-4 border-l-[var(--color-success)]',
  yellow: 'border-l-4 border-l-[var(--color-warning)]',
  red: 'border-l-4 border-l-[var(--color-error)]',
  none: '',
}

export default function Card({ title, subtitle, children, footer, className = '', accent = 'none' }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-[var(--shadow-md)] border border-[var(--color-border)]/60 hover:shadow-[var(--shadow-lg)] transition-all duration-200 ${accentClasses[accent]} ${className}`}>
      {(title || subtitle) && (
        <div className="px-4 pt-4 pb-0">
          {title && <h2 className="text-lg font-bold text-[var(--color-text)]">{title}</h2>}
          {subtitle && <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-[var(--color-border)]/60 bg-gray-50/50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  )
}
