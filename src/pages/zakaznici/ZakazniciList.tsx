import { useState, useMemo } from 'react'
import { db } from '../../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { ListSkeleton } from '@/components/ui/skeleton'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatPhone } from '../../utils/format'
import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import SearchBar from '@/components/ui/searchbar'
import Table, { type Column } from '@/components/ui/table'
import Modal from '@/components/ui/modal'
import { Plus, User, Users } from 'lucide-react'
import { toast } from '../../stores/toastStore'
import EmptyState from '@/components/ui/emptystate'
import type { Customer, CustomerType } from '../../types'

interface CustomerRow extends Customer {
  orderCount: number
}

const emptyForm = {
  name: '',
  type: 'fyzicka-osoba' as CustomerType,
  ico: '',
  dic: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  note: '',
}

export default function ZakazniciList() {
  usePageTitle('Zákazníci')
  const navigate = useNavigate()
  const customers = useLiveQuery(() => db.customers.toArray())
  const orders = useLiveQuery(() => db.orders.toArray())

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const orderCounts = useMemo(() => {
    const map = new Map<string, number>()
    if (orders) {
      for (const o of orders) {
        map.set(o.customerId, (map.get(o.customerId) ?? 0) + 1)
      }
    }
    return map
  }, [orders])

  const filtered = useMemo(() => {
    if (!customers) return []
    const q = search.toLowerCase()
    return customers
      .filter((c) => {
        if (typeFilter && c.type !== typeFilter) return false
        if (q) {
          const haystack = [c.name, c.phone, c.address, c.ico ?? ''].join(' ').toLowerCase()
          if (!haystack.includes(q)) return false
        }
        return true
      })
      .map<CustomerRow>((c) => ({ ...c, orderCount: orderCounts.get(c.id) ?? 0 }))
  }, [customers, orders, search, typeFilter, orderCounts])

  const columns: Column<CustomerRow>[] = [
    {
      key: 'name',
      header: 'Jméno / Firma',
      sortable: true,
      render: (r) => <span className="font-semibold">{r.name}</span>,
    },
    {
      key: 'type',
      header: 'Typ',
      render: (r) => (
        <Badge variant={r.type === 'fyzicka-osoba' ? 'blue' : 'indigo'}>
          {r.type === 'fyzicka-osoba' ? 'FO' : 'Firma'}
        </Badge>
      ),
    },
    {
      key: 'phone',
      header: 'Telefon',
      render: (r) => formatPhone(r.phone),
    },
    {
      key: 'address',
      header: 'Adresa',
      sortable: true,
    },
    {
      key: 'orderCount',
      header: 'Počet zakázek',
      sortable: true,
      render: (r) => <span>{r.orderCount}</span>,
    },
  ]

  const setField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) return

    const customer: Customer = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      type: form.type,
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
      createdAt: new Date().toISOString().slice(0, 10),
    }

    await db.customers.put(customer)
    toast.success('Zákazník byl přidán')
    setForm(emptyForm)
    setModalOpen(false)
  }

  if (!customers || !orders) {
    return <ListSkeleton />
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-3 max-w-6xl mx-auto page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Zákazníci</h1>
          <p className="text-muted-foreground mt-1">Evidence zákazníků a firem</p>
        </div>
        <Button icon={<Plus size={20} />} onClick={() => setModalOpen(true)}>
          Nový zákazník
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          placeholder="Hledat jméno, telefon, adresu, IČ…"
          onSearch={setSearch}
          className="flex-1"
        />
        <Select
          options={[
            { value: '', label: 'Všichni' },
            { value: 'fyzicka-osoba', label: 'Fyzické osoby' },
            { value: 'firma', label: 'Firmy' },
          ]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="sm:w-48"
        />
      </div>

      {/* Table or empty state */}
      {customers.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title="Žádní zákazníci"
          description="Přidejte svého prvního zákazníka nebo obnovte demo data."
          actionLabel="+ Nový zákazník"
          onAction={() => setModalOpen(true)}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <User className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-lg text-muted-foreground">
            Žádní zákazníci neodpovídají hledání
          </p>
        </div>
      ) : (
        <Table<CustomerRow>
          columns={columns}
          data={filtered}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => navigate(`/zakaznici/${r.id}`)}
        />
      )}

      {/* Add customer modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setForm(emptyForm)
        }}
        title="Nový zákazník"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                setForm(emptyForm)
              }}
            >
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
    </div>
  )
}
