/**
 * Supplement suggestion engine.
 *
 * Reads everything the platform knows about a client and proposes which
 * substances from the Supplement Library are worth assigning, in what order,
 * at which tier, with a coach-facing rationale grounded in that client's own
 * signals.
 *
 * ── Design: deterministic gate, AI reasoning, deterministic validation ──
 *
 * The gate and the validator are code, not prompt. The model only ever chooses
 * from a candidate set that has already had the structurally-knowable
 * exclusions removed, and anything it returns that is not in that set is
 * dropped before the coach sees it. The model cannot invent a substance, and
 * it cannot invent a dose: doses come from the library at render time, never
 * from the model.
 *
 * What the model DOES do is the part code cannot: weigh a client's CFFS
 * narrative, medication analysis, intake scores, check-in trend and RRS state
 * together and say which two or three substances actually matter for this
 * person right now, and why.
 *
 * ── Safety posture ──
 *
 * Nothing here assigns anything. Suggestions are a shortlist for the coach,
 * who reviews and assigns on the same page. Per [[feedback_scope_of_practice]]
 * OTC/listed supplement prescribing with specific dose and timing is within a
 * Sport & Exercise Scientist's scope, so the constraint is accuracy, not
 * caution. The two hard rules the prompt enforces are: surface every relevant
 * contraindication and medication interaction rather than quietly filtering,
 * and never touch S4/S8 territory (that routes to Arete Protocol).
 *
 * Sex-specific substances are gated in code rather than left to the model,
 * because "suggest chasteberry to a male client" is a credibility failure the
 * coach should never have to catch.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  SUPPLEMENT_SUBSTANCES,
  type SupplementSubstance,
} from './supplement-substances-seed'
import {
  buildSupplementSuggestionSystemPrompt,
  buildSupplementSuggestionUserPrompt,
  type SuggestionClientPicture,
} from './supplement-suggestion-prompt'
import { extractFirstJsonObject } from './extract-json'
import { AI_MODELS } from './ai-models'
import { getActiveConstraintManifest } from './recovery-state-machine'
import { RECOVERY_PROTOCOLS } from './recovery-protocols-seed'
import { INTAKE_SECTIONS } from './intake-questions'
import { summarizeScaleSection } from './cffs-prompt'

export type SuggestedTier = 'essential' | 'enhanced' | 'elite'

export interface SupplementSuggestion {
  slug: string
  name: string
  recommendedTier: SuggestedTier
  /** Why this substance for this client right now. Coach-facing. */
  rationale: string
  /** What the coach should check or monitor before/after assigning. */
  watch: string
  confidence: 'high' | 'moderate' | 'low'
}

export interface SupplementNotNow {
  slug: string
  name: string
  reason: string
}

export interface SuggestionSuccess {
  ok: true
  suggestions: SupplementSuggestion[]
  notNow: SupplementNotNow[]
  /** One-paragraph read of the client's supplement picture as a whole. */
  overview: string
  /** Substances removed by the deterministic gate, with why. */
  gated: Array<{ slug: string; name: string; reason: string }>
  attempts: number
}

export interface SuggestionFailure {
  ok: false
  error: string
  attempts: number
}

export type SuggestionResult = SuggestionSuccess | SuggestionFailure

const MAX_ATTEMPTS = 2
const MAX_SUGGESTIONS = 6

/* ============================================================
 * Deterministic gate
 * ============================================================ */

/**
 * Female-coded and male-coded answers seen in `intakes.gender`. The field is
 * free-ish text, so match generously and fail OPEN: an unrecognised value
 * leaves sex-specific substances in the candidate set with the ambiguity
 * flagged to the model, rather than silently hiding options.
 */
function readSex(gender: string | null): 'female' | 'male' | 'unknown' {
  const g = (gender ?? '').trim().toLowerCase()
  if (!g) return 'unknown'
  if (/^(f|female|woman|women)\b/.test(g)) return 'female'
  if (/^(m|male|man|men)\b/.test(g)) return 'male'
  return 'unknown'
}

export interface GateResult {
  candidates: SupplementSubstance[]
  gated: Array<{ slug: string; name: string; reason: string }>
}

/**
 * Remove substances the coach should never be shown for this client.
 *
 * Only structurally-certain exclusions belong here. Clinical judgement
 * (medication interactions, condition-specific contraindications) stays with
 * the model and the coach, because those need the client's full picture and a
 * blunt keyword filter would both over- and under-fire.
 */
