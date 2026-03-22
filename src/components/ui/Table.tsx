import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
  sortable?: boolean
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T) => void
  keyExtractor: (item: T) => string
}

export default function Table<T>({
  columns,
  data,
  onRowClick,
  keyExtractor,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortKey]
        const bVal = (b as Record<string, unknown>)[sortKey]
        const cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''), 'cs')
        return sortDir === 'asc' ? cmp : -cmp
      })
    : data

  const rowClasses = onRowClick ? 'cursor-pointer hover:bg-blue-50/50' : ''

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="bg-white rounded-2xl shadow-[var(--shadow-md)] border border-[var(--color-border)]/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-[var(--color-border)]/60">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`text-left py-3.5 px-5 text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide ${
                        col.sortable ? 'cursor-pointer hover:bg-gray-100/80 select-none transition-colors' : ''
                      }`}
                      onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {col.header}
                        {col.sortable && sortKey === col.key && (
                          <span className="text-[var(--color-primary)]">
                            {sortDir === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row, idx) => (
                  <tr
                    key={keyExtractor(row)}
                    className={`border-b border-[var(--color-border)]/40 transition-colors ${
                      idx % 2 === 1 ? 'bg-gray-50/50' : ''
                    } ${rowClasses}`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="py-3.5 px-5 text-base">
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden flex flex-col gap-3">
        {sortedData.map((row) => (
          <div
            key={keyExtractor(row)}
            className={`bg-white rounded-2xl border border-[var(--color-border)]/60 p-4 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-200 ${
              onRowClick ? 'cursor-pointer active:bg-gray-50' : ''
            }`}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between items-baseline py-1.5">
                <span className="font-medium text-[var(--color-text-secondary)] text-sm">{col.header}</span>
                <span className="text-base text-[var(--color-text)] text-right ml-2">
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key] ?? '')}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
