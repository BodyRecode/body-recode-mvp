// The $37 Body Decode Report was retired on 24 August 2026.
//
// It sold a five-part written read off the back of the scorecard. The Body
// Decode (Funnel B Stage 1) now gives every signup the same five-part read for
// free on day 5, so the paid version sold her something she was about to be
// handed. While the two funnels barely shared traffic that clash was invisible;
// the moment Stage 1 opened with the scorecard it became a contradiction
// visible inside one session, on one page.
//
// SELLING is closed. DELIVERY is not: /report/[token], /report/pending, the
// `scorecard_reports` table and the Stripe webhook branch all stay exactly as
// they are, so anyone who already paid keeps what they bought and any session
// that was already in flight still completes.
//
// Kade's decision, 24 Aug 2026. Do not re-open these routes to "test a price"
// without re-reading the above; the reason is product overlap, not price.

export const REPORT_RETIRED = {
  error: 'retired',
  message:
    'The Body Decode Report is no longer sold separately. The same read is now included free in The Body Decode.',
} as const
