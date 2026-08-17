/**
 * RRS -> Recovery Protocol suggestion mapping.
 *
 * When RRS (Layer 2, negative-feedback governor) routes a client into an
 * active playbook state, the coach recovery surface uses this mapping to
 * SUGGEST which Recovery Protocols (Layer 3, coach-side prescription
 * tools) fit that state. Coach always decides - nothing here auto-assigns.
 *
 * Doctrine boundary preserved:
 *   - RRS (Layer 2) emits state + suggestions (constraint envelopes stay
 *     at Layer 2).
 *   - Recovery Protocols (Layer 3) is where prescription lives.
 *   - This file bridges the two without collapsing them.
 *
 * SBST-specific behaviour (per 13D_16 Sleep Breathing Support Tools
 * Execution playbook, section 15):
 *   - ns_overload:      REMOVE active SBST assignments entirely
 *   - sleep_disruption: SBST allowed as secondary support only (L1 first,
 *                       never skip levels)
 *   - chronic_recovery_debt: deprioritise SBST (do not suggest)
 *   - supportive_only:  SBST environmental use permitted
 *
 * The `sbst_action` field on each state below carries the SBST-specific
 * instruction. UI renders it as a distinct alert alongside the general
 * protocol suggestions.
 *
 * ── DOCTRINE CORRECTION 2026-08-17: face-only cold is not whole-body cold ──
 *
 * This table originally banned `face-ice-immersion` in ns_overload,
 * sleep_disruption, post_diet and burnout_return, alongside cold plunge,
 * cryo, cold shower and contrast. That grouped it by CATEGORY (it is filed
 * under `cold`) rather than by MECHANISM, and the mechanisms are opposite.
 *
 * Whole-body cold is a sympathetic stressor: noradrenaline, alertness,
 * voluntary discomfort. Face-only cold triggers the mammalian dive reflex via
 * the trigeminal nerve, which slows heart rate and RAISES vagal tone. The
 * library's own entry says so verbatim: "shifts autonomic balance toward
 * parasympathetic... without whole-body cold stress", and its coach doctrine
 * calls it "the fastest parasympathetic lever available".
 *
 * So the four states that demand parasympathetic-only were the four banning
 * the single best parasympathetic tool in the library. ns_overload's own
 * rationale read "Parasympathetic-only, no additional stimulation" while
 * excluding it.
 *
 * Corrected: removed from all four bans, and added to the suggested set for
 * ns_overload, burnout_return and sleep_disruption. sleep_disruption carries a
 * MORNING ONLY qualifier, because the dive reflex is fine but an evening ice
 * bowl is the wrong light and arousal context for a disrupted sleep phase.
 * post_diet permits it without preferring it.
 *
 * Whole-body cold remains banned in all four. Nothing else changed.
 *
 * Raised by Kade, who uses it as his own morning reset and asked why the
 * engine was treating it as a stressor. Logged as a correction to bring the
 * table in line with already-locked library doctrine, not as a new claim, so
 * it did not need the [[project_doctrine_governance_rule]] promotion gate.
 *
 * ── 2026-08-17: NSDR / yoga nidra added to four states ──
 *
 * Added to ns_overload, sleep_disruption and lifestyle_stress_dominant, all
 * three of which the Deep Research report names explicitly as the states this
 * protocol suits, and to burnout_return as an extension of the same logic
 * (absolute parasympathetic priority, zero adaptive load, behaviour-axis
 * anchor). The burnout_return placement is OUR inference, not something the
 * report states, and should be the first thing revisited if that state's
 * suggestions are ever audited.
 *
 * Deliberately NOT added to acute_fatigue or chronic_recovery_debt. The report
 * puts both in its "least likely to benefit" list on the grounds that a client
 * in either state who has time available should be sleeping instead. It is not
 * harmful there, so it is not in do_not_suggest, it is simply the wrong tool.
 *
 * Source: 00_PLAYBOOK/recovery_research/2026-08-17_NSDR_Yoga_Nidra_Downregulation_and_Sleep.md
 */

import type { RecoveryPlaybookId } from './recovery-doctrine'

export type SbstAction =
  /** Actively surface a "remove active SBST assignments" alert to the coach. */
  | 'remove'
  /** SBST allowed as secondary support only (L1 first, never skip levels). */
  | 'secondary_only'
  /** Do not suggest SBST in this state - other protocols take priority. */
  | 'deprioritise'
  /** SBST baseline environmental use permitted. Coach discretion. */
  | 'permitted'

