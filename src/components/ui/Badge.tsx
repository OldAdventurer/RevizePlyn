import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'indigo' | 'emerald' | 'orange'
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
}

const variantClasses: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  yellow: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
  gray: 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/20',
  indigo: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20',
  emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  orange: 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20',
}

export default function Badge({ variant = 'blue', size = 'sm', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${
      size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    } ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}
