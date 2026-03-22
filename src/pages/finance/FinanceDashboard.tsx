import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import {
  Banknote,
  TrendingUp,
  Receipt,
  AlertCircle,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { db } from '../../db/schema'
import { usePageTitle } from '../../hooks/usePageTitle'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { DashboardSkeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import {
  formatCurrency,
  formatDate,
  getInvoiceStatusLabel,
  getInvoiceStatusColor,
} from '../../utils/format'
import type { Invoice } from '../../types'

const CZECH_MONTHS = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
]

export default function FinanceDashboard() {
  usePageTitle('Finance')
  const navigate = useNavigate()

  const invoices = useLiveQuery(() => db.invoices.toArray())
  const customers = useLiveQuery(() => db.customers.toArray())

  const customerMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of customers ?? []) {
      map.set(c.id, c.name)
    }
    return map
  }, [customers])

  const stats = useMemo(() => {
    if (!invoices) return null

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const todayStr = now.toISOString().slice(0, 10)

    let revenueThisMonth = 0
    let revenueThisYear = 0
    let unpaidCount = 0
    let unpaidTotal = 0
    let overdueCount = 0
    let overdueTotal = 0

    for (const inv of invoices) {
      if (inv.status === 'zaplacena') {
        const paid = new Date(inv.paidDate ?? inv.issueDate)
        if (paid.getFullYear() === currentYear) {
          revenueThisYear += inv.total
          if (paid.getMonth() === currentMonth) {
            revenueThisMonth += inv.total
          }
        }
      }
      if (inv.status === 'odeslana' || inv.status === 'po-splatnosti') {
        unpaidCount++
        unpaidTotal += inv.total
      }
      if (inv.status === 'po-splatnosti' || (inv.status === 'odeslana' && inv.dueDate < todayStr)) {
        overdueCount++
        overdueTotal += inv.total
      }
    }

    return { revenueThisMonth, revenueThisYear, unpaidCount, unpaidTotal, overdueCount, overdueTotal }
  }, [invoices])

  const monthlyRevenue = useMemo(() => {
    if (!invoices) return []

    const now = new Date()
    const months: { label: string; amount: number }[] = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const month = d.getMonth()
      const label = `${CZECH_MONTHS[month]} ${year}`
      let amount = 0

      for (const inv of invoices) {
        if (inv.status === 'zaplacena') {
          const paid = new Date(inv.paidDate ?? inv.issueDate)
          if (paid.getFullYear() === year && paid.getMonth() === month) {
            amount += inv.total
          }
        }
      }

      months.push({ label, amount })
    }

    return months
  }, [invoices])

  const maxMonthly = useMemo(
    () => Math.max(...monthlyRevenue.map((m) => m.amount), 1),
    [monthlyRevenue],
  )

  const recentInvoices = useMemo(() => {
    if (!invoices) return []
    return [...invoices]
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
      .slice(0, 5)
  }, [invoices])

  if (invoices === undefined || customers === undefined) {
    return <DashboardSkeleton />
  }

  if (invoices.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="w-6 h-6" />}
        title="Žádné faktury"
        description="Zatím nemáte žádné faktury. Vytvořte první fakturu."
        actionLabel="+ Nová faktura"
        actionHref="/finance/faktury/nova"
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Demo disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm flex items-center gap-2">
        <span className="text-lg">⚠️</span>
        <span><strong>Demo režim</strong> — Všechny faktury a finanční údaje jsou fiktivní a slouží pouze pro demonstrační účely.</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Finance</h1>
          <p className="text-gray-500 mt-1">Přehled příjmů a faktur</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/finance/faktury/nova')}
        >
          Nová faktura
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Banknote className="w-5 h-5" />}
          iconBg="bg-green-100 text-green-600"
          label="Příjmy tento měsíc"
          value={formatCurrency(stats?.revenueThisMonth ?? 0)}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-blue-100 text-blue-600"
          label="Příjmy tento rok"
          value={formatCurrency(stats?.revenueThisYear ?? 0)}
        />
        <StatCard
          icon={<Receipt className="w-5 h-5" />}
          iconBg="bg-yellow-100 text-yellow-600"
          label="Nezaplacené faktury"
          value={formatCurrency(stats?.unpaidTotal ?? 0)}
          sub={`${stats?.unpaidCount ?? 0} faktur`}
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5" />}
          iconBg="bg-red-100 text-red-600"
          label="Po splatnosti"
          value={formatCurrency(stats?.overdueTotal ?? 0)}
          sub={`${stats?.overdueCount ?? 0} faktur`}
          highlight={!!stats?.overdueCount}
        />
      </div>

      {/* Monthly Revenue Chart */}
      <Card title="Měsíční příjmy">
        <div className="space-y-3">
          {monthlyRevenue.map((m) => (
            <div key={m.label} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-36 shrink-0 truncate">{m.label}</span>
              <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                {m.amount > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-[var(--color-primary)] to-blue-400 rounded-lg transition-all duration-500"
                    style={{ width: `${(m.amount / maxMonthly) * 100}%`, minWidth: '2px' }}
                  />
                )}
              </div>
              <span className="text-sm font-semibold text-gray-700 w-28 text-right shrink-0">
                {formatCurrency(m.amount)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Invoices */}
      <Card title="Poslední faktury">
        <div className="divide-y divide-gray-100">
          {recentInvoices.map((inv) => (
            <RecentInvoiceRow
              key={inv.id}
              invoice={inv}
              customerName={customerMap.get(inv.customerId) ?? 'Neznámý'}
              onClick={() => navigate(`/finance/faktury/${inv.id}`)}
            />
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => navigate('/finance/faktury')}
            className="text-[var(--color-primary)] hover:underline text-sm font-medium inline-flex items-center gap-1"
          >
            Zobrazit všechny faktury <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  )
}

/* ─── Helper Components ─────────────────────────────────────────────── */

function StatCard({
  icon,
  iconBg,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <Card className={highlight ? '!border-red-200 !bg-red-50/50' : undefined}>
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className={`text-xl font-bold mt-0.5 ${highlight ? 'text-red-600' : 'text-[var(--color-text)]'}`}>
            {value}
          </p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </Card>
  )
}

function RecentInvoiceRow({
  invoice,
  customerName,
  onClick,
}: {
  invoice: Invoice
  customerName: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 py-3 px-1 hover:bg-gray-50 rounded-lg transition-colors text-left cursor-pointer"
    >
      <div className="min-w-0">
        <p className="font-semibold text-[var(--color-text)] truncate">
          {invoice.invoiceNumber} — {customerName}
        </p>
        <p className="text-sm text-gray-500">{formatDate(invoice.issueDate)}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-semibold text-[var(--color-text)]">
          {formatCurrency(invoice.total)}
        </span>
        <Badge variant={getInvoiceStatusColor(invoice.status) as 'blue' | 'green' | 'yellow' | 'red' | 'gray'} size="sm">
          {getInvoiceStatusLabel(invoice.status)}
        </Badge>
      </div>
    </button>
  )
}
