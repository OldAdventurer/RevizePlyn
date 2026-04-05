import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { db } from '../../db/schema'
import type { OrderType, Priority } from '../../types'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Card from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { toast } from '../../stores/toastStore'

const orderTypeOptions = [
  { value: 'nova-stavba', label: 'Nová stavba' },
  { value: 'rekonstrukce', label: 'Rekonstrukce' },
  { value: 'pravidelna-revize', label: 'Pravidelná revize' },
  { value: 'pravidelna-kontrola', label: 'Pravidelná kontrola' },
  { value: 'mimoradna-revize', label: 'Mimořádná revize' },
  { value: 'oprava-revize', label: 'Oprava + revize' },
]

const priorityOptions = [
  { value: 'normalni', label: 'Normální' },
  { value: 'specha', label: 'Spěchá' },
]

export default function ZakazkaForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  usePageTitle(isEdit ? 'Upravit zakázku' : 'Nová zakázka')
  const navigate = useNavigate()

  const existingOrder = useLiveQuery(
    () => (id ? db.orders.get(id) : undefined),
    [id],
  )
  const customers = useLiveQuery(() => db.customers.toArray())

  const [customerId, setCustomerId] = useState('')
  const [type, setType] = useState<OrderType>('pravidelna-revize')
  const [address, setAddress] = useState('')
  const [plannedDate, setPlannedDate] = useState('')
  const [priority, setPriority] = useState<Priority>('normalni')
  const [description, setDescription] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Pre-fill when editing
  useEffect(() => {
    if (existingOrder) {
      setCustomerId(existingOrder.customerId)
      setType(existingOrder.type)
      setAddress(existingOrder.address)
      setPlannedDate(existingOrder.plannedDate ?? '')
      setPriority(existingOrder.priority)
      setDescription(existingOrder.description ?? '')
      setNote(existingOrder.note ?? '')
    }
  }, [existingOrder])

  // Auto-fill address from selected customer (only for new orders)
  useEffect(() => {
    if (isEdit) return
    const customer = customers?.find((c) => c.id === customerId)
    if (customer) setAddress(customer.address)
  }, [customerId, customers, isEdit])

  const customerOptions = (customers ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId) return
    setSaving(true)

    const now = new Date().toISOString()

    if (isEdit && existingOrder) {
      await db.orders.update(id!, {
        customerId,
        type,
        address,
        plannedDate: plannedDate || undefined,
        priority,
        description: description || undefined,
        note: note || undefined,
        updatedAt: now,
      })
      toast.success('Zakázka byla uložena')
      navigate(`/zakazky/${id}`)
    } else {
      const newId = `ord-${Date.now()}`
      await db.orders.put({
        id: newId,
        customerId,
        type,
        status: 'nova',
        address,
        plannedDate: plannedDate || undefined,
        priority,
        description: description || undefined,
        note: note || undefined,
        createdAt: now,
        updatedAt: now,
      })
      toast.success('Zakázka byla uložena')
      navigate(`/zakazky/${newId}`)
    }
  }

  return (
    <div className="page-enter p-4 md:p-6 space-y-3 max-w-2xl">
      <button onClick={() => navigate(isEdit ? `/zakazky/${id}` : '/zakazky')} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium mb-4 transition-colors cursor-pointer">
        <ArrowLeft size={20} />
        <span>{isEdit ? 'Zpět na detail' : 'Zpět na zakázky'}</span>
      </button>

      <div className="mb-4">
        <h1 className="text-xl font-semibold text-foreground">{isEdit ? 'Upravit zakázku' : 'Nová zakázka'}</h1>
        <p className="text-muted-foreground mt-1">{isEdit ? 'Úprava existující zakázky' : 'Vyplňte údaje o nové zakázce'}</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select
            label="Zákazník"
            options={customerOptions}
            placeholder="Vyberte zákazníka…"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          />

          <Select
            label="Typ zakázky"
            options={orderTypeOptions}
            value={type}
            onChange={(e) => setType(e.target.value as OrderType)}
          />

          <Input
            label="Adresa objektu"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />

          <Input
            label="Plánované datum"
            type="date"
            value={plannedDate}
            onChange={(e) => setPlannedDate(e.target.value)}
          />

          <Select
            label="Priorita"
            options={priorityOptions}
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          />

          <div className="w-full">
            <label className="block text-sm text-xs font-medium text-muted-foreground mb-2">
              Popis
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full text-sm p-3 border border-border rounded-lg  focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
            />
          </div>

          <div className="w-full">
            <label className="block text-sm text-xs font-medium text-muted-foreground mb-2">
              Poznámka
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full text-sm p-3 border border-border rounded-lg  focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={saving || !customerId}>
              {isEdit ? 'Uložit změny' : 'Vytvořit zakázku'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(isEdit ? `/zakazky/${id}` : '/zakazky')}
            >
              Zrušit
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
