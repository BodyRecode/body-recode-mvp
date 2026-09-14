/**
 * The near-full Progress Check: which questions, how they are worded, and what
 * she said last time.
 *
 * Spec: 02_FEATURE_SPECS/2026-09-13_Progress_Check_Spec.md. The method is
 * subtract-from-the-full-intake, never add-to-a-short-form: every intake question
 * is asked again unless it is listed in NOT_REASKED with a reason.
 *
 * This file is the single source. The question-by-question appendix
 * (scripts/build-progress-check-question-list.ts), the form, the save and submit
 * routes and the Progress Read all read it, so they cannot disagree about what
 * was asked.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { INTAKE_SECTIONS, type Question, type Section, isQuestionVisible } from '@/lib/intake-questions'
import { answersFromIntake, type Answers, type Dispute } from '@/lib/answer-comparison'

/** Every intake question is re-asked unless it is here, with its reason. */
export const NOT_REASKED: Record<string, string> = {
  full_name: 'Identity. Held on her record.',
  date_of_birth: 'Identity. Cannot change.',
  gender: 'Identity. Re-asked only if she chooses to update it, never as part of the check.',
  occupation: 'Identity. A change is captured by "what has changed since your last read".',
  mobile_number: 'Contact detail, managed in her portal.',
  emergency_contact_name: 'Contact detail, managed in her portal.',
  emergency_contact_phone: 'Contact detail, managed in her portal.',
  how_did_you_hear: 'Acquisition. Cannot change.',
  sex_at_birth: 'Cannot change. If she chose to talk it through with her coach, the coach updates her record after that conversation.',
  intake_confirmation: 'Replaced by the Progress Check’s own confirmation.',
  inj_06: 'Past injury history is fixed. New injuries are captured by "what has changed".',
  final_disclosure: 'Replaced by the Progress Check’s own confirmation.',
  final_system_alignment: 'Replaced by the Progress Check’s own confirmation.',
  final_accuracy: 'Replaced by the Progress Check’s own confirmation.',
}

/**
 * Wording that must differ from the intake. At intake these ask "compared with a
 * year ago"; here they must ask "compared with your last read", or the same
 * year-long window is asked every quarter and nothing can be said about the last
 * twelve weeks. Spec 4.0, exception 2.
 */
export const TEXT_OVERRIDES: Record<string, string> = {
  vitality_energy: 'Compared with your last read, your energy is',
  vitality_drive: 'Compared with your last read, your drive and motivation are',
  vitality_libido: 'Compared with your last read, your sex drive is',
  vitality_recovery: 'Compared with your last read, how well you recover from training is',
}

export const WHAT_CHANGED_ID = 'what_changed'

/** Asked first, while it is freshest, because it frames everything after it. Spec 6. */
const WHAT_CHANGED_SECTION: Section = {
  id: 'pc_what_changed',
  title: 'What has changed since your last read',
  description: 'New injuries, medication changes, a new job, a move, a loss, anything at all. A sentence or two is plenty. If nothing has changed, say so.',
  questions: [
    { id: WHAT_CHANGED_ID, text: 'What has changed in your life or your body since your last read?', type: 'text', required: false },
  ],
}

/** The intake sections that are not asked again as a whole. */
const DROPPED_SECTIONS = new Set(['identity', 'final'])

export const PROGRESS_CHECK_V2_SECTIONS: Section[] = [
  WHAT_CHANGED_SECTION,
  ...INTAKE_SECTIONS
    .filter(s => !DROPPED_SECTIONS.has(s.id))
    .map(s => ({
      ...s,
      questions: s.questions
        .filter(q => !NOT_REASKED[q.id])
        .map(q => (TEXT_OVERRIDES[q.id] ? { ...q, text: TEXT_OVERRIDES[q.id] } : q)),
    }))
    .filter(s => s.questions.length > 0),
]

/** Every re-asked intake question id (excludes the new "what has changed"). */
export const PROGRESS_CHECK_V2_QUESTION_IDS: string[] = PROGRESS_CHECK_V2_SECTIONS
  .flatMap(s => s.questions.map(q => q.id))
  .filter(id => id !== WHAT_CHANGED_ID)

/** Same default as the intake: every question is required except free text, unless flagged. */
export function isRequiredV2(q: Question): boolean {
  if (q.required === true) return true
  if (q.required === false) return false
  return q.type !== 'text'
}

/**
 * Visibility needs sex at birth, which is not re-asked. Taken from her record;
 * for an intake from before hormonal status existed, a Gender of Male stands in,
 * so a man is not asked about periods. Anything else shows the questions, which
 * all offer "Not applicable".
 */
export function visibilityAnswers(current: Answers, previous: Answers, gender: string | null): Answers {
  const sex = typeof previous.sex_at_birth === 'string' && previous.sex_at_birth
    ? previous.sex_at_birth
    : gender === 'Male' ? 'Male' : ''
  return { ...current, sex_at_birth: sex }
}

export function isVisibleV2(q: Question, current: Answers, previous: Answers, gender: string | null): boolean {
  return isQuestionVisible(q, visibilityAnswers(current, previous, gender))
}

/** Intake text and multi-select answers live in their own columns, not in the scale JSON. */
export const INTAKE_COLUMN_FOR: Record<string, string> = {
  inj_21: 'injury_location_current',
  inj_22: 'injury_location_history',
  inj_23: 'injury_primary_concern',
  inj_24: 'injury_aggravating_movements',
  sch_days: 'training_days_available',
  dietary_restrictions: 'dietary_restrictions',
  dietary_preferences: 'dietary_preferences',
  typical_day_eating: 'typical_day_eating',
  meals_per_day: 'meals_per_day',
  fluid_intake: 'fluid_intake',
  caffeine_intake: 'caffeine_intake',
  alcohol_intake: 'alcohol_intake',
  eating_context: 'eating_context',
  goal_primary: 'primary_goal',
  goal_secondary: 'secondary_goals',
  goal_timeline: 'desired_timeline',
  goal_motivator: 'subjective_motivator',
}

