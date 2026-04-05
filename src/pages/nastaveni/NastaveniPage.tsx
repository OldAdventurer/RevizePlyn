import { useState, useEffect, useCallback } from 'react'
import { db } from '../../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate } from '../../utils/format'
import { resetDatabase } from '../../db/seed'
import Card from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Modal from '@/components/ui/modal'
import { Save, RefreshCw, User, Wrench, AlertTriangle, Trash2 } from 'lucide-react'
import type { Technician, Instrument } from '../../types'
import { toast } from '../../stores/toastStore'

// ── Helpers ────────────────────────────────────────────────────────
function emptyInstrument(): Instrument {
  return { id: crypto.randomUUID(), name: '', model: '', calibrationValidUntil: '' }
}

function calibrationColor(dateStr: string): string {
  const diff = (new Date(dateStr).getTime() - Date.now()) / 86_400_000
  if (diff < 0) return 'text-destructive'
  if (diff < 30) return 'text-orange-500'
  return 'text-emerald-600'
}

function calibrationBadge(dateStr: string): string {
  const diff = (new Date(dateStr).getTime() - Date.now()) / 86_400_000
  if (diff < 0) return 'bg-red-100 text-destructive'
  if (diff < 30) return 'bg-orange-100 text-orange-500'
  return 'bg-green-100 text-emerald-600'
}

