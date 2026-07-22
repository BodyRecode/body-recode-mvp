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
      'magnesium-bath',
      'breathwork-coherent',
    ],
    sbst_action: 'remove',
    rationale: 'Nervous system is overloaded. Parasympathetic-only, no additional stimulation. SBST must be removed per 13D_16 sec 15.',
    do_not_suggest: [
      'cold-plunge-extended',
      'cold-shower',
      'cryo-chamber',
      'face-ice-immersion',
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
      'magnesium-bath',
      'sbst-nose-tape',
    ],
    sbst_action: 'secondary_only',
    rationale: 'Sleep disruption active. Fix sleep architecture and evening parasympathetic tone. SBST allowed as secondary support - Level 1 (nose tape) first, never skip levels. No evening cold exposure.',
    do_not_suggest: [
      'cold-shower',
      'face-ice-immersion',
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
    rationale: 'Metabolic and behavioural stabilisation after sustained deficit. Gentle parasympathetic support, no acute cold, prioritise sleep and recovery infrastructure.',
    do_not_suggest: [
      'cold-plunge-extended',
      'cryo-chamber',
      'cold-shower',
      'face-ice-immersion',
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
      'magnesium-bath',
      'sleep-debt-recovery',
      'sauna-infrared',
    ],
    sbst_action: 'deprioritise',
    rationale: 'Phased re-entry after confirmed burnout. Absolute parasympathetic priority. No stimulation from cold, extreme breathwork, or high-intensity anything. SBST deprioritised until Phase 2 or 3.',
    do_not_suggest: [
      'cold-shower',
      'face-ice-immersion',
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
