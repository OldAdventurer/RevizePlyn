import { useState } from 'react'
import { db } from '../../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { DetailSkeleton } from '@/components/ui/skeleton'
import { usePageTitle } from '../../hooks/usePageTitle'
import {
  formatDate,
  formatPhone,
  getOrderStatusLabel,
  getOrderStatusColor,
  getOrderTypeLabel,
  getDeviceCategoryLabel,
  getObjectTypeLabel,
} from '../../utils/format'
import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Modal from '@/components/ui/modal'
import {
  ArrowLeft, User, Building2, Phone, Mail, MapPin, Edit, Trash2, Plus,
} from 'lucide-react'
import type { Customer, CustomerType } from '../../types'
import { toast } from '../../stores/toastStore'

export default function ZakaznikDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const customer = useLiveQuery(() => db.customers.get(id!), [id])
  usePageTitle(customer?.name ?? 'Detail zákazníka')
  const objects = useLiveQuery(() => db.objects.where('customerId').equals(id!).toArray(), [id])
  const devices = useLiveQuery(() => db.devices.where('customerId').equals(id!).toArray(), [id])
  const orders = useLiveQuery(() => db.orders.where('customerId').equals(id!).toArray(), [id])

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'fyzicka-osoba' as CustomerType, ico: '', dic: '',
    contactPerson: '', phone: '', email: '', address: '', note: '',
  })

  const openEdit = () => {
    if (!customer) return
    setForm({
      name: customer.name, type: customer.type, ico: customer.ico ?? '',
      dic: customer.dic ?? '', contactPerson: customer.contactPerson ?? '',
      phone: customer.phone, email: customer.email ?? '',
      address: customer.address, note: customer.note ?? '',
    })
    setEditOpen(true)
  }

  const setField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    if (!customer || !form.name.trim() || !form.phone.trim() || !form.address.trim()) return
    const updated: Customer = {
      ...customer, name: form.name.trim(), type: form.type as CustomerType,
      ico: form.type === 'firma' && form.ico.trim() ? form.ico.trim() : undefined,
      dic: form.type === 'firma' && form.dic.trim() ? form.dic.trim() : undefined,
      contactPerson: form.type === 'firma' && form.contactPerson.trim() ? form.contactPerson.trim() : undefined,
      phone: form.phone.trim(), email: form.email.trim() || undefined,
      address: form.address.trim(), note: form.note.trim() || undefined,
    }
    await db.customers.put(updated)
    toast.success('Zákazník byl upraven')
    setEditOpen(false)
  }

  const handleDelete = async () => {
    if (!customer) return
    await db.customers.delete(customer.id)
    toast.success('Zákazník byl smazán')
    navigate('/zakaznici')
  }

  if (customer === undefined || objects === undefined || devices === undefined || orders === undefined) {
    return <DetailSkeleton />
  }

  if (!customer) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-muted-foreground">Zákazník nebyl nalezen.</p>
        <Link to="/zakaznici" className="text-sm text-muted-foreground hover:text-foreground mt-2 inline-block">← Zpět</Link>
      </div>
    )
  }

  const sortedOrders = [...(orders ?? [])].sort((a, b) => a.createdAt > b.createdAt ? -1 : 1)

  return (
    <div className="page-enter space-y-6">
      <Link to="/zakaznici" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Zpět na zákazníky
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
            {customer.type === 'firma' ? <Building2 size={20} className="text-muted-foreground" /> : <User size={20} className="text-muted-foreground" />}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{customer.name}</h1>
            <Badge variant={customer.type === 'fyzicka-osoba' ? 'blue' : 'indigo'} size="sm">
              {customer.type === 'fyzicka-osoba' ? 'Fyzická osoba' : 'Firma'}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Edit size={14} />} onClick={openEdit}>Upravit</Button>
          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive" />
        </div>
      </div>

      {/* Contact info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-border p-5">
        {customer.type === 'firma' && customer.ico && <InfoRow label="IČ">{customer.ico}</InfoRow>}
        {customer.type === 'firma' && customer.dic && <InfoRow label="DIČ">{customer.dic}</InfoRow>}
        {customer.type === 'firma' && customer.contactPerson && (
          <InfoRow label="Kontaktní osoba" icon={<User size={14} />}>{customer.contactPerson}</InfoRow>
        )}
        <InfoRow label="Telefon" icon={<Phone size={14} />}>{formatPhone(customer.phone)}</InfoRow>
        {customer.email && <InfoRow label="E-mail" icon={<Mail size={14} />}>{customer.email}</InfoRow>}
        <InfoRow label="Adresa" icon={<MapPin size={14} />} span>{customer.address}</InfoRow>
        {customer.note && <InfoRow label="Poznámka" span>{customer.note}</InfoRow>}
      </div>

      {/* Objects */}
      <Section title="Objekty" count={objects?.length ?? 0}>
        {!objects || objects.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Žádné objekty</p>
        ) : (
          <div className="divide-y divide-border">
            {objects.map((obj) => (
              <div key={obj.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="font-medium text-foreground">{obj.name}</span>
                <Badge variant="gray" size="sm">{getObjectTypeLabel(obj.type)}</Badge>
                <span className="text-muted-foreground ml-auto">{obj.address}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Devices */}
      <Section title="Zařízení" count={devices?.length ?? 0}>
        {!devices || devices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Žádná zařízení</p>
        ) : (
          <div className="divide-y divide-border">
            {devices.map((dev) => (
              <Link key={dev.id} to={`/zarizeni/${dev.id}`}
                className="flex items-center gap-3 py-2.5 text-sm hover:bg-muted/50 -mx-5 px-5 transition-colors">
                <span className="font-medium text-foreground">{dev.name}</span>
                <Badge variant="blue" size="sm">{getDeviceCategoryLabel(dev.category)}</Badge>
                <span className="text-muted-foreground ml-auto">{dev.manufacturer} {dev.model}</span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Orders */}
      <Section title="Zakázky" count={sortedOrders.length}
        action={<Button size="sm" variant="outline" icon={<Plus size={14} />}
          onClick={() => navigate(`/zakazky/nova?customerId=${customer.id}`)}>Nová zakázka</Button>}>
        {sortedOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Žádné zakázky</p>
        ) : (
          <div className="divide-y divide-border">
            {sortedOrders.map((order) => (
              <Link key={order.id} to={`/zakazky/${order.id}`}
                className="flex items-center gap-3 py-2.5 text-sm hover:bg-muted/50 -mx-5 px-5 transition-colors">
                <span className="text-muted-foreground tabular-nums w-20 shrink-0">
                  {order.plannedDate ? formatDate(order.plannedDate) : formatDate(order.createdAt)}
                </span>
                <Badge variant={getOrderStatusColor(order.status) as any} size="sm">
                  {getOrderStatusLabel(order.status)}
                </Badge>
                <span className="text-foreground">{getOrderTypeLabel(order.type)}</span>
                <span className="text-muted-foreground ml-auto truncate max-w-48">{order.address}</span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Edit modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Upravit zákazníka"
        footer={<><Button variant="outline" onClick={() => setEditOpen(false)}>Zrušit</Button><Button onClick={handleSave}>Uložit</Button></>}>
        <div className="flex flex-col gap-3">
          <Input label="Jméno / Název" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
          <Select label="Typ" options={[{ value: 'fyzicka-osoba', label: 'Fyzická osoba' }, { value: 'firma', label: 'Firma' }]}
            value={form.type} onChange={(e) => setField('type', e.target.value)} />
          {form.type === 'firma' && <>
            <Input label="IČ" value={form.ico} onChange={(e) => setField('ico', e.target.value)} />
            <Input label="DIČ" value={form.dic} onChange={(e) => setField('dic', e.target.value)} />
            <Input label="Kontaktní osoba" value={form.contactPerson} onChange={(e) => setField('contactPerson', e.target.value)} />
          </>}
          <Input label="Telefon" type="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} required />
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
          <Input label="Adresa" value={form.address} onChange={(e) => setField('address', e.target.value)} required />
          <Input label="Poznámka" value={form.note} onChange={(e) => setField('note', e.target.value)} />
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Smazat zákazníka?"
        footer={<><Button variant="outline" onClick={() => setDeleteOpen(false)}>Zrušit</Button><Button variant="destructive" onClick={handleDelete}>Smazat</Button></>}>
        <p className="text-sm">Opravdu chcete smazat zákazníka <strong>{customer.name}</strong>? Tato akce je nevratná.</p>
      </Modal>
    </div>
  )
}

function InfoRow({ label, children, icon, span }: { label: string; children: React.ReactNode; icon?: React.ReactNode; span?: boolean }) {
  return (
    <div className={span ? 'md:col-span-2' : ''}>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm text-foreground flex items-center gap-1.5">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {children}
      </div>
    </div>
  )
}

function Section({ title, count, children, action }: { title: string; count: number; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-foreground">{title}</h2>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{count}</span>
        </div>
        {action}
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  )
}
