import { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { db } from '../../db/schema'
import { usePageTitle } from '../../hooks/usePageTitle'
import { toast } from '../../stores/toastStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { formatCurrency } from '../../utils/format'
import type { InvoiceItem, PaymentMethod } from '../../types'

const PAYMENT_METHODS = [
  { value: 'prevod', label: 'Bankovní převod' },
  { value: 'hotovost', label: 'Hotovost' },
  { value: 'kartou', label: 'Platba kartou' },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function emptyItem(): InvoiceItem {
  return { description: '', quantity: 1, unitPrice: 0, total: 0 }
}

export default function FakturaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)

  usePageTitle(isEdit ? 'Upravit fakturu' : 'Nová faktura')

  const existingInvoice = useLiveQuery(
    () => (id ? db.invoices.get(id) : undefined),
    [id],
  )
  const customers = useLiveQuery(() => db.customers.toArray())
  const orders = useLiveQuery(() => db.orders.toArray())

  // Form state
  const [customerId, setCustomerId] = useState('')
  const [orderId, setOrderId] = useState('')
  const [issueDate, setIssueDate] = useState(todayStr())
  const [dueDate, setDueDate] = useState(addDays(todayStr(), 14))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('prevod')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()])
  const [saving, setSaving] = useState(false)

  // Customer options
  const customerOptions = useMemo(
    () =>
      (customers ?? []).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [customers],
  )

  // Orders filtered by selected customer
  const orderOptions = useMemo(() => {
    if (!customerId || !orders) return []
    return orders
      .filter((o) => o.customerId === customerId)
      .map((o) => ({
        value: o.id,
        label: `${o.id} — ${o.type}`,
      }))
  }, [customerId, orders])

  // Pre-fill from existing invoice (edit mode)
  useEffect(() => {
    if (!existingInvoice) return
    setCustomerId(existingInvoice.customerId)
    setOrderId(existingInvoice.orderId ?? '')
    setIssueDate(existingInvoice.issueDate)
    setDueDate(existingInvoice.dueDate)
    setPaymentMethod(existingInvoice.paymentMethod)
    setNote(existingInvoice.note ?? '')
    setItems(
      existingInvoice.items.length > 0
        ? existingInvoice.items.map((item) => ({ ...item }))
        : [emptyItem()],
    )
  }, [existingInvoice])

  // Pre-fill from orderId query param (new mode)
  useEffect(() => {
    if (isEdit) return
    const paramOrderId = searchParams.get('orderId')
    if (!paramOrderId || !orders) return
    const order = orders.find((o) => o.id === paramOrderId)
    if (order) {
      setCustomerId(order.customerId)
      setOrderId(order.id)
    }
  }, [isEdit, searchParams, orders])

  // Auto-update dueDate when issueDate changes (only for new invoices)
  useEffect(() => {
    if (isEdit) return
    setDueDate(addDays(issueDate, 14))
  }, [issueDate, isEdit])

  // Item helpers
  function updateItem(index: number, field: keyof InvoiceItem, value: string | number) {
    setItems((prev) => {
      const updated = [...prev]
      const item = { ...updated[index] }
      if (field === 'description') {
        item.description = value as string
      } else if (field === 'quantity') {
        item.quantity = Number(value) || 0
        item.total = item.quantity * item.unitPrice
      } else if (field === 'unitPrice') {
        item.unitPrice = Number(value) || 0
        item.total = item.quantity * item.unitPrice
      }
      updated[index] = item
      return updated
    })
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()])
  }

  function removeItem(index: number) {
    setItems((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }

  const subtotal = useMemo(() => items.reduce((sum, it) => sum + it.total, 0), [items])
  const vatRate = 0
  const vatAmount = 0
  const total = subtotal + vatAmount

  // Generate invoice number
  async function generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = String(year)

    const allInvoices = await db.invoices.toArray()
    let maxSeq = 0

    for (const inv of allInvoices) {
      if (inv.invoiceNumber.startsWith(prefix)) {
        const seq = parseInt(inv.invoiceNumber.slice(prefix.length), 10)
        if (seq > maxSeq) maxSeq = seq
      }
    }

    const nextSeq = String(maxSeq + 1).padStart(3, '0')
    return `${prefix}${nextSeq}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!customerId) {
      toast.error('Vyberte zákazníka')
      return
    }

    if (items.every((it) => !it.description.trim())) {
      toast.error('Přidejte alespoň jednu položku')
      return
    }

    setSaving(true)
    try {
      const now = new Date().toISOString()
      const validItems = items.filter((it) => it.description.trim())

      if (isEdit && existingInvoice) {
        await db.invoices.update(id!, {
          customerId,
          orderId: orderId || undefined,
          issueDate,
          dueDate,
          paymentMethod,
          note: note || undefined,
          items: validItems,
          subtotal,
          vatRate,
          vatAmount,
          total,
          updatedAt: now,
        })
        toast.success('Faktura byla aktualizována')
        navigate(`/finance/faktury/${id}`)
      } else {
        const invoiceNumber = await generateInvoiceNumber()
        const newId = `inv-${Date.now()}`
        await db.invoices.put({
          id: newId,
          invoiceNumber,
          customerId,
          orderId: orderId || undefined,
          issueDate,
          dueDate,
          paidDate: undefined,
          paymentMethod,
          note: note || undefined,
          items: validItems,
          subtotal,
          vatRate,
          vatAmount,
          total,
          bankAccount: 'CZ65 0800 0000 1923 4567 8901',
          variableSymbol: invoiceNumber,
          status: 'nova',
          createdAt: now,
          updatedAt: now,
        })
        toast.success('Faktura byla vytvořena')
        navigate(`/finance/faktury/${newId}`)
      }
    } catch {
      toast.error('Chyba při ukládání faktury')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        to={isEdit ? `/finance/faktury/${id}` : '/finance/faktury'}
        className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> {isEdit ? 'Zpět na detail' : 'Zpět na faktury'}
      </Link>

      <h1 className="text-2xl font-bold text-[var(--color-text)]">
        {isEdit ? 'Upravit fakturu' : 'Nová faktura'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <Card title="Základní údaje">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Zákazník"
              options={customerOptions}
              placeholder="Vyberte zákazníka..."
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value)
                setOrderId('')
              }}
              required
            />
            <Select
              label="Zakázka (nepovinné)"
              options={orderOptions}
              placeholder="Vyberte zakázku..."
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
            <Input
              label="Datum vystavení"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />
            <Input
              label="Datum splatnosti"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
            <Select
              label="Způsob úhrady"
              options={PAYMENT_METHODS}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            />
          </div>
        </Card>

        {/* Invoice Items */}
        <Card title="Položky faktury">
          <div className="space-y-3">
            {/* Header (desktop) */}
            <div className="hidden md:grid grid-cols-[1fr_80px_120px_120px_40px] gap-3 text-xs font-semibold uppercase tracking-wide text-gray-500 px-1">
              <span>Popis</span>
              <span className="text-right">Množství</span>
              <span className="text-right">Cena/ks</span>
              <span className="text-right">Celkem</span>
              <span />
            </div>

            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-[1fr_80px_120px_120px_40px] gap-3 items-end p-3 bg-gray-50 rounded-xl"
              >
                <Input
                  placeholder="Popis položky"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                />
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ks"
                  value={item.quantity || ''}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  className="text-right"
                />
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Kč"
                  value={item.unitPrice || ''}
                  onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                  className="text-right"
                />
                <div className="flex items-center justify-end h-12 px-3 bg-white rounded-xl border border-gray-200 text-sm font-semibold text-[var(--color-text)]">
                  {formatCurrency(item.total)}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="flex items-center justify-center h-12 w-10 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Odebrat položku"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={addItem}
            >
              Přidat položku
            </Button>
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-gray-200 space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Mezisoučet</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                DPH (0%) <span className="text-xs text-gray-400">— Neplátce DPH</span>
              </span>
              <span className="font-medium">{formatCurrency(0)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span>Celkem</span>
              <span className="text-[var(--color-primary)]">{formatCurrency(total)}</span>
            </div>
          </div>
        </Card>

        {/* Note */}
        <Card title="Poznámka">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Volitelná poznámka k faktuře..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all resize-y"
          />
        </Card>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              navigate(isEdit ? `/finance/faktury/${id}` : '/finance/faktury')
            }
          >
            Zrušit
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving
              ? 'Ukládám...'
              : isEdit
                ? 'Uložit změny'
                : 'Vytvořit fakturu'}
          </Button>
        </div>
      </form>
    </div>
  )
}
