// Generates the Medical Clearance Request Form as a real PDF using pdf-lib.
// Pure JS, no headless Chrome - replaces a puppeteer/@sparticuz/chromium chain
// that was 500'ing on Vercel functions. Layout mirrors the HTML print page
// at /portal/[token]/medical-clearance/print.

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 56
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

const STONE_900 = rgb(0.06, 0.06, 0.06)
const STONE_700 = rgb(0.24, 0.22, 0.21)
const STONE_500 = rgb(0.34, 0.32, 0.31)
const STONE_400 = rgb(0.66, 0.64, 0.62)
const STONE_300 = rgb(0.84, 0.82, 0.78)

interface Cursor {
  page: PDFPage
  y: number
  doc: PDFDocument
  regular: PDFFont
  bold: PDFFont
}

function newPage(cur: Cursor): void {
  cur.page = cur.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  cur.y = PAGE_HEIGHT - MARGIN
}

function ensureSpace(cur: Cursor, needed: number): void {
  if (cur.y - needed < MARGIN) newPage(cur)
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      line = test
    } else {
      if (line) lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawParagraph(
  cur: Cursor,
  text: string,
  opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; lineGap?: number; indent?: number } = {},
): void {
  const size = opts.size ?? 10
  const font = opts.font ?? cur.regular
  const color = opts.color ?? STONE_700
  const lineGap = opts.lineGap ?? 3
  const indent = opts.indent ?? 0
  const lineHeight = size + lineGap
  const lines = wrap(text, font, size, CONTENT_WIDTH - indent)
  for (const line of lines) {
    ensureSpace(cur, lineHeight)
    cur.page.drawText(line, { x: MARGIN + indent, y: cur.y - size, size, font, color })
    cur.y -= lineHeight
  }
}

function drawHeading(cur: Cursor, text: string, size = 12): void {
  ensureSpace(cur, size + 10)
  cur.y -= 4
  cur.page.drawText(text, { x: MARGIN, y: cur.y - size, size, font: cur.bold, color: STONE_900 })
  cur.y -= size + 6
}

function drawLineField(cur: Cursor, label: string, value = ''): void {
  ensureSpace(cur, 28)
  cur.page.drawText(label.toUpperCase(), {
    x: MARGIN, y: cur.y - 8, size: 7, font: cur.bold, color: STONE_500,
  })
  cur.y -= 12
  if (value) {
    cur.page.drawText(value, { x: MARGIN, y: cur.y - 10, size: 10, font: cur.regular, color: STONE_900 })
  }
  cur.page.drawLine({
    start: { x: MARGIN, y: cur.y - 14 },
    end: { x: MARGIN + CONTENT_WIDTH, y: cur.y - 14 },
    thickness: 0.5,
    color: STONE_300,
  })
  cur.y -= 22
}

function drawBlankLine(cur: Cursor, height = 22): void {
  ensureSpace(cur, height)
  cur.page.drawLine({
    start: { x: MARGIN, y: cur.y - height + 4 },
    end: { x: MARGIN + CONTENT_WIDTH, y: cur.y - height + 4 },
    thickness: 0.5,
    color: STONE_300,
  })
  cur.y -= height
}

function drawTwoColLineFields(cur: Cursor, leftLabel: string, rightLabel: string): void {
  ensureSpace(cur, 30)
  const colWidth = (CONTENT_WIDTH - 20) / 2
  cur.page.drawText(leftLabel.toUpperCase(), {
    x: MARGIN, y: cur.y - 8, size: 7, font: cur.bold, color: STONE_500,
  })
  cur.page.drawText(rightLabel.toUpperCase(), {
    x: MARGIN + colWidth + 20, y: cur.y - 8, size: 7, font: cur.bold, color: STONE_500,
  })
  cur.y -= 22
  cur.page.drawLine({
    start: { x: MARGIN, y: cur.y }, end: { x: MARGIN + colWidth, y: cur.y },
    thickness: 0.5, color: STONE_300,
  })
  cur.page.drawLine({
    start: { x: MARGIN + colWidth + 20, y: cur.y }, end: { x: MARGIN + CONTENT_WIDTH, y: cur.y },
    thickness: 0.5, color: STONE_300,
  })
  cur.y -= 10
}

