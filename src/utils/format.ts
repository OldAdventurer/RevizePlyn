import type {
  OrderStatus,
  OrderType,
  RevisionType,
  DeviceCategory,
  RevisionConclusion,
  DefectSeverity,
  CustomerType,
  ObjectType,
  Priority,
  DefectStatus,
  InvoiceStatus,
  PaymentMethod,
} from '../types'

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('420')) {
    return `+420 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
  }
  if (digits.length === 9) {
    return `+420 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return phone
}

export function formatCurrency(amount: number): string {
  const formatted = amount.toLocaleString('cs-CZ')
  return `${formatted} Kč`
}

export function getOrderStatusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    nova: 'Nová',
    naplanovana: 'Naplánovaná',
    probiha: 'Probíhá',
    dokoncena: 'Dokončena',
    fakturovano: 'Fakturováno',
    odlozena: 'Odložená',
    zrusena: 'Zrušená',
  }
  return map[status]
}

export function getOrderStatusColor(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    nova: 'blue',
    naplanovana: 'indigo',
    probiha: 'yellow',
    dokoncena: 'green',
    fakturovano: 'emerald',
    odlozena: 'orange',
    zrusena: 'gray',
  }
  return map[status]
}

export function getOrderTypeLabel(type: OrderType): string {
  const map: Record<OrderType, string> = {
    'nova-stavba': 'Nová stavba',
    rekonstrukce: 'Rekonstrukce',
    'pravidelna-revize': 'Pravidelná revize',
    'pravidelna-kontrola': 'Pravidelná kontrola',
    'mimoradna-revize': 'Mimořádná revize',
    'oprava-revize': 'Oprava + revize',
  }
  return map[type]
}

export function getRevisionTypeLabel(type: RevisionType): string {
  const map: Record<RevisionType, string> = {
    vychozi: 'Výchozí revize',
    provozni: 'Provozní revize',
    mimoradna: 'Mimořádná revize',
  }
  return map[type]
}

export function getDeviceCategoryLabel(category: DeviceCategory): string {
  const map: Record<DeviceCategory, string> = {
    kotel: 'Kotel',
    ohrivac: 'Průtokový ohřívač',
    sporak: 'Sporák',
    rozvod: 'Plynový rozvod',
    regulator: 'Regulátor',
    ostatni: 'Ostatní',
  }
  return map[category]
}

export function getConclusionLabel(conclusion: RevisionConclusion): string {
  const map: Record<RevisionConclusion, string> = {
    schopne: '✅ Schopné bezpečného provozu',
    's-vyhradami': '⚠️ Schopné provozu s výhradami',
    neschopne: '❌ Neschopné bezpečného provozu',
  }
  return map[conclusion]
}

export function getSeverityLabel(severity: DefectSeverity): string {
  const map: Record<DefectSeverity, string> = {
    A: 'A — Nebezpečí',
    B: 'B — Zhoršený stav',
    C: 'C — Doporučení',
  }
  return map[severity]
}

export function getCustomerTypeLabel(type: CustomerType): string {
  return type === 'fyzicka-osoba' ? 'Fyzická osoba' : 'Firma'
}

export function getObjectTypeLabel(type: ObjectType): string {
  const map: Record<ObjectType, string> = {
    'rodinny-dum': 'Rodinný dům',
    'bytovy-dum': 'Bytový dům',
    byt: 'Byt',
    provozovna: 'Provozovna',
    'vyrobni-hala': 'Výrobní hala',
    ostatni: 'Ostatní',
  }
  return map[type]
}

export function getPriorityLabel(priority: Priority): string {
  return priority === 'normalni' ? 'Normální' : 'Spěchá'
}

export function getDefectStatusLabel(status: DefectStatus): string {
  return status === 'neodstranena' ? 'Neodstraněna' : 'Odstraněna'
}

// === Invoice helpers ===

export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  const labels: Record<InvoiceStatus, string> = {
    'nova': 'Nová',
    'odeslana': 'Odeslaná',
    'zaplacena': 'Zaplacená',
    'po-splatnosti': 'Po splatnosti',
    'stornovana': 'Stornovaná',
  }
  return labels[status] || status
}

export function getInvoiceStatusColor(status: InvoiceStatus): string {
  const colors: Record<InvoiceStatus, string> = {
    'nova': 'blue',
    'odeslana': 'yellow',
    'zaplacena': 'green',
    'po-splatnosti': 'red',
    'stornovana': 'gray',
  }
  return colors[status] || 'gray'
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    'prevod': 'Bankovní převod',
    'hotovost': 'Hotovost',
    'kartou': 'Platba kartou',
  }
  return labels[method] || method
}

export function formatIBAN(iban: string): string {
  return iban.replace(/(.{4})/g, '$1 ').trim()
}
