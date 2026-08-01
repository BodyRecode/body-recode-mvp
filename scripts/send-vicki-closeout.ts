/**
 * One-off: send Kade the close-out email for Vicki S to approve, with her
 * Foundational Reading attached as a PDF.
 *
 * Goes to Kade, not to Vicki. Her address is suppressed and her access is
 * revoked; he forwards it himself once he is happy.
 *
 *   npm run send:vicki-closeout
 */
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const CLIENT_ID = 'e1f414f2-e68c-4b1d-82c8-c736d73756e7'
const APPROVE_TO = 'kade@bodyrecode.au'

const SECTIONS: [string, string][] = [
  ['cr_where_you_are', 'Where you are right now'],
  ['cr_what_your_body_is_telling_us', 'What your body is telling us'],
  ['cr_what_were_focusing_on_first', 'What we are focusing on first'],
  ['cr_what_were_not_doing_yet', 'What we are not doing yet'],
  ['cr_coach_note', 'A note from your coach'],
]

// Body Recode palette, matching email-shell.ts and the design language.
const INK = rgb(0.102, 0.102, 0.102)      // Graphite #1A1A1A
const BLUE = rgb(0.106, 0.427, 0.988)     // Signal Blue #1B6DFC
const MUTED = rgb(0.42, 0.42, 0.42)
const RULE = rgb(0.90, 0.90, 0.90)

async function buildPdf(name: string, generatedAt: string, sections: Record<string, string | null>) {
  const pdf = await PDFDocument.create()
  const body = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const logoBytes = await readFile(path.join(process.cwd(), 'public', 'logo-black.png'))
  const logo = await pdf.embedPng(logoBytes)

  const W = 595.28, H = 841.89, M = 62
  const COL = W - M * 2
  let page = pdf.addPage([W, H])
  let y = H - M
  let pageNo = 1

  const footer = (pg: typeof page, n: number) => {
    pg.drawText('Body Recode', { x: M, y: 38, size: 8, font: bold, color: MUTED })
    pg.drawText(`${name}  ·  Foundational Reading  ·  ${n}`, {
      x: W - M - body.widthOfTextAtSize(`${name}  ·  Foundational Reading  ·  ${n}`, 8),
      y: 38, size: 8, font: body, color: MUTED,
    })
  }

  const newPage = () => {
    footer(page, pageNo)
    page = pdf.addPage([W, H])
    pageNo += 1
    y = H - M
  }

  const wrap = (text: string, font: typeof body, size: number) => {
    const out: string[] = []
    for (const para of text.split(/\n+/)) {
      let line = ''
      for (const word of para.split(/\s+/)) {
        const test = line ? `${line} ${word}` : word
        if (font.widthOfTextAtSize(test, size) > COL) { if (line) out.push(line); line = word }
        else line = test
      }
      if (line) out.push(line)
      out.push('')
    }
    return out
  }

  const draw = (text: string, font: typeof body, size: number, colour = INK, lead = 5) => {
    for (const line of wrap(text, font, size)) {
      if (y < 78) newPage()
      if (line) page.drawText(line, { x: M, y, size, font, color: colour })
      y -= size + lead
    }
  }

  // Masthead
  const logoW = 120
  const logoH = (logo.height / logo.width) * logoW
  y -= logoH
  page.drawImage(logo, { x: M, y, width: logoW, height: logoH })
  y -= 34

  page.drawText('FOUNDATIONAL READING', { x: M, y, size: 9, font: bold, color: BLUE })
  y -= 22
  page.drawText(name, { x: M, y, size: 26, font: bold, color: INK })
  y -= 14

  // 48x3 Signal Blue rule, same as the email divider.
  page.drawRectangle({ x: M, y: y - 4, width: 48, height: 3, color: BLUE })
  y -= 22

  page.drawText(
    new Date(generatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }),
    { x: M, y, size: 9.5, font: body, color: MUTED })
  y -= 34

  for (const [key, heading] of SECTIONS) {
    const text = sections[key]
    if (!text?.trim()) continue
    if (y < 190) newPage()
    page.drawRectangle({ x: M, y: y + 2, width: 3, height: 12, color: BLUE })
    page.drawText(heading, { x: M + 12, y: y + 2, size: 12.5, font: bold, color: INK })
    y -= 24
    draw(text.trim(), body, 10.5, INK, 5.5)
    y -= 10
    if (y > 90) {
      page.drawLine({ start: { x: M, y: y + 6 }, end: { x: W - M, y: y + 6 }, thickness: 0.6, color: RULE })
      y -= 16
    }
  }

  footer(page, pageNo)
  return Buffer.from(await pdf.save())
}

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: client } = await db.from('clients').select('name, email').eq('id', CLIENT_ID).single()
  const { data: cffs } = await db.from('cffs')
    .select(`${SECTIONS.map(s => s[0]).join(', ')}, client_reading_generated_at`)
    .eq('client_id', CLIENT_ID).eq('is_archived', false).single()

  const sections = cffs as unknown as Record<string, string | null>
  const pdf = await buildPdf(client!.name!, String(sections.client_reading_generated_at), sections)
  console.log(`PDF built: ${(pdf.length / 1024).toFixed(1)} KB`)

  const message = [
    "That's all sorted. Your portal access has been removed and you won't hear from the system again.",
    "I've attached your Foundational Reading so you have it.",
    'Thanks for the work you put into that intake. It was genuinely thorough.',
    'All the best for the walk in October.',
  ]

  const { darkEmailShell, emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody } =
    await import('../src/lib/email-shell')

  const inner = [
    emailLogo(130),
    emailEyebrow('Coaching'),
    emailHeading('Your access has been closed', { size: 26 }),
    emailDivider(),
    emailBody('Vicki,'),
    ...message.map(p => emailBody(p)),
    emailBody('Kade'),
  ].join('\n')

  const html = darkEmailShell(inner, {
    previewText: 'Your portal access has been removed. Your Foundational Reading is attached.',
  })

  const resend = new Resend(process.env.RESEND_API_KEY!)
  const sent = await resend.emails.send({
    from: 'Kade Dunstone <kade@send.bodyrecode.au>',
    to: APPROVE_TO,
    subject: 'APPROVE BEFORE SENDING — close-out email for Vicki S',
    html: `<div style="padding:16px;background:#FFF8E1;border-bottom:2px solid #F0C040;font-family:sans-serif;font-size:13px;color:#5A4500;">
      <strong>Not sent to Vicki.</strong> This is the draft for your approval, with her Foundational Reading attached.
      Her address (${client!.email}) is suppressed and her access is revoked. Forward this yourself when you are happy with it.
    </div>${html}`,
    attachments: [{ filename: 'Vicki_S_Foundational_Reading.pdf', content: pdf.toString('base64') }],
  })

  if (sent.error) { console.error('SEND FAILED:', sent.error); process.exit(1) }
  console.log(`Sent to ${APPROVE_TO} (id ${sent.data?.id})`)
}

main().catch(e => { console.error(e); process.exit(1) })
