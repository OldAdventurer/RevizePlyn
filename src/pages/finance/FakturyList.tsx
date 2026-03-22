import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { Plus, Receipt } from 'lucide-react'
import { db } from '../../db/schema'
import { usePageTitle } from '../../hooks/usePageTitle'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import SearchBar from '../../components/ui/SearchBar'
import Table, { type Column } from '../../components/ui/Table'
import { ListSkeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import {
  formatCurrency,
  formatDate,
  getInvoiceStatusLabel,
  getInvoiceStatusColor,
} from '../../utils/format'
import type { Invoice, InvoiceStatus } from '../../types'

type InvoiceWithCustomer = Invoice & { customerName: string }

const STATUS_FILTERS: { label: string; value: InvoiceStatus | '' }[] = [
  { label: 'Vše', value: '' },
  { label: 'Nové', value: 'nova' },
  { label: 'Odeslané', value: 'odeslana' },
  { label: 'Zaplacené', value: 'zaplacena' },
  { label: 'Po splatnosti', value: 'po-splatnosti' },
  { label: 'Stornované', value: 'stornovana' },
]

export default function FakturyList() {
  usePageTitle('Faktury')
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('')

  const invoices = useLiveQuery(() => db.invoices.orderBy('issueDate').reverse().toArray())
  const customers = useLiveQuery(() => db.customers.toArray())

  const customerMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of customers ?? []) {
      map.set(c.id, c.name)
    }
    return map
  }, [customers])

  const enrichedInvoices = useMemo<InvoiceWithCustomer[]>(() => {
    if (!invoices) return []
    return invoices.map((inv) => ({
      ...inv,
      customerName: customerMap.get(inv.customerId) ?? 'Neznámý zákazník',
    }))
  }, [invoices, customerMap])

  const filteredInvoices = useMemo(() => {
    let result = enrichedInvoices

    if (statusFilter) {
      result = result.filter((inv) => inv.status === statusFilter)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q),
      )
    }

    return result
  }, [enrichedInvoices, statusFilter, search])

  const columns: Column<InvoiceWithCustomer>[] = [
    {
      key: 'invoiceNumber',
      header: 'Číslo faktury',
      render: (inv) => (
        <span className="font-semibold text-[var(--color-text)]">{inv.invoiceNumber}</span>
      ),
    },
    {
      key: 'customerName',
      header: 'Zákazník',
      render: (inv) => <span className="text-gray-700">{inv.customerName}</span>,
    },
    {
      key: 'issueDate',
      header: 'Datum vystavení',
      sortable: true,
      render: (inv) => <span className="text-gray-600">{formatDate(inv.issueDate)}</span>,
    },
    {
      key: 'dueDate',
      header: 'Splatnost',
      sortable: true,
      render: (inv) => (
        <span className={inv.status === 'po-splatnosti' ? 'text-red-600 font-semibold' : 'text-gray-600'}>
          {formatDate(inv.dueDate)}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Částka',
      sortable: true,
      render: (inv) => (
        <span className="font-semibold text-[var(--color-text)]">{formatCurrency(inv.total)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Stav',
      render: (inv) => (
        <Badge variant={getInvoiceStatusColor(inv.status) as 'blue' | 'green' | 'yellow' | 'red' | 'gray'} size="sm">
          {getInvoiceStatusLabel(inv.status)}
        </Badge>
      ),
    },
  ]

  if (invoices === undefined || customers === undefined) {
    return <ListSkeleton />
  }

  return (
    <div className="space-y-4">
      {/* Demo disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm flex items-center gap-2">
        <span className="text-lg">⚠️</span>
        <span><strong>Demo režim</strong> — Všechny faktury jsou fiktivní a slouží pouze pro demonstrační účely.</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Faktury</h1>
          <p className="text-gray-500 mt-1">
            {filteredInvoices.length} z {enrichedInvoices.length} faktur
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/finance/faktury/nova')}
        >
          Nová faktura
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-4">
        <SearchBar placeholder="Hledat podle čísla nebo zákazníka..." onSearch={setSearch} />

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                statusFilter === f.value
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table or Empty */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-6 h-6" />}
          title="Žádné faktury"
          description={
            search || statusFilter
              ? 'Žádné faktury neodpovídají zadaným filtrům.'
              : 'Zatím nemáte žádné faktury. Vytvořte první fakturu.'
          }
          actionLabel={!search && !statusFilter ? '+ Nová faktura' : undefined}
          actionHref={!search && !statusFilter ? '/finance/faktury/nova' : undefined}
        />
      ) : (
        <Table
          columns={columns}
          data={filteredInvoices}
          keyExtractor={(inv) => inv.id}
          onRowClick={(inv) => navigate(`/finance/faktury/${inv.id}`)}
        />
      )}
    </div>
  )
}
