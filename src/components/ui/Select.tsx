import type { SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export default function Select({ label, error, id, options, placeholder, className = '', ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-base font-medium text-[var(--color-text)] mb-1">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full min-h-[44px] text-base p-3 border rounded-lg bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] ${
          error ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && (
        <p className="text-[var(--color-error)] text-sm mt-1">{error}</p>
      )}
    </div>
  )
}
