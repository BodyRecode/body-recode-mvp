/**
 * Recovery plan suggestion engine.
 *
 * The twin of `supplement-suggestions.ts`, for the Recovery Protocol library.
 *
 * ── Why this exists on top of rrs-protocol-suggestions.ts ──
 *
 * `rrs-protocol-suggestions.ts` is a deterministic table keyed on RRS playbook
 * state. It is correct and it stays: when the governor has put a client into a
 * state, that state dictates what is and is not safe, and a lookup table is
 * the right tool for a discrete input.
 *
 * But it only fires when a state is ACTIVE. Two clients have ever entered one.
 * For everybody else the coach recovery page offers no guidance at all, which
 * is a large part of why the library sat at zero assignments for four weeks.
 *
 * This engine works from the whole client file with or without an RRS state,
 * and where a state IS active it treats the RRS table as a hard input rather
 * than re-deriving it: the state's `do_not_suggest` list is removed in code
 * before the model sees the library, and its `suggested_protocol_slugs` are
 * marked as doctrine-preferred in the prompt.
 *
 * ── Gate / reason / validate, same as supplements ──
 *
 * Gate (code):     equipment the client does not have, already-assigned,
 *                  RRS contraindications, SBST level-skipping.
 * Reason (model):  which protocols matter for this client now, and why.
 * Validate (code): every slug must be in the candidate set.
 *
 * The model never writes dosing. Frequency, duration and timing render from
 * the library beside the rationale, exactly as with supplements.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  RECOVERY_PROTOCOLS,
  type EquipmentTag,
  type RecoveryProtocol,
} from './recovery-protocols-seed'
import { getSuggestionsForState } from './rrs-protocol-suggestions'
import type { RecoveryPlaybookId } from './recovery-doctrine'
import { getActiveConstraintManifest } from './recovery-state-machine'
import {
  buildRecoveryPlanSystemPrompt,
  buildRecoveryPlanUserPrompt,
  type RecoveryClientPicture,
} from './recovery-plan-suggestion-prompt'
import { extractFirstJsonObject } from './extract-json'
import { AI_MODELS } from './ai-models'
import { INTAKE_SECTIONS } from './intake-questions'
import { summarizeScaleSection } from './cffs-prompt'

export interface RecoverySuggestion {
  slug: string
  name: string
  rationale: string
  watch: string
  confidence: 'high' | 'moderate' | 'low'
}

export interface RecoveryNotNow {
  slug: string
  name: string
  reason: string
}

export interface RecoverySuggestionSuccess {
  ok: true
  overview: string
  suggestions: RecoverySuggestion[]
  notNow: RecoveryNotNow[]
  gated: Array<{ slug: string; name: string; reason: string }>
  /** Present when the client is in an RRS state, so the UI can show the tie-in. */
  rrsNote: string | null
  attempts: number
}

export interface RecoverySuggestionFailure {
  ok: false
  error: string
  attempts: number
}

export type RecoverySuggestionResult = RecoverySuggestionSuccess | RecoverySuggestionFailure

const MAX_ATTEMPTS = 2
const MAX_SUGGESTIONS = 6

/* ============================================================
 * Deterministic gate
 * ============================================================ */

export interface RecoveryGateInput {
  access: EquipmentTag[]
  activeSlugs: string[]
  /** Active RRS playbook, if any. Drives the safety-negative removal. */
  playbookId: RecoveryPlaybookId | null
}

/**
 * Strip everything the coach must never be offered for this client.
 *
 * Four rules, all of them things a model should not be trusted to remember
 * every single time:
 *
 *  1. Equipment. A cryo protocol for a client with no cryo access is noise.
 *  2. Already assigned.
 *  3. RRS safety negatives. `do_not_suggest` on the active state is the
 *     doctrine's explicit "this will hurt them right now" list, e.g. cold
 *     exposure and Wim Hof breathing during nervous-system overload.
 *  4. SBST level-skipping. Per 13D_16, the sleep-breathing tools are a strict
 *     progression: never offer level 2 or 3 unless the level below it has
 *     been tried. Plus the state-specific SBST action: 'remove' means the
 *     whole group is off the table.
 */
