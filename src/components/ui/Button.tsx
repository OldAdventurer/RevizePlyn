import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  children: ReactNode
}

const variantClasses: Record<string, string> = {
  primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)]',
  secondary: 'bg-white border border-[var(--color-border)] text-[var(--color-text)] hover:bg-gray-50',
  danger: 'bg-[var(--color-error)] text-white hover:bg-red-700',
  ghost: 'bg-transparent text-[var(--color-text)] hover:bg-gray-100',
}

const sizeClasses: Record<string, string> = {
  sm: 'min-h-[36px] px-3 py-1.5 text-sm',
  md: 'min-h-[44px] px-4 py-2 text-base',
  lg: 'min-h-[48px] px-5 py-2.5 text-lg',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
