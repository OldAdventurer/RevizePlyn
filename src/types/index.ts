export type OrderStatus = 'nova' | 'naplanovana' | 'probiha' | 'dokoncena' | 'fakturovano' | 'odlozena' | 'zrusena'
export type OrderType = 'nova-stavba' | 'rekonstrukce' | 'pravidelna-revize' | 'pravidelna-kontrola' | 'mimoradna-revize' | 'oprava-revize'
export type RevisionType = 'vychozi' | 'provozni' | 'mimoradna' | 'znovuuvedeni'
export type DefectSeverity = 'A' | 'B' | 'C'
export type DefectStatus = 'neodstranena' | 'odstranena'
export type RevisionConclusion = 'schopne' | 's-vyhradami' | 'neschopne'
export type DeviceCategory = 'kotel' | 'ohrivac' | 'sporak' | 'rozvod' | 'regulator' | 'kompresor' | 'vzduchojimac' | 'susicka' | 'vtl-potrubi' | 'stl-potrubi' | 'kotelna' | 'prumyslovy-horak' | 'filtr' | 'ostatni'
export type PressureCategory = 'NTL' | 'STL' | 'VTL'
export type Medium = 'plyn' | 'tlakovy-vzduch'
export type CustomerType = 'fyzicka-osoba' | 'firma'
export type ObjectType = 'rodinny-dum' | 'bytovy-dum' | 'byt' | 'provozovna' | 'vyrobni-hala' | 'ostatni'
export type Priority = 'normalni' | 'specha'

export interface Technician {
  name: string
  licenseNumber: string
  licenseValidFrom: string
  licenseValidTo: string
  ico: string
  address: string
  phone: string
  email: string
  instruments: Instrument[]
}

export interface Instrument {
  id: string
  name: string
  model: string
  calibrationValidUntil: string
}

export interface Customer {
  id: string
  name: string
  type: CustomerType
  ico?: string
  dic?: string
  contactPerson?: string
  phone: string
  email?: string
  address: string
  note?: string
  createdAt: string
}

export interface ObjectRecord {
  id: string
  customerId: string
  name: string
  type: ObjectType
  address: string
  note?: string
}

export interface Device {
  id: string
  objectId: string
  customerId: string
  category: DeviceCategory
  pressureCategory: PressureCategory
  medium: Medium
  name: string
  manufacturer: string
  model: string
  serialNumber?: string
  yearOfManufacture?: number
  yearOfInstallation?: number
  location?: string
  technicalParams?: string
  power?: string
  volume?: string
  maxPressure?: string
  maxTemperature?: string
  revisionPeriodMonths: number
  alertBeforeMonths: number
  note?: string
}

export interface Order {
  id: string
  customerId: string
  objectId?: string
  type: OrderType
  status: OrderStatus
  description?: string
  address: string
  plannedDate?: string
  completedDate?: string
  priority: Priority
  note?: string
  createdAt: string
  updatedAt: string
}

export interface RevisionPhoto {
  id: string
  url: string
  caption: string
  takenAt?: string
}

export interface RevisionReport {
  id: string
  reportNumber: string
  orderId?: string
  customerId: string
  deviceIds: string[]
  type: RevisionType
  date: string
  technicianName: string
  technicianLicense: string
  leakTestResult?: string
  leakTestInstrument?: string
  functionalityTest?: string
  fluegasTest?: string
  coMeasurement?: string
  coMeasurementValue?: string
  coMeasurementInstrument?: string
  ventilationCheck?: string
  conclusion: RevisionConclusion
  conclusionNote?: string
  photos?: RevisionPhoto[]
  createdAt: string
}

export interface Defect {
  id: string
  revisionReportId: string
  description: string
  severity: DefectSeverity
  deadline?: string
  status: DefectStatus
  resolvedDate?: string
  note?: string
}

export interface ShareLink {
  id: string
  token: string
  revisionReportId: string
  createdAt: string
  lastViewedAt?: string
}

// === Harmonogram (Revision Schedule) ===

export type ScheduleItemStatus = 'planovano' | 'dokonceno' | 'zruseno'

export interface ScheduleItem {
  id: string
  deviceId: string
  objectId: string
  type: OrderType
  plannedStart: string   // ISO date
  plannedEnd: string     // ISO date
  status: ScheduleItemStatus
  orderId?: string       // link to generated Order
  note?: string
}

export interface RevisionSchedule {
  id: string
  customerId: string
  year: number
  name: string
  items: ScheduleItem[]
  note?: string
  createdAt: string
  updatedAt: string
}

// === Finance / Invoicing ===

export type InvoiceStatus = 'nova' | 'odeslana' | 'zaplacena' | 'po-splatnosti' | 'stornovana'
export type PaymentMethod = 'prevod' | 'hotovost' | 'kartou'

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  orderId?: string
  customerId: string
  issueDate: string
  dueDate: string
  paidDate?: string
  items: InvoiceItem[]
  subtotal: number
  vatRate: number          // 0 for neplátce DPH, 21 for plátce
  vatAmount: number
  total: number
  paymentMethod: PaymentMethod
  bankAccount: string      // e.g. "CZ65 0800 0000 1923 4567 8901"
  variableSymbol: string   // = invoice number without prefix
  status: InvoiceStatus
  note?: string
  createdAt: string
  updatedAt: string
}
