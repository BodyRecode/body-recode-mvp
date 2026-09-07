// Assertions for the phase-band resolver (src/lib/cycle-phase-bands.ts).
//
// This is the piece that decides WHICH of a lab's four printed hormone ranges
// applies to a client, from her cycle dates. It is deliberately a plain
// calculation rather than a model call, so it can be checked, and this is where
// it gets checked.
//
// The cases that matter most are the ones that must return NOTHING. A wrong
// band is worse than no band: it would put a confident-looking reading in front
// of a coach that the data does not support. Every uncertain input must resolve
// to null and leave the marker reading exactly as the lab printed it.
//
//   npx tsx scripts/audit-cycle-phase-bands.ts

import {
  cycleDayFrom,
  phaseForCycleDay,
  parsePhaseBands,
  parseMarkerValue,
  resolveMarkerBand,
} from '../src/lib/cycle-phase-bands'

let pass = 0
const failures: string[] = []
function check(label: string, got: unknown, want: unknown) {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; return }
  failures.push(`${label}\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`)
}

// The shape QML prints. This is the real string off Razia's 25 Aug 2026 panel.
const LH_REF = 'Phase-dependent (Follicular 2-12, Midcycle Peak 10-130, Luteal 1-17, Post-Menopausal 15-60); cycle phase not indicated on report'
const PROG_REF = 'Follicular < 5, Midcycle rising, Luteal 20-110, Post-Menopausal < 3'
const E2_REF = 'Follicular 70-530, Midcycle 230-1310, Luteal 200-790, Post-Menopausal < 120'

// ── Cycle day. Day 1 is the first day of bleeding, which is what every lab
//    range is written against.
check('4 Aug to 25 Aug is day 22', cycleDayFrom('2026-08-04', '2026-08-25'), 22)
check('same day is day 1', cycleDayFrom('2026-08-25', '2026-08-25'), 1)
check('draw before the period is refused', cycleDayFrom('2026-08-26', '2026-08-25'), null)
check('90 days is not a cycle', cycleDayFrom('2026-05-25', '2026-08-25'), null)
check('missing period date', cycleDayFrom(null, '2026-08-25'), null)
check('missing draw date', cycleDayFrom('2026-08-04', null), null)
check('unparseable date', cycleDayFrom('not a date', '2026-08-25'), null)

// ── Phase boundaries.
check('day 1 follicular', phaseForCycleDay(1), 'follicular')
check('day 12 follicular', phaseForCycleDay(12), 'follicular')
check('day 13 midcycle', phaseForCycleDay(13), 'midcycle')
check('day 16 midcycle', phaseForCycleDay(16), 'midcycle')
check('day 17 luteal', phaseForCycleDay(17), 'luteal')
check('day 22 luteal', phaseForCycleDay(22), 'luteal')
check('day 55 is beyond a plausible cycle', phaseForCycleDay(55), null)
check('day 0 refused', phaseForCycleDay(0), null)

// ── Parsing the lab's string.
const bands = parsePhaseBands(LH_REF)
check('four bands found', bands.length, 4)
check('luteal bounds', [bands.find(b => b.phase === 'luteal')?.low, bands.find(b => b.phase === 'luteal')?.high], [1, 17])
check('follicular bounds', [bands.find(b => b.phase === 'follicular')?.low, bands.find(b => b.phase === 'follicular')?.high], [2, 12])
check('open-ended upper bound', parsePhaseBands(E2_REF).find(b => b.phase === 'post_menopausal')?.high, 120)
check('bands without numbers are skipped', parsePhaseBands(PROG_REF).length, 3)
check('an ordinary range is not phase-dependent', parsePhaseBands('3.6-5.2'), [])
check('a single phase name is not enough', parsePhaseBands('Luteal 1-17'), [])
check('null range', parsePhaseBands(null), [])

// ── Values.
check('plain number', parseMarkerValue('23'), 23)
check('decimal', parseMarkerValue('0.38'), 0.38)
check('less-than value', parseMarkerValue('< 1.3'), 1.3)
check('non-numeric', parseMarkerValue('not detected'), null)
check('null value', parseMarkerValue(null), null)

// ── Resolution, the happy path. Razia's real numbers at day 22.
check('LH above luteal', resolveMarkerBand({ name: 'LH', value: '23', reference_range: LH_REF, cycleDay: 22 })?.position, 'above')
check('oestradiol within luteal', resolveMarkerBand({ name: 'E2', value: '650', reference_range: E2_REF, cycleDay: 22 })?.position, 'within')
check('progesterone below luteal', resolveMarkerBand({ name: 'Prog', value: '2', reference_range: PROG_REF, cycleDay: 22 })?.position, 'below')
check('same LH in the follicular phase is ALSO above', resolveMarkerBand({ name: 'LH', value: '23', reference_range: LH_REF, cycleDay: 5 })?.position, 'above')
check('LH 23 at midcycle is within', resolveMarkerBand({ name: 'LH', value: '23', reference_range: LH_REF, cycleDay: 14 })?.position, 'within')

// ── Everything that MUST stay null. A wrong band is worse than no band.
check('no cycle day', resolveMarkerBand({ name: 'LH', value: '23', reference_range: LH_REF, cycleDay: null }), null)
check('implausible cycle day', resolveMarkerBand({ name: 'LH', value: '23', reference_range: LH_REF, cycleDay: 55 }), null)
check('range is not phase-dependent', resolveMarkerBand({ name: 'Hb', value: '157', reference_range: '115-165', cycleDay: 22 }), null)
check('no range at all', resolveMarkerBand({ name: 'LH', value: '23', reference_range: null, cycleDay: 22 }), null)
check('value cannot be read', resolveMarkerBand({ name: 'LH', value: 'not detected', reference_range: LH_REF, cycleDay: 22 }), null)
check('no band printed for that phase', resolveMarkerBand({ name: 'Prog', value: '2', reference_range: PROG_REF, cycleDay: 14 }), null)

console.log(`\n${pass} passed, ${failures.length} failed`)
for (const f of failures) console.log(`\n  FAIL  ${f}`)
if (failures.length) process.exit(1)
console.log('\nAll good. The resolver picks a band only when the dates, the range and the value are all readable.')
