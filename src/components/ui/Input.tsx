import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-base font-medium text-[var(--color-text)] mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full min-h-[44px] text-base p-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] ${
          error ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-[var(--color-error)] text-sm mt-1">{error}</p>
      )}
    </div>
  )
}
