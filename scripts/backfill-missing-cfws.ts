// Backfill the CFWS rows that were never written during the silent outage.
//
// CFWS generation died on 2026-07-26 and was found on 2026-08-20. Commit
// 31437dfe moved AI_MODELS.clinical from Haiku 4.5 to Sonnet 5 while the call
// still asked for max_tokens: 2000. Extended thinking ate the budget, the JSON
// came back truncated, and the generator returned early without throwing. Nine
// check-ins across three clients produced no CFWS, and the reassessment triggers
// that key off it kept firing against 26 July data.
//
// This script finds every weekly check-in with no corresponding CFWS row and
// regenerates it through the SAME shared helper the live route now uses, so the
// backfilled rows are identical in shape to the ones the route produces.
//
// Pairing note: the route pairs the submitted form with the most recent form of
// the OTHER type. Replaying history, "most recent" has to mean most recent AS AT
// that week, not today, or an early backfilled week would be paired with a form
// from the future. That is what the `.lte('week_number', week)` below is for.
//
// Usage:
//   npx tsx scripts/backfill-missing-cfws.ts           # dry run, writes nothing
//   npx tsx scripts/backfill-missing-cfws.ts --commit  # actually generate

import { readFileSync } from 'fs'
import { resolve } from 'path'

const envText = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (!m) continue
  if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const COMMIT = process.argv.includes('--commit')

async function main() {
  const { createAdminClient } = await import('../src/lib/supabase/admin')
  const { generateCFWS } = await import('../src/lib/cfws-generate')
  const { stripReviewKeys } = await import('../src/lib/weekly-checkin-questions')
  const { syncReassessmentTriggers } = await import('../src/lib/reassessment-triggers')

  const admin = createAdminClient()

  const { data: checkins } = await admin
    .from('weekly_checkins')
    .select('client_id, week_number, form_type, responses, submitted_at')
    .order('submitted_at')

  const { data: cfws } = await admin.from('cfws').select('client_id, week_number')
  const have = new Set((cfws ?? []).map(r => `${r.client_id}:${r.week_number}`))

  const { data: clients } = await admin.from('clients').select('id, name')
  const nameOf = new Map((clients ?? []).map(c => [c.id, c.name]))

  // One CFWS per (client, week). Dedupe in case both forms landed in one week.
  const seen = new Set<string>()
  const missing = (checkins ?? []).filter(c => {
    const key = `${c.client_id}:${c.week_number}`
    if (have.has(key) || seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`${missing.length} check-in weeks with no CFWS:\n`)
  for (const c of missing) {
    console.log(
      `  ${nameOf.get(c.client_id)} week ${c.week_number} ` +
        `(form ${c.form_type}, submitted ${c.submitted_at.slice(0, 10)})`
    )
  }

  if (!COMMIT) {
    console.log('\nDRY RUN. Nothing written. Re-run with --commit to generate.')
    return
  }

  console.log('\nGenerating...\n')
  const touchedClients = new Set<string>()
  let ok = 0
  const failures: string[] = []

  for (const c of missing) {
    const label = `${nameOf.get(c.client_id)} week ${c.week_number}`
    const otherFormType = c.form_type === 'A' ? 'B' : 'A'

    // Most recent other-type form AS AT this week, never from the future.
    const { data: otherForm } = await admin
      .from('weekly_checkins')
      .select('responses, week_number')
      .eq('client_id', c.client_id)
      .eq('form_type', otherFormType)
      .lte('week_number', c.week_number)
      .order('week_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!otherForm) {
      console.log(`  SKIP  ${label}: no ${otherFormType} form exists at or before this week`)
      failures.push(`${label} (no pair)`)
      continue
    }

    const current = stripReviewKeys(c.responses as Record<string, string>)
    const other = stripReviewKeys(otherForm.responses as Record<string, string>)
    const formA = c.form_type === 'A' ? current : other
    const formB = c.form_type === 'B' ? current : other

    try {
      await generateCFWS(
        admin,
        { id: c.client_id, name: nameOf.get(c.client_id)! },
        c.week_number,
        formA,
        formB
      )
      console.log(`  OK    ${label}  (paired with ${otherFormType} from week ${otherForm.week_number})`)
      touchedClients.add(c.client_id)
      ok++
    } catch (err) {
      console.error(`  FAIL  ${label}: ${(err as Error).message}`)
      failures.push(label)
    }
  }

  // Reassessment triggers were anchored to stale CFWS while these were missing.
  // Re-run per touched client so they re-anchor to the newest synthesis.
  for (const clientId of touchedClients) {
    try {
      await syncReassessmentTriggers(admin, clientId)
      console.log(`\nReassessment triggers re-synced for ${nameOf.get(clientId)}`)
    } catch (err) {
      console.error(`Trigger sync failed for ${nameOf.get(clientId)}: ${(err as Error).message}`)
    }
  }

  console.log(`\nDone. ${ok} generated, ${failures.length} failed.`)
  if (failures.length) console.log('Failed:', failures.join(', '))
}

main().catch(err => {
  console.error('Script crashed:', err)
  process.exit(1)
})
