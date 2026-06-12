// LIVE send: call-first re-engagement to 7 verified-cold scorecard leads.
// Brooke struck by Kade. Free strategy call = primary CTA, $19 Field Guide =
// secondary. Logs reengagement_email_sent per lead so they're not re-pulled.
// Run: npx tsx scripts/send-cold-callfirst.ts --live

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { readFileSync } from 'fs'
import {
  darkEmailShell, emailLogo, emailEyebrow, emailHeading, emailDivider,
  emailBody, emailFeaturedCard, emailCta, emailUrlFallback,
  EMAIL_FF, EMAIL_GRAPHITE, EMAIL_BODY, EMAIL_BLUE_DARK,
} from '../src/lib/email-shell'
import { darkEmailSignature } from '../src/lib/email-signature'

readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
})
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY!)
const APP = 'https://app.bodyrecode.au'
const BOOK_URL = `${APP}/book`

// 7 verified-cold leads (Brooke struck by Kade).
const COLD = new Set([
  'andrea.sison@outlook.com', 'george.polsen@icloud.com', 'jamesm.li2288@gmail.com',
  'amir_samir2002@hotmail.com', 'zzng7668@gmail.com',
  'j.i.mchugh@hotmail.com', 'timhawley63@gmail.com',
])

const STATE: Record<string, { explain: string; guide: string; guideName: string }> = {
  'Depleted State': {
    explain: 'That means your regulatory system is running flat — cortisol elevated — and your body cannot recompose from that state no matter how clean the training or food. The first move is bringing the load down, in the right order.',
    guide: `${APP}/field-guide/depleted`, guideName: 'Depleted Field Guide',
  },
  'Transitioning State': {
    explain: 'That means your pattern is clear and recoverable, but your body has not locked into the next phase yet. Right now is when corrective moves hold longest — before it slips back.',
    guide: `${APP}/field-guide/transitioning`, guideName: 'Transitioning Field Guide',
  },
  'Ready State': {
    explain: 'That means your system can take structured demand right now. The lever is not more intensity — it is progression that compounds instead of disrupting what you have built.',
    guide: `${APP}/field-guide/ready`, guideName: 'Ready Field Guide',
  },
}

function fn(name: string, email: string) {
  const n = (name ?? '').trim().split(/\s+/)[0]
  return n && n !== '?' ? n : email.split('@')[0]
}
function timePhrase(days: number) {
  const d = days + 2
  return d <= 14 ? 'recently' : d <= 30 ? 'a few weeks ago' : 'about a month ago'
}

function build(d: { name: string; email: string; state: string; score: number; days_ago: number }) {
  const s = STATE[d.state] ?? STATE['Depleted State']
  const name = fn(d.name, d.email)
  const stateShort = d.state.replace(' State', '')
  const card = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:${EMAIL_GRAPHITE};letter-spacing:-0.01em;font-family:${EMAIL_FF};line-height:1.35;">Free 15-minute strategy call</p>
    <p style="margin:0 0 14px;font-size:13px;color:${EMAIL_BLUE_DARK};font-weight:700;font-family:${EMAIL_FF};">No pitch · no obligation</p>
    <p style="margin:0;font-size:14px;color:${EMAIL_BODY};line-height:1.65;font-family:${EMAIL_FF};">We read your ${stateShort} result together and map the first moves for your specific situation.</p>`
  const secondary = `<p style="margin:24px 0 0;font-size:14px;color:${EMAIL_BODY};line-height:1.65;font-family:${EMAIL_FF};">Prefer to start on your own first? The <a href="${s.guide}" style="color:${EMAIL_BLUE_DARK};font-weight:700;text-decoration:underline;">${s.guideName}</a> ($19) covers the first moves.</p>`
  const inner = `
${emailLogo()}
${emailEyebrow(`${stateShort} State follow-up`)}
${emailHeading(`${name}, let's read your score together.`)}
${emailDivider()}
${emailBody(`You scored ${d.score}/15 on the Body State Scorecard ${timePhrase(d.days_ago)} and landed in ${stateShort}.`)}
${emailBody(s.explain)}
${emailBody('The fastest way forward is a free 15-minute call. We go through exactly what your result means and what to do first. No pitch.')}
${emailFeaturedCard(card, { eyebrow: 'Start here' })}
${emailCta({ href: BOOK_URL, label: 'Book your free strategy call' })}
${emailUrlFallback(BOOK_URL, 'Or paste this link into your browser')}
${secondary}
${darkEmailSignature()}`
  return {
    subject: `${name}, your ${stateShort} score — let's map the next move`,
    preheader: 'A free 15-minute call to read your result and set the first move.',
    html: darkEmailShell(inner, { previewText: 'A free 15-minute call to read your result and set the first move.' }),
  }
}

async function main() {
  if (!process.argv.includes('--live')) { console.error('Refusing: pass --live to send to real recipients.'); process.exit(1) }
  const { drafts } = JSON.parse(readFileSync(
    '/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/2026-06-10_reengagement_drafts.json', 'utf8'
  )) as { drafts: Array<{ lead_id: string; name: string; email: string; state: string; score: number; days_ago: number }> }
  const targets = drafts.filter(d => COLD.has(d.email.toLowerCase()))
  console.log(`LIVE: sending ${targets.length} call-first emails to real recipients...`)
  let sent = 0, failed = 0
  for (const d of targets) {
    const { subject, html } = build(d)
    const r = await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: d.email, subject, html, replyTo: 'kade@bodyrecode.au',
    })
    if (r.error) { console.error(`  ! ${d.email}: ${r.error.message}`); failed++ }
    else {
      sent++; console.log(`  ✓ ${d.name} <${d.email}> (${d.state} ${d.score}/15)`)
      // lead_events columns: lead_id, type, subject, sent_at, resend_email_id, notes (NOT event_type/metadata)
      const { error: logErr } = await admin.from('lead_events').insert({
        lead_id: d.lead_id, type: 'reengagement_email_sent', subject,
        resend_email_id: r.data?.id, notes: `call-first · ${d.state} ${d.score}/15`,
      })
      if (logErr) console.error(`    (log failed for ${d.email}: ${logErr.message})`)
    }
    await new Promise(res => setTimeout(res, 700))
  }
  console.log(`\nDone. Sent ${sent}, failed ${failed}.`)
}
main()
