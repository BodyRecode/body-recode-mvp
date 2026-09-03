/**
 * One-off: reset Brett Segat back to a brand-new client.
 *
 * Context (2026-06-03): Kade spoke to Brett on the phone and decided to scrap
 * his stalled onboarding and start from scratch. Brett had submitted his
 * foundational intake (2026-04-30) and signed the agreement + health
 * declaration, but never completed baseline and `onboarding_complete` is
 * still false. No CFFS / program / nutrition / baseline / check-in rows exist.
 *
 * This script returns him to the exact state a freshly-converted client has:
 *   - intakes row deleted (scrap his submitted responses)
 *   - foundational intake_invitations row reset to status='pending'
 *   - agreement + health declaration cleared
 *   - onboarding_complete = false, reminder tracking cleared
 *   - coaching_started_at reset to now (his new start date)
 * Preserved: founding-client status, tokens (onboarding/checkin/baseline),
 * and client_communications (audit trail).
 *
 * Then it sends the canonical portal-access email (the "four steps before we
 * start coaching" email) so Brett can recommence the whole onboarding stack.
 *
 * Usage:
 *   node scripts/reset-brett-new-client.mjs            # preview (no writes, no email)
 *   node scripts/reset-brett-new-client.mjs --commit   # apply + send
 */

import fs from 'node:fs'

// --- env ---
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
}
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_KEY = process.env.RESEND_API_KEY
if (!SUPABASE_URL || !SERVICE_KEY || !RESEND_KEY) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY')
  process.exit(1)
}

const COMMIT = process.argv.includes('--commit')
const CLIENT_ID = 'f92a3431-9e1c-4381-b394-955ca31eabc7' // Brett Segat
const NOW = new Date().toISOString()

const h = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

async function rest(method, pathAndQuery, body, prefer) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    method,
    headers: prefer ? { ...h, Prefer: prefer } : h,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!r.ok) throw new Error(`Supabase ${method} ${pathAndQuery} -> ${r.status}: ${await r.text()}`)
  const text = await r.text()
  return text ? JSON.parse(text) : null
}

// --- read current state ---
const [client] = await rest('GET', `clients?id=eq.${CLIENT_ID}&select=id,name,email,onboarding_token,coaching_started_at,agreement_accepted_at,health_declaration_submitted_at,onboarding_complete`)
if (!client) { console.error(`Client ${CLIENT_ID} not found`); process.exit(1) }
const intakes = await rest('GET', `intakes?client_id=eq.${CLIENT_ID}&select=id,submitted_at`)
const invites = await rest('GET', `intake_invitations?client_id=eq.${CLIENT_ID}&select=id,kind,status,completed_at`)

console.log('=== BRETT — CURRENT STATE ===')
console.log('  name:', client.name, '| email:', client.email)
console.log('  coaching_started_at:', client.coaching_started_at)
console.log('  agreement_accepted_at:', client.agreement_accepted_at)
console.log('  health_declaration_submitted_at:', client.health_declaration_submitted_at)
console.log('  onboarding_complete:', client.onboarding_complete)
console.log('  intakes rows:', intakes.length, intakes.map(i => i.submitted_at))
console.log('  intake_invitations:', invites.map(i => `${i.kind}/${i.status}`))
console.log('')
console.log(COMMIT ? '=== APPLYING (--commit) ===' : '=== PREVIEW (no writes). Re-run with --commit to apply. ===')

const planLines = [
  `delete ${intakes.length} intakes row(s)`,
  `reset foundational intake_invitations -> status=pending, completed_at=null`,
  `clients: coaching_started_at -> ${NOW} (new start date)`,
  `clients: agreement_accepted_at/name -> null`,
  `clients: health_declaration_submitted_at + health_declaration_data -> null`,
  `clients: onboarding_complete -> false, onboarding_reminders_sent -> {}`,
  `send portal-access email to ${client.email} + log client_communications`,
]
planLines.forEach(l => console.log('  -', l))

if (!COMMIT) {
  console.log('\nNothing changed.')
  process.exit(0)
}

// --- 1. delete submitted intake responses ---
await rest('DELETE', `intakes?client_id=eq.${CLIENT_ID}`, undefined, 'return=minimal')
console.log('✓ intakes deleted')

// --- 2. reset foundational invitation back to pending ---
await rest('PATCH', `intake_invitations?client_id=eq.${CLIENT_ID}&kind=eq.foundational`,
  { status: 'pending', completed_at: null }, 'return=minimal')
console.log('✓ foundational invitation reset to pending')

