import { useMemo } from 'react'
import { db } from '../../db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { QRCodeSVG } from 'qrcode.react'
import Button from '@/components/ui/button'
import { ArrowLeft, Printer } from 'lucide-react'
import { ListSkeleton } from '@/components/ui/skeleton'
import type { Device } from '../../types'

export default function ZarizeniQR() {
  usePageTitle('QR kód zařízení')
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const batchParam = searchParams.get('batch')

  const batchIds = useMemo(() => (batchParam ? batchParam.split(',').filter(Boolean) : id ? [id] : []), [batchParam, id])

  const devices = useLiveQuery<Device[]>(
    () => (batchIds.length > 0 ? db.devices.where('id').anyOf(batchIds).toArray() : Promise.resolve([] as Device[])),
    [batchIds],
  )
  const customers = useLiveQuery(() => db.customers.toArray())

  const customerMap = useMemo(() => {
    const map = new Map<string, string>()
    customers?.forEach((c) => map.set(c.id, c.name))
    return map
  }, [customers])

  if (!devices) {
    return <ListSkeleton />
  }

  if (devices.length === 0) {
    return <div className="p-6 text-center text-muted-foreground">Žádná zařízení k zobrazení</div>
  }

  return (
    <div className="page-enter p-4">
      {/* Action buttons — hidden in print */}
      <div className="no-print flex flex-wrap gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer">
          <ArrowLeft size={20} />
          <span>Zpět</span>
        </button>
        <Button icon={<Printer size={20} />} onClick={() => window.print()}>
          Tisknout
        </Button>
      </div>

      {/* QR grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4">
        {devices.map((device) => {
          const qrUrl = `${window.location.origin}/zarizeni/${device.id}`
          return (
            <div
              key={device.id}
              className="flex flex-col items-center border border-border shadow-[var(--)] rounded-lg p-4 print:border-gray-400 print:rounded-none print:p-3 break-inside-avoid"
            >
              <QRCodeSVG value={qrUrl} size={200} />
              <h2 className="text-lg font-bold mt-4 text-center">{device.name}</h2>
              <p className="text-base text-muted-foreground text-center">
                {[device.manufacturer, device.model].filter(Boolean).join(' — ')}
              </p>
              {customerMap.get(device.customerId) && (
                <p className="text-sm text-muted-foreground mt-1">{customerMap.get(device.customerId)}</p>
              )}
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Naskenujte pro zobrazení detailu zařízení
              </p>
            </div>
          )
        })}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 12pt; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  )
}
