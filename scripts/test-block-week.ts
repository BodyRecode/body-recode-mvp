/**
 * Which week of the block is it? This has now broken twice in five weeks, both
 * times leaving a coach unable to log the session he was standing there running.
 *
 *   npm run test:block-week
 */
import { currentBlockWeek } from '../src/lib/workout-logging'

let pass = 0, fail = 0
const check = (name: string, got: number, want: number) => {
  if (got === want) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}: got week ${got}, expected ${want}`) }
}
/** A Brisbane wall-clock moment, as a timestamp. Brisbane is UTC+10, no DST. */
const bne = (s: string) => new Date(`${s}+10:00`).getTime()

console.log('\nTHE MONDAY ROLLOVER (Razia and Samantha, 21 Sep 2026)')
// Her block was generated Tuesday 8 Sep 10:03am. Monday of that week is 7 Sep.
check('Tue 8 Sep, the day it was activated', currentBlockWeek('2026-09-08T00:03:00Z', bne('2026-09-08T10:03:00')), 1)
check('Sun 13 Sep, still week 1', currentBlockWeek('2026-09-08T00:03:00Z', bne('2026-09-13T23:59:00')), 1)
check('Mon 14 Sep 12:01am, week 2 begins', currentBlockWeek('2026-09-08T00:03:00Z', bne('2026-09-14T00:01:00')), 2)
check('MON 21 SEP 5:30pm, the report: week 3', currentBlockWeek('2026-09-08T00:03:00Z', bne('2026-09-21T17:30:00')), 3)
// Samantha: generated Tuesday 1 Sep 5:19pm. Monday of that week is 31 Aug.
check('Samantha on Mon 21 Sep, week 4', currentBlockWeek('2026-09-01T07:19:00Z', bne('2026-09-21T17:30:00')), 4)

console.log('\nTIME OF DAY NEVER DECIDES THE WEEK (Cristobal, 7 Sep 2026)')
check('8am Monday', currentBlockWeek('2026-08-31T02:20:00Z', bne('2026-09-07T08:00:00')), 2)
check('11:59pm the same Monday', currentBlockWeek('2026-08-31T02:20:00Z', bne('2026-09-07T23:59:00')), 2)
check('12:01am that Monday', currentBlockWeek('2026-08-31T02:20:00Z', bne('2026-09-07T00:01:00')), 2)

console.log('\nEVERY START DAY LANDS THE SAME WAY')
// Whatever day a block is generated, the week it started is week 1 and the
// following Monday starts week 2.
for (const [day, iso] of [['Monday', '2026-09-07'], ['Tuesday', '2026-09-08'], ['Wednesday', '2026-09-09'],
                          ['Thursday', '2026-09-10'], ['Friday', '2026-09-11'], ['Saturday', '2026-09-12'], ['Sunday', '2026-09-13']] as const) {
  const gen = `${iso}T04:00:00Z` // 2pm Brisbane
  check(`generated ${day}: that Sunday is week 1`, currentBlockWeek(gen, bne('2026-09-13T20:00:00')), 1)
  check(`generated ${day}: next Monday is week 2`, currentBlockWeek(gen, bne('2026-09-14T06:00:00')), 2)
}

console.log('\nEDGES')
check('before the block starts, week 1', currentBlockWeek('2026-10-05T00:00:00Z', bne('2026-09-21T17:30:00')), 1)
check('exactly the Monday midnight boundary', currentBlockWeek('2026-09-08T00:03:00Z', bne('2026-09-14T00:00:00')), 2)
check('a long block, week 12 holds', currentBlockWeek('2026-09-08T00:03:00Z', bne('2026-11-23T09:00:00')), 12)

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail > 0 ? 1 : 0)
