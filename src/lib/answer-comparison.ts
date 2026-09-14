/**
 * What changed between two sets of answers, read the way the doctrine allows.
 *
 * WHY THIS EXISTS (2026-09-14)
 *
 * Two front ends will ask the same questions again after twelve weeks: the
 * coaching Progress Check re-asks 231 of the 245 intake questions, and Rey's
 * re-read re-asks only what can change (~10 minutes). One comparison has to
 * serve both, so nothing here assumes how many questions were asked. It works on
 * whatever the two answer sets have in common.
 *
 * It is deliberately NOT an AI call. It decides what the Progress Read is
 * PERMITTED to call a change, deterministically, so the generator cannot invent
 * movement out of scale-reading noise. Progress Read spec 3a:
 *
 *   "220 questions on a 0-4 scale, answered twelve weeks apart. If even a
 *    quarter of them drift by one point from nothing but how she read the scale
 *    that day, that is fifty-odd changes that mean nothing at all."
 *
 * The rules it implements, each from the spec:
 *
 *   CLUSTER, NOT ITEM. A section is the cluster. One item moving is reported as
 *   informational and never becomes a finding on its own.
 *
 *   CONVERGENCE. A cluster has moved only when enough of its comparable items
 *   moved the same way, clearly outnumbering those that moved the other way, and
 *   the average shift is large enough to survive scale drift. The thresholds are
 *   below and were checked against simulated noise (scripts/test-answer-comparison.ts).
 *
 *   A FIRST ANSWER IS NOT MOVEMENT. A question with no previous answer (new to
 *   the intake since she did hers) is recorded as a first answer and excluded.
 *
 *   A DISPUTE NEVER OVERWRITES. When she says an old answer was wrong, the
 *   comparison uses her correction as the baseline for that item but keeps the
 *   original, and counts how much of a cluster's movement rests on corrections.
 *
 *   NOT ASKED IS NOT HELD. A cluster with too few re-asked items says so
 *   ("not enough overlap") rather than reporting that nothing moved. That is the
 *   difference that lets a short re-ask exist at all.
 *
 *   NOTHING MOVED IS A FINDING. "held" is a verdict, not an absence of one.
 *
 * What it never does: say why anything changed, or whether a change is good for
 * this person. Direction is "toward capacity" or "toward strain" as the
 * questions define them (lib/answer-direction.ts). Meaning is the read's job.
 */

import { INTAKE_SECTIONS, type Question } from '@/lib/intake-questions'
import { ANSWER_DIRECTION, type AnswerDirection } from '@/lib/answer-direction'

export type Answers = Record<string, unknown>

export interface Dispute {
  questionId: string
  /** What she now says the previous answer should have been. */
  shouldHaveBeen: unknown
  /** Her words, if she gave any. */
  note?: string | null
  at?: string | null
}

/** A single scale item, compared. */
export interface ScaleItemChange {
  questionId: string
  text: string
  direction: AnswerDirection
  status: 'compared' | 'first_answer' | 'not_asked_now'
  previous: number | null
  /** The baseline actually used: her correction where she disputed, else previous. */
  baseline: number | null
  current: number | null
  delta: number | null
  /** Delta turned so positive always means toward capacity. Null for neutral items. */
  towardCapacity: number | null
  disputed: boolean
}

export type ClusterVerdict =
  | 'moved_toward_capacity'
  | 'moved_toward_strain'
  | 'mixed'
  | 'held'
  | 'not_enough_overlap'

export interface ClusterChange {
  sectionId: string
  title: string
  verdict: ClusterVerdict
  strength: 'clear' | 'modest' | null
  /** Directional items answered both times. */
  comparable: number
  movedTowardCapacity: number
  movedTowardStrain: number
  /** Average polarity-adjusted shift across comparable directional items, 2dp. */
  meanShift: number | null
  /** How many of the moving items in the dominant direction rest on a corrected baseline. */
  restsOnCorrections: number
  /** The individual items that moved, informational only. */
  movedItems: ScaleItemChange[]
  /**
   * Items that moved LARGE_ITEM_MOVE points or more. Still never a cluster
   * change on their own, but always surfaced: on a real client's two intakes
   * four injury items went 0 to 2 while the injury cluster correctly did not
   * converge, and a verdict of "held" alone would have hidden a new injury.
   */
  largeMoves: ScaleItemChange[]
  items: ScaleItemChange[]
}

export interface CategoricalChange {
  questionId: string
  text: string
  status: 'changed' | 'same' | 'first_answer' | 'not_asked_now'
  previous: string | null
  current: string | null
  disputed: boolean
}

