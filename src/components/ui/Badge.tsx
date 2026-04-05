import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'indigo' | 'emerald' | 'orange'
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
}

const variantClasses: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-emerald-50 text-emerald-700',
  yellow: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  gray: 'bg-neutral-100 text-neutral-600',
  indigo: 'bg-indigo-50 text-indigo-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  orange: 'bg-orange-50 text-orange-700',
}

export default function Badge({ variant = 'blue', size = 'sm', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-md font-medium ${
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-sm'
    } ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}
