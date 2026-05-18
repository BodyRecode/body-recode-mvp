// Generates the Medical Clearance Request Form as a real PDF using pdf-lib.
// Pure JS, no headless Chrome - replaces a puppeteer/@sparticuz/chromium chain
// that was 500'ing on Vercel functions.

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN_X = 56
const MARGIN_Y = 56
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2

const INK_900 = rgb(0.04, 0.04, 0.04)
const INK_700 = rgb(0.18, 0.17, 0.16)
const INK_500 = rgb(0.38, 0.36, 0.34)
const INK_400 = rgb(0.55, 0.52, 0.49)
const INK_300 = rgb(0.78, 0.76, 0.73)
const INK_100 = rgb(0.95, 0.94, 0.92)
const TEAL = rgb(0.08, 0.72, 0.65)
const TEAL_SOFT = rgb(0.93, 0.98, 0.97)

interface Cursor {
  page: PDFPage
  y: number
  doc: PDFDocument
  regular: PDFFont
  bold: PDFFont
  logo: PDFImage
}

function newPage(cur: Cursor): void {
  cur.page = cur.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  cur.y = PAGE_HEIGHT - MARGIN_Y
  drawPageFooter(cur)
}

function drawPageFooter(cur: Cursor): void {
  const footerY = MARGIN_Y - 18
  cur.page.drawLine({
    start: { x: MARGIN_X, y: footerY + 14 },
    end: { x: MARGIN_X + CONTENT_WIDTH, y: footerY + 14 },
    thickness: 0.4, color: INK_300,
  })
  cur.page.drawText('Body Recode™', {
    x: MARGIN_X, y: footerY, size: 7, font: cur.bold, color: INK_500,
  })
  const rightText = 'ABN 90 535 525 708  ·  Anytime Fitness Newstead, Brisbane'
  const w = cur.regular.widthOfTextAtSize(rightText, 7)
  cur.page.drawText(rightText, {
    x: MARGIN_X + CONTENT_WIDTH - w, y: footerY, size: 7, font: cur.regular, color: INK_400,
  })
}

function ensureSpace(cur: Cursor, needed: number): void {
  if (cur.y - needed < MARGIN_Y + 24) newPage(cur)
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
  opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; lineGap?: number; indent?: number; xOffset?: number; width?: number } = {},
): void {
  const size = opts.size ?? 9.5
  const font = opts.font ?? cur.regular
  const color = opts.color ?? INK_700
  const lineGap = opts.lineGap ?? 4
  const indent = opts.indent ?? 0
  const xOffset = opts.xOffset ?? 0
  const width = opts.width ?? CONTENT_WIDTH - indent - xOffset
  const lineHeight = size + lineGap
  const lines = wrap(text, font, size, width)
  for (const line of lines) {
    ensureSpace(cur, lineHeight)
    cur.page.drawText(line, { x: MARGIN_X + indent + xOffset, y: cur.y - size, size, font, color })
    cur.y -= lineHeight
  }
}

function drawSectionHeader(cur: Cursor, num: string, title: string, subtitle?: string): void {
  ensureSpace(cur, 36)
  const badgeSize = 18
  const badgeY = cur.y - badgeSize
  // Teal-filled number badge
  cur.page.drawRectangle({
    x: MARGIN_X, y: badgeY, width: badgeSize, height: badgeSize, color: TEAL,
  })
  const numWidth = cur.bold.widthOfTextAtSize(num, 9)
  cur.page.drawText(num, {
    x: MARGIN_X + (badgeSize - numWidth) / 2,
    y: badgeY + 5.5,
    size: 9, font: cur.bold, color: rgb(1, 1, 1),
  })
  // Title
  cur.page.drawText(title, {
    x: MARGIN_X + badgeSize + 10,
    y: badgeY + 5,
    size: 13, font: cur.bold, color: INK_900,
  })
  if (subtitle) {
    const titleWidth = cur.bold.widthOfTextAtSize(title, 13)
    cur.page.drawText(subtitle, {
      x: MARGIN_X + badgeSize + 10 + titleWidth + 8,
      y: badgeY + 6,
      size: 8.5, font: cur.regular, color: INK_500,
    })
  }
  cur.y -= badgeSize + 8
  // Thin teal rule under the section header
  cur.page.drawLine({
    start: { x: MARGIN_X, y: cur.y + 4 },
    end: { x: MARGIN_X + CONTENT_WIDTH, y: cur.y + 4 },
    thickness: 0.4, color: INK_300,
  })
  cur.y -= 6
}

