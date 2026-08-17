/**
 * End the engagement for four people who never started.
 *
 *   npx tsx scripts/offboard-never-started.ts          # dry run
 *   npx tsx scripts/offboard-never-started.ts --commit # do it
 *
 * Brett, Kim, Michael Mailloux and Shelley Elley were all created between
 * April and June 2026 with a coaching_started_at set, and none of them ever
 * submitted an intake, a baseline or anything else. They already had
 * `active = false`, which gates nothing, so every report went on counting them
 * as clients and naming them in the daily health-check email each morning.
 *
 * EMAIL SUPPRESSION IS DELIBERATELY SKIPPED (Kade's call, 2026-08-17). Someone
 * who never started is closer to a dormant lead than a former client, and
 * suppressing the address would blacklist it system-wide and remove them from
 * lead reactivation. `ended_at` still stops every client-facing cron and the
 * portal guard; only the marketing blacklist is left off.
 *
 * Reversible: clear ended_at / end_reason / end_notes / retain_until and unban
 * the login.
 */
import { createClient } from '@supabase/supabase-js'
import { offboardClient } from '../src/lib/offboard-client'

const COMMIT = process.argv.includes('--commit')

const NEVER_STARTED_NOTES =
  'Never started. Signed up and had a coaching start date set, but never submitted an intake, ' +
  'baseline or anything else, and never began coaching. Ended 2026-08-17 so they stop being ' +
  'counted as clients in reports. Email deliberately NOT suppressed — they remain reachable ' +
  'as a lead.'

/**
 * Michael is not in the same category and his record should not say he is.
 *
 * The activity guard below caught him: he submitted a COMPLETE intake on
 * 2026-05-27 and no CFFS, program or nutrition plan was ever generated from it.
 * He did not go quiet — he engaged and was not served. Recording that as
 * "went quiet" would hide the one thing worth learning from, so the reason is
 * coach_ended and the note says what actually happened.
 */
const MICHAEL_NOTES =
  'I ended it. Submitted a complete foundational intake on 2026-05-27 (goal: increase muscle ' +
  'mass, manage age-related muscle loss) and it was never actioned — no CFFS, no program, no ' +
  'nutrition plan was ever generated, and coaching never commenced. This is a service gap, not ' +
  'a client who went quiet. Ended 2026-08-17. Intake retained on file. Email deliberately NOT ' +
  'suppressed — he remains reachable.'

const TARGETS: Array<{
  id: string
  name: string
  reason: 'no_contact' | 'coach_ended'
  notes: string
  /** Set when the client legitimately has records and the activity guard must be bypassed. */
  expectActivity?: boolean
}> = [
  { id: 'f92a3431-9e1c-4381-b394-955ca31eabc7', name: 'Brett', reason: 'no_contact', notes: NEVER_STARTED_NOTES },
  { id: '4008349a-6ea3-44ea-948f-857b13921d7d', name: 'Kim', reason: 'no_contact', notes: NEVER_STARTED_NOTES },
  { id: 'adab9ab4-e678-4879-92e5-d962d6593ca4', name: 'Michael Mailloux', reason: 'coach_ended', notes: MICHAEL_NOTES, expectActivity: true },
  { id: '07c95320-6389-43fe-887b-db554a2c0b24', name: 'Shelley Elley', reason: 'no_contact', notes: NEVER_STARTED_NOTES },
]

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  console.log(COMMIT ? '\nCOMMITTING\n' : '\nDRY RUN — nothing will be written. Pass --commit to apply.\n')

  for (const t of TARGETS) {
    const { data: before } = await admin
      .from('clients')
      .select('id, name, email, active, ended_at, coaching_started_at')
      .eq('id', t.id)
      .maybeSingle()

    if (!before) {
      console.log(`  SKIP  ${t.name} — no such client`)
      continue
    }
    if (before.ended_at) {
      console.log(`  SKIP  ${before.name} — already ended ${String(before.ended_at).slice(0, 10)}`)
      continue
    }

    // Guard against ending someone who actually did start. If any of these
    // exist the assumption behind this script is wrong for that person.
    const [{ count: intakes }, { count: baselines }, { count: checkins }] = await Promise.all([
      admin.from('intakes').select('id', { count: 'exact', head: true }).eq('client_id', t.id),
      admin.from('baselines').select('id', { count: 'exact', head: true }).eq('client_id', t.id),
      admin.from('weekly_checkins').select('id', { count: 'exact', head: true }).eq('client_id', t.id),
    ])

    const activity = (intakes ?? 0) + (baselines ?? 0) + (checkins ?? 0)
    if (activity > 0 && !t.expectActivity) {
      console.log(
        `  STOP  ${before.name} — has activity on file (${intakes} intakes, ${baselines} baselines, ${checkins} check-ins). Not ending. Review by hand.`,
      )
      continue
    }

    if (!COMMIT) {
      console.log(`  WOULD END  ${before.name} <${before.email}> — reason ${t.reason}, ${intakes} intakes / ${baselines} baselines / ${checkins} check-ins`)
      continue
    }

    const result = await offboardClient(admin, {
      clientId: t.id,
      reason: t.reason,
      notes: t.notes,
      suppressEmail: false,
    })

    console.log(`  ${result.ok ? 'ENDED' : 'FAILED'}  ${before.name}${result.error ? ` — ${result.error}` : ''}`)
    for (const s of result.steps) {
      console.log(`         ${s.done ? '+' : '-'} ${s.step}${s.detail ? ` (${s.detail})` : ''}`)
    }

    // Ban the portal login. Lives in the API route rather than offboardClient
    // because it touches auth.users through a different surface.
    if (result.ok && before.email) {
      const { data: users } = await admin.auth.admin.listUsers()
      const match = users?.users?.find(u => (u.email ?? '').toLowerCase() === before.email!.toLowerCase())
      if (match) {
        await admin.auth.admin.updateUserById(match.id, { ban_duration: '876000h' })
        console.log('         + Portal login banned')
      } else {
        console.log('         - Portal login banned (no auth account found)')
      }
    }
  }

  console.log('')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
