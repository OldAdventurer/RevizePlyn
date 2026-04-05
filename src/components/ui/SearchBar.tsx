import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  debounceMs?: number
  className?: string
}

export default function SearchBar({
  placeholder = 'Hledat...',
  onSearch,
  debounceMs = 300,
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch

  useEffect(() => {
    const timer = window.setTimeout(() => onSearchRef.current?.(query), debounceMs)
    return () => clearTimeout(timer)
  }, [query, debounceMs])

  return (
    <div className={`relative w-full ${className}`}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 text-sm pl-9 pr-9 border border-[var(--color-border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-colors duration-150 placeholder:text-[var(--color-text-tertiary)]"
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-neutral-100 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
