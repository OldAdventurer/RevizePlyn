import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../../db/schema'
import { CalendarRange, Plus, Building2, ChevronRight, CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { RevisionSchedule } from '../../types'
import { useState } from 'react'

export default function HarmonogramyList() {
  const schedules = useLiveQuery(() => db.revisionSchedules.toArray()) ?? []
  const customers = useLiveQuery(() => db.customers.toArray()) ?? []
  const [showForm, setShowForm] = useState(false)
  const [formYear, setFormYear] = useState(new Date().getFullYear())
  const [formCustomerId, setFormCustomerId] = useState('')
  const [formName, setFormName] = useState('')
  const [formNote, setFormNote] = useState('')

  const customerMap = new Map(customers.map(c => [c.id, c]))

  function getStats(schedule: RevisionSchedule) {
    const total = schedule.items.length
    const done = schedule.items.filter(i => i.status === 'dokonceno').length
    const planned = schedule.items.filter(i => i.status === 'planovano').length
    const cancelled = schedule.items.filter(i => i.status === 'zruseno').length
    return { total, done, planned, cancelled }
  }

  async function handleCreate() {
    if (!formCustomerId || !formName.trim()) return
    const now = new Date().toISOString()
    const id = `sched-${Date.now()}`
    await db.revisionSchedules.put({
      id,
      customerId: formCustomerId,
      year: formYear,
      name: formName.trim(),
      items: [],
      note: formNote.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    })
    setShowForm(false)
    setFormName('')
    setFormNote('')
    setFormCustomerId('')
  }

  const sorted = [...schedules].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.updatedAt.localeCompare(a.updatedAt)
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarRange className="text-primary" size={28} />
            Harmonogramy revizí
          </h1>
          <p className="text-muted-foreground mt-1">Roční plány revizí pro zákazníky</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <Plus size={20} />
          Nový harmonogram
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 border border-border ">
          <div className="text-2xl font-bold text-foreground">{schedules.length}</div>
          <div className="text-sm text-muted-foreground">Celkem harmonogramů</div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border ">
          <div className="text-2xl font-bold text-green-600">
            {schedules.reduce((sum, s) => sum + s.items.filter(i => i.status === 'dokonceno').length, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Dokončených úkolů</div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border ">
          <div className="text-2xl font-bold text-blue-600">
            {schedules.reduce((sum, s) => sum + s.items.filter(i => i.status === 'planovano').length, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Plánovaných úkolů</div>
        </div>
      </div>

      {/* Schedule cards */}
      <div className="space-y-4">
        {sorted.map(schedule => {
          const customer = customerMap.get(schedule.customerId)
          const stats = getStats(schedule)
          const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
          return (
            <Link
              key={schedule.id}
              to={`/harmonogramy/${schedule.id}`}
              className="block bg-card rounded-lg border border-border   hover:border-border transition-all p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                      {schedule.year}
                    </span>
                    <h2 className="text-lg font-semibold text-foreground truncate">{schedule.name}</h2>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Building2 size={15} />
                    <span>{customer?.name ?? 'Neznámý zákazník'}</span>
                  </div>
                  {schedule.note && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">{schedule.note}</p>
                  )}
                </div>
                <ChevronRight size={20} className="text-muted-foreground mt-2 shrink-0" />
              </div>

              {/* Progress bar and stats */}
              <div className="mt-4">
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-green-500" /> {stats.done} hotovo</span>
                  <span className="flex items-center gap-1"><Clock size={13} className="text-blue-500" /> {stats.planned} plánováno</span>
                  {stats.cancelled > 0 && (
                    <span className="flex items-center gap-1"><XCircle size={13} className="text-muted-foreground" /> {stats.cancelled} zrušeno</span>
                  )}
                  <span className="ml-auto font-semibold text-foreground">{progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </Link>
          )
        })}

        {sorted.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <CalendarRange size={48} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg">Zatím žádné harmonogramy</p>
            <p className="text-sm mt-1">Vytvořte roční plán revizí pro zákazníka</p>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card rounded-lg border border-border w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-foreground mb-4">Nový harmonogram</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Zákazník *</label>
                <select
                  value={formCustomerId}
                  onChange={e => setFormCustomerId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-base"
                >
                  <option value="">Vyberte zákazníka...</option>
                  {customers.filter(c => c.type === 'firma').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Rok *</label>
                <input
                  type="number"
                  value={formYear}
                  onChange={e => setFormYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-base"
                  min={2020}
                  max={2040}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Název harmonogramu *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="např. Harmonogram revizí PZ — Firma XY 2026"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Poznámka</label>
                <textarea
                  value={formNote}
                  onChange={e => setFormNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-base"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-muted cursor-pointer"
              >
                Zrušit
              </button>
              <button
                onClick={handleCreate}
                disabled={!formCustomerId || !formName.trim()}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-40 cursor-pointer"
              >
                Vytvořit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
