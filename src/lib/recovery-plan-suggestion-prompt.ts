/**
 * Recovery plan suggestion prompt builders. Coach-facing, same discipline as
 * the supplement engine: internal vocabulary is fine, inflation is not.
 *
 * The model picks WHICH protocols from a pre-gated candidate list. It never
 * writes dosing: frequency, duration and timing render from the library.
 */
import type { EquipmentTag, RecoveryProtocol } from './recovery-protocols-seed'
import type { SbstAction } from './rrs-protocol-suggestions'

export interface RecoveryClientPicture {
  firstName: string
  pattern: string | null
  medications: string | null
  bodyState: string | null
  resolutionState: string | null
  cffsContextSummary: string | null
  cffsPatterns: string | null
  cffsConstraints: string | null
  cffsRiskFlags: string | null
  readiness: { capacity: string | null; regulation: string | null; behaviour: string | null } | null
  intakeScores: string | null
  cfws: Array<{
    weekNumber: number | null
    dominantPatterns: string | null
    capacityConstraints: string | null
    riskFlags: string | null
  }>
  recentCheckins: Array<{ weekNumber: number; formType: 'A' | 'B'; responses: Record<string, string> }>
  program: {
    blockName: string | null
    sessionsPerWeek: number | null
    trainingGoal: string | null
    conditioning: string | null
  } | null
  rrs: {
    playbookName: string
    purpose: string
    daysActive: number
    doctrineRationale: string
    /** Slugs the RRS doctrine table prefers for this state, already gated. */
    doctrinePreferred: string[]
    sbstAction: SbstAction | null
  } | null
  equipmentAccess: EquipmentTag[]
  alreadyAssigned: string[]
  previouslyTried: string[]
}

function clip(text: string, max: number): string {
  const t = (text ?? '').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const lastStop = cut.lastIndexOf('. ')
  return lastStop > max * 0.6 ? cut.slice(0, lastStop + 1) : cut.trimEnd() + '…'
}

