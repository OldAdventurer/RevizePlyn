import { cn } from '@/lib/utils'

type BadgeVariant = 'blue' | 'indigo' | 'green' | 'emerald' | 'red' | 'yellow' | 'orange' | 'gray' | 'purple' | 'teal' | 'default' | 'secondary' | 'destructive' | 'outline'

interface BadgeProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  yellow: 'bg-amber-50 text-amber-700 border-amber-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  gray: 'bg-muted text-muted-foreground border-border',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  default: 'bg-primary text-primary-foreground border-transparent',
  secondary: 'bg-secondary text-secondary-foreground border-transparent',
  destructive: 'bg-destructive text-white border-transparent',
  outline: 'bg-transparent text-foreground border-border',
}

const sizeMap = {
  sm: 'text-[11px] px-1.5 py-0',
  md: 'text-xs px-2 py-0.5',
}

export default function Badge({ variant = 'gray', size = 'sm', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-md border whitespace-nowrap',
      sizeMap[size],
      colorMap[variant] || colorMap.gray,
      className,
    )}>
      {children}
    </span>
  )
}

export { Badge }
