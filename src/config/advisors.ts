// Independent advisory group for the Body Recode™ doctrine.
//
// SINGLE SOURCE OF TRUTH. Both the public Performance Coaching page and the
// (noindex) Engine page render from this file. Edit here and both update.
//
// STATUS (11 Aug 2026): all three advisors have AGREED to review the doctrine.
// They are shown anonymously by credential for now. As each finalises their
// review, fill in `name`, `credentials`, `photo` and (optional) `href`, and the
// cards upgrade themselves automatically. Only publish a name once that person
// has confirmed you may use it.

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
  heading: 'Reviewed, not just built.',
  intro:
    "Body Recode's doctrine sits under independent review by a small advisory group of practising clinicians and high-performance specialists. Before a method reaches you, it has been pressure-tested by people who work at the top of their fields.",
  note: 'Full names, credentials and profiles are being added as each advisor’s review is finalised.',
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
