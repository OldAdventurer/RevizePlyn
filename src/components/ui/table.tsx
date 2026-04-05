import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  label?: string
  header?: string
  className?: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T) => void
  keyExtractor?: (item: T) => string
  className?: string
}

export default function Table<T>({ columns, data, onRowClick, keyExtractor, className }: TableProps<T>) {
  return (
    <div className={cn('w-full overflow-auto', className)}>
      <table className="w-full caption-bottom text-sm">
        <thead className="border-b border-border">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs',
                  col.className,
                )}
              >
                {col.label || col.header || ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr
              key={keyExtractor ? keyExtractor(item) : (item as any).id ?? i}
              className={cn(
                'border-b border-border transition-colors',
                onRowClick && 'cursor-pointer hover:bg-muted/50',
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-3 py-2.5 align-middle', col.className)}>
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { Table }
