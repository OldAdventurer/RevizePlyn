import { useLiveQuery } from 'dexie-react-hooks'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Send,
  CheckCircle,
} from 'lucide-react'
import { db } from '../../db/schema'
import { usePageTitle } from '../../hooks/usePageTitle'
import { toast } from '../../stores/toastStore'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { DetailSkeleton } from '../../components/ui/Skeleton'
import {
  formatCurrency,
  formatDate,
  getInvoiceStatusLabel,
  getInvoiceStatusColor,
  getPaymentMethodLabel,
  formatIBAN,
} from '../../utils/format'

export default function FakturaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const invoice = useLiveQuery(() => (id ? db.invoices.get(id) : undefined), [id])
  const customer = useLiveQuery(
    () => (invoice?.customerId ? db.customers.get(invoice.customerId) : undefined),
    [invoice?.customerId],
  )
  const order = useLiveQuery(
    () => (invoice?.orderId ? db.orders.get(invoice.orderId) : undefined),
    [invoice?.orderId],
  )

  usePageTitle(
    invoice?.invoiceNumber ? `Faktura č. ${invoice.invoiceNumber}` : 'Detail faktury',
  )

  async function updateStatus(newStatus: 'odeslana' | 'zaplacena') {
    if (!id) return
    const now = new Date().toISOString()
    if (newStatus === 'zaplacena') {
      await db.invoices.update(id, { status: newStatus, paidDate: now.slice(0, 10), updatedAt: now })
    } else {
      await db.invoices.update(id, { status: newStatus, updatedAt: now })
    }
    toast.success(
      newStatus === 'odeslana'
        ? 'Faktura označena jako odeslaná'
        : 'Faktura označena jako zaplacená',
    )
  }

  async function handleDelete() {
    if (!id) return
    if (!window.confirm('Opravdu chcete smazat tuto fakturu?')) return
    await db.invoices.delete(id)
    toast.success('Faktura byla smazána')
    navigate('/finance/faktury')
  }

  if (invoice === undefined) return <DetailSkeleton />

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-gray-500">Faktura nebyla nalezena</p>
        <Link to="/finance/faktury" className="text-[var(--color-primary)] hover:underline mt-2 inline-block">
          ← Zpět na faktury
        </Link>
      </div>
    )
  }

  const statusColor = getInvoiceStatusColor(invoice.status) as
    | 'blue' | 'green' | 'yellow' | 'red' | 'gray'

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/finance/faktury"
        className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Zpět na faktury
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Faktura č. {invoice.invoiceNumber}
          </h1>
          <div className="mt-2">
            <Badge variant={statusColor} size="md">
              {getInvoiceStatusLabel(invoice.status)}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {invoice.status === 'nova' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Send className="w-4 h-4" />}
              onClick={() => updateStatus('odeslana')}
            >
              Odeslat
            </Button>
          )}
          {(invoice.status === 'odeslana' || invoice.status === 'po-splatnosti') && (
            <Button
              variant="success"
              size="sm"
              icon={<CheckCircle className="w-4 h-4" />}
              onClick={() => updateStatus('zaplacena')}
            >
              Označit jako zaplacenou
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => navigate(`/finance/faktury/${id}/upravit`)}
          >
            Upravit
          </Button>
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>
            Stáhnout PDF
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={handleDelete}
          >
            Smazat
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1 — Základní údaje */}
        <Card title="Základní údaje" accent="blue">
          <dl className="space-y-3">
            <InfoRow label="Číslo faktury" value={invoice.invoiceNumber} />
            <InfoRow label="Variabilní symbol" value={invoice.variableSymbol} />
            <InfoRow label="Datum vystavení" value={formatDate(invoice.issueDate)} />
            <InfoRow label="Datum splatnosti" value={formatDate(invoice.dueDate)} />
            {invoice.paidDate && (
              <InfoRow label="Datum zaplacení" value={formatDate(invoice.paidDate)} />
            )}
            <InfoRow label="Způsob úhrady" value={getPaymentMethodLabel(invoice.paymentMethod)} />
            <InfoRow
              label="Stav"
              value={
                <Badge variant={statusColor} size="sm">
                  {getInvoiceStatusLabel(invoice.status)}
                </Badge>
              }
            />
          </dl>
        </Card>

        {/* Card 2 — Odběratel */}
        <Card title="Odběratel" accent="green">
          {customer ? (
            <dl className="space-y-3">
              <InfoRow label="Jméno / Firma" value={customer.name} />
              {customer.ico && <InfoRow label="IČO" value={customer.ico} />}
              {customer.dic && <InfoRow label="DIČ" value={customer.dic} />}
              <InfoRow label="Adresa" value={customer.address} />
              {customer.phone && <InfoRow label="Telefon" value={customer.phone} />}
              {customer.email && <InfoRow label="Email" value={customer.email} />}
              <div className="pt-2">
                <Link
                  to={`/zakaznici/${customer.id}`}
                  className="text-[var(--color-primary)] hover:underline text-sm font-medium"
                >
                  Zobrazit detail zákazníka →
                </Link>
              </div>
            </dl>
          ) : (
            <p className="text-gray-500">Zákazník nenalezen</p>
          )}
        </Card>
      </div>

      {/* Card 3 — Položky faktury */}
      <Card title="Položky faktury">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-left">
                <th className="pb-2 font-semibold">Popis</th>
                <th className="pb-2 font-semibold text-right w-20">Množství</th>
                <th className="pb-2 font-semibold text-right w-28">Cena/ks</th>
                <th className="pb-2 font-semibold text-right w-28">Celkem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2.5 text-[var(--color-text)]">{item.description}</td>
                  <td className="py-2.5 text-right text-gray-600">{item.quantity}</td>
                  <td className="py-2.5 text-right text-gray-600">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-[var(--color-text)]">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Mezisoučet</span>
            <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">
              DPH ({invoice.vatRate}%)
              {invoice.vatRate === 0 && (
                <span className="ml-1 text-xs text-gray-400">— Neplátce DPH</span>
              )}
            </span>
            <span className="font-medium">{formatCurrency(invoice.vatAmount)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
            <span>Celkem k úhradě</span>
            <span className="text-[var(--color-primary)]">{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 4 — Platební údaje */}
        <Card title="Platební údaje" accent="yellow">
          <dl className="space-y-3">
            <InfoRow label="Bankovní účet" value={formatIBAN(invoice.bankAccount)} />
            <InfoRow label="Variabilní symbol" value={invoice.variableSymbol} />
          </dl>
        </Card>

        {/* Card 5 — Poznámka */}
        {invoice.note && (
          <Card title="Poznámka">
            <p className="text-gray-700 whitespace-pre-wrap">{invoice.note}</p>
          </Card>
        )}

        {/* Linked Order */}
        {order && (
          <Card title="Zakázka" accent="blue">
            <p className="text-[var(--color-text)] font-medium mb-2">
              {order.type ? order.type : 'Zakázka'} — {customer?.name}
            </p>
            <Link
              to={`/zakazky/${order.id}`}
              className="text-[var(--color-primary)] hover:underline text-sm font-medium"
            >
              Zobrazit zakázku →
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}

/* ─── Helper ────────────────────────────────────────────────────────── */

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
      <dt className="text-sm text-gray-500 font-medium">{label}</dt>
      <dd className="text-sm text-[var(--color-text)] font-medium sm:text-right">{value}</dd>
    </div>
  )
}
