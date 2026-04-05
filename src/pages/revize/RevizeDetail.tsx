import { useState, useMemo } from 'react'
import { db } from '../../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { DetailSkeleton } from '@/components/ui/skeleton'
import {
  formatDate,
  getRevisionTypeLabel,
  getConclusionLabel,
  getSeverityLabel,
  getDefectStatusLabel,
  getDeviceCategoryIcon,
} from '../../utils/format'
import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'
import Modal from '@/components/ui/modal'
import Table, { type Column } from '@/components/ui/table'
import RevisionStamp from '@/components/ui/revisionstamp'
import {
  ArrowLeft,
  Download,
  Share2,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { generateRevisionPDF } from '../../utils/pdf'
import type { Defect, Technician } from '../../types'
import { toast } from '../../stores/toastStore'

function InfoRow({
  label,
  children,
  span,
}: {
  label: string
  children: React.ReactNode
  span?: boolean
}) {
  return (
    <div className={span ? 'md:col-span-2' : ''}>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

function conclusionVariant(c: string): 'green' | 'yellow' | 'red' {
  if (c === 'schopne') return 'green'
  if (c === 's-vyhradami') return 'yellow'
  return 'red'
}

function typeVariant(t: string): 'blue' | 'indigo' | 'orange' {
  if (t === 'vychozi') return 'blue'
  if (t === 'provozni') return 'indigo'
  return 'orange'
}

const conclusionStyles: Record<string, { wrapper: string; icon: string; title: string; note: string }> = {
  schopne: {
    wrapper: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    icon: 'text-emerald-600',
    title: 'text-sm font-semibold text-emerald-800',
    note: 'text-sm text-emerald-700',
  },
  's-vyhradami': {
    wrapper: 'bg-amber-50 border-amber-200 text-amber-700',
    icon: 'text-amber-600',
    title: 'text-sm font-semibold text-amber-800',
    note: 'text-sm text-amber-700',
  },
  neschopne: {
    wrapper: 'bg-red-50 border-red-200 text-red-700',
    icon: 'text-red-600',
    title: 'text-sm font-semibold text-red-800',
    note: 'text-sm text-red-700',
  },
}

const conclusionIcons: Record<string, typeof CheckCircle> = {
  schopne: CheckCircle,
  's-vyhradami': AlertTriangle,
  neschopne: XCircle,
}

export default function RevizeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const report = useLiveQuery(() => db.revisionReports.get(id!), [id])
  usePageTitle(report?.reportNumber ?? 'Detail revize')
  const customer = useLiveQuery(
    () => (report ? db.customers.get(report.customerId) : undefined),
    [report]
  )
  const order = useLiveQuery(
    () => (report?.orderId ? db.orders.get(report.orderId) : undefined),
    [report]
  )
  const defects = useLiveQuery(
    () => db.defects.where('revisionReportId').equals(id!).toArray(),
    [id]
  )
  const allDevices = useLiveQuery(() => db.devices.toArray())
  const technicianSetting = useLiveQuery(() => db.settings.get('technician'))

  const devices = useMemo(() => {
    if (!report || !allDevices) return []
    return allDevices.filter((d) => report.deviceIds.includes(d.id))
  }, [report, allDevices])

  if (report === undefined || !allDevices) return <DetailSkeleton />
  if (report === null) {
    return (
      <div className="page-enter space-y-6">
        <Link to="/revizni-zpravy" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Zpět na revizní zprávy
        </Link>
        <div className="py-12 text-center text-muted-foreground">Revizní zpráva nenalezena</div>
      </div>
    )
  }
  if (!customer || !defects) return <DetailSkeleton />

  const handleDownloadPDF = () => {
    const tech = technicianSetting?.value as Technician | undefined
    generateRevisionPDF({
      report,
      customer,
      devices,
      defects,
      technician: {
        name: tech?.name ?? report.technicianName,
        licenseNumber: report.technicianLicense,
        address: tech?.address ?? '',
        ico: tech?.ico ?? '',
      },
    })
  }

  const handleShare = async () => {
    const token = crypto.randomUUID()
    await db.shareLinks.add({
      id: crypto.randomUUID(),
      token,
      revisionReportId: report.id,
      createdAt: new Date().toISOString(),
    })
    const url = `${window.location.origin}/sdileni/${token}`
    await navigator.clipboard.writeText(url)
    toast.success('Odkaz byl zkopírován do schránky')
  }

  const handleDelete = async () => {
    await db.defects.where('revisionReportId').equals(report.id).delete()
    await db.revisionReports.delete(report.id)
    toast.success('Revizní zpráva byla smazána')
    navigate('/revizni-zpravy')
  }

  const testColumns: Column<{ label: string; value: string; instrument?: string }>[] = [
    { key: 'label', header: 'Zkouška' },
    {
      key: 'value',
      header: 'Výsledek',
      render: (row) => {
        const isPass =
          row.value === 'Vyhovuje' ||
          row.value.startsWith('Vyhovuje') ||
          row.value.startsWith('V normě') ||
          row.value.startsWith('V norm')
        const isFail = row.value === 'Nevyhovuje' || row.value.startsWith('Nevyhovuje')
        return (
          <span className="flex items-center gap-1.5">
            {isPass && <CheckCircle size={14} className="text-emerald-600" />}
            {isFail && <XCircle size={14} className="text-red-600" />}
            {row.value}
          </span>
        )
      },
    },
    {
      key: 'instrument',
      header: 'Měřidlo',
      render: (row) => (
        <span className="text-muted-foreground">{row.instrument || '—'}</span>
      ),
    },
  ]

  const testRows = [
    report.leakTestResult && { label: 'Zkouška těsnosti', value: report.leakTestResult, instrument: report.leakTestInstrument },
    report.functionalityTest && { label: 'Zkouška funkčnosti', value: report.functionalityTest },
    report.fluegasTest && { label: 'Kontrola odvodu spalin', value: report.fluegasTest },
    report.coMeasurement && {
      label: 'Měření CO',
      value: `${report.coMeasurement} — ${report.coMeasurementValue ?? ''}`,
      instrument: report.coMeasurementInstrument,
    },
    report.ventilationCheck && { label: 'Kontrola větrání', value: report.ventilationCheck },
  ].filter(Boolean) as { label: string; value: string; instrument?: string }[]

  const defectColumns: Column<Defect>[] = [
    { key: 'description', header: 'Popis' },
    {
      key: 'severity',
      header: 'Závažnost',
      render: (d) => (
        <Badge variant={d.severity === 'A' ? 'red' : d.severity === 'B' ? 'yellow' : 'blue'}>
          {getSeverityLabel(d.severity)}
        </Badge>
      ),
    },
    {
      key: 'deadline',
      header: 'Termín odstranění',
      render: (d) => (d.deadline ? formatDate(d.deadline) : '—'),
    },
    {
      key: 'status',
      header: 'Stav',
      render: (d) => (
        <Badge variant={d.status === 'odstranena' ? 'green' : 'red'}>
          {getDefectStatusLabel(d.status)}
        </Badge>
      ),
    },
  ]

  const style = conclusionStyles[report.conclusion]
  const ConclusionIcon = conclusionIcons[report.conclusion]

  return (
    <div className="page-enter max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Back */}
      <Link
        to="/revizni-zpravy"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Zpět na revizní zprávy
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{report.reportNumber}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{formatDate(report.date)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={typeVariant(report.type)}>{getRevisionTypeLabel(report.type)}</Badge>
          <Badge variant={conclusionVariant(report.conclusion)}>
            {getConclusionLabel(report.conclusion)}
          </Badge>
        </div>
      </div>

      {/* Revision Stamp */}
      <div className="flex justify-center">
        <RevisionStamp
          conclusion={report.conclusion}
          date={formatDate(report.date)}
          reportNumber={report.reportNumber}
          technicianName={report.technicianName}
        />
      </div>

      {/* Info grid */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-2">Informace</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-border p-5">
          <InfoRow label="Zákazník">
            <Link to={`/zakaznici/${customer.id}`} className="text-sm text-primary hover:underline">
              {customer.name}
            </Link>
            <span className="text-sm text-muted-foreground ml-1.5">{customer.address}</span>
          </InfoRow>

          {order && (
            <InfoRow label="Zakázka">
              <Link to={`/zakazky/${order.id}`} className="text-sm text-primary hover:underline">
                {order.description || order.address}
              </Link>
            </InfoRow>
          )}

          <InfoRow label="Revizní technik">
            {report.technicianName}, oprávnění č. {report.technicianLicense}
          </InfoRow>

          <InfoRow label="Revidovaná zařízení" span>
            {devices.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                {devices.map((d) => (
                  <Link
                    key={d.id}
                    to={`/zarizeni/${d.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {getDeviceCategoryIcon(d.category)} {d.name} — {d.manufacturer} {d.model}
                  </Link>
                ))}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </InfoRow>
        </div>
      </section>

      {/* Tests */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-2">Provedené zkoušky</h2>
        {testRows.length > 0 ? (
          <div className="rounded-lg border border-border">
            <Table
              columns={testColumns}
              data={testRows}
              keyExtractor={(r) => r.label}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Žádné zkoušky nebyly zaznamenány</p>
        )}
      </section>

      {/* Defects */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-2">Zjištěné závady</h2>
        {defects.length > 0 ? (
          <div className="rounded-lg border border-border">
            <Table<Defect>
              columns={defectColumns}
              data={defects}
              keyExtractor={(d) => d.id}
            />
          </div>
        ) : (
          <p className="text-sm text-emerald-600 flex items-center gap-1.5">
            <CheckCircle size={16} />
            Nebyly zjištěny žádné závady
          </p>
        )}
      </section>

      {/* Photos */}
      {report.photos && report.photos.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Fotodokumentace</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {report.photos.map((photo) => (
              <div key={photo.id}>
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-32 object-cover rounded-lg border border-border"
                  loading="lazy"
                />
                <div className="mt-1 text-xs text-muted-foreground truncate">{photo.caption}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Conclusion */}
      {style && ConclusionIcon && (
        <div className={`rounded-lg border p-4 flex items-center gap-3 ${style.wrapper}`}>
          <ConclusionIcon size={20} className={style.icon} />
          <div>
            <p className={style.title}>{getConclusionLabel(report.conclusion)}</p>
            {report.conclusionNote && <p className={style.note}>{report.conclusionNote}</p>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" icon={<Download size={16} />} onClick={handleDownloadPDF}>
          Stáhnout PDF
        </Button>
        <Button size="sm" variant="secondary" icon={<Share2 size={16} />} onClick={handleShare}>
          Sdílet
        </Button>
        <Button size="sm" variant="secondary" onClick={() => navigate(`/revizni-zpravy/${report.id}/upravit`)}>
          Upravit
        </Button>
        <Button size="sm" variant="danger" onClick={() => setShowDeleteModal(true)}>
          Smazat
        </Button>
      </div>

      {/* Delete modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Smazat revizní zprávu?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Zrušit
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Smazat
            </Button>
          </>
        }
      >
        <p className="text-sm">
          Opravdu chcete smazat zprávu <strong>{report.reportNumber}</strong>? Tato akce je nevratná
          a smaže i všechny přiřazené závady.
        </p>
      </Modal>
    </div>
  )
}
