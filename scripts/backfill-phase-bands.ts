/**
 * Write the resolved cycle-phase bands onto the stored marker rows of every
 * blood panel that has a cycle date.
 *
 * Run after adding or correcting a cycle date on a panel:
 *   npx tsx --env-file=.env.local scripts/backfill-phase-bands.ts [--apply]
 *
 * Dry by default. Idempotent: a second run reports no changes.
 */
import { createAdminClient } from '../src/lib/supabase/admin'
import { annotateMarkersWithPhaseBands, type MarkerWithBand } from '../src/lib/cycle-phase-bands'

const APPLY = process.argv.includes('--apply')

async function main() {
  const admin = createAdminClient()
  const { data: panels, error } = await admin
    .from('blood_panels')
    .select('id, client_id, collected_on, cycle_day, markers, clients(name)')
    .not('cycle_day', 'is', null)
  if (error) throw new Error(error.message)

  if (!panels?.length) {
    console.log('No panels carry a cycle date yet, so there is nothing to resolve.')
    return
  }

  let touched = 0
  for (const p of panels) {
    const c = p.clients as unknown as { name: string } | null
    const who = c ? c.name : String(p.client_id).slice(0, 8)
    const markers = (p.markers ?? []) as MarkerWithBand[]
    const r = annotateMarkersWithPhaseBands(markers, p.cycle_day as number)

    console.log(`${who}  ${p.collected_on}  day ${p.cycle_day}  ${r.resolvedCount} of ${markers.length} markers resolve  ${r.changed ? 'CHANGED' : 'already current'}`)
    for (const m of r.markers) {
      if (m.phase_resolved) console.log(`    ${m.name}: ${m.phase_resolved.position} the ${m.phase_resolved.phase} band`)
    }
    if (!r.changed) continue
    touched++
    if (APPLY) {
      const { error: upErr } = await admin.from('blood_panels').update({ markers: r.markers }).eq('id', p.id)
      if (upErr) console.log(`    FAILED to save: ${upErr.message}`)
    }
  }

  console.log(`\n${panels.length} panel(s) with a cycle date, ${touched} needing a change.`)
  console.log(APPLY ? 'Applied.' : 'Dry run. Re-run with --apply to write.')
}

main().catch(e => { console.error(e); process.exit(1) })
