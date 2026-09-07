// Regenerate CFWS rows that were produced by the buggy automatic path.
//
// Two defects, both fixed in 7ecbe818 on 2026-09-07, both affecting only the
// automatic path (/api/submit-weekly-checkin and the backfill script), never
// the manual Regenerate button:
//
//   1. Stale-form pairing. A client fills ONE form a week and they alternate,
//      so the route pairs this week's form with the most recent opposite form,
//      normally last week's. Both were handed to the model stamped with the
//      current week, so every ordinary week-on-week change came back as a
//      Form A / Form B contradiction for the coach to go and reconcile.
//
//   2. No CFFS anchor. The readiness rubric added 2026-05-18 anchors all four
//      ratings to the CFFS. The automatic path never passed one - zero commits
//      ever put cffsBaseline in submit-weekly-checkin - so every automatically
//      generated CFWS since then was rated cold, which skews Amber.
//
// Both are prompt-level, so the rows on file are wrong and only a regenerate
// fixes them. backfill-missing-cfws.ts cannot: it only fills MISSING rows.
//
// What this does NOT do: rewrite history for its own sake. Default scope is the
// most recent N CFWS per ACTIVE client, because that is the window the readiness
// monitor, the reassessment triggers, the recovery router and the dashboards
// actually read. Older rows are archive - they are what the coach saw at the
// time, they no longer drive anything, and regenerating them against a prompt
// that has moved on since would misrepresent the record rather than correct it.
//
// Pairing note, same as the backfill: "most recent opposite form" has to mean
// most recent AS AT that week, never from the future, or an early week gets
// paired with a form that had not been submitted yet. Hence .lte(week_number).
//
// Existing rows are ARCHIVED, not deleted - generateCFWS flips is_archived on
// any row for the same client and week before inserting. Nothing is lost, and a
// bad run can be reverted by flipping the flags back.
//
// Usage:
//   npx tsx scripts/regenerate-unanchored-cfws.ts                 # dry run
//   npx tsx scripts/regenerate-unanchored-cfws.ts --weeks 5       # dry run, 5 most recent each
//   npx tsx scripts/regenerate-unanchored-cfws.ts --all           # dry run, every row
//   npx tsx scripts/regenerate-unanchored-cfws.ts --client Razia  # dry run, one client
//   npx tsx scripts/regenerate-unanchored-cfws.ts --commit        # actually write

import { readFileSync } from 'fs'
import { resolve } from 'path'

const envText = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (!m) continue
  if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const COMMIT = process.argv.includes('--commit')
const ALL = process.argv.includes('--all')
const weeksArg = process.argv.indexOf('--weeks')
const RECENT_N = weeksArg > -1 ? parseInt(process.argv[weeksArg + 1], 10) : 3
const clientArg = process.argv.indexOf('--client')
const CLIENT_FILTER = clientArg > -1 ? process.argv[clientArg + 1]?.toLowerCase() : null

// The rubric that needs the anchor landed here. Rows generated before it had no
// rating rubric at all, so regenerating them would not be a correction.
const RUBRIC_SHIPPED = '2026-05-18'