export interface RrsStateSuggestion {
  playbook_id: RecoveryPlaybookId
  /** Ordered by priority (highest-value protocol first). Slugs must exist in RECOVERY_PROTOCOLS. */
  suggested_protocol_slugs: string[]
  /** SBST-specific action per 13D_16 sec 15. Null if no SBST-specific rule for this state. */
  sbst_action: SbstAction | null
  /** One-line rationale shown to the coach in the suggestion banner. */
  rationale: string
  /** Protocols explicitly contraindicated in this state (safety-critical negatives). */
  do_not_suggest: string[]
}

/**
 * The full 10-state suggestion table.
 * Slugs match RECOVERY_PROTOCOLS entries in `src/lib/recovery-protocols-seed.ts`.
 */
export const SUGGESTED_PROTOCOLS_BY_RRS_STATE: Record<RecoveryPlaybookId, RrsStateSuggestion> = {
  ns_overload: {
    playbook_id: 'ns_overload',
    suggested_protocol_slugs: [
      'deload-week',
      'breathwork-physiological-sigh',
      'face-ice-immersion',
      'nsdr-yoga-nidra',
      'magnesium-bath',
      'breathwork-coherent',
    ],
    sbst_action: 'remove',
    rationale: 'Nervous system is overloaded. Parasympathetic-only, no additional stimulation. Face-only cold IS permitted and preferred here: the trigeminal dive reflex raises vagal tone rather than adding sympathetic load. Whole-body cold stays out. SBST must be removed per 13D_16 sec 15.',
    do_not_suggest: [
      'cold-plunge-extended',
      'cold-shower',
      'cryo-chamber',
      'contrast-shower',
      'contrast-pool',
      'breathwork-wim-hof',
    ],
  },

  acute_fatigue: {
    playbook_id: 'acute_fatigue',
    suggested_protocol_slugs: [
      'deload-week',
      'compression-boots',
      'massage-gun',
      'breathwork-coherent',
      'magnesium-bath',
    ],
    sbst_action: null,
    rationale: 'Acute fatigue signal. Passive recovery tools, deload the training load, avoid additional stress from cold or intense breathwork.',
    do_not_suggest: [
      'breathwork-wim-hof',
      'cryo-chamber',
      'cold-plunge-extended',
    ],
  },

  chronic_recovery_debt: {
    playbook_id: 'chronic_recovery_debt',
    suggested_protocol_slugs: [
      'sleep-debt-recovery',
      'red-light-therapy',
      'magnesium-bath',
      'breathwork-box',
      'breathwork-coherent',
    ],
    sbst_action: 'deprioritise',
    rationale: 'Chronic recovery debt. Prioritise sleep repayment and parasympathetic tools. SBST deprioritised - fix the sleep debt first.',
    do_not_suggest: [
      'cold-plunge-extended',
      'cryo-chamber',
      'breathwork-wim-hof',
    ],
  },

  sleep_disruption: {
    playbook_id: 'sleep_disruption',
    suggested_protocol_slugs: [
      'sleep-debt-recovery',
      'breathwork-478',
      'nsdr-yoga-nidra',
      'magnesium-bath',
      'face-ice-immersion',
      'sbst-nose-tape',
    ],
    sbst_action: 'secondary_only',
    rationale: 'Sleep disruption active. Fix sleep architecture and evening parasympathetic tone. SBST allowed as secondary support - Level 1 (nose tape) first, never skip levels. No evening whole-body cold. Face-only cold is permitted and useful here, but MORNING ONLY: the dive reflex is parasympathetic, while the light and alerting context of an evening ice bowl is not what a disrupted sleep phase needs.',
    do_not_suggest: [
      'cold-shower',
      'cold-plunge-extended',
      'cryo-chamber',
      'contrast-shower',
      'contrast-pool',
      'breathwork-wim-hof',
    ],
  },

  lifestyle_stress_dominant: {
    playbook_id: 'lifestyle_stress_dominant',
    suggested_protocol_slugs: [
      'breathwork-box',
      'breathwork-physiological-sigh',
      'nsdr-yoga-nidra',
      'breathwork-coherent',
      'sauna-infrared',
      'sauna-traditional',
    ],
    sbst_action: null,
    rationale: 'External stress load is the driver, not training. Parasympathetic tools only. Sauna acceptable at moderate dose; avoid additional acute stressors.',
    do_not_suggest: [
      'breathwork-wim-hof',
      'cryo-chamber',
      'cold-plunge-extended',
    ],
  },

  overreaching_vs_under_recovery: {
    playbook_id: 'overreaching_vs_under_recovery',
    suggested_protocol_slugs: [
      'cold-shower',
      'contrast-shower',
      'massage-gun',
      'compression-boots',
      'breathwork-coherent',
    ],
    sbst_action: null,
    rationale: 'Productive overreach with stable behaviour. Active recovery tools acceptable. Modest cold exposure fine - contrast is well-suited here.',
    do_not_suggest: [],
  },

  post_diet: {
    playbook_id: 'post_diet',
    suggested_protocol_slugs: [
      'sleep-debt-recovery',
      'red-light-therapy',
      'magnesium-bath',
      'sauna-infrared',
      'breathwork-coherent',
    ],
    sbst_action: null,
    rationale: 'Metabolic and behavioural stabilisation after sustained deficit. Gentle parasympathetic support, no acute whole-body cold (it adds thermogenic and sympathetic load to an already-depleted system), prioritise sleep and recovery infrastructure. Face-only cold is permitted: the dive reflex carries no meaningful metabolic cost.',
    do_not_suggest: [
      'cold-plunge-extended',
      'cryo-chamber',
      'cold-shower',
      'breathwork-wim-hof',
    ],
  },

  post_competition: {
    playbook_id: 'post_competition',
    suggested_protocol_slugs: [
      'deload-week',
      'sauna-infrared',
      'red-light-therapy',
      'breathwork-coherent',
      'massage-gun',
    ],
    sbst_action: null,
    rationale: 'Post-competition recovery window. Longer parasympathetic anchor, gentle heat and tissue recovery. The more extreme the peak, the stricter the exit.',
    do_not_suggest: [
      'cold-plunge-extended',
      'cryo-chamber',
    ],
  },

  burnout_return: {
    playbook_id: 'burnout_return',
    suggested_protocol_slugs: [
      'breathwork-coherent',
      'breathwork-physiological-sigh',
      'face-ice-immersion',
      'nsdr-yoga-nidra',
      'magnesium-bath',
      'sleep-debt-recovery',
      'sauna-infrared',
    ],
    sbst_action: 'deprioritise',
    rationale: 'Phased re-entry after confirmed burnout. Absolute parasympathetic priority. No stimulation from whole-body cold, extreme breathwork, or high-intensity anything. Face-only cold is permitted and preferred: it is the fastest vagal lever available and costs a burnt-out client almost nothing to execute. SBST deprioritised until Phase 2 or 3.',
    do_not_suggest: [
      'cold-shower',
      'cold-plunge-extended',
      'cryo-chamber',
      'contrast-shower',
      'contrast-pool',
      'breathwork-wim-hof',
      'sauna-traditional',
    ],
  },

  supportive_only: {
    playbook_id: 'supportive_only',
    suggested_protocol_slugs: [],
    sbst_action: 'permitted',
    rationale: 'Baseline / stable state. No specific suggestions - coach discretion. SBST environmental use permitted if the client is using it and sleep remains stable.',
    do_not_suggest: [],
  },
}

export function getSuggestionsForState(playbookId: RecoveryPlaybookId): RrsStateSuggestion {
  return SUGGESTED_PROTOCOLS_BY_RRS_STATE[playbookId]
}

export function sbstActionLabel(action: SbstAction): string {
  switch (action) {
    case 'remove':
      return 'REMOVE any active SBST assignments (nose tape, mouth tape, mouthpiece). 13D_16 sec 15: SBST must be removed when nervous system overloaded.'
    case 'secondary_only':
      return 'SBST allowed as secondary support only. Level 1 (nose tape) first - never skip levels. Do not use as a substitute for sleep-behaviour correction.'
    case 'deprioritise':
      return 'Deprioritise SBST. Other protocols take precedence for this state - fix the underlying signal before layering SBST support.'
    case 'permitted':
      return 'SBST environmental use permitted if the client is stable. If sleep or recovery declines, reclassify SBST as intervention and follow the escalation model.'
  }
}
