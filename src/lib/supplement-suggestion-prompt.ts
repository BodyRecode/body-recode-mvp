/**
 * Supplement suggestion prompt builders.
 *
 * Coach-facing output. Nothing here reaches a client directly, so the
 * client-facing vocabulary ban does not apply and internal terms (CFFS, body
 * state, readiness) are used freely. What DOES apply is honesty discipline:
 * this output exists to help Kade decide, and a suggestion dressed up beyond
 * its evidence is worse than no suggestion.
 *
 * The model chooses from a fixed candidate list supplied in the user prompt.
 * It never sees the dosing tiers as something to modify: doses are rendered
 * from the library at display time. It picks WHICH substance and WHICH tier,
 * and it writes the reasoning.
 */
import type { SupplementSubstance } from './supplement-substances-seed'

export interface SuggestionClientPicture {
  firstName: string
  age: number | null
  sex: 'female' | 'male' | 'unknown'
  pattern: string | null
  bodyState: string | null
  resolutionState: string | null
  cffsContextSummary: string | null
  cffsPatterns: string | null
  cffsConstraints: string | null
  cffsRiskFlags: string | null
  readiness: { capacity: string | null; regulation: string | null; behaviour: string | null } | null
  medications: string | null
  medicationsAnalysis: unknown
  dietaryRestrictions: string | null
  dietaryPreferences: string | null
  typicalDayEating: string | null
  caffeineIntake: string | null
  alcoholIntake: string | null
  fluidIntake: string | null
  primaryGoal: string | null
  intakeScores: string | null
  cfws: Array<{
    weekNumber: number | null
    dominantPatterns: string | null
    capacityConstraints: string | null
    riskFlags: string | null
  }>
  recentCheckins: Array<{ weekNumber: number; formType: 'A' | 'B'; responses: Record<string, string> }>
  bloodPanel: { collectedOn: string | null; summary: string | null; markers: unknown[] | null } | null
  nutritionPlan: {
    planName: string | null
    mealFrequency: number | null
    proteinAnchorG: number | null
    calorieBand: string | null
    keyPriorities: string[] | null
  } | null
  rrs: { playbookName: string; purpose: string; daysActive: number } | null
  activeProtocols: string[]
  alreadyAssigned: string[]
  previouslyTried: string[]
}

/**
 * The substance seed carries full deep-research content (the file is ~600KB).
 * Rendering all of it for 28 candidates cost 180k input tokens and crowded out
 * the model's reasoning budget. The coach reads the full record in the UI; the
 * model only needs enough to choose well, so each field is clipped on a
 * sentence boundary where possible.
 *
 * Contraindications are NEVER clipped. They are the safety-critical field and
 * a truncated contraindication is worse than none.
 */
function clip(text: string, max: number): string {
  const t = (text ?? '').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const lastStop = cut.lastIndexOf('. ')
  return (lastStop > max * 0.6 ? cut.slice(0, lastStop + 1) : cut.trimEnd() + '…')
}

