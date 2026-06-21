import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildNutritionGuidanceSuggestSystemPrompt,
  buildNutritionGuidanceSuggestUserPrompt,
  type NutritionGuidanceIntent,
  type NutritionGuidanceLever,
} from '@/lib/coach-guidance-nutrition-suggest-prompt'

export const maxDuration = 60

const VALID_INTENTS: NutritionGuidanceIntent[] = ['simplify', 'push_demand', 'add_flexibility', 'restructure_meals']
const VALID_LEVERS: NutritionGuidanceLever[] = ['meal_count', 'protein_distribution', 'food_friction', 'food_variety', 'timing']

function stripEmDashes(s: string): string {
  return s.replace(/—/g, ', ')
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const nutrition_plan_id = body?.nutrition_plan_id as string | undefined
  const intent = body?.intent as NutritionGuidanceIntent | undefined
  const levers = (body?.levers ?? []) as NutritionGuidanceLever[]
  const coach_note = (body?.coach_note ?? null) as string | null

  if (!nutrition_plan_id) {
    return NextResponse.json({ error: 'Missing nutrition_plan_id' }, { status: 400 })
  }
  if (!intent || !VALID_INTENTS.includes(intent)) {
    return NextResponse.json({ error: 'Invalid intent' }, { status: 400 })
  }
  const cleanLevers = (Array.isArray(levers) ? levers : []).filter(l => VALID_LEVERS.includes(l))

  const admin = createAdminClient()

  const { data: plan, error: planErr } = await admin
    .from('nutrition_plans')
    .select('id, client_id, coach_guidance')
    .eq('id', nutrition_plan_id)
    .single()

  if (planErr || !plan) {
    return NextResponse.json({ error: 'Nutrition plan not found' }, { status: 404 })
  }

  const { data: client, error: clientErr } = await admin
    .from('clients')
    .select('id, name, medications')
    .eq('id', plan.client_id)
    .single()

  if (clientErr || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  // Latest non-archived CFFS for body-state + pattern context. Guidance is
  // coach-only so use ANY active CFFS, not only published ones (mirrors the
  // program-side suggester rule).
  const { data: cffsRows } = await admin
    .from('cffs')
    .select('body_state_classification, client_context_summary, primary_patterns_and_signals, capacity_constraints_and_guardrails, risk_flags_and_watch_items')
    .eq('client_id', client.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(1)

  const cffs = cffsRows?.[0] ?? null

  // Dietary context lives on the latest intake. Drives the recognised-phrase
  // food-selection bias ("Halal foundation", "shared-meal household"), so
  // surface it explicitly to the model.
  const { data: intakeRows } = await admin
    .from('intakes')
    .select('dietary_restrictions, dietary_preferences, typical_day_eating, eating_context')
    .eq('client_id', client.id)
    .order('submitted_at', { ascending: false })
    .limit(1)
  const intake = intakeRows?.[0] ?? null

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 3 })

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: buildNutritionGuidanceSuggestSystemPrompt(),
      messages: [{
        role: 'user',
        content: buildNutritionGuidanceSuggestUserPrompt({
          intent,
          levers: cleanLevers,
          coach_note: coach_note && coach_note.trim() ? coach_note.trim() : null,
          client: {
            name: client.name,
            body_state: cffs?.body_state_classification ?? null,
            cffs_summary: cffs?.client_context_summary ?? null,
            primary_patterns: cffs?.primary_patterns_and_signals ?? null,
            capacity_constraints: cffs?.capacity_constraints_and_guardrails ?? null,
            risk_flags: cffs?.risk_flags_and_watch_items ?? null,
            medications: client.medications ?? null,
            dietary_restrictions: intake?.dietary_restrictions ?? null,
            dietary_preferences: intake?.dietary_preferences ?? null,
            typical_day_eating: intake?.typical_day_eating ?? null,
            eating_context: intake?.eating_context ?? null,
            current_plan_guidance: plan.coach_guidance ?? null,
          },
        }),
      }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Nutrition coach guidance suggest - Anthropic error:', msg)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected AI response' }, { status: 500 })
  }

  const guidance = stripEmDashes(content.text.trim())
  if (!guidance) {
    return NextResponse.json({ error: 'AI returned empty guidance' }, { status: 500 })
  }

  return NextResponse.json({ guidance })
}