/**
 * Questions whose answer is ALREADY a comparison. At intake they ask "compared
 * with a year ago"; in the Progress Check "compared with your last read". The
 * two answers cover different windows, so comparing them is meaningless: the
 * current answer is itself the change. Progress Check spec 4.0, exception 2.
 */
export const SELF_REPORTED_CHANGE_IDS = new Set(['vitality_energy', 'vitality_drive', 'vitality_libido', 'vitality_recovery'])

export interface AnswerComparison {
  clusters: ClusterChange[]
  categorical: CategoricalChange[]
  selfReportedChange: Array<{ questionId: string; text: string; current: string }>
  disputes: Array<Dispute & { text: string; original: unknown }>
  coverage: {
    askedNow: number
    compared: number
    firstAnswers: number
    notAskedNow: number
  }
}

/**
 * Convergence thresholds. Set against simulation, not intuition: see
 * scripts/test-answer-comparison.ts, which runs pure scale-reading noise many
 * times and requires it to almost never be called a change, and runs genuine
 * shifts and requires them to be caught.
 */
export const CONVERGENCE = {
  /** Fewer comparable directional items than this, and a cluster is not read at all. */
  minComparable: 6,
  /** The dominant direction needs at least this many items... */
  minMovers: 3,
  /** ...and at least this share of the comparable items... */
  minShare: 0.3,
  /** ...and to outnumber the opposite direction by this ratio... */
  dominance: 2,
  /** ...and an average shift at least this large across the cluster. */
  minMeanShift: 0.4,
  /** An average shift this large, or more than half the cluster moving, is clear rather than modest. */
  clearMeanShift: 0.8,
} as const

/** A single item moving this far is always surfaced, even when its cluster held. */
export const LARGE_ITEM_MOVE = 2

/** Clusters where a large move toward strain is a watch item for safety, never just information. */
export const SAFETY_CLUSTERS = new Set(['injury'])

const SCALE_MIN = 0
const SCALE_MAX = 4

function asScale(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
  return Number.isFinite(n) && n >= SCALE_MIN && n <= SCALE_MAX ? n : null
}