export function buildSupplementSuggestionSystemPrompt(): string {
  return `You are the Body Recode supplement reasoning engine. You advise KADE, the coach. Your output is read by him on a coach-only dashboard and never reaches the client. He reviews every suggestion and decides what, if anything, gets assigned.

YOUR JOB:
Given everything the platform knows about one client, decide which substances from the supplied candidate list are worth assigning to THIS client RIGHT NOW, rank them, pick a starting tier for each, and explain the reasoning in terms of that client's own signals.

WHAT MAKES A GOOD SUGGESTION:
- It is anchored in something specific and observable about this client. Name the signal. "Sleep domain averaging 2.4/4 with 'wakes between 2 and 4am' at 3/4, against a stress domain at 3.1" is a reason. "Supports sleep quality" is not.
- It answers "why now" and not just "why ever". Most substances in the library are defensible for most people. The question is what is actually load-bearing for this client this month.
- It respects sequencing. A client whose meal rhythm has collapsed does not need a fourth supplement, they need the meals. Say so rather than suggesting something to fill the slot.
- It is honest about effect size. Where the evidence is small, modest or context-dependent, the coach doctrine field in the candidate list will say so. Carry that honesty into your rationale. Do not inflate.

HARD RULES:
1. SLUGS. Every substance you suggest MUST be chosen from the candidate list by its exact slug. You may not suggest anything outside that list. There is no exception. A slug that is not on the list will be discarded before Kade sees it.
2. NO DOSING. Never state a dose, an amount, a form, or a timing. The library holds the exact protocol for each tier and it is rendered next to your rationale. Your job is which substance and which tier, not how much. If a dose appears in your output it is a defect.
3. MEDICATIONS. Read the client's medications and, where present, the medication analysis. If a candidate has any interaction, additive effect or monitoring implication with something the client takes, you must NAME IT in the watch field. Surface it, do not silently drop the suggestion: Kade needs to see what you saw. If the interaction makes the substance genuinely unsuitable, put it in not_now with the interaction as the reason.
4. CONTRAINDICATIONS. Each candidate carries a contraindications list. Check every one against what you know about this client. Anything that fires goes in the watch field or in not_now.
5. SCOPE. This library is over-the-counter and listed complementary medicines only. Never suggest, imply or reference prescription-only substances, hormones, peptides or anabolic compounds. Those route elsewhere and are not your concern.
6. NOT A DIAGNOSIS. You may say a marker or a pattern is consistent with something worth supporting. You may not diagnose, name a disease, or state that a substance treats a condition. Where a blood marker is meaningfully out of range, the correct move is to say it belongs with the client's GP, not to supplement around it silently.
7. VOLUME. Between two and five suggestions. Fewer is better than padding. If the honest answer is one substance, suggest one. If the honest answer is none, return an empty suggestions array and say why in the overview.
8. NO EM DASHES anywhere in your output. Use commas, periods, or rewrite.

TIER SELECTION:
Each candidate has three tiers. Essential is the cheapest working form at an evidenced dose. Enhanced is the preferred form and an optimised dose. Elite is the advanced protocol. Read the "fits_client_profile" line on each tier, then pick based on what this client's picture actually supports: their commitment level, how long they have been consistent, whether the goal needs the advanced protocol or whether the basic one does the job. Do not default to Enhanced. A new client with an unstable routine starts Essential. Defaulting everyone to the middle tier is the failure mode here.

WHAT TO WEIGH, IN ROUGH ORDER:
1. Medications and contraindications. These are gates, not factors.
2. The CFFS: body state, primary patterns, capacity constraints, risk flags. This is the deepest read on the client.
3. Bloods, where a panel exists. A marker out of range is the strongest single signal you will get. No panel means no marker-driven suggestion; say the panel would change the answer if it would.
4. The intake domain scores. Elevated signals at 3 or 4 out of 4 are where the client themselves said something is wrong.
5. The recovery state, if one is active. A client the system has put under a recovery constraint is not a client to load up with performance substances.
6. Recent check-in trend. What is actually moving week to week.
7. Diet and intake context. A restriction or a framework can create a genuine gap. It can also make a suggestion pointless.
8. What is already assigned. Do not suggest something that duplicates or stacks badly with an active assignment. Do not re-suggest something they tried and came off without saying why it is worth another go.

NOT_NOW:
Use this for substances a thoughtful coach would expect to see on the list and would wonder why they are missing. A one-line reason each. This is where you show your work. Two to five entries is right. Do not list the whole library.

OUTPUT FORMAT:
Return ONLY a single JSON object, no preamble, no markdown fences.

{
  "overview": "string. One paragraph, 60-120 words. The supplement picture for this client as a whole: what the stack is trying to do, what the constraint is, what would change the answer. Written to Kade.",
  "suggestions": [
    {
      "slug": "exact-slug-from-candidate-list",
      "recommended_tier": "essential" | "enhanced" | "elite",
      "rationale": "string, 40-90 words. Why this substance for this client now, naming the specific signals.",
      "watch": "string, 15-50 words. Contraindications that apply, medication interactions, what to monitor, or what would make you change the recommendation. Empty string only if genuinely nothing applies.",
      "confidence": "high" | "moderate" | "low"
    }
  ],
  "not_now": [
    { "slug": "exact-slug", "reason": "string, one line" }
  ]
}

Order suggestions by priority, highest first.`
}

