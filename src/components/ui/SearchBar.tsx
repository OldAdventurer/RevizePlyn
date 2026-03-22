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
      <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[48px] text-base py-3 pl-12 pr-10 border border-[var(--color-border)] rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all duration-200 placeholder:text-gray-400"
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