function drawLineField(cur: Cursor, label: string, value = '', opts: { x?: number; width?: number } = {}): void {
  const x = opts.x ?? MARGIN_X
  const width = opts.width ?? CONTENT_WIDTH
  ensureSpace(cur, 30)
  cur.page.drawText(label.toUpperCase(), {
    x, y: cur.y - 7, size: 6.5, font: cur.bold, color: INK_500,
  })
  cur.y -= 11
  if (value) {
    cur.page.drawText(value, { x, y: cur.y - 10, size: 10, font: cur.regular, color: INK_900 })
  }
  cur.page.drawLine({
    start: { x, y: cur.y - 14 },
    end: { x: x + width, y: cur.y - 14 },
    thickness: 0.5, color: INK_300,
  })
  cur.y -= 22
}

function drawTwoColFields(cur: Cursor, leftLabel: string, rightLabel: string, leftValue = '', rightValue = ''): void {
  ensureSpace(cur, 30)
  const colWidth = (CONTENT_WIDTH - 24) / 2
  const yStart = cur.y
  drawLineField(cur, leftLabel, leftValue, { x: MARGIN_X, width: colWidth })
  const yLeft = cur.y
  cur.y = yStart
  drawLineField(cur, rightLabel, rightValue, { x: MARGIN_X + colWidth + 24, width: colWidth })
  cur.y = Math.min(yLeft, cur.y)
}

function drawBlankLine(cur: Cursor, height = 22, opts: { x?: number; width?: number } = {}): void {
  const x = opts.x ?? MARGIN_X
  const width = opts.width ?? CONTENT_WIDTH
  ensureSpace(cur, height)
  cur.page.drawLine({
    start: { x, y: cur.y - height + 4 },
    end: { x: x + width, y: cur.y - height + 4 },
    thickness: 0.5, color: INK_300,
  })
  cur.y -= height
}

function drawCheckboxRow(cur: Cursor, label: string, indent = 0): void {
  const size = 9.5
  const lineHeight = size + 4
  const boxIndent = indent
  const textIndent = indent + 18
  ensureSpace(cur, lineHeight + 4)
  cur.page.drawRectangle({
    x: MARGIN_X + boxIndent, y: cur.y - size + 1, width: 11, height: 11,
    borderColor: INK_700, borderWidth: 0.8, color: rgb(1, 1, 1),
  })
  const lines = wrap(label, cur.regular, size, CONTENT_WIDTH - textIndent)
  for (const line of lines) {
    cur.page.drawText(line, {
      x: MARGIN_X + textIndent, y: cur.y - size, size, font: cur.regular, color: INK_700,
    })
    cur.y -= lineHeight
  }
  cur.y -= 3
}

function drawBullet(cur: Cursor, text: string): void {
  const size = 9.5
  const lineHeight = size + 3
  const indent = 16
  const lines = wrap(text, cur.regular, size, CONTENT_WIDTH - indent)
  ensureSpace(cur, lineHeight * lines.length)
  // Teal dot
  cur.page.drawCircle({
    x: MARGIN_X + 5, y: cur.y - size + 4, size: 1.6, color: TEAL,
  })
  for (let i = 0; i < lines.length; i++) {
    cur.page.drawText(lines[i], {
      x: MARGIN_X + indent, y: cur.y - size, size, font: cur.regular, color: INK_700,
    })
    cur.y -= lineHeight
  }
}

function spacer(cur: Cursor, h: number): void {
  cur.y -= h
}

async function loadLogo(doc: PDFDocument): Promise<PDFImage> {
  const filePath = path.join(process.cwd(), 'public', 'logo-black.png')
  const bytes = await readFile(filePath)
  return await doc.embedPng(bytes)
}

