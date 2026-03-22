import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'indigo' | 'emerald' | 'orange'
  children: ReactNode
  className?: string
}

const variantClasses: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-600',
  indigo: 'bg-indigo-100 text-indigo-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  orange: 'bg-orange-100 text-orange-800',
}

export default function Badge({ variant = 'blue', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}
