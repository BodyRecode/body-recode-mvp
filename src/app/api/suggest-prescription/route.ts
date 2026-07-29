import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { withTemporalContext } from '@/lib/temporal-context'

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
    admin.from('clients').select('id, name, medications').eq('id', client_id).maybeSingle(),
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

  if (client.medications) {
    contextParts.push(`\nMEDICATIONS (CRITICAL — may include hormonal-class drugs that modulate recovery and load tolerance, or non-hormonal drugs that affect signal interpretation or adaptation):\n${client.medications}`)
  }

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
Frequency: 2–3 sessions/week default; up to 4 if training age is advanced AND coach has explicitly set the frequency
Trigger: Red or compromised Regulation or Capacity readiness; active recovery debt; unresolved escalation signals; injury domain active
Must prescribe if: any Regulation or Capacity readiness signal is Red

═══════════════════════════════════════
TRAINING AGE MODULATION (within Restoration — CRITICAL)
═══════════════════════════════════════
Restoration phase INTENT is constant for everyone: recovery-protective, no PR attempts, no novel high-CNS lifts, no failure work, structured rest, conservative novelty. That intent is preserved through exercise selection (machines, supported, bilateral), not by gutting the load.

The THRESHOLD of "sub-maximal" however MUST scale with training age. An advanced trainer's sub-threshold is an intermediate's moderate. Get this wrong in either direction:
- Too light for an advanced trainer → they detrain inside 2 weeks AND quit. We lose the client.
- Too heavy for a beginner → CNS overload, regulation drops further, injury risk.

═══════════════════════════════════════
HOW TO CLASSIFY training_age (READ FIRST — this is where the engine goes wrong)
═══════════════════════════════════════
Classify training_age from the client's DEMONSTRATED TRAINING HISTORY, not from how they present right now. It describes who they ARE as a trainer, read from the intake: years of structured training, established compound lifts, tolerance to real load, endurance/competitive background.
- ADVANCED: multiple years of consistent structured RESISTANCE training, established lifts, demonstrated tolerance to real external load. A client who has trained hard for years is ADVANCED even if they are currently deconditioned, stressed, injured, or dysregulated.

ENDURANCE HISTORY IS NOT RESISTANCE TRAINING AGE. training_age sets the RPE ceiling and volume floor for LOADED resistance work, so it must be read from resistance history specifically. Someone who completes distance events has demonstrated aerobic and connective-tissue tolerance for THAT activity, and that tells you nothing about their tolerance to external load through a barbell or dumbbell. A client who has walked or run distance events for years but has never trained with weights is a BEGINNER for training_age, however impressive the endurance history. Record the endurance history in conditioning tolerance instead, where it belongs and where it is genuinely informative.
(The error this prevents: a 52-year-old who had completed a 28km event six times, and had never done structured resistance training, was classified ADVANCED and prescribed RPE 8 primaries in a Restoration block against a live sacroiliac injury.)
- INTERMEDIATE: roughly 1–3 years consistent training, competent with the main movement patterns, some load history.
- BEGINNER: genuinely new to structured training, or a long lay-off with no established lifts.

CRITICAL — REGULATION STATE DOES NOT CHANGE TRAINING AGE. A Red regulation gate or a Remediation body state means the client's SYSTEM needs settling. It does NOT make an experienced trainer a beginner. Red / Remediation lower the PHASE (restoration), the INTENSITY (RPE ceiling), and the PROGRESSION — they must NEVER lower the training_age classification or the per-session volume floor. Do NOT downgrade an advanced or intermediate trainer just because they present stressed, deconditioned, or Red. Classify their history; let the phase and RPE ceiling carry all the caution. (Historically the engine has under-classified nearly every Red/Remediation client — that is the exact error to stop.)
When history is genuinely ambiguous, default UPWARD, never downward.

Calibration by training age:

BEGINNER / DEVELOPING competency
- RPE ceiling: 5–6 (sub-threshold genuinely)
- Working sets per session: 6–9
- Exercise selection: machines, supported, bilateral only
- Reasoning: System needs space to learn movement patterns AND recover. They have no maintenance threshold to lose.

INTERMEDIATE competency
- RPE ceiling: 6–7
- Working sets per session: 9–12
- Exercise selection: mixed machine/free-weight, bilateral primary
- Reasoning: Maintenance for this profile is moderate. Sub-threshold here means RPE 6–7, not RPE 4.

ADVANCED / PROFICIENT competency (years of structured training, demonstrated load tolerance, established lifts)
- RPE ceiling: 7–8
- Working sets per session: 12–16
- Exercise selection: free-weight emphasis with appropriate safety; machine variants where injury constraints demand
- Reasoning: An advanced trainer's "sub-threshold" sits where an intermediate's "moderate" sits. Below RPE 6 they will detrain. The phase intent is preserved by avoiding PRs, novel CNS work, and progressive overload — NOT by gutting volume or load. Protect the conditioning they took years to build; that's the asset Restoration is supposed to preserve, not erase.

When training_age is unclear from the data, default UPWARD on this scale, not downward. The cost of mis-calibrating low (client detrains and quits) is far higher than mis-calibrating high (client gets one slightly heavier session, regulation drops marginally, you adjust on review).

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
MEDICATIONS MODULATION (CRITICAL when present)
═══════════════════════════════════════
If the MEDICATIONS section in the client context is populated, parse it for hormonal-class signals AND for non-hormonal categories that affect training interpretation. Both shape the prescription, in different ways.

