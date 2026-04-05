import { useState, useEffect, useMemo } from 'react'
import { db } from '../../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { DetailSkeleton } from '@/components/ui/skeleton'
import Card from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import { ArrowLeft, Plus, XCircle } from 'lucide-react'
import { toast } from '../../stores/toastStore'
import { getOrderTypeLabel } from '../../utils/format'
import type {
  RevisionType,
  RevisionConclusion,
  DefectSeverity,
  DefectStatus,
  OrderType,
  Technician,
} from '../../types'

interface DefectDraft {
  tempId: string
  description: string
  severity: DefectSeverity
  deadline: string
  status: DefectStatus
}

function orderTypeToRevisionType(ot: OrderType): RevisionType {
  if (ot === 'nova-stavba' || ot === 'rekonstrukce') return 'vychozi'
  if (ot === 'mimoradna-revize') return 'mimoradna'
  return 'provozni'
}

export default function RevizeForm() {
  usePageTitle('Nová revizní zpráva')
  const { id: orderId } = useParams()
  const navigate = useNavigate()

  const orders = useLiveQuery(() => db.orders.toArray())
  const customers = useLiveQuery(() => db.customers.toArray())
  const allDevices = useLiveQuery(() => db.devices.toArray())
  const technicianSetting = useLiveQuery(() => db.settings.get('technician'))
  const [selectedOrderId, setSelectedOrderId] = useState(orderId ?? '')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const currentOrderId = orderId ?? selectedOrderId
  const selectableOrders = useMemo(
    () =>
      (orders ?? [])
        .filter((o) => o.status !== 'zrusena')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders]
  )
  const order = useMemo(
    () => selectableOrders.find((o) => o.id === currentOrderId),
    [selectableOrders, currentOrderId]
  )
  const effectiveCustomerId = order?.customerId ?? selectedCustomerId
  const customer = useMemo(
    () => customers?.find((c) => c.id === effectiveCustomerId),
    [customers, effectiveCustomerId]
  )
  const filteredCustomers = useMemo(() => {
    const list = customers ?? []
    const q = customerQuery.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        (c.ico ?? '').toLowerCase().includes(q)
    )
  }, [customers, customerQuery])

  const [reportNumber, setReportNumber] = useState('')
  const [revisionType, setRevisionType] = useState<RevisionType>('provozni')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([])
  const [techName, setTechName] = useState('')
  const [techLicense, setTechLicense] = useState('')

  // Tests
  const [leakTestResult, setLeakTestResult] = useState('')
  const [leakTestInstrument, setLeakTestInstrument] = useState('')
  const [functionalityTest, setFunctionalityTest] = useState('')
  const [fluegasTest, setFluegasTest] = useState('')
  const [coMeasurement, setCoMeasurement] = useState('')
  const [coMeasurementValue, setCoMeasurementValue] = useState('')
  const [coMeasurementInstrument, setCoMeasurementInstrument] = useState('')
  const [ventilationCheck, setVentilationCheck] = useState('')

  // Defects
  const [defectDrafts, setDefectDrafts] = useState<DefectDraft[]>([])

  // Conclusion
  const [conclusion, setConclusion] = useState<RevisionConclusion>('schopne')
  const [conclusionNote, setConclusionNote] = useState('')

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSelectedOrderId(orderId ?? '')
  }, [orderId])

  useEffect(() => {
    if (order) setSelectedCustomerId(order.customerId)
  }, [order])

  // Auto-generate report number
  useEffect(() => {
    ;(async () => {
      const reports = await db.revisionReports.toArray()
      const year = new Date().getFullYear()
      const yearReports = reports.filter((r) => r.reportNumber.startsWith(`RZ-${year}`))
      const nextNum = yearReports.length + 1
      setReportNumber(`RZ-${year}-${String(nextNum).padStart(4, '0')}`)
    })()
  }, [])

  // Pre-fill from order + technician settings
  useEffect(() => {
    if (order) {
      setRevisionType(orderTypeToRevisionType(order.type))
    }
  }, [order])

  useEffect(() => {
    if (technicianSetting?.value) {
      const tech = technicianSetting.value as Technician
      setTechName(tech.name ?? '')
      setTechLicense(tech.licenseNumber ?? '')
      if (tech.instruments?.length > 0) {
        const instr = `${tech.instruments[0].name} ${tech.instruments[0].model}`
        setLeakTestInstrument(instr)
        setCoMeasurementInstrument(instr)
      }
    }
  }, [technicianSetting])

  // Pre-select devices from order's customer/object
  useEffect(() => {
    if (allDevices && (order || selectedCustomerId)) {
      const customerId = order?.customerId ?? selectedCustomerId
      const customerDevices = allDevices.filter(
        (d) => d.customerId === customerId && (!order?.objectId || d.objectId === order.objectId)
      )
      setSelectedDeviceIds(customerDevices.map((d) => d.id))
    }
  }, [order, selectedCustomerId, allDevices])

  const availableDevices = allDevices?.filter(
    (d) => d.customerId === (order?.customerId ?? selectedCustomerId)
  ) ?? []

  const toggleDevice = (deviceId: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]
    )
  }

  const addDefect = () => {
    setDefectDrafts((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        description: '',
        severity: 'C',
        deadline: '',
        status: 'neodstranena',
      },
    ])
  }

  const removeDefect = (tempId: string) => {
    setDefectDrafts((prev) => prev.filter((d) => d.tempId !== tempId))
  }

  const updateDefect = (tempId: string, field: keyof DefectDraft, value: string) => {
    setDefectDrafts((prev) =>
      prev.map((d) => (d.tempId === tempId ? { ...d, [field]: value } : d))
    )
  }

  const handleSave = async () => {
    if (!customer || saving) return
    setSaving(true)

    try {
      const reportId = crypto.randomUUID()

      await db.revisionReports.add({
        id: reportId,
        reportNumber,
        orderId: order?.id,
        customerId: customer.id,
        deviceIds: selectedDeviceIds,
        type: revisionType,
        date,
        technicianName: techName,
        technicianLicense: techLicense,
        leakTestResult: leakTestResult || undefined,
        leakTestInstrument: leakTestInstrument || undefined,
        functionalityTest: functionalityTest || undefined,
        fluegasTest: fluegasTest || undefined,
        coMeasurement: coMeasurement || undefined,
        coMeasurementValue: coMeasurementValue || undefined,
        coMeasurementInstrument: coMeasurementInstrument || undefined,
        ventilationCheck: ventilationCheck || undefined,
        conclusion,
        conclusionNote: conclusionNote || undefined,
        createdAt: new Date().toISOString(),
      })

      for (const draft of defectDrafts) {
        if (!draft.description.trim()) continue
        await db.defects.add({
          id: crypto.randomUUID(),
          revisionReportId: reportId,
          description: draft.description,
          severity: draft.severity,
          deadline: draft.deadline || undefined,
          status: draft.status,
        })
      }

      if (order && order.status !== 'dokoncena' && order.status !== 'fakturovano') {
        await db.orders.update(order.id, { status: 'dokoncena', updatedAt: new Date().toISOString() })
      }

      toast.success('Revizní zpráva byla vytvořena')
      navigate(`/revizni-zpravy/${reportId}`)
    } finally {
      setSaving(false)
    }
  }

  if (!orders || !customers || !allDevices) {
    return <DetailSkeleton />
  }

  if (orderId && !order) {
    return (
      <div className="page-enter space-y-6">
        <div className="py-12 text-center text-muted-foreground">Zakázka pro novou revizi nebyla nalezena</div>
        <div className="text-center">
          <Link to="/revizni-zpravy/nova" className="text-sm text-primary hover:underline">
            Vybrat jinou zakázku
          </Link>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="page-enter space-y-6 max-w-4xl mx-auto p-4 md:p-6">
        <h1 className="text-xl font-semibold text-foreground">Nová revizní zpráva</h1>
        <Card title="Výběr zákazníka">
          <p className="text-sm text-muted-foreground mb-4">Revizi můžete vytvořit i bez zakázky.</p>
          <Input
            label="Hledat zákazníka"
            value={customerQuery}
            onChange={(e) => setCustomerQuery(e.target.value)}
            placeholder="Název, adresa nebo IČO"
          />
          <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-border divide-y divide-border">
            {filteredCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3">Žádný zákazník neodpovídá hledání</p>
            ) : (
              filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId(c.id)
                    setSelectedOrderId('')
                  }}
                  className={`w-full text-left px-3 py-2.5 cursor-pointer transition-colors ${
                    selectedCustomerId === c.id ? 'bg-primary/10 text-foreground' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.address}</div>
                </button>
              ))
            )}
          </div>
        </Card>
        <Card title="Volitelně zakázka">
          <Select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            options={[
              { value: '', label: 'Bez zakázky' },
              ...selectableOrders
                .filter((o) => !selectedCustomerId || o.customerId === selectedCustomerId)
                .map((o) => ({
                  value: o.id,
                  label: `${getOrderTypeLabel(o.type)} — ${o.address}`,
                })),
            ]}
            disabled={selectableOrders.length === 0 || !selectedCustomerId}
          />
          {selectableOrders.length === 0 && (
            <div className="mt-4">
              <Link to="/zakazky/nova" className="text-sm text-primary hover:underline">
                Vytvořit novou zakázku
              </Link>
            </div>
          )}
        </Card>
      </div>
    )
  }

  const testOptions = [
    { value: 'Vyhovuje', label: 'Vyhovuje' },
    { value: 'Nevyhovuje', label: 'Nevyhovuje' },
  ]
  const testOptionsExt = [
    ...testOptions,
    { value: 'Neprovedeno', label: 'Neprovedeno' },
  ]

  return (
    <div className="page-enter p-4 md:p-6 flex flex-col gap-3 max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate(orderId ? `/zakazky/${order.id}` : '/revizni-zpravy')} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium mb-4 transition-colors cursor-pointer">
        <ArrowLeft size={20} />
        <span>Zpět na zakázku</span>
      </button>

      <div className="mb-4">
        <h1 className="text-xl font-semibold text-foreground">Nová revizní zpráva</h1>
        <p className="text-muted-foreground mt-1">
          Zákazník: <strong>{customer.name}</strong>{order ? ` — ${order.address}` : ''}
        </p>
      </div>

      {!orderId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Zákazník">
            <Input
              label="Hledat zákazníka"
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              placeholder="Název, adresa nebo IČO"
            />
            <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-border divide-y divide-border">
              {filteredCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3">Žádný zákazník neodpovídá hledání</p>
              ) : (
                filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId(c.id)
                      setSelectedOrderId('')
                    }}
                    className={`w-full text-left px-3 py-2.5 cursor-pointer transition-colors ${
                      selectedCustomerId === c.id ? 'bg-primary/10 text-foreground' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.address}</div>
                  </button>
                ))
              )}
            </div>
          </Card>
          <Card title="Zakázka (volitelné)">
            <Select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              options={[
                { value: '', label: 'Bez zakázky' },
                ...selectableOrders
                  .filter((o) => !selectedCustomerId || o.customerId === selectedCustomerId)
                  .map((o) => ({
                    value: o.id,
                    label: `${getOrderTypeLabel(o.type)} — ${o.address}`,
                  })),
              ]}
              disabled={!selectedCustomerId}
            />
          </Card>
        </div>
      )}

      {/* Basic info */}
      <Card title="Základní údaje">
        <div className="flex flex-col gap-4">
          <Input label="Číslo zprávy" value={reportNumber} readOnly />
          <Select
            label="Typ revize"
            value={revisionType}
            onChange={(e) => setRevisionType(e.target.value as RevisionType)}
            options={[
              { value: 'vychozi', label: 'Výchozí revize' },
              { value: 'provozni', label: 'Provozní revize' },
              { value: 'mimoradna', label: 'Mimořádná revize' },
            ]}
          />
          <Input label="Datum revize" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </Card>

      {/* Devices */}
      <Card title="Revidovaná zařízení">
        {availableDevices.length === 0 ? (
          <p className="text-muted-foreground">Žádná zařízení zákazníka</p>
        ) : (
          <div className="flex flex-col gap-2">
            {availableDevices.map((d) => (
              <label
                key={d.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedDeviceIds.includes(d.id)}
                  onChange={() => toggleDevice(d.id)}
                  className="w-5 h-5 accent-primary"
                />
                <span className="text-base">
                  {d.name} — {d.manufacturer} {d.model}
                  {d.serialNumber && <span className="text-muted-foreground ml-1">(v.č. {d.serialNumber})</span>}
                </span>
              </label>
            ))}
          </div>
        )}
      </Card>

      {/* Technician */}
      <Card title="Revizní technik">
        <div className="flex flex-col gap-4">
          <Input label="Jméno technika" value={techName} onChange={(e) => setTechName(e.target.value)} />
          <Input
            label="Číslo oprávnění"
            value={techLicense}
            onChange={(e) => setTechLicense(e.target.value)}
          />
        </div>
      </Card>

      {/* Tests */}
      <Card title="Provedené zkoušky">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Zkouška těsnosti"
              placeholder="Nevybráno"
              value={leakTestResult}
              onChange={(e) => setLeakTestResult(e.target.value)}
              options={testOptions}
            />
            <Input
              label="Přístroj (těsnost)"
              value={leakTestInstrument}
              onChange={(e) => setLeakTestInstrument(e.target.value)}
            />
          </div>
          <Select
            label="Zkouška funkčnosti"
            placeholder="Nevybráno"
            value={functionalityTest}
            onChange={(e) => setFunctionalityTest(e.target.value)}
            options={testOptions}
          />
          <Select
            label="Kontrola odvodu spalin"
            placeholder="Nevybráno"
            value={fluegasTest}
            onChange={(e) => setFluegasTest(e.target.value)}
            options={testOptionsExt}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Měření CO"
              placeholder="Nevybráno"
              value={coMeasurement}
              onChange={(e) => setCoMeasurement(e.target.value)}
              options={testOptions}
            />
            <Input
              label="Hodnota CO"
              placeholder="např. 18 ppm"
              value={coMeasurementValue}
              onChange={(e) => setCoMeasurementValue(e.target.value)}
            />
            <Input
              label="Přístroj (CO)"
              value={coMeasurementInstrument}
              onChange={(e) => setCoMeasurementInstrument(e.target.value)}
            />
          </div>
          <Select
            label="Kontrola větrání"
            placeholder="Nevybráno"
            value={ventilationCheck}
            onChange={(e) => setVentilationCheck(e.target.value)}
            options={testOptions}
          />
        </div>
      </Card>

      {/* Defects */}
      <Card title="Zjištěné závady">
        <div className="flex flex-col gap-4">
          {defectDrafts.map((draft) => (
            <div
              key={draft.tempId}
              className="border border-border rounded-lg p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <label className="block text-sm text-xs font-medium text-muted-foreground mb-2">
                    Popis závady
                  </label>
                  <textarea
                    value={draft.description}
                    onChange={(e) => updateDefect(draft.tempId, 'description', e.target.value)}
                    rows={2}
                    className="w-full text-sm p-3 border border-border rounded-lg  focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <button
                  onClick={() => removeDefect(draft.tempId)}
                  className="p-2 text-red-500 hover:bg-muted/50 rounded-lg cursor-pointer shrink-0 mt-6"
                  aria-label="Odebrat závadu"
                >
                  <XCircle size={22} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  label="Závažnost"
                  value={draft.severity}
                  onChange={(e) => updateDefect(draft.tempId, 'severity', e.target.value)}
                  options={[
                    { value: 'A', label: 'A — Nebezpečí' },
                    { value: 'B', label: 'B — Zhoršený stav' },
                    { value: 'C', label: 'C — Doporučení' },
                  ]}
                />
                <Input
                  label="Termín odstranění"
                  type="date"
                  value={draft.deadline}
                  onChange={(e) => updateDefect(draft.tempId, 'deadline', e.target.value)}
                />
                <Select
                  label="Stav"
                  value={draft.status}
                  onChange={(e) => updateDefect(draft.tempId, 'status', e.target.value)}
                  options={[
                    { value: 'neodstranena', label: 'Neodstraněna' },
                    { value: 'odstranena', label: 'Odstraněna' },
                  ]}
                />
              </div>
            </div>
          ))}
          <Button variant="secondary" icon={<Plus size={18} />} onClick={addDefect}>
            Přidat závadu
          </Button>
        </div>
      </Card>

      {/* Conclusion */}
      <Card title="Závěr">
        <div className="flex flex-col gap-4">
          <Select
            label="Závěr revize"
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value as RevisionConclusion)}
            options={[
              { value: 'schopne', label: 'Schopné bezpečného provozu' },
              { value: 's-vyhradami', label: 'Schopné provozu s výhradami' },
              { value: 'neschopne', label: 'Neschopné bezpečného provozu' },
            ]}
          />
          <div className="w-full">
            <label className="block text-sm text-xs font-medium text-muted-foreground mb-2">
              Poznámka k závěru
            </label>
            <textarea
              value={conclusionNote}
              onChange={(e) => setConclusionNote(e.target.value)}
              rows={3}
              className="w-full text-sm p-3 border border-border rounded-lg  focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Volitelná poznámka…"
            />
          </div>
        </div>
      </Card>

      {/* Submit */}
      <div className="flex gap-3 pt-2 pb-8">
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Ukládám…' : 'Uložit revizní zprávu'}
        </Button>
        <Button variant="secondary" size="lg" onClick={() => navigate(orderId ? `/zakazky/${order.id}` : '/revizni-zpravy')}>
          Zrušit
        </Button>
      </div>
    </div>
  )
}