// --- 3. reset client onboarding state ---
await rest('PATCH', `clients?id=eq.${CLIENT_ID}`, {
  coaching_started_at: NOW,
  agreement_accepted_at: null,
  agreement_accepted_name: null,
  health_declaration_submitted_at: null,
  health_declaration_data: null,
  onboarding_complete: false,
  onboarding_reminders_sent: {},
}, 'return=minimal')
console.log('✓ client reset to fresh onboarding state')

// --- 4. send the canonical portal-access email (white shell, current production copy) ---
const firstName = client.name.split(' ')[0]
const portalUrl = `https://app.bodyrecode.au/portal/${client.onboarding_token}`
const subject = `${firstName}, your portal is ready`

// Inlined from src/lib/email-shell.ts darkEmailShell (now the white Pure
// White / Signal Blue shell) + portal-access-email.ts body. Kept in sync
// with the source as of 2026-06-03.
function shell(inner, preview) {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light only" /><meta name="supported-color-schemes" content="light" />
<title>Body Recode</title></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;color:#1A1A1A;-webkit-font-smoothing:antialiased;">
${preview ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#FFFFFF;opacity:0;">${preview}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;margin:0;padding:0;">
<tr><td bgcolor="#FFFFFF" align="center" style="background-color:#FFFFFF;padding:0;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;width:100%;max-width:600px;">
<tr><td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1A1A1A;">
${inner}
</td></tr></table></td></tr></table></body></html>`
}
function signature() {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;margin-top:32px;border-top:1px solid #E5E5E5;width:100%;"><tr><td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:24px 16px 0 0;vertical-align:middle;width:64px;"><img src="https://bodyrecode.au/kade.jpg" width="48" height="48" style="border-radius:50%;display:block;object-fit:cover;object-position:top;border:0;" alt="Kade Dunstone" /></td><td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding-top:24px;vertical-align:middle;"><p style="margin:0;font-size:14px;font-weight:600;color:#1A1A1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Kade Dunstone</p><p style="margin:2px 0 0;font-size:13px;color:#6B6B6B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Performance Coach · Body Recode</p><a href="https://performance.bodyrecode.au" style="font-size:12px;color:#6B6B6B;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">performance.bodyrecode.au</a></td></tr></table>`
}
const p = (txt, mb = 20) => `<p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 ${mb}px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${txt}</p>`
const step = (n, txt, mb = 8) => `<p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 ${mb}px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;"><strong style="color:#1A1A1A;">${n}.</strong> ${txt}</p>`

const html = shell(`
      <div style="margin-bottom:40px;"><img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;border:0;" /></div>
      ${p(`Hi ${firstName},`)}
      ${p('Good to talk just now. As discussed, we are starting fresh, your portal is open again. Four steps to complete before we start coaching:')}
      ${step(1, 'Coaching Agreement')}
      ${step(2, 'Health Declaration')}
      ${step(3, 'Foundational Intake (230 questions across 8 areas. Take your time. The more accurate it is, the better your read.)')}
      ${step(4, 'Baseline Documentation', 24)}
      ${p('Once your intake is in, your CFFS generates automatically. That is the read I work from to write your program. No template. Built around what your body is actually doing.', 24)}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;"><tr><td bgcolor="#1B6DFC" style="background-color:#1B6DFC;border-radius:8px;"><a href="${portalUrl}" style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Open my portal</a></td></tr></table>
      ${p('Sign in with your email. No password. The code does the work.')}
      ${signature()}
      <p style="margin:20px 0 0;font-size:13px;color:#6B6B6B;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Or copy this link: ${portalUrl}</p>
`, `Welcome back ${firstName} — four steps to complete before we start coaching.`)

const sendRes = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: client.email,
    bcc: ['kade@bodyrecode.au'],
    subject,
    html,
  }),
})
const sendData = await sendRes.json()
if (!sendRes.ok) { console.error('Resend send failed:', sendData); process.exit(1) }
console.log(`✓ portal-access email sent to ${client.email} (bcc kade). Resend id: ${sendData.id}`)

await rest('POST', 'client_communications', {
  client_id: CLIENT_ID,
  kind: 'portal_access',
  channel: 'email',
  subject,
  to_address: client.email,
  sent_at: NOW,
  meta: { url: portalUrl, trigger: 'manual_reset_new_client', resend_email_id: sendData.id ?? null },
}, 'return=minimal')
console.log('✓ logged to client_communications')
console.log('\nDONE — Brett is reset to a fresh new client.')
