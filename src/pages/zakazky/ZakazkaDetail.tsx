import { useLiveQuery } from 'dexie-react-hooks'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { db } from '../../db/schema'
import { formatDate, getOrderStatusLabel, getOrderStatusColor, getOrderTypeLabel } from '../../utils/format'
import type { OrderStatus } from '../../types'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { ArrowLeft, Edit, Trash2, FileText, ChevronRight } from 'lucide-react'
import { toast } from '../../stores/toastStore'
import { DetailSkeleton } from '../../components/ui/Skeleton'

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
      <div className="p-6 text-center text-gray-500 text-lg">
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
    <div className="page-enter p-4 md:p-6 space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/zakazky')} className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] font-medium mb-4 transition-colors cursor-pointer">
        <ArrowLeft size={20} />
        <span>Zpět na zakázky</span>
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{getOrderTypeLabel(order.type)}</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">{order.address}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={getOrderStatusColor(order.status) as 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'indigo' | 'emerald' | 'orange'}>
            {getOrderStatusLabel(order.status)}
          </Badge>
          {order.priority === 'specha' && <Badge variant="red">Spěchá</Badge>}
        </div>
      </div>

      {/* Info card */}
      <Card title="Informace o zakázce" accent="blue">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <div>
            <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Zákazník</dt>
            <dd className="mt-0.5 font-medium">
              {customer ? (
                <Link
                  to={`/zakaznici/${customer.id}`}
                  className="text-[var(--color-primary)] hover:underline font-medium"
                >
                  {customer.name}
                </Link>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Adresa</dt>
            <dd className="mt-0.5 font-medium">{order.address}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Plánované datum</dt>
            <dd className="mt-0.5 font-medium">
              {order.plannedDate ? formatDate(order.plannedDate) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Datum dokončení</dt>
            <dd className="mt-0.5 font-medium">
              {order.completedDate ? formatDate(order.completedDate) : '—'}
            </dd>
          </div>
          {order.description && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Popis</dt>
              <dd className="mt-0.5 font-medium whitespace-pre-wrap">{order.description}</dd>
            </div>
          )}
          {order.note && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Poznámka</dt>
              <dd className="mt-0.5 font-medium whitespace-pre-wrap">{order.note}</dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Status workflow */}
      {transitions.length > 0 && (
        <Card title="Změna stavu" accent="yellow">
          <div className="flex flex-wrap gap-3">
            {transitions.map((t) => (
              <Button
                key={t.next}
                variant={t.variant}
                onClick={() => updateStatus(t.next)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Linked revision reports */}
      {reports && reports.length > 0 && (
        <Card title="Revizní zprávy" accent="green">
          <div className="flex flex-col gap-2">
            {reports.map((r) => (
              <Link
                key={r.id}
                to={`/revizni-zpravy/${r.id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] hover:bg-blue-50/50 hover:border-blue-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-gray-400 shrink-0" />
                  <div>
                    <span className="font-medium">{r.reportNumber}</span>
                    <span className="text-gray-500 ml-2">
                      {formatDate(r.date)}
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {canCreateReport && (
          <Link to={`/zakazky/${id}/revize`}>
            <Button icon={<FileText size={18} />}>Vytvořit revizní zprávu</Button>
          </Link>
        )}
        <Link to={`/zakazky/${id}/upravit`}>
          <Button variant="secondary" icon={<Edit size={18} />}>
            Upravit zakázku
          </Button>
        </Link>
        <Button variant="danger" icon={<Trash2 size={18} />} onClick={handleDelete}>
          Smazat zakázku
        </Button>
      </div>
    </div>
  )
}