function asText(v: unknown): string | null {
  if (typeof v === 'string') return v.trim() === '' ? null : v.trim()
  if (Array.isArray(v)) return v.length ? v.map(String).join(', ') : null
  return null
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function compareScaleItem(q: Question, previous: Answers, current: Answers, dispute: Dispute | undefined): ScaleItemChange {
  const direction = ANSWER_DIRECTION[q.id] ?? 'neutral'
  const prev = asScale(previous[q.id])
  const corrected = dispute ? asScale(dispute.shouldHaveBeen) : null
  const baseline = corrected ?? prev
  const cur = asScale(current[q.id])
  const base = { questionId: q.id, text: q.text, direction, previous: prev, baseline, current: cur, disputed: !!dispute && corrected !== null }
  if (cur === null) return { ...base, status: 'not_asked_now', delta: null, towardCapacity: null }
  if (baseline === null) return { ...base, status: 'first_answer', delta: null, towardCapacity: null }
  const delta = cur - baseline
  const towardCapacity = direction === 'capacity' ? delta : direction === 'strain' ? -delta : null
  return { ...base, status: 'compared', delta, towardCapacity }
}

function readCluster(sectionId: string, title: string, items: ScaleItemChange[]): ClusterChange {
  const directional = items.filter(i => i.status === 'compared' && i.towardCapacity !== null)
  const n = directional.length
  const up = directional.filter(i => (i.towardCapacity as number) >= 1)
  const down = directional.filter(i => (i.towardCapacity as number) <= -1)
  const movedItems = items.filter(i => i.status === 'compared' && i.delta !== 0)
  const largeMoves = movedItems.filter(i => Math.abs(i.delta as number) >= LARGE_ITEM_MOVE)
  const base = { sectionId, title, comparable: n, movedTowardCapacity: up.length, movedTowardStrain: down.length, movedItems, largeMoves, items }

  if (n < CONVERGENCE.minComparable) {
    return { ...base, verdict: 'not_enough_overlap', strength: null, meanShift: null, restsOnCorrections: 0 }
  }

  const meanShift = directional.reduce((sum, i) => sum + (i.towardCapacity as number), 0) / n
  const [dominant, opposite, verdictIfMoved] = up.length >= down.length
    ? [up, down, 'moved_toward_capacity' as const]
    : [down, up, 'moved_toward_strain' as const]
  const converged =
    dominant.length >= Math.max(CONVERGENCE.minMovers, Math.ceil(CONVERGENCE.minShare * n)) &&
    dominant.length >= CONVERGENCE.dominance * Math.max(opposite.length, 1) &&
    Math.abs(meanShift) >= CONVERGENCE.minMeanShift &&
    Math.sign(meanShift) === (verdictIfMoved === 'moved_toward_capacity' ? 1 : -1)

  if (converged) {
    const clear = Math.abs(meanShift) >= CONVERGENCE.clearMeanShift || dominant.length > n / 2
    return {
      ...base,
      verdict: verdictIfMoved,
      strength: clear ? 'clear' : 'modest',
      meanShift: round2(meanShift),
      restsOnCorrections: dominant.filter(i => i.disputed).length,
    }
  }

  // Plenty moved, both ways: that is not "held", and it is not a change either.
  const mixed = up.length >= CONVERGENCE.minMovers && down.length >= CONVERGENCE.minMovers
  return { ...base, verdict: mixed ? 'mixed' : 'held', strength: null, meanShift: round2(meanShift), restsOnCorrections: 0 }
}

/**
 * Compare a previous answer set with a current one.
 *
 * `previous` and `current` are keyed by intake question id. Either can hold any
 * subset of the intake: a full coaching Progress Check, a short Rey re-ask, or a
 * later answer set compared with an earlier Progress Check.
 */
export function compareAnswers(previous: Answers, current: Answers, disputes: Dispute[] = []): AnswerComparison {
  const disputeById = new Map(disputes.map(d => [d.questionId, d]))
  const clusters: ClusterChange[] = []
  const categorical: CategoricalChange[] = []
  const selfReportedChange: AnswerComparison['selfReportedChange'] = []
  let askedNow = 0, compared = 0, firstAnswers = 0, notAskedNow = 0

  for (const section of INTAKE_SECTIONS) {
    const scaleItems: ScaleItemChange[] = []
    for (const q of section.questions) {
      const dispute = disputeById.get(q.id)

      if (q.type === 'scale') {
        const item = compareScaleItem(q, previous, current, dispute)
        scaleItems.push(item)
        if (item.status === 'not_asked_now') notAskedNow++
        else { askedNow++; if (item.status === 'first_answer') firstAnswers++; else compared++ }
        continue
      }

      if (q.type !== 'select') continue // text, dates and checkboxes are listed by the read, not compared here

      const cur = asText(current[q.id])
      if (SELF_REPORTED_CHANGE_IDS.has(q.id)) {
        if (cur !== null) { askedNow++; selfReportedChange.push({ questionId: q.id, text: q.text, current: cur }) }
        else notAskedNow++
        continue
      }
      const prevRaw = asText(previous[q.id])
      const corrected = dispute ? asText(dispute.shouldHaveBeen) : null
      const baseline = corrected ?? prevRaw
      const status: CategoricalChange['status'] =
        cur === null ? 'not_asked_now' : baseline === null ? 'first_answer' : cur === baseline ? 'same' : 'changed'
      if (status === 'not_asked_now') notAskedNow++
      else { askedNow++; if (status === 'first_answer') firstAnswers++; else compared++ }
      categorical.push({ questionId: q.id, text: q.text, status, previous: prevRaw, current: cur, disputed: corrected !== null })
    }
    if (scaleItems.length > 0) clusters.push(readCluster(section.id, section.title, scaleItems))
  }

  const textById = new Map(INTAKE_SECTIONS.flatMap(s => s.questions).map(q => [q.id, q.text]))
  return {
    clusters,
    categorical,
    selfReportedChange,
    disputes: disputes.map(d => ({ ...d, text: textById.get(d.questionId) ?? d.questionId, original: previous[d.questionId] ?? null })),
    coverage: { askedNow, compared, firstAnswers, notAskedNow },
  }
}

/** The intake's own answers keyed by question id: the per-section scale JSON plus the hormonal columns. */
export function answersFromIntake(intake: Record<string, unknown>): Answers {
  const out: Answers = {}
  const sectionColumn: Record<string, string> = {
    fat_map: 'fat_map_responses', injury: 'injury_responses', training: 'training_responses',
    nutrition: 'nutrition_responses', schedule: 'schedule_responses', sleep: 'sleep_responses',
    stress: 'stress_responses', supplement: 'supplement_responses',
  }
  for (const section of INTAKE_SECTIONS) {
    const json = sectionColumn[section.id] ? intake[sectionColumn[section.id]] : null
    if (json && typeof json === 'object') Object.assign(out, json as Record<string, unknown>)
    if (section.id === 'hormonal') for (const q of section.questions) if (intake[q.id] != null) out[q.id] = intake[q.id]
  }
  return out
}

const VERDICT_WORDS: Record<ClusterVerdict, string> = {
  moved_toward_capacity: 'MOVED toward capacity',
  moved_toward_strain: 'MOVED toward strain',
  mixed: 'MIXED (items moved both ways; not a change)',
  held: 'HELD (nothing converged; this is a finding)',
  not_enough_overlap: 'NOT ENOUGH RE-ASKED to read (not the same as held)',
}

/**
 * The comparison as a prompt section, carrying the change doctrine with it so a
 * generator reading it cannot miss the rules. Built for the Progress Read
 * generator; not wired into it yet.
 */
export function formatComparisonForPrompt(c: AnswerComparison): string {
  const lines: string[] = []
  lines.push('WHAT CHANGED SINCE THE LAST READ (computed, not interpreted)')
  lines.push('')
  lines.push('Rules for using this section (Progress Read spec 3a):')
  lines.push('1. A cluster verdict is the ONLY thing you may call a change. Individual moved items are informational and may never carry a conclusion on their own.')
  lines.push('2. At twelve weeks the evidence is comparable to the Foundational Read, so you are ENTITLED to change the read where clusters moved. Do not hold everything out of the weekly caution.')
  lines.push('3. HELD is a finding. Twelve weeks of stability is a result; say so plainly. Never reach for movement that is not here.')
  lines.push('4. NOT ENOUGH RE-ASKED means the questions were not asked again. Never describe it as held or as changed.')
  lines.push('5. No causation. Say what moved, never why. "Sleep moved toward capacity" is a finding; "because the training changed" is not.')
  lines.push('6. First answers are not movement. Disputed answers: the baseline is her correction; say where a change rests on corrections.')
  lines.push('')
  lines.push(`Coverage: ${c.coverage.askedNow} answered now, ${c.coverage.compared} compared, ${c.coverage.firstAnswers} first answers, ${c.coverage.notAskedNow} not asked this time.`)
  lines.push('')
  for (const cl of c.clusters) {
    const strength = cl.strength ? ` (${cl.strength})` : ''
    const counts = cl.verdict === 'not_enough_overlap'
      ? `${cl.comparable} comparable items`
      : `${cl.comparable} comparable, ${cl.movedTowardCapacity} toward capacity, ${cl.movedTowardStrain} toward strain, mean shift ${cl.meanShift}`
    const corrections = cl.restsOnCorrections ? `; ${cl.restsOnCorrections} of the moving items rest on corrected answers` : ''
    lines.push(`- ${cl.title}: ${VERDICT_WORDS[cl.verdict]}${strength}. ${counts}${corrections}.`)
  }
  const large = c.clusters.flatMap(cl => cl.largeMoves.map(i => ({ cl, i })))
  if (large.length) {
    lines.push('')
    lines.push(`Individual items that moved ${LARGE_ITEM_MOVE} or more points (informational: never a change on their own, but never ignore them; in Injury, a move toward strain is a watch item for the coach):`)
    for (const { cl, i } of large) {
      const flag = SAFETY_CLUSTERS.has(cl.sectionId) && (i.towardCapacity ?? 0) < 0 ? ' [WATCH]' : ''
      lines.push(`- ${cl.title}: "${i.text}" ${i.baseline} -> ${i.current}${flag}`)
    }
  }

  const changed = c.categorical.filter(x => x.status === 'changed')
  if (changed.length) {
    lines.push('')
    lines.push('Changed answers (facts, not scores):')
    for (const x of changed) lines.push(`- ${x.text} ${x.previous} -> ${x.current}${x.disputed ? ' (previous answer disputed)' : ''}`)
  }
  if (c.selfReportedChange.length) {
    lines.push('')
    lines.push('Her own report of change since the last read (a monitoring signal, never a cause):')
    for (const x of c.selfReportedChange) lines.push(`- ${x.text.replace(/^Compared with [^,]+, /i, '')}: ${x.current}`)
  }
  if (c.disputes.length) {
    lines.push('')
    lines.push('Answers she says were wrong last time (the original is kept):')
    for (const d of c.disputes) lines.push(`- ${d.text} was ${String(d.original)}, she says it should have been ${String(d.shouldHaveBeen)}${d.note ? `: "${d.note}"` : ''}`)
  }
  return lines.join('\n')
}