// ── Main component ─────────────────────────────────────────────────
export default function NastaveniPage() {
  usePageTitle('Nastavení')
  // ── DB queries ──
  const techSetting = useLiveQuery(() => db.settings.get('technician'))
  const technician = techSetting?.value as Technician | undefined

  const customerCount = useLiveQuery(() => db.customers.count()) ?? 0
  const deviceCount = useLiveQuery(() => db.devices.count()) ?? 0
  const orderCount = useLiveQuery(() => db.orders.count()) ?? 0
  const reportCount = useLiveQuery(() => db.revisionReports.count()) ?? 0

  // ── Technician form state ──
  const [form, setForm] = useState<Technician | null>(null)
  const [saveMsg, setSaveMsg] = useState(false)

  useEffect(() => {
    if (technician && !form) setForm({ ...technician })
  }, [technician, form])

  const updateField = useCallback(
    (field: keyof Omit<Technician, 'instruments'>, value: string) =>
      setForm((f) => (f ? { ...f, [field]: value } : f)),
    [],
  )

  const saveTechnician = async () => {
    if (!form) return
    await db.settings.put({ key: 'technician', value: form })
    toast.success('Nastavení bylo uloženo')
    setSaveMsg(true)
    setTimeout(() => setSaveMsg(false), 2000)
  }

  // ── Instrument modals ──
  const [instrModalOpen, setInstrModalOpen] = useState(false)
  const [instrEditing, setInstrEditing] = useState<Instrument | null>(null)
  const [instrForm, setInstrForm] = useState<Instrument>(emptyInstrument())
  const [instrDeleteId, setInstrDeleteId] = useState<string | null>(null)

  const openAddInstrument = () => {
    setInstrEditing(null)
    setInstrForm(emptyInstrument())
    setInstrModalOpen(true)
  }

  const openEditInstrument = (instr: Instrument) => {
    setInstrEditing(instr)
    setInstrForm({ ...instr })
    setInstrModalOpen(true)
  }

  const saveInstrument = async () => {
    if (!form) return
    let instruments: Instrument[]
    if (instrEditing) {
      instruments = form.instruments.map((i) => (i.id === instrEditing.id ? instrForm : i))
    } else {
      instruments = [...form.instruments, instrForm]
    }
    const updated = { ...form, instruments }
    setForm(updated)
    await db.settings.put({ key: 'technician', value: updated })
    setInstrModalOpen(false)
  }

  const deleteInstrument = async () => {
    if (!form || !instrDeleteId) return
    const instruments = form.instruments.filter((i) => i.id !== instrDeleteId)
    const updated = { ...form, instruments }
    setForm(updated)
    await db.settings.put({ key: 'technician', value: updated })
    setInstrDeleteId(null)
  }

  // ── Data management modals ──
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const handleReset = async () => {
    await resetDatabase()
    toast.info('Demo data byla obnovena')
    window.location.reload()
  }

  const handleDeleteAll = async () => {
    await Promise.all([
      db.customers.clear(),
      db.objects.clear(),
      db.devices.clear(),
      db.orders.clear(),
      db.revisionReports.clear(),
      db.defects.clear(),
      db.shareLinks.clear(),
      db.settings.clear(),
    ])
    toast.warning('Všechna data byla smazána')
    setDeleteModalOpen(false)
    setForm(null)
  }

  // ── Render ──
  return (
    <div className="page-enter p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">Nastavení</h1>
        <p className="text-muted-foreground mt-1">Konfigurace aplikace a údajů technika</p>
      </div>

      {/* ── Section 1: Technician ─────────────────────────────── */}
      <Card title="Údaje revizního technika" accent="blue">
        <div className="flex items-center gap-2 mb-4 text-muted-foreground">
          <User size={20} />
          <span className="text-sm">Tyto údaje se přenášejí do revizních zpráv</span>
        </div>

        {form ? (
          <div className="space-y-4">
            <Input
              label="Jméno a příjmení"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Číslo oprávnění"
                value={form.licenseNumber}
                onChange={(e) => updateField('licenseNumber', e.target.value)}
              />
              <Input
                label="IČ"
                value={form.ico}
                onChange={(e) => updateField('ico', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Platnost oprávnění od"
                type="date"
                value={form.licenseValidFrom}
                onChange={(e) => updateField('licenseValidFrom', e.target.value)}
              />
              <Input
                label="Platnost oprávnění do"
                type="date"
                value={form.licenseValidTo}
                onChange={(e) => updateField('licenseValidTo', e.target.value)}
              />
            </div>

            <Input
              label="Adresa sídla"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Telefon"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
              <Input
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button icon={<Save size={18} />} onClick={saveTechnician}>
                Uložit změny
              </Button>
              {saveMsg && (
                <span className="text-emerald-600 font-medium animate-pulse">
                  Uloženo ✓
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Načítání…</p>
        )}
      </Card>

      {/* ── Section 2: Instruments ────────────────────────────── */}
      <Card title="Měřicí přístroje" accent="green">
        <div className="flex items-center gap-2 mb-4 text-muted-foreground">
          <Wrench size={20} />
          <span className="text-sm">Přístroje používané při revizích</span>
        </div>

        {form?.instruments.length ? (
          <div className="space-y-3">
            {form.instruments.map((instr) => (
              <div
                key={instr.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border bg-background"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{instr.name}</p>
                  <p className="text-sm text-muted-foreground">{instr.model}</p>
                  <p className="text-sm mt-1">
                    Kalibrace do:{' '}
                    <span className={`font-medium ${calibrationColor(instr.calibrationValidUntil)}`}>
                      {formatDate(instr.calibrationValidUntil)}
                    </span>
                    <span
                      className={`ml-2 text-xs px-2 py-0.5 rounded-full ${calibrationBadge(instr.calibrationValidUntil)}`}
                    >
                      {(() => {
                        const diff = Math.ceil(
                          (new Date(instr.calibrationValidUntil).getTime() - Date.now()) / 86_400_000,
                        )
                        if (diff < 0) return 'Expirováno'
                        if (diff < 30) return `Zbývá ${diff} dní`
                        return 'Platná'
                      })()}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => openEditInstrument(instr)}>
                    Upravit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    onClick={() => setInstrDeleteId(instr.id)}
                  >
                    Odebrat
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Zatím žádné přístroje.</p>
        )}

        <div className="mt-4">
          <Button variant="secondary" onClick={openAddInstrument}>
            + Přidat přístroj
          </Button>
        </div>
      </Card>

      {/* ── Section 3: Data management ────────────────────────── */}
      <Card title="Správa dat" accent="yellow">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Zákazníků', value: customerCount },
            { label: 'Zařízení', value: deviceCount },
            { label: 'Zakázek', value: orderCount },
            { label: 'Revizních zpráv', value: reportCount },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center p-3 rounded-lg bg-background border border-border"
            >
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            icon={<RefreshCw size={18} />}
            onClick={() => setResetModalOpen(true)}
          >
            Obnovit demo data
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 size={18} />}
            onClick={() => setDeleteModalOpen(true)}
          >
            Smazat všechna data
          </Button>
        </div>
      </Card>

      {/* ── Section 4: About ──────────────────────────────────── */}
      <Card title="O aplikaci">
        <div className="space-y-2">
          <p>
            <strong>RevizePlyn</strong> — Demo aplikace pro evidenci revizí plynových zařízení
          </p>
          <p className="text-sm text-muted-foreground">Verze: 1.0.0</p>
          <p className="text-sm text-muted-foreground">Legislativa: NV č. 191/2022 Sb.</p>
          <p className="text-sm mt-3 p-3 rounded-lg bg-background border border-border text-muted-foreground">
            Tato aplikace je určena pouze pro demonstrační účely. Data jsou uložena lokálně ve vašem
            prohlížeči.
          </p>
        </div>
      </Card>

      {/* ── Instrument add / edit modal ───────────────────────── */}
      <Modal
        isOpen={instrModalOpen}
        onClose={() => setInstrModalOpen(false)}
        title={instrEditing ? 'Upravit přístroj' : 'Přidat přístroj'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setInstrModalOpen(false)}>
              Zrušit
            </Button>
            <Button onClick={saveInstrument}>
              {instrEditing ? 'Uložit' : 'Přidat'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Název"
            value={instrForm.name}
            onChange={(e) => setInstrForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Model"
            value={instrForm.model}
            onChange={(e) => setInstrForm((f) => ({ ...f, model: e.target.value }))}
          />
          <Input
            label="Kalibrace platná do"
            type="date"
            value={instrForm.calibrationValidUntil}
            onChange={(e) =>
              setInstrForm((f) => ({ ...f, calibrationValidUntil: e.target.value }))
            }
          />
        </div>
      </Modal>

      {/* ── Instrument delete confirm ─────────────────────────── */}
      <Modal
        isOpen={instrDeleteId !== null}
        onClose={() => setInstrDeleteId(null)}
        title="Odebrat přístroj"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInstrDeleteId(null)}>
              Zrušit
            </Button>
            <Button variant="danger" onClick={deleteInstrument}>
              Odebrat
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <AlertTriangle size={24} className="text-orange-500 shrink-0 mt-0.5" />
          <p>Opravdu chcete odebrat tento měřicí přístroj?</p>
        </div>
      </Modal>

      {/* ── Reset data confirm ────────────────────────────────── */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Obnovit demo data"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetModalOpen(false)}>
              Zrušit
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Ano, obnovit
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <AlertTriangle size={24} className="text-orange-500 shrink-0 mt-0.5" />
          <p>
            Opravdu chcete obnovit výchozí demo data? Všechna vaše data budou smazána a nahrazena
            ukázkovými daty.
          </p>
        </div>
      </Modal>

      {/* ── Delete all data confirm ───────────────────────────── */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Smazat všechna data"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Zrušit
            </Button>
            <Button variant="danger" onClick={handleDeleteAll}>
              Ano, smazat vše
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <AlertTriangle size={24} className="text-destructive shrink-0 mt-0.5" />
          <p className="font-medium">Všechna data budou nenávratně smazána!</p>
        </div>
      </Modal>
    </div>
  )
}
