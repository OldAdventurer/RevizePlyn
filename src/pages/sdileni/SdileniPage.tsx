import { useEffect } from 'react'
import { db } from '../../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { useParams } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate, getRevisionTypeLabel, getConclusionLabel, getSeverityLabel, getDeviceCategoryIcon } from '../../utils/format'
import { generateRevisionPDF } from '../../utils/pdf'
import Card from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'
import RevisionStamp from '@/components/ui/revisionstamp'
import { Download, CheckCircle, XCircle, Shield } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Technician } from '../../types'

export default function SdileniPage() {
  usePageTitle('Sdílená revizní zpráva')
  const { token } = useParams()

  const shareLink = useLiveQuery(
    () => db.shareLinks.where('token').equals(token!).first(),
    [token]
  )

  const report = useLiveQuery(
    () => shareLink ? db.revisionReports.get(shareLink.revisionReportId) : undefined,
    [shareLink?.revisionReportId]
  )

  const customer = useLiveQuery(
    () => report ? db.customers.get(report.customerId) : undefined,
    [report?.customerId]
  )

  const reportDevices = useLiveQuery(
    () => report && report.deviceIds.length > 0
      ? db.devices.where('id').anyOf(report.deviceIds).toArray()
      : [],
    [report?.deviceIds]
  )

  const defects = useLiveQuery(
    () => report ? db.defects.where('revisionReportId').equals(report.id).toArray() : [],
    [report?.id]
  )

  const techSetting = useLiveQuery(() => db.settings.get('technician'))
  const technician = techSetting?.value as Technician | undefined

  useEffect(() => {
    if (shareLink) {
      db.shareLinks.update(shareLink.id, { lastViewedAt: new Date().toISOString() })
    }
  }, [shareLink?.id])

  // Loading state
  if (shareLink === undefined) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    )
  }

  // Invalid token
  if (shareLink === null) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="text-center p-8">
          <Shield size={48} className="mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Odkaz nenalezen</h1>
          <p className="text-base text-muted-foreground">
            Tento sdílecí odkaz je neplatný nebo již vypršel.
          </p>
        </div>
      </div>
    )
  }

  // Still loading related data
  if (!report) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    )
  }

  const conclusionVariant = report.conclusion === 'schopne' ? 'green'
    : report.conclusion === 's-vyhradami' ? 'yellow' : 'red'

  const typeVariant = report.type === 'vychozi' ? 'blue'
    : report.type === 'provozni' ? 'indigo' : 'orange'

  const testRow = (label: string, value?: string, instrument?: string) => {
    if (!value) return null
    const isPass = value === 'Vyhovuje' || value.startsWith('Vyhovuje') || value.startsWith('V normě') || value.startsWith('V norm')
    const isFail = value === 'Nevyhovuje' || value.startsWith('Nevyhovuje')
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
        <span className="text-base text-muted-foreground">{label}</span>
        <span className="flex items-center gap-2 text-base font-medium">
          {isPass ? (
            <span>✅</span>
          ) : isFail ? (
            <span>❌</span>
          ) : null}
          {value}
          {instrument && <span className="text-sm text-muted-foreground">({instrument})</span>}
        </span>
      </div>
    )
  }

  const handleDownloadPDF = () => {
    if (!customer || !technician) return
    generateRevisionPDF({
      report,
      customer,
      devices: reportDevices ?? [],
      defects: defects ?? [],
      technician: {
        name: technician.name,
        licenseNumber: technician.licenseNumber,
        address: technician.address,
        ico: technician.ico,
      },
    })
  }

  return (
    <div className="min-h-screen bg-card">
      <div className="page-enter max-w-[800px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">RevizePlyn</h1>
          <p className="text-base text-muted-foreground mt-1">Sdílená revizní zpráva</p>
        </div>

        {/* Report header */}
        <Card className="mb-4" accent="blue">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">{report.reportNumber}</h2>
              <p className="text-base text-muted-foreground">{formatDate(report.date)}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={typeVariant}>{getRevisionTypeLabel(report.type)}</Badge>
              <Badge variant={conclusionVariant}>{getConclusionLabel(report.conclusion)}</Badge>
            </div>
          </div>
        </Card>

        {/* Revision Stamp */}
        <div className="flex justify-center mb-4">
          <RevisionStamp
            conclusion={report.conclusion}
            date={formatDate(report.date)}
            reportNumber={report.reportNumber}
            technicianName={report.technicianName}
          />
        </div>

        {/* Customer */}
        {customer && (
          <Card title="Provozovatel" className="mb-4" accent="blue">
            <div className="flex flex-col gap-1">
              <span className="text-base font-medium text-foreground">{customer.name}</span>
              <span className="text-base text-muted-foreground">{customer.address}</span>
              {customer.ico && (
                <span className="text-base text-muted-foreground">IČ: {customer.ico}</span>
              )}
            </div>
          </Card>
        )}

        {/* Technician */}
        <Card title="Revizní technik" className="mb-4" accent="blue">
          <div className="flex flex-col gap-1">
            <span className="text-base font-medium text-foreground">{report.technicianName}</span>
            <span className="text-base text-muted-foreground">Č. oprávnění: {report.technicianLicense}</span>
          </div>
        </Card>

        {/* Devices */}
        {reportDevices && reportDevices.length > 0 && (
          <Card title="Revidovaná zařízení" className="mb-4" accent="blue">
            <div className="flex flex-col gap-2">
              {reportDevices.map((device) => (
                <div key={device.id} className="flex flex-col py-2 border-b border-gray-100 last:border-0">
                  <span className="text-base font-medium text-foreground">{getDeviceCategoryIcon(device.category)} {device.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {device.manufacturer} {device.model}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tests */}
        <Card title="Provedené zkoušky" className="mb-4" accent="green">
          <div className="flex flex-col">
            {testRow('Zkouška těsnosti', report.leakTestResult, report.leakTestInstrument)}
            {testRow('Zkouška funkčnosti', report.functionalityTest)}
            {testRow('Kontrola odvodu spalin', report.fluegasTest)}
            {testRow(
              'Měření CO',
              report.coMeasurement
                ? `${report.coMeasurement}${report.coMeasurementValue ? ` — ${report.coMeasurementValue}` : ''}`
                : undefined,
              report.coMeasurementInstrument
            )}
            {testRow('Kontrola větrání', report.ventilationCheck)}
          </div>
        </Card>

        {/* Defects */}
        {defects && defects.length > 0 && (
          <Card title="Zjištěné závady" className="mb-4" accent="red">
            <div className="flex flex-col gap-3">
              {defects.map((defect) => (
                <div key={defect.id} className="flex flex-col gap-1 py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={defect.severity === 'A' ? 'red' : defect.severity === 'B' ? 'orange' : 'blue'}>
                      {getSeverityLabel(defect.severity)}
                    </Badge>
                    <Badge variant={defect.status === 'odstranena' ? 'green' : 'red'}>
                      {defect.status === 'odstranena' ? 'Odstraněna' : 'Neodstraněna'}
                    </Badge>
                  </div>
                  <p className="text-base text-foreground">{defect.description}</p>
                  {defect.deadline && (
                    <p className="text-sm text-muted-foreground">Termín: {formatDate(defect.deadline)}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Fotodokumentace */}
        {report.photos && report.photos.length > 0 && (
          <Card title="📸 Fotodokumentace" className="mb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {report.photos.map((photo) => (
                <div key={photo.id} className="group relative">
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
          </Card>
        )}

        {/* Conclusion */}
        {report.conclusion === 'schopne' && (
          <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                <CheckCircle className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-600 mb-1">Závěr</h3>
                <p className="text-lg font-bold text-emerald-800">{getConclusionLabel(report.conclusion)}</p>
                {report.conclusionNote && <p className="text-emerald-600 mt-1">{report.conclusionNote}</p>}
              </div>
            </div>
          </div>
        )}
        {report.conclusion === 's-vyhradami' && (
          <div className="rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
                <XCircle className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-600 mb-1">Závěr</h3>
                <p className="text-lg font-bold text-amber-800">{getConclusionLabel(report.conclusion)}</p>
                {report.conclusionNote && <p className="text-amber-600 mt-1">{report.conclusionNote}</p>}
              </div>
            </div>
          </div>
        )}
        {report.conclusion === 'neschopne' && (
          <div className="rounded-lg bg-gradient-to-r from-red-50 to-red-100 border border-red-200 p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                <XCircle className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-red-600 mb-1">Závěr</h3>
                <p className="text-lg font-bold text-red-800">{getConclusionLabel(report.conclusion)}</p>
                {report.conclusionNote && <p className="text-red-600 mt-1">{report.conclusionNote}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Download PDF */}
        {customer && technician && (
          <div className="flex justify-center mb-8">
            <Button icon={<Download size={18} />} onClick={handleDownloadPDF}>
              Stáhnout PDF
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground border-t border-gray-100 pt-6">
          <p>Dokument vygenerován aplikací RevizePlyn</p>
          <p className="mt-1">
            Tato zpráva byla sdílena revizním technikem {report.technicianName}
          </p>
        </div>
      </div>
    </div>
  )
}
