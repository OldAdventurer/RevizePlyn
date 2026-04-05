import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  accent?: string
  onClick?: () => void
}

export default function Card({ children, className, title, subtitle, accent, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground',
        accent && accent === 'green' && 'border-l-2 border-l-emerald-500',
        accent && accent === 'red' && 'border-l-2 border-l-red-500',
        accent && accent === 'blue' && 'border-l-2 border-l-blue-500',
        accent && accent === 'yellow' && 'border-l-2 border-l-amber-500',
        accent && accent === 'orange' && 'border-l-2 border-l-orange-500',
        onClick && 'cursor-pointer hover:bg-accent/50 transition-colors',
        className,
      )}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <div className="p-4 pb-2">
          {title && <h3 className="text-sm font-semibold leading-none tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      )}
      <div className={title || subtitle ? 'px-4 pb-4' : 'p-4'}>
        {children}
      </div>
    </div>
  )
}

export { Card }
