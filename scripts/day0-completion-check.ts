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
import { fromBrand } from '@/lib/email-shell'

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

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1A1A1A;font-size:15px;line-height:1.7;max-width:560px;">
      <h2 style="font-size:18px;margin:0 0 4px;">Day 0 scorecard completion</h2>
      <p style="color:#6B6B6B;margin:0 0 20px;font-size:13px;">14-Day Body Decode Challenge · automated check</p>
      <div style="background:#F5F7FB;border:1px solid #E5E5E5;border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 6px;"><strong>${done.length} of ${all.length}</strong> active enrollers (last 21 days) have completed the scorecard <strong>(${rate}%)</strong>.</p>
        <p style="margin:0;color:#6B6B6B;">${pending.length} still pending.</p>
      </div>
      <p style="font-weight:700;margin:0 0 6px;">Nudged cohort (sent 16 Jul):</p>
      <pre style="font-family:inherit;white-space:pre-wrap;margin:0 0 20px;color:#3A3A3A;">${cohortLines}</pre>
      <p style="font-weight:700;margin:0 0 6px;">Everyone still pending:</p>
      <pre style="font-family:inherit;white-space:pre-wrap;margin:0;color:#3A3A3A;">${pendingLines}</pre>
    </div>`

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
