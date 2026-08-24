import { redirect } from 'next/navigation'

/**
 * The $37 Body Decode Report sales page.
 *
 * Retired 24 Aug 2026 - see src/lib/scorecard-report-retired.ts. The page is
 * kept as a redirect rather than deleted because it is linked from the live
 * scorecard follow-up email sequence, which cannot be safely re-seeded from
 * code (see project_scorecard_sequence_seed_vs_live: the live copy in
 * be_workflow_steps is NEWER than the seed, so a re-sync destroys it). Until
 * those emails are edited by hand in the UI, people will keep arriving here,
 * and they should land on the scorecard rather than a 404.
 *
 * Delivery of already-purchased reports is unaffected and lives at
 * /report/[token].
 */
export default function GetReportRetired() {
  redirect('/scorecard')
}
