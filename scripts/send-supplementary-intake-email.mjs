// One-off send: nudge a client to complete the supplementary intake
// (medications + dietary context) added to the system 2026-05-12.
//
// The supplementary intake is normally portal-only (no email — "the portal
// IS the channel" per project_supplementary_intake.md), but in practice
// some clients don't log in between coaching weeks, so the card sits
// unseen. This script sends a one-off branded reminder using the Outlook-
// safe shell pattern from src/lib/email-shell.ts.
//
// Usage:
//   node scripts/send-supplementary-intake-email.mjs <clientId>
//
// Guards:
//   - Client must exist and have an email
//   - Client must have a pending supplementary intake_invitations row
//   - Re-send is logged to client_communications as
//     kind=supplementary_intake_invite

import fs from 'node:fs'
import path from 'node:path'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
    }
  }
}

const clientId = process.argv[2]
if (!clientId) {
  console.error('Usage: node scripts/send-supplementary-intake-email.mjs <clientId>')
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_KEY = process.env.RESEND_API_KEY
if (!SUPABASE_URL || !SERVICE_KEY || !RESEND_KEY) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY')
  process.exit(1)
}

async function sb(pathAndQuery) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`)
  return r.json()
}

const [client] = await sb(`clients?id=eq.${clientId}&select=id,name,email`)
if (!client) { console.error(`Client ${clientId} not found`); process.exit(1) }
if (!client.email) { console.error(`Client ${clientId} has no email`); process.exit(1) }

const [invitation] = await sb(`intake_invitations?client_id=eq.${clientId}&kind=eq.supplementary&status=eq.pending&order=created_at.desc&limit=1`)
if (!invitation) {
  console.error(`No pending supplementary intake for ${client.name}. Click "Add follow-up to portal" on their client profile first.`)
  process.exit(1)
}

const firstName = client.name.split(' ')[0]
const supplementUrl = `https://app.bodyrecode.au/intake-supplement/${invitation.token}`

// --- Inlined from src/lib/email-shell.ts so this script has zero TS dep.
//     If the shell evolves, re-paste from the source.
function darkEmailShell(inner, opts = {}) {
  const preview = opts.previewText ?? ''
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="dark light" /><meta name="supported-color-schemes" content="dark light" />
<title>Body Recode</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;color:#cfcfcf;-webkit-font-smoothing:antialiased;">
${preview ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#0a0a0a;opacity:0;">${preview}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0a0a" style="background-color:#0a0a0a;">
<tr><td bgcolor="#0a0a0a" align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0a0a" style="background-color:#0a0a0a;width:100%;max-width:600px;">
<tr><td bgcolor="#0a0a0a" style="background-color:#0a0a0a;padding:48px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#cfcfcf;">
${inner}
</td></tr></table></td></tr></table></body></html>`
}
function emailUrlFallback(url, label = 'Or paste this link into your browser') {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#0a0a0a" style="background-color:#0a0a0a;margin:24px 0 0;"><tr><td bgcolor="#0a0a0a" style="background-color:#0a0a0a;padding:14px 16px;border:1px solid #1c1917;border-radius:8px;"><p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#a8a29e;letter-spacing:0.08em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${label}</p><p style="margin:0;font-size:13px;color:#cfcfcf;line-height:1.5;word-break:break-all;font-family:'Courier New',Consolas,monospace;">${url}</p></td></tr></table>`
}
function darkEmailSignature() {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0a0a" style="background-color:#0a0a0a;margin-top:32px;border-top:1px solid #1c1917;width:100%;"><tr><td bgcolor="#0a0a0a" style="background-color:#0a0a0a;padding:24px 16px 0 0;vertical-align:middle;width:64px;"><img src="https://bodyrecode.au/kade.jpg" width="48" height="48" style="border-radius:50%;display:block;object-fit:cover;object-position:top;border:0;" alt="Kade Dunstone" /></td><td bgcolor="#0a0a0a" style="background-color:#0a0a0a;padding-top:24px;vertical-align:middle;"><p style="margin:0;font-size:14px;font-weight:600;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Kade Dunstone</p><p style="margin:2px 0 0;font-size:13px;color:#a8a29e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Performance Coach · Body Recode</p><a href="https://performance.bodyrecode.au" style="font-size:12px;color:#a8a29e;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">performance.bodyrecode.au</a></td></tr></table>`
}

const subject = `${firstName}, a quick follow-up intake (3 minutes)`
const html = darkEmailShell(`
      <div style="margin-bottom:40px;"><img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;border:0;" /></div>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Hi ${firstName},</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Since you completed your original intake I've added five short follow-up questions covering medications and dietary context. They feed straight into your Foundational Reading and program, so the next iteration is built on the most accurate picture of where you actually are.</p>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">It's about three minutes. The form picks up where you left off if you have to step away mid-way.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;"><tr><td bgcolor="#10E1C2" style="background-color:#10E1C2;border-radius:8px;"><a href="${supplementUrl}" style="display:inline-block;padding:14px 28px;color:#000000;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Complete the 5 questions</a></td></tr></table>
      <p style="font-size:15px;color:#cfcfcf;line-height:1.9;margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Anything come up while you're filling it in, reply to this email.</p>
      ${emailUrlFallback(supplementUrl, 'Or paste this link into your browser')}
      ${darkEmailSignature()}
`, { previewText: `${firstName}, five quick follow-up questions for your intake.` })

// Mirrors COACH_BCC in src/lib/email-shell.ts. CLI scripts can't import
// the TS module, so the address is duplicated here. Override with
// COACH_BCC_EMAIL env var (set to '' to disable).
const coachBcc =
  process.env.COACH_BCC_EMAIL === '' ? [] : [process.env.COACH_BCC_EMAIL || 'kade@bodyrecode.au']

const sendRes = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: client.email,
    bcc: coachBcc,
    subject,
    html,
  }),
})
const sendData = await sendRes.json()
if (!sendRes.ok) { console.error('Resend send failed:', sendData); process.exit(1) }
console.log(`Sent to ${client.email}. Resend id: ${sendData.id}`)

const logRes = await fetch(`${SUPABASE_URL}/rest/v1/client_communications`, {
  method: 'POST',
  headers: {
    apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json', Prefer: 'return=minimal',
  },
  body: JSON.stringify({
    client_id: client.id,
    kind: 'supplementary_intake_invite',
    channel: 'email',
    subject,
    to_address: client.email,
    sent_at: new Date().toISOString(),
    meta: { url: supplementUrl, trigger: 'manual_one_off', resend_email_id: sendData.id ?? null },
  }),
})
if (!logRes.ok) console.error('client_communications log warning:', await logRes.text())
else console.log('Logged to client_communications.')