export async function renderMedicalClearancePdf(opts: {
  clientName: string
  clientEmail: string | null
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle('Body Recode Medical Clearance Request Form')
  doc.setAuthor('Body Recode')
  doc.setSubject('Medical Clearance Request Form')
  doc.setCreator('Body Recode Performance Coaching')

  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const logo = await loadLogo(doc)
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const cur: Cursor = { page, y: PAGE_HEIGHT - MARGIN_Y, doc, regular, bold, logo }
  drawPageFooter(cur)

  // ── Header band ─────────────────────────────────────────────────────
  const logoTargetWidth = 110
  const logoAspect = logo.width / logo.height
  const logoHeight = logoTargetWidth / logoAspect
  cur.page.drawImage(logo, {
    x: MARGIN_X,
    y: cur.y - logoHeight,
    width: logoTargetWidth,
    height: logoHeight,
  })
  // Right-aligned eyebrow
  const eyebrow = 'MEDICAL CLEARANCE REQUEST'
  const ebWidth = bold.widthOfTextAtSize(eyebrow, 8)
  cur.page.drawText(eyebrow, {
    x: MARGIN_X + CONTENT_WIDTH - ebWidth,
    y: cur.y - 8,
    size: 8, font: bold, color: TEAL,
  })
  const versionLabel = 'Version 1.1  ·  A4'
  const vWidth = regular.widthOfTextAtSize(versionLabel, 8)
  cur.page.drawText(versionLabel, {
    x: MARGIN_X + CONTENT_WIDTH - vWidth,
    y: cur.y - 22,
    size: 8, font: regular, color: INK_400,
  })
  cur.y -= Math.max(logoHeight, 28) + 16
  // Title
  cur.page.drawText('Request for Exercise Participation Clearance', {
    x: MARGIN_X, y: cur.y - 18, size: 18, font: bold, color: INK_900,
  })
  cur.y -= 22
  drawParagraph(cur,
    `Prepared for ${opts.clientName || 'the client named below'}. This form requests written confirmation from the client\'s medical practitioner that they are cleared to participate in supervised progressive exercise.`,
    { size: 9, color: INK_500 })
  spacer(cur, 6)
  // Double divider rule for header break
  cur.page.drawLine({
    start: { x: MARGIN_X, y: cur.y }, end: { x: MARGIN_X + CONTENT_WIDTH, y: cur.y },
    thickness: 1.2, color: INK_900,
  })
  cur.page.drawLine({
    start: { x: MARGIN_X, y: cur.y - 3 }, end: { x: MARGIN_X + 60, y: cur.y - 3 },
    thickness: 1.2, color: TEAL,
  })
  cur.y -= 18

  // ── 01 Purpose ──────────────────────────────────────────────────────
  drawSectionHeader(cur, '01', 'Purpose')
  drawParagraph(cur,
    'This document requests confirmation that the individual named below is medically cleared to participate in supervised progressive resistance and conditioning training within Body Recode™ Performance Coaching.')
  spacer(cur, 4)
  drawParagraph(cur,
    'This form does not request diagnosis, treatment planning, or clinical interpretation. It requests confirmation of exercise participation eligibility only.')
  spacer(cur, 14)

  // ── 02 Client Details ───────────────────────────────────────────────
  drawSectionHeader(cur, '02', 'Client Details')
  drawLineField(cur, 'Full Legal Name', opts.clientName)
  drawTwoColFields(cur, 'Date of Birth', 'Primary Contact Details', '', opts.clientEmail ?? '')
  spacer(cur, 8)

  // ── 03 Reason for Clearance Request ─────────────────────────────────
  drawSectionHeader(cur, '03', 'Reason for Clearance Request')
  drawParagraph(cur,
    'Medical clearance has been requested due to the following self-declared condition or screening response:')
  spacer(cur, 6)
  drawBlankLine(cur)
  drawBlankLine(cur)
  drawBlankLine(cur)
  spacer(cur, 2)
  drawParagraph(cur, 'This request is precautionary and relates only to exercise participation eligibility.',
    { size: 8, color: INK_500 })
  spacer(cur, 14)

  // ── 04 Nature of Training Exposure ──────────────────────────────────
  drawSectionHeader(cur, '04', 'Nature of Training Exposure')
  drawParagraph(cur,
    'Body Recode™ Performance Coaching includes supervised progressive exercise exposure, which may involve:')
  spacer(cur, 6)
  drawBullet(cur, 'Progressive resistance training')
  drawBullet(cur, 'Moderate to high effort strength training')
  drawBullet(cur, 'Structured conditioning exposure')
  drawBullet(cur, 'Controlled increases in training load over time')
  drawBullet(cur, 'Gym-based sessions under supervision')
  spacer(cur, 6)
  drawParagraph(cur,
    'No medical treatment or rehabilitation services are provided. Training exposure is adjusted according to tolerance and any medical limitations specified below.')
  spacer(cur, 14)

  // ── 05 Medical Clearance Declaration (the form, highlighted) ────────
  ensureSpace(cur, 320)
  const declTop = cur.y + 6
  // Soft teal background panel
  // We don't know exact bottom until we draw, so estimate, then redraw rectangle later if needed.
  // Simpler: reserve space and draw the rectangle now from top down.
  const declPadding = 14
  // Draw header first to measure remaining content
  spacer(cur, declPadding)
  drawSectionHeader(cur, '05', 'Medical Clearance Declaration', '(Completed by Medical Practitioner)')
  drawParagraph(cur,
    'I confirm that I am a qualified medical practitioner authorised to provide exercise participation clearance.')
  spacer(cur, 8)
  drawTwoColFields(cur, 'Medical Practitioner Name', 'Provider Number')
  drawTwoColFields(cur, 'Practice Name', 'Contact Details')
  spacer(cur, 8)
  cur.page.drawText('PARTICIPATION STATUS  ·  SELECT ONE', {
    x: MARGIN_X, y: cur.y - 7, size: 6.5, font: bold, color: INK_500,
  })
  cur.y -= 14
  drawCheckboxRow(cur, 'Cleared for participation without restriction')
  drawCheckboxRow(cur, 'Cleared for participation with the following limitations or precautions:')
  // Indented blanks for limitations
  const limIndent = 30
  for (let i = 0; i < 2; i++) {
    drawBlankLine(cur, 20, { x: MARGIN_X + limIndent, width: CONTENT_WIDTH - limIndent })
  }
  spacer(cur, 2)
  drawCheckboxRow(cur, 'Not cleared for progressive exercise participation at this time')
  const declBottom = cur.y - declPadding + 4
  // Draw the soft panel BEHIND the content. Since pdf-lib draws in order, we need a different approach:
  // Re-draw a transparent rectangle on top is no good. Instead, we draw the panel as a stroked frame
  // (visible underline + side accents) without filling — that way order doesn't matter.
  cur.page.drawRectangle({
    x: MARGIN_X - declPadding,
    y: declBottom,
    width: CONTENT_WIDTH + declPadding * 2,
    height: declTop - declBottom,
    borderColor: INK_300,
    borderWidth: 0.6,
  })
  // Teal accent bar on the left edge of the panel
  cur.page.drawRectangle({
    x: MARGIN_X - declPadding,
    y: declBottom,
    width: 3,
    height: declTop - declBottom,
    color: TEAL,
  })
  cur.y = declBottom - 18

  // ── 06 Scope Acknowledgement ────────────────────────────────────────
  drawSectionHeader(cur, '06', 'Scope Acknowledgement')
  drawParagraph(cur,
    'This declaration confirms medical permission for participation only. It does not transfer clinical responsibility to Body Recode™. Body Recode™ will operate within any limitations specified above and within its professional scope of practice.')
  spacer(cur, 14)

  // ── 07 Validity ─────────────────────────────────────────────────────
  drawSectionHeader(cur, '07', 'Validity')
  drawTwoColFields(cur, 'Effective Date', 'Review / Expiry Date')
  spacer(cur, 14)

  // ── 08 Practitioner Declaration ─────────────────────────────────────
  drawSectionHeader(cur, '08', 'Practitioner Declaration')
  drawParagraph(cur,
    'I confirm that the above clearance reflects my professional opinion regarding exercise participation suitability at this time.')
  spacer(cur, 14)
  // Signature field — taller line on the left, date on the right
  ensureSpace(cur, 60)
  const sigStartY = cur.y
  const colW = (CONTENT_WIDTH - 24) / 2
  cur.page.drawText('SIGNATURE', {
    x: MARGIN_X, y: cur.y - 7, size: 6.5, font: bold, color: INK_500,
  })
  cur.page.drawText('DATE', {
    x: MARGIN_X + colW + 24, y: cur.y - 7, size: 6.5, font: bold, color: INK_500,
  })
  cur.y -= 36
  cur.page.drawLine({
    start: { x: MARGIN_X, y: cur.y }, end: { x: MARGIN_X + colW, y: cur.y },
    thickness: 0.5, color: INK_300,
  })
  cur.page.drawLine({
    start: { x: MARGIN_X + colW + 24, y: cur.y }, end: { x: MARGIN_X + CONTENT_WIDTH, y: cur.y },
    thickness: 0.5, color: INK_300,
  })
  // Practitioner stamp area indicator
  cur.page.drawText('Practitioner stamp (if applicable)', {
    x: MARGIN_X, y: cur.y - 12, size: 7, font: regular, color: INK_400,
  })
  cur.y = Math.min(sigStartY - 50, cur.y) - 4

  return await doc.save()
}
