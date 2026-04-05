import { useToastStore } from '../../stores/toastStore'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

const icons = { success: CheckCircle, error: XCircle, info: Info, warning: AlertTriangle }
const styles = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
}
const iconStyles = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => {
        const Icon = icons[t.type]
        return (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border animate-[fadeIn_0.2s_ease-out] ${styles[t.type]}`}
          >
            <Icon size={20} className={`shrink-0 ${iconStyles[t.type]}`} />
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            <button onClick={() => removeToast(t.id)} className="shrink-0 p-1 rounded-lg hover:bg-black/5 cursor-pointer">
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
