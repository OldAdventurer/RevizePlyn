import { useMemo } from 'react'
import { usePageTitle } from '../hooks/usePageTitle'
import { db } from '../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  formatDate,
  formatCurrency,
  getOrderStatusLabel,
  getOrderStatusColor,
  getOrderTypeLabel,
} from '../utils/format'
import Card from '../components/ui/Card'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle,
  ClipboardList,
  ChevronRight,
  FileText,
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
  usePageTitle('Nástěnka')
  const navigate = useNavigate()
  const orders = useLiveQuery(() => db.orders.toArray())
  const customers = useLiveQuery(() => db.customers.toArray())
  const reports = useLiveQuery(() => db.revisionReports.toArray())
  const invoices = useLiveQuery(() => db.invoices.toArray())

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

  const financeStats = useMemo(() => {
    if (!invoices) return null
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    let unpaid = 0
    let overdueCount = 0
    let monthlyIncome = 0

    for (const inv of invoices) {
      if (inv.status === 'odeslana' || inv.status === 'po-splatnosti') {
        unpaid += inv.total
      }
      if (inv.status === 'po-splatnosti') {
        overdueCount++
      }
      if (inv.status === 'zaplacena' && inv.paidDate && inv.paidDate >= monthStart) {
        monthlyIncome += inv.total
      }
    }

    return { unpaid, overdueCount, monthlyIncome }
  }, [invoices])

  if (!orders || !customers || !reports || !invoices || !stats || !recentReports || !financeStats) {
    return <DashboardSkeleton />
  }

  if (orders.length === 0) {
    return (
      <div className="page-enter flex flex-col gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">Nástěnka</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Přehled vašich zakázek a revizí
          </p>
        </div>
        <EmptyState
          icon={<ClipboardList size={32} />}
          title="Zatím žádné zakázky"
          description="Vytvořte svou první zakázku nebo obnovte demo data pro vyzkoušení aplikace."
          actionLabel="+ Nová zakázka"
          actionHref="/zakazky/nova"
        />
      </div>
    )
  }

  return (
    <div className="page-enter flex flex-col gap-6">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">Nástěnka</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Přehled vašich zakázek a revizí
          </p>
        </div>
        <div className="hidden md:block shrink-0">
          <Button
            icon={<Plus size={20} />}
            onClick={() => navigate('/zakazky/nova')}
          >
            Nová zakázka
          </Button>
        </div>
      </div>

      {/* ── Alert banners ── */}
      {stats.overdue.length > 0 && (
        <div
          className="flex items-center gap-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl p-5 cursor-pointer shadow-lg shadow-red-500/20 hover:scale-[1.01] transition-transform duration-200"
          onClick={() => navigate('/zakazky')}
        >
          <div className="relative shrink-0">
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-white animate-ping opacity-75" />
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-white" />
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg leading-tight">
              {stats.overdue.length}{' '}
              {stats.overdue.length === 1
                ? 'zakázka je po termínu'
                : stats.overdue.length < 5
                  ? 'zakázky jsou po termínu'
                  : 'zakázek je po termínu'}
            </p>
            <p className="text-sm text-white/80">Klikněte pro zobrazení seznamu</p>
          </div>
          <ChevronRight className="shrink-0 text-white/60" size={22} />
        </div>
      )}

      {stats.upcoming.length > 0 && (
        <div
          className="flex items-center gap-4 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 rounded-2xl p-5 cursor-pointer shadow-lg shadow-amber-500/20 hover:scale-[1.01] transition-transform duration-200"
          onClick={() => navigate('/zakazky')}
        >
          <div className="relative shrink-0">
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-900 animate-ping opacity-75" />
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-900" />
            <Clock size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg leading-tight">
              {stats.upcoming.length}{' '}
              {stats.upcoming.length === 1
                ? 'zakázka v příštích 30 dnech'
                : stats.upcoming.length < 5
                  ? 'zakázky v příštích 30 dnech'
                  : 'zakázek v příštích 30 dnech'}
            </p>
            <p className="text-sm text-amber-800">Klikněte pro zobrazení seznamu</p>
          </div>
          <ChevronRight className="shrink-0 text-amber-700/60" size={22} />
        </div>
      )}

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          className="group bg-blue-50/30 rounded-2xl shadow-[var(--shadow-sm)] border border-blue-100/60 p-5 text-left hover:shadow-[var(--shadow-md)] hover:bg-blue-50/50 transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/zakazky')}
        >
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center mb-3 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <ClipboardList className="text-white" size={22} />
          </div>
          <p className="text-4xl font-black text-blue-600">{stats.total}</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Celkem zakázek</p>
        </button>

        <button
          className="group bg-amber-50/30 rounded-2xl shadow-[var(--shadow-sm)] border border-amber-100/60 p-5 text-left hover:shadow-[var(--shadow-md)] hover:bg-amber-50/50 transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/zakazky')}
        >
          <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center mb-3 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Clock className="text-white" size={22} />
          </div>
          <p className="text-4xl font-black text-amber-600">{stats.inProgress}</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Rozpracované</p>
        </button>

        <button
          className="group bg-emerald-50/30 rounded-2xl shadow-[var(--shadow-sm)] border border-emerald-100/60 p-5 text-left hover:shadow-[var(--shadow-md)] hover:bg-emerald-50/50 transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/zakazky')}
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mb-3 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <CheckCircle className="text-white" size={22} />
          </div>
          <p className="text-4xl font-black text-emerald-600">{stats.done}</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Dokončené</p>
        </button>

        <button
          className="group bg-red-50/30 rounded-2xl shadow-[var(--shadow-sm)] border border-red-100/60 p-5 text-left hover:shadow-[var(--shadow-md)] hover:bg-red-50/50 transition-all duration-200 cursor-pointer"
          onClick={() => navigate('/zakazky')}
        >
          <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center mb-3 shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
            <AlertTriangle className="text-white" size={22} />
          </div>
          <p className="text-4xl font-black text-red-600">{stats.overdue.length}</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Po termínu</p>
        </button>
      </div>

      {/* ── Finance summary ── */}
      <Card
        accent="blue"
        title="💰 Finanční přehled"
        footer={
          <button
            className="text-[var(--color-primary)] font-semibold hover:underline cursor-pointer flex items-center gap-1"
            onClick={() => navigate('/finance')}
          >
            Zobrazit finance <ChevronRight size={18} />
          </button>
        }
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Nezaplaceno</p>
            <p className="text-lg font-bold text-[var(--color-text)]">{formatCurrency(financeStats.unpaid)}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Po splatnosti</p>
            <p className={`text-lg font-bold ${financeStats.overdueCount > 0 ? 'text-red-600' : 'text-[var(--color-text)]'}`}>
              {financeStats.overdueCount}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Příjmy tento měsíc</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(financeStats.monthlyIncome)}</p>
          </div>
        </div>
      </Card>

      {/* ── Upcoming revisions ── */}
      <Card
        accent="blue"
        title="Nadcházející revize"
        subtitle="Plánované zakázky v nejbližších dnech"
        footer={
          <button
            className="text-[var(--color-primary)] font-semibold hover:underline cursor-pointer flex items-center gap-1"
            onClick={() => navigate('/zakazky')}
          >
            Zobrazit vše <ChevronRight size={18} />
          </button>
        }
      >
        {stats.planned.length === 0 ? (
          <p className="text-gray-400 py-6 text-center">Žádné naplánované zakázky</p>
        ) : (
          <div className="flex flex-col -my-1">
            {stats.planned.map((order, idx) => {
              const customer = customerMap.get(order.customerId)
              const customerName = customer?.name ?? 'Neznámý zákazník'
              const initial = customerName.charAt(0).toUpperCase()
              return (
                <div key={order.id}>
                  {idx > 0 && <div className="border-t border-gray-100 mx-0" />}
                  <div
                    className="group flex items-center gap-4 py-4 cursor-pointer hover:bg-blue-50/40 -mx-6 px-6 transition-colors duration-150"
                    onClick={() => navigate(`/zakazky/${order.id}`)}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-[var(--color-primary)]">{initial}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--color-text)] truncate">
                        {customerName}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)] truncate">{order.address}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <Badge variant={getOrderStatusColor(order.status) as any} size="sm">
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          {getOrderTypeLabel(order.type)}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <Badge variant="blue" size="md">
                        {order.plannedDate ? formatDate(order.plannedDate) : '—'}
                      </Badge>
                      <ChevronRight className="shrink-0 text-gray-300 group-hover:translate-x-0.5 transition-transform duration-150" size={20} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* ── Recent revision reports ── */}
      <Card
        accent="green"
        title="Poslední revizní zprávy"
        subtitle="Nejnovější dokončené revize"
        footer={
          <button
            className="text-[var(--color-success)] font-semibold hover:underline cursor-pointer flex items-center gap-1"
            onClick={() => navigate('/revizni-zpravy')}
          >
            Zobrazit vše <ChevronRight size={18} />
          </button>
        }
      >
        {recentReports.length === 0 ? (
          <p className="text-gray-400 py-6 text-center">Zatím žádné revizní zprávy</p>
        ) : (
          <div className="flex flex-col -my-1">
            {recentReports.map((report, idx) => {
              const customer = customerMap.get(report.customerId)
              const customerName = customer?.name ?? 'Neznámý zákazník'
              const initial = customerName.charAt(0).toUpperCase()
              return (
                <div key={report.id}>
                  {idx > 0 && <div className="border-t border-gray-100 mx-0" />}
                  <div
                    className="group flex items-center gap-4 py-4 cursor-pointer hover:bg-emerald-50/40 -mx-6 px-6 transition-colors duration-150"
                    onClick={() => navigate(`/revizni-zpravy/${report.id}`)}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-emerald-600">{initial}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--color-text)] truncate">
                        {report.reportNumber}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)] truncate">
                        {customerName}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <Badge variant={conclusionVariant(report.conclusion)} size="md">
                        {conclusionLabel(report.conclusion)}
                      </Badge>
                      <span className="text-xs text-[var(--color-text-secondary)] hidden sm:inline">
                        {formatDate(report.date)}
                      </span>
                      <ChevronRight className="shrink-0 text-gray-300 group-hover:translate-x-0.5 transition-transform duration-150" size={20} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* ── Quick actions (mobile) ── */}
      <div className="flex flex-col sm:flex-row gap-3 md:hidden">
        <Button
          size="lg"
          icon={<Plus size={22} />}
          className="w-full"
          onClick={() => navigate('/zakazky/nova')}
        >
          Nová zakázka
        </Button>
        <Button
          variant="ghost"
          size="lg"
          icon={<FileText size={20} />}
          className="w-full"
          onClick={() => navigate('/zakazky')}
        >
          Zobrazit zakázky
        </Button>
      </div>
    </div>
  )
}
