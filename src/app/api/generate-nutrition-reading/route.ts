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
import { withTemporalContext } from '@/lib/temporal-context'
import { AI_MODELS } from '@/lib/ai-models'

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

  // Banned-terms aware retry loop, same shape as generate-program-reading
  // and generate-client-reading. Pre-2026-06-22 was single-shot and would
  // hand the failure back to the coach the moment any leak hit; with the
  // 2026-06-09 banned list including most physiology vocabulary, that
  // single-shot was unreliable on nutrition readings that lean on biology.
  const { auditClientReadingFields } = await import('@/lib/banned-client-terms')
  const required = [
    'nr_why_this_plan',
    'nr_what_this_nutrition_is_doing',
    'nr_how_well_know_its_working',
    'nr_what_were_not_doing_yet',
    'nr_coach_note',
  ] as const
  const conversation: { role: 'user' | 'assistant'; content: string }[] = [
    {
      role: 'user',
      content: buildNutritionReadingUserPrompt(
        frContext,
        planContext,
        { name: client.name },
        plan.nr_coach_guidance ?? null
      ),
    },
  ]
  let cleaned: Record<string, string> | null = null
  let leaksSeen: string[] = []
  let lastError: string | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    let message
    try {
      message = await anthropic.messages.create({
        model: AI_MODELS.structural,
        max_tokens: 12000,
        system: withTemporalContext(buildNutritionReadingSystemPrompt()),
        messages: conversation,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Anthropic API error (nutrition reading):', msg)
      return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
    }

    const content = message.content[0]
    if (!content || content.type !== 'text') {
      lastError = 'Unexpected response from AI'
      continue
    }

    // Truncated mid-object: the JSON never closed, so parsing will fail. Retry
    // rather than feeding a garbled half-object into extraction. (2026-07-11)
    if (message.stop_reason === 'max_tokens') {
      lastError = 'AI output was truncated at the 12000-token limit'
      console.warn('[nutrition-reading] output truncated, retrying')
      continue
    }

    const jsonText = extractFirstJsonObject(content.text)
    if (!jsonText) {
      lastError = `Could not parse reading. AI returned: ${content.text.slice(0, 120)}`
      continue
    }

    let reading: Record<string, unknown>
    try {
      reading = JSON.parse(jsonText)
    } catch (err) {
      lastError = `JSON parse failed: ${(err as Error).message}`
      continue
    }

    const missing = required.filter(k => typeof reading[k] !== 'string' || !(reading[k] as string).trim())
    if (missing.length > 0) {
      lastError = `Missing required sections: ${missing.join(', ')}`
      continue
    }

    const audit = auditClientReadingFields(reading as Record<string, string>, required as unknown as string[])

    // Partner-specific banned phrase check (Mode A+ overlay). Additive to
    // the platform-wide audit; feeds into the same retry loop.
    const { findPartnerBannedPhrase } = await import('@/lib/doctrine-parameters')
    const partnerLeaks: string[] = []
    for (const key of required) {
      const val = (reading as Record<string, unknown>)[key]
      if (typeof val !== 'string') continue
      const hit = findPartnerBannedPhrase(val)
      if (hit && !partnerLeaks.includes(hit)) partnerLeaks.push(hit)
    }

    if (audit.ok && partnerLeaks.length === 0) {
      // Apply partner terminology substitutions post-audit (Mode A+ overlay).
      // No-op for BR (empty substitutions map). For a tenant with configured
      // substitutions, rewrites "from => to" case-insensitively.
      const { applyPartnerTerminology } = await import('@/lib/doctrine-parameters')
      const rewritten: Record<string, string> = {}
      for (const [k, v] of Object.entries(audit.cleaned as Record<string, string>)) {
        rewritten[k] = applyPartnerTerminology(v)
      }
      cleaned = rewritten
      break
    }

    const allLeaks = [...audit.leaks, ...partnerLeaks]
    leaksSeen = Array.from(new Set([...leaksSeen, ...allLeaks].map(t => t.toLowerCase())))
    if (attempt < 3) {
      conversation.push({ role: 'assistant', content: jsonText })
      conversation.push({
        role: 'user',
        content: `That draft contained internal terminology the client has never seen and the system will reject. These terms must not appear anywhere in the output: ${allLeaks.map(t => `"${t}"`).join(', ')}. Rewrite the entire JSON object using ONLY plain client-facing words to express the same idea. Return only the corrected JSON, no commentary.`,
      })
      lastError = `Leaked: ${allLeaks.join(', ')}`
    }
  }

  if (!cleaned) {
    return NextResponse.json(
      {
        error: `Reading leaked internal terminology after 3 attempts (${leaksSeen.length ? leaksSeen.join(', ') : lastError ?? 'unknown'}). Click Regenerate to try a fresh start.`,
      },
      { status: 500 }
    )
  }

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
      nutrition_reading_doctrine_version: DOCTRINE_VERSIONS.nutrition_reading,
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
