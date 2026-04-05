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
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-text)] mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full h-9 text-sm px-3 border rounded-lg bg-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] placeholder:text-[var(--color-text-tertiary)] ${
          error ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-[var(--color-error)] text-xs mt-1">{error}</p>
      )}
    </div>
  )
}
