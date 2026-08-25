/**
 * 7am Brisbane, in one place.
 *
 * EXTRACTED 25 Aug 2026. This lived privately inside inngest-functions.ts while
 * the Body Decode PAGE used a completely different clock - rolling 24h from the
 * moment someone enrolled. So the two drifted: a lesson opened at 11:33am and
 * its email arrived at 7am the following morning, which meant that from lunch
 * time onward the portal header counted a day she had never been prompted for.
 *
 * Two clocks for one cadence is what caused that, so there is now one function
 * and both the sends and the gate import it. Do not re-declare this locally.
 *
 * Brisbane does not observe daylight saving, so AEST is a fixed UTC+10 and a
 * fixed-offset calculation is correct all year. This would be wrong for Sydney
 * or Melbourne.
 */

/**
 * The next 7am AEST at or after `from`.
 *
 * If `from` is before today's 7am AEST, returns today's 7am; otherwise
 * tomorrow's.
 */
export function nextMorningAEST(from: Date): Date {
  // 7am AEST = 21:00 UTC on the PREVIOUS UTC day, since Brisbane is UTC+10.
  const target = new Date(from)
  target.setUTCHours(21, 0, 0, 0)
  if (target <= from) {
    target.setUTCDate(target.getUTCDate() + 1)
  }
  return target
}
