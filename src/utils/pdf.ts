import jsPDF from 'jspdf'
import type { RevisionReport, Defect, Customer, Device } from '../types'
import { formatDate, getRevisionTypeLabel } from './format'
import { robotoBase64 } from './roboto-font'

const FONT_NAME = 'Roboto'

function registerFont(doc: jsPDF) {
  doc.addFileToVFS('Roboto-Regular.ttf', robotoBase64)
  doc.addFont('Roboto-Regular.ttf', FONT_NAME, 'normal')
  doc.addFont('Roboto-Regular.ttf', FONT_NAME, 'bold')
  doc.setFont(FONT_NAME, 'normal')
}

interface PDFData {
  report: RevisionReport
  customer: Customer
  devices: Device[]
  defects: Defect[]
  technician: { name: string; licenseNumber: string; address: string; ico: string }
}

export function generateRevisionPDF(data: PDFData): void {
  const doc = new jsPDF()
  registerFont(doc)
  const { report, customer, devices, defects, technician } = data

  // Title
  doc.setFontSize(18)
  doc.text('REVIZNI ZPRAVA', 105, 20, { align: 'center' })
  doc.text(`c. ${report.reportNumber}`, 105, 30, { align: 'center' })

  // Type
  doc.setFontSize(14)
  doc.text(getRevisionTypeLabel(report.type), 105, 40, { align: 'center' })

  // Separator
  doc.line(20, 45, 190, 45)

  let y = 55
  doc.setFontSize(11)

  // Technician info
  doc.setFont(FONT_NAME, 'bold')
  doc.text('Revizni technik:', 20, y)
  doc.setFont(FONT_NAME, 'normal')
  y += 7
  doc.text(`${technician.name}, opravneni c. ${report.technicianLicense}`, 20, y)
  if (technician.address || technician.ico) {
    y += 6
    const parts: string[] = []
    if (technician.address) parts.push(technician.address)
    if (technician.ico) parts.push(`IC: ${technician.ico}`)
    doc.text(parts.join(', '), 20, y)
  }
  y += 12

  // Customer info
  doc.setFont(FONT_NAME, 'bold')
  doc.text('Provozovatel:', 20, y)
  doc.setFont(FONT_NAME, 'normal')
  y += 7
  doc.text(customer.name, 20, y)
  y += 6
  doc.text(customer.address, 20, y)
  if (customer.ico) {
    y += 6
    doc.text(`IC: ${customer.ico}`, 20, y)
  }
  y += 12

  // Revision date
  doc.setFont(FONT_NAME, 'bold')
  doc.text('Datum revize:', 20, y)
  doc.setFont(FONT_NAME, 'normal')
  doc.text(formatDate(report.date), 80, y)
  y += 12

  // Devices
  doc.setFont(FONT_NAME, 'bold')
  doc.text('Revidovana zarizeni:', 20, y)
  doc.setFont(FONT_NAME, 'normal')
  y += 7
  devices.forEach((d) => {
    const line = `- ${d.name} - ${d.manufacturer} ${d.model}${d.serialNumber ? `, v.c. ${d.serialNumber}` : ''}`
    doc.text(line, 25, y)
    y += 6
  })
  y += 6

  // Page break check helper
  const checkPage = () => {
    if (y > 265) {
      doc.addPage()
      y = 20
    }
  }

  // Tests
  checkPage()
  doc.setFont(FONT_NAME, 'bold')
  doc.text('Provedene zkousky:', 20, y)
  doc.setFont(FONT_NAME, 'normal')
  y += 7
  if (report.leakTestResult) {
    doc.text(`Zkouska tesnosti: ${report.leakTestResult}${report.leakTestInstrument ? ` (${report.leakTestInstrument})` : ''}`, 25, y)
    y += 6
  }
  if (report.functionalityTest) {
    doc.text(`Zkouska funkcnosti: ${report.functionalityTest}`, 25, y)
    y += 6
  }
  if (report.fluegasTest) {
    doc.text(`Kontrola odvodu spalin: ${report.fluegasTest}`, 25, y)
    y += 6
  }
  if (report.coMeasurement) {
    doc.text(`Mereni CO: ${report.coMeasurementValue ?? ''}${report.coMeasurementInstrument ? ` (${report.coMeasurementInstrument})` : ''}`, 25, y)
    y += 6
  }
  if (report.ventilationCheck) {
    doc.text(`Kontrola vetrani: ${report.ventilationCheck}`, 25, y)
    y += 6
  }
  y += 6

  // Defects
  if (defects.length > 0) {
    checkPage()
    doc.setFont(FONT_NAME, 'bold')
    doc.text('Zjistene zavady:', 20, y)
    doc.setFont(FONT_NAME, 'normal')
    y += 7
    defects.forEach((d, i) => {
      checkPage()
      doc.text(`${i + 1}. [${d.severity}] ${d.description}`, 25, y)
      y += 6
      if (d.deadline) {
        doc.text(`   Termin odstraneni: ${formatDate(d.deadline)}`, 30, y)
        y += 6
      }
    })
    y += 6
  }

  // Conclusion
  checkPage()
  doc.setFont(FONT_NAME, 'bold')
  doc.setFontSize(13)
  doc.text('ZAVER:', 20, y)
  y += 8
  doc.setFontSize(12)
  const conclusionText =
    report.conclusion === 'schopne'
      ? 'Zarizeni je SCHOPNE bezpecneho provozu.'
      : report.conclusion === 's-vyhradami'
        ? 'Zarizeni je schopne provozu S VYHRADAMI - je nutne odstranit zjistene zavady.'
        : 'Zarizeni NENI SCHOPNE bezpecneho provozu - musi byt odstaveno!'
  doc.text(conclusionText, 20, y)

  if (report.conclusionNote) {
    y += 7
    doc.setFontSize(11)
    doc.setFont(FONT_NAME, 'normal')
    const noteLines = doc.splitTextToSize(report.conclusionNote, 160)
    doc.text(noteLines, 20, y)
    y += noteLines.length * 6
  }
  y += 15

  // Signature
  checkPage()
  doc.setFontSize(11)
  doc.setFont(FONT_NAME, 'normal')
  doc.text(`Dne ${formatDate(report.date)}`, 20, y)
  y += 20
  doc.line(120, y, 190, y)
  y += 5
  doc.setFontSize(10)
  doc.text(technician.name, 155, y, { align: 'center' })
  y += 5
  doc.text('revizni technik', 155, y, { align: 'center' })

  // Save
  doc.save(`${report.reportNumber}.pdf`)
}
