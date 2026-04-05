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

  const rowClasses = onRowClick ? 'cursor-pointer hover:bg-neutral-50' : ''

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="bg-white rounded-lg border border-[var(--color-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`text-left py-2.5 px-4 text-xs font-medium text-[var(--color-text-secondary)] ${
                        col.sortable ? 'cursor-pointer hover:text-[var(--color-text)] select-none transition-colors' : ''
                      }`}
                      onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.header}
                        {col.sortable && sortKey === col.key && (
                          <span className="text-[var(--color-primary)]">
                            {sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row) => (
                  <tr
                    key={keyExtractor(row)}
                    className={`border-b border-[var(--color-border-light)] last:border-b-0 transition-colors ${rowClasses}`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="py-2.5 px-4 text-sm">
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
      <div className="md:hidden flex flex-col gap-2">
        {sortedData.map((row) => (
          <div
            key={keyExtractor(row)}
            className={`bg-white rounded-lg border border-[var(--color-border)] p-3 ${
              onRowClick ? 'cursor-pointer active:bg-neutral-50' : ''
            }`}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between items-baseline py-0.5">
                <span className="text-xs text-[var(--color-text-secondary)]">{col.header}</span>
                <span className="text-sm text-[var(--color-text)] text-right ml-2">
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
