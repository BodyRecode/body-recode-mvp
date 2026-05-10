import { Intake } from '@/types'
import { INTAKE_SECTIONS, Question } from '@/lib/intake-questions'

export function buildCFFSSystemPrompt(): string {
  return `You are the Body Recode™ interpretation engine — a governed AI system that produces Coach-Facing Foundational Syntheses (CFFS).

SYSTEM DOCTRINE:
You are an interpretive system only. You do not prescribe, optimise, or direct execution. Your role is to translate structured intake signals into a bounded, honest, conservative interpretation of the client's current body state.

GOVERNING PRINCIPLES:
1. Interpretation is pattern-based, never event-based
2. Meaning emerges only from convergence across multiple signal domains
3. Fat storage is concluded only at long-arc classification — never from single signals
4. Conservative resolution always overrides optimistic interpretation
5. You never declare readiness, clearance, or execution directives
6. Language must signal uncertainty where it exists — never imply false confidence

THE FAT MAP METHOD:
You interpret biological expression through 4 Macro Zones:
- Stress Belt: sustained stress load, bracing, regulatory compression (cortisol-dominant)
- Gut and Bloat: digestive rhythm disruption, internal pressure, fluid dynamics
- Hip and Thigh: long-arc conservation behaviour, energy availability, structural loading
- Upper Body Stress Response: sympathetic load, tension patterns, altered breathing

Each zone is interpreted through 4 internal pillars:
1. Spatial Patterning (where expression appears)
2. Temporal Behaviour (short/mid/long arc)
3. Regulatory Load (nervous system, stress, recovery capacity)
4. Resource Availability (energy, nutrition, sleep, predictability)

ADAPTATION ARCS:
- Short-arc (hours/days): informational only — no structural conclusions
- Mid-arc (weeks): preferred coping strategies — coaching awareness
- Long-arc (months): only level where fat storage conclusions are valid

BODY STATE CLASSIFICATIONS:
- Remediation: regulatory system under stress, needs stabilisation before any escalation
- Optimisation: system stable enough to build and progress
- Post-Optimisation: long-arc performance phase, system resilient

OUTPUT REQUIREMENTS:
You must produce all 7 sections. Language must be:
- Descriptive, not evaluative
- Non-prescriptive
- Conservative under uncertainty
- Pattern-level, not mechanistic

PROHIBITED IN OUTPUT:
- Training programs, workout prescriptions, set/rep/load recommendations
- Meal plans, calorie targets, macro prescriptions
- Diagnostic labels or medical language
- Readiness declarations or clearance statements
- Causal explanations ("this is caused by...")
- Optimisation targets or outcome promises
- Instructions or how-to guidance`
}

function summarizeScaleSection(
  sectionTitle: string,
  responses: Record<string, number>,
  questions: Question[]
): string {
  const scaleQuestions = questions.filter(q => q.type === 'scale')
  const scored = scaleQuestions
    .map(q => ({ text: q.text, score: responses[q.id] }))
    .filter(x => x.score !== undefined && x.score !== null)

  if (scored.length === 0) return 'No data provided'

  const avg = scored.reduce((s, x) => s + x.score, 0) / scored.length
  const elevated = scored.filter(x => x.score >= 3)
  const low = scored.filter(x => x.score <= 1)

  const lines: string[] = [`Average: ${avg.toFixed(1)}/4 (n=${scored.length})`]

  if (elevated.length > 0) {
    lines.push(`Elevated signals (≥3/4):`)
    elevated.forEach(x => lines.push(`  • ${x.text} — ${x.score}/4`))
  }
  if (low.length > 0) {
    lines.push(`Low signals (≤1/4):`)
    low.forEach(x => lines.push(`  • ${x.text} — ${x.score}/4`))
  }

  return lines.join('\n')
}

export function buildCFFSUserPrompt(intake: Partial<Intake>): string {
  const sectionResponseKeys: Record<string, keyof Intake> = {
    fat_map: 'fat_map_responses',
    injury: 'injury_responses',
    training: 'training_responses',
    nutrition: 'nutrition_responses',
    schedule: 'schedule_responses',
    sleep: 'sleep_responses',
    stress: 'stress_responses',
    supplement: 'supplement_responses',
  }

  const parts: string[] = []

  // Identity
  parts.push(`CLIENT PROFILE:
Name: ${intake.full_name || 'Not provided'}
Date of birth: ${intake.date_of_birth || 'Not provided'}
Gender: ${intake.gender || 'Not provided'}
Occupation: ${intake.occupation || 'Not provided'}`)

  // Scale sections
  for (const section of INTAKE_SECTIONS) {
    const dbKey = sectionResponseKeys[section.id]
    if (!dbKey) continue

    const responses = (intake[dbKey] as Record<string, number>) || {}
    const summary = summarizeScaleSection(section.title, responses, section.questions)
    parts.push(`\n${section.title}:\n${summary}`)
  }

  // Injury detail
  parts.push(`\nINJURY & PAIN DETAIL:
Current pain locations: ${(intake.injury_location_current || []).join(', ') || 'None reported'}
Historical injury locations: ${(intake.injury_location_history || []).join(', ') || 'None reported'}
Primary concern: ${intake.injury_primary_concern || 'None declared'}
Aggravating movements: ${intake.injury_aggravating_movements || 'None declared'}`)

  // Goals
  parts.push(`\nGOAL DECLARATION:
Primary goal: ${intake.primary_goal || 'Not specified'}
Secondary goals: ${intake.secondary_goals || 'None'}
Timeline: ${intake.desired_timeline || 'Not specified'}
Motivation: "${intake.subjective_motivator || 'Not provided'}"`)

  return `Generate a Coach-Facing Foundational Synthesis (CFFS) for the following client.

${parts.join('\n')}

---

Produce the CFFS as JSON only — no markdown, no commentary:

{
  "body_state_classification": "Remediation" | "Optimisation" | "Post-Optimisation",
  "resolution_state": "Fully Resolved" | "Partially Resolved" | "Unresolved",
  "client_context_summary": "3-5 sentences",
  "primary_patterns_and_signals": "3-5 sentences",
  "capacity_constraints_and_guardrails": "3-5 sentences",
  "risk_flags_and_watch_items": "3-5 sentences",
  "tensions_and_tradeoffs": "3-5 sentences",
  "explicit_non_directives": "3-5 sentences",
  "closing_interpretive_notes": "3-5 sentences",
  "exposure_readiness_capacity": "Green" | "Amber" | "Red",
  "exposure_readiness_schedule": "Green" | "Amber" | "Red",
  "exposure_readiness_regulation": "Green" | "Amber" | "Red",
  "exposure_readiness_behaviour": "Green" | "Amber" | "Red"
}

DO NOT INCLUDE a "reassessment_flagged" field. Reassessment is a temporal
construct governed by Signal Monitoring v1.0: it can only be evaluated once
longitudinal CFWS data exists (multi-week signal patterns, completed program
blocks, sustained instability across consecutive weeks, the 12-week cap).
At intake-time CFFS generation there is no trajectory to evaluate, so the
field is set by the system separately and your output must omit it entirely.

Conservative language throughout. No prescriptions. No causal claims. No diagnostic labels.`
}
