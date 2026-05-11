/**
 * Recovery program clamp — second-pass enforcement that runs AFTER the
 * existing training-doctrine clamp.
 *
 * When a recovery state is active for a client, the program generation
 * pipeline reads getActiveConstraintManifest() and passes the playbook into
 * here. We then walk every session/block/exercise and enforce the playbook's
 * constraint envelope — RPE caps, set/session removal, conditioning blocks,
 * progression locks, etc.
 *
 * Doctrine principle (12E_01): only EXPOSURE / TIMING_SEQUENCING /
 * CONTEXT_ENVIRONMENT adjustments are permissible. We never invent new
 * exercises, change movement patterns, or prescribe behaviour. We only
 * REDUCE the existing prescription's load envelope.
 *
 * Pure function — returns a new sessions array plus an audit summary of
 * what was clamped.
 */

import type { PlaybookDoctrine } from '@/lib/recovery-doctrine'

interface Exercise {
  exercise_name?: string
  sets?: number | string
  reps?: string | number
  rpe?: number | string | null
  rest?: string
  notes?: string
}

interface Block {
  block_label?: string
  exercises?: Exercise[]
}

interface Session {
  day_label?: string
  skeleton?: string
  movement_prep?: string[]
  blocks?: Block[]
}

export interface RecoveryClampResult {
  sessions: Session[]
  rpeReductions: number
  sessionsRemoved: number
  blocksRemoved: number
  notes: string[]
}

/**
 * Translate a load-reduction percentage range into how many RPE points to
 * drop. Doctrinally: load reduction in the prescription space is best
 * expressed as RPE reduction (since prescriptions don't carry kg targets).
 *
 *   10–25%  → -1 RPE
 *   20–40%  → -1 RPE   (let the LLM-generated lower starting RPE do most of the work)
 *   any larger range → -2 RPE
 */
function rpeDropFromLoadReduction(range: readonly [number, number] | null): number {
  if (!range) return 0
  const [min] = range
  if (min >= 30) return 2
  if (min >= 10) return 1
  return 0
}

function blockIsConditioning(label: string | undefined): boolean {
  if (!label) return false
  const t = label.toLowerCase()
  return /conditioning|capacity|finisher|aerobic|cardio/.test(t)
}

function blockIsTesting(label: string | undefined): boolean {
  if (!label) return false
  const t = label.toLowerCase()
  return /test|max|pr |pb |\b1rm\b|\b3rm\b|\b5rm\b/.test(t)
}

function exerciseIsTesting(name: string | undefined): boolean {
  if (!name) return false
  const t = name.toLowerCase()
  return /\b1rm\b|\b3rm\b|\b5rm\b|max attempt|pr attempt|test/.test(t)
}

/**
 * Apply the recovery playbook's training constraint manifest to a
 * generated program. Returns a deep clone with clamps applied + an audit
 * summary suitable for the recovery_adjustments row.
 */
export function clampProgramToRecoveryManifest(
  sessions: Session[],
  playbook: PlaybookDoctrine,
): RecoveryClampResult {
  const cloned: Session[] = JSON.parse(JSON.stringify(sessions))
  const m = playbook.trainingConstraints
  const notes: string[] = []
  let rpeReductions = 0
  let sessionsRemoved = 0
  let blocksRemoved = 0

  // RPE cap derived from load reduction range
  const rpeDrop = rpeDropFromLoadReduction(m.loadReductionPct)

  // Drop or strip exercises across every session
  for (const session of cloned) {
    if (!session.blocks) continue

    // Strip conditioning blocks if blocked
    if (m.conditioningBlocked) {
      const before = session.blocks.length
      session.blocks = session.blocks.filter(b => !blockIsConditioning(b.block_label))
      blocksRemoved += before - session.blocks.length
    }

    // Strip testing blocks / exercises if blocked
    if (m.testingBlocked) {
      const before = session.blocks.length
      session.blocks = session.blocks.filter(b => !blockIsTesting(b.block_label))
      blocksRemoved += before - session.blocks.length
      for (const block of session.blocks) {
        if (!block.exercises) continue
        block.exercises = block.exercises.filter(ex => !exerciseIsTesting(ex.exercise_name))
      }
    }

    // Reduce RPE on every remaining exercise
    if (rpeDrop > 0) {
      for (const block of session.blocks) {
        for (const ex of block.exercises ?? []) {
          if (typeof ex.rpe === 'number') {
            const newRpe = Math.max(3, ex.rpe - rpeDrop)
            if (newRpe < ex.rpe) {
              ex.rpe = newRpe
              rpeReductions++
            }
          }
        }
      }
    }
  }

  // Remove whole sessions if sessionsRemovedPerWeek is set. We remove from
  // the END of the week (preserves the earliest sessions = priority work).
  if (m.sessionsRemovedPerWeek) {
    const removeCount = m.sessionsRemovedPerWeek[0] // remove the minimum range value
    if (removeCount > 0 && cloned.length > removeCount) {
      const removed = cloned.splice(cloned.length - removeCount, removeCount)
      sessionsRemoved += removed.length
      notes.push(`Removed ${removed.length} session${removed.length === 1 ? '' : 's'} from the end of the week per ${playbook.source} (${playbook.name}).`)
    }
  }

  // Cap weekly session count
  if (m.sessionsPerWeekCap != null && cloned.length > m.sessionsPerWeekCap) {
    const removeCount = cloned.length - m.sessionsPerWeekCap
    const removed = cloned.splice(cloned.length - removeCount, removeCount)
    sessionsRemoved += removed.length
    notes.push(`Capped weekly sessions to ${m.sessionsPerWeekCap} per ${playbook.source} (${playbook.name}).`)
  }

  if (rpeReductions > 0) {
    notes.unshift(`Recovery clamp: dropped RPE on ${rpeReductions} exercise${rpeReductions === 1 ? '' : 's'} (-${rpeDrop} per exercise, capped at minimum 3) per ${playbook.source} (${playbook.name}).`)
  }
  if (blocksRemoved > 0) {
    notes.push(`Recovery clamp: removed ${blocksRemoved} conditioning/testing block${blocksRemoved === 1 ? '' : 's'} per ${playbook.source} (${playbook.name}).`)
  }
  if (m.progressionLocked) {
    notes.push(`Recovery clamp: progression LOCKED for the duration of this state per ${playbook.source} (${playbook.name}). Coach must not advance load/volume mid-state.`)
  }

  return {
    sessions: cloned,
    rpeReductions,
    sessionsRemoved,
    blocksRemoved,
    notes,
  }
}