export interface PreviousAnswers {
  answers: Answers
  gender: string | null
  /** Where "last time" came from, for the coach and the Progress Read. */
  source: { intakeId: string | null; intakeSubmittedAt: string | null; progressCheckId: string | null; progressCheckSubmittedAt: string | null }
}

/**
 * What she said last time: her latest intake, with any later completed
 * near-full Progress Check laid over it, because a newer answer is the one she
 * would recognise as "last time". A question that was never asked stays absent,
 * which the comparison treats as a first answer rather than movement.
 */
export async function loadPreviousAnswers(admin: SupabaseClient, clientId: string, excludeProgressCheckId?: string): Promise<PreviousAnswers> {
  const [{ data: intake }, { data: client }, { data: pcs }] = await Promise.all([
    admin.from('intakes').select('*').eq('client_id', clientId).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('clients').select('medications').eq('id', clientId).maybeSingle(),
    admin.from('progress_checks').select('id, responses, submitted_at').eq('client_id', clientId).eq('status', 'complete').eq('form_version', 'v2').order('submitted_at', { ascending: false }).limit(2),
  ])

  const answers: Answers = intake ? answersFromIntake(intake) : {}
  if (intake) {
    for (const [id, column] of Object.entries(INTAKE_COLUMN_FOR)) {
      const v = intake[column]
      if ((typeof v === 'string' && v.trim() !== '') || (Array.isArray(v) && v.length > 0)) answers[id] = v
    }
    if (typeof intake.sex_at_birth === 'string' && intake.sex_at_birth) answers.sex_at_birth = intake.sex_at_birth
  }
  if (typeof client?.medications === 'string' && client.medications.trim()) answers.medications = client.medications

  const lastPc = (pcs ?? []).find(p => p.id !== excludeProgressCheckId) ?? null
  if (lastPc?.responses && typeof lastPc.responses === 'object') {
    for (const [id, v] of Object.entries(lastPc.responses as Record<string, unknown>)) {
      if (id !== WHAT_CHANGED_ID && v != null && v !== '') answers[id] = v
    }
  }

  return {
    answers,
    gender: (intake?.gender as string | null) ?? null,
    source: {
      intakeId: (intake?.id as string | null) ?? null,
      intakeSubmittedAt: (intake?.submitted_at as string | null) ?? null,
      progressCheckId: lastPc?.id ?? null,
      progressCheckSubmittedAt: lastPc?.submitted_at ?? null,
    },
  }
}

/** Keep only answers to questions this check asks, in the shape the intake stores them. */
export function cleanV2Answers(raw: unknown): Answers {
  const out: Answers = {}
  if (!raw || typeof raw !== 'object') return out
  const src = raw as Record<string, unknown>
  const byId = new Map(PROGRESS_CHECK_V2_SECTIONS.flatMap(s => s.questions).map(q => [q.id, q]))
  for (const [id, v] of Object.entries(src)) {
    const q = byId.get(id)
    if (!q) continue
    if (q.type === 'scale') { if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 4) out[id] = v; continue }
    if (q.type === 'multiselect') { if (Array.isArray(v)) out[id] = v.filter(x => typeof x === 'string' && (q.options ?? []).includes(x)); continue }
    if (q.type === 'select') { if (typeof v === 'string' && (q.options ?? []).includes(v)) out[id] = v; continue }
    if (typeof v === 'string') out[id] = v.slice(0, 5000)
  }
  return out
}

/** Disputes as sent by the form, validated against the questions and her previous answers. */
export function cleanDisputes(raw: unknown, previous: Answers): Dispute[] {
  if (!Array.isArray(raw)) return []
  const byId = new Map(PROGRESS_CHECK_V2_SECTIONS.flatMap(s => s.questions).map(q => [q.id, q]))
  const seen = new Set<string>()
  const out: Dispute[] = []
  for (const d of raw) {
    if (!d || typeof d !== 'object') continue
    const { questionId, shouldHaveBeen, note } = d as Record<string, unknown>
    if (typeof questionId !== 'string' || seen.has(questionId)) continue
    const q = byId.get(questionId)
    // Only an answer she actually gave last time can be disputed.
    if (!q || previous[questionId] == null) continue
    const valid = q.type === 'scale'
      ? typeof shouldHaveBeen === 'number' && Number.isInteger(shouldHaveBeen) && shouldHaveBeen >= 0 && shouldHaveBeen <= 4
      : q.type === 'select'
        ? typeof shouldHaveBeen === 'string' && (q.options ?? []).includes(shouldHaveBeen)
        : false
    if (!valid) continue
    seen.add(questionId)
    out.push({ questionId, shouldHaveBeen, note: typeof note === 'string' ? note.slice(0, 1000) : null })
  }
  return out
}

/** Required questions that apply and are not yet answered. */
export function missingRequiredV2(current: Answers, previous: Answers, gender: string | null): string[] {
  const missing: string[] = []
  for (const s of PROGRESS_CHECK_V2_SECTIONS) {
    for (const q of s.questions) {
      if (!isRequiredV2(q) || !isVisibleV2(q, current, previous, gender)) continue
      const v = current[q.id]
      const answered = q.type === 'scale' ? typeof v === 'number'
        : q.type === 'multiselect' ? Array.isArray(v) && v.length > 0
          : typeof v === 'string' && v.trim() !== ''
      if (!answered) missing.push(q.id)
    }
  }
  return missing
}