export function buildRecoveryPlanSystemPrompt(): string {
  return `You are the Body Recode recovery reasoning engine. You advise KADE, the coach, on a coach-only dashboard. Your output never reaches the client. He reviews every suggestion and decides what gets assigned.

YOUR JOB:
Given everything the platform knows about one client, decide which recovery protocols from the supplied candidate list are worth assigning to THIS client RIGHT NOW, rank them, and explain the reasoning in terms of that client's own signals.

WHAT MAKES A GOOD SUGGESTION:
- Anchored in something specific. Name the signal. "Sleep domain at 2.3/4 with 'wakes between 2 and 4am' at 4/4 and screens before bed at 4/4" is a reason. "Supports recovery" is not.
- Answers "why now". Most protocols are defensible for most people. The question is what is load-bearing for this client this month.
- Realistic about the week they actually have. A client whose schedule domain is at the floor will not do a twenty-minute protocol twice a day. Prefer the thing that will actually happen. A protocol that needs no equipment and three minutes beats a better protocol they will skip.
- Small. Two to four protocols is a plan. Six is a wish list that gets ignored. A recovery plan competes for the same attention the training and nutrition plans already claim.
- Honest about the mechanism. The coach doctrine field on each candidate says where the evidence is thin or the effect is modest. Carry that honesty through. Do not inflate.

HARD RULES:
1. SLUGS. Only suggest protocols from the candidate list, by exact slug. Anything else is discarded before Kade sees it.
2. NO DOSING. Never write a frequency, a duration, a temperature or a time. The library holds the exact protocol and it renders next to your rationale. If a number appears in your output it is a defect. Say "before bed" or "on rest days" if placement matters, not "10 minutes at 4 degrees".
3. CONTRAINDICATIONS. Every candidate carries a contraindications list. Check each against what you know about this client, including their medications. Anything that fires goes in the watch field, or into not_now if it makes the protocol unsuitable.
4. STIMULATION VS DOWNREGULATION IS THE CENTRAL JUDGEMENT. Cold exposure and intense breathwork are stressors. They are excellent for a client with capacity and actively harmful for a client whose regulation is already at the floor. Read the regulation readiness, the stress domain and the CFFS risk flags before you suggest anything in the cold or intense-breathwork categories. When regulation is compromised, parasympathetic-only.
5. THE RECOVERY STATE, IF ACTIVE, OUTRANKS YOUR OWN READ. The doctrine table for that state has already been applied: unsafe protocols were removed from your candidate list in code, and the doctrine-preferred slugs are named in the context. Lead with those unless you have a specific reason from this client's file not to, and say what the reason is.
6. NOT A DIAGNOSIS. You may say a pattern is consistent with something worth supporting. You may not diagnose or claim a protocol treats a condition.
7. NO EM DASHES anywhere in your output.

WHAT TO WEIGH, IN ROUGH ORDER:
1. Active recovery state and its doctrine. Gate, not factor.
2. Contraindications and medications.
3. Regulation readiness and the stress domain. This decides stimulation versus downregulation before anything else.
4. Sleep domain. It is the most common target and the most responsive.
5. CFFS risk flags and capacity constraints.
6. Recent check-in trend: what is actually moving.
7. Training load. A client mid-block with real volume has a different recovery need to one who is barely training.
8. What is already assigned, and what they tried and stopped.

NOT_NOW:
Protocols a thoughtful coach would expect on the list and would wonder about. One line each, two to five entries. This is where you show your work. Cold exposure for a dysregulated client belongs here with the reason stated plainly.

OUTPUT FORMAT:
Return ONLY a single JSON object, no preamble, no markdown fences.

{
  "overview": "string, 60-120 words. What this recovery plan is trying to do for this client, what the constraint is, and what would change the answer. Written to Kade.",
  "suggestions": [
    {
      "slug": "exact-slug-from-candidate-list",
      "rationale": "string, 35-80 words. Why this protocol for this client now, naming the specific signals.",
      "watch": "string, 15-45 words. Contraindications that apply, medication interactions, what to monitor, or what would change the recommendation. Empty string only if genuinely nothing applies.",
      "confidence": "high" | "moderate" | "low"
    }
  ],
  "not_now": [
    { "slug": "exact-slug", "reason": "string, one line" }
  ]
}

Order suggestions by priority, highest first.`
}