/**
 * Build a system-prompt addition for the NUTRITION generation LLM call.
 *
 * Nutrition is harder to enforce post-LLM because prescriptions are largely
 * textual, so we lean entirely on prompt injection here and skip the clamp.
 * The audit row still gets written by the route.
 */
export function buildRecoveryNutritionPromptSection(playbook: PlaybookDoctrine): string {
  const m = playbook.nutritionConstraints
  const lines: string[] = []
  lines.push('=== ACTIVE RECOVERY STATE — APPLY THESE NUTRITION CONSTRAINTS ===')
  lines.push(`The client is in an active recovery state: ${playbook.name} (${playbook.source}, tier ${playbook.tier}).`)
  lines.push('')
  lines.push('You MUST apply the following constraints to your nutrition prescription. Do not negotiate. The Recovery and Regulation System has absolute override authority over nutrition prescription.')
  lines.push('')
  if (m.aggressiveDeficitBlocked) lines.push('- AGGRESSIVE CALORIC DEFICIT IS PROHIBITED. No fat-loss-aggressive intake during this state. Maintenance or slight deficit only.')
  if (m.reactiveRestrictionBlocked) lines.push('- NO compensatory restriction in response to reduced training. Calories should not be cut to "match" the lower training load.')
  if (m.fuelRestrictionBlocked) lines.push('- NO fasting protocols, no carbohydrate elimination, no fuel restriction.')
  if (m.proteinFloorRequired) lines.push('- Maintain baseline protein intake (typical floor ≥1.6g/kg, higher if hormonal support context applies). Do not drop protein.')
  if (m.carbohydrateSupportRequired) lines.push('- Maintain carbohydrate support proportional to training exposure. Do not strip carbs.')
  lines.push('')
  lines.push('=== END RECOVERY NUTRITION CONSTRAINTS ===')
  return lines.join('\n')
}

/**
 * Build a system-prompt addition to inject into the program LLM call when a
 * recovery state is active. This makes the LLM produce something already
 * respecting the manifest, so the post-LLM clamp does less work.
 */
export function buildRecoveryPromptSection(playbook: PlaybookDoctrine): string {
  const m = playbook.trainingConstraints
  const lines: string[] = []
  lines.push('=== ACTIVE RECOVERY STATE — APPLY THESE CONSTRAINTS ===')
  lines.push(`The client is currently in an active recovery state: ${playbook.name} (${playbook.source}, tier ${playbook.tier}).`)
  lines.push(`Purpose: ${playbook.purpose}`)
  lines.push('')
  lines.push('You MUST apply the following constraints to your output. Do not negotiate, optimise around, or compensate for these constraints. The Recovery and Regulation System has absolute override authority over training prescription per the Body Recode RRS doctrine.')
  lines.push('')
  if (m.loadReductionPct) {
    lines.push(`- Reduce prescribed load by ${m.loadReductionPct[0]}–${m.loadReductionPct[1]}% from baseline. In RPE terms: drop RPE by 1 on every exercise (or by 2 if the reduction range is 30%+).`)
  }
  if (m.densityRestIncreasePct) {
    lines.push(`- Increase rest intervals by ${m.densityRestIncreasePct[0]}–${m.densityRestIncreasePct[1]}% (e.g. add at least 30s to short rests, 60s to longer rests).`)
  }
  if (m.sessionsPerWeekCap != null) {
    lines.push(`- Cap weekly training sessions at ${m.sessionsPerWeekCap}. Generate no more than that count.`)
  }
  if (m.sessionsRemovedPerWeek) {
    lines.push(`- Reduce by ${m.sessionsRemovedPerWeek[0]}–${m.sessionsRemovedPerWeek[1]} session(s) compared to a normal week.`)
  }
  if (m.sessionDurationPctCap != null) {
    lines.push(`- Cap each session duration at ${m.sessionDurationPctCap}% of normal length.`)
  }
  if (m.trainingRemovalDays) {
    lines.push(`- This state typically requires full training removal for ${m.trainingRemovalDays[0]}–${m.trainingRemovalDays[1]} days. Generate a maintenance / restoration program only.`)
  }
  if (m.progressionLocked) lines.push('- PROGRESSION IS LOCKED. No load increases, no volume increases, no novel intensity techniques. Maintain or reduce only.')
  if (m.novelStimulusBlocked) lines.push('- NO novel stimulus. Use only movements the client has performed before.')
  if (m.conditioningBlocked) lines.push('- NO conditioning, capacity work, finishers, cardio add-ons, or aerobic blocks.')
  if (m.testingBlocked) lines.push('- NO testing. No 1RM/3RM/5RM, no PR attempts, no max-effort sets.')
  lines.push('')
  lines.push('Prohibited per the playbook:')
  for (const p of playbook.prohibitions.slice(0, 5)) lines.push(`- ${p}`)
  lines.push('')
  lines.push('=== END RECOVERY CONSTRAINTS ===')
  return lines.join('\n')
}
