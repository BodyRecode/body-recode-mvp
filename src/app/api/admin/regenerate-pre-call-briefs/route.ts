import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generatePreCallBrief } from '@/lib/pre-call-brief'

// POST /api/admin/regenerate-pre-call-briefs
// Generates pre_call_brief for any lead that has scorecard data but no brief.
// Pass ?force=1 to overwrite existing briefs too.

export async function POST(req: Request) {
  const url = new URL(req.url)
  const force = url.searchParams.get('force') === '1'
  const admin = createAdminClient()

  const query = admin
    .from('leads')
    .select('id, name, scorecard_score, scorecard_body_state, scorecard_section_scores, approach_response, investment_readiness, lead_quality, pre_call_brief')
    .not('scorecard_score', 'is', null)
    .not('scorecard_body_state', 'is', null)

  const { data: leads, error } = await query

  if (error) {
    console.error('[regenerate-pre-call-briefs] Lead query error:', error)
    return NextResponse.json({ error: 'Failed to load leads.' }, { status: 500 })
  }

  if (!leads || leads.length === 0) {
    return NextResponse.json({ generated: 0, skipped: 0, message: 'No scored leads found.' })
  }

  let generated = 0
  let skipped = 0
  const errors: Array<{ id: string; name: string; error: string }> = []

  for (const lead of leads) {
    if (lead.pre_call_brief && !force) {
      skipped++
      continue
    }
    if (!lead.name) {
      errors.push({ id: lead.id, name: '', error: 'Missing name' })
      continue
    }
    try {
      const brief = generatePreCallBrief({
        name: lead.name,
        scorecard_score: lead.scorecard_score,
        scorecard_body_state: lead.scorecard_body_state,
        scorecard_section_scores: lead.scorecard_section_scores ?? {},
        approach_response: lead.approach_response,
        investment_readiness: lead.investment_readiness,
        lead_quality: lead.lead_quality,
      })
      const { error: updateErr } = await admin
        .from('leads')
        .update({ pre_call_brief: brief })
        .eq('id', lead.id)
      if (updateErr) {
        errors.push({ id: lead.id, name: lead.name, error: updateErr.message })
      } else {
        generated++
      }
    } catch (e) {
      errors.push({ id: lead.id, name: lead.name, error: e instanceof Error ? e.message : String(e) })
    }
  }

  return NextResponse.json({
    generated,
    skipped,
    total: leads.length,
    force,
    errors: errors.length > 0 ? errors : undefined,
  })
}
