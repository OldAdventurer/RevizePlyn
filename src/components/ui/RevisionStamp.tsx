interface RevisionStampProps {
  conclusion: 'schopne' | 's-vyhradami' | 'neschopne'
  date: string
  reportNumber: string
  technicianName: string
}

export default function RevisionStamp({ conclusion, date, reportNumber, technicianName }: RevisionStampProps) {
  const config = {
    'schopne': {
      label: 'SCHOPNÉ PROVOZU',
      color: 'text-emerald-600 border-emerald-600',
      bg: 'bg-emerald-50',
      icon: '✓',
    },
    's-vyhradami': {
      label: 'S VÝHRADAMI',
      color: 'text-amber-600 border-amber-600',
      bg: 'bg-amber-50',
      icon: '⚠',
    },
    'neschopne': {
      label: 'NESCHOPNÉ PROVOZU',
      color: 'text-red-600 border-red-600',
      bg: 'bg-red-50',
      icon: '✗',
    },
  }[conclusion]

  return (
    <div className={`inline-flex flex-col items-center ${config.bg} rounded-xl p-4`}>
      <div className={`border-4 ${config.color} rounded-xl px-6 py-3 transform -rotate-3 relative`}>
        <div className={`text-center ${config.color}`}>
          <div className="text-2xl font-black tracking-wider">{config.icon} REVIDOVÁNO</div>
          <div className="text-sm font-bold mt-1">{config.label}</div>
          <div className="border-t-2 mt-2 pt-2 text-xs font-medium opacity-75">
            <div>{reportNumber} • {date}</div>
            <div>{technicianName}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