export function gateCandidates(input: {
  sex: 'female' | 'male' | 'unknown'
  activeSlugs: string[]
}): GateResult {
  const gated: GateResult['gated'] = []
  const candidates: SupplementSubstance[] = []

  for (const s of SUPPLEMENT_SUBSTANCES) {
    if (input.activeSlugs.includes(s.slug)) {
      gated.push({ slug: s.slug, name: s.name, reason: 'Already assigned and active' })
      continue
    }
    if (s.category === 'womens_specific' && input.sex === 'male') {
      gated.push({ slug: s.slug, name: s.name, reason: 'Women-specific substance, client recorded as male' })
      continue
    }
    if (s.category === 'mens_specific' && input.sex === 'female') {
      gated.push({ slug: s.slug, name: s.name, reason: 'Men-specific substance, client recorded as female' })
      continue
    }
    candidates.push(s)
  }

  return { candidates, gated }
}

/* ============================================================
 * Client picture assembly
 * ============================================================ */

function ageFrom(dob: string | null): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const ms = Date.now() - d.getTime()
  const years = Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25))
  return years > 0 && years < 120 ? years : null
}

/**
 * Render the intake's five scored domains (training, nutrition, schedule,
 * sleep, stress, supplement) the same way the CFFS prompt does, so the
 * suggestion engine reads the same numbers the state classification was
 * built on.
 */
function renderIntakeScores(intake: Record<string, unknown>): string {
  const sectionResponseKeys: Record<string, string> = {
    training: 'training_responses',
    nutrition: 'nutrition_responses',
    schedule: 'schedule_responses',
    sleep: 'sleep_responses',
    stress: 'stress_responses',
    supplement: 'supplement_responses',
  }
  const parts: string[] = []
  for (const section of INTAKE_SECTIONS) {
    const dbKey = sectionResponseKeys[section.id]
    if (!dbKey) continue
    const responses = (intake[dbKey] as Record<string, number>) || {}
    const summary = summarizeScaleSection(section.title, responses, section.questions)
    if (summary === 'No data provided') continue
    parts.push(`${section.title}:\n${summary}`)
  }
  return parts.join('\n\n')
}

/* ============================================================
 * Generator
 * ============================================================ */