export function gateRecoveryCandidates(input: RecoveryGateInput): {
  candidates: RecoveryProtocol[]
  gated: Array<{ slug: string; name: string; reason: string }>
} {
  const gated: Array<{ slug: string; name: string; reason: string }> = []
  const candidates: RecoveryProtocol[] = []

  const rrs = input.playbookId ? getSuggestionsForState(input.playbookId) : null
  const doNotSuggest = new Set(rrs?.do_not_suggest ?? [])
  const sbstAction = rrs?.sbst_action ?? null

  // Which SBST levels are already in play. Level N is only offerable when
  // every level below it has been assigned at some point.
  const assignedSbstLevels = new Set(
    RECOVERY_PROTOCOLS
      .filter(p => p.progression?.group === 'sbst' && input.activeSlugs.includes(p.slug))
      .map(p => p.progression!.level)
  )

  for (const p of RECOVERY_PROTOCOLS) {
    if (input.activeSlugs.includes(p.slug)) {
      gated.push({ slug: p.slug, name: p.name, reason: 'Already assigned and active' })
      continue
    }

    const needsEquipment = p.required_equipment.filter(e => e !== 'none_needed')
    if (needsEquipment.length > 0 && !needsEquipment.every(e => input.access.includes(e))) {
      gated.push({ slug: p.slug, name: p.name, reason: 'Client has no access to the required equipment' })
      continue
    }

    if (doNotSuggest.has(p.slug)) {
      gated.push({
        slug: p.slug,
        name: p.name,
        reason: `Contraindicated while in the ${rrs!.playbook_id.replace(/_/g, ' ')} recovery state`,
      })
      continue
    }

    if (p.progression?.group === 'sbst') {
      if (sbstAction === 'remove') {
        gated.push({ slug: p.slug, name: p.name, reason: 'Sleep breathing tools must be removed entirely in this recovery state (13D_16 sec 15)' })
        continue
      }
      if (sbstAction === 'deprioritise') {
        gated.push({ slug: p.slug, name: p.name, reason: 'Sleep breathing tools are deprioritised in this recovery state (13D_16 sec 15)' })
        continue
      }
      const level = p.progression.level
      const lowerLevelsTried = Array.from({ length: level - 1 }, (_, i) => i + 1)
        .every(l => assignedSbstLevels.has(l as 1 | 2 | 3))
      if (!lowerLevelsTried) {
        gated.push({
          slug: p.slug,
          name: p.name,
          reason: `Level ${level} of a strict progression; levels below it have not been tried yet (13D_16, never skip levels)`,
        })
        continue
      }
    }

    candidates.push(p)
  }

  return { candidates, gated }
}

/* ============================================================
 * Generator
 * ============================================================ */

function renderIntakeScores(intake: Record<string, unknown>): string {
  const keys: Record<string, string> = {
    training: 'training_responses',
    nutrition: 'nutrition_responses',
    schedule: 'schedule_responses',
    sleep: 'sleep_responses',
    stress: 'stress_responses',
    supplement: 'supplement_responses',
  }
  const parts: string[] = []
  for (const section of INTAKE_SECTIONS) {
    const dbKey = keys[section.id]
    if (!dbKey) continue
    const responses = (intake[dbKey] as Record<string, number>) || {}
    const summary = summarizeScaleSection(section.title, responses, section.questions)
    if (summary === 'No data provided') continue
    parts.push(`${section.title}:\n${summary}`)
  }
  return parts.join('\n\n')
}

