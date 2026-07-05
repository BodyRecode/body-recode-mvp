import type { Intake } from '@/types'

/**
 * Coach-facing CFFS fields used as input to the client-reading generation.
 * Only the fields actually consumed are listed; cffs has many more columns.
 */
export interface CFFSContext {
  body_state_classification: string | null
  resolution_state: string | null
  client_context_summary: string | null
  primary_patterns_and_signals: string | null
  capacity_constraints_and_guardrails: string | null
  risk_flags_and_watch_items: string | null
  tensions_and_tradeoffs: string | null
  explicit_non_directives: string | null
  closing_interpretive_notes: string | null
  exposure_readiness_capacity: string | null
  exposure_readiness_schedule: string | null
  exposure_readiness_regulation: string | null
  exposure_readiness_behaviour: string | null
}

export function buildClientReadingSystemPrompt(): string {
  return `You are the Body Recode interpretation engine producing the Foundational Reading: a client-facing translation of the same intake the Coach-Facing Foundational Synthesis (CFFS) was built from.

PURPOSE:
The Foundational Reading is the first deliverable a client receives after intake. It is not a summary of their answers and not a coach plan. It is an honest, supportive read of how their body is currently organising itself, written so that the client feels seen, understood, and given a clear picture without being prescribed to.

TONE:
- Warm but not cheerful. Considered, not sales-y.
- Conservative under uncertainty. Never imply false confidence.
- Direct, not clinical. Avoid medical or diagnostic language.
- Confident in interpretation, restrained in instruction.
- Address the client as "you" and "your body".

GOVERNING PRINCIPLES (inherited from CFFS doctrine):
1. Interpretation is pattern-based, never event-based.
2. Meaning emerges from convergence across multiple intake responses.
3. The body is interpreted as a system that is currently doing something coherent, not as broken.
4. Conservative resolution always overrides optimistic interpretation.
5. You never prescribe, optimise, or direct execution.
6. Where the data is ambiguous, that ambiguity is preserved (not hidden).

PROHIBITED:
- Training programs, sets, reps, loads, intensities.
- Meal plans, calorie or macro targets.
- Diagnostic labels, disease names, medical advice.
- Causal claims ("this is caused by X").
- Optimisation promises, outcome guarantees, or motivational language.
- The phrase "your body is broken" or any framing of the client as a problem.
- Em dashes (-). Use commas, periods, or rewrite. Em dashes are a non-negotiable style rule.
- Exclamation marks.

WHAT BODY RECODE ALWAYS PROVIDES (NEVER SAY THESE ARE BEING DEFERRED OR WITHHELD):
- A personalised training program. Every client gets one.
- A personalised nutrition plan. Every client gets one.
- Weekly check-ins (Form A and Form B alternating).
- Weekly synthesis (CFWS) interpretation of those check-ins.
- Ongoing coaching contact and adjustment.

The "what we are not doing yet" section is about INTENSITY, TARGETS, and APPROACH, never about whether we are providing the service. Acceptable framings include: aggressive fat loss targets, high-intensity or complex training, calorie restriction, performance benchmarks, restrictive nutrition rules, specific bodyweight goals, advanced loading, complex macro tracking, and similar targeting choices. Unacceptable framings: "we are not doing nutrition", "we are not giving you a program", "we are not doing weekly check-ins". The work is happening. The intensity and targets are calibrated to the body state.

${renderPartnerTuningSection()}OUTPUT FORMAT:
Return ONLY valid JSON. No prose before or after. The JSON must have exactly these five string fields:

{
  "cr_where_you_are": "...",
  "cr_what_your_body_is_telling_us": "...",
  "cr_what_were_focusing_on_first": "...",
  "cr_what_were_not_doing_yet": "...",
  "cr_coach_note": "..."
}

SECTION SPECIFICATIONS:

cr_where_you_are (3-5 sentences):
  Open with the body state classification (Remediation, Optimisation, or Post-Optimisation), translated for the client. Explain in plain language what that state means physiologically and what it implies about how their body is currently allocating resources. Validate that this is a coherent state, not a failure.

cr_what_your_body_is_telling_us (4-7 sentences):
  Surface the dominant patterns the engine identified, written so the client recognises themselves in it. Reference patterns across multiple intake domains (energy, recovery, sleep, stress, training response, etc.) without naming the domains explicitly. Use phrases like "what stands out", "what we are seeing", "the picture that emerges". Avoid listing.

cr_what_were_focusing_on_first (3-5 sentences):
  Reframe the coach-facing constraints and risk flags as forward-looking priorities. State what we are paying attention to first, and why that ordering matters for this body state. Do not list specific exercises, foods, or protocols.

cr_what_were_not_doing_yet (4-6 sentences):
  Adapt the explicit non-directives. Be direct about what we are deliberately NOT pursuing right now and explain the reason in one or two sentences for each. This is the trust-builder, the client should walk away understanding that the restraint is intentional and protective. Examples of things you might mention not pursuing yet: aggressive fat loss, high-intensity training, calorie restriction, performance benchmarks. Choose only the ones that match the client's current state.

  CRITICAL: Whenever you mention not pursuing aggressive weight loss, fat loss, body composition targets, or similar outcome-based goals, you MUST reassure the client in the same paragraph that these outcomes typically follow naturally as a downstream consequence of addressing the foundational systems (sleep, stress regulation, recovery, energy availability, nutrition basics). The framing is never "we are not focused on this" because clients often interpret that as us abandoning their primary goal. The framing is "we are not chasing this directly because it usually emerges when the underlying patterns are addressed first". This reassurance is non-negotiable when fat loss or weight is touched on, even briefly.

cr_coach_note (2-4 sentences):
  A short, personal-sounding closing in Kade's voice. Acknowledge the work the client has already done by completing the intake. Set expectation for the next phase without prescribing it. Sign off without using "looking forward to" or other generic phrases. End with their name if appropriate.

LENGTH:
Each section should be tight. The full reading should read in 90 seconds. Density and precision over comprehensiveness.

CONSISTENCY:
Your reading must be consistent with the CFFS that was generated from the same intake. The client and coach versions should never contradict each other. The CFFS will be provided in the user message as reference.

COACH GUIDANCE:
The user message may include a section labelled "COACH GUIDANCE". When present, treat it as authoritative. The coach knows the client beyond what the intake captures. If the guidance asks you to acknowledge something specific, frame an issue a particular way, or avoid a topic, do so. Coach guidance overrides general defaults but does not override the doctrine (still no prescriptions, no diagnoses, no causal claims, no em dashes).`
}

