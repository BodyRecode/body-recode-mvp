/**
 * Doctrine tests for the macro arc.
 *
 * Written 2026-07-29 after Kade found four separate defects in one afternoon by
 * regenerating Vicki's arc over and over. Every case below is a real failure
 * that reached him, not a hypothetical. The clamp and the date maths are pure
 * functions, so there is no excuse for a human being the thing that runs them.
 *
 *   npx tsx scripts/test-macro-arc-doctrine.ts
 */
import { clampMacroArcToDoctrine, allowedPhasesForBodyState, type MacroBlock } from '../src/lib/macro-arc-doctrine'
import { weeksUntil } from '../src/lib/temporal-context'

let failed = 0
let passed = 0

function check(name: string, condition: boolean, detail?: string) {
  if (condition) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`) }
}

function block(over: Partial<MacroBlock>): MacroBlock {
  return {
    position: undefined as unknown as number, // blocks have no position until saved
    block_name: 'Block',
    progression_phase: 'accumulation',
    phase_category: null,
    phase_objective: null,
    execution_arc: null,
    training_goal: 'capacity',
    week_duration: 4,
    training_frequency: 3,
    ...over,
  }
}

const total = (bs: MacroBlock[]) => bs.reduce((s, b) => s + b.week_duration, 0)

console.log('\nDATE ARITHMETIC')
{
  // Vicki: event 87 days out = 12.43 weeks. Math.round gave 12, so the arc
  // finished 20 Oct against a 24 Oct event, with four unprogrammed days before
  // the thing she had trained a quarter of a year for.
  const now = new Date('2026-07-29T00:00:00+10:00')
  const event = new Date('2026-10-24T00:00:00+10:00')
  const w = weeksUntil(event, now)
  check('a part week rounds UP so the runway covers the event', w === 13, `got ${w}, expected 13`)
  check('an exact multiple of 7 days is not inflated',
    weeksUntil(new Date('2026-10-21T00:00:00+10:00'), now) === 12)
  check('a past date returns 0 rather than a negative runway',
    weeksUntil(new Date('2026-07-01T00:00:00+10:00'), now) === 0)
}

console.log('\nPHASE PERMISSION')
{
  check('Remediation stops at accumulation',
    JSON.stringify(allowedPhasesForBodyState('Remediation')) === JSON.stringify(['restoration', 'accumulation']))
  check('Optimisation stops at intensification',
    allowedPhasesForBodyState('Optimisation').includes('intensification') &&
    !allowedPhasesForBodyState('Optimisation').includes('realization'))
  check('an unknown state is conservative, not permissive',
    !allowedPhasesForBodyState(null).includes('intensification'))

  const r = clampMacroArcToDoctrine(
    [block({ block_name: 'A', progression_phase: 'restoration', week_duration: 6 }),
     block({ block_name: 'B', progression_phase: 'realization', week_duration: 6 })],
    { bodyState: 'Remediation' })
  check('realization on a Remediation client is clamped down',
    r.blocks[1].progression_phase === 'restoration' || r.blocks[1].progression_phase === 'accumulation')
  check('corrections name the block instead of saying "Block undefined"',
    !r.notes.some(n => n.includes('undefined')), r.notes.join(' | '))
}

console.log('\nWINDOW FITTING')
{
  // The original bug: only the LAST block was adjusted, floored at 1 week. An
  // arc ending in a 1-week taper absorbed nothing and reported success anyway.
  const r = clampMacroArcToDoctrine(
    [block({ block_name: 'B1', progression_phase: 'restoration', week_duration: 5 }),
     block({ block_name: 'B2', progression_phase: 'accumulation', week_duration: 5 }),
     block({ block_name: 'B3', progression_phase: 'accumulation', week_duration: 2 }),
     block({ block_name: 'Taper', progression_phase: 'restoration', week_duration: 1 })],
    { bodyState: 'Remediation', weeksAvailable: 12 })
  check('a 13-week arc is actually reduced to the 12-week window',
    total(r.blocks) === 12, `got ${total(r.blocks)} weeks`)
  check('the taper is extended to the 2-week minimum',
    r.blocks[r.blocks.length - 1].week_duration >= 2)
  check('no note claims an adjustment that did not happen',
    !r.notes.some(n => /Adjusted block undefined/.test(n)), r.notes.join(' | '))

  const grow = clampMacroArcToDoctrine(
    [block({ block_name: 'B1', progression_phase: 'restoration', week_duration: 4 }),
     block({ block_name: 'Taper', progression_phase: 'restoration', week_duration: 2 })],
    { bodyState: 'Remediation', weeksAvailable: 12 })
  check('a short arc is grown to fill the window', total(grow.blocks) === 12, `got ${total(grow.blocks)}`)
}

console.log('\nFALSE POSITIVES (each of these wrongly fired on a correct arc)')
{
  // "consolidate sleep stability" turned a capacity-building block into a deload.
  const r = clampMacroArcToDoctrine(
    [block({ block_name: 'Aerobic & Lower-Body Capacity Building',
             progression_phase: 'accumulation', week_duration: 6,
             phase_objective: 'Build aerobic capacity and consolidate sleep stability and pain-free movement patterns' }),
     block({ block_name: 'Event Taper', progression_phase: 'restoration', week_duration: 6 })],
    { bodyState: 'Remediation', weeksAvailable: 12 })
  check('"consolidate" in an objective is not read as a deload',
    r.blocks[0].progression_phase === 'accumulation',
    `became ${r.blocks[0].progression_phase}`)

  // "reduce sympathetic elevation" was read as terrain elevation.
  const e = clampMacroArcToDoctrine(
    [block({ block_name: 'Reset', progression_phase: 'restoration', week_duration: 6,
             phase_objective: 'Stabilise sleep architecture and reduce sympathetic elevation' }),
     block({ block_name: 'Taper', progression_phase: 'restoration', week_duration: 6 })],
    { bodyState: 'Remediation', weeksAvailable: 12 })
  check('"sympathetic elevation" is not an invented terrain claim',
    !e.warnings.some(w => /specifics about the event/.test(w)), e.warnings.join(' | '))

  // Real terrain invention must still be caught.
  const t = clampMacroArcToDoctrine(
    [block({ block_name: 'Prep', progression_phase: 'accumulation', week_duration: 6,
             phase_objective: 'Prepare for a 3-4 hour walk over uneven terrain' }),
     block({ block_name: 'Taper', progression_phase: 'restoration', week_duration: 6 })],
    { bodyState: 'Remediation', weeksAvailable: 12 })
  check('genuinely invented event facts are still caught',
    t.warnings.some(w => /specifics about the event/.test(w)))
}

console.log('\nLABEL VS PROSE')
{
  const r = clampMacroArcToDoctrine(
    [block({ block_name: 'Base', progression_phase: 'restoration', week_duration: 6 }),
     block({ block_name: 'Performance Expression & Walk Simulation',
             progression_phase: 'intensification', week_duration: 4,
             phase_objective: 'Threshold work at RPE 7/10 to express trained capacity' }),
     block({ block_name: 'Taper', progression_phase: 'restoration', week_duration: 2 })],
    { bodyState: 'Remediation', weeksAvailable: 12 })
  check('a block clamped down but still describing RPE 7+ work is flagged',
    r.warnings.some(w => /still describes intensification work/.test(w)), r.warnings.join(' | '))
}

console.log('\nTAPER')
{
  const r = clampMacroArcToDoctrine(
    [block({ block_name: 'Build', progression_phase: 'accumulation', week_duration: 9 }),
     block({ block_name: 'Consolidation', progression_phase: 'accumulation', week_duration: 3 })],
    { bodyState: 'Remediation', weeksAvailable: 12 })
  check('the final block before a dated event is forced to restoration',
    r.blocks[1].progression_phase === 'restoration')
  check('and to a capacity goal', r.blocks[1].training_goal === 'capacity')
  check('the window still totals correctly afterwards', total(r.blocks) === 12, `got ${total(r.blocks)}`)
}

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
