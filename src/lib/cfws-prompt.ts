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

export function buildCFWSUserPrompt(
  clientName: string,
  currentPair: WeeklyCheckInPair,
  recentPairs: WeeklyCheckInPair[]
): string {
  function formatResponses(responses: Record<string, string>): string {
    return Object.entries(responses)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n')
  }

  const parts: string[] = []

  parts.push(`CLIENT: ${clientName}`)
  parts.push(`WEEK NUMBER: ${currentPair.weekNumber}`)

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
