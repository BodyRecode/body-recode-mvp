/**
 * Tests for the Progress Check answer comparison.
 *
 * Two kinds of test, because the doctrine makes two kinds of promise:
 *
 *   RULES      a first answer is not movement, a dispute never overwrites, not
 *              asked is not held, one item never makes a change, a short re-ask
 *              still works.
 *
 *   NOISE      Progress Read spec 3a: scale drift twelve weeks apart must not be
 *              called a change, and a real shift must be caught. Checked by
 *              simulation with a seeded random generator, so results repeat.
 *
 *   npm run test:answer-comparison
 */
import { compareAnswers, formatComparisonForPrompt, CONVERGENCE, type Answers } from '../src/lib/answer-comparison'
import { INTAKE_SECTIONS } from '../src/lib/intake-questions'
import { ANSWER_DIRECTION } from '../src/lib/answer-direction'

let failed = 0, passed = 0
function check(name: string, cond: boolean, detail?: string) {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`) }
}

// Seeded so every run gives the same numbers.
let seed = 20260914
const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
const clamp = (n: number) => Math.max(0, Math.min(4, n))

const scaleIds = (sectionId: string) => INTAKE_SECTIONS.find(s => s.id === sectionId)!.questions.filter(q => q.type === 'scale').map(q => q.id)
const SLEEP = scaleIds('sleep')
const STRESS = scaleIds('stress')
const ALL_SCALE = INTAKE_SECTIONS.flatMap(s => s.questions.filter(q => q.type === 'scale').map(q => q.id))
const verdictOf = (c: ReturnType<typeof compareAnswers>, id: string) => c.clusters.find(x => x.sectionId === id)!

console.log('\nEVERY SCALE QUESTION HAS A DIRECTION')
{
  const missing = ALL_SCALE.filter(id => !ANSWER_DIRECTION[id])
  check(`all ${ALL_SCALE.length} scale questions classified`, missing.length === 0, missing.join(', '))
}

console.log('\nRULES')
{
  // A stressed sleeper who genuinely improved: every directional sleep item moves one step toward capacity.
  const prev: Answers = {}, cur: Answers = {}
  for (const id of SLEEP) {
    const d = ANSWER_DIRECTION[id]
    prev[id] = d === 'capacity' ? 1 : d === 'strain' ? 3 : 2
    cur[id] = d === 'capacity' ? 2 : d === 'strain' ? 2 : 2
  }
  const c = compareAnswers(prev, cur)
  check('a whole-cluster improvement is caught as moved toward capacity', verdictOf(c, 'sleep').verdict === 'moved_toward_capacity', JSON.stringify(verdictOf(c, 'sleep')))
  check('...and is clear, not modest', verdictOf(c, 'sleep').strength === 'clear')
  check('a section not asked this time is not enough overlap, never held', verdictOf(c, 'stress').verdict === 'not_enough_overlap')

  // Same answers raw, but mixed polarity: averaging raw values would have called this nothing.
  const flatRaw = compareAnswers(prev, cur)
  const rawMean = SLEEP.reduce((s, id) => s + ((cur[id] as number) - (prev[id] as number)), 0) / SLEEP.length
  check(`mixed-polarity items are turned before counting (raw mean ${rawMean.toFixed(2)} would hide it)`, flatRaw.clusters.find(x => x.sectionId === 'sleep')!.meanShift! >= 0.8)

  // One item moving a long way is informational only.
  const one: Answers = Object.fromEntries(SLEEP.map(id => [id, 2]))
  const oneCur: Answers = { ...one, sl_08: 4 }
  const o = verdictOf(compareAnswers(one, oneCur), 'sleep')
  check('one item moving two points is held, and still listed as moved', o.verdict === 'held' && o.movedItems.length === 1)

  // The real-client case: four injury items jump 0 -> 2, the cluster does not converge.
  const INJ = scaleIds('injury')
  const iPrev: Answers = Object.fromEntries(INJ.map(id => [id, 1]))
  const iCur: Answers = { ...iPrev, inj_11: 3, inj_12: 3, inj_15: 3 }
  const ic = compareAnswers(iPrev, iCur)
  check('three injury items jumping two points: cluster held, but all three surfaced as large moves', verdictOf(ic, 'injury').verdict === 'held' && verdictOf(ic, 'injury').largeMoves.length === 3)
  check('...and flagged WATCH in what the read is given', (formatComparisonForPrompt(ic).match(/\[WATCH\]/g) ?? []).length === 3)

  // A first answer: no previous at all for half the section.
  const half: Answers = Object.fromEntries(SLEEP.slice(0, 12).map(id => [id, 2]))
  const allNow: Answers = Object.fromEntries(SLEEP.map(id => [id, ANSWER_DIRECTION[id] === 'capacity' ? 4 : ANSWER_DIRECTION[id] === 'strain' ? 0 : 2]))
  const f = compareAnswers(half, allNow)
  const firsts = verdictOf(f, 'sleep').items.filter(i => i.status === 'first_answer').length
  check(`questions with no previous answer are first answers (${firsts}), never movement`, firsts === 13 && verdictOf(f, 'sleep').comparable <= 12)

  // A dispute: she says her old 4 on "I wake during the night" should have been 1. New answer 1 = no change.
  const dPrev: Answers = Object.fromEntries(SLEEP.map(id => [id, 2]))
  dPrev.sl_10 = 4
  const dCur: Answers = { ...dPrev, sl_10: 1 }
  const dc = compareAnswers(dPrev, dCur, [{ questionId: 'sl_10', shouldHaveBeen: 1, note: 'I had a newborn that week' }])
  const item = verdictOf(dc, 'sleep').items.find(i => i.questionId === 'sl_10')!
  check('a disputed answer compares against her correction', item.baseline === 1 && item.delta === 0 && item.disputed)
  check('...and the original is kept, never overwritten', item.previous === 4 && dc.disputes[0].original === 4 && dPrev.sl_10 === 4)

  // Rey's short re-ask: only 8 sleep questions asked again, all improved.
  const shortPrev: Answers = Object.fromEntries(SLEEP.map(id => [id, ANSWER_DIRECTION[id] === 'capacity' ? 1 : 3]))
  const directional = SLEEP.filter(id => ANSWER_DIRECTION[id] !== 'neutral')
  const shortCur: Answers = Object.fromEntries(directional.slice(0, 8).map(id => [id, ANSWER_DIRECTION[id] === 'capacity' ? 3 : 1]))
  const sc = verdictOf(compareAnswers(shortPrev, shortCur), 'sleep')
  check('a short re-ask of 8 items still reads a real change', sc.verdict === 'moved_toward_capacity' && sc.comparable === 8)
  const tiny = verdictOf(compareAnswers(shortPrev, Object.fromEntries(directional.slice(0, 4).map(id => [id, 4]))), 'sleep')
  check(`a re-ask below ${CONVERGENCE.minComparable} comparable items is not enough overlap`, tiny.verdict === 'not_enough_overlap')

  // Both directions at once.
  const mPrev: Answers = Object.fromEntries(SLEEP.map(id => [id, 2]))
  const mCur: Answers = { ...mPrev }
  const caps = SLEEP.filter(id => ANSWER_DIRECTION[id] === 'capacity')
  caps.slice(0, 5).forEach(id => { mCur[id] = 4 })
  caps.slice(5, 10).forEach(id => { mCur[id] = 0 })
  check('five items better and five worse is mixed, not a change', verdictOf(compareAnswers(mPrev, mCur), 'sleep').verdict === 'mixed')

  // Neutral items never push a cluster.
  const trIds = scaleIds('training')
  const tPrev: Answers = Object.fromEntries(trIds.map(id => [id, 1]))
  const tCur: Answers = Object.fromEntries(trIds.map(id => [id, ANSWER_DIRECTION[id] === 'neutral' ? 4 : 1]))
  check('training history rising on every item does not count as a change', verdictOf(compareAnswers(tPrev, tCur), 'training').verdict === 'held')

  // Self-reported change and categorical facts.
  const h = compareAnswers({ period_pattern: 'Regular', vitality_energy: 'Worse' }, { period_pattern: 'Irregular', vitality_energy: 'Better', hormone_therapy: 'None' })
  check('a changed select answer is reported as changed', h.categorical.find(x => x.questionId === 'period_pattern')?.status === 'changed')
  check('a select with no previous answer is a first answer', h.categorical.find(x => x.questionId === 'hormone_therapy')?.status === 'first_answer')
  check('energy is self-reported change, never compared with the intake answer', h.selfReportedChange.some(x => x.questionId === 'vitality_energy' && x.current === 'Better') && !h.categorical.some(x => x.questionId === 'vitality_energy'))
}

console.log('\nNOISE: scale drift must not be called a change')
function falsePositiveRate(label: string, drift: number, previousFor: (id: string) => number, runs = 2000) {
  let clustersRead = 0, calledMoved = 0
  for (let r = 0; r < runs; r++) {
    const prev: Answers = {}, cur: Answers = {}
    for (const id of ALL_SCALE) {
      const p = previousFor(id)
      prev[id] = p
      cur[id] = rand() < drift ? clamp(p + (rand() < 0.5 ? -1 : 1)) : p
    }
    for (const cl of compareAnswers(prev, cur).clusters) {
      if (cl.verdict === 'not_enough_overlap') continue
      clustersRead++
      if (cl.verdict === 'moved_toward_capacity' || cl.verdict === 'moved_toward_strain') calledMoved++
    }
  }
  const rate = calledMoved / clustersRead
  console.log(`        ${label}: ${calledMoved} of ${clustersRead} clusters called moved (${(rate * 100).toFixed(2)}%)`)
  return rate
}
{
  const uniform = () => Math.floor(rand() * 5)
  // Regression to the mean: a client who answered at the extremes can only drift back inward,
  // so noise alone pushes a high-strain client "toward capacity". The hardest case for false improvement.
  const highStrain = (id: string) => ANSWER_DIRECTION[id] === 'strain' ? (rand() < 0.5 ? 4 : 3) : ANSWER_DIRECTION[id] === 'capacity' ? (rand() < 0.5 ? 0 : 1) : 2
  check('1 in 4 items drifting one point, answers spread: under 2% called a change', falsePositiveRate('25% drift, spread answers', 0.25, uniform) < 0.02)
  check('4 in 10 items drifting one point, answers spread: under 5% called a change', falsePositiveRate('40% drift, spread answers', 0.40, uniform) < 0.05)
  const hs = falsePositiveRate('25% drift, answers at the extremes (regression to the mean)', 0.25, highStrain)
  check('1 in 4 drifting from extreme answers: under 10% called a change', hs < 0.10)
}

console.log('\nREAL SHIFTS must be caught')
function detectionRate(label: string, shiftShare: number, shiftSize: number, drift: number, runs = 1000) {
  let caught = 0
  for (let r = 0; r < runs; r++) {
    const prev: Answers = {}, cur: Answers = {}
    for (const id of SLEEP) {
      const d = ANSWER_DIRECTION[id]
      const p = d === 'neutral' ? 2 : 1 + Math.floor(rand() * 3) // 1..3, room to move
      prev[id] = p
      let c = p
      if (d !== 'neutral' && rand() < shiftShare) c = clamp(p + (d === 'capacity' ? shiftSize : -shiftSize))
      else if (rand() < drift) c = clamp(p + (rand() < 0.5 ? -1 : 1))
      cur[id] = c
    }
    if (verdictOf(compareAnswers(prev, cur), 'sleep').verdict === 'moved_toward_capacity') caught++
  }
  const rate = caught / runs
  console.log(`        ${label}: caught ${caught} of ${runs} (${(rate * 100).toFixed(1)}%)`)
  return rate
}
{
  detectionRate('4 in 10 items better by one point, plus 25% drift', 0.4, 1, 0.25)
  check('half the cluster better by one point, plus 25% drift: caught at least 80%', detectionRate('half better by one, plus drift', 0.5, 1, 0.25) >= 0.8)
  check('six in ten better by one point, plus 25% drift: caught at least 95%', detectionRate('six in ten better by one, plus drift', 0.6, 1, 0.25) >= 0.95)
  check('a third of items better by two points, plus 25% drift: caught at least 80%', detectionRate('a third better by two, plus drift', 0.34, 2, 0.25) >= 0.8)
}

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
