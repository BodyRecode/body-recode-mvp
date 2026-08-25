/**
 * Proves the page gate and the email sends open a lesson at the same instant,
 * for a spread of enrolment times including the awkward ones.
 */
import { currentDecodeDay, decodeDayOpensAt, decodeFirstMorning, isDayUnlocked, DECODE_DAYS } from '../src/lib/decode-days'

const BNE = (d: Date) => d.toLocaleString('en-AU', { timeZone: 'Australia/Brisbane', weekday: 'short', hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })

// Mirrors decodeDailyArcFunction: sleepUntil(decodeFirstMorning(enrolled_at)),
// then one email per morning.
function emailTimeFor(enrolled: Date, day: number): Date {
  const first = decodeFirstMorning(enrolled)
  return new Date(first.getTime() + (day - 1) * 86_400_000)
}

const CASES = [
  ['midday',            '2026-08-25T01:33:00Z'],  // Tue 11:33am BNE - Kade's test
  ['just before 7am',   '2026-08-25T20:59:00Z'],  // Wed 06:59am BNE - the double-send case
  ['just after 7am',    '2026-08-25T21:01:00Z'],  // Wed 07:01am BNE
  ['4am, inside gap',   '2026-08-25T18:00:00Z'],  // Wed 04:00am BNE
  ['late evening',      '2026-08-25T13:00:00Z'],  // Tue 11:00pm BNE - 8h gap, allowed
  ['midnight',          '2026-08-25T14:00:00Z'],  // Wed 12:00am BNE
]

const MIN_GAP_H = 3

let bad = 0
for (const [label, iso] of CASES) {
  const enrolled = new Date(iso)
  const gapH = (decodeFirstMorning(enrolled).getTime() - enrolled.getTime()) / 3_600_000
  const gapOk = gapH >= MIN_GAP_H
  if (!gapOk) bad++
  console.log(`\n${label}  (enrolled ${BNE(enrolled)})  gap to first email: ${gapH.toFixed(1)}h ${gapOk ? '' : '*** TOO SOON ***'}`)
  for (const d of DECODE_DAYS) {
    const opens = decodeDayOpensAt(enrolled, d.day)
    const email = emailTimeFor(enrolled, d.day)
    // Does the gate agree the day is open at exactly its open time?
    const openAtOpen = isDayUnlocked(d.day, currentDecodeDay(enrolled, opens))
    // And still shut one minute earlier?
    const shutBefore = d.day === 1 || !isDayUnlocked(d.day, currentDecodeDay(enrolled, new Date(opens.getTime() - 60_000)))
    const aligned = d.day === 1 ? true : opens.getTime() === email.getTime()
    const ok = openAtOpen && shutBefore && aligned
    if (!ok) bad++
    console.log(`  Day ${d.day}  opens ${BNE(opens)}   email ${BNE(email)}   ${ok ? 'aligned' : '*** MISMATCH ***'}`)
  }
}
console.log(bad === 0 ? '\nALL ALIGNED' : `\n${bad} MISMATCHES`)
