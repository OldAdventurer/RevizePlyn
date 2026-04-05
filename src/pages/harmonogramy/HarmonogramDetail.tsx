import { useLiveQuery } from 'dexie-react-hooks'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { db } from '../../db/schema'
import {
  ArrowLeft, Building2, Calendar, CheckCircle2, Clock, XCircle,
  Plus, Trash2, Pencil,
} from 'lucide-react'
import { getOrderTypeLabel } from '../../utils/format'
import { Gantt, Willow } from '@svar-ui/react-gantt'
import '@svar-ui/react-gantt/all.css'
import './gantt-custom.css'
import type { ITask } from '@svar-ui/react-gantt'
import { useState, useMemo } from 'react'
import type { ScheduleItem, ScheduleItemStatus, OrderType } from '../../types'

export default function HarmonogramDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const schedule = useLiveQuery(() => (id ? db.revisionSchedules.get(id) : undefined), [id])
  const customers = useLiveQuery(() => db.customers.toArray()) ?? []
  const devices = useLiveQuery(() => db.devices.toArray()) ?? []
  const objects = useLiveQuery(() => db.objects.toArray()) ?? []
  const allDevicesForCustomer = useLiveQuery(
    () => (schedule ? db.devices.where('customerId').equals(schedule.customerId).toArray() : []),
    [schedule?.customerId]
  ) ?? []

  const [showAddItem, setShowAddItem] = useState(false)
  const [itemDeviceId, setItemDeviceId] = useState('')
  const [itemType, setItemType] = useState<OrderType>('pravidelna-revize')
  const [itemStart, setItemStart] = useState('')
  const [itemEnd, setItemEnd] = useState('')
  const [itemNote, setItemNote] = useState('')

  const customerMap = new Map(customers.map(c => [c.id, c]))
  const deviceMap = new Map(devices.map(d => [d.id, d]))
  const objectMap = new Map(objects.map(o => [o.id, o]))

  const customer = schedule ? customerMap.get(schedule.customerId) : undefined

  // Convert schedule items to Gantt tasks
  const ganttTasks: ITask[] = useMemo(() => {
    if (!schedule) return []

    // Group items by object for summary rows
    const objectGroups = new Map<string, ScheduleItem[]>()
    for (const item of schedule.items) {
      const group = objectGroups.get(item.objectId) ?? []
      group.push(item)
      objectGroups.set(item.objectId, group)
    }

    const tasks: ITask[] = []

    for (const [objectId, items] of objectGroups) {
      const obj = objectMap.get(objectId)
      const summaryId = `obj-summary-${objectId}`

      // Summary row for object
      tasks.push({
        id: summaryId,
        text: obj?.name ?? objectId,
        type: 'summary',
        open: true,
      })

      for (const item of items) {
        const device = deviceMap.get(item.deviceId)
        const statusCss = item.status === 'dokonceno' ? 'gantt-done'
          : item.status === 'zruseno' ? 'gantt-cancelled'
          : 'gantt-planned'
        tasks.push({
          id: item.id,
          text: `${device?.name ?? item.deviceId} — ${getOrderTypeLabel(item.type)}`,
          start: new Date(item.plannedStart),
          end: new Date(item.plannedEnd),
          parent: summaryId,
          progress: item.status === 'dokonceno' ? 100 : 0,
          type: 'task',
          css: statusCss,
        } as ITask)
      }
    }

    return tasks
  }, [schedule, objectMap, deviceMap])

  // Gantt scale config for year view (months)
  const scales = useMemo(() => [
    {
      unit: 'year' as const,
      step: 1,
      format: (date: Date) => `${date.getFullYear()}`,
    },
    {
      unit: 'month' as const,
      step: 1,
      format: (date: Date) => {
        const months = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']
        return months[date.getMonth()]
      },
    },
  ], [])

  async function handleAddItem() {
    if (!schedule || !itemDeviceId || !itemStart || !itemEnd) return
    const device = deviceMap.get(itemDeviceId)
    const newItem: ScheduleItem = {
      id: `si-${Date.now()}`,
      deviceId: itemDeviceId,
      objectId: device?.objectId ?? '',
      type: itemType,
      plannedStart: itemStart,
      plannedEnd: itemEnd,
      status: 'planovano',
      note: itemNote.trim() || undefined,
    }
    await db.revisionSchedules.update(schedule.id, {
      items: [...schedule.items, newItem],
      updatedAt: new Date().toISOString(),
    })
    setShowAddItem(false)
    setItemDeviceId('')
    setItemNote('')
    setItemStart('')
    setItemEnd('')
  }

  async function handleStatusChange(itemId: string, newStatus: ScheduleItemStatus) {
    if (!schedule) return
    const updated = schedule.items.map(i =>
      i.id === itemId ? { ...i, status: newStatus } : i
    )
    await db.revisionSchedules.update(schedule.id, {
      items: updated,
      updatedAt: new Date().toISOString(),
    })
  }

  async function handleDeleteItem(itemId: string) {
    if (!schedule) return
    await db.revisionSchedules.update(schedule.id, {
      items: schedule.items.filter(i => i.id !== itemId),
      updatedAt: new Date().toISOString(),
    })
  }

  async function handleDeleteSchedule() {
    if (!schedule) return
    if (!confirm('Opravdu chcete smazat tento harmonogram?')) return
    await db.revisionSchedules.delete(schedule.id)
    navigate('/harmonogramy')
  }

  if (!schedule) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">Harmonogram nenalezen</p>
        <Link to="/harmonogramy" className="text-[var(--color-primary)] mt-2 inline-block">← Zpět na seznam</Link>
      </div>
    )
  }

  const stats = {
    total: schedule.items.length,
    done: schedule.items.filter(i => i.status === 'dokonceno').length,
    planned: schedule.items.filter(i => i.status === 'planovano').length,
    cancelled: schedule.items.filter(i => i.status === 'zruseno').length,
  }
  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link to="/harmonogramy" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{schedule.name}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
            <span className="flex items-center gap-1"><Building2 size={14} /> {customer?.name ?? '—'}</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> {schedule.year}</span>
          </div>
        </div>
        <button
          onClick={handleDeleteSchedule}
          className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
          title="Smazat harmonogram"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {schedule.note && (
        <p className="text-sm text-gray-400 mb-4 ml-11">{schedule.note}</p>
      )}

      {/* Progress strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Celkem úkolů" value={stats.total} color="gray" />
        <StatCard label="Dokončeno" value={stats.done} color="green" icon={<CheckCircle2 size={16} />} />
        <StatCard label="Plánováno" value={stats.planned} color="blue" icon={<Clock size={16} />} />
        <StatCard label="Zrušeno" value={stats.cancelled} color="gray" icon={<XCircle size={16} />} />
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-500">Celkový postup</span>
          <span className="font-semibold text-gray-700">{progress}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Gantt Chart */}
      {ganttTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Ganttův diagram</h2>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Dokončeno</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Plánováno</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-400 inline-block" /> Zrušeno</span>
            </div>
          </div>
          <div style={{ height: Math.max(350, ganttTasks.length * 44 + 100) }}>
            <Willow>
              <Gantt
                tasks={ganttTasks}
                scales={scales}
                lengthUnit="month"
                cellWidth={100}
                cellHeight={40}
                scaleHeight={40}
                start={new Date(schedule.year, 0, 1)}
                end={new Date(schedule.year, 11, 31)}
                markers={[{ start: new Date(), text: 'Dnes' }]}
                readonly
              />
            </Willow>
          </div>
        </div>
      )}

      {/* Items table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Plánované revize ({stats.total})</h2>
          <button
            onClick={() => setShowAddItem(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary)] text-white text-sm rounded-lg hover:bg-[var(--color-primary-hover)] cursor-pointer"
          >
            <Plus size={16} />
            Přidat
          </button>
        </div>

        {schedule.items.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Calendar size={36} className="mx-auto mb-2 opacity-40" />
            <p>Zatím žádné položky</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-2.5">Zařízení</th>
                  <th className="px-4 py-2.5">Objekt</th>
                  <th className="px-4 py-2.5">Typ</th>
                  <th className="px-4 py-2.5">Termín</th>
                  <th className="px-4 py-2.5">Stav</th>
                  <th className="px-4 py-2.5 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {schedule.items.map(item => {
                  const device = deviceMap.get(item.deviceId)
                  const obj = objectMap.get(item.objectId)
                  return (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{device?.name ?? item.deviceId}</td>
                      <td className="px-4 py-2.5 text-gray-600">{obj?.name ?? item.objectId}</td>
                      <td className="px-4 py-2.5 text-gray-600">{getOrderTypeLabel(item.type)}</td>
                      <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                        {new Date(item.plannedStart).toLocaleDateString('cs-CZ')} – {new Date(item.plannedEnd).toLocaleDateString('cs-CZ')}
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={item.status}
                          onChange={e => handleStatusChange(item.id, e.target.value as ScheduleItemStatus)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${
                            item.status === 'dokonceno' ? 'bg-green-50 text-green-700'
                            : item.status === 'zruseno' ? 'bg-gray-100 text-gray-500'
                            : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          <option value="planovano">Plánováno</option>
                          <option value="dokonceno">Dokončeno</option>
                          <option value="zruseno">Zrušeno</option>
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                          title="Smazat položku"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add item modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAddItem(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              <Pencil size={18} className="inline mr-2" />
              Přidat položku do harmonogramu
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zařízení *</label>
                <select
                  value={itemDeviceId}
                  onChange={e => setItemDeviceId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-base"
                >
                  <option value="">Vyberte zařízení...</option>
                  {allDevicesForCustomer.map(d => {
                    const obj = objectMap.get(d.objectId)
                    return (
                      <option key={d.id} value={d.id}>
                        {d.name} ({obj?.name ?? d.objectId})
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Typ revize *</label>
                <select
                  value={itemType}
                  onChange={e => setItemType(e.target.value as OrderType)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-base"
                >
                  <option value="pravidelna-revize">Pravidelná revize</option>
                  <option value="pravidelna-kontrola">Pravidelná kontrola</option>
                  <option value="mimoradna-revize">Mimořádná revize</option>
                  <option value="nova-stavba">Nová stavba</option>
                  <option value="rekonstrukce">Rekonstrukce</option>
                  <option value="oprava-revize">Oprava po revizi</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Začátek *</label>
                  <input
                    type="date"
                    value={itemStart}
                    onChange={e => setItemStart(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Konec *</label>
                  <input
                    type="date"
                    value={itemEnd}
                    onChange={e => setItemEnd(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poznámka</label>
                <input
                  type="text"
                  value={itemNote}
                  onChange={e => setItemNote(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-base"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddItem(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Zrušit
              </button>
              <button
                onClick={handleAddItem}
                disabled={!itemDeviceId || !itemStart || !itemEnd}
                className="flex-1 px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-lg font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-40 cursor-pointer"
              >
                Přidat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon?: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    gray: 'text-gray-700',
    red: 'text-red-600',
  }
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className={`text-2xl font-bold ${colorMap[color] ?? 'text-gray-700'} flex items-center gap-2`}>
        {icon}
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}
