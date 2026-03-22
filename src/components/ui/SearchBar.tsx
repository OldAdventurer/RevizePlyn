import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

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
      <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[44px] text-base p-3 pl-10 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
      />
    </div>
  )
}
