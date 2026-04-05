import { useMemo, useState } from 'react'
import { usePageTitle } from '../hooks/usePageTitle'
import { db } from '../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  formatCurrency,
  getOrderStatusLabel,
  getOrderStatusColor,
  getOrderTypeLabel,
} from '../utils/format'
import { DashboardSkeleton } from '@/components/ui/skeleton'
import Badge from '@/components/ui/badge'
import EmptyState from '@/components/ui/emptystate'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, ChevronRight } from 'lucide-react'
import type { Order, Customer, Invoice } from '../types'

// ── Helpers ──

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const CZECH_DAYS = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']
const CZECH_MONTHS_GEN = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince']

function getCzechDate(d: Date): string {
  return `${CZECH_DAYS[d.getDay()]} ${d.getDate()}. ${CZECH_MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Dobré ráno'
  if (h >= 12 && h < 17) return 'Dobré odpoledne'
  return 'Dobrý večer'
}

function extractFirstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  // Skip academic titles
  const titlePrefixes = ['ing.', 'mgr.', 'bc.', 'mudr.', 'rndr.', 'judr.', 'phdr.', 'doc.', 'prof.']
  for (const part of parts) {
    if (!titlePrefixes.includes(part.toLowerCase())) return part
  }
  return parts[parts.length - 1]
}

function daysBetween(dateStr: string, today: string): number {
  const a = new Date(dateStr)
  const b = new Date(today)
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}

// ── Progress Ring ──

function ProgressRing({ percent, size = 56 }: { percent: number; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={6} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#2563eb" strokeWidth={6} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">
        {percent}%
      </div>
    </div>
  )
}

// ── Main Component ──

export default function Dashboard() {
  usePageTitle('Nástěnka')
  const navigate = useNavigate()
  const [attentionExpanded, setAttentionExpanded] = useState(false)

  const orders = useLiveQuery(() => db.orders.toArray())
  const customers = useLiveQuery(() => db.customers.toArray())
  const invoices = useLiveQuery(() => db.invoices.toArray())
  const techSetting = useLiveQuery(() => db.settings.get('technician'))

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
    const doneStatuses = new Set(['dokoncena', 'fakturovano'])
    const inProgressStatuses = new Set(['nova', 'naplanovana', 'probiha'])
    const activeStatuses = new Set(['probiha', 'naplanovana'])

    let total = 0
    let inProgress = 0
    let done = 0
    let toInvoice = 0
    const overdueOrders: Order[] = []
    const upcomingOrders: Order[] = []
    const completedOrders: Order[] = []

    for (const o of orders) {
      if (o.status === 'zrusena') continue
      total++
      if (inProgressStatuses.has(o.status)) inProgress++
      if (doneStatuses.has(o.status)) {
        done++
        completedOrders.push(o)
      }
      if (o.status === 'dokoncena') toInvoice++
      if (activeStatuses.has(o.status) && o.plannedDate && o.plannedDate < today) {
        overdueOrders.push(o)
      }
      if (
        !doneStatuses.has(o.status) &&
        o.plannedDate &&
        o.plannedDate >= today
      ) {
        upcomingOrders.push(o)
      }
    }

    upcomingOrders.sort((a, b) => (a.plannedDate! > b.plannedDate! ? 1 : -1))
    completedOrders.sort((a, b) => (a.completedDate ?? a.updatedAt) > (b.completedDate ?? b.updatedAt) ? -1 : 1)

    const completionPercent = total > 0 ? Math.round((done / total) * 100) : 0

    return {
      total,
      inProgress,
      done,
      toInvoice,
      completionPercent,
      overdueOrders,
      upcomingOrders: upcomingOrders.slice(0, 10),
      completedOrders: completedOrders.slice(0, 8),
    }
  }, [orders])

  const financeStats = useMemo(() => {
    if (!invoices) return null
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const today = toDateStr(now)

    let unpaid = 0
    let unpaidCount = 0
    let monthlyIncome = 0
    const overdueInvoices: Invoice[] = []

    for (const inv of invoices) {
      if (inv.status === 'odeslana' || inv.status === 'po-splatnosti') {
        unpaid += inv.total
        unpaidCount++
      }
      if (inv.status === 'po-splatnosti') {
        overdueInvoices.push(inv)
      }
      // Also catch odeslana invoices past due date
      if (inv.status === 'odeslana' && inv.dueDate < today) {
        overdueInvoices.push(inv)
      }
      if (inv.status === 'zaplacena' && inv.paidDate && inv.paidDate >= monthStart) {
        monthlyIncome += inv.total
      }
    }

    return { unpaid, unpaidCount, monthlyIncome, overdueInvoices }
  }, [invoices])

  // ── Loading ──
  if (!orders || !customers || !invoices || !stats || !financeStats) {
    return <DashboardSkeleton />
  }

  // ── Empty state ──
  if (orders.length === 0) {
    return (
      <div className="page-enter flex flex-col gap-4">
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

  // ── Derived data ──
  const now = new Date()
  const today = toDateStr(now)
  const techName = techSetting?.value
    ? extractFirstName((techSetting.value as { name?: string }).name ?? '')
    : ''

  // Attention items: overdue orders + overdue invoices
  const attentionItems: { id: string; icon: string; text: string; href: string }[] = []
  for (const o of stats.overdueOrders) {
    const c = customerMap.get(o.customerId)
    const days = daysBetween(o.plannedDate!, today)
    attentionItems.push({
      id: o.id,
      icon: '⏰',
      text: `Zakázka #${o.id.slice(0, 6)} — ${c?.name ?? 'Neznámý'} — ${days} dní po termínu`,
      href: `/zakazky/${o.id}`,
    })
  }
  for (const inv of financeStats.overdueInvoices) {
    const c = customerMap.get(inv.customerId)
    attentionItems.push({
      id: inv.id,
      icon: '💰',
      text: `Faktura ${inv.invoiceNumber} — ${c?.name ?? 'Neznámý'} — po splatnosti ${formatCurrency(inv.total)}`,
      href: `/finance`,
    })
  }

  const visibleAttention = attentionExpanded ? attentionItems : attentionItems.slice(0, 5)

  // Timeline date labels
  function getDateLabel(dateStr: string): string {
    const tomorrow = toDateStr(new Date(Date.now() + 86400000))
    if (dateStr === today) return `Dnes, ${formatShortDate(dateStr)}`
    if (dateStr === tomorrow) return `Zítra, ${formatShortDate(dateStr)}`
    return formatShortDate(dateStr)
  }

  function getDotClass(dateStr: string): string {
    const tomorrow = toDateStr(new Date(Date.now() + 86400000))
    const weekEnd = toDateStr(new Date(Date.now() + 7 * 86400000))
    if (dateStr === today) return 'bg-blue-500'
    if (dateStr === tomorrow) return 'bg-amber-500'
    if (dateStr <= weekEnd) return 'bg-gray-400'
    return 'border-2 border-gray-300 bg-white'
  }

  function isDotFilled(dateStr: string): boolean {
    const weekEnd = toDateStr(new Date(Date.now() + 7 * 86400000))
    return dateStr <= weekEnd
  }

  return (
    <div className="page-enter flex flex-col gap-4">

      {/* ── Section 1: Greeting Hero ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">
            {getGreeting()}{techName ? `, ${techName}` : ''} 👋
          </h1>
          <span className="text-sm text-[var(--color-text-secondary)]">
            Dnes: {getCzechDate(now)}
          </span>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Máte {stats.inProgress} aktivních zakázek a {stats.toInvoice} čeká na fakturaci.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => navigate('/zakazky/nova')}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            + Nová zakázka
          </button>
          <button
            onClick={() => navigate('/revizni-zpravy/nova')}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            + Nová revize
          </button>
          <button
            onClick={() => navigate('/finance/nova-faktura')}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            Vystavit fakturu
          </button>
        </div>
      </div>

      {/* ── Section 2: Stats Strip ── */}
      <div className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <ProgressRing percent={stats.completionPercent} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 flex-1 min-w-0">
            <StatItem label="zakázek celkem" value={stats.total} />
            <StatDivider />
            <StatItem label="rozpracovaných" value={stats.inProgress} />
            <StatDivider />
            <StatItem label="dokončených" value={stats.done} />
            <StatDivider />
            <StatItem label="k fakturaci" value={stats.toInvoice} />
            <StatDivider />
            <div className="flex items-center gap-1.5">
              <span className="text-sm">💰</span>
              <span className="text-sm font-semibold text-[var(--color-text)]">{formatCurrency(financeStats.monthlyIncome)}</span>
              <span className="text-xs text-[var(--color-text-secondary)]">tento měsíc</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Attention (only if items exist) ── */}
      {attentionItems.length > 0 && (
        <div className="bg-red-50/50 border border-red-100 rounded-xl p-4">
          <h2 className="text-sm font-bold text-red-700 mb-2">
            🔴 Vyžaduje pozornost ({attentionItems.length})
          </h2>
          <div className="space-y-1.5">
            {visibleAttention.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-red-100/50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                onClick={() => navigate(item.href)}
              >
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <span className="mr-1">{item.icon}</span>
                <span className="text-[var(--color-text)] truncate">{item.text}</span>
              </div>
            ))}
          </div>
          {attentionItems.length > 5 && (
            <button
              onClick={() => setAttentionExpanded(!attentionExpanded)}
              className="text-xs text-red-600 font-medium mt-2 hover:underline cursor-pointer"
            >
              {attentionExpanded ? 'Skrýt' : `Zobrazit vše (${attentionItems.length})`}
            </button>
          )}
        </div>
      )}

      {/* ── Section 4: Main 2-column content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Left column: Timeline */}
        <div className="lg:col-span-3">
          <div className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl shadow-sm p-4">
            <h2 className="text-sm font-bold text-[var(--color-text)] mb-3">📅 Nadcházející práce</h2>
            {stats.upcomingOrders.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Žádné naplánované zakázky 🎉</p>
            ) : (
              <div className="relative">
                {stats.upcomingOrders.map((order, i) => {
                  const customer = customerMap.get(order.customerId)
                  const customerName = customer?.name ?? 'Neznámý zákazník'
                  const dateStr = order.plannedDate!
                  const dotColor = getDotClass(dateStr)
                  const filled = isDotFilled(dateStr)
                  return (
                    <div
                      key={order.id}
                      className="relative pl-8 pb-4 last:pb-0 cursor-pointer hover:bg-gray-50/80 rounded-lg -ml-2 px-2 py-2 transition-colors"
                      onClick={() => navigate(`/zakazky/${order.id}`)}
                    >
                      {/* Vertical line */}
                      {i < stats.upcomingOrders.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200" />
                      )}
                      {/* Dot */}
                      <div className={`absolute left-0 top-3 w-5 h-5 rounded-full flex items-center justify-center ${dotColor}`}>
                        {filled && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      {/* Content */}
                      <div>
                        <div className="text-xs text-gray-400 font-medium">{getDateLabel(dateStr)}</div>
                        <div className="text-sm font-medium text-[var(--color-text)]">
                          {order.description || getOrderTypeLabel(order.type)}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">{customerName}{order.address ? ` • ${order.address}` : ''}</span>
                          <Badge variant={getOrderStatusColor(order.status) as any} size="sm">
                            {getOrderStatusLabel(order.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {stats.upcomingOrders.length > 0 && (
              <button
                className="text-xs text-[var(--color-primary)] font-medium mt-2 hover:underline cursor-pointer flex items-center gap-0.5"
                onClick={() => navigate('/zakazky')}
              >
                Zobrazit vše <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Right column: Completed + Finance */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Recently completed */}
          <div className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl shadow-sm p-4">
            <h2 className="text-sm font-bold text-[var(--color-text)] mb-3">
              ✅ Dokončené zakázky ({stats.done}) 🎉
            </h2>
            {stats.completedOrders.length === 0 ? (
              <p className="text-sm text-gray-400 py-2 text-center">Zatím žádné dokončené zakázky</p>
            ) : (
              <div className="space-y-1">
                {stats.completedOrders.map((order) => {
                  const customer = customerMap.get(order.customerId)
                  const customerName = customer?.name ?? 'Neznámý'
                  const dateStr = order.completedDate ?? order.updatedAt?.slice(0, 10) ?? ''
                  return (
                    <div
                      key={order.id}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50/80 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                      onClick={() => navigate(`/zakazky/${order.id}`)}
                    >
                      <span className="text-emerald-500 shrink-0">✓</span>
                      <span className="truncate flex-1 text-[var(--color-text)]">
                        {order.description || getOrderTypeLabel(order.type)} — {customerName}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                        {dateStr ? formatShortDate(dateStr) : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Financial mini-summary */}
          <div className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl shadow-sm p-4">
            <h2 className="text-sm font-bold text-[var(--color-text)] mb-2">💰 Finance tento měsíc</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Příjmy:</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(financeStats.monthlyIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Nezaplaceno:</span>
                <span className="font-semibold text-[var(--color-text)]">
                  {formatCurrency(financeStats.unpaid)}{financeStats.unpaidCount > 0 ? ` (${financeStats.unpaidCount} faktur${financeStats.unpaidCount === 1 ? 'a' : financeStats.unpaidCount < 5 ? 'y' : ''})` : ''}
                </span>
              </div>
            </div>
            <button
              className="text-xs text-[var(--color-primary)] font-medium mt-3 hover:underline cursor-pointer flex items-center gap-0.5"
              onClick={() => navigate('/finance')}
            >
              Zobrazit finance <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Stat strip helpers ──

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-semibold text-[var(--color-text)]">{value}</span>
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
    </div>
  )
}

function StatDivider() {
  return <div className="hidden sm:block w-px h-4 bg-white/20 border-r border-gray-200" />
}
