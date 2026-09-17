/**
 * Which way is "better" for each 0-4 intake question.
 *
 * WHY THIS EXISTS (2026-09-14)
 *
 * The Progress Check compares answers twelve weeks apart and the change doctrine
 * reads change at the level of a CLUSTER, not an item (Progress Read spec 3a).
 * That needs every item in a cluster to point the same way, and they do not.
 * The sleep section holds "I fall asleep easily" and "I wake during the night"
 * on the same Never-to-Consistently scale, so a higher answer is better on one
 * and worse on the other. Averaging raw movement across the section cancels a
 * real change out, or manufactures one. Nothing recorded which was which.
 *
 *   strain    a higher answer means more load, symptom or limitation
 *   capacity  a higher answer means more ease, stability or capacity
 *   neutral   history, preference or attribution: movement is recorded but
 *             never counted as a direction. Most "I have ..." history items are
 *             here on purpose, because they can only rise with coaching and
 *             counting them would flatter every read.
 *
 * Body pattern signals (fm_) are "strain" in the narrow sense that a higher
 * answer means more of the signal is present. Whether that is better or worse
 * for a given person is the Progress Read's job, not this file's.
 *
 * DRAFTED by Claude on 14 Sep 2026 from the wording of each question, for Kade
 * to check. It is doctrine-adjacent: a wrong entry makes one item push its
 * cluster the wrong way. scripts/audit-question-text.ts fails if any intake
 * scale question is missing from this list, so a new question can never be
 * silently left out of the comparison.
 */

export type AnswerDirection = 'strain' | 'capacity' | 'neutral'

const S = 'strain' as const
const C = 'capacity' as const
const N = 'neutral' as const

export const ANSWER_DIRECTION: Record<string, AnswerDirection> = {
  // Section A: body pattern signals. Higher = more of the signal present.
  // fm_04 (salty cravings) moved from strain to NEUTRAL on 17 Sep 2026, from
  // research pass E1a. It was scored as a strain signal on no evidence: no
  // human study found stress raises salt intake (Torres 2010), salt liking is
  // largely learned and falls within months of eating less salt (Bertino 1982),
  // and "adrenal fatigue" is not a recognised condition (Cadegiani 2016,
  // systematic review of 58 studies). It still earns its place in the intake,
  // but as a referral input alongside other symptoms, not as load. See
  // 00_PLAYBOOK/electrolyte_research/2026-09-17_E1a_RESULT_base_and_safety_gates.md, A8.
  fm_01: S, fm_02: S, fm_03: S, fm_04: N, fm_05: S, fm_06: S, fm_07: S, fm_08: S, fm_09: S, fm_10: S,
  fm_11: S, fm_12: S, fm_13: S, fm_14: S, fm_15: S, fm_16: S, fm_17: S, fm_18: S, fm_19: S, fm_20: S,
  fm_21: S, fm_22: S, fm_23: S, fm_24: S, fm_25: S, fm_26: S, fm_27: S, fm_28: S,
  fm_29: N, // attribution ("tracks with how demanding life is"), not an amount

  // Section B: injury. Higher = more pain or limitation.
  inj_01: S, inj_02: S, inj_03: S, inj_04: S, inj_05: S,
  inj_06: N, // ever had a significant injury: history, not re-asked
  inj_07: S,
  inj_08: N, // has required time away: history
  inj_09: N, // injuries have recurred: history
  inj_10: S, inj_11: S, inj_12: S, inj_13: S, inj_14: S, inj_15: S, inj_16: S, inj_17: S, inj_18: S, inj_19: S, inj_20: S,

  // Section C: training.
  tr_01: N, tr_02: N, tr_03: N, tr_04: N, // experience and familiarity: history
  tr_05: C, // confident navigating a gym
  tr_06: N, tr_11: N, tr_13: N, tr_14: N, tr_16: N, tr_17: N, tr_18: N, tr_19: N, tr_20: N, // experience: history
  tr_07: S, tr_08: S, tr_09: S, tr_10: S,
  tr_12: C, // comfortable exerting high effort
  tr_15: C, // recovers adequately between sessions
  tr_21: S,
  tr_22: N, tr_23: N, tr_24: N, // has stopped training because of...: history
  tr_25: S,
  tr_26: N, tr_27: N, tr_28: N, // preferences
  tr_29: S, tr_30: S,

  // Section D: nutrition.
  nut_01: C, // consistent eating pattern
  nut_02: S, nut_03: S,
  nut_04: N, nut_05: N, // eats to schedule; weekday v weekend: description, not strain
  nut_06: N, nut_07: N, nut_08: N, nut_09: N, nut_10: N, // diet history
  nut_11: S, nut_12: S,
  nut_13: N, nut_14: N, // food-group and energy observations
  nut_15: S, nut_16: S, nut_17: S, nut_18: S, nut_19: S, nut_20: S,
  nut_21: N, nut_22: N, nut_23: N, // avoidances and preferences
  nut_24: S, // limited time for preparation
  nut_25: N, // prefers simple meals

  // Section E: schedule.
  sch_01: C, sch_02: S, sch_03: C, sch_04: S, sch_05: C, sch_06: C, sch_07: S, sch_08: S, sch_09: C,
  sch_10: N, // needs flexibility: preference
  sch_11: S, sch_12: S, sch_13: S, sch_14: S, sch_15: S,
  sch_16: C, sch_17: S,
  sch_18: N, // needs external structure: preference
  sch_19: C, sch_20: S,
  sch_21: N, sch_22: N, sch_23: N, sch_24: N, // session and planning preferences
  sch_25: S,

  // Section F: sleep and recovery.
  sl_01: C, sl_02: C, sl_03: C, sl_04: S, sl_05: S, sl_06: C, sl_07: C, sl_08: C, sl_09: S, sl_10: S,
  sl_11: C, sl_12: S, sl_13: S, sl_14: S, sl_15: S, sl_16: C, sl_17: C, sl_18: S, sl_19: S, sl_20: C,
  sl_21: C, sl_22: S, sl_23: C, sl_24: C, sl_25: S,

  // Section G: stress.
  str_01: S, str_02: S, str_03: S, str_04: S, str_05: S, str_06: S, str_07: S, str_08: S, str_09: S, str_10: S,
  str_11: S, str_12: S, str_13: S, str_14: S,
  str_15: C, // emotionally resilient
  str_16: S, str_17: S, str_18: S,
  str_19: C, // training helps reduce stress
  str_20: S, str_21: S, str_22: S,
  str_23: C, // bounces back quickly
  str_24: S, str_25: S,

  // Section H: stimulants and supplements.
  sup_01: N, // consumes caffeine at all
  sup_02: S, sup_03: S, sup_04: S, sup_05: S,
  sup_06: N, // uses pre-workout
  sup_07: S, sup_08: S, sup_09: S,
  sup_10: N, // has stopped or reduced due to side effects: history
  sup_11: N, sup_12: N, sup_14: N, // supplement habits
  sup_13: S, sup_15: S, sup_16: S, sup_17: S, sup_18: S, sup_19: S,
  sup_20: N, // feels better reducing use: observation
  sup_21: S, sup_22: S,
  sup_23: N, // has experienced adverse reactions: history
  sup_24: N, // has been advised to limit: history
  sup_25: C, // confident managing intake
}
