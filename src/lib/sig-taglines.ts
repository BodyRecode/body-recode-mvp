/**
 * Personal email signature tagline bank.
 *
 * Rendered into a small image by `/api/sig-tag` and embedded under Kade's
 * Gmail signature. The endpoint picks one entry per day (day-of-year mod
 * bank length) so the same recipient who emails twice in a week sees the
 * line change — small surprise without being a moving banner.
 *
 * Tone rules (matches [[feedback_branded_emails]] and Doctrine Positioning Bank):
 *   - No fat-loss / weight-loss language. State-language only.
 *   - No claims, promises, or guarantees.
 *   - Short. < 90 chars so it fits one line at 14px / 480px wide.
 *   - First-person plural ("we") only when referring to the practice; otherwise
 *     stay declarative about the system.
 *   - No em dashes (per [[feedback_no_em_dashes]]). Use hyphens or rewrite.
 *
 * Add a line: append to TAGLINES; rotation index will pick it up on deploy.
 */
export const TAGLINES: string[] = [
  'Body composition is a signal, not a behaviour problem.',
  'The plan is downstream of the interpretation.',
  'Most plateaus are a reading error, not a willpower one.',
  'Compliance without interpretation is just well-organised guessing.',
  'The body keeps better notes than the spreadsheet.',
  'You cannot out-train a misread of the system.',
  'Read the body first. Prescribe second.',
  'Calories are a unit. Context is the answer.',
  'Stalls are data. Most coaches throw them away.',
  'The fastest fix is rarely the right one.',
  'Performance is what the system can absorb, not what you can survive.',
  'A protocol without a person is just paperwork.',
  'Hormones do not negotiate. They get read.',
  'The interpretive layer is the product. Everything else is delivery.',
]

/** Deterministic day-of-year rotation. Same calendar day = same tagline globally. */
export function taglineForDate(date = new Date()): string {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0)
  const diff = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start
  const dayOfYear = Math.floor(diff / 86_400_000)
  return TAGLINES[dayOfYear % TAGLINES.length]
}
