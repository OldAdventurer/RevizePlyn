import { useLiveQuery } from 'dexie-react-hooks'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { db } from '../../db/schema'
import { formatDate, getOrderStatusLabel, getOrderStatusColor, getOrderTypeLabel } from '../../utils/format'
import type { OrderStatus } from '../../types'
import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'
import { ArrowLeft, Edit, Trash2, FileText, ChevronRight, Receipt } from 'lucide-react'
import { toast } from '../../stores/toastStore'
import { DetailSkeleton } from '@/components/ui/skeleton'

const statusTransitions: Record<OrderStatus, { label: string; next: OrderStatus; variant: 'primary' | 'secondary' | 'danger' }[]> = {
  nova: [
    { label: 'Naplánovat', next: 'naplanovana', variant: 'primary' },
    { label: 'Zrušit', next: 'zrusena', variant: 'danger' },
  ],
  naplanovana: [
    { label: 'Zahájit', next: 'probiha', variant: 'primary' },
    { label: 'Odložit', next: 'odlozena', variant: 'secondary' },
    { label: 'Zrušit', next: 'zrusena', variant: 'danger' },
  ],
  probiha: [
    { label: 'Dokončit', next: 'dokoncena', variant: 'primary' },
  ],
  dokoncena: [
    { label: 'Fakturovat', next: 'fakturovano', variant: 'primary' },
  ],
  odlozena: [
    { label: 'Obnovit', next: 'naplanovana', variant: 'primary' },
  ],
  fakturovano: [],
  zrusena: [],
}

export default function ZakazkaDetail() {
  usePageTitle('Detail zakázky')
  const { id } = useParams()
  const navigate = useNavigate()

  const order = useLiveQuery(() => db.orders.get(id!), [id])
  const customer = useLiveQuery(
    () => (order ? db.customers.get(order.customerId) : undefined),
    [order],
  )
  const reports = useLiveQuery(
    () => db.revisionReports.where('orderId').equals(id!).toArray(),
    [id],
  )

  if (order === undefined) {
    return <DetailSkeleton />
  }

  if (!order) {
    return (
      <div className="p-6 text-center text-muted-foreground text-lg">
        Zakázka nenalezena
      </div>
    )
  }

  const transitions = statusTransitions[order.status] ?? []

  async function updateStatus(newStatus: OrderStatus) {
    await db.orders.update(id!, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    })
    toast.success('Stav zakázky byl změněn')
  }

  async function handleDelete() {
    if (!window.confirm('Opravdu chcete smazat tuto zakázku?')) return
    await db.orders.delete(id!)
    toast.success('Zakázka byla smazána')
    navigate('/zakazky')
  }

  const canCreateReport = order.status === 'probiha' || order.status === 'dokoncena'

  return (
    <div className="page-enter space-y-6">
      {/* Back */}
      <Link to="/zakazky" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} />
        Zpět na zakázky
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-foreground">{getOrderTypeLabel(order.type)}</h1>
            <Badge variant={getOrderStatusColor(order.status) as any}>
              {getOrderStatusLabel(order.status)}
            </Badge>
            {order.priority === 'specha' && <Badge variant="red">Spěchá</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{order.address}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/zakazky/${id}/upravit`}>
            <Button variant="outline" size="sm" icon={<Edit size={14} />}>Upravit</Button>
          </Link>
          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={handleDelete} className="text-destructive hover:text-destructive" />
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-lg border border-border p-5">
        <InfoRow label="Zákazník">
          {customer ? (
            <Link to={`/zakaznici/${customer.id}`} className="text-foreground hover:underline">
              {customer.name}
            </Link>
          ) : '—'}
        </InfoRow>
        <InfoRow label="Adresa">{order.address}</InfoRow>
        <InfoRow label="Plánované datum">
          {order.plannedDate ? formatDate(order.plannedDate) : '—'}
        </InfoRow>
        <InfoRow label="Datum dokončení">
          {order.completedDate ? formatDate(order.completedDate) : '—'}
        </InfoRow>
        {order.description && (
          <InfoRow label="Popis" span>{order.description}</InfoRow>
        )}
        {order.note && (
          <InfoRow label="Poznámka" span>{order.note}</InfoRow>
        )}
      </div>

      {/* Status workflow */}
      {transitions.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-1">Akce:</span>
          {transitions.map((t) => (
            <Button
              key={t.next}
              variant={t.variant === 'primary' ? 'default' : t.variant === 'danger' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => updateStatus(t.next)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      )}

      {/* Linked revision reports */}
      {reports && reports.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Revizní zprávy</h2>
          <div className="space-y-1">
            {reports.map((r) => (
              <Link
                key={r.id}
                to={`/revizni-zpravy/${r.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium">{r.reportNumber}</span>
                  <span className="text-sm text-muted-foreground">{formatDate(r.date)}</span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex flex-wrap gap-2 pt-2">
        {canCreateReport && (
          <Link to={`/zakazky/${id}/revize`}>
            <Button size="sm" icon={<FileText size={14} />}>Vytvořit revizní zprávu</Button>
          </Link>
        )}
        {order.status === 'dokoncena' && (
          <Link to={`/finance/faktury/nova?orderId=${order.id}`}>
            <Button variant="outline" size="sm" icon={<Receipt size={14} />}>Vystavit fakturu</Button>
          </Link>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className={span ? 'md:col-span-2' : ''}>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}
