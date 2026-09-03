// Independent advisory group for the Body Recode™ doctrine.
//
// SINGLE SOURCE OF TRUTH. Both the public Performance Coaching page and the
// (noindex) Engine page render from this file. Edit here and both update.
//
// STATUS (3 Sep 2026): NOBODY HAS BEEN ASKED YET. An earlier note in this file
// said all three had agreed; that was not the case, and the copy below had been
// written as though the reviews were underway. Every line here is now
// forward-looking on purpose.
//
// As each person actually agrees and finishes, fill in `name`, `credentials`,
// `photo` and (optional) `href` and the cards upgrade themselves. Only publish a
// name once that person has confirmed you may use it, and only move this copy to
// the past tense once there is a completed review behind it.

export type Advisor = {
  id: string
  /** Public now: what they are, e.g. "Sports medicine physician" */
  role: string
  /** Public now: a non-identifying qualifier, e.g. "European-trained" */
  detail: string
  /** Public now: the scope of their review */
  reviewing: string
  /** Added later, once confirmed for public use */
  name?: string
  /** Added later, e.g. "MBBS, Sports & Exercise Medicine" */
  credentials?: string
  /** Added later: path under /public, e.g. "/advisors/danny.jpg" */
  photo?: string
  /** Added later: a reference / profile link */
  href?: string
}

export const ADVISORY = {
  eyebrow: 'Independent Review',
  heading: 'Built to be reviewed.',
  intro:
    "The Body Recode\u2122 doctrine is being submitted for independent review by a small advisory group of practising clinicians and high-performance specialists. The full doctrine is written down, it names the claims it has withdrawn, and it is being put in front of people qualified to challenge it.",
  // Short "backed by" line for a hero or trust strip. Kept identical in wording
  // to the performance-bodyrecode copy so the two sites never drift apart.
  oneLiner:
    'The Body Recode\u2122 doctrine is being submitted for independent review by an advisory group of practising clinicians and high-performance specialists.',
  note: 'Reviews are being sought now. Names and credentials will be published only where an advisor has completed a review and agreed to be named.',
  advisors: [
    {
      id: 'sports-medicine',
      role: 'Sports medicine physician',
      detail: 'European-trained',
      reviewing:
        'how the system reads hormonal and regulatory state, and where it should defer to clinical care.',
    },
    {
      id: 'physiotherapist',
      role: 'Elite-sport physiotherapist',
      detail: 'Works with professional athletes',
      reviewing: 'how the system reads load, recovery and readiness.',
    },
    {
      id: 'performance-coach',
      role: 'High-performance coach',
      detail: 'Competitive physique athlete',
      reviewing: 'the training, nutrition and supplementation logic.',
    },
  ] as Advisor[],
}
