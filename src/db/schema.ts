import Dexie, { type Table } from 'dexie'
import type { Customer, ObjectRecord, Device, Order, RevisionReport, Defect, ShareLink, Invoice } from '../types'

export class RevizeDB extends Dexie {
  customers!: Table<Customer>
  objects!: Table<ObjectRecord>
  devices!: Table<Device>
  orders!: Table<Order>
  revisionReports!: Table<RevisionReport>
  defects!: Table<Defect>
  shareLinks!: Table<ShareLink>
  invoices!: Table<Invoice, string>
  settings!: Table<{ key: string; value: unknown }>

  constructor() {
    super('RevizePlyn')
    this.version(1).stores({
      customers: 'id, name, type, phone',
      objects: 'id, customerId, type, address',
      devices: 'id, objectId, customerId, category, manufacturer',
      orders: 'id, customerId, objectId, type, status, plannedDate, createdAt',
      revisionReports: 'id, reportNumber, orderId, customerId, type, date, conclusion',
      defects: 'id, revisionReportId, severity, status',
      shareLinks: 'id, token, revisionReportId',
      settings: 'key'
    })
    this.version(2).stores({
      customers: 'id, name, type, phone',
      objects: 'id, customerId, type, address',
      devices: 'id, objectId, customerId, category, manufacturer',
      orders: 'id, customerId, objectId, type, status, plannedDate, createdAt',
      revisionReports: 'id, reportNumber, orderId, customerId, type, date, conclusion',
      defects: 'id, revisionReportId, severity, status',
      shareLinks: 'id, token, revisionReportId',
      invoices: 'id, invoiceNumber, orderId, customerId, status, issueDate, dueDate',
      settings: 'key'
    })
  }
}

export const db = new RevizeDB()
