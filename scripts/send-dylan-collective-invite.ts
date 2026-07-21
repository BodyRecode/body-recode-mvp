/**
 * One-off: book Dylan Shields' Collective call.
 * Mirrors the app booking flow (src/lib/zoom.ts + src/app/api/bookings/route.ts):
 *   1. Mint a real Zoom meeting via Zoom S2S OAuth.
 *   2. Email Dylan the branded Collective confirmation from kade@send.bodyrecode.au,
 *      with Kade's real "Body Recode Collective" Apple Mail signature appended.
 *   3. Email Kade a booking confirmation + .ics so it lands in his diary.
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── load .env.local ───────────────────────────────────────────────
const env: Record<string, string> = {}
for (const line of readFileSync(resolve(__dirname, '../.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const TO = 'shieldssuccess@gmail.com'
const FROM = 'Kade at Body Recode <kade@send.bodyrecode.au>'
const KADE = 'kade@bodyrecode.au'
const START_ISO = '2026-07-24T12:00:00+10:00' // Fri 24 Jul, 12:00pm Brisbane
const DURATION = 45
const TOPIC = 'Body Recode — The Collective — Dylan Shields'

// ── 1. Zoom meeting ───────────────────────────────────────────────
async function createZoomMeeting(): Promise<string> {
  const creds = Buffer.from(`${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`).toString('base64')
  const tokRes = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${env.ZOOM_ACCOUNT_ID}`,
    { method: 'POST', headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' } },
  )
  if (!tokRes.ok) throw new Error(`Zoom token failed: ${await tokRes.text()}`)
  const { access_token } = await tokRes.json()

  const mRes = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: TOPIC,
      type: 2,
      start_time: START_ISO,
      duration: DURATION,
      timezone: 'Australia/Brisbane',
      settings: { join_before_host: true, waiting_room: false },
    }),
  })
  if (!mRes.ok) throw new Error(`Zoom meeting failed: ${await mRes.text()}`)
  const data = await mRes.json()
  return data.join_url as string
}

// ── Kade's real Collective signature (read from Apple Mail file) ───
function signatureHtml(): string {
  const raw = readFileSync(
    '/Users/kadedunstone/Library/Mail/V10/MailData/Signatures/D076AA28-92A1-489E-8603-6025C2D9A3E0.mailsignature',
    'utf8',
  )
  const body = raw.split(/\n\r?\n/).slice(1).join('\n\n') // drop mail headers
  return body.replace(/^<body>/i, '').replace(/<\/body>\s*$/i, '') // unwrap <body>
}

// ── 2. Branded email HTML (Option 2 — charcoal header band) ───────
function emailHtml(zoomUrl: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><meta name="x-apple-disable-message-reformatting"/><meta name="color-scheme" content="light only"/><meta name="supported-color-schemes" content="light"/><title>The Collective</title></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;color:#1A1A1A;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#FFFFFF;opacity:0;">Friday 24 July, 12pm. Confirmed — plus one 5-minute thing before we talk.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;margin:0;padding:0;"><tr><td align="center" style="padding:0;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;width:100%;max-width:600px;">
<tr><td bgcolor="#2C2418" style="background-color:#2C2418;padding:30px 32px 26px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<p style="margin:0;font-size:10px;font-weight:800;letter-spacing:0.28em;color:#C9B79A;text-transform:uppercase;">Body Recode</p>
<p style="margin:3px 0 0;font-size:27px;font-weight:800;letter-spacing:-0.015em;color:#FFFFFF;">The Collective</p>
</td></tr>
<tr><td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:38px 32px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1A1A1A;">
<p style="margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:0.14em;color:#2C2418;text-transform:uppercase;">Your call is confirmed</p>
<h1 style="margin:0 0 18px;font-size:26px;font-weight:800;color:#1A1A1A;letter-spacing:-0.02em;line-height:1.25;">Locked in, Dylan.</h1>
<div style="width:40px;height:2px;background:#2C2418;margin:0 0 22px;"></div>
<p style="margin:0 0 16px;font-size:15px;color:#3A3A3A;line-height:1.75;">Great catching up just now, mate. I've set us up for a proper sit-down about Shields Success and where The Collective could take it. No pitch &mdash; just want to show you what it'd actually look like for your business.</p>
<div style="background:#F3EFE9;border:1px solid #D9D2C4;border-radius:14px;padding:20px 22px;margin:16px 0 24px;">
<p style="margin:0 0 12px;font-size:10px;font-weight:800;letter-spacing:0.16em;color:#2C2418;text-transform:uppercase;">When</p>
<p style="margin:0 0 4px;font-size:17px;font-weight:800;color:#1A1A1A;letter-spacing:-0.01em;">Friday 24 July &middot; 12:00pm</p>
<p style="margin:0 0 16px;font-size:13px;color:#6B6B6B;">Brisbane time &middot; Zoom &middot; around 45 minutes</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td><a href="${zoomUrl}" style="display:inline-block;background:#2C2418;color:#FFFFFF;font-weight:700;font-size:13px;padding:12px 20px;border-radius:9px;text-decoration:none;">Join Zoom &rarr;</a></td></tr></table>
</div>
<p style="margin:0 0 16px;font-size:15px;color:#3A3A3A;line-height:1.75;">Before we jump on, do me a favour and run through this short fit scorecard &mdash; about 5 minutes. It reads where Shields Success sits right now, so we walk into Friday already knowing the shape of it instead of starting cold.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 12px;"><tr><td><a href="https://bodyrecode.au/collective" style="display:inline-block;background:#1A1A1A;color:#FFFFFF;font-weight:700;font-size:14px;padding:14px 22px;border-radius:10px;text-decoration:none;">Complete your fit scorecard &rarr;</a></td></tr></table>
<p style="margin:14px 0 0;font-size:13px;color:#6B6B6B;line-height:1.7;">Any dramas with the time, just reply here and we'll shuffle it.</p>
<p style="margin:22px 0 0;font-size:15px;color:#3A3A3A;line-height:1.75;">Proud of what you've built, mate. Talk Friday.<br>&mdash; Kade</p>
${signatureHtml()}
</td></tr></table>
</td></tr></table>
</body></html>`
}

function ics(zoomUrl: string): string {
  const start = new Date(START_ISO)
  const end = new Date(start.getTime() + DURATION * 60000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Body Recode//Booking//EN', 'CALSCALE:GREGORIAN', 'METHOD:REQUEST',
    'BEGIN:VEVENT', `UID:dylan-collective-${fmt(start)}@bodyrecode.au`, `DTSTAMP:${fmt(new Date(START_ISO))}`,
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`, `SUMMARY:${TOPIC}`, `LOCATION:${zoomUrl}`,
    `DESCRIPTION:Join Zoom: ${zoomUrl}`, 'STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
}

async function resendSend(payload: Record<string, unknown>) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const txt = await res.text()
  if (!res.ok) throw new Error(`Resend failed (${res.status}): ${txt}`)
  return txt
}

async function main() {
  console.log('Minting Zoom meeting…')
  const zoomUrl = await createZoomMeeting()
  console.log('Zoom link:', zoomUrl)

  console.log('Sending branded invite to Dylan…')
  const r1 = await resendSend({
    from: FROM,
    to: [TO],
    reply_to: KADE,
    subject: 'Locked in — Friday 12pm. One thing before we talk.',
    html: emailHtml(zoomUrl),
  })
  console.log('Dylan send:', r1)

  console.log('Sending diary copy + .ics to Kade…')
  const r2 = await resendSend({
    from: 'Body Recode <kade@send.bodyrecode.au>',
    to: [KADE],
    subject: 'Booking confirmed — Dylan Shields — Collective call (Fri 24 Jul 12pm)',
    html: `<div style="font-family:-apple-system,sans-serif;font-size:15px;color:#1A1A1A;">Dylan Shields is booked for <b>Friday 24 July, 12:00pm Brisbane</b>.<br><br>Zoom: <a href="${zoomUrl}">${zoomUrl}</a><br><br>Calendar invite attached.</div>`,
    attachments: [{ filename: 'dylan-collective-call.ics', content: Buffer.from(ics(zoomUrl)).toString('base64') }],
  })
  console.log('Kade diary send:', r2)
  console.log('\nDONE. Zoom:', zoomUrl)
}

main().catch((e) => { console.error('FAILED:', e); process.exit(1) })