export async function generateSupplementSuggestions(
  admin: SupabaseClient,
  clientId: string
): Promise<SuggestionResult> {
  const { data: client } = await admin
    .from('clients')
    .select('id, name, date_of_birth, medications, medications_analysis, pattern, recovery_equipment_access')
    .eq('id', clientId)
    .maybeSingle()

  if (!client) return { ok: false, error: 'Client not found', attempts: 0 }

  const [
    { data: intake },
    { data: cffsRows },
    { data: cfwsRows },
    { data: checkinRows },
    { data: assignmentRows },
    { data: protocolRows },
    { data: panelRows },
    { data: nutritionPlan },
    rrsState,
  ] = await Promise.all([
    admin
      .from('intakes')
      .select('*')
      .eq('client_id', clientId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('cffs')
      .select('body_state_classification, resolution_state, client_context_summary, primary_patterns_and_signals, capacity_constraints_and_guardrails, risk_flags_and_watch_items, exposure_readiness_capacity, exposure_readiness_regulation, exposure_readiness_behaviour')
      .eq('client_id', clientId)
      .eq('is_archived', false)
      .order('generated_at', { ascending: false })
      .limit(1),
    admin
      .from('cfws')
      .select('week_number, dominant_weekly_patterns, weekly_capacity_constraints, weekly_risk_flags, exposure_readiness_capacity, exposure_readiness_regulation, exposure_readiness_behaviour')
      .eq('client_id', clientId)
      .eq('is_archived', false)
      .order('generated_at', { ascending: false })
      .limit(2),
    admin
      .from('weekly_checkins')
      .select('week_number, form_type, submitted_at, responses')
      .eq('client_id', clientId)
      .order('submitted_at', { ascending: false })
      .limit(3),
    admin
      .from('supplement_assignments')
      .select('substance_slug, status, coach_note')
      .eq('client_id', clientId),
    admin
      .from('recovery_protocol_assignments')
      .select('protocol_slug')
      .eq('client_id', clientId)
      .eq('status', 'active'),
    admin
      .from('blood_panels')
      .select('collected_on, markers, panel_summary')
      .eq('client_id', clientId)
      .eq('approved_for_plan', true)
      .order('submitted_at', { ascending: false })
      .limit(1),
    admin
      .from('nutrition_plans')
      .select('plan_name, meal_frequency, protein_anchor_g, estimated_calorie_band, key_priorities')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .maybeSingle(),
    getActiveConstraintManifest(clientId),
  ])

  const assignments = assignmentRows ?? []
  const activeSlugs = assignments.filter(a => a.status === 'active').map(a => a.substance_slug)
  const pastSlugs = assignments.filter(a => a.status !== 'active').map(a => a.substance_slug)

  const sex = readSex((intake?.gender as string | null) ?? null)
  const { candidates, gated } = gateCandidates({ sex, activeSlugs })

  if (candidates.length === 0) {
    return {
      ok: true,
      suggestions: [],
      notNow: [],
      overview: 'Every substance in the library is either already assigned to this client or gated out. Nothing left to suggest.',
      gated,
      attempts: 0,
    }
  }

  const cffs = cffsRows?.[0] ?? null

  const picture: SuggestionClientPicture = {
    firstName: client.name?.split(' ')[0] ?? 'the client',
    age: ageFrom(client.date_of_birth ?? null),
    sex,
    pattern: client.pattern ?? null,
    bodyState: cffs?.body_state_classification ?? null,
    resolutionState: cffs?.resolution_state ?? null,
    cffsContextSummary: cffs?.client_context_summary ?? null,
    cffsPatterns: cffs?.primary_patterns_and_signals ?? null,
    cffsConstraints: cffs?.capacity_constraints_and_guardrails ?? null,
    cffsRiskFlags: cffs?.risk_flags_and_watch_items ?? null,
    readiness: cffs
      ? {
          capacity: cffs.exposure_readiness_capacity ?? null,
          regulation: cffs.exposure_readiness_regulation ?? null,
          behaviour: cffs.exposure_readiness_behaviour ?? null,
        }
      : null,
    medications: client.medications ?? null,
    medicationsAnalysis: client.medications_analysis ?? null,
    dietaryRestrictions: (intake?.dietary_restrictions as string | null) ?? null,
    dietaryPreferences: (intake?.dietary_preferences as string | null) ?? null,
    typicalDayEating: (intake?.typical_day_eating as string | null) ?? null,
    caffeineIntake: (intake?.caffeine_intake as string | null) ?? null,
    alcoholIntake: (intake?.alcohol_intake as string | null) ?? null,
    fluidIntake: (intake?.fluid_intake as string | null) ?? null,
    primaryGoal: (intake?.primary_goal as string | null) ?? null,
    intakeScores: intake ? renderIntakeScores(intake as Record<string, unknown>) : null,
    cfws: (cfwsRows ?? []).map(r => ({
      weekNumber: r.week_number,
      dominantPatterns: r.dominant_weekly_patterns,
      capacityConstraints: r.weekly_capacity_constraints,
      riskFlags: r.weekly_risk_flags,
    })),
    recentCheckins: (checkinRows ?? []).map(r => ({
      weekNumber: r.week_number,
      formType: r.form_type as 'A' | 'B',
      responses: (r.responses ?? {}) as Record<string, string>,
    })),
    bloodPanel: panelRows?.[0]
      ? {
          collectedOn: (panelRows[0].collected_on as string | null) ?? null,
          summary: (panelRows[0].panel_summary as string | null) ?? null,
          markers: Array.isArray(panelRows[0].markers) ? panelRows[0].markers : null,
        }
      : null,
    nutritionPlan: nutritionPlan
      ? {
          planName: nutritionPlan.plan_name ?? null,
          mealFrequency: nutritionPlan.meal_frequency ?? null,
          proteinAnchorG: nutritionPlan.protein_anchor_g ?? null,
          calorieBand: nutritionPlan.estimated_calorie_band ?? null,
          keyPriorities: Array.isArray(nutritionPlan.key_priorities) ? nutritionPlan.key_priorities : null,
        }
      : null,
    rrs: rrsState
      ? {
          playbookName: rrsState.playbook.name,
          purpose: rrsState.playbook.purpose,
          daysActive: rrsState.state.days_active,
        }
      : null,
    activeProtocols: (protocolRows ?? []).flatMap(r => {
      const p = RECOVERY_PROTOCOLS.find(x => x.slug === r.protocol_slug)
      return p ? [p.name] : []
    }),
    alreadyAssigned: activeSlugs.flatMap(slug => {
      const s = SUPPLEMENT_SUBSTANCES.find(x => x.slug === slug)
      return s ? [s.name] : []
    }),
    previouslyTried: pastSlugs.flatMap(slug => {
      const s = SUPPLEMENT_SUBSTANCES.find(x => x.slug === slug)
      return s ? [s.name] : []
    }),
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: 'ANTHROPIC_API_KEY not configured', attempts: 0 }
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 3 })

  const conversation: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'user', content: buildSupplementSuggestionUserPrompt(picture, candidates) },
  ]

  const candidateSlugs = new Set(candidates.map(c => c.slug))
  let attempts = 0
  let lastError = 'unknown'

  while (attempts < MAX_ATTEMPTS) {
    attempts++

    let message
    try {
      // Clinical tier per ai-models.ts: a wrong suggestion reaches a client's
      // body via a coach who acted on it. The whole point of this surface is
      // holding medications, contraindications, bloods, state and trend
      // together in one pass, which is exactly the reasoning-under-load case
      // that tier exists for.
      //
      // Token budget: this reasons over a whole client file before it writes,
      // and the first build at 4000 spent the entire budget thinking and
      // returned no text block at all. 16000 leaves room for the reasoning
      // plus the JSON, and we escalate once on max_tokens the same way the
      // medications analyser does.
      message = await anthropic.messages.create({
        model: AI_MODELS.clinical,
        max_tokens: 16000,
        system: buildSupplementSuggestionSystemPrompt(),
        messages: conversation,
      })
      if (message.stop_reason === 'max_tokens') {
        console.warn('[supplement-suggestions] hit max_tokens at 16000, retrying at 32000')
        message = await anthropic.messages.create({
          model: AI_MODELS.clinical,
          max_tokens: 32000,
          system: buildSupplementSuggestionSystemPrompt(),
          messages: conversation,
        })
      }
    } catch (err) {
      return { ok: false, error: `AI error: ${err instanceof Error ? err.message : String(err)}`, attempts }
    }

    const content = message.content.find(b => b.type === 'text')
    if (!content || content.type !== 'text') {
      // No text block means the whole budget went to reasoning. Say so plainly
      // rather than the old opaque "Unexpected response from AI".
      lastError = message.stop_reason === 'max_tokens'
        ? 'Model ran out of output budget before writing the suggestions'
        : `No text returned (stop_reason: ${message.stop_reason})`
      continue
    }

    const jsonText = extractFirstJsonObject(content.text)
    if (!jsonText) {
      lastError = `Could not parse suggestions. AI returned: ${content.text.slice(0, 160)}`
      continue
    }

    let parsed: {
      overview?: unknown
      suggestions?: unknown
      not_now?: unknown
    }
    try {
      parsed = JSON.parse(jsonText)
    } catch (err) {
      lastError = `Invalid JSON from AI: ${(err as Error).message}`
      continue
    }

    const rawSuggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : []
    const suggestions: SupplementSuggestion[] = []
    const rejected: string[] = []

    for (const raw of rawSuggestions) {
      const r = raw as Record<string, unknown>
      const slug = typeof r.slug === 'string' ? r.slug : null
      if (!slug || !candidateSlugs.has(slug)) {
        if (slug) rejected.push(slug)
        continue
      }
      const substance = SUPPLEMENT_SUBSTANCES.find(s => s.slug === slug)!
      const tier = typeof r.recommended_tier === 'string' ? r.recommended_tier.toLowerCase() : ''
      if (tier !== 'essential' && tier !== 'enhanced' && tier !== 'elite') {
        rejected.push(`${slug} (bad tier "${tier}")`)
        continue
      }
      const rationale = typeof r.rationale === 'string' ? r.rationale.trim() : ''
      if (!rationale) {
        rejected.push(`${slug} (no rationale)`)
        continue
      }
      const conf = typeof r.confidence === 'string' ? r.confidence.toLowerCase() : 'moderate'
      suggestions.push({
        slug,
        name: substance.name,
        recommendedTier: tier,
        rationale,
        watch: typeof r.watch === 'string' ? r.watch.trim() : '',
        confidence: conf === 'high' || conf === 'low' ? conf : 'moderate',
      })
    }

    // A hallucinated or out-of-set slug means the model was not working from
    // the candidate list. Retry once with the rejects named; on the last
    // attempt keep whatever validated rather than failing the coach entirely.
    if (rejected.length > 0 && attempts < MAX_ATTEMPTS) {
      conversation.push({ role: 'assistant', content: jsonText })
      conversation.push({
        role: 'user',
        content: `These entries were rejected because the slug is not in the candidate list, the tier was not one of essential/enhanced/elite, or the rationale was empty: ${rejected.join(', ')}. Every slug MUST come from the candidate list exactly as written. Return the corrected JSON only, no commentary.`,
      })
      lastError = `Rejected slugs: ${rejected.join(', ')}`
      continue
    }

    if (suggestions.length === 0) {
      lastError = 'No valid suggestions returned'
      if (attempts < MAX_ATTEMPTS) continue
    }

    const notNow: SupplementNotNow[] = (Array.isArray(parsed.not_now) ? parsed.not_now : []).flatMap(raw => {
      const r = raw as Record<string, unknown>
      const slug = typeof r.slug === 'string' ? r.slug : null
      if (!slug) return []
      const substance = SUPPLEMENT_SUBSTANCES.find(s => s.slug === slug)
      if (!substance) return []
      return [{
        slug,
        name: substance.name,
        reason: typeof r.reason === 'string' ? r.reason.trim() : 'No reason given',
      }]
    })

    return {
      ok: true,
      suggestions: suggestions.slice(0, MAX_SUGGESTIONS),
      notNow,
      overview: typeof parsed.overview === 'string' ? parsed.overview.trim() : '',
      gated,
      attempts,
    }
  }

  return { ok: false, error: `Could not produce suggestions after ${MAX_ATTEMPTS} attempts (${lastError})`, attempts }
}
