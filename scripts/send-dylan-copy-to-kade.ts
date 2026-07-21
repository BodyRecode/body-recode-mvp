/**
 * Verify: send Kade an exact copy of the BRANDED email Dylan received.
 * Does NOT create a new Zoom meeting (reuses the existing link) and does NOT
 * re-email Dylan. Identical emailHtml/signatureHtml to send-dylan-collective-invite.ts.
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env: Record<string, string> = {}
for (const line of readFileSync(resolve(__dirname, '../.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const ZOOM = 'https://us06web.zoom.us/j/82026411972?pwd=8YqiY3aRQTn74wquT0xbsXeo09ksjm.1'
const FROM = 'Kade at Body Recode <kade@send.bodyrecode.au>'
const KADE = 'kade@bodyrecode.au'

function signatureHtml(): string {
  const raw = readFileSync(
    '/Users/kadedunstone/Library/Mail/V10/MailData/Signatures/D076AA28-92A1-489E-8603-6025C2D9A3E0.mailsignature',
    'utf8',
  )
  const body = raw.split(/\n\r?\n/).slice(1).join('\n\n')
  return body.replace(/^<body>/i, '').replace(/<\/body>\s*$/i, '')
}

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

async function main() {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [KADE],
      reply_to: KADE, // identical to Dylan's send — replies route to kade@bodyrecode.au
      subject: '[COPY incl. Reply-To] What Dylan got — hit reply to test where it goes',
      html: emailHtml(ZOOM),
    }),
  })
  const txt = await res.text()
  if (!res.ok) throw new Error(`Resend failed (${res.status}): ${txt}`)
  console.log('Copy sent to Kade:', txt)
}

main().catch((e) => { console.error('FAILED:', e); process.exit(1) })