function drawCheckboxRow(cur: Cursor, label: string): void {
  const size = 10
  const lineHeight = size + 4
  const indent = 16
  ensureSpace(cur, lineHeight + 4)
  cur.page.drawRectangle({
    x: MARGIN, y: cur.y - size + 1, width: 10, height: 10,
    borderColor: STONE_700, borderWidth: 0.7,
  })
  const lines = wrap(label, cur.regular, size, CONTENT_WIDTH - indent)
  for (let i = 0; i < lines.length; i++) {
    cur.page.drawText(lines[i], {
      x: MARGIN + indent, y: cur.y - size, size, font: cur.regular, color: STONE_700,
    })
    cur.y -= lineHeight
  }
  cur.y -= 2
}

function drawBullet(cur: Cursor, text: string): void {
  const size = 10
  const lineHeight = size + 3
  const indent = 14
  const lines = wrap(text, cur.regular, size, CONTENT_WIDTH - indent)
  ensureSpace(cur, lineHeight * lines.length)
  cur.page.drawText('•', { x: MARGIN + 2, y: cur.y - size, size, font: cur.regular, color: STONE_700 })
  for (const line of lines) {
    cur.page.drawText(line, { x: MARGIN + indent, y: cur.y - size, size, font: cur.regular, color: STONE_700 })
    cur.y -= lineHeight
  }
}

function spacer(cur: Cursor, h: number): void {
  cur.y -= h
}

