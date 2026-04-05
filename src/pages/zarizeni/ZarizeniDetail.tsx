import { useState, useMemo } from 'react'
import { db } from '../../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { DetailSkeleton } from '@/components/ui/skeleton'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate, getDeviceCategoryLabel, getConclusionLabel, getRevisionTypeLabel, getDeviceCategoryIcon, getPressureCategoryLabel, getMediumLabel } from '../../utils/format'
import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, QrCode, Edit, Trash2, ChevronRight } from 'lucide-react'
import type { DeviceCategory, PressureCategory, Medium, RevisionConclusion } from '../../types'
import { toast } from '../../stores/toastStore'

const conclusionBadge: Record<RevisionConclusion, 'green' | 'yellow' | 'red'> = {
  schopne: 'green', 's-vyhradami': 'yellow', neschopne: 'red',
}
const categoryBadge: Record<DeviceCategory, string> = {
  kotel: 'red', ohrivac: 'blue', sporak: 'orange', rozvod: 'indigo',
  regulator: 'emerald', kompresor: 'yellow', vzduchojimac: 'yellow', susicka: 'blue',
  'vtl-potrubi': 'red', 'stl-potrubi': 'orange', kotelna: 'red',
  'prumyslovy-horak': 'red', filtr: 'green', ostatni: 'gray',
}

