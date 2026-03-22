import { useLiveQuery } from 'dexie-react-hooks'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { db } from '../../db/schema'
import { formatDate, getOrderStatusLabel, getOrderStatusColor, getOrderTypeLabel } from '../../utils/format'
import type { OrderStatus } from '../../types'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { ArrowLeft, Edit, Trash2, FileText, ChevronRight } from 'lucide-react'

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
  }

  async function handleDelete() {
    if (!window.confirm('Opravdu chcete smazat tuto zakázku?')) return
    await db.orders.delete(id!)
    navigate('/zakazky')
  }

  const canCreateReport = order.status === 'probiha' || order.status === 'dokoncena'

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Back */}
      <Link
        to="/zakazky"
        className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline font-medium"
      >
        <ArrowLeft size={18} /> Zpět na zakázky
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          {getOrderTypeLabel(order.type)}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={getOrderStatusColor(order.status) as 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'indigo' | 'emerald' | 'orange'}
          >
            {getOrderStatusLabel(order.status)}
          </Badge>
          {order.priority === 'specha' && <Badge variant="red">Spěchá</Badge>}
        </div>
      </div>

      {/* Info card */}
      <Card title="Informace o zakázce">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-base">
          <div>
            <dt className="font-medium text-gray-500">Zákazník</dt>
            <dd className="mt-0.5">
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
            <dt className="font-medium text-gray-500">Adresa</dt>
            <dd className="mt-0.5">{order.address}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Plánované datum</dt>
            <dd className="mt-0.5">
              {order.plannedDate ? formatDate(order.plannedDate) : '—'}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Datum dokončení</dt>
            <dd className="mt-0.5">
              {order.completedDate ? formatDate(order.completedDate) : '—'}
            </dd>
          </div>
          {order.description && (
            <div className="sm:col-span-2">
              <dt className="font-medium text-gray-500">Popis</dt>
              <dd className="mt-0.5 whitespace-pre-wrap">{order.description}</dd>
            </div>
          )}
          {order.note && (
            <div className="sm:col-span-2">
              <dt className="font-medium text-gray-500">Poznámka</dt>
              <dd className="mt-0.5 whitespace-pre-wrap">{order.note}</dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Status workflow */}
      {transitions.length > 0 && (
        <Card title="Změna stavu">
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
        <Card title="Revizní zprávy">
          <div className="flex flex-col gap-2">
            {reports.map((r) => (
              <Link
                key={r.id}
                to={`/revizni-zpravy/${r.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] hover:bg-gray-50 transition-colors"
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
