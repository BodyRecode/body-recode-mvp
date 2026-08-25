import { scorecardSteps } from '@/lib/scorecard-sequence'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { brand } from "@/config/tenant";

// POST /api/scorecard/seed-automation
// Creates the scorecard follow-up email automation if it doesn't already exist

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Check if already exists. Match by both old (em-dash) and new (hyphen) names so an
  // existing workflow gets updated in place rather than orphaned alongside a duplicate.
  //
  // Deliberately NOT maybeSingle(): if two rows already exist it errors and returns
  // null, which used to make this route create yet another copy. That is exactly how
  // the em-dash/hyphen pair got live together (found 2026-07-28 — every scorecard lead
  // was enrolled in both and received near-duplicate emails on all 5 touches). Keep the
  // oldest row as the canonical one and deactivate any extras so the engine, which
  // enrols into EVERY active workflow matching the trigger, only ever finds one.
  const { data: matches } = await supabase
    .from('be_workflows')
    .select('id, name, is_active')
    .eq('coach_id', user.id)
    .in('name', ['Scorecard - Follow-up Sequence', 'Scorecard — Follow-up Sequence'])
    .order('created_at', { ascending: true })

  // Prefer whichever row is already live, then fall back to the oldest — never pick a
  // deactivated duplicate over the workflow that is actually running leads.
  const ranked = [...(matches ?? [])].sort((a, b) => Number(b.is_active) - Number(a.is_active))
  const existing = ranked[0] ?? null
  const duplicates = ranked.slice(1)
  if (duplicates.length > 0) {
    await supabase
      .from('be_workflows')
      .update({ is_active: false })
      .in('id', duplicates.map(d => d.id))
  }

  // One definition, in src/lib/scorecard-sequence.ts. This route carried a
  // third copy of the nine steps; all three had drifted apart from the live
  // rows, which were rewritten in the UI on 24 Aug 2026.
  const steps = scorecardSteps()

  if (existing) {
    // Update existing steps to latest copy. Also rename if it's still on the old em-dash name.
    if (existing.name !== 'Scorecard - Follow-up Sequence') {
      await supabase.from('be_workflows').update({ name: 'Scorecard - Follow-up Sequence' }).eq('id', existing.id)
    }
    await supabase.from('be_workflow_steps').delete().eq('workflow_id', existing.id)
    await supabase.from('be_workflow_steps').insert(steps.map(s => ({ ...s, workflow_id: existing.id })))
    return NextResponse.json({ updated: true, id: existing.id })
  }

  // Create workflow
  const { data: workflow, error } = await supabase
    .from('be_workflows')
    .insert({
      coach_id: user.id,
      name: 'Scorecard - Follow-up Sequence',
      trigger_type: 'form_submitted',
      trigger_config: { form: 'scorecard' },
      is_active: true,
    })
    .select()
    .single()

  if (error || !workflow) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }

  await supabase.from('be_workflow_steps').insert(steps.map(s => ({ ...s, workflow_id: workflow.id })))

  return NextResponse.json({ created: true, id: workflow.id })
}
