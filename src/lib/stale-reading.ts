/**
 * Is a published client-facing reading still describing the thing it was written
 * about?
 *
 * Found 2026-07-30 on Vicki S. Two client-facing readings were live in her
 * portal describing artefacts that had since been replaced:
 *
 *   - Her program reading was published at 03:02 against a program of three
 *     exercises and a plank. The sessions were rebuilt an hour later with hip
 *     thrusts, calf work and hip abduction. She could read a description of a
 *     workout she did not have.
 *   - Her Foundational Reading said "we're not introducing calorie restriction
 *     or tightening your nutrition further". True when written. Her active plan
 *     now carries a 193 kcal deficit and 50g less carbohydrate.
 *
 * Nothing warned about either. A reading is a snapshot of reasoning at a moment;
 * regenerating the plan underneath it does not regenerate the explanation, and
 * the client reads both.
 *
 * This is deliberately a comparison of timestamps rather than of content. Asking
 * a model whether a reading still matches a plan is slow, costs money on every
 * page load, and can be wrong. "The plan changed after the reading was
 * published" is cheap, certain, and enough to make the coach look.
 */

export interface StaleReadingCheck {
  stale: boolean
  /** Coach-facing sentence. Null when nothing is wrong. */
  message: string | null
  publishedAt: Date | null
  changedAt: Date | null
}

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * @param publishedAt when the reading went live in the client's portal
 * @param artefactChangedAt when the thing it describes was last regenerated
 * @param label what the reading describes, e.g. "training program"
 */
export function checkReadingFreshness(
  publishedAt: string | Date | null | undefined,
  artefactChangedAt: string | Date | null | undefined,
  label: string,
): StaleReadingCheck {
  const pub = toDate(publishedAt)
  const changed = toDate(artefactChangedAt)

  // Not published means nothing is in front of the client, so nothing is wrong.
  if (!pub) return { stale: false, message: null, publishedAt: null, changedAt: changed }
  if (!changed) return { stale: false, message: null, publishedAt: pub, changedAt: null }

  // A minute of slack: publishing a reading immediately after generating the
  // artefact is the normal, correct order and must not warn.
  const GRACE_MS = 60_000
  if (changed.getTime() - pub.getTime() <= GRACE_MS) {
    return { stale: false, message: null, publishedAt: pub, changedAt: changed }
  }

  const hours = Math.round((changed.getTime() - pub.getTime()) / 3_600_000)
  const when = hours < 1 ? 'minutes' : hours < 24 ? `${hours} hour${hours === 1 ? '' : 's'}`
    : `${Math.round(hours / 24)} day${Math.round(hours / 24) === 1 ? '' : 's'}`

  return {
    stale: true,
    publishedAt: pub,
    changedAt: changed,
    message:
      `This reading was published to the client before the ${label} was last changed ` +
      `(${when} earlier). It may describe a version they no longer have. Regenerate it ` +
      `or unpublish it.`,
  }
}
