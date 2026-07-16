// Day 0 scorecard completion check for the 14-Day Body Decode Challenge.
//
// Reports how many recent Challenge enrollers have completed their in-portal
// Day 0 Body Decode Intake (the scorecard) vs left it undone, and tracks the
// specific cohort that was manually nudged on 2026-07-16 (Andrea, Gemma,
// Kiki - and Connie, who had already completed).
//
// Emails a short plain-language summary to kade@bodyrecode.au so the result
// arrives in the inbox without anyone running anything.
//
// Reads the DB via supabase-js with the service-role key from .env.local (no
// CLI link needed). Safe + read-only.
//
// Usage (manual):
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/day0-completion-check.ts
//   ... add --print to skip the email and just print to the terminal.

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import {
  fromBrand,
  darkEmailShell,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailStatusCard, emailFeaturedCard,
  EMAIL_FF, EMAIL_BODY_SOFT, EMAIL_MUTED,
} from '@/lib/email-shell'

const PRINT_ONLY = process.argv.includes('--print')
const NUDGED_COHORT = ['Andrea L', 'Gemma Sier', 'Kiki Dlynn', 'Connie Kotevski']

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Pull active enrollments from the last 21 days with their intake state.
  const since = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
  const { data: rows, error } = await supabase
    .from('challenge_enrollments')
    .select('enrolled_at, status, body_decode_intake_completed_at, leads(name)')
    .eq('status', 'active')
    .gte('enrolled_at', since)
    .order('enrolled_at', { ascending: false })

  if (error) { console.error('Query failed:', error.message); process.exit(1) }

  const all = rows ?? []
  const done = all.filter((r: any) => r.body_decode_intake_completed_at)
  const pending = all.filter((r: any) => !r.body_decode_intake_completed_at)
  const rate = all.length ? Math.round((done.length / all.length) * 100) : 0

  const cohort = all
    .filter((r: any) => NUDGED_COHORT.includes((r.leads as any)?.name))
    .map((r: any) => ({ name: (r.leads as any)?.name, done: Boolean(r.body_decode_intake_completed_at) }))

  const cohortLines = NUDGED_COHORT.map(name => {
    const hit = cohort.find(c => c.name === name)
    return `  - ${name}: ${hit ? (hit.done ? 'DONE ✓' : 'still pending') : 'not found / inactive'}`
  }).join('\n')

  const pendingLines = pending.map((r: any) => `  - ${(r.leads as any)?.name}`).join('\n') || '  (none)'

  const textReport = [
    `14-Day Body Decode Challenge - Day 0 scorecard completion`,
    ``,
    `Active enrollers (last 21 days): ${all.length}`,
    `Completed the scorecard: ${done.length} (${rate}%)`,
    `Still pending: ${pending.length}`,
    ``,
    `Manually-nudged cohort (sent 2026-07-16):`,
    cohortLines,
    ``,
    `Everyone still pending:`,
    pendingLines,
  ].join('\n')

  console.log('\n' + textReport + '\n')
  if (PRINT_ONLY) return

  // Branded email built from the shared email-shell helpers (Pure White +
  // Signal Blue, color-scheme light only), same system look as every other
  // platform email.
  const row = (label: string, value: string, valueColor: string) =>
    `<div style="font-family:${EMAIL_FF};font-size:15px;line-height:1.6;color:${EMAIL_BODY_SOFT};padding:6px 0;border-bottom:1px solid #EEEEEE;">
       <span>${label}</span>
       <span style="float:right;font-weight:700;color:${valueColor};">${value}</span>
     </div>`

  const cohortInner = NUDGED_COHORT.map(name => {
    const hit = cohort.find(c => c.name === name)
    const [value, color] = !hit
      ? ['inactive', EMAIL_MUTED]
      : hit.done ? ['Done', '#1DA05B'] : ['Pending', EMAIL_MUTED]
    return row(name, value, color)
  }).join('')

  const pendingInner = pending.length
    ? pending.map((r: any) => row((r.leads as any)?.name ?? 'Unknown', 'Pending', EMAIL_MUTED)).join('')
    : `<div style="font-family:${EMAIL_FF};font-size:15px;color:${EMAIL_MUTED};padding:6px 0;">Nobody pending - everyone's done.</div>`

  const html = darkEmailShell(`
${emailLogo()}
${emailEyebrow('Challenge · Day 0 Scorecard')}
${emailHeading(`${done.length} of ${all.length} enrollers have completed`)}
${emailDivider()}
${emailBody('Automated daily read on the in-portal Day 0 scorecard for the 14-Day Body Decode Challenge.')}
${emailStatusCard({
  eyebrow: 'Completion rate',
  headline: `${rate}%`,
  body: `${done.length} of ${all.length} active enrollers (last 21 days) have done the scorecard. ${pending.length} still pending.`,
})}
${emailFeaturedCard(cohortInner, { eyebrow: 'Nudged cohort (sent 16 Jul)' })}
${emailFeaturedCard(pendingInner, { eyebrow: 'Everyone still pending' })}
`, { previewText: `${done.length}/${all.length} completed (${rate}%)` })

  const resend = new Resend(process.env.RESEND_API_KEY!)
  const res = await resend.emails.send({
    from: fromBrand(),
    to: 'kade@bodyrecode.au',
    subject: `Day 0 scorecard: ${done.length}/${all.length} completed (${rate}%)`,
    html,
  })
  console.log(res.error ? `Email ERROR: ${res.error.message}` : `Report emailed to kade@bodyrecode.au (${res.data?.id})`)
}

main().catch(e => { console.error(e); process.exit(1) })
