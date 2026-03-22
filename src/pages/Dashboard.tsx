import { useMemo } from 'react'
import { db } from '../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  formatDate,
  getOrderStatusLabel,
  getOrderStatusColor,
  getOrderTypeLabel,
} from '../utils/format'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle,
  ClipboardList,
  ChevronRight,
} from 'lucide-react'
import type { Order, Customer } from '../types'

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function conclusionVariant(c: string): 'green' | 'yellow' | 'red' {
  if (c === 'schopne') return 'green'
  if (c === 's-vyhradami') return 'yellow'
  return 'red'
}

function conclusionLabel(c: string): string {
  if (c === 'schopne') return 'Bez závad'
  if (c === 's-vyhradami') return 'S výhradami'
  return 'Neschopné'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const orders = useLiveQuery(() => db.orders.toArray())
  const customers = useLiveQuery(() => db.customers.toArray())
  const reports = useLiveQuery(() => db.revisionReports.toArray())

  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>()
    if (customers) {
      for (const c of customers) map.set(c.id, c)
    }
    return map
  }, [customers])

  const stats = useMemo(() => {
    if (!orders) return null
    const today = toDateStr(new Date())
    const in30 = toDateStr(new Date(Date.now() + 30 * 86400000))

    const activeStatuses = new Set(['probiha', 'naplanovana'])
    const inProgressStatuses = new Set(['nova', 'naplanovana', 'probiha'])
    const doneStatuses = new Set(['dokoncena', 'fakturovano'])

    const overdue: Order[] = []
    const upcoming: Order[] = []
    let inProgress = 0
    let done = 0

    for (const o of orders) {
      if (inProgressStatuses.has(o.status)) inProgress++
      if (doneStatuses.has(o.status)) done++
      if (activeStatuses.has(o.status) && o.plannedDate && o.plannedDate < today) {
        overdue.push(o)
      }
      if (
        activeStatuses.has(o.status) &&
        o.plannedDate &&
        o.plannedDate >= today &&
        o.plannedDate <= in30
      ) {
        upcoming.push(o)
      }
    }

    const planned = orders
      .filter(
        (o) =>
          !doneStatuses.has(o.status) &&
          o.status !== 'zrusena' &&
          o.plannedDate &&
          o.plannedDate >= today
      )
      .sort((a, b) => (a.plannedDate! > b.plannedDate! ? 1 : -1))
      .slice(0, 5)

    return {
      total: orders.length,
      inProgress,
      done,
      overdue,
      upcoming,
      planned,
    }
  }, [orders])

  const recentReports = useMemo(() => {
    if (!reports) return null
    return [...reports].sort((a, b) => (a.date > b.date ? -1 : 1)).slice(0, 5)
  }, [reports])

  if (!orders || !customers || !reports || !stats || !recentReports) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-primary)] mx-auto mb-3" />
          <p className="text-lg text-gray-500">Načítám data…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">Nástěnka</h1>

      {/* ── Alert banners ── */}
      {stats.overdue.length > 0 && (
        <div
          className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 cursor-pointer hover:bg-red-100 transition-colors"
          onClick={() => navigate('/zakazky')}
        >
          <AlertTriangle className="shrink-0 text-red-600" size={24} />
          <div className="flex-1">
            <p className="font-semibold text-red-800">
              {stats.overdue.length}{' '}
              {stats.overdue.length === 1
                ? 'zakázka je po termínu'
                : stats.overdue.length < 5
                  ? 'zakázky jsou po termínu'
                  : 'zakázek je po termínu'}
            </p>
            <p className="text-sm text-red-600">Klikněte pro zobrazení seznamu</p>
          </div>
          <ChevronRight className="shrink-0 text-red-400" size={20} />
        </div>
      )}

      {stats.upcoming.length > 0 && (
        <div
          className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 cursor-pointer hover:bg-yellow-100 transition-colors"
          onClick={() => navigate('/zakazky')}
        >
          <Clock className="shrink-0 text-yellow-600" size={24} />
          <div className="flex-1">
            <p className="font-semibold text-yellow-800">
              {stats.upcoming.length}{' '}
              {stats.upcoming.length === 1
                ? 'zakázka v příštích 30 dnech'
                : stats.upcoming.length < 5
                  ? 'zakázky v příštích 30 dnech'
                  : 'zakázek v příštích 30 dnech'}
            </p>
            <p className="text-sm text-yellow-600">Klikněte pro zobrazení seznamu</p>
          </div>
          <ChevronRight className="shrink-0 text-yellow-400" size={20} />
        </div>
      )}

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-5 text-left hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/zakazky')}
        >
          <ClipboardList className="text-blue-500 mb-2" size={28} />
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-base text-gray-500 mt-1">Celkem zakázek</p>
        </button>

        <button
          className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-5 text-left hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/zakazky')}
        >
          <Clock className="text-yellow-500 mb-2" size={28} />
          <p className="text-3xl font-bold text-yellow-600">{stats.inProgress}</p>
          <p className="text-base text-gray-500 mt-1">Rozpracované</p>
        </button>

        <button
          className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-5 text-left hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/zakazky')}
        >
          <CheckCircle className="text-green-500 mb-2" size={28} />
          <p className="text-3xl font-bold text-green-600">{stats.done}</p>
          <p className="text-base text-gray-500 mt-1">Dokončené</p>
        </button>

        <button
          className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-5 text-left hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/zakazky')}
        >
          <AlertTriangle className="text-red-500 mb-2" size={28} />
          <p className="text-3xl font-bold text-red-600">{stats.overdue.length}</p>
          <p className="text-base text-gray-500 mt-1">Po termínu</p>
        </button>
      </div>

      {/* ── Upcoming revisions ── */}
      <Card
        title="Nadcházející revize"
        footer={
          <button
            className="text-[var(--color-primary)] font-medium hover:underline cursor-pointer flex items-center gap-1"
            onClick={() => navigate('/zakazky')}
          >
            Zobrazit vše <ChevronRight size={18} />
          </button>
        }
      >
        {stats.planned.length === 0 ? (
          <p className="text-gray-400 py-4 text-center">Žádné naplánované zakázky</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100 -my-1">
            {stats.planned.map((order) => {
              const customer = customerMap.get(order.customerId)
              return (
                <div
                  key={order.id}
                  className="flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50 -mx-5 px-5 transition-colors"
                  onClick={() => navigate(`/zakazky/${order.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--color-text)] truncate">
                      {customer?.name ?? 'Neznámý zákazník'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{order.address}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant={getOrderStatusColor(order.status) as any}>
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        {getOrderTypeLabel(order.type)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-[var(--color-text)]">
                      {order.plannedDate ? formatDate(order.plannedDate) : '—'}
                    </p>
                  </div>
                  <ChevronRight className="shrink-0 text-gray-300" size={20} />
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* ── Recent revision reports ── */}
      <Card
        title="Poslední revizní zprávy"
        footer={
          <button
            className="text-[var(--color-primary)] font-medium hover:underline cursor-pointer flex items-center gap-1"
            onClick={() => navigate('/revizni-zpravy')}
          >
            Zobrazit vše <ChevronRight size={18} />
          </button>
        }
      >
        {recentReports.length === 0 ? (
          <p className="text-gray-400 py-4 text-center">Zatím žádné revizní zprávy</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100 -my-1">
            {recentReports.map((report) => {
              const customer = customerMap.get(report.customerId)
              return (
                <div
                  key={report.id}
                  className="flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50 -mx-5 px-5 transition-colors"
                  onClick={() => navigate(`/revizni-zpravy/${report.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--color-text)] truncate">
                      {report.reportNumber}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {customer?.name ?? 'Neznámý zákazník'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={conclusionVariant(report.conclusion)}>
                      {conclusionLabel(report.conclusion)}
                    </Badge>
                    <span className="text-sm text-gray-400 hidden sm:inline">
                      {formatDate(report.date)}
                    </span>
                  </div>
                  <ChevronRight className="shrink-0 text-gray-300" size={20} />
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* ── Quick actions ── */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-4">
        <Button
          size="lg"
          icon={<Plus size={22} />}
          className="w-full sm:w-auto"
          onClick={() => navigate('/zakazky/nova')}
        >
          Nová zakázka
        </Button>
      </div>
    </div>
  )
}
