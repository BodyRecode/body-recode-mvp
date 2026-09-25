/**
 * Walks a whole week, hour by hour, and asserts the check-in window says
 * something sane at every one of them.
 *
 * WHY THIS EXISTS. The portal decides whether somebody missed their check-in by
 * looking back seven days from "when does the next window open". On a Friday
 * before 6pm that value was a week wrong, so it looked into a window that had
 * not happened, found nothing, and told EVERY CLIENT they had missed a check-in
 * they had submitted the previous Sunday. It was live for months and only
 * surfaced because Kade opened a real client's portal on a Friday afternoon.
 *
 * A date bug that is only wrong for eighteen hours out of every week will not be
 * caught by looking at the screen, because most of the week it is right. The
 * only thing that catches it is checking every hour.
 *
 *   npx tsx scripts/test-checkin-window.ts
 */

import { getCheckInWindowStatus } from '../src/lib/weekly-checkin-questions'

const BRIS = 10 * 60 * 60 * 1000
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// A Monday 00:00 Brisbane, so the walk covers a full week from a known place.
const start = Date.UTC(2026, 8, 21, 0, 0, 0) - BRIS

let failures = 0
for (let h = 0; h < 24 * 7; h++) {
  const at = start + h * 60 * 60 * 1000
  const bris = new Date(at + BRIS)
  const day = bris.getUTCDay()
  const hour = bris.getUTCHours()
  const w = getCheckInWindowStatus(at)

  const openBris = new Date(w.opensAt.getTime() + BRIS)
  const label = `${DAY[day]} ${String(hour).padStart(2, '0')}:00`
  const problems: string[] = []

  // 1. The window opens on a Friday at 6pm. Always.
  if (!w.isOpen && (openBris.getUTCDay() !== 5 || openBris.getUTCHours() !== 18)) {
    problems.push(`opens ${DAY[openBris.getUTCDay()]} ${openBris.getUTCHours()}:00, which is not Friday 6pm`)
  }

  // 2. It is never more than a week away. THE ORIGINAL FAULT: on a Friday
  //    morning this was eight days out, and the missed-check-in calculation
  //    reads seven days back from it.
  const daysAway = (w.opensAt.getTime() - at) / (24 * 60 * 60 * 1000)
  if (!w.isOpen && daysAway > 7.01) problems.push(`opens ${daysAway.toFixed(1)} days away`)
  if (!w.isOpen && daysAway < 0) problems.push(`opens ${daysAway.toFixed(1)} days ago`)

  // 3. On a Friday before 6pm it opens THAT EVENING, not next week.
  if (day === 5 && hour < 18 && daysAway > 1) {
    problems.push(`it is Friday and the window is ${daysAway.toFixed(1)} days away`)
  }

  // 4. Open exactly when it should be. It closes at 6:30pm Sunday, so the 6pm
  //    hour is still inside the window — my first version of this assertion had
  //    that wrong and blamed the code for it.
  const shouldBeOpen = (day === 5 && hour >= 18) || day === 6 || (day === 0 && hour <= 18)
  if (w.isOpen !== shouldBeOpen) problems.push(`isOpen ${w.isOpen}, expected ${shouldBeOpen}`)

  if (problems.length) {
    failures++
    console.log(`  FAIL  ${label}  ${problems.join('; ')}`)
  }
}

console.log(failures === 0
  ? '\nEvery hour of the week is correct.\n'
  : `\n${failures} of ${24 * 7} hours are wrong.\n`)
process.exit(failures === 0 ? 0 : 1)