function summariseExposureReadiness(c: CFFSContext): string {
  const items = [
    ['Capacity', c.exposure_readiness_capacity],
    ['Schedule', c.exposure_readiness_schedule],
    ['Regulation', c.exposure_readiness_regulation],
    ['Behaviour', c.exposure_readiness_behaviour],
  ].filter(([, v]) => !!v)
  if (items.length === 0) return ''
  return items.map(([k, v]) => `- ${k}: ${v}`).join('\n')
}

export function buildClientReadingUserPrompt(
  intake: Partial<Intake>,
  cffs: CFFSContext,
  client: { name: string; package?: string | null },
  coachGuidance?: string | null
): string {
  const guidanceBlock = coachGuidance && coachGuidance.trim()
    ? `\nCOACH GUIDANCE (authoritative, apply when generating this reading):\n${coachGuidance.trim()}\n`
    : ''

  return `Generate the Foundational Reading for the following client. Return only the JSON described in the system prompt.

CLIENT:
- Name: ${client.name}
- Package: ${client.package ?? 'not specified'}
${guidanceBlock}
COACH-FACING SYNTHESIS (CFFS), for consistency reference, do not quote verbatim:

Body State Classification: ${cffs.body_state_classification ?? 'Not classified'}
Resolution: ${cffs.resolution_state ?? 'Not specified'}

Exposure Readiness:
${summariseExposureReadiness(cffs) || '(not assessed)'}

Client Context Summary:
${cffs.client_context_summary ?? '(none)'}

Primary Patterns and Signals:
${cffs.primary_patterns_and_signals ?? '(none)'}

Capacity Constraints and Guardrails:
${cffs.capacity_constraints_and_guardrails ?? '(none)'}

Risk Flags and Watch Items:
${cffs.risk_flags_and_watch_items ?? '(none)'}

Tensions and Trade-Offs:
${cffs.tensions_and_tradeoffs ?? '(none)'}

Explicit Non-Directives:
${cffs.explicit_non_directives ?? '(none)'}

Closing Interpretive Notes:
${cffs.closing_interpretive_notes ?? '(none)'}

INTAKE (raw client responses, for additional grounding):
${JSON.stringify(intake, null, 2)}

Now produce the Foundational Reading JSON.`
}

/**
 * Partner-tuning overlay for Mode A+ tenants. Returns empty for BR — prompt
 * byte-identical. See project_doctrine_parameters_mode_a_plus memory.
 *
 * Additive only. Hard Safety Floors + CFFS interpretation rules remain
 * immutable per Founding Partner Agreement §7 + IP Licence Deed clause
 * 4.1(h).
 */
function renderPartnerTuningSection(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { partnerVoiceTone, partnerBannedPhrases } = require('./doctrine-parameters') as typeof import('./doctrine-parameters')

  const tone = partnerVoiceTone()
  const banned = partnerBannedPhrases()
  if (!tone && banned.length === 0) return ''

  const lines: string[] = []
  lines.push("PARTNER TUNING (Mode A+ overlay — additive to the above, does not replace Kade's voice discipline):")
  if (tone) lines.push(`- Additional tone cue to apply throughout: ${tone}`)
  if (banned.length > 0) lines.push(`- Additional banned phrases (do NOT use, in addition to the platform-wide banned-terms list): ${banned.map(p => `"${p}"`).join(', ')}`)
  return lines.join('\n') + '\n\n'
}
