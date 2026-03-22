import { useState, useMemo } from 'react'
import { db } from '../../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, Link } from 'react-router-dom'
import { formatDate, getRevisionTypeLabel, getConclusionLabel } from '../../utils/format'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import SearchBar from '../../components/ui/SearchBar'
import Select from '../../components/ui/Select'
import Table, { type Column } from '../../components/ui/Table'
import { Plus, Filter, FileText } from 'lucide-react'
import type { RevisionReport, Customer } from '../../types'

function conclusionVariant(c: string): 'green' | 'yellow' | 'red' {
  if (c === 'schopne') return 'green'
  if (c === 's-vyhradami') return 'yellow'
  return 'red'
}

function typeVariant(t: string): 'blue' | 'indigo' | 'orange' {
  if (t === 'vychozi') return 'blue'
  if (t === 'provozni') return 'indigo'
  return 'orange'
}

export default function RevizeList() {
  const navigate = useNavigate()
  const reports = useLiveQuery(() => db.revisionReports.orderBy('date').reverse().toArray())
  const customers = useLiveQuery(() => db.customers.toArray())
  const defects = useLiveQuery(() => db.defects.toArray())

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterConclusion, setFilterConclusion] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')

  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>()
    if (customers) for (const c of customers) map.set(c.id, c)
    return map
  }, [customers])

  const defectCountMap = useMemo(() => {
    const map = new Map<string, number>()
    if (defects) {
      for (const d of defects) {
        map.set(d.revisionReportId, (map.get(d.revisionReportId) ?? 0) + 1)
      }
    }
    return map
  }, [defects])

  const filtered = useMemo(() => {
    if (!reports) return []
    return reports.filter((r) => {
      if (filterType && r.type !== filterType) return false
      if (filterConclusion && r.conclusion !== filterConclusion) return false
      if (dateFrom && r.date < dateFrom) return false
      if (dateTo && r.date > dateTo) return false
      if (search) {
        const q = search.toLowerCase()
        const customer = customerMap.get(r.customerId)
        const match =
          r.reportNumber.toLowerCase().includes(q) ||
          (customer?.name ?? '').toLowerCase().includes(q) ||
          getConclusionLabel(r.conclusion).toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [reports, customers, search, filterType, filterConclusion, dateFrom, dateTo, customerMap])

  if (!reports || !customers || !defects) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-primary)] mx-auto mb-3" />
          <p className="text-lg text-gray-500">Načítám data…</p>
        </div>
      </div>
    )
  }

  const columns: Column<RevisionReport>[] = [
    { key: 'reportNumber', header: 'Číslo zprávy', sortable: true },
    {
      key: 'date',
      header: 'Datum',
      sortable: true,
      render: (item) => formatDate(item.date),
    },
    {
      key: 'customerId',
      header: 'Zákazník',
      render: (item) => customerMap.get(item.customerId)?.name ?? '—',
    },
    {
      key: 'type',
      header: 'Typ',
      render: (item) => (
        <Badge variant={typeVariant(item.type)}>{getRevisionTypeLabel(item.type)}</Badge>
      ),
    },
    {
      key: 'conclusion',
      header: 'Závěr',
      render: (item) => (
        <Badge variant={conclusionVariant(item.conclusion)}>
          {getConclusionLabel(item.conclusion)}
        </Badge>
      ),
    },
    {
      key: 'defects',
      header: 'Závad',
      render: (item) => {
        const count = defectCountMap.get(item.id) ?? 0
        return count > 0 ? (
          <Badge variant="red">{count}</Badge>
        ) : (
          <span className="text-gray-400">0</span>
        )
      },
    },
  ]

  return (
    <div className="page-enter p-4 md:p-6 flex flex-col gap-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Revizní zprávy</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Přehled revizních zpráv a protokolů</p>
        </div>
        <Link
          to="/zakazky"
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 text-base rounded-xl font-medium bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          Nová revize
        </Link>
      </div>

      {/* Search */}
      <SearchBar
        placeholder="Hledat dle čísla, zákazníka, závěru…"
        onSearch={setSearch}
      />

      {/* Filters toggle */}
      <div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 text-base text-[var(--color-primary)] font-medium cursor-pointer hover:underline"
        >
          <Filter size={18} />
          {showFilters ? 'Skrýt filtry' : 'Zobrazit filtry'}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-[var(--color-border)]/60 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Typ revize"
            placeholder="Všechny"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={[
              { value: 'vychozi', label: 'Výchozí' },
              { value: 'provozni', label: 'Provozní' },
              { value: 'mimoradna', label: 'Mimořádná' },
            ]}
          />
          <Select
            label="Závěr"
            placeholder="Všechny"
            value={filterConclusion}
            onChange={(e) => setFilterConclusion(e.target.value)}
            options={[
              { value: 'schopne', label: 'Schopné' },
              { value: 's-vyhradami', label: 'S výhradami' },
              { value: 'neschopne', label: 'Neschopné' },
            ]}
          />
          <div className="w-full">
            <label className="block text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
              Datum od
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full min-h-[44px] text-base p-3 border border-[var(--color-border)] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
              Datum do
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full min-h-[44px] text-base p-3 border border-[var(--color-border)] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>
      )}

      {/* View toggle + count */}
      <div className="flex items-center justify-between">
        <p className="text-base text-gray-500">
          {filtered.length}{' '}
          {filtered.length === 1 ? 'zpráva' : filtered.length < 5 ? 'zprávy' : 'zpráv'}
        </p>
        <div className="flex gap-1 border border-[var(--color-border)] rounded-xl overflow-hidden">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 cursor-pointer transition-colors ${
              viewMode === 'table' ? 'bg-[var(--color-primary)] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
            aria-label="Tabulka"
          >
            <FileText size={20} />
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 cursor-pointer transition-colors ${
              viewMode === 'card' ? 'bg-[var(--color-primary)] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
            aria-label="Karty"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-lg text-[var(--color-text-secondary)]">Žádné revizní zprávy</p>
        </div>
      ) : viewMode === 'table' ? (
        <Table<RevisionReport>
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          onRowClick={(item) => navigate(`/revizni-zpravy/${item.id}`)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((report) => {
            const customer = customerMap.get(report.customerId)
            const defectCount = defectCountMap.get(report.id) ?? 0
            return (
              <Card
                key={report.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <div
                  onClick={() => navigate(`/revizni-zpravy/${report.id}`)}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--color-text)]">
                      {report.reportNumber}
                    </span>
                    <span className="text-sm text-gray-500">{formatDate(report.date)}</span>
                  </div>
                  <p className="text-base text-gray-600">{customer?.name ?? '—'}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={typeVariant(report.type)}>
                      {getRevisionTypeLabel(report.type)}
                    </Badge>
                    <Badge variant={conclusionVariant(report.conclusion)}>
                      {getConclusionLabel(report.conclusion)}
                    </Badge>
                  </div>
                  {defectCount > 0 && (
                    <p className="text-sm text-red-600 font-medium">
                      Závad: {defectCount}
                    </p>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
