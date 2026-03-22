export type OrderStatus = 'nova' | 'naplanovana' | 'probiha' | 'dokoncena' | 'fakturovano' | 'odlozena' | 'zrusena'
export type OrderType = 'nova-stavba' | 'rekonstrukce' | 'pravidelna-revize' | 'pravidelna-kontrola' | 'mimoradna-revize' | 'oprava-revize'
export type RevisionType = 'vychozi' | 'provozni' | 'mimoradna'
export type DefectSeverity = 'A' | 'B' | 'C'
export type DefectStatus = 'neodstranena' | 'odstranena'
export type RevisionConclusion = 'schopne' | 's-vyhradami' | 'neschopne'
export type DeviceCategory = 'kotel' | 'ohrivac' | 'sporak' | 'rozvod' | 'regulator' | 'ostatni'
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
  name: string
  manufacturer: string
  model: string
  serialNumber?: string
  yearOfManufacture?: number
  yearOfInstallation?: number
  location?: string
  technicalParams?: string
  power?: string
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

export interface RevisionReport {
  id: string
  reportNumber: string
  orderId: string
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
