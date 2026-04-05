import { useState, useMemo } from 'react'
import { db } from '../../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { getDeviceCategoryLabel, getDeviceCategoryIcon } from '../../utils/format'
import Card from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import SearchBar from '@/components/ui/searchbar'
import Table, { type Column } from '@/components/ui/table'
import { ListSkeleton } from '@/components/ui/skeleton'
import Modal from '@/components/ui/modal'
import { Plus, QrCode, Wrench } from 'lucide-react'
import EmptyState from '@/components/ui/emptystate'
import type { Device, DeviceCategory, PressureCategory, Medium } from '../../types'
import { toast } from '../../stores/toastStore'

const categoryOptions = [
  { value: '', label: 'Všechny kategorie' },
  { value: 'kotel', label: 'Kotel' },
  { value: 'ohrivac', label: 'Ohřívač' },
  { value: 'sporak', label: 'Sporák' },
  { value: 'rozvod', label: 'Rozvod' },
  { value: 'regulator', label: 'Regulátor' },
  { value: 'kompresor', label: 'Kompresor' },
  { value: 'vzduchojimac', label: 'Vzduchojímač' },
  { value: 'susicka', label: 'Sušička vzduchu' },
  { value: 'vtl-potrubi', label: 'VTL potrubí' },
  { value: 'stl-potrubi', label: 'STL potrubí' },
  { value: 'kotelna', label: 'Kotelna' },
  { value: 'prumyslovy-horak', label: 'Průmyslový hořák' },
  { value: 'filtr', label: 'Filtr' },
  { value: 'ostatni', label: 'Ostatní' },
]

const categoryBadgeColor: Record<DeviceCategory, 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'indigo' | 'emerald' | 'orange'> = {
  kotel: 'red',
  ohrivac: 'blue',
  sporak: 'orange',
  rozvod: 'indigo',
  regulator: 'emerald',
  kompresor: 'yellow',
  vzduchojimac: 'yellow',
  susicka: 'blue',
  'vtl-potrubi': 'red',
  'stl-potrubi': 'orange',
  kotelna: 'red',
  'prumyslovy-horak': 'red',
  filtr: 'green',
  ostatni: 'gray',
}

const emptyForm = {
  name: '',
  category: 'kotel' as DeviceCategory,
  pressureCategory: 'NTL' as PressureCategory,
  medium: 'plyn' as Medium,
  manufacturer: '',
  model: '',
  serialNumber: '',
  yearOfManufacture: '',
  yearOfInstallation: '',
  power: '',
  volume: '',
  maxPressure: '',
  maxTemperature: '',
  revisionPeriodMonths: '36',
  alertBeforeMonths: '2',
  location: '',
  technicalParams: '',
  customerId: '',
  objectId: '',
  note: '',
}

