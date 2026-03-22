import { useState } from 'react'
import { db } from '../../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  formatDate,
  formatPhone,
  getOrderStatusLabel,
  getOrderStatusColor,
  getOrderTypeLabel,
  getDeviceCategoryLabel,
  getObjectTypeLabel,
} from '../../utils/format'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import {
  ArrowLeft,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  FileText,
  Plus,
} from 'lucide-react'
import type { Customer, CustomerType } from '../../types'

export default function ZakaznikDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const customer = useLiveQuery(() => db.customers.get(id!), [id])
  const objects = useLiveQuery(
    () => db.objects.where('customerId').equals(id!).toArray(),
    [id]
  )
  const devices = useLiveQuery(
    () => db.devices.where('customerId').equals(id!).toArray(),
    [id]
  )
  const orders = useLiveQuery(
    () => db.orders.where('customerId').equals(id!).toArray(),
    [id]
  )

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'fyzicka-osoba' as CustomerType,
    ico: '',
    dic: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    note: '',
  })

  const openEdit = () => {
    if (!customer) return
    setForm({
      name: customer.name,
      type: customer.type,
      ico: customer.ico ?? '',
      dic: customer.dic ?? '',
      contactPerson: customer.contactPerson ?? '',
      phone: customer.phone,
      email: customer.email ?? '',
      address: customer.address,
      note: customer.note ?? '',
    })
    setEditOpen(true)
  }

  const setField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    if (!customer || !form.name.trim() || !form.phone.trim() || !form.address.trim()) return

    const updated: Customer = {
      ...customer,
      name: form.name.trim(),
      type: form.type as CustomerType,
      ico: form.type === 'firma' && form.ico.trim() ? form.ico.trim() : undefined,
      dic: form.type === 'firma' && form.dic.trim() ? form.dic.trim() : undefined,
      contactPerson:
        form.type === 'firma' && form.contactPerson.trim()
          ? form.contactPerson.trim()
          : undefined,
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      address: form.address.trim(),
      note: form.note.trim() || undefined,
    }

    await db.customers.put(updated)
    setEditOpen(false)
  }

  const handleDelete = async () => {
    if (!customer) return
    await db.customers.delete(customer.id)
    navigate('/zakaznici')
  }

  if (customer === undefined || objects === undefined || devices === undefined || orders === undefined) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-primary)] mx-auto mb-3" />
          <p className="text-lg text-gray-500">Načítám data…</p>
        </div>
      </div>
    )
  }

  if (customer === null || !customer) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-gray-500">Zákazník nebyl nalezen.</p>
        <Link to="/zakaznici" className="text-[var(--color-primary)] font-medium hover:underline mt-2 inline-block">
          ← Zpět na zákazníky
        </Link>
      </div>
    )
  }

  const sortedOrders = [...(orders ?? [])].sort((a, b) =>
    a.createdAt > b.createdAt ? -1 : 1
  )

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        to="/zakaznici"
        className="inline-flex items-center gap-1 text-[var(--color-primary)] font-medium hover:underline self-start"
      >
        <ArrowLeft size={18} />
        Zpět na zákazníky
      </Link>

      {/* Customer info */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {customer.type === 'firma' ? (
                <Building2 className="text-indigo-500 shrink-0" size={28} />
              ) : (
                <User className="text-blue-500 shrink-0" size={28} />
              )}
              <h1 className="text-2xl font-bold text-[var(--color-text)]">{customer.name}</h1>
              <Badge variant={customer.type === 'fyzicka-osoba' ? 'blue' : 'indigo'}>
                {customer.type === 'fyzicka-osoba' ? 'Fyzická osoba' : 'Firma'}
              </Badge>
            </div>

            <div className="flex flex-col gap-2 text-base">
              {customer.type === 'firma' && customer.ico && (
                <p className="text-gray-600">
                  <span className="font-medium">IČ:</span> {customer.ico}
                </p>
              )}
              {customer.type === 'firma' && customer.dic && (
                <p className="text-gray-600">
                  <span className="font-medium">DIČ:</span> {customer.dic}
                </p>
              )}
              {customer.type === 'firma' && customer.contactPerson && (
                <p className="flex items-center gap-2 text-gray-600">
                  <User size={16} className="shrink-0 text-gray-400" />
                  <span className="font-medium">Kontaktní osoba:</span> {customer.contactPerson}
                </p>
              )}
              <p className="flex items-center gap-2 text-gray-600">
                <Phone size={16} className="shrink-0 text-gray-400" />
                {formatPhone(customer.phone)}
              </p>
              {customer.email && (
                <p className="flex items-center gap-2 text-gray-600">
                  <Mail size={16} className="shrink-0 text-gray-400" />
                  {customer.email}
                </p>
              )}
              <p className="flex items-center gap-2 text-gray-600">
                <MapPin size={16} className="shrink-0 text-gray-400" />
                {customer.address}
              </p>
              {customer.note && (
                <p className="flex items-center gap-2 text-gray-600">
                  <FileText size={16} className="shrink-0 text-gray-400" />
                  {customer.note}
                </p>
              )}
            </div>
          </div>

          <Button variant="secondary" icon={<Edit size={18} />} onClick={openEdit}>
            Upravit
          </Button>
        </div>
      </Card>

      {/* Objects */}
      <Card title="Objekty zákazníka">
        {!objects || objects.length === 0 ? (
          <p className="text-gray-400 text-center py-4">Žádné objekty</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100 -my-1">
            {objects.map((obj) => (
              <div
                key={obj.id}
                className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3"
              >
                <span className="font-semibold text-[var(--color-text)]">{obj.name}</span>
                <Badge variant="gray">{getObjectTypeLabel(obj.type)}</Badge>
                <span className="text-gray-500 text-sm sm:ml-auto">{obj.address}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Devices */}
      <Card title="Zařízení zákazníka">
        {!devices || devices.length === 0 ? (
          <p className="text-gray-400 text-center py-4">Žádná zařízení</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100 -my-1">
            {devices.map((dev) => (
              <div
                key={dev.id}
                className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3 cursor-pointer hover:bg-gray-50 -mx-5 px-5 transition-colors"
                onClick={() => navigate(`/zarizeni/${dev.id}`)}
              >
                <span className="font-semibold text-[var(--color-text)]">{dev.name}</span>
                <Badge variant="blue">{getDeviceCategoryLabel(dev.category)}</Badge>
                <span className="text-gray-500 text-sm">
                  {dev.manufacturer} {dev.model}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Orders */}
      <Card title="Zakázky zákazníka">
        <div className="mb-3">
          <Button
            size="sm"
            icon={<Plus size={18} />}
            onClick={() => navigate(`/zakazky/nova?customerId=${customer.id}`)}
          >
            Nová zakázka pro tohoto zákazníka
          </Button>
        </div>
        {sortedOrders.length === 0 ? (
          <p className="text-gray-400 text-center py-4">Žádné zakázky</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100 -my-1">
            {sortedOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3 cursor-pointer hover:bg-gray-50 -mx-5 px-5 transition-colors"
                onClick={() => navigate(`/zakazky/${order.id}`)}
              >
                <span className="font-semibold text-[var(--color-text)] shrink-0">
                  {order.plannedDate ? formatDate(order.plannedDate) : formatDate(order.createdAt)}
                </span>
                <Badge variant={getOrderStatusColor(order.status) as any}>
                  {getOrderStatusLabel(order.status)}
                </Badge>
                <span className="text-gray-500 text-sm">{getOrderTypeLabel(order.type)}</span>
                <span className="text-gray-500 text-sm sm:ml-auto truncate">{order.address}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Delete */}
      <div className="pt-2 pb-6">
        <Button
          variant="danger"
          icon={<Trash2 size={18} />}
          onClick={() => setDeleteOpen(true)}
        >
          Smazat zákazníka
        </Button>
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Upravit zákazníka"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Zrušit
            </Button>
            <Button onClick={handleSave}>Uložit</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Jméno / Název firmy"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            required
          />
          <Select
            label="Typ"
            options={[
              { value: 'fyzicka-osoba', label: 'Fyzická osoba' },
              { value: 'firma', label: 'Firma' },
            ]}
            value={form.type}
            onChange={(e) => setField('type', e.target.value)}
          />
          {form.type === 'firma' && (
            <>
              <Input
                label="IČ"
                value={form.ico}
                onChange={(e) => setField('ico', e.target.value)}
              />
              <Input
                label="DIČ"
                value={form.dic}
                onChange={(e) => setField('dic', e.target.value)}
              />
              <Input
                label="Kontaktní osoba"
                value={form.contactPerson}
                onChange={(e) => setField('contactPerson', e.target.value)}
              />
            </>
          )}
          <Input
            label="Telefon"
            type="tel"
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            required
          />
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
          />
          <Input
            label="Adresa"
            value={form.address}
            onChange={(e) => setField('address', e.target.value)}
            required
          />
          <Input
            label="Poznámka"
            value={form.note}
            onChange={(e) => setField('note', e.target.value)}
          />
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Smazat zákazníka?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Zrušit
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Smazat
            </Button>
          </>
        }
      >
        <p className="text-base text-[var(--color-text)]">
          Opravdu chcete smazat zákazníka <strong>{customer.name}</strong>? Tato akce je nevratná.
        </p>
      </Modal>
    </div>
  )
}
