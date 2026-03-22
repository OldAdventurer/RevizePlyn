import { useEffect } from 'react'
import { db } from '../../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { useParams } from 'react-router-dom'
import { formatDate, getRevisionTypeLabel, getConclusionLabel, getSeverityLabel } from '../../utils/format'
import { generateRevisionPDF } from '../../utils/pdf'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Download, CheckCircle, XCircle, Shield, Loader2 } from 'lucide-react'
import type { Technician } from '../../types'

export default function SdileniPage() {
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  // Invalid token
  if (shareLink === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <Shield size={48} className="mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Odkaz nenalezen</h1>
          <p className="text-base text-gray-500">
            Tento sdílecí odkaz je neplatný nebo již vypršel.
          </p>
        </div>
      </div>
    )
  }

  // Still loading related data
  if (!report) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  const conclusionVariant = report.conclusion === 'schopne' ? 'green'
    : report.conclusion === 's-vyhradami' ? 'yellow' : 'red'

  const typeVariant = report.type === 'vychozi' ? 'blue'
    : report.type === 'provozni' ? 'indigo' : 'orange'

  const conclusionBg = report.conclusion === 'schopne' ? 'bg-green-50 border-green-200'
    : report.conclusion === 's-vyhradami' ? 'bg-yellow-50 border-yellow-200'
    : 'bg-red-50 border-red-200'

  const conclusionText = report.conclusion === 'schopne' ? 'text-green-800'
    : report.conclusion === 's-vyhradami' ? 'text-yellow-800'
    : 'text-red-800'

  const testRow = (label: string, value?: string, instrument?: string) => {
    if (!value) return null
    const pass = value === 'Vyhovuje'
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
        <span className="text-base text-gray-600">{label}</span>
        <span className="flex items-center gap-2 text-base font-medium">
          {pass ? (
            <CheckCircle size={18} className="text-green-500" />
          ) : value === 'Nevyhovuje' ? (
            <XCircle size={18} className="text-red-500" />
          ) : null}
          {value}
          {instrument && <span className="text-sm text-gray-400">({instrument})</span>}
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
    <div className="min-h-screen bg-white">
      <div className="max-w-[800px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">RevizePlyn</h1>
          <p className="text-base text-gray-500 mt-1">Sdílená revizní zpráva</p>
        </div>

        {/* Report header */}
        <Card className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{report.reportNumber}</h2>
              <p className="text-base text-gray-500">{formatDate(report.date)}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={typeVariant}>{getRevisionTypeLabel(report.type)}</Badge>
              <Badge variant={conclusionVariant}>{getConclusionLabel(report.conclusion)}</Badge>
            </div>
          </div>
        </Card>

        {/* Customer */}
        {customer && (
          <Card title="Provozovatel" className="mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-base font-medium text-gray-800">{customer.name}</span>
              <span className="text-base text-gray-600">{customer.address}</span>
              {customer.ico && (
                <span className="text-base text-gray-500">IČ: {customer.ico}</span>
              )}
            </div>
          </Card>
        )}

        {/* Technician */}
        <Card title="Revizní technik" className="mb-4">
          <div className="flex flex-col gap-1">
            <span className="text-base font-medium text-gray-800">{report.technicianName}</span>
            <span className="text-base text-gray-500">Č. oprávnění: {report.technicianLicense}</span>
          </div>
        </Card>

        {/* Devices */}
        {reportDevices && reportDevices.length > 0 && (
          <Card title="Revidovaná zařízení" className="mb-4">
            <div className="flex flex-col gap-2">
              {reportDevices.map((device) => (
                <div key={device.id} className="flex flex-col py-2 border-b border-gray-100 last:border-0">
                  <span className="text-base font-medium text-gray-800">{device.name}</span>
                  <span className="text-sm text-gray-500">
                    {device.manufacturer} {device.model}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tests */}
        <Card title="Provedené zkoušky" className="mb-4">
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
          <Card title="Zjištěné závady" className="mb-4">
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
                  <p className="text-base text-gray-800">{defect.description}</p>
                  {defect.deadline && (
                    <p className="text-sm text-gray-500">Termín: {formatDate(defect.deadline)}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Conclusion */}
        <div className={`rounded-xl border p-6 mb-6 ${conclusionBg}`}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Závěr</h3>
          <p className={`text-xl font-bold ${conclusionText}`}>
            {getConclusionLabel(report.conclusion)}
          </p>
          {report.conclusionNote && (
            <p className={`text-base mt-2 ${conclusionText} opacity-80`}>{report.conclusionNote}</p>
          )}
        </div>

        {/* Download PDF */}
        {customer && technician && (
          <div className="flex justify-center mb-8">
            <Button icon={<Download size={18} />} onClick={handleDownloadPDF}>
              Stáhnout PDF
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 border-t border-gray-100 pt-6">
          <p>Dokument vygenerován aplikací RevizePlyn</p>
          <p className="mt-1">
            Tato zpráva byla sdílena revizním technikem {report.technicianName}
          </p>
        </div>
      </div>
    </div>
  )
}
