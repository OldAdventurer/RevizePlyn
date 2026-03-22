import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, Link } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { db } from '../../db/schema'
import { formatDate, getOrderStatusLabel, getOrderStatusColor, getOrderTypeLabel } from '../../utils/format'
import type { Order } from '../../types'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import SearchBar from '../../components/ui/SearchBar'
import Table, { type Column } from '../../components/ui/Table'
import { Plus, Filter, FileText, ClipboardList } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'

type OrderWithCustomer = Order & { customerName: string }

const statusOptions = [
  { value: '', label: 'Všechny stavy' },
  { value: 'nova', label: 'Nová' },
  { value: 'naplanovana', label: 'Naplánovaná' },
  { value: 'probiha', label: 'Probíhá' },
  { value: 'dokoncena', label: 'Dokončena' },
  { value: 'fakturovano', label: 'Fakturováno' },
  { value: 'odlozena', label: 'Odložená' },
  { value: 'zrusena', label: 'Zrušená' },
]

const typeOptions = [
  { value: '', label: 'Všechny typy' },
  { value: 'nova-stavba', label: 'Nová stavba' },
  { value: 'rekonstrukce', label: 'Rekonstrukce' },
  { value: 'pravidelna-revize', label: 'Pravidelná revize' },
  { value: 'pravidelna-kontrola', label: 'Pravidelná kontrola' },
  { value: 'mimoradna-revize', label: 'Mimořádná revize' },
  { value: 'oprava-revize', label: 'Oprava + revize' },
]

const priorityOptions = [
  { value: '', label: 'Všechny priority' },
  { value: 'normalni', label: 'Normální' },
  { value: 'specha', label: 'Spěchá' },
]

export default function ZakazkyList() {
  usePageTitle('Zakázky')
  const navigate = useNavigate()
  const orders = useLiveQuery(() => db.orders.orderBy('createdAt').reverse().toArray())
  const customers = useLiveQuery(() => db.customers.toArray())

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const customerMap = useMemo(() => {
    const map = new Map<string, string>()
    customers?.forEach((c) => map.set(c.id, c.name))
    return map
  }, [customers])

  const enrichedOrders: OrderWithCustomer[] = useMemo(() => {
    if (!orders) return []
    return orders.map((o) => ({
      ...o,
      customerName: customerMap.get(o.customerId) ?? '—',
    }))
  }, [orders, customerMap])

  const filteredOrders = useMemo(() => {
    let result = enrichedOrders

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.customerName.toLowerCase().includes(q) ||
          o.address.toLowerCase().includes(q) ||
          (o.description ?? '').toLowerCase().includes(q),
      )
    }

    if (statusFilter) result = result.filter((o) => o.status === statusFilter)
    if (typeFilter) result = result.filter((o) => o.type === typeFilter)
    if (priorityFilter) result = result.filter((o) => o.priority === priorityFilter)

    return result
  }, [enrichedOrders, search, statusFilter, typeFilter, priorityFilter])

  const columns: Column<OrderWithCustomer>[] = [
    {
      key: 'plannedDate',
      header: 'Datum',
      sortable: true,
      render: (o) => (o.plannedDate ? formatDate(o.plannedDate) : '—'),
    },
    {
      key: 'customerName',
      header: 'Zákazník',
      sortable: true,
      render: (o) => <span className="font-medium">{o.customerName}</span>,
    },
    {
      key: 'address',
      header: 'Adresa',
    },
    {
      key: 'type',
      header: 'Typ',
      render: (o) => <Badge variant="blue">{getOrderTypeLabel(o.type)}</Badge>,
    },
    {
      key: 'status',
      header: 'Stav',
      render: (o) => (
        <Badge variant={getOrderStatusColor(o.status) as 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'indigo' | 'emerald' | 'orange'}>
          {getOrderStatusLabel(o.status)}
        </Badge>
      ),
    },
    {
      key: 'priority',
      header: 'Priorita',
      render: (o) =>
        o.priority === 'specha' ? (
          <Badge variant="red">Spěchá</Badge>
        ) : (
          <span className="text-gray-500">Normální</span>
        ),
    },
  ]

  return (
    <div className="page-enter p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Zakázky</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Přehled všech zakázek</p>
        </div>
        <Link to="/zakazky/nova">
          <Button icon={<Plus size={20} />}>Nová zakázka</Button>
        </Link>
      </div>

      {/* Search + filter toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          placeholder="Hledat zákazníka, adresu, popis…"
          onSearch={setSearch}
          className="flex-1"
        />
        <Button
          variant="secondary"
          icon={<Filter size={18} />}
          onClick={() => setShowFilters(!showFilters)}
          className="sm:hidden"
        >
          Filtrovat
        </Button>
      </div>

      {/* Filters */}
      <div className={`bg-white rounded-xl border border-[var(--color-border)]/60 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 ${showFilters ? '' : 'hidden sm:grid'}`}>
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          placeholder="Všechny stavy"
        />
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          placeholder="Všechny typy"
        />
        <Select
          options={priorityOptions}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          placeholder="Všechny priority"
        />
      </div>

      {/* Table / empty state */}
      {orders && orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={32} />}
          title="Žádné zakázky"
          description="Začněte vytvořením první zakázky. Můžete také obnovit demo data v nastavení."
          actionLabel="+ Nová zakázka"
          actionHref="/zakazky/nova"
        />
      ) : (
        <Card>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-lg text-[var(--color-text-secondary)]">Žádné zakázky odpovídající vašim filtrům</p>
            </div>
          ) : (
            <Table<OrderWithCustomer>
              columns={columns}
              data={filteredOrders}
              keyExtractor={(o) => o.id}
              onRowClick={(o) => navigate(`/zakazky/${o.id}`)}
            />
          )}
        </Card>
      )}
    </div>
  )
}
