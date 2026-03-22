import type { ReactNode } from 'react'
import Button from './Button'
import { useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  showResetButton?: boolean
}

export default function EmptyState({ icon, title, description, actionLabel, actionHref, onAction, showResetButton = true }: EmptyStateProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">{title}</h3>
      <p className="text-[var(--color-text-secondary)] mb-4 max-w-md">{description}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        {actionLabel && (
          <Button
            variant="primary"
            onClick={() => {
              if (onAction) onAction()
              else if (actionHref) navigate(actionHref)
            }}
          >
            {actionLabel}
          </Button>
        )}
        {showResetButton && (
          <Button
            variant="secondary"
            icon={<RefreshCw size={18} />}
            onClick={() => navigate('/nastaveni')}
          >
            Obnovit demo data
          </Button>
        )}
      </div>
    </div>
  )
}