async function main() {
  const { createAdminClient } = await import('../src/lib/supabase/admin')
  const { generateCFWS } = await import('../src/lib/cfws-generate')
  const { stripReviewKeys } = await import('../src/lib/weekly-checkin-questions')
  const { syncReassessmentTriggers } = await import('../src/lib/reassessment-triggers')

  const admin = createAdminClient()

  const { data: clients, error: cErr } = await admin
    .from('clients')
    .select('id, name, active')
    .eq('active', true)
  if (cErr) throw new Error(`client lookup failed: ${cErr.message}`)

  const nameOf = new Map((clients ?? []).map(c => [c.id, c.name as string]))
  const targetIds = (clients ?? [])
    .filter(c => !CLIENT_FILTER || (c.name as string).toLowerCase().includes(CLIENT_FILTER))
    .map(c => c.id as string)

  if (!targetIds.length) {
    console.log('No active clients matched. Nothing to do.')
    return
  }

  const { data: rows, error: fErr } = await admin
    .from('cfws')
    .select('id, client_id, week_number, generated_at, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour')
    .in('client_id', targetIds)
    .eq('is_archived', false)
    .gte('generated_at', RUBRIC_SHIPPED)
    .order('week_number', { ascending: false })
  if (fErr) throw new Error(`cfws lookup failed: ${fErr.message}`)

  // Most recent N per client unless --all.
  const byClient = new Map<string, NonNullable<typeof rows>>()
  for (const r of rows ?? []) {
    const list = byClient.get(r.client_id) ?? []
    list.push(r)
    byClient.set(r.client_id, list)
  }
  const targets: NonNullable<typeof rows> = []
  for (const [, list] of byClient) targets.push(...(ALL ? list : list.slice(0, RECENT_N)))
  targets.sort((a, b) =>
    (nameOf.get(a.client_id) ?? '').localeCompare(nameOf.get(b.client_id) ?? '') ||
    a.week_number - b.week_number
  )

  const scope = ALL ? 'EVERY row since the rubric shipped' : `${RECENT_N} most recent per client`
  console.log(`\nScope: ${scope}, active clients only${CLIENT_FILTER ? `, matching "${CLIENT_FILTER}"` : ''}`)
  console.log(`${targets.length} CFWS row${targets.length === 1 ? '' : 's'} to regenerate:\n`)

  // Resolve each row's pairing up-front so the dry run shows exactly what will
  // be sent, including which opposite form gets paired and how stale it is.
  type Plan = {
    row: (typeof targets)[number]
    thisForm: 'A' | 'B'
    otherWeek: number
    formA: Record<string, string>
    formB: Record<string, string>
    formAWeekNumber: number
    formBWeekNumber: number
  }
  const plans: Plan[] = []
  const skipped: string[] = []

  for (const row of targets) {
    const label = `${nameOf.get(row.client_id)} week ${row.week_number}`
    const csrb = `${row.exposure_readiness_capacity}/${row.exposure_readiness_schedule}/${row.exposure_readiness_regulation}/${row.exposure_readiness_behaviour}`

    const { data: thisWeek, error: e1 } = await admin
      .from('weekly_checkins')
      .select('form_type, responses')
      .eq('client_id', row.client_id)
      .eq('week_number', row.week_number)
      .maybeSingle()
    if (e1) throw new Error(`${label}: check-in lookup failed: ${e1.message}`)
    if (!thisWeek) {
      console.log(`  SKIP  ${label}: no weekly_checkin row for that week`)
      skipped.push(`${label} (no check-in)`)
      continue
    }

    const thisForm = thisWeek.form_type as 'A' | 'B'
    const otherFormType = thisForm === 'A' ? 'B' : 'A'

    const { data: otherForm, error: e2 } = await admin
      .from('weekly_checkins')
      .select('responses, week_number')
      .eq('client_id', row.client_id)
      .eq('form_type', otherFormType)
      .lte('week_number', row.week_number)
      .order('week_number', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (e2) throw new Error(`${label}: opposite-form lookup failed: ${e2.message}`)
    if (!otherForm) {
      console.log(`  SKIP  ${label}: no ${otherFormType} form at or before this week`)
      skipped.push(`${label} (no pair)`)
      continue
    }

    const cur = stripReviewKeys(thisWeek.responses as Record<string, string>)
    const oth = stripReviewKeys(otherForm.responses as Record<string, string>)
    const gap = row.week_number - otherForm.week_number

    plans.push({
      row,
      thisForm,
      otherWeek: otherForm.week_number,
      formA: thisForm === 'A' ? cur : oth,
      formB: thisForm === 'B' ? cur : oth,
      formAWeekNumber: thisForm === 'A' ? row.week_number : otherForm.week_number,
      formBWeekNumber: thisForm === 'B' ? row.week_number : otherForm.week_number,
    })

    console.log(
      `  ${label.padEnd(28)} form ${thisForm} + ${otherFormType} from week ${otherForm.week_number}` +
        ` (${gap === 0 ? 'same week' : `${gap} week${gap === 1 ? '' : 's'} older`})   current ${csrb}`
    )
  }

  if (!COMMIT) {
    console.log(`\nDRY RUN. Nothing written. ${plans.length} would regenerate, ${skipped.length} skipped.`)
    console.log('Re-run with --commit to write. Existing rows are archived, not deleted.')
    return
  }

  console.log('\nRegenerating...\n')
  const touched = new Set<string>()
  let ok = 0
  const failures: string[] = []

  for (const p of plans) {
    const label = `${nameOf.get(p.row.client_id)} week ${p.row.week_number}`
    try {
      await generateCFWS(
        admin,
        { id: p.row.client_id, name: nameOf.get(p.row.client_id)! },
        p.row.week_number,
        p.formA,
        p.formB,
        { formAWeekNumber: p.formAWeekNumber, formBWeekNumber: p.formBWeekNumber }
      )
      touched.add(p.row.client_id)
      ok++

      const { data: fresh } = await admin
        .from('cfws')
        .select('exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour')
        .eq('client_id', p.row.client_id)
        .eq('week_number', p.row.week_number)
        .eq('is_archived', false)
        .maybeSingle()
      const before = `${p.row.exposure_readiness_capacity}/${p.row.exposure_readiness_schedule}/${p.row.exposure_readiness_regulation}/${p.row.exposure_readiness_behaviour}`
      const after = fresh
        ? `${fresh.exposure_readiness_capacity}/${fresh.exposure_readiness_schedule}/${fresh.exposure_readiness_regulation}/${fresh.exposure_readiness_behaviour}`
        : '(could not read back)'
      console.log(`  OK    ${label.padEnd(28)} ${before}  ->  ${after}${before === after ? '' : '   CHANGED'}`)
    } catch (err) {
      console.error(`  FAIL  ${label}: ${(err as Error).message}`)
      failures.push(label)
    }
  }

  // Triggers key off CFWS readiness, so re-anchor them once the rows are right.
  // Ratings move, which means the open trigger set can legitimately change.
  for (const clientId of touched) {
    try {
      await syncReassessmentTriggers(admin, clientId)
      console.log(`\nReassessment triggers re-synced for ${nameOf.get(clientId)}`)
    } catch (err) {
      console.error(`Trigger sync failed for ${nameOf.get(clientId)}: ${(err as Error).message}`)
    }
  }

  console.log(`\nDone. ${ok} regenerated, ${failures.length} failed, ${skipped.length} skipped.`)
  if (failures.length) console.log('Failed:', failures.join(', '))
  console.log('\nReview the readiness moves above before acting on any client.')
}

main().catch(err => {
  console.error('Script crashed:', err)
  process.exit(1)
})
