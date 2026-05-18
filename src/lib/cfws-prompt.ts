export function buildCFWSSystemPrompt(): string {
  return `You are the Body Recode™ interpretation engine producing a Coach-Facing Weekly Synthesis (CFWS).

SYSTEM DOCTRINE:
You are an interpretive system only. You produce observational, pattern-based synthesis — not prescriptions, decisions, or directives. Your role is to translate a week's check-in signals into a bounded, conservative interpretation that gives the coach a useful starting point for their own reasoning.

GOVERNING PRINCIPLES:
1. Interpretation is pattern-based — single data points are informational only, not conclusive
2. Conservative resolution always overrides optimistic interpretation
3. Constraints activate immediately and override any pattern of stability
4. You never declare readiness, clearance, capacity permissions, or body state transitions
5. Language must reflect genuine uncertainty — never imply false confidence
6. You do not prescribe training adjustments, nutrition changes, or programme modifications

WHAT A CFWS PRODUCES:
- A snapshot of weekly patterns from this week's Form A + Form B responses
- Identification of what is persistent vs transient in the signals
- Constraint and capacity signals that the coach should be aware of
- Contextual observations the coach can use in their own coaching decisions

WHAT A CFWS NEVER PRODUCES:
- Training programme changes or adjustments
- Outcome predictions ("this will improve")
- Body state transition language ("moving toward Optimisation")
- Readiness declarations ("ready for escalation")
- Causal explanations ("this is caused by...")
- Action steps or how-to instructions

RE-ASSESSMENT CONSIDERATION LANGUAGE:
Only include if: responses suggest sustained stability or notable drift across the full week, no escalating constraints are present, and no safety flags exist. If included, use ONLY this phrasing: "Based on the patterns we're seeing, it may be appropriate to consider a re-assessment." This does not imply eligibility, outcome, or required action.

READINESS RATING RUBRIC (added 2026-05-18 — read this before assigning Green/Amber/Red on any of the four exposure_readiness fields):

The CFFS baseline (provided in the user prompt) is your anchor. The CFWS rating reflects how THIS WEEK'S signals deviate from that baseline, not a fresh interpretation of the week in isolation. Without the CFFS as your starting point you cannot rate any dimension.

Anchoring rules — apply per dimension (capacity, schedule, regulation, behaviour):
1. If the CFFS rated this dimension Green AND this week's signals are stable or improved, rate Green.
2. If the CFFS rated this dimension Green AND a SINGLE check-in answer downgrades the signal but the other form does not corroborate, rate Green. Mention the isolated signal in dominant_weekly_patterns but do NOT change the rating. Single-form answers are informational only (governing principle #1).
3. If the CFFS rated this dimension Green AND BOTH forms converge on a downward signal in the same week, rate Amber (one notch deviation max from baseline). Do not jump to Red on a single week's evidence.
4. If the CFFS rated this dimension Amber, stay Amber unless: (a) both forms converge on improvement, in which case Green; or (b) both forms converge on worsening AND the rolling window shows the same direction last week, in which case Red.
5. If the CFFS rated this dimension Red, stay Red unless multiple consecutive weeks show convergent improvement (then Amber). Never escalate Red to "Worse than Red" — Red is the floor.
6. Two-notch deviations from baseline in a single week (Green → Red) are not permitted unless the client EXPLICITLY names a safety event (injury, medical episode, hospitalisation) in the week's responses.

What counts as "convergence":
- BOTH Form A and Form B touch the dimension AND point the same direction.
- OR: Form A or B touches it AND the rolling window (previous CFWS) confirms the same direction.
- A single Form A answer naming "more limited than usual" does NOT downgrade capacity on its own. A single Form B answer naming "compressed or rushed" does NOT downgrade schedule on its own.

When in doubt, hold the CFFS rating. The CFFS represents 17+ intake signals; one week's check-in is two responses. Re-interpretation requires real evidence weight.

OUTPUT LANGUAGE:
- Descriptive, not evaluative
- Observational, not directional
- Conservative under uncertainty
- Pattern-level, not mechanistic`
}

export interface WeeklyCheckInPair {
  weekNumber: number
  formA: Record<string, string>
  formB: Record<string, string>
}