export function buildSupplementSuggestionUserPrompt(
  p: SuggestionClientPicture,
  candidates: SupplementSubstance[]
): string {
  const lines: string[] = []

  lines.push('CLIENT')
  lines.push(`Name: ${p.firstName}`)
  if (p.age != null) lines.push(`Age: ${p.age}`)
  lines.push(`Sex: ${p.sex === 'unknown' ? 'not recorded (do not assume; if a sex-specific substance would otherwise fit, say the sex needs confirming)' : p.sex}`)
  if (p.pattern) lines.push(`Fat Map pattern: ${p.pattern}`)
  if (p.primaryGoal) lines.push(`Primary goal: ${p.primaryGoal}`)
  lines.push('')

  lines.push('MEDICATIONS')
  lines.push(p.medications?.trim() ? p.medications.trim() : 'None recorded.')
  if (p.medicationsAnalysis) {
    lines.push('')
    lines.push('Medication analysis on file (the platform\'s own read of how these interact with training, recovery and nutrition):')
    lines.push(JSON.stringify(p.medicationsAnalysis))
  }
  lines.push('')

  if (p.bodyState || p.cffsContextSummary || p.cffsPatterns || p.cffsRiskFlags) {
    lines.push('FOUNDATIONAL SYNTHESIS (CFFS)')
    if (p.bodyState) lines.push(`Body state: ${p.bodyState}`)
    if (p.resolutionState) lines.push(`Resolution state: ${p.resolutionState}`)
    if (p.readiness) {
      lines.push(`Exposure readiness: capacity ${p.readiness.capacity ?? '-'}, regulation ${p.readiness.regulation ?? '-'}, behaviour ${p.readiness.behaviour ?? '-'}`)
    }
    if (p.cffsContextSummary) lines.push(`Context summary:\n${p.cffsContextSummary}`)
    if (p.cffsPatterns) lines.push(`Primary patterns and signals:\n${p.cffsPatterns}`)
    if (p.cffsConstraints) lines.push(`Capacity constraints and guardrails:\n${p.cffsConstraints}`)
    if (p.cffsRiskFlags) lines.push(`Risk flags and watch items:\n${p.cffsRiskFlags}`)
    lines.push('')
  } else {
    lines.push('FOUNDATIONAL SYNTHESIS (CFFS): none on file. Suggest conservatively and say what a CFFS would change.')
    lines.push('')
  }

  if (p.bloodPanel) {
    lines.push('BLOOD PANEL (most recent coach-approved)')
    if (p.bloodPanel.collectedOn) lines.push(`Collected: ${p.bloodPanel.collectedOn}`)
    if (p.bloodPanel.summary) lines.push(`Summary: ${p.bloodPanel.summary}`)
    if (p.bloodPanel.markers) {
      lines.push('Markers (use the lab reference range supplied with each; a value outside it is a hypothesis, not a diagnosis):')
      lines.push(JSON.stringify(p.bloodPanel.markers))
    }
    lines.push('')
  } else {
    lines.push('BLOOD PANEL: none approved on file. Do not infer marker status. If a panel would change your recommendation, say so in the overview.')
    lines.push('')
  }

  if (p.intakeScores) {
    lines.push('INTAKE DOMAIN SCORES (0-4 per question; elevated means the client reported a problem)')
    lines.push(p.intakeScores)
    lines.push('')
  }

  const dietary: string[] = []
  if (p.dietaryRestrictions) dietary.push(`Restrictions (allergies, intolerances, medical): ${p.dietaryRestrictions}`)
  if (p.dietaryPreferences) dietary.push(`Preferences / framework: ${p.dietaryPreferences}`)
  if (p.typicalDayEating) dietary.push(`Typical day's eating: ${p.typicalDayEating}`)
  if (p.caffeineIntake) dietary.push(`Caffeine: ${p.caffeineIntake}`)
  if (p.alcoholIntake) dietary.push(`Alcohol: ${p.alcoholIntake}`)
  if (p.fluidIntake) dietary.push(`Fluids: ${p.fluidIntake}`)
  if (dietary.length > 0) {
    lines.push('DIETARY CONTEXT')
    lines.push(dietary.join('\n'))
    lines.push('')
  }

  if (p.nutritionPlan) {
    lines.push('ACTIVE NUTRITION PLAN')
    if (p.nutritionPlan.planName) lines.push(`Plan: ${p.nutritionPlan.planName}`)
    if (p.nutritionPlan.mealFrequency != null) lines.push(`Meals per day: ${p.nutritionPlan.mealFrequency}`)
    if (p.nutritionPlan.proteinAnchorG != null) lines.push(`Protein anchor: ${p.nutritionPlan.proteinAnchorG}g/day`)
    if (p.nutritionPlan.calorieBand) lines.push(`Calorie band: ${p.nutritionPlan.calorieBand}`)
    if (p.nutritionPlan.keyPriorities?.length) {
      for (const k of p.nutritionPlan.keyPriorities) lines.push(`  - ${k}`)
    }
    lines.push('')
  } else {
    lines.push('ACTIVE NUTRITION PLAN: none. A client with no nutrition plan usually needs the plan before the stack; weigh that.')
    lines.push('')
  }

  if (p.rrs) {
    lines.push('ACTIVE RECOVERY STATE (RRS constraint governor)')
    lines.push(`${p.rrs.playbookName}, active ${p.rrs.daysActive} days. ${p.rrs.purpose}`)
    lines.push('The system is currently constraining this client\'s training and nutrition. Weight recovery and regulation support over performance substances while this is active.')
    lines.push('')
  }

  if (p.activeProtocols.length > 0) {
    lines.push(`RECOVERY PROTOCOLS ALREADY ASSIGNED: ${p.activeProtocols.join(', ')}`)
    lines.push('')
  }

  if (p.cfws.length > 0) {
    lines.push('RECENT WEEKLY SYNTHESES (most recent first)')
    for (const c of p.cfws) {
      lines.push(`--- Week ${c.weekNumber ?? '?'}`)
      if (c.dominantPatterns) lines.push(`Dominant patterns: ${c.dominantPatterns}`)
      if (c.capacityConstraints) lines.push(`Capacity constraints: ${c.capacityConstraints}`)
      if (c.riskFlags) lines.push(`Risk flags: ${c.riskFlags}`)
    }
    lines.push('')
  }

  if (p.recentCheckins.length > 0) {
    lines.push('RECENT CHECK-IN ANSWERS (most recent first)')
    for (const c of p.recentCheckins) {
      lines.push(`--- Week ${c.weekNumber} Form ${c.formType}`)
      for (const [k, v] of Object.entries(c.responses)) {
        if (!v || !String(v).trim()) continue
        lines.push(`${k}: ${v}`)
      }
    }
    lines.push('')
  }

  if (p.alreadyAssigned.length > 0) {
    lines.push(`ALREADY ASSIGNED AND ACTIVE (excluded from the candidate list, do not re-suggest): ${p.alreadyAssigned.join(', ')}`)
  }
  if (p.previouslyTried.length > 0) {
    lines.push(`PREVIOUSLY ASSIGNED, NOW PAUSED OR COMPLETED: ${p.previouslyTried.join(', ')}`)
  }
  if (p.alreadyAssigned.length > 0 || p.previouslyTried.length > 0) lines.push('')

  lines.push('CANDIDATE SUBSTANCES')
  lines.push(`${candidates.length} substances. You may ONLY suggest from this list, by exact slug.`)
  lines.push('')
  for (const c of candidates) {
    lines.push(`### ${c.slug}`)
    lines.push(`${c.name} (${c.category}). ${c.short_description}`)
    lines.push(`Does: ${clip(c.what_it_does, 420)}`)
    lines.push(`Contraindications: ${c.contraindications.length > 0 ? c.contraindications.join(' | ') : 'none listed'}`)
    lines.push(`Safety: ${clip(c.safety_notes, 320)}`)
    lines.push(`Doctrine (evidence honesty, read before writing a rationale): ${clip(c.coach_doctrine, 620)}`)
    lines.push(`Tier fit: essential = ${clip(c.tiers.essential.fits_client_profile, 180)} | enhanced = ${clip(c.tiers.enhanced.fits_client_profile, 180)} | elite = ${clip(c.tiers.elite.fits_client_profile, 180)}`)
    lines.push('')
  }

  lines.push('TASK')
  lines.push(`Produce the supplement suggestion set for ${p.firstName}. Return JSON only.`)

  return lines.join('\n')
}
