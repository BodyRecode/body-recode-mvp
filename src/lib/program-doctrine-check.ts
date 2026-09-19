/**
 * Training doctrine checked in CODE before a generated block can be saved.
 *
 * WHY (doctrine-enforcement-gap, 31 Aug 2026): the rules below lived only in the
 * program prompt, so the model could break them and nothing objected. Real
 * failures: three barbell squats prescribed on a regulation-Red day. A licensee,
 * or Rey with no coach at all, has nobody reading every block to catch that.
 *
 * Each rule is quoted from src/lib/program-prompt.ts so the code and the
 * instructions cannot drift apart silently: if the prompt changes, the check
 * named here should change with it.
 *
 *   REGULATION_RED_AXIAL   "Regulation: Red -> avoid axial_loading = true compounds"
 *   REMEDIATION_AXIAL      "Remediation -> ... No axial_loading = true compounds outside primary slot"
 *   REMEDIATION_STABILITY  "Remediation -> ... stability_demand = low or moderate only"
 *   INJURED_JOINT          "If injury is present at a joint: exclude ALL exercises where
 *                           primary_joint_stress = that joint"
 *
 * REPORTED, NOT ENFORCED, for now (14 Sep 2026). Run against the eight live and
 * draft blocks on the day it was written, the rules as worded were broken by
 * seven of them, all coach-approved: barbell squats and deadlifts on regulation-
 * Red clients, Dead Bug, Bird Dog and Plank for lower back pain, leg press and
 * step-ups for knee pain. Some of that is the coach's judgement being better
 * than the literal rule. Refusing to save until the rules and practice agree
 * would have blocked nearly every block the practice runs on, so each violation
 * is written into the block's coach-only doctrine note instead, and whether each
 * rule should refuse, retry or warn is Kade's call. doctrineCorrectionNote and
 * clampRegulationRedRpe are built for when that call is made; neither is wired.
 */

import { blockRole, type EffectiveTier } from '@/lib/training-doctrine'

export interface DoctrineExerciseMeta {
  /**
   * How the exercise is loaded, from the library. Added 19 September 2026 to
   * make the injured-joint rule mean something: 'bodyweight_profile' marks the
   * exercises that are typically prescribed FOR a joint rather than loading it.
   */
  load_profile?: string | null
  axial_loading: boolean | null
  stability_demand: string | null
  primary_joint_stress: string | null
}

export interface ProgramDoctrineContext {
  /** Internal vocabulary: Remediation | Optimisation | Post-Optimisation. After any coach override. */
  bodyState: string | null
  /** Green | Amber | Red, after any weekly carry-forward. */
  regulationReadiness: string | null
  /** Joint keys as stored on exercises.primary_joint_stress. */
  injuredJoints: string[]
  /** Lowercased exercise name to its library metadata. */
  exerciseByName: Map<string, DoctrineExerciseMeta>
}

export interface DoctrineViolation {
  code: 'REGULATION_RED_AXIAL' | 'REMEDIATION_AXIAL' | 'REMEDIATION_STABILITY' | 'INJURED_JOINT'
  session: string
  exercise: string
  message: string
}

type Ex = { exercise_name?: string; name?: string; rpe?: number }
type Block = { block_label?: string; exercises?: Ex[] }
type Session = { day_label?: string; session_name?: string; blocks?: Block[] }

/** Intake "Areas currently affected by pain" to the library's joint keys. Unmapped areas (neck, elbows, wrists, other) have no library key and are left to the prompt. */
const JOINT_FOR_AREA: Record<string, string> = {
  'lower back': 'lumbar_spine',
  'upper back / thoracic spine': 'thoracic_spine',
  shoulders: 'shoulder',
  hips: 'hip',
  knees: 'knee',
  'ankles / feet': 'ankle',
}

export function injuredJointsFromIntake(areas: string[] | null | undefined): string[] {
  const out = new Set<string>()
  for (const a of areas ?? []) {
    const j = JOINT_FOR_AREA[String(a).trim().toLowerCase()]
    if (j) out.add(j)
  }
  return [...out]
}

const JOINT_WORDS: Record<string, string> = {
  lumbar_spine: 'lower back', thoracic_spine: 'upper back', shoulder: 'shoulder', hip: 'hip', knee: 'knee', ankle: 'ankle',
}