export default function ZarizeniDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const device = useLiveQuery(() => db.devices.get(id!), [id])
  usePageTitle(device?.name ?? 'Detail zařízení')
  const customer = useLiveQuery(() => (device ? db.customers.get(device.customerId) : undefined), [device])
  const object = useLiveQuery(() => (device ? db.objects.get(device.objectId) : undefined), [device])
  const allReports = useLiveQuery(() => db.revisionReports.toArray(), [])
  const customers = useLiveQuery(() => db.customers.toArray())
  const objects = useLiveQuery(() => db.objects.toArray())

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState({
    name: '', category: 'kotel' as DeviceCategory, pressureCategory: 'NTL' as PressureCategory,
    medium: 'plyn' as Medium, manufacturer: '', model: '',
    serialNumber: '', yearOfManufacture: '', yearOfInstallation: '',
    power: '', volume: '', maxPressure: '', maxTemperature: '',
    revisionPeriodMonths: '36', alertBeforeMonths: '2',
    location: '', technicalParams: '', customerId: '', objectId: '', note: '',
  })

  const deviceReports = useMemo(
    () => (allReports ?? []).filter((r) => r.deviceIds.includes(id!)).sort((a, b) => b.date.localeCompare(a.date)),
    [allReports, id],
  )
  const filteredObjects = useMemo(() => {
    if (!form.customerId) return objects ?? []
    return (objects ?? []).filter((o) => o.customerId === form.customerId)
  }, [objects, form.customerId])

  const openEdit = () => {
    if (!device) return
    setForm({
      name: device.name, category: device.category, pressureCategory: device.pressureCategory,
      medium: device.medium, manufacturer: device.manufacturer, model: device.model,
      serialNumber: device.serialNumber ?? '', yearOfManufacture: device.yearOfManufacture?.toString() ?? '',
      yearOfInstallation: device.yearOfInstallation?.toString() ?? '',
      power: device.power ?? '', volume: device.volume ?? '',
      maxPressure: device.maxPressure ?? '', maxTemperature: device.maxTemperature ?? '',
      revisionPeriodMonths: device.revisionPeriodMonths.toString(),
      alertBeforeMonths: device.alertBeforeMonths.toString(),
      location: device.location ?? '', technicalParams: device.technicalParams ?? '',
      customerId: device.customerId, objectId: device.objectId, note: device.note ?? '',
    })
    setEditOpen(true)
  }

  const handleSave = async () => {
    if (!device || !form.name || !form.customerId || !form.objectId) return
    await db.devices.put({
      ...device, name: form.name, category: form.category,
      pressureCategory: form.pressureCategory, medium: form.medium,
      manufacturer: form.manufacturer, model: form.model,
      serialNumber: form.serialNumber || undefined,
      yearOfManufacture: form.yearOfManufacture ? Number(form.yearOfManufacture) : undefined,
      yearOfInstallation: form.yearOfInstallation ? Number(form.yearOfInstallation) : undefined,
      power: form.power || undefined, volume: form.volume || undefined,
      maxPressure: form.maxPressure || undefined, maxTemperature: form.maxTemperature || undefined,
      revisionPeriodMonths: Number(form.revisionPeriodMonths) || 36,
      alertBeforeMonths: Number(form.alertBeforeMonths) || 2,
      location: form.location || undefined, technicalParams: form.technicalParams || undefined,
      customerId: form.customerId, objectId: form.objectId, note: form.note || undefined,
    })
    toast.success('Zařízení bylo upraveno')
    setEditOpen(false)
  }

  const handleDelete = async () => {
    if (!device) return
    await db.devices.delete(device.id)
    toast.success('Zařízení bylo smazáno')
    navigate('/zarizeni')
  }

  if (device === undefined) return <DetailSkeleton />
  if (device === null) return <div className="py-12 text-center text-muted-foreground">Zařízení nenalezeno</div>

  const qrUrl = `${window.location.origin}/zarizeni/${device.id}`

  return (
    <div className="page-enter space-y-6">
      <Link to="/zarizeni" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Zpět na zařízení
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getDeviceCategoryIcon(device.category)}</span>
            <h1 className="text-xl font-semibold text-foreground">{device.name}</h1>
            <Badge variant={categoryBadge[device.category] as any} size="sm">{getDeviceCategoryLabel(device.category)}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {customer?.name} · {object?.name ?? ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<QrCode size={14} />} onClick={() => navigate(`/zarizeni/${device.id}/qr`)}>QR</Button>
          <Button variant="outline" size="sm" icon={<Edit size={14} />} onClick={openEdit}>Upravit</Button>
          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device info */}
        <div className="lg:col-span-2 rounded-lg border border-border p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            <InfoRow label="Tlaková kategorie">{getPressureCategoryLabel(device.pressureCategory)}</InfoRow>
            <InfoRow label="Médium">{getMediumLabel(device.medium)}</InfoRow>
            <InfoRow label="Výrobce">{device.manufacturer}</InfoRow>
            <InfoRow label="Model">{device.model}</InfoRow>
            {device.serialNumber && <InfoRow label="Sériové číslo">{device.serialNumber}</InfoRow>}
            {device.yearOfManufacture && <InfoRow label="Rok výroby">{device.yearOfManufacture}</InfoRow>}
            {device.yearOfInstallation && <InfoRow label="Rok instalace">{device.yearOfInstallation}</InfoRow>}
            {device.power && <InfoRow label="Výkon">{device.power}</InfoRow>}
            {device.volume && <InfoRow label="Objem">{device.volume}</InfoRow>}
            {device.maxPressure && <InfoRow label="Max. tlak">{device.maxPressure}</InfoRow>}
            {device.maxTemperature && <InfoRow label="Max. teplota">{device.maxTemperature}</InfoRow>}
            {device.location && <InfoRow label="Umístění">{device.location}</InfoRow>}
            {device.technicalParams && <InfoRow label="Technické parametry" span>{device.technicalParams}</InfoRow>}
            <InfoRow label="Perioda revize">{device.revisionPeriodMonths} měsíců</InfoRow>
            <InfoRow label="Zákazník">
              {customer ? <Link to={`/zakaznici/${customer.id}`} className="hover:underline">{customer.name}</Link> : '—'}
            </InfoRow>
            <InfoRow label="Objekt">{object ? `${object.name} — ${object.address}` : '—'}</InfoRow>
            {device.note && <InfoRow label="Poznámka" span>{device.note}</InfoRow>}
          </div>
        </div>

        {/* QR code */}
        <div className="rounded-lg border border-border p-5 flex flex-col items-center gap-3">
          <QRCodeSVG value={qrUrl} size={160} />
          <p className="text-xs text-muted-foreground text-center">Naskenujte pro detail zařízení</p>
        </div>
      </div>

      {/* Revision history */}
      <div className="rounded-lg border border-border">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-foreground">Historie revizí</h2>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{deviceReports.length}</span>
          </div>
        </div>
        <div className="px-5 py-1">
          {deviceReports.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Zatím žádné revize</p>
          ) : (
            <div className="divide-y divide-border">
              {deviceReports.map((r) => (
                <Link key={r.id} to={`/revizni-zpravy/${r.id}`}
                  className="flex items-center gap-3 py-2.5 text-sm hover:bg-muted/50 -mx-5 px-5 transition-colors">
                  <span className="font-medium text-foreground">{r.reportNumber}</span>
                  <span className="text-muted-foreground tabular-nums">{formatDate(r.date)}</span>
                  <Badge variant="blue" size="sm">{getRevisionTypeLabel(r.type)}</Badge>
                  <Badge variant={conclusionBadge[r.conclusion]} size="sm" className="ml-auto">{getConclusionLabel(r.conclusion)}</Badge>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Upravit zařízení" size="lg"
        footer={<><Button variant="outline" onClick={() => setEditOpen(false)}>Zrušit</Button><Button onClick={handleSave} disabled={!form.name || !form.customerId || !form.objectId}>Uložit</Button></>}>
        <div className="space-y-3">
          <Input label="Název *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Kategorie" options={[
            { value: 'kotel', label: 'Kotel' }, { value: 'ohrivac', label: 'Průtokový ohřívač' },
            { value: 'sporak', label: 'Sporák' }, { value: 'rozvod', label: 'Plynový rozvod' },
            { value: 'regulator', label: 'Regulátor' }, { value: 'kompresor', label: 'Kompresor' },
            { value: 'vzduchojimac', label: 'Vzduchojímač' }, { value: 'susicka', label: 'Sušička vzduchu' },
            { value: 'vtl-potrubi', label: 'VTL potrubí' }, { value: 'stl-potrubi', label: 'STL potrubí' },
            { value: 'kotelna', label: 'Kotelna' }, { value: 'prumyslovy-horak', label: 'Průmyslový hořák' },
            { value: 'filtr', label: 'Filtr' }, { value: 'ostatni', label: 'Ostatní' },
          ]} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as DeviceCategory })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tlaková kategorie" options={[
              { value: 'NTL', label: 'NTL' }, { value: 'STL', label: 'STL' }, { value: 'VTL', label: 'VTL' },
            ]} value={form.pressureCategory} onChange={(e) => setForm({ ...form, pressureCategory: e.target.value as PressureCategory })} />
            <Select label="Médium" options={[
              { value: 'plyn', label: 'Plyn' }, { value: 'tlakovy-vzduch', label: 'Tlakový vzduch' },
            ]} value={form.medium} onChange={(e) => setForm({ ...form, medium: e.target.value as Medium })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Výrobce" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
            <Input label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </div>
          <Input label="Sériové číslo" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Rok výroby" type="number" value={form.yearOfManufacture} onChange={(e) => setForm({ ...form, yearOfManufacture: e.target.value })} />
            <Input label="Rok instalace" type="number" value={form.yearOfInstallation} onChange={(e) => setForm({ ...form, yearOfInstallation: e.target.value })} />
          </div>
          <Input label="Výkon" value={form.power} onChange={(e) => setForm({ ...form, power: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Perioda revize (měsíce)" type="number" value={form.revisionPeriodMonths} onChange={(e) => setForm({ ...form, revisionPeriodMonths: e.target.value })} />
            <Input label="Upozornit předem (měsíce)" type="number" value={form.alertBeforeMonths} onChange={(e) => setForm({ ...form, alertBeforeMonths: e.target.value })} />
          </div>
          <Select label="Zákazník *" placeholder="Vyberte zákazníka"
            options={(customers ?? []).map((c) => ({ value: c.id, label: c.name }))}
            value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value, objectId: '' })} />
          <Select label="Objekt *" placeholder={form.customerId ? 'Vyberte objekt' : 'Nejprve vyberte zákazníka'}
            options={filteredObjects.map((o) => ({ value: o.id, label: `${o.name} — ${o.address}` }))}
            value={form.objectId} onChange={(e) => setForm({ ...form, objectId: e.target.value })} disabled={!form.customerId} />
          <Input label="Poznámka" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Smazat zařízení?"
        footer={<><Button variant="outline" onClick={() => setDeleteOpen(false)}>Zrušit</Button><Button variant="destructive" onClick={handleDelete}>Smazat</Button></>}>
        <p className="text-sm">Opravdu chcete smazat zařízení <strong>{device.name}</strong>? Tuto akci nelze vrátit.</p>
      </Modal>
    </div>
  )
}

function InfoRow({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className={span ? 'sm:col-span-2' : ''}>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}