HORMONAL-CLASS modulation (elevates recovery / load tolerance / protein synthesis above training age alone):
- TRT / exogenous testosterone (within physiological range): treat training-age tolerance as +1 step (intermediate prescriptions can sit closer to advanced thresholds; advanced trainers can sustain more weekly volume without recovery debt).
- Supraphysiological androgen support: treat as advanced regardless of training age for load tolerance; primary RPE ceiling can sit at 8 in any non-Restoration phase, 7–8 in Restoration. Volume per session can sit at the upper bound of the relevant range. Recovery debt accrues more slowly; do not apply the standard recovery-debt accumulation watch criteria as tightly.
- GLP-1 in deficit: protein anchor floor stays at 2.0g/kg minimum. Training prescription does NOT scale up — energy availability is constrained even if recovery is intact.

NON-HORMONAL category awareness (these do NOT shift training age but DO shape interpretation and selection):
- Beta-blockers (e.g. metoprolol, bisoprolol, propranolol, atenolol): heart-rate response is blunted. Do not use HR-derived intensity targets or heart-rate-based readiness signals. RPE is the only reliable load gauge. Conditioning prescription should anchor to pace, breath, and perceived exertion only.
- SSRIs / SNRIs (e.g. sertraline, escitalopram, venlafaxine, duloxetine): affect signal in check-ins may be flattened; HRV is often suppressed independent of actual readiness. Trust behavioural and performance signals over reported mood or HRV trends.
- Stimulants (ADHD meds: methylphenidate, amphetamine derivatives; or therapeutic doses of similar): elevate baseline HR and may mask early fatigue. Apply slightly more conservative recovery margins; do not push to the upper bound of volume on the assumption that the client "feels fine".
- Chronic NSAIDs (daily ibuprofen, naproxen, diclofenac): blunt hypertrophic adaptation and may mask pain that would normally signal a problem. Note this in rationale; do not increase volume to compensate; encourage exposure-graded loading rather than mid-block jumps.
- Anticoagulants (warfarin, apixaban, rivaroxaban, dabigatran): contact and impact must be avoided. Exercise selection should default to controlled, machine-and-cable-led movement rather than free-weight balance challenges or anything ballistic.
- Corticosteroids (prednisone, prednisolone, dexamethasone — oral or sustained): connective-tissue tolerance is compromised. Reduce eccentric demand, avoid maximal loading on single-joint exercises, prioritise tissue-tolerant movement patterns. Fluid retention may distort bodyweight readings.
- Statins: small but real risk of myalgia. If the client reports new muscle soreness inconsistent with the prescribed work, flag for review rather than progressing through it.
- Combined contraceptives / HRT in females: cycle interpretation in CFFS may not apply. Be cautious calling something a "cycle phase signal" if exogenous hormones are setting the pattern.

These modulators do not bypass readiness gates (Red regulation still requires Restoration intent). They calibrate the THRESHOLD inside the chosen phase. Sub-threshold for a TRT-supported advanced trainer is not the same load as sub-threshold for an unsupported beginner. Sub-threshold for a beta-blocker user means RPE alone, never HR.

Always reference the medications text directly in training_age_reason and overall_rationale so the coach can audit the calibration. If the medications field contains drugs that are not addressed by these rules, surface them in the rationale and treat them as informational rather than ignoring them.

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

  // Retry loop + truncation guard (2026-07-11), matching generate-cffs.
  // Previously single-shot at 6000 tokens with no truncation detection. Now:
  // 12k cap, max_tokens detection, empty-content guard, progression_phase
  // present check, 3 attempts.
  const MAX_TOKENS = 12000
  let suggestion = null
  let lastError = 'unknown error'

  for (let attempt = 1; attempt <= 3; attempt++) {
    let message
    try {
      message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: MAX_TOKENS,
        system: withTemporalContext(systemPrompt),
        messages: [{ role: 'user', content: contextParts.join('\n') + '\n\nGenerate the prescription suggestion. JSON only.' }],
      })
    } catch (err) {
      lastError = `AI error: ${err instanceof Error ? err.message : String(err)}`
      console.error(`[suggest-prescription] Anthropic API error (attempt ${attempt}/3):`, lastError)
      continue
    }

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      lastError = `AI returned no text content (stop_reason=${message.stop_reason})`
      console.warn(`[suggest-prescription] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    if (message.stop_reason === 'max_tokens') {
      lastError = `AI output was truncated at the ${MAX_TOKENS}-token limit`
      console.warn(`[suggest-prescription] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    const jsonText = extractFirstJsonObject(textBlock.text)
    if (!jsonText) {
      lastError = `Could not locate a JSON object in AI output: ${textBlock.text.slice(0, 200)}`
      console.warn(`[suggest-prescription] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    let candidate
    try {
      candidate = JSON.parse(jsonText)
    } catch (err) {
      lastError = `JSON parse failed: ${(err as Error).message}`
      console.warn(`[suggest-prescription] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    if (typeof candidate.progression_phase !== 'string' || !candidate.progression_phase.trim()) {
      lastError = 'AI output missing progression_phase'
      console.warn(`[suggest-prescription] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    suggestion = candidate
    break
  }

  if (!suggestion) {
    console.error('[suggest-prescription] generation failed after 3 attempts:', lastError)
    return NextResponse.json(
      { error: `Prescription suggestion failed after 3 attempts (${lastError}). Please try again.` },
      { status: 500 }
    )
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
