import { useState, useMemo } from 'react'
import { db } from '../../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { DetailSkeleton } from '../../components/ui/Skeleton'
import {
  formatDate,
  getRevisionTypeLabel,
  getConclusionLabel,
  getSeverityLabel,
  getDefectStatusLabel,
  getDeviceCategoryIcon,
} from '../../utils/format'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Table, { type Column } from '../../components/ui/Table'
import RevisionStamp from '../../components/ui/RevisionStamp'
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
    () => (report ? db.orders.get(report.orderId) : undefined),
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

  if (!report || !customer || !defects || !allDevices) {
    return <DetailSkeleton />
  }

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

  const testRow = (label: string, value?: string, instrument?: string) => {
    if (!value) return null
    const isPass = value === 'Vyhovuje' || value.startsWith('Vyhovuje') || value.startsWith('V normě') || value.startsWith('V norm')
    const isFail = value === 'Nevyhovuje' || value.startsWith('Nevyhovuje')
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
        <span className="text-base text-gray-600">{label}</span>
        <span className="flex items-center gap-2 text-base font-medium">
          {isPass ? (
            <span>✅</span>
          ) : isFail ? (
            <span>❌</span>
          ) : null}
          {value}
          {instrument && <span className="text-sm text-gray-400">({instrument})</span>}
        </span>
      </div>
    )
  }

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

  return (
    <div className="page-enter p-4 md:p-6 flex flex-col gap-3 max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/revizni-zpravy')} className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] font-medium mb-4 transition-colors cursor-pointer">
        <ArrowLeft size={20} />
        <span>Zpět na revizní zprávy</span>
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{report.reportNumber}</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">{formatDate(report.date)}</p>
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

      {/* Info */}
      <Card title="Informace" accent="blue">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
            <span className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] w-48 shrink-0">Zákazník:</span>
            <span>
              <Link
                to={`/zakaznici/${customer.id}`}
                className="text-[var(--color-primary)] hover:underline font-medium"
              >
                {customer.name}
              </Link>
              <span className="text-gray-500 ml-2">{customer.address}</span>
            </span>
          </div>

          {order && (
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
              <span className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] w-48 shrink-0">Zakázka:</span>
              <Link
                to={`/zakazky/${order.id}`}
                className="text-[var(--color-primary)] hover:underline font-medium"
              >
                {order.description || order.address}
              </Link>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
            <span className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] w-48 shrink-0">Revidovaná zařízení:</span>
            <div className="flex flex-col gap-1">
              {devices.length > 0 ? (
                devices.map((d) => (
                  <Link
                    key={d.id}
                    to={`/zarizeni/${d.id}`}
                    className="text-[var(--color-primary)] hover:underline"
                  >
                    {getDeviceCategoryIcon(d.category)} {d.name} — {d.manufacturer} {d.model}
                  </Link>
                ))
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
            <span className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] w-48 shrink-0">Revizní technik:</span>
            <span>
              {report.technicianName}, oprávnění č. {report.technicianLicense}
            </span>
          </div>
        </div>
      </Card>

      {/* Tests */}
      <Card title="Provedené zkoušky" accent="green">
        <div className="flex flex-col">
          {testRow('Zkouška těsnosti', report.leakTestResult, report.leakTestInstrument)}
          {testRow('Zkouška funkčnosti', report.functionalityTest)}
          {testRow('Kontrola odvodu spalin', report.fluegasTest)}
          {report.coMeasurement &&
            testRow(
              'Měření CO',
              `${report.coMeasurement} — ${report.coMeasurementValue ?? ''}`,
              report.coMeasurementInstrument
            )}
          {testRow('Kontrola větrání', report.ventilationCheck)}
          {!report.leakTestResult &&
            !report.functionalityTest &&
            !report.fluegasTest &&
            !report.coMeasurement &&
            !report.ventilationCheck && (
              <p className="text-gray-400 py-2">Žádné zkoušky nebyly zaznamenány</p>
            )}
        </div>
      </Card>

      {/* Defects */}
      <Card title="Zjištěné závady" accent="red">
        {defects.length > 0 ? (
          <Table<Defect>
            columns={defectColumns}
            data={defects}
            keyExtractor={(d) => d.id}
          />
        ) : (
          <p className="text-green-600 font-medium flex items-center gap-2 py-2">
            <CheckCircle size={20} />
            Nebyly zjištěny žádné závady ✅
          </p>
        )}
      </Card>

      {/* Fotodokumentace */}
      {report.photos && report.photos.length > 0 && (
        <Card title="📸 Fotodokumentace">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {report.photos.map((photo) => (
              <div key={photo.id} className="group relative">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  loading="lazy"
                />
                <div className="mt-1 text-xs text-gray-500 truncate">{photo.caption}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Conclusion */}
      {report.conclusion === 'schopne' && (
        <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle className="text-white" size={24} />
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-800">{getConclusionLabel(report.conclusion)}</p>
              {report.conclusionNote && <p className="text-emerald-600">{report.conclusionNote}</p>}
            </div>
          </div>
        </div>
      )}
      {report.conclusion === 's-vyhradami' && (
        <div className="rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
              <AlertTriangle className="text-white" size={24} />
            </div>
            <div>
              <p className="text-lg font-bold text-amber-800">{getConclusionLabel(report.conclusion)}</p>
              {report.conclusionNote && <p className="text-amber-600">{report.conclusionNote}</p>}
            </div>
          </div>
        </div>
      )}
      {report.conclusion === 'neschopne' && (
        <div className="rounded-xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
              <XCircle className="text-white" size={24} />
            </div>
            <div>
              <p className="text-lg font-bold text-red-800">{getConclusionLabel(report.conclusion)}</p>
              {report.conclusionNote && <p className="text-red-600">{report.conclusionNote}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2 pb-4">
        <Button icon={<Download size={18} />} onClick={handleDownloadPDF}>
          Stáhnout PDF
        </Button>
        <Button variant="secondary" icon={<Share2 size={18} />} onClick={handleShare}>
          Sdílet
        </Button>
        <Button variant="secondary" onClick={() => navigate(`/revizni-zpravy/${report.id}/upravit`)}>
          Upravit
        </Button>
        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
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
        <p className="text-base">
          Opravdu chcete smazat zprávu <strong>{report.reportNumber}</strong>? Tato akce je nevratná
          a smaže i všechny přiřazené závady.
        </p>
      </Modal>
    </div>
  )
}
