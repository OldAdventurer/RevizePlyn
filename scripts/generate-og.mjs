import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

const canvas = createCanvas(1200, 630)
const ctx = canvas.getContext('2d')

// Background: dark slate gradient
const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630)
bgGrad.addColorStop(0, '#0F172A')
bgGrad.addColorStop(1, '#1E293B')
ctx.fillStyle = bgGrad
ctx.fillRect(0, 0, 1200, 630)

// Decorative circles
ctx.fillStyle = 'rgba(37, 99, 235, 0.08)'
ctx.beginPath(); ctx.arc(1050, 100, 300, 0, Math.PI * 2); ctx.fill()
ctx.fillStyle = 'rgba(59, 130, 246, 0.06)'
ctx.beginPath(); ctx.arc(150, 530, 200, 0, Math.PI * 2); ctx.fill()

// Top accent line
const accentGrad = ctx.createLinearGradient(0, 0, 400, 0)
accentGrad.addColorStop(0, '#2563EB')
accentGrad.addColorStop(1, '#3B82F6')
ctx.fillStyle = accentGrad
ctx.fillRect(0, 0, 1200, 4)

// Logo square
const logoGrad = ctx.createLinearGradient(80, 180, 160, 260)
logoGrad.addColorStop(0, '#2563EB')
logoGrad.addColorStop(1, '#1D4ED8')
ctx.fillStyle = logoGrad
roundRect(ctx, 80, 180, 80, 80, 18)
ctx.fill()

// Flame in logo
const flameGrad = ctx.createLinearGradient(108, 192, 140, 248)
flameGrad.addColorStop(0, '#FCD34D')
flameGrad.addColorStop(0.5, '#F59E0B')
flameGrad.addColorStop(1, '#EF4444')
ctx.fillStyle = flameGrad
ctx.globalAlpha = 0.9
ctx.beginPath()
ctx.moveTo(120, 195)
ctx.bezierCurveTo(120, 195, 104, 211, 104, 227)
ctx.bezierCurveTo(104, 236, 111, 243, 120, 243)
ctx.bezierCurveTo(129, 243, 136, 236, 136, 227)
ctx.bezierCurveTo(136, 211, 120, 195, 120, 195)
ctx.fill()
ctx.globalAlpha = 0.85
ctx.fillStyle = 'white'
ctx.beginPath()
ctx.moveTo(120, 211)
ctx.bezierCurveTo(120, 211, 112, 219, 112, 228)
ctx.bezierCurveTo(112, 232, 116, 236, 120, 236)
ctx.bezierCurveTo(124, 236, 128, 232, 128, 228)
ctx.bezierCurveTo(128, 219, 120, 211, 120, 211)
ctx.fill()
ctx.globalAlpha = 1

// Title
ctx.fillStyle = 'white'
ctx.font = '800 52px "Segoe UI", system-ui, sans-serif'
ctx.fillText('RevizePlyn', 180, 232)

// Subtitle
ctx.fillStyle = '#94A3B8'
ctx.font = '400 28px "Segoe UI", system-ui, sans-serif'
ctx.fillText('Evidence revizí plynových zařízení', 82, 310)

// Feature pills
const pills = [
  { text: 'Správa zakázek', color: '#2563EB', textColor: '#60A5FA', x: 82 },
  { text: 'Evidence zařízení', color: '#10B981', textColor: '#34D399', x: 310 },
  { text: 'Revizní zprávy', color: '#F59E0B', textColor: '#FBBF24', x: 538 },
  { text: 'Hlídání termínů', color: '#EF4444', textColor: '#F87171', x: 752 },
]
pills.forEach(pill => {
  ctx.fillStyle = pill.color + '26'
  roundRect(ctx, pill.x, 370, 200, 44, 22)
  ctx.fill()
  ctx.fillStyle = pill.textColor
  ctx.font = '500 18px "Segoe UI", system-ui, sans-serif'
  ctx.fillText(pill.text, pill.x + 20, 399)
})

// Bottom info
ctx.fillStyle = '#475569'
ctx.font = '400 20px "Segoe UI", system-ui, sans-serif'
ctx.fillText('Demo aplikace pro revizní techniky plynových zařízení v ČR', 82, 530)
ctx.fillStyle = '#64748B'
ctx.font = '400 16px "Segoe UI", system-ui, sans-serif'
ctx.fillText('NV č. 191/2022 Sb.  •  Česky  •  Mobilní i desktopová verze', 82, 565)

// Save
writeFileSync('public/og-image.png', canvas.toBuffer('image/png'))
console.log('OG image generated: public/og-image.png (1200x630)')

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