export async function generateRecoveryPlanSuggestions(
  admin: SupabaseClient,
  clientId: string
): Promise<RecoverySuggestionResult> {
  const { data: client } = await admin
    .from('clients')
    .select('id, name, recovery_equipment_access, medications, pattern')
    .eq('id', clientId)
    .maybeSingle()

  if (!client) return { ok: false, error: 'Client not found', attempts: 0 }

  const [
    { data: intake },
    { data: cffsRows },
    { data: cfwsRows },
    { data: checkinRows },
    { data: assignmentRows },
    { data: program },
    rrsState,
  ] = await Promise.all([
    admin.from('intakes').select('*').eq('client_id', clientId).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
    admin
      .from('cffs')
      .select('body_state_classification, resolution_state, client_context_summary, primary_patterns_and_signals, capacity_constraints_and_guardrails, risk_flags_and_watch_items, exposure_readiness_capacity, exposure_readiness_regulation, exposure_readiness_behaviour')
      .eq('client_id', clientId)
      .eq('is_archived', false)
      .order('generated_at', { ascending: false })
      .limit(1),
    admin
      .from('cfws')
      .select('week_number, dominant_weekly_patterns, weekly_capacity_constraints, weekly_risk_flags')
      .eq('client_id', clientId)
      .eq('is_archived', false)
      .order('generated_at', { ascending: false })
      .limit(2),
    admin
      .from('weekly_checkins')
      .select('week_number, form_type, responses')
      .eq('client_id', clientId)
      .order('submitted_at', { ascending: false })
      .limit(3),
    admin.from('recovery_protocol_assignments').select('protocol_slug, status').eq('client_id', clientId),
    admin
      .from('programs')
      .select('block_name, training_frequency, training_goal, conditioning')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .maybeSingle(),
    getActiveConstraintManifest(clientId),
  ])

  const assignments = assignmentRows ?? []
  const activeSlugs = assignments.filter(a => a.status === 'active').map(a => a.protocol_slug)
  const pastSlugs = assignments.filter(a => a.status !== 'active').map(a => a.protocol_slug)

  const access = (Array.isArray(client.recovery_equipment_access) ? client.recovery_equipment_access : []) as EquipmentTag[]
  const playbookId = (rrsState?.playbook.id as RecoveryPlaybookId | undefined) ?? null
  const { candidates, gated } = gateRecoveryCandidates({ access, activeSlugs, playbookId })

  if (candidates.length === 0) {
    const noEquipment = access.length === 0
    return {
      ok: true,
      overview: noEquipment
        ? 'No equipment access has been tagged for this client yet, so every protocol that needs kit is filtered out. Tag their home and gym access above and run this again.'
        : 'Every protocol this client can access is either already assigned or ruled out by their current recovery state. Nothing left to suggest.',
      suggestions: [],
      notNow: [],
      gated,
      rrsNote: null,
      attempts: 0,
    }
  }

  const cffs = cffsRows?.[0] ?? null
  const rrsTable = playbookId ? getSuggestionsForState(playbookId) : null

  const picture: RecoveryClientPicture = {
    firstName: client.name?.split(' ')[0] ?? 'the client',
    pattern: client.pattern ?? null,
    medications: client.medications ?? null,
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
    program: program
      ? {
          blockName: program.block_name ?? null,
          sessionsPerWeek: program.training_frequency ?? null,
          trainingGoal: program.training_goal ?? null,
          conditioning: program.conditioning ?? null,
        }
      : null,
    rrs: rrsState && rrsTable
      ? {
          playbookName: rrsState.playbook.name,
          purpose: rrsState.playbook.purpose,
          daysActive: rrsState.state.days_active,
          doctrineRationale: rrsTable.rationale,
          doctrinePreferred: rrsTable.suggested_protocol_slugs.filter(s => candidates.some(c => c.slug === s)),
          sbstAction: rrsTable.sbst_action,
        }
      : null,
    equipmentAccess: access,
    alreadyAssigned: activeSlugs.flatMap(s => {
      const p = RECOVERY_PROTOCOLS.find(x => x.slug === s)
      return p ? [p.name] : []
    }),
    previouslyTried: pastSlugs.flatMap(s => {
      const p = RECOVERY_PROTOCOLS.find(x => x.slug === s)
      return p ? [p.name] : []
    }),
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: 'ANTHROPIC_API_KEY not configured', attempts: 0 }
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 3 })

  const conversation: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'user', content: buildRecoveryPlanUserPrompt(picture, candidates) },
  ]
  const candidateSlugs = new Set(candidates.map(c => c.slug))
  let attempts = 0
  let lastError = 'unknown'

  while (attempts < MAX_ATTEMPTS) {
    attempts++
    let message
    try {
      // Clinical tier, same reasoning as the supplement engine: a wrong
      // protocol reaches a client's body via a coach who acted on it, and
      // cold exposure or intense breathwork on a dysregulated client is a
      // real harm, not a wasted retry.
      message = await anthropic.messages.create({
        model: AI_MODELS.clinical,
        max_tokens: 16000,
        system: buildRecoveryPlanSystemPrompt(),
        messages: conversation,
      })
      if (message.stop_reason === 'max_tokens') {
        console.warn('[recovery-suggestions] hit max_tokens at 16000, retrying at 32000')
        message = await anthropic.messages.create({
          model: AI_MODELS.clinical,
          max_tokens: 32000,
          system: buildRecoveryPlanSystemPrompt(),
          messages: conversation,
        })
      }
    } catch (err) {
      return { ok: false, error: `AI error: ${err instanceof Error ? err.message : String(err)}`, attempts }
    }

    const content = message.content.find(b => b.type === 'text')
    if (!content || content.type !== 'text') {
      lastError = message.stop_reason === 'max_tokens'
        ? 'Model ran out of output budget before writing the plan'
        : `No text returned (stop_reason: ${message.stop_reason})`
      continue
    }

    const jsonText = extractFirstJsonObject(content.text)
    if (!jsonText) {
      lastError = `Could not parse plan. AI returned: ${content.text.slice(0, 160)}`
      continue
    }

    let parsed: { overview?: unknown; suggestions?: unknown; not_now?: unknown }
    try {
      parsed = JSON.parse(jsonText)
    } catch (err) {
      lastError = `Invalid JSON from AI: ${(err as Error).message}`
      continue
    }

    const suggestions: RecoverySuggestion[] = []
    const rejected: string[] = []
    for (const raw of Array.isArray(parsed.suggestions) ? parsed.suggestions : []) {
      const r = raw as Record<string, unknown>
      const slug = typeof r.slug === 'string' ? r.slug : null
      if (!slug || !candidateSlugs.has(slug)) {
        if (slug) rejected.push(slug)
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
        name: RECOVERY_PROTOCOLS.find(p => p.slug === slug)!.name,
        rationale,
        watch: typeof r.watch === 'string' ? r.watch.trim() : '',
        confidence: conf === 'high' || conf === 'low' ? conf : 'moderate',
      })
    }

    if (rejected.length > 0 && attempts < MAX_ATTEMPTS) {
      conversation.push({ role: 'assistant', content: jsonText })
      conversation.push({
        role: 'user',
        content: `These entries were rejected because the slug is not in the candidate list or the rationale was empty: ${rejected.join(', ')}. Every slug MUST come from the candidate list exactly as written. Return the corrected JSON only, no commentary.`,
      })
      lastError = `Rejected slugs: ${rejected.join(', ')}`
      continue
    }

    if (suggestions.length === 0 && attempts < MAX_ATTEMPTS) {
      lastError = 'No valid suggestions returned'
      continue
    }

    const notNow: RecoveryNotNow[] = (Array.isArray(parsed.not_now) ? parsed.not_now : []).flatMap(raw => {
      const r = raw as Record<string, unknown>
      const slug = typeof r.slug === 'string' ? r.slug : null
      if (!slug) return []
      const p = RECOVERY_PROTOCOLS.find(x => x.slug === slug)
      if (!p) return []
      return [{ slug, name: p.name, reason: typeof r.reason === 'string' ? r.reason.trim() : 'No reason given' }]
    })

    return {
      ok: true,
      overview: typeof parsed.overview === 'string' ? parsed.overview.trim() : '',
      suggestions: suggestions.slice(0, MAX_SUGGESTIONS),
      notNow,
      gated,
      rrsNote: picture.rrs
        ? `In ${picture.rrs.playbookName} for ${picture.rrs.daysActive} days. ${picture.rrs.doctrineRationale}`
        : null,
      attempts,
    }
  }

  return { ok: false, error: `Could not produce a plan after ${MAX_ATTEMPTS} attempts (${lastError})`, attempts }
}