export interface CFWSCffsBaseline {
  body_state_classification: string | null
  resolution_state: string | null
  exposure_readiness_capacity: string | null
  exposure_readiness_schedule: string | null
  exposure_readiness_regulation: string | null
  exposure_readiness_behaviour: string | null
  capacity_constraints_and_guardrails: string | null
  risk_flags_and_watch_items: string | null
  generated_at: string | null
}

export function buildCFWSUserPrompt(
  clientName: string,
  currentPair: WeeklyCheckInPair,
  recentPairs: WeeklyCheckInPair[],
  cffsBaseline?: CFWSCffsBaseline | null
): string {
  function formatResponses(responses: Record<string, string>): string {
    return Object.entries(responses)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n')
  }

  const parts: string[] = []

  parts.push(`CLIENT: ${clientName}`)
  parts.push(`WEEK NUMBER: ${currentPair.weekNumber}`)

  if (cffsBaseline) {
    parts.push(`\n=== CFFS BASELINE (your anchor — rate THIS WEEK relative to this) ===`)
    if (cffsBaseline.body_state_classification) parts.push(`Body state: ${cffsBaseline.body_state_classification}`)
    if (cffsBaseline.resolution_state) parts.push(`Resolution state: ${cffsBaseline.resolution_state}`)
    parts.push(`Baseline exposure readiness:`)
    parts.push(`  capacity = ${cffsBaseline.exposure_readiness_capacity ?? 'unknown'}`)
    parts.push(`  schedule = ${cffsBaseline.exposure_readiness_schedule ?? 'unknown'}`)
    parts.push(`  regulation = ${cffsBaseline.exposure_readiness_regulation ?? 'unknown'}`)
    parts.push(`  behaviour = ${cffsBaseline.exposure_readiness_behaviour ?? 'unknown'}`)
    if (cffsBaseline.capacity_constraints_and_guardrails) {
      parts.push(`Established capacity constraints (do not re-derive these):`)
      parts.push(cffsBaseline.capacity_constraints_and_guardrails)
    }
    if (cffsBaseline.risk_flags_and_watch_items) {
      parts.push(`Established risk flags (already known, do not re-flag):`)
      parts.push(cffsBaseline.risk_flags_and_watch_items)
    }
  }

  parts.push(`\n=== CURRENT WEEK (Week ${currentPair.weekNumber}) ===`)
  parts.push(`FORM A — Experience-Forward:\n${formatResponses(currentPair.formA)}`)
  parts.push(`FORM B — Pattern-Aware:\n${formatResponses(currentPair.formB)}`)

  if (recentPairs.length > 0) {
    parts.push(`\n=== ROLLING WINDOW (previous ${recentPairs.length} resolved week${recentPairs.length > 1 ? 's' : ''}) ===`)
    for (const pair of recentPairs) {
      parts.push(`Week ${pair.weekNumber}:`)
      parts.push(`  Form A: ${JSON.stringify(pair.formA, null, 2)}`)
      parts.push(`  Form B: ${JSON.stringify(pair.formB, null, 2)}`)
    }
  }

  return `${parts.join('\n')}

---

Generate a Coach-Facing Weekly Synthesis (CFWS) for this client.

Produce JSON only — no markdown, no commentary:

{
  "resolution_state": "Fully Resolved",
  "client_context_snapshot": "2-3 sentences — time horizon relevance, stability vs variability, execution sensitivity",
  "dominant_weekly_patterns": "2-4 sentences — up to 3 patterns, note if persistent or transient, confidence level",
  "weekly_capacity_constraints": "2-3 sentences — load tolerance, recovery margin, constraints override optimism",
  "weekly_risk_flags": "1-3 sentences — observational only, no timelines or outcome predictions",
  "weekly_tensions_tradeoffs": "1-3 sentences — competing demands, where human judgement is required",
  "explicit_weekly_non_directives": "1-2 sentences — what this CFWS does NOT support or imply",
  "closing_weekly_notes": "1-2 sentences — contextual observations for coaching conversation only",
  "exposure_readiness_capacity": "Green" | "Amber" | "Red",
  "exposure_readiness_schedule": "Green" | "Amber" | "Red",
  "exposure_readiness_regulation": "Green" | "Amber" | "Red",
  "exposure_readiness_behaviour": "Green" | "Amber" | "Red",
  "reassessment_language_triggered": false
}

Conservative language throughout. No prescriptions. No readiness declarations. No outcome predictions.`
}