export async function renderMedicalClearancePdf(opts: {
  clientName: string
  clientEmail: string | null
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const cur: Cursor = { page, y: PAGE_HEIGHT - MARGIN, doc, regular, bold }

  // ── Header ──────────────────────────────────────────────────────────
  cur.page.drawText('BODY RECODE™', {
    x: MARGIN, y: cur.y - 8, size: 8, font: bold, color: STONE_400,
  })
  cur.y -= 14
  cur.page.drawText('Medical Clearance Request Form', {
    x: MARGIN, y: cur.y - 18, size: 18, font: bold, color: STONE_900,
  })
  cur.y -= 22
  cur.page.drawText('Version 1.1', {
    x: MARGIN, y: cur.y - 10, size: 9, font: regular, color: STONE_500,
  })
  cur.y -= 24

  // ── 1. Purpose ──────────────────────────────────────────────────────
  drawHeading(cur, '1. Purpose')
  drawParagraph(cur,
    'This document requests confirmation that the individual named below is medically cleared to participate in supervised progressive resistance and conditioning training within Body Recode™ Performance Coaching.')
  spacer(cur, 4)
  drawParagraph(cur,
    'This form does not request diagnosis, treatment planning, or clinical interpretation. It requests confirmation of exercise participation eligibility only.')
  spacer(cur, 10)

  // ── 2. Client Details ───────────────────────────────────────────────
  drawHeading(cur, '2. Client Details')
  drawLineField(cur, 'Full Legal Name', opts.clientName)
  drawLineField(cur, 'Date of Birth')
  drawLineField(cur, 'Primary Contact Details', opts.clientEmail ?? '')
  spacer(cur, 4)

  // ── 3. Reason for Clearance Request ─────────────────────────────────
  drawHeading(cur, '3. Reason for Clearance Request')
  drawParagraph(cur,
    'Medical clearance has been requested due to the following self-declared condition or screening response:')
  spacer(cur, 4)
  drawBlankLine(cur)
  drawBlankLine(cur)
  drawBlankLine(cur)
  spacer(cur, 2)
  drawParagraph(cur, 'This request is precautionary and relates only to exercise participation eligibility.',
    { size: 8, color: STONE_500 })
  spacer(cur, 10)

  // ── 4. Nature of Training Exposure ──────────────────────────────────
  drawHeading(cur, '4. Nature of Training Exposure')
  drawParagraph(cur,
    'Body Recode™ Performance Coaching includes supervised progressive exercise exposure, which may involve:')
  spacer(cur, 4)
  drawBullet(cur, 'Progressive resistance training')
  drawBullet(cur, 'Moderate to high effort strength training')
  drawBullet(cur, 'Structured conditioning exposure')
  drawBullet(cur, 'Controlled increases in training load over time')
  drawBullet(cur, 'Gym-based sessions under supervision')
  spacer(cur, 4)
  drawParagraph(cur,
    'No medical treatment or rehabilitation services are provided. Training exposure is adjusted according to tolerance and any medical limitations specified below.')
  spacer(cur, 10)

  // ── 5. Medical Clearance Declaration (boxed) ────────────────────────
  ensureSpace(cur, 280)
  const sectionTop = cur.y
  spacer(cur, 10)
  drawHeading(cur, '5. Medical Clearance Declaration')
  cur.page.drawText('(Completed by Medical Practitioner)', {
    x: MARGIN + bold.widthOfTextAtSize('5. Medical Clearance Declaration ', 12),
    y: cur.y + 12, size: 9, font: regular, color: STONE_500,
  })
  drawParagraph(cur,
    'I confirm that I am a qualified medical practitioner authorised to provide exercise participation clearance.')
  spacer(cur, 6)
  drawLineField(cur, 'Medical Practitioner Name')
  drawLineField(cur, 'Provider Number')
  drawLineField(cur, 'Practice Name')
  drawLineField(cur, 'Contact Details')
  spacer(cur, 6)
  cur.page.drawText('PARTICIPATION STATUS (SELECT ONE)', {
    x: MARGIN, y: cur.y - 8, size: 7, font: bold, color: STONE_500,
  })
  cur.y -= 16
  drawCheckboxRow(cur, 'Cleared for participation without restriction')
  drawCheckboxRow(cur, 'Cleared for participation with the following limitations or precautions:')
  cur.y -= 2
  // indented blanks for limitations
  const limIndent = 30
  for (let i = 0; i < 2; i++) {
    cur.page.drawLine({
      start: { x: MARGIN + limIndent, y: cur.y - 16 },
      end: { x: MARGIN + CONTENT_WIDTH, y: cur.y - 16 },
      thickness: 0.5, color: STONE_300,
    })
    cur.y -= 22
  }
  drawCheckboxRow(cur, 'Not cleared for progressive exercise participation at this time')
  // Outer border for section 5
  const sectionBottom = cur.y - 6
  cur.page.drawRectangle({
    x: MARGIN - 10, y: sectionBottom, width: CONTENT_WIDTH + 20, height: sectionTop - sectionBottom,
    borderColor: STONE_300, borderWidth: 0.7,
  })
  cur.y = sectionBottom - 14

  // ── 6. Scope Acknowledgement ────────────────────────────────────────
  drawHeading(cur, '6. Scope Acknowledgement')
  drawParagraph(cur,
    'This declaration confirms medical permission for participation only. It does not transfer clinical responsibility to Body Recode™. Body Recode™ will operate within any limitations specified above and within its professional scope of practice.')
  spacer(cur, 10)

  // ── 7. Validity (two columns) ───────────────────────────────────────
  drawHeading(cur, '7. Validity')
  drawTwoColLineFields(cur, 'Effective Date', 'Review / Expiry Date')
  spacer(cur, 10)

  // ── 8. Practitioner Declaration ─────────────────────────────────────
  drawHeading(cur, '8. Practitioner Declaration')
  drawParagraph(cur,
    'I confirm that the above clearance reflects my professional opinion regarding exercise participation suitability at this time.')
  spacer(cur, 8)
  drawTwoColLineFields(cur, 'Signature', 'Date')
  spacer(cur, 20)

  // ── Footer (on the last page) ───────────────────────────────────────
  ensureSpace(cur, 30)
  cur.page.drawLine({
    start: { x: MARGIN, y: cur.y }, end: { x: MARGIN + CONTENT_WIDTH, y: cur.y },
    thickness: 0.5, color: STONE_300,
  })
  cur.y -= 12
  cur.page.drawText(
    'Body Recode™  |  Kade Dunstone  |  ABN 90 535 525 708  |  Anytime Fitness Newstead, Brisbane',
    { x: MARGIN, y: cur.y - 8, size: 7.5, font: regular, color: STONE_400 },
  )

  return await doc.save()
}
