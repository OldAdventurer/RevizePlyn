import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../../db/schema'
import { usePageTitle } from '../../hooks/usePageTitle'
import { ListSkeleton } from '@/components/ui/skeleton'
import SearchBar from '@/components/ui/searchbar'
import Badge from '@/components/ui/badge'
import { ArrowLeft, ChevronRight, Plus } from 'lucide-react'
import { formatDate, getOrderStatusColor, getOrderStatusLabel } from '../../utils/format'

export default function NovaRevize() {
  usePageTitle('Nová revize — výběr zakázky')
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const orders = useLiveQuery(() => db.orders.toArray())
  const customers = useLiveQuery(() => db.customers.toArray())

  const customerMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of customers ?? []) m.set(c.id, c.name)
    return m
  }, [customers])

  const filtered = useMemo(() => {
    if (!orders) return []
    const active = orders
      .filter((o) => o.status !== 'zrusena')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (!search.trim()) return active
    const q = search.toLowerCase()
    return active.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.title.toLowerCase().includes(q) ||
        (customerMap.get(o.customerId) ?? '').toLowerCase().includes(q),
    )
  }, [orders, search, customerMap])

  if (!orders || !customers) return <ListSkeleton />

  return (
    <div className="page-enter space-y-6">
      <Link
        to="/revizni-zpravy"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} /> Zpět na revizní zprávy
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-foreground">Nová revize</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vyberte zakázku, ke které chcete vytvořit revizní zprávu
        </p>
      </div>

      <SearchBar placeholder="Hledat zakázku…" onSearch={setSearch} />

      <div className="rounded-lg border border-border divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {search ? 'Žádná zakázka neodpovídá hledání' : 'Zatím nemáte žádné zakázky'}
            </p>
            {!search && (
              <Link
                to="/zakazky/nova"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline"
              >
                <Plus size={14} /> Vytvořit zakázku
              </Link>
            )}
          </div>
        ) : (
          filtered.map((order) => (
            <button
              key={order.id}
              onClick={() => navigate(`/zakazky/${order.id}/revize`)}
              className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {order.title}
                  </span>
                  <Badge variant={getOrderStatusColor(order.status) as any} size="sm">
                    {getOrderStatusLabel(order.status)}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {order.orderNumber} · {customerMap.get(order.customerId) ?? '—'} ·{' '}
                  {formatDate(order.createdAt)}
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  )
}