export function checkProgramDoctrine(sessions: Session[], ctx: ProgramDoctrineContext): DoctrineViolation[] {
  const violations: DoctrineViolation[] = []
  const red = (ctx.regulationReadiness ?? '').toLowerCase() === 'red'
  const remediation = ctx.bodyState === 'Remediation'
  const injured = new Set(ctx.injuredJoints)

  for (const s of sessions ?? []) {
    const session = s.session_name || s.day_label || 'a session'
    for (const b of s.blocks ?? []) {
      const role = blockRole(b.block_label)
      for (const ex of b.exercises ?? []) {
        // Stored as exercise_name. Reading `name` matched nothing, which is how the
        // library check below this in generate-program silently never fired.
        const name = (ex.exercise_name ?? ex.name ?? '').trim()
        const meta = ctx.exerciseByName.get(name.toLowerCase())
        if (!name || !meta) continue // unknown names are refused earlier, against the library

        if (red && meta.axial_loading) {
          violations.push({ code: 'REGULATION_RED_AXIAL', session, exercise: name, message: `${name} (${session}) loads the spine, and regulation readiness is Red: no axial-loading compounds.` })
        } else if (remediation && meta.axial_loading && role !== 'primary') {
          violations.push({ code: 'REMEDIATION_AXIAL', session, exercise: name, message: `${name} (${session}) loads the spine outside the primary slot, which Remediation does not allow.` })
        }
        if (remediation && (meta.stability_demand ?? '').toLowerCase() === 'high') {
          violations.push({ code: 'REMEDIATION_STABILITY', session, exercise: name, message: `${name} (${session}) has a high stability demand; Remediation allows low or moderate only.` })
        }
        // Injured joint, narrowed 19 September 2026 on Kade's decision after the
        // audit. The rule as originally worded fired 34 times across 22 blocks,
        // and 13 of those were Dead Bug, Bird Dog, Plank and Glute Bridge for
        // someone with back or hip pain: exercises prescribed FOR the joint,
        // not loads on it. Flagging those taught everyone to ignore the note.
        // A bodyweight exercise is therefore no longer a break; an externally
        // loaded one still is, and still only writes a note.
        if (
          meta.primary_joint_stress &&
          injured.has(meta.primary_joint_stress) &&
          (meta.load_profile ?? '') !== 'bodyweight_profile'
        ) {
          violations.push({ code: 'INJURED_JOINT', session, exercise: name, message: `${name} (${session}) loads the ${JOINT_WORDS[meta.primary_joint_stress] ?? meta.primary_joint_stress}, where the client currently reports pain. Check it is deliberate.` })
        }
      }
    }
  }
  return violations
}

/** The retry note: which rules the last attempt broke, so the next one can fix exactly that. */
export function doctrineCorrectionNote(v: DoctrineViolation[]): string {
  if (!v.length) return ''
  const lines = [...new Set(v.map(x => `- ${x.message}`))].slice(0, 20)
  return `\n\nYOUR PREVIOUS ATTEMPT BROKE THESE DOCTRINE RULES. Replace every exercise named below with a library exercise that satisfies the rule, and change nothing else:\n${lines.join('\n')}`
}

const RED_RPE_CEILING: Record<EffectiveTier, number> = { beginner: 6, intermediate: 7, advanced: 8, elite: 8 }

/** "Regulation: Red -> RPE ceiling scales by training age: beginner 6, intermediate 7, advanced 7-8." Lowered in place. */
export function clampRegulationRedRpe(sessions: Session[], regulationReadiness: string | null, tier: EffectiveTier): { clamps: number; note: string | null } {
  if ((regulationReadiness ?? '').toLowerCase() !== 'red') return { clamps: 0, note: null }
  const ceiling = RED_RPE_CEILING[tier]
  let clamps = 0
  for (const s of sessions ?? []) for (const b of s.blocks ?? []) for (const ex of b.exercises ?? []) {
    if (typeof ex.rpe === 'number' && ex.rpe > ceiling) { ex.rpe = ceiling; clamps++ }
  }
  return { clamps, note: clamps ? `Regulation Red: ${clamps} effort target${clamps === 1 ? '' : 's'} lowered to RPE ${ceiling} for a ${tier} trainee.` : null }
}
