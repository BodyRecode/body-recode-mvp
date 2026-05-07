import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 300

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json()
  const { client_id, plan_block_id } = body
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const admin = createAdminClient()

  // Fetch all context in parallel
  const [
    { data: client },
    { data: cffs },
    { data: intake },
    { data: baseline },
    { data: previousPrograms },
    { data: planBlock },
    { data: recentReviews },
  ] = await Promise.all([
    admin.from('clients').select('id, name').eq('id', client_id).maybeSingle(),
    admin.from('cffs').select('*').eq('client_id', client_id).eq('is_archived', false).maybeSingle(),
    admin.from('intakes')
      .select('id, date_of_birth, gender, primary_goal, secondary_goals, desired_timeline, subjective_motivator, training_days_available, injury_location_current, injury_location_history, injury_primary_concern, injury_aggravating_movements, training_responses, sleep_responses, stress_responses')
      .eq('client_id', client_id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from('baselines')
      .select('bodyweight_kg, captured_at')
      .eq('client_id', client_id)
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from('programs')
      .select('block_name, progression_phase, training_goal, training_frequency, training_age, week_duration, status, is_active, generated_at')
      .eq('client_id', client_id)
      .eq('status', 'active')
      .order('generated_at', { ascending: false })
      .limit(3),
    plan_block_id
      ? admin.from('plan_blocks').select('*, training_plans(plan_name, macro_objective)').eq('id', plan_block_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from('program_reviews')
      .select('direction, signal_category, adherence_confirmed, signals_noted, reviewed_at')
      .eq('client_id', client_id)
      .order('reviewed_at', { ascending: false })
      .limit(5),
  ])

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Build context for Claude
  const contextParts: string[] = []

  contextParts.push(`CLIENT: ${client.name}`)

  if (cffs) {
    contextParts.push(`
CFFS BODY STATE:
- Body state classification: ${cffs.body_state_classification}
- Resolution state: ${cffs.resolution_state}
- Capacity readiness: ${cffs.exposure_readiness_capacity}
- Schedule readiness: ${cffs.exposure_readiness_schedule}
- Regulation readiness: ${cffs.exposure_readiness_regulation}
- Behaviour readiness: ${cffs.exposure_readiness_behaviour}
- Capacity constraints: ${cffs.capacity_constraints_and_guardrails}
- Risk flags: ${cffs.risk_flags_and_watch_items}
- Client context summary: ${cffs.client_context_summary}`)
  } else {
    contextParts.push(`\nCFFS: Not available. Apply conservative defaults.`)
  }

  // Bodyweight from baseline; age derived from date_of_birth; sex from gender.
  const ageFromDob = intake?.date_of_birth
    ? Math.floor((Date.now() - new Date(intake.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  if (intake) {
    const lines: string[] = []
    if (baseline?.bodyweight_kg) lines.push(`- Bodyweight: ${baseline.bodyweight_kg}kg (from baseline ${baseline.captured_at?.slice(0, 10) ?? ''})`)
    if (ageFromDob) lines.push(`- Age: ${ageFromDob}`)
    if (intake.gender) lines.push(`- Sex: ${intake.gender}`)
    if (intake.primary_goal) lines.push(`- Primary goal: ${intake.primary_goal}`)
    if (intake.secondary_goals) lines.push(`- Secondary goals: ${intake.secondary_goals}`)
    if (intake.desired_timeline) lines.push(`- Desired timeline: ${intake.desired_timeline}`)
    if (intake.subjective_motivator) lines.push(`- What's driving this: ${intake.subjective_motivator}`)
    if (intake.training_days_available) lines.push(`- Training days available: ${intake.training_days_available}`)
    if (Array.isArray(intake.injury_location_current) && intake.injury_location_current.length) lines.push(`- Current injuries: ${intake.injury_location_current.join(', ')}`)
    else if (intake.injury_location_current) lines.push(`- Current injuries: ${intake.injury_location_current}`)
    if (intake.injury_location_history) lines.push(`- Injury history: ${intake.injury_location_history}`)
    if (intake.injury_primary_concern) lines.push(`- Primary injury concern: ${intake.injury_primary_concern}`)
    if (intake.injury_aggravating_movements) lines.push(`- Aggravating movements: ${intake.injury_aggravating_movements}`)
    if (intake.training_responses) lines.push(`- Training response blob (tr_01..tr_30, scale 0-4): ${JSON.stringify(intake.training_responses)}`)
    if (intake.sleep_responses) lines.push(`- Sleep response blob (scale 0-4): ${JSON.stringify(intake.sleep_responses)}`)
    if (intake.stress_responses) lines.push(`- Stress response blob (scale 0-4): ${JSON.stringify(intake.stress_responses)}`)
    contextParts.push(`\nINTAKE CONTEXT:\n${lines.join('\n')}`)
  } else if (baseline?.bodyweight_kg) {
    contextParts.push(`\nINTAKE CONTEXT:\n- Foundational intake not yet submitted.\n- Bodyweight (from baseline): ${baseline.bodyweight_kg}kg`)
  } else {
    contextParts.push(`\nINTAKE: Not available.`)
  }

  if (previousPrograms && previousPrograms.length > 0) {
    contextParts.push(`
PREVIOUS PROGRAMS (most recent first):
${previousPrograms.map((p, i) =>
  `${i + 1}. ${p.block_name} — ${p.progression_phase}, ${p.training_goal}, ${p.training_frequency}x/week, ${p.week_duration} weeks`
).join('\n')}`)
  } else {
    contextParts.push(`\nPREVIOUS PROGRAMS: None. This is the client's first block.`)
  }

  if (recentReviews && recentReviews.length > 0) {
    const directionLabel: Record<string, string> = { progress: 'Making progress', hold: 'Staying steady', rebuild: 'Struggling' }
    const signalLabel: Record<string, string> = {
      performance_up: 'Feeling stronger', performance_down: 'Struggling with sessions',
      stalled: 'No change', recovery_constraint: 'Recovering poorly', neutral_stable: 'Ticking along',
    }
    contextParts.push(`
RECENT TRAINING CHECK-IN HISTORY (most recent first — use this to understand how the client has been responding to training):
${recentReviews.map((r, i) => {
  const signals = r.signal_category ? r.signal_category.split(',').map((s: string) => signalLabel[s.trim()] ?? s.trim()).join(', ') : 'Not specified'
  return `${i + 1}. Direction: ${directionLabel[r.direction] ?? r.direction} | Sessions completed: ${r.adherence_confirmed ? 'Yes' : 'No'} | How training felt: ${signals}${r.signals_noted ? ` | Notes: ${r.signals_noted}` : ''}`
}).join('\n')}

If the most recent direction is Rebuild, this means the client has been struggling. Factor this heavily into the prescription — do not escalate phase or load. If multiple consecutive Rebuild entries exist, consider whether the current phase is appropriate or whether intervention is needed.`)
  }

  if (planBlock) {
    const plan = planBlock.training_plans as { plan_name: string; macro_objective: string | null } | null
    const freqLine = planBlock.training_frequency
      ? `\n- COACH-SET FREQUENCY: ${planBlock.training_frequency}x/week (the coach has explicitly set this on the macro plan — your training_frequency MUST equal ${planBlock.training_frequency} unless a Red readiness signal makes that unsafe; if you must deviate, explain why in training_frequency_reason).`
      : ''
    contextParts.push(`
MACRO PLAN CONTEXT:
- Plan: ${plan?.plan_name ?? 'Unknown'}
- Macro objective: ${plan?.macro_objective ?? 'Not specified'}
- This block: ${planBlock.block_name} — ${planBlock.progression_phase}, ${planBlock.training_goal}, ${planBlock.week_duration}w
- Phase category: ${planBlock.phase_category ?? 'Not specified'}
- Execution arc: ${planBlock.execution_arc ?? 'Not specified'}
- Phase objective: ${planBlock.phase_objective ?? 'Not specified'}${freqLine}`)
  }

  const systemPrompt = `You are the Body Recode™ Prescription Intelligence Layer. Your role is to analyse a client's full context and produce a governed prescription recommendation — with clear reasoning for every field — before program generation begins.

You are a suggestion engine. Your output is reviewed and approved by the coach before any program is generated. You are providing doctrine-grounded suggestions, not final decisions.

═══════════════════════════════════════
CROSS-PILLAR AUTHORITY ORDER (absolute — governs all prescription decisions)
═══════════════════════════════════════
1. RRS (Recovery and Regulation) — overrides all other pillars when active. Red regulation or capacity signals constrain training demand regardless of goals.
2. Fat Map Method — constraint authority, body state classification
3. BIRS (Behaviour and Identity) — complexity and pace limits
4. PTS (Progressive Training System) — training demand; you are advising within this pillar only
5. HABNS — nutrition context only; do not prescribe nutrition

When signals conflict: apply the most conservative permissible outcome. No balancing or averaging.

═══════════════════════════════════════
PHASE INTENT FRAMEWORK (Body Recode doctrine — use this to select progression_phase)
═══════════════════════════════════════
CAPACITY RESTORATION (maps to: restoration)
Intent: Stabilise the system and restore tolerance. Reduce accumulated fatigue. Restore recovery margin. Re-establish consistency.
Mandate: Performance progression is EXPLICITLY deprioritised. This phase does not build capacity — it restores it.
Training goal in this phase: capacity only (sub-threshold, movement-focused, non-progressive)
Frequency: 2–3 sessions/week maximum
Trigger: Red or compromised Regulation or Capacity readiness; active recovery debt; unresolved escalation signals; injury domain active
Must prescribe if: any Regulation or Capacity readiness signal is Red

CAPACITY BUILDING (maps to: accumulation)
Intent: Expand tolerance to load. Gradual exposure increase. Improved work capacity. Enhanced resilience.
Mandate: Progression is permitted but must remain conservative and reversible.
Training goal: capacity or strength (conservative entry); NOT hypertrophy intensification
Frequency: 3–4 sessions/week
Trigger: Amber readiness across most domains; basic stability demonstrated in prior phase; no active escalation flags
Requires: demonstrated stability from restoration phase; all readiness gate blockers absent

PERFORMANCE EXPRESSION (maps to: intensification or realization)
Intent: Allow existing capacity to surface. Expression of strength or output. Does NOT build new capacity.
Training goal: strength or hypertrophy permitted
Frequency: 3–5 sessions/week
Trigger: Green or sustained Amber readiness; recovery margins stable; no active flags; client has completed and stabilised through accumulation
Requires: all readiness gates cleared

CONSOLIDATION AND STABILITY (maps to: accumulation at maintenance)
Intent: Preserve adaptations and prevent regression. Change is intentionally limited. Reinforce habits.
Training goal: any, at maintenance demand
Frequency: 2–3 sessions/week
Use when: client is between phases, returning from hold, or managing external life stress

═══════════════════════════════════════
READINESS GATE RULES (non-negotiable — these block progression prescription)
═══════════════════════════════════════
Phase advancement is BLOCKED if any of the following are present:
- Active escalation flags or unresolved risk signals in CFFS
- Evidence of recovery debt accumulation or compensation masking fatigue
- Performance improvements driven by sympathetic dominance (apparent stability without resolution)
- Guardrail violations within the current phase
- Identity-driven or motivation-driven pressure to advance (client wants more ≠ readiness)

Disqualifying signals that automatically block prescription beyond Restoration:
- Increasing fatigue sensitivity despite stable output
- Narrowing recovery margins between sessions
- Increased reliance on stimulants or motivational effort
- Rising injury or illness frequency
- Emotional volatility linked to training outcomes
- Any Regulation readiness signal remaining Red

DEFAULT STATE IS STABILITY. Progression is permissioned, not earned or assumed. Change occurs only when explicit criteria are met.

═══════════════════════════════════════
FREQUENCY ASSIGNMENT RULES (Body Recode doctrine)
═══════════════════════════════════════
Primary variables: training age + recovery capacity + current phase + program goal + weekly availability

Frequency by session count:
- 2 sessions/week: full-body; appropriate for Restoration or heavily constrained clients
- 3 sessions/week: rotating pattern emphasis; Restoration → Accumulation transition
- 4 sessions/week: upper/lower distribution; Capacity Building phase
- 5+ sessions/week: advanced specialisation; Performance Expression phase only

Phase-based frequency ceiling:
- Restoration: 2–3x maximum (do not prescribe 4+)
- Accumulation: 3–4x typical
- Intensification/Expression: 3–5x (only if readiness gates cleared)

Training age adjustments:
- Beginner: lower frequency relative to goals; simpler pattern distribution
- Intermediate: moderate frequency, rotating patterns; double progression model
- Advanced: higher frequency possible; still governed by recovery capacity and phase

═══════════════════════════════════════
TRAINING GOAL CONSTRAINTS BY PHASE
═══════════════════════════════════════
- Restoration → capacity ONLY (sub-threshold, movement-focused)
- Accumulation → capacity or strength (conservative); hypertrophy NOT appropriate until sustained accumulation demonstrated
- Intensification → strength or hypertrophy permitted; only if all readiness gates cleared
- Realization → strength expression; short window, requires full accumulation base

═══════════════════════════════════════
REASONING REQUIREMENTS
═══════════════════════════════════════
For each field, provide a reason grounded in:
1. The client's CFFS body state and readiness signals (Red/Amber/Green per domain)
2. Their intake data (injury location, aggravating movements, training history, goals)
3. The doctrine constraints above (phase intent, readiness gates, frequency rules)
4. Previous program history if available (what phase they were in, what the result was)

If data is missing, state that and apply the conservative default with the reason. Do not optimise for what the client wants — optimise for what the system permits.

Output valid JSON only — no markdown, no commentary:
{
  "block_name": "string",
  "block_name_reason": "string",
  "progression_phase": "accumulation|intensification|realization|restoration",
  "progression_phase_reason": "string",
  "training_goal": "strength|hypertrophy|capacity",
  "training_goal_reason": "string",
  "training_frequency": number (2-6),
  "training_frequency_reason": "string",
  "training_age": "beginner|intermediate|advanced",
  "training_age_reason": "string",
  "movement_competency": "limited|developing|proficient",
  "movement_competency_reason": "string",
  "week_duration": number (2-12),
  "week_duration_reason": "string",
  "overall_rationale": "string — 3-4 sentences: what phase intent governs this prescription, what the prescription is trying to achieve, what signals are blocking escalation, and what would need to change for the next phase"
}`

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: 'user', content: contextParts.join('\n') + '\n\nGenerate the prescription suggestion. JSON only.' }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  const content = message.content[0]
  if (content.type !== 'text') return NextResponse.json({ error: 'Unexpected AI response' }, { status: 500 })

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Could not parse suggestion' }, { status: 500 })

  let suggestion
  try {
    suggestion = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'JSON parse failed' }, { status: 500 })
  }

  // If the coach has set a frequency on the macro-plan block, that's
  // authoritative — override anything Claude produced. Claude can still
  // explain the trade-off in the reason field, but the number itself is the
  // coach's call.
  if (planBlock && typeof planBlock.training_frequency === 'number') {
    const aiFreq = Number(suggestion.training_frequency)
    if (aiFreq !== planBlock.training_frequency) {
      const aiReason = suggestion.training_frequency_reason ?? ''
      suggestion.training_frequency = planBlock.training_frequency
      suggestion.training_frequency_reason = `Coach-set frequency from macro plan (${planBlock.training_frequency}x/week) takes precedence. AI initially suggested ${aiFreq}x with reasoning: ${aiReason}`
    }
  }

  return NextResponse.json({ suggestion })
}
