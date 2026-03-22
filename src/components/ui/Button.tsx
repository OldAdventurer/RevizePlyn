import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  children: ReactNode
}

const variantClasses: Record<string, string> = {
  primary: 'bg-gradient-to-b from-[var(--color-primary-light)] to-[var(--color-primary)] text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:brightness-110 active:brightness-95',
  secondary: 'bg-white border border-[var(--color-border)] text-[var(--color-text)] shadow-sm hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100',
  danger: 'bg-gradient-to-b from-red-500 to-[var(--color-error)] text-white shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 hover:brightness-110',
  ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-gray-100 hover:text-[var(--color-text)]',
  success: 'bg-gradient-to-b from-emerald-400 to-[var(--color-success)] text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:brightness-110',
}

const sizeClasses: Record<string, string> = {
  sm: 'min-h-[36px] px-3.5 py-1.5 text-sm rounded-lg',
  md: 'min-h-[44px] px-5 py-2.5 text-base rounded-xl',
  lg: 'min-h-[52px] px-6 py-3 text-lg rounded-xl',
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
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
