import { useState, useMemo } from 'react'
import { db } from '../../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import {
  getDeviceCategoryIcon,
  formatDate,
} from '../../utils/format'
import Card from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import SearchBar from '@/components/ui/searchbar'
import Select from '@/components/ui/select'
import Table, { type Column } from '@/components/ui/table'
import { ListSkeleton } from '@/components/ui/skeleton'
import EmptyState from '@/components/ui/emptystate'
import { Clock } from 'lucide-react'
import type { Device, Customer, ObjectRecord } from '../../types'

type DeadlineStatus = 'ok' | 'blizi-se' | 'po-terminu' | 'bez-revize'

interface LhutnikRow {
  device: Device
  customerName: string
  objectName: string
  objectAddress: string
  lastRevisionDate: string | null
  nextRevisionDate: string | null
  daysUntilNext: number | null
  status: DeadlineStatus
}

function computeNextRevision(lastDate: string, periodMonths: number): string {
  const d = new Date(lastDate)
  d.setMonth(d.getMonth() + periodMonths)
  return d.toISOString().slice(0, 10)
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function getStatus(daysUntil: number | null, alertBeforeMonths: number): DeadlineStatus {
  if (daysUntil === null) return 'bez-revize'
  if (daysUntil < 0) return 'po-terminu'
  if (daysUntil <= alertBeforeMonths * 30) return 'blizi-se'
  return 'ok'
}

const statusLabel: Record<DeadlineStatus, string> = {
  'ok': '🟢 V pořádku',
  'blizi-se': '🟡 Blíží se',
  'po-terminu': '🔴 Po termínu',
  'bez-revize': '⚪ Bez revize',
}

const statusBadgeVariant: Record<DeadlineStatus, 'green' | 'yellow' | 'red' | 'gray'> = {
  'ok': 'green',
  'blizi-se': 'yellow',
  'po-terminu': 'red',
  'bez-revize': 'gray',
}

const statusFilterOptions = [
  { value: '', label: 'Všechny stavy' },
  { value: 'po-terminu', label: '🔴 Po termínu' },
  { value: 'blizi-se', label: '🟡 Blíží se' },
  { value: 'ok', label: '🟢 V pořádku' },
  { value: 'bez-revize', label: '⚪ Bez revize' },
]

export default function LhutnikPage() {
  usePageTitle('Lhůtník — Termíny revizí')
  const navigate = useNavigate()

  const devices = useLiveQuery(() => db.devices.toArray())
  const customers = useLiveQuery(() => db.customers.toArray())
  const objects = useLiveQuery(() => db.objects.toArray())
  const reports = useLiveQuery(() => db.revisionReports.toArray())

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [mediumFilter, setMediumFilter] = useState('')

  const rows = useMemo(() => {
    if (!devices || !customers || !objects || !reports) return null

    const customerMap = new Map<string, Customer>()
    for (const c of customers) customerMap.set(c.id, c)

    const objectMap = new Map<string, ObjectRecord>()
    for (const o of objects) objectMap.set(o.id, o)

    // Find latest revision date per device
    const latestRevision = new Map<string, string>()
    for (const r of reports) {
      for (const deviceId of r.deviceIds) {
        const existing = latestRevision.get(deviceId)
        if (!existing || r.date > existing) {
          latestRevision.set(deviceId, r.date)
        }
      }
    }

    return devices.map((device): LhutnikRow => {
      const customer = customerMap.get(device.customerId)
      const object = objectMap.get(device.objectId)
      const lastDate = latestRevision.get(device.id) ?? null

      let nextDate: string | null = null
      let daysUntil: number | null = null

      if (lastDate && device.revisionPeriodMonths > 0) {
        nextDate = computeNextRevision(lastDate, device.revisionPeriodMonths)
        daysUntil = getDaysUntil(nextDate)
      }

      const status = getStatus(daysUntil, device.alertBeforeMonths)

      return {
        device,
        customerName: customer?.name ?? '—',
        objectName: object?.name ?? '—',
        objectAddress: object?.address ?? '',
        lastRevisionDate: lastDate,
        nextRevisionDate: nextDate,
        daysUntilNext: daysUntil,
        status,
      }
    })
  }, [devices, customers, objects, reports])

  const filtered = useMemo(() => {
    if (!rows) return null
    return rows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false
      if (mediumFilter && row.device.medium !== mediumFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const haystack = [
          row.device.name,
          row.customerName,
          row.objectName,
          row.objectAddress,
          row.device.manufacturer,
          row.device.model,
        ].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    }).sort((a, b) => {
      // Sort: po-terminu first, then blizi-se, then bez-revize, then ok
      const order: Record<DeadlineStatus, number> = { 'po-terminu': 0, 'blizi-se': 1, 'bez-revize': 2, 'ok': 3 }
      const diff = order[a.status] - order[b.status]
      if (diff !== 0) return diff
      // Within same status, sort by daysUntilNext ascending (most urgent first)
      return (a.daysUntilNext ?? 9999) - (b.daysUntilNext ?? 9999)
    })
  }, [rows, statusFilter, mediumFilter, search])

  // Stats
  const stats = useMemo(() => {
    if (!rows) return null
    let overdue = 0, approaching = 0, ok = 0, noRevision = 0
    for (const r of rows) {
      if (r.status === 'po-terminu') overdue++
      else if (r.status === 'blizi-se') approaching++
      else if (r.status === 'ok') ok++
      else noRevision++
    }
    return { overdue, approaching, ok, noRevision, total: rows.length }
  }, [rows])

  if (!filtered || !stats) {
    return <ListSkeleton />
  }

  const columns: Column<LhutnikRow>[] = [
    {
      key: 'device',
      header: 'Zařízení',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-medium">{getDeviceCategoryIcon(r.device.category)} {r.device.name}</span>
          <div className="text-xs text-gray-500 mt-0.5">{r.device.manufacturer} {r.device.model}</div>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Zákazník',
      sortable: true,
    },
    {
      key: 'objectName',
      header: 'Objekt',
      render: (r) => (
        <div>
          <span>{r.objectName}</span>
          {r.objectAddress && <div className="text-xs text-gray-500">{r.objectAddress}</div>}
        </div>
      ),
    },
    {
      key: 'lastRevisionDate',
      header: 'Poslední revize',
      sortable: true,
      render: (r) => r.lastRevisionDate ? formatDate(r.lastRevisionDate) : <span className="text-gray-400">—</span>,
    },
    {
      key: 'nextRevisionDate',
      header: 'Příští revize',
      sortable: true,
      render: (r) => r.nextRevisionDate ? (
        <span className={r.status === 'po-terminu' ? 'text-red-600 font-semibold' : r.status === 'blizi-se' ? 'text-amber-600 font-medium' : ''}>
          {formatDate(r.nextRevisionDate)}
        </span>
      ) : <span className="text-gray-400">—</span>,
    },
    {
      key: 'daysUntilNext',
      header: 'Zbývá',
      sortable: true,
      render: (r) => {
        if (r.daysUntilNext === null) return <span className="text-gray-400">—</span>
        if (r.daysUntilNext < 0) return <span className="text-red-600 font-semibold">{Math.abs(r.daysUntilNext)} dní po</span>
        return <span>{r.daysUntilNext} dní</span>
      },
    },
    {
      key: 'status',
      header: 'Stav',
      sortable: true,
      render: (r) => <Badge variant={statusBadgeVariant[r.status]}>{statusLabel[r.status]}</Badge>,
    },
  ]

  return (
    <div className="page-enter p-4 md:p-4 space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)]">
          <Clock size={28} className="inline mr-2 -mt-1" />
          Lhůtník — Termíny revizí
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Přehled všech zařízení a jejich termínů revizí
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Po termínu"
          value={stats.overdue}
          icon="🔴"
          color="red"
          onClick={() => setStatusFilter(statusFilter === 'po-terminu' ? '' : 'po-terminu')}
          active={statusFilter === 'po-terminu'}
        />
        <StatCard
          label="Blíží se"
          value={stats.approaching}
          icon="🟡"
          color="amber"
          onClick={() => setStatusFilter(statusFilter === 'blizi-se' ? '' : 'blizi-se')}
          active={statusFilter === 'blizi-se'}
        />
        <StatCard
          label="V pořádku"
          value={stats.ok}
          icon="🟢"
          color="green"
          onClick={() => setStatusFilter(statusFilter === 'ok' ? '' : 'ok')}
          active={statusFilter === 'ok'}
        />
        <StatCard
          label="Bez revize"
          value={stats.noRevision}
          icon="⚪"
          color="gray"
          onClick={() => setStatusFilter(statusFilter === 'bez-revize' ? '' : 'bez-revize')}
          active={statusFilter === 'bez-revize'}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar onSearch={setSearch} placeholder="Hledat zařízení, zákazníka, objekt…" />
        </div>
        <div className="flex gap-2">
          <Select
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Select
            options={[
              { value: '', label: 'Všechna média' },
              { value: 'plyn', label: 'Plyn' },
              { value: 'tlakovy-vzduch', label: 'Tlakový vzduch' },
            ]}
            value={mediumFilter}
            onChange={(e) => setMediumFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Clock size={32} />}
            title="Žádné záznamy"
            description={search || statusFilter ? 'Zkuste upravit filtry' : 'Zatím žádná zařízení v evidenci'}
          />
        </Card>
      ) : (
        <Card>
          <div className="text-sm text-[var(--color-text-secondary)] mb-2">
            Zobrazeno {filtered.length} z {stats.total} zařízení
          </div>
          <Table
            columns={columns}
            data={filtered}
            keyExtractor={(r) => r.device.id}
            onRowClick={(r) => navigate(`/zarizeni/${r.device.id}`)}
          />
        </Card>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
  onClick,
  active,
}: {
  label: string
  value: number
  icon: string
  color: string
  onClick: () => void
  active: boolean
}) {
  const borderClass = active ? `ring-2 ring-${color}-400` : ''
  return (
    <button
      onClick={onClick}
      className={`bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl shadow-sm p-3 text-left transition-all hover:shadow-md cursor-pointer ${borderClass} ${active ? 'bg-white/80' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-2xl font-bold text-[var(--color-text)]">{value}</span>
      </div>
      <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{label}</div>
    </button>
  )
}