export default function ZarizeniList() {
  usePageTitle('Zařízení')
  const navigate = useNavigate()
  const devices = useLiveQuery(() => db.devices.toArray())
  const customers = useLiveQuery(() => db.customers.toArray())
  const objects = useLiveQuery(() => db.objects.toArray())

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [manufacturerFilter, setManufacturerFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const customerMap = useMemo(() => {
    const map = new Map<string, string>()
    customers?.forEach((c) => map.set(c.id, c.name))
    return map
  }, [customers])

  const manufacturerOptions = useMemo(() => {
    const unique = [...new Set(devices?.map((d) => d.manufacturer).filter(Boolean) ?? [])]
    unique.sort((a, b) => a.localeCompare(b, 'cs'))
    return [{ value: '', label: 'Všichni výrobci' }, ...unique.map((m) => ({ value: m, label: m }))]
  }, [devices])

  const filteredObjects = useMemo(() => {
    if (!form.customerId) return objects ?? []
    return (objects ?? []).filter((o) => o.customerId === form.customerId)
  }, [objects, form.customerId])

  const filtered = useMemo(() => {
    if (!devices) return []
    const q = search.toLowerCase()
    return devices.filter((d) => {
      if (q && ![d.name, d.manufacturer, d.model, d.serialNumber ?? ''].some((v) => v.toLowerCase().includes(q))) return false
      if (categoryFilter && d.category !== categoryFilter) return false
      if (manufacturerFilter && d.manufacturer !== manufacturerFilter) return false
      return true
    })
  }, [devices, search, categoryFilter, manufacturerFilter])

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const columns: Column<Device>[] = [
    {
      key: '_select',
      header: '',
      render: (d) => (
        <input
          type="checkbox"
          checked={selectedIds.has(d.id)}
          onChange={() => {}}
          onClick={(e) => toggleSelect(d.id, e)}
          className="w-5 h-5 cursor-pointer accent-primary"
        />
      ),
    },
    { key: 'name', header: 'Název', sortable: true, render: (d) => <span>{getDeviceCategoryIcon(d.category)} {d.name}</span> },
    { key: 'manufacturer', header: 'Výrobce', sortable: true },
    { key: 'model', header: 'Model', sortable: true },
    {
      key: 'category',
      header: 'Kategorie',
      sortable: true,
      render: (d) => <Badge variant={categoryBadgeColor[d.category]}>{getDeviceCategoryLabel(d.category)}</Badge>,
    },
    {
      key: 'customerId',
      header: 'Zákazník',
      render: (d) => customerMap.get(d.customerId) ?? '—',
    },
    { key: 'yearOfManufacture', header: 'Rok výroby', sortable: true },
  ]

  const handleSave = async () => {
    if (!form.name || !form.customerId || !form.objectId) return
    const id = crypto.randomUUID()
    await db.devices.put({
      id,
      objectId: form.objectId,
      customerId: form.customerId,
      category: form.category,
      pressureCategory: form.pressureCategory,
      medium: form.medium,
      name: form.name,
      manufacturer: form.manufacturer,
      model: form.model,
      serialNumber: form.serialNumber || undefined,
      yearOfManufacture: form.yearOfManufacture ? Number(form.yearOfManufacture) : undefined,
      yearOfInstallation: form.yearOfInstallation ? Number(form.yearOfInstallation) : undefined,
      power: form.power || undefined,
      volume: form.volume || undefined,
      maxPressure: form.maxPressure || undefined,
      maxTemperature: form.maxTemperature || undefined,
      revisionPeriodMonths: Number(form.revisionPeriodMonths) || 36,
      alertBeforeMonths: Number(form.alertBeforeMonths) || 2,
      location: form.location || undefined,
      technicalParams: form.technicalParams || undefined,
      note: form.note || undefined,
    })
    toast.success('Zařízení bylo přidáno')
    setForm(emptyForm)
    setModalOpen(false)
  }

  const handleBatchPrint = () => {
    const ids = [...selectedIds].join(',')
    navigate(`/zarizeni/batch/qr?batch=${ids}`)
  }

  return (
    <div className="page-enter p-4 md:p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Zařízení</h1>
          <p className="text-muted-foreground mt-1">Evidence plynových zařízení</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {selectedIds.size > 0 && (
            <Button variant="secondary" icon={<QrCode size={20} />} onClick={handleBatchPrint}>
              Tisknout QR ({selectedIds.size})
            </Button>
          )}
          <Button icon={<Plus size={20} />} onClick={() => setModalOpen(true)}>
            Nové zařízení
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card subtitle="Vyhledávání a filtry">
        <div className="flex flex-col md:flex-row gap-4">
          <SearchBar
            placeholder="Hledat dle názvu, výrobce, modelu, sériového čísla…"
            onSearch={setSearch}
            className="flex-1"
          />
          <Select
            options={categoryOptions}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="md:w-56"
          />
          <Select
            options={manufacturerOptions}
            value={manufacturerFilter}
            onChange={(e) => setManufacturerFilter(e.target.value)}
            className="md:w-56"
          />
        </div>
      </Card>

      {/* Table */}
      {!devices ? (
        <ListSkeleton />
      ) : devices.length === 0 ? (
        <EmptyState
          icon={<Wrench size={32} />}
          title="Žádná zařízení"
          description="Přidejte první plynové zařízení do evidence nebo obnovte demo data."
          actionLabel="+ Nové zařízení"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <Card>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Žádná zařízení odpovídající vašim filtrům</p>
            </div>
          ) : (
            <Table
              columns={columns}
              data={filtered}
              keyExtractor={(d) => d.id}
              onRowClick={(d) => navigate(`/zarizeni/${d.id}`)}
            />
          )}
        </Card>
      )}

      {/* Add device modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nové zařízení"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Zrušit</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.customerId || !form.objectId}>Uložit</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Název *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select
            label="Kategorie"
            options={categoryOptions.filter(o => o.value !== '')}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as DeviceCategory })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tlaková kategorie"
              options={[
                { value: 'NTL', label: 'NTL — Nízkotlaké' },
                { value: 'STL', label: 'STL — Středotlaké' },
                { value: 'VTL', label: 'VTL — Vysokotlaké' },
              ]}
              value={form.pressureCategory}
              onChange={(e) => setForm({ ...form, pressureCategory: e.target.value as PressureCategory })}
            />
            <Select
              label="Médium"
              options={[
                { value: 'plyn', label: 'Plyn' },
                { value: 'tlakovy-vzduch', label: 'Tlakový vzduch' },
              ]}
              value={form.medium}
              onChange={(e) => setForm({ ...form, medium: e.target.value as Medium })}
            />
          </div>
          <Input label="Výrobce" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
          <Input label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          <Input label="Sériové číslo" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Rok výroby" type="number" value={form.yearOfManufacture} onChange={(e) => setForm({ ...form, yearOfManufacture: e.target.value })} />
            <Input label="Rok instalace" type="number" value={form.yearOfInstallation} onChange={(e) => setForm({ ...form, yearOfInstallation: e.target.value })} />
          </div>
          <Input label="Výkon" value={form.power} onChange={(e) => setForm({ ...form, power: e.target.value })} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Objem" placeholder="např. 300 L" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} />
            <Input label="Max. tlak" placeholder="např. 10 bar" value={form.maxPressure} onChange={(e) => setForm({ ...form, maxPressure: e.target.value })} />
            <Input label="Max. teplota" placeholder="např. 100 °C" value={form.maxTemperature} onChange={(e) => setForm({ ...form, maxTemperature: e.target.value })} />
          </div>
          <Input label="Umístění" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input label="Technické parametry" value={form.technicalParams} onChange={(e) => setForm({ ...form, technicalParams: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Perioda revize (měsíce)" type="number" value={form.revisionPeriodMonths} onChange={(e) => setForm({ ...form, revisionPeriodMonths: e.target.value })} />
            <Input label="Upozornit předem (měsíce)" type="number" value={form.alertBeforeMonths} onChange={(e) => setForm({ ...form, alertBeforeMonths: e.target.value })} />
          </div>
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
    </div>
  )
}
