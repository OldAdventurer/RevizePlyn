import jsPDF from 'jspdf'
import type { Invoice, Customer, Technician } from '../types'
import { formatDate, formatCurrency, getPaymentMethodLabel, formatIBAN } from './format'
import { robotoBase64 } from './roboto-font'

const FONT_NAME = 'Roboto'

function registerFont(doc: jsPDF) {
  doc.addFileToVFS('Roboto-Regular.ttf', robotoBase64)
  doc.addFont('Roboto-Regular.ttf', FONT_NAME, 'normal')
  doc.addFont('Roboto-Regular.ttf', FONT_NAME, 'bold')
  doc.setFont(FONT_NAME, 'normal')
}

interface InvoicePDFData {
  invoice: Invoice
  customer: Customer
  technician: Technician
}

export function generateInvoicePDF(data: InvoicePDFData): void {
  const doc = new jsPDF()
  registerFont(doc)
  const { invoice, customer, technician } = data

  let y = 20

  // Title
  doc.setFontSize(20)
  doc.setFont(FONT_NAME, 'bold')
  doc.text(`FAKTURA c. ${invoice.invoiceNumber}`, 105, y, { align: 'center' })
  y += 10

  // Storno note
  if (invoice.status === 'stornovana') {
    doc.setFontSize(14)
    doc.setTextColor(220, 38, 38)
    doc.text('STORNOVANO', 105, y, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    y += 10
  }

  // Dates & variable symbol
  doc.setFontSize(10)
  doc.setFont(FONT_NAME, 'normal')
  y += 2
  doc.text(`Datum vystaveni: ${formatDate(invoice.issueDate)}`, 20, y)
  y += 6
  doc.text(`Datum splatnosti: ${formatDate(invoice.dueDate)}`, 20, y)
  y += 6
  doc.text(`Variabilni symbol: ${invoice.variableSymbol}`, 20, y)
  y += 10

  // Separator
  doc.line(20, y, 190, y)
  y += 10

  // Two-column: Dodavatel / Odberatel
  const leftX = 20
  const rightX = 110

  doc.setFontSize(12)
  doc.setFont(FONT_NAME, 'bold')
  doc.text('Dodavatel', leftX, y)
  doc.text('Odberatel', rightX, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont(FONT_NAME, 'normal')

  const supplierLines: string[] = []
  supplierLines.push(technician.name)
  if (technician.ico) supplierLines.push(`ICO: ${technician.ico}`)
  if (technician.address) supplierLines.push(technician.address)
  if (technician.phone) supplierLines.push(`Tel: ${technician.phone}`)
  if (technician.email) supplierLines.push(technician.email)
  if (technician.licenseNumber) supplierLines.push(`Opravneni c. ${technician.licenseNumber}`)
  if (invoice.vatRate === 0) supplierLines.push('Neplatce DPH')

  const customerLines: string[] = []
  customerLines.push(customer.name)
  if (customer.ico) customerLines.push(`ICO: ${customer.ico}`)
  if (customer.dic) customerLines.push(`DIC: ${customer.dic}`)
  if (customer.address) customerLines.push(customer.address)
  if (customer.phone) customerLines.push(`Tel: ${customer.phone}`)
  if (customer.email) customerLines.push(customer.email)

  const maxLines = Math.max(supplierLines.length, customerLines.length)
  for (let i = 0; i < maxLines; i++) {
    if (supplierLines[i]) doc.text(supplierLines[i], leftX, y)
    if (customerLines[i]) doc.text(customerLines[i], rightX, y)
    y += 6
  }
  y += 6

  // Separator
  doc.line(20, y, 190, y)
  y += 10

  // Items table header
  doc.setFont(FONT_NAME, 'bold')
  doc.setFontSize(10)
  doc.text('Popis', 20, y)
  doc.text('Mnozstvi', 110, y, { align: 'right' })
  doc.text('Cena/ks', 145, y, { align: 'right' })
  doc.text('Celkem', 185, y, { align: 'right' })
  y += 3
  doc.line(20, y, 190, y)
  y += 7

  // Page break check helper
  const checkPage = () => {
    if (y > 265) {
      doc.addPage()
      y = 20
    }
  }

  // Items
  doc.setFont(FONT_NAME, 'normal')
  for (const item of invoice.items) {
    checkPage()
    const descLines = doc.splitTextToSize(item.description, 80)
    doc.text(descLines, 20, y)
    doc.text(String(item.quantity), 110, y, { align: 'right' })
    doc.text(formatCurrency(item.unitPrice), 145, y, { align: 'right' })
    doc.text(formatCurrency(item.total), 185, y, { align: 'right' })
    y += Math.max(descLines.length * 6, 7)
  }

  // Separator
  y += 3
  doc.line(20, y, 190, y)
  y += 8

  // Subtotal
  doc.setFont(FONT_NAME, 'normal')
  doc.text('Mezisoucet:', 130, y, { align: 'right' })
  doc.text(formatCurrency(invoice.subtotal), 185, y, { align: 'right' })
  y += 7

  // VAT
  if (invoice.vatRate === 0) {
    doc.text('DPH: neplatce DPH', 130, y, { align: 'right' })
    doc.text('0 Kc', 185, y, { align: 'right' })
  } else {
    doc.text(`DPH ${invoice.vatRate}%:`, 130, y, { align: 'right' })
    doc.text(formatCurrency(invoice.vatAmount), 185, y, { align: 'right' })
  }
  y += 10

  // Total
  doc.setFont(FONT_NAME, 'bold')
  doc.setFontSize(13)
  doc.text('CELKEM K UHRADE:', 130, y, { align: 'right' })
  doc.text(formatCurrency(invoice.total), 185, y, { align: 'right' })
  y += 15

  doc.setFontSize(10)
  doc.setFont(FONT_NAME, 'normal')

  // Payment info
  checkPage()
  doc.setFont(FONT_NAME, 'bold')
  doc.text('Platebni udaje', 20, y)
  doc.setFont(FONT_NAME, 'normal')
  y += 7
  doc.text(`Bankovni ucet: ${formatIBAN(invoice.bankAccount)}`, 20, y)
  y += 6
  doc.text(`Variabilni symbol: ${invoice.variableSymbol}`, 20, y)
  y += 6
  doc.text(`Zpusob uhrady: ${getPaymentMethodLabel(invoice.paymentMethod)}`, 20, y)
  y += 12

  // Note
  if (invoice.note) {
    checkPage()
    doc.setFont(FONT_NAME, 'bold')
    doc.text('Poznamka:', 20, y)
    doc.setFont(FONT_NAME, 'normal')
    y += 7
    const noteLines = doc.splitTextToSize(invoice.note, 160)
    doc.text(noteLines, 20, y)
    y += noteLines.length * 6 + 6
  }

  // Footer
  checkPage()
  y += 5
  doc.text(`Vystavil: ${technician.name}`, 20, y)
  y += 15
  doc.text(`Dne ${formatDate(invoice.issueDate)}`, 20, y)
  y += 20
  doc.line(120, y, 190, y)
  y += 5
  doc.setFontSize(9)
  doc.text(technician.name, 155, y, { align: 'center' })
  y += 5
  doc.text('podpis', 155, y, { align: 'center' })

  // Save
  doc.save(`Faktura-${invoice.invoiceNumber}.pdf`)
}