export function buildRecoveryPlanUserPrompt(
  p: RecoveryClientPicture,
  candidates: RecoveryProtocol[]
): string {
  const lines: string[] = []

  lines.push('CLIENT')
  lines.push(`Name: ${p.firstName}`)
  if (p.pattern) lines.push(`Fat Map pattern: ${p.pattern}`)
  lines.push('')

  lines.push('MEDICATIONS')
  lines.push(p.medications?.trim() ? p.medications.trim() : 'None recorded.')
  lines.push('')

  if (p.rrs) {
    lines.push('ACTIVE RECOVERY STATE (RRS constraint governor) — THIS OUTRANKS YOUR OWN READ')
    lines.push(`${p.rrs.playbookName}, active ${p.rrs.daysActive} days. ${p.rrs.purpose}`)
    lines.push(`Doctrine rationale for this state: ${p.rrs.doctrineRationale}`)
    if (p.rrs.doctrinePreferred.length > 0) {
      lines.push(`Doctrine-preferred protocols for this state (already filtered to what this client can access): ${p.rrs.doctrinePreferred.join(', ')}`)
      lines.push('Lead with these. If you depart from them, say why, citing this client\'s file.')
    }
    if (p.rrs.sbstAction) {
      lines.push(`Sleep-breathing tools action for this state: ${p.rrs.sbstAction}`)
    }
    lines.push('Protocols contraindicated in this state have already been removed from the candidate list.')
    lines.push('')
  } else {
    lines.push('ACTIVE RECOVERY STATE: none. The client is not under an RRS constraint, so read their file directly.')
    lines.push('')
  }

  if (p.bodyState || p.cffsContextSummary || p.cffsRiskFlags) {
    lines.push('FOUNDATIONAL SYNTHESIS (CFFS)')
    if (p.bodyState) lines.push(`Body state: ${p.bodyState}`)
    if (p.resolutionState) lines.push(`Resolution state: ${p.resolutionState}`)
    if (p.readiness) {
      lines.push(`Exposure readiness: capacity ${p.readiness.capacity ?? '-'}, regulation ${p.readiness.regulation ?? '-'}, behaviour ${p.readiness.behaviour ?? '-'}`)
      lines.push('Regulation is the field that decides stimulation versus downregulation. Read it before suggesting anything cold or intense.')
    }
    if (p.cffsContextSummary) lines.push(`Context summary:\n${p.cffsContextSummary}`)
    if (p.cffsPatterns) lines.push(`Primary patterns and signals:\n${p.cffsPatterns}`)
    if (p.cffsConstraints) lines.push(`Capacity constraints and guardrails:\n${p.cffsConstraints}`)
    if (p.cffsRiskFlags) lines.push(`Risk flags and watch items:\n${p.cffsRiskFlags}`)
    lines.push('')
  } else {
    lines.push('FOUNDATIONAL SYNTHESIS (CFFS): none on file. Suggest conservatively and prefer low-stimulation protocols.')
    lines.push('')
  }

  if (p.intakeScores) {
    lines.push('INTAKE DOMAIN SCORES (0-4 per question; elevated means the client reported a problem)')
    lines.push(p.intakeScores)
    lines.push('')
  }

  if (p.program) {
    lines.push('ACTIVE PROGRAM')
    if (p.program.blockName) lines.push(`Block: ${p.program.blockName}`)
    if (p.program.sessionsPerWeek != null) lines.push(`Sessions per week: ${p.program.sessionsPerWeek}`)
    if (p.program.trainingGoal) lines.push(`Goal: ${p.program.trainingGoal}`)
    if (p.program.conditioning) lines.push(`Conditioning prescription: ${clip(p.program.conditioning, 400)}`)
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

  lines.push(`EQUIPMENT ACCESS: ${p.equipmentAccess.length > 0 ? p.equipmentAccess.join(', ') : 'none tagged'}`)
  lines.push('Protocols requiring equipment this client does not have are already removed from the candidate list.')
  if (p.alreadyAssigned.length > 0) lines.push(`ALREADY ASSIGNED AND ACTIVE (excluded, do not re-suggest): ${p.alreadyAssigned.join(', ')}`)
  if (p.previouslyTried.length > 0) lines.push(`PREVIOUSLY ASSIGNED, NOW PAUSED OR COMPLETED: ${p.previouslyTried.join(', ')}`)
  lines.push('')

  lines.push('CANDIDATE PROTOCOLS')
  lines.push(`${candidates.length} protocols. You may ONLY suggest from this list, by exact slug.`)
  lines.push('')
  for (const c of candidates) {
    lines.push(`### ${c.slug}`)
    lines.push(`${c.name} (${c.category}). ${c.short_description}`)
    lines.push(`Does: ${clip(c.what_it_does, 380)}`)
    lines.push(`Equipment: ${c.required_equipment.join(', ')}`)
    lines.push(`Contraindications: ${c.contraindications.length > 0 ? c.contraindications.join(' | ') : 'none listed'}`)
    lines.push(`Safety: ${clip(c.safety_notes, 300)}`)
    lines.push(`Doctrine (evidence honesty, read before writing a rationale): ${clip(c.coach_doctrine, 560)}`)
    if (c.progression) {
      lines.push(`Progression: ${c.progression.group_label} level ${c.progression.level}. ${c.progression.group_rule}`)
    }
    lines.push('')
  }

  lines.push('TASK')
  lines.push(`Produce the recovery plan for ${p.firstName}. Return JSON only.`)

  return lines.join('\n')
}
