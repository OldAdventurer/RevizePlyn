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
        <label htmlFor={inputId} className="block text-sm font-semibold text-[var(--color-text)] mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full min-h-[38px] text-base px-3 py-2 border rounded-xl bg-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] placeholder:text-gray-400 ${
          error ? 'border-[var(--color-error)] ring-2 ring-red-100' : 'border-[var(--color-border)]'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-[var(--color-error)] text-sm mt-1.5 font-medium">{error}</p>
      )}
    </div>
  )
}
