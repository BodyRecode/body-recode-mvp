import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildNutritionReadingSystemPrompt,
  buildNutritionReadingUserPrompt,
  type NutritionReadingFRContext,
  type NutritionReadingPlanContext,
} from '@/lib/client-nutrition-reading-prompt'
import { extractFirstJsonObject } from '@/lib/extract-json'

// Pre-2026-06-09 this route also sent the client-facing email when the
// reading was first generated for a plan. That trigger conflated "interpretive
// context generated" with "tell the client to look at the new plan". The
// notification is now a separate coach-gated step at
// /api/notify-client-nutrition-plan, stamping nutrition_plans.published_to_client_at.

export const maxDuration = 300

function stripEmDashes<T>(value: T): T {
  if (typeof value === 'string') return value.replace(/—/g, ', ') as T
  if (Array.isArray(value)) return value.map(stripEmDashes) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripEmDashes(v)])
    ) as T
  }
  return value
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { plan_id } = await request.json()
  if (!plan_id) {
    return NextResponse.json({ error: 'Missing plan_id' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: plan, error: planErr } = await admin
    .from('nutrition_plans')
    .select('*')
    .eq('id', plan_id)
    .single()

  if (planErr || !plan) {
    return NextResponse.json({ error: 'Nutrition plan not found' }, { status: 404 })
  }

  const { data: client, error: clientErr } = await admin
    .from('clients')
    .select('id, name')
    .eq('id', plan.client_id)
    .single()

  if (clientErr || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  // Pull the latest published Foundational Reading. This is the state context
  // the Nutrition Reading builds from.
  const { data: cffsRows, error: cffsErr } = await admin
    .from('cffs')
    .select('cr_where_you_are, cr_what_your_body_is_telling_us, cr_what_were_focusing_on_first, cr_what_were_not_doing_yet, cr_coach_note, body_state_classification')
    .eq('client_id', client.id)
    .eq('is_archived', false)
    .not('client_reading_published_at', 'is', null)
    .order('client_reading_published_at', { ascending: false })
    .limit(1)

  if (cffsErr) {
    return NextResponse.json({ error: 'Failed to load Foundational Reading' }, { status: 500 })
  }
  if (!cffsRows || cffsRows.length === 0) {
    return NextResponse.json(
      { error: 'No published Foundational Reading found. Publish the Foundational Reading before generating the Nutrition Reading.' },
      { status: 400 }
    )
  }

  const frContext: NutritionReadingFRContext = cffsRows[0]

  const planContext: NutritionReadingPlanContext = {
    plan_name: plan.plan_name,
    entry_state: plan.entry_state,
    body_state: plan.body_state,
    pts_phase: plan.pts_phase,
    carb_demand_level: plan.carb_demand_level,
    protein_anchor_g: plan.protein_anchor_g,
    estimated_calorie_band: plan.estimated_calorie_band,
    meal_frequency: plan.meal_frequency,
    modulation_level: plan.modulation_level,
    active_strategies: plan.active_strategies,
    key_priorities: plan.key_priorities,
    weekly_structure_notes: plan.weekly_structure_notes,
    progression_notes: plan.progression_notes,
    entry_state_summary: plan.entry_state_summary,
    current_direction: plan.current_direction,
    simplification_required: plan.simplification_required,
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: buildNutritionReadingSystemPrompt(),
      messages: [{
        role: 'user',
        content: buildNutritionReadingUserPrompt(
          frContext,
          planContext,
          { name: client.name },
          plan.nr_coach_guidance ?? null
        ),
      }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Anthropic API error:', msg)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 })
  }

  const jsonText = extractFirstJsonObject(content.text)
  if (!jsonText) {
    return NextResponse.json(
      { error: `Could not parse reading. AI returned: ${content.text.slice(0, 120)}` },
      { status: 500 }
    )
  }

  let reading: {
    nr_why_this_plan?: string
    nr_what_this_nutrition_is_doing?: string
    nr_how_well_know_its_working?: string
    nr_what_were_not_doing_yet?: string
    nr_coach_note?: string
  }
  try {
    reading = JSON.parse(jsonText)
  } catch {
    return NextResponse.json(
      { error: `JSON parse failed: ${jsonText.slice(0, 120)}` },
      { status: 500 }
    )
  }

  const required = [
    'nr_why_this_plan',
    'nr_what_this_nutrition_is_doing',
    'nr_how_well_know_its_working',
    'nr_what_were_not_doing_yet',
    'nr_coach_note',
  ] as const
  for (const key of required) {
    if (!reading[key] || typeof reading[key] !== 'string') {
      return NextResponse.json(
        { error: `Missing or invalid section: ${key}` },
        { status: 500 }
      )
    }
  }

  // Banned-terms audit added 2026-06-09 — see banned-client-terms.ts.
  // Ruby's NR was generated 2026-05-12 and ships "mid-arc compression" +
  // "downregulating" + "wired-but-tired" because NR had no leak check at
  // the time. Now blocked at generation.
  const { auditClientReadingFields } = await import('@/lib/banned-client-terms')
  const audit = auditClientReadingFields(reading, [
    'nr_why_this_plan',
    'nr_what_this_nutrition_is_doing',
    'nr_how_well_know_its_working',
    'nr_what_were_not_doing_yet',
    'nr_coach_note',
  ])
  if (!audit.ok) {
    return NextResponse.json(
      { error: `Reading leaked internal terminology (${audit.leaks.join(', ')}). Click Regenerate to redraft.` },
      { status: 500 }
    )
  }
  const cleaned = audit.cleaned

  const { DOCTRINE_VERSIONS } = await import('@/lib/doctrine-versions')

  // Archive previous NR version (item I, 2026-06-09).
  if (plan.nr_why_this_plan || plan.nr_what_this_nutrition_is_doing) {
    const { archiveArtefactVersion } = await import('@/lib/artefact-archive')
    void archiveArtefactVersion({
      admin,
      clientId: plan.client_id,
      artefactType: 'nr',
      sourceRowId: plan_id,
      doctrineVersion: plan.doctrine_version ?? null,
      content: {
        nr_why_this_plan: plan.nr_why_this_plan,
        nr_what_this_nutrition_is_doing: plan.nr_what_this_nutrition_is_doing,
        nr_how_well_know_its_working: plan.nr_how_well_know_its_working,
        nr_what_were_not_doing_yet: plan.nr_what_were_not_doing_yet,
        nr_coach_note: plan.nr_coach_note,
      },
      generatedAt: plan.nutrition_reading_generated_at ?? null,
      archivedBy: user.id,
    })
  }

  const now = new Date().toISOString()
  // Auto-publish on generation. Regenerations stay published silently. Mirrors
  // the Program Reading flow.
  const { data: updated, error: updateErr } = await admin
    .from('nutrition_plans')
    .update({
      nr_why_this_plan: cleaned.nr_why_this_plan,
      nr_what_this_nutrition_is_doing: cleaned.nr_what_this_nutrition_is_doing,
      nr_how_well_know_its_working: cleaned.nr_how_well_know_its_working,
      nr_what_were_not_doing_yet: cleaned.nr_what_were_not_doing_yet,
      nr_coach_note: cleaned.nr_coach_note,
      doctrine_version: DOCTRINE_VERSIONS.nutrition_reading,
      nutrition_reading_generated_at: now,
      nutrition_reading_published_at: now,
    })
    .eq('id', plan_id)
    .select()
    .single()

  if (updateErr) {
    console.error('Failed to save nutrition reading:', updateErr)
    return NextResponse.json({ error: 'Failed to save reading' }, { status: 500 })
  }

  // No email send here. The client notification is a separate coach action
  // at /api/notify-client-nutrition-plan. Coach reviews the plan + reading,
  // then clicks Notify, then the email goes out and published_to_client_at
  // is stamped.

  return NextResponse.json({ plan: updated })
}
