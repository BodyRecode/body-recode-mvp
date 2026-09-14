/**
 * The heads-up timing, against the same clock as the Progress Check.
 *   npm run test:heads-up
 */
import { decideHeadsUp } from '../src/lib/progress-check-heads-up'

let failed = 0, passed = 0
const check = (name: string, cond: boolean, detail?: unknown) => {
  if (cond) { passed++; console.log(`  PASS  ${name}`) } else { failed++; console.log(`  FAIL  ${name}`, detail ?? '') }
}
const DAY = 86_400_000
const read = Date.UTC(2026, 5, 1)
const base = { lastReadAtMs: read, blockFinalWeekStartsAtMs: null, checkRaisedSinceLastRead: false, headsUpSentSinceLastRead: false }

check('day 76 after her read: too early', decideHeadsUp({ ...base, nowMs: read + 76 * DAY }).send === false)
check('day 77, exactly a week out: sends', decideHeadsUp({ ...base, nowMs: read + 77 * DAY }).send === true)
check('day 80: sends', decideHeadsUp({ ...base, nowMs: read + 80 * DAY }).send === true)
check('day 83.5, due within a day: does not (the check itself is next)', decideHeadsUp({ ...base, nowMs: read + 83.5 * DAY }).send === false)
check('day 90, overdue: does not', decideHeadsUp({ ...base, nowMs: read + 90 * DAY }).send === false)
check('already sent this cycle: does not send twice', decideHeadsUp({ ...base, nowMs: read + 80 * DAY, headsUpSentSinceLastRead: true }).send === false)
check('a check already raised: no heads-up', decideHeadsUp({ ...base, nowMs: read + 80 * DAY, checkRaisedSinceLastRead: true }).send === false)
check('no read yet: nothing to re-read, no heads-up', decideHeadsUp({ ...base, lastReadAtMs: null, nowMs: read + 80 * DAY }).send === false)
const block = read + 56 * DAY
check('a block final week at day 56 brings it forward: day 50 sends', decideHeadsUp({ ...base, blockFinalWeekStartsAtMs: block, nowMs: read + 50 * DAY }).send === true)
check('...and the due date reported is the block, not 12 weeks', decideHeadsUp({ ...base, blockFinalWeekStartsAtMs: block, nowMs: read + 50 * DAY }).dueAtMs === block)
check('an old block final week from before her read is ignored', decideHeadsUp({ ...base, blockFinalWeekStartsAtMs: read - 10 * DAY, nowMs: read + 80 * DAY }).send === true)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
