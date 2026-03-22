import { useState, useMemo } from 'react'
import { db } from '../../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { DetailSkeleton } from '../../components/ui/Skeleton'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate, getDeviceCategoryLabel, getConclusionLabel, getRevisionTypeLabel } from '../../utils/format'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, QrCode, Edit, Trash2 } from 'lucide-react'
import type { DeviceCategory, RevisionConclusion } from '../../types'
import { toast } from '../../stores/toastStore'

const conclusionBadge: Record<RevisionConclusion, 'green' | 'yellow' | 'red'> = {
  schopne: 'green',
  's-vyhradami': 'yellow',
  neschopne: 'red',
}

const categoryBadge: Record<DeviceCategory, 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'indigo' | 'emerald' | 'orange'> = {
  kotel: 'red',
  ohrivac: 'blue',
  sporak: 'orange',
  rozvod: 'indigo',
  regulator: 'emerald',
  ostatni: 'gray',
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
    name: '', category: 'kotel' as DeviceCategory, manufacturer: '', model: '',
    serialNumber: '', yearOfManufacture: '', yearOfInstallation: '',
    power: '', location: '', technicalParams: '', customerId: '', objectId: '', note: '',
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
      name: device.name,
      category: device.category,
      manufacturer: device.manufacturer,
      model: device.model,
      serialNumber: device.serialNumber ?? '',
      yearOfManufacture: device.yearOfManufacture?.toString() ?? '',
      yearOfInstallation: device.yearOfInstallation?.toString() ?? '',
      power: device.power ?? '',
      location: device.location ?? '',
      technicalParams: device.technicalParams ?? '',
      customerId: device.customerId,
      objectId: device.objectId,
      note: device.note ?? '',
    })
    setEditOpen(true)
  }

  const handleSave = async () => {
    if (!device || !form.name || !form.customerId || !form.objectId) return
    await db.devices.put({
      ...device,
      name: form.name,
      category: form.category,
      manufacturer: form.manufacturer,
      model: form.model,
      serialNumber: form.serialNumber || undefined,
      yearOfManufacture: form.yearOfManufacture ? Number(form.yearOfManufacture) : undefined,
      yearOfInstallation: form.yearOfInstallation ? Number(form.yearOfInstallation) : undefined,
      power: form.power || undefined,
      location: form.location || undefined,
      technicalParams: form.technicalParams || undefined,
      customerId: form.customerId,
      objectId: form.objectId,
      note: form.note || undefined,
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

  if (device === undefined) {
    return <DetailSkeleton />
  }
  if (device === null) {
    return <div className="p-6 text-center text-gray-500">Zařízení nenalezeno</div>
  }

  const InfoRow = ({ label, value }: { label: string; value?: string | number | null }) =>
    value ? (
      <div className="flex flex-col sm:flex-row sm:items-baseline py-2 border-b border-[var(--color-border)]/40">
        <span className="font-medium text-[var(--color-text-secondary)] sm:w-52 shrink-0">{label}</span>
        <span className="text-[var(--color-text)]">{value}</span>
      </div>
    ) : null

  const qrUrl = `${window.location.origin}/zarizeni/${device.id}`

  return (
    <div className="page-enter p-6 space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/zarizeni')} className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] font-medium mb-4 transition-colors cursor-pointer">
        <ArrowLeft size={20} />
        <span>Zpět na zařízení</span>
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{device.name}</h1>
          <Badge variant={categoryBadge[device.category]}>{getDeviceCategoryLabel(device.category)}</Badge>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" icon={<QrCode size={20} />} onClick={() => navigate(`/zarizeni/${device.id}/qr`)}>
            Zobrazit QR kód
          </Button>
          <Button variant="secondary" icon={<Edit size={20} />} onClick={openEdit}>
            Upravit
          </Button>
          <Button variant="danger" icon={<Trash2 size={20} />} onClick={() => setDeleteOpen(true)}>
            Smazat
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device info */}
        <Card title="Informace o zařízení" accent="blue" className="lg:col-span-2">
          <InfoRow label="Výrobce" value={device.manufacturer} />
          <InfoRow label="Model" value={device.model} />
          <InfoRow label="Sériové číslo" value={device.serialNumber} />
          <InfoRow label="Rok výroby" value={device.yearOfManufacture} />
          <InfoRow label="Rok instalace" value={device.yearOfInstallation} />
          <InfoRow label="Výkon" value={device.power} />
          <InfoRow label="Umístění" value={device.location} />
          <InfoRow label="Technické parametry" value={device.technicalParams} />
          <div className="flex flex-col sm:flex-row sm:items-baseline py-2 border-b border-[var(--color-border)]/40">
            <span className="font-medium text-[var(--color-text-secondary)] sm:w-52 shrink-0">Zákazník</span>
            {customer ? (
              <Link to={`/zakaznici/${customer.id}`} className="text-[var(--color-primary)] hover:underline">
                {customer.name}
              </Link>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
          <InfoRow label="Objekt" value={object ? `${object.name} — ${object.address}` : undefined} />
          <InfoRow label="Poznámka" value={device.note} />
        </Card>

        {/* QR code */}
        <Card title="QR kód" accent="green">
          <div className="flex flex-col items-center gap-4">
            <QRCodeSVG value={qrUrl} size={200} />
            <p className="text-sm text-gray-500 text-center">Naskenujte pro zobrazení detailu zařízení</p>
            <Button variant="secondary" icon={<QrCode size={20} />} size="sm" onClick={() => navigate(`/zarizeni/${device.id}/qr`)}>
              Tisknout QR
            </Button>
          </div>
        </Card>
      </div>

      {/* Revision history */}
      <Card title="Historie revizí" accent="yellow">
        {deviceReports.length === 0 ? (
          <div className="text-center py-8"><p className="text-[var(--color-text-secondary)]">Zatím žádné revize pro toto zařízení</p></div>
        ) : (
          <div className="space-y-3">
            {deviceReports.map((r) => (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 border border-[var(--color-border)] rounded-xl cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-all"
                onClick={() => navigate(`/revizni-zpravy/${r.id}`)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-semibold">{r.reportNumber}</span>
                  <span className="text-gray-500">{formatDate(r.date)}</span>
                  <Badge variant="blue">{getRevisionTypeLabel(r.type)}</Badge>
                </div>
                <Badge variant={conclusionBadge[r.conclusion]}>{getConclusionLabel(r.conclusion)}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Upravit zařízení"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Zrušit</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.customerId || !form.objectId}>Uložit</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Název *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select
            label="Kategorie"
            options={[
              { value: 'kotel', label: 'Kotel' },
              { value: 'ohrivac', label: 'Průtokový ohřívač' },
              { value: 'sporak', label: 'Sporák' },
              { value: 'rozvod', label: 'Plynový rozvod' },
              { value: 'regulator', label: 'Regulátor' },
              { value: 'ostatni', label: 'Ostatní' },
            ]}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as DeviceCategory })}
          />
          <Input label="Výrobce" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
          <Input label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          <Input label="Sériové číslo" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Rok výroby" type="number" value={form.yearOfManufacture} onChange={(e) => setForm({ ...form, yearOfManufacture: e.target.value })} />
            <Input label="Rok instalace" type="number" value={form.yearOfInstallation} onChange={(e) => setForm({ ...form, yearOfInstallation: e.target.value })} />
          </div>
          <Input label="Výkon" value={form.power} onChange={(e) => setForm({ ...form, power: e.target.value })} />
          <Input label="Umístění" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input label="Technické parametry" value={form.technicalParams} onChange={(e) => setForm({ ...form, technicalParams: e.target.value })} />
          <Select
            label="Zákazník *"
            options={(customers ?? []).map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Vyberte zákazníka"
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value, objectId: '' })}
          />
          <Select
            label="Objekt *"
            options={filteredObjects.map((o) => ({ value: o.id, label: `${o.name} — ${o.address}` }))}
            placeholder={form.customerId ? 'Vyberte objekt' : 'Nejprve vyberte zákazníka'}
            value={form.objectId}
            onChange={(e) => setForm({ ...form, objectId: e.target.value })}
            disabled={!form.customerId}
          />
          <Input label="Poznámka" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Smazat zařízení"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Zrušit</Button>
            <Button variant="danger" onClick={handleDelete}>Smazat</Button>
          </>
        }
      >
        <p className="text-base">
          Opravdu chcete smazat zařízení <strong>{device.name}</strong>? Tuto akci nelze vrátit zpět.
        </p>
      </Modal>
    </div>
  )
}
