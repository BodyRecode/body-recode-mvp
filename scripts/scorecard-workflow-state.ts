// What is actually live on the scorecard follow-up sequence.
//
// Written 23 Aug 2026 because two questions could not be answered from the code:
// which of the two workflows is real, and whether the copy in the database still
// matches the copy in the repo. Both answers were surprising.
//
// THE LIVE COPY IS NEWER THAN THE SEED. The five emails were rewritten in the UI
// and SCORECARD_STEPS in daily-health-check/route.ts was never brought up to
// match. Re-sync deletes every live step and re-inserts the seed, so on 23 Aug
// clicking it would have replaced the good emails with older ones. Run this
// before you re-sync anything.
//
// Run: npx tsx --env-file=.env.local scripts/scorecard-workflow-state.ts
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data: wfs } = await db.from('be_workflows')
    .select('id, name, is_active, coach_id, created_at')
    .ilike('name', '%corecard%').order('created_at')

  for (const w of wfs ?? []) {
    const q = (t: string, f: Record<string, unknown> = {}) =>
      Object.entries(f).reduce((b, [k, v]) => b.eq(k, v),
        db.from(t).select('id', { count: 'exact', head: true }).eq('workflow_id', w.id) as never) as never

    const { count: steps } = await q('be_workflow_steps')
    const { count: execs } = await q('be_workflow_executions')
    const { count: running } = await q('be_workflow_executions', { status: 'running' })

    console.log(`\n${w.is_active ? 'LIVE    ' : 'inactive'}  ${w.name}`)
    console.log(`          created ${w.created_at?.slice(0, 10)}  coach_id ${w.coach_id ?? 'NULL'}`)
    console.log(`          ${steps} steps · ${execs} executions · ${running} still running`)

    if (!w.is_active) continue
    const { data: sd } = await db.from('be_workflow_steps')
      .select('position, config').eq('workflow_id', w.id).order('position')
    for (const s of sd ?? []) {
      const c = (s.config ?? {}) as Record<string, string>
      if (!c.subject) continue
      const stale = (c.body ?? '').match(/body state/gi)?.length ?? 0
      console.log(`          ${s.position}. "${c.subject}"${stale ? `   <- "body state" x${stale}` : ''}`)
    }
  }
  console.log('\nA second workflow here is an incident, not a row to nurse. The oldest is canonical.')
}
main()
