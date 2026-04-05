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
import Button from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  ChevronRight,
  Plus,
  FileText,
  Receipt,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Wallet,
  Layers,
  Loader,
  CircleCheck,
  FileOutput,
} from 'lucide-react'
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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Nástěnka</h1>
          <p className="text-muted-foreground mt-1">
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
  const attentionItems: { id: string; text: string; href: string }[] = []
  for (const o of stats.overdueOrders) {
    const c = customerMap.get(o.customerId)
    const days = daysBetween(o.plannedDate!, today)
    attentionItems.push({
      id: o.id,
      text: `Zakázka #${o.id.slice(0, 6)} — ${c?.name ?? 'Neznámý'} — ${days} dní po termínu`,
      href: `/zakazky/${o.id}`,
    })
  }
  for (const inv of financeStats.overdueInvoices) {
    const c = customerMap.get(inv.customerId)
    attentionItems.push({
      id: inv.id,
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
    if (dateStr === today) return 'bg-primary'
    if (dateStr === tomorrow) return 'bg-amber-500'
    if (dateStr <= weekEnd) return 'bg-muted-foreground/50'
    return 'border-2 border-border bg-card'
  }

  return (
    <div className="page-enter flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
              {getGreeting()}{techName ? `, ${techName}` : ''}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {getCzechDate(now)} · {stats.inProgress} aktivních zakázek, {stats.toInvoice} k fakturaci
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => navigate('/zakazky/nova')}
            >
              Nová zakázka
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<FileText size={15} />}
              onClick={() => navigate('/revizni-zpravy/nova')}
            >
              Nová revize
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Receipt size={15} />}
              onClick={() => navigate('/finance/nova-faktura')}
            >
              Vystavit fakturu
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Layers size={16} />} label="Celkem zakázek" value={stats.total} />
        <StatCard icon={<Loader size={16} />} label="Rozpracovaných" value={stats.inProgress} />
        <StatCard icon={<CircleCheck size={16} />} label="Dokončených" value={stats.done} />
        <StatCard icon={<FileOutput size={16} />} label="K fakturaci" value={stats.toInvoice} />
      </div>

      {/* ── Attention ── */}
      {attentionItems.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={15} className="text-destructive shrink-0" />
            <h2 className="text-sm font-semibold text-destructive">
              Vyžaduje pozornost ({attentionItems.length})
            </h2>
          </div>
          <div className="space-y-1">
            {visibleAttention.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 text-sm cursor-pointer hover:bg-destructive/5 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                onClick={() => navigate(item.href)}
              >
                <span className="h-1.5 w-1.5 rounded-lg bg-destructive shrink-0" />
                <span className="text-foreground truncate">{item.text}</span>
              </div>
            ))}
          </div>
          {attentionItems.length > 5 && (
            <button
              onClick={() => setAttentionExpanded(!attentionExpanded)}
              className="text-xs text-destructive font-medium mt-2 hover:underline cursor-pointer"
            >
              {attentionExpanded ? 'Skrýt' : `Zobrazit vše (${attentionItems.length})`}
            </button>
          )}
        </div>
      )}

      {/* ── Main 3-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Column 1: Upcoming timeline */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Nadcházející práce</h2>
          </div>
          {stats.upcomingOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Žádné naplánované zakázky</p>
          ) : (
            <div className="relative">
              {stats.upcomingOrders.map((order, i) => {
                const customer = customerMap.get(order.customerId)
                const customerName = customer?.name ?? 'Neznámý zákazník'
                const dateStr = order.plannedDate!
                const dotColor = getDotClass(dateStr)
                return (
                  <div
                    key={order.id}
                    className="relative pl-7 pb-3 last:pb-0 cursor-pointer hover:bg-muted/50 rounded-lg -ml-1.5 px-1.5 py-1.5 transition-colors"
                    onClick={() => navigate(`/zakazky/${order.id}`)}
                  >
                    {/* Vertical line */}
                    {i < stats.upcomingOrders.length - 1 && (
                      <div className="absolute left-[9px] top-5 bottom-0 w-px bg-border" />
                    )}
                    {/* Dot */}
                    <div className={`absolute left-[5px] top-[11px] w-[9px] h-[9px] rounded-lg ${dotColor}`} />
                    {/* Content */}
                    <div>
                      <div className="text-xs text-muted-foreground font-medium">{getDateLabel(dateStr)}</div>
                      <div className="text-sm font-medium text-foreground">
                        {order.description || getOrderTypeLabel(order.type)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{customerName}{order.address ? ` · ${order.address}` : ''}</span>
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
              className="text-xs text-primary font-medium mt-2 hover:underline cursor-pointer flex items-center gap-0.5"
              onClick={() => navigate('/zakazky')}
            >
              Zobrazit vše <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* Column 2: Completed + Finance stacked */}
        <div className="flex flex-col gap-4">

          {/* Recently completed */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={15} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Dokončené ({stats.done})
              </h2>
            </div>
            {stats.completedOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Zatím žádné dokončené zakázky</p>
            ) : (
              <div className="space-y-0.5">
                {stats.completedOrders.map((order) => {
                  const customer = customerMap.get(order.customerId)
                  const customerName = customer?.name ?? 'Neznámý'
                  const dateStr = order.completedDate ?? order.updatedAt?.slice(0, 10) ?? ''
                  return (
                    <div
                      key={order.id}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                      onClick={() => navigate(`/zakazky/${order.id}`)}
                    >
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span className="truncate flex-1 text-foreground">
                        {order.description || getOrderTypeLabel(order.type)} — {customerName}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                        {dateStr ? formatShortDate(dateStr) : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Financial mini-summary */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={15} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Finance tento měsíc</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Příjmy</span>
                <span className="font-semibold text-foreground">{formatCurrency(financeStats.monthlyIncome)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nezaplaceno</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(financeStats.unpaid)}{financeStats.unpaidCount > 0 ? ` (${financeStats.unpaidCount} faktur${financeStats.unpaidCount === 1 ? 'a' : financeStats.unpaidCount < 5 ? 'y' : ''})` : ''}
                </span>
              </div>
            </div>
            <button
              className="text-xs text-primary font-medium mt-3 hover:underline cursor-pointer flex items-center gap-0.5"
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

// ── Stat Card ──

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-foreground tabular-nums">{value}</div>
    </div>
  )
}
