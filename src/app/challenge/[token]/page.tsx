import { redirect } from 'next/navigation'

/**
 * The Challenge portal hub. CUT OVER 24 Aug 2026 to /decode/[token].
 *
 * Safe because the two products write the SAME `challenge_enrollments` row, so
 * the token is already valid in the new portal and nothing is migrated. Also
 * safe because zero real enrolments were still inside their 14 days when this
 * shipped: the most recent was 7 August. Verified against the database.
 *
 * WHAT IS DELIBERATELY *NOT* REDIRECTED, and this is the important part.
 *
 * The sibling routes stay live:
 *   day-5 · day-7 · day-14 · check-in · training · nutrition
 *
 * `PORTAL_ACCESS_STATUSES` includes 'completed' on purpose, so people who
 * finished the Challenge keep access to what they earned. `day-14` in
 * particular is their Body Decode Report, linked from the email they were sent,
 * and `training` / `nutrition` are the plan they worked from. Redirecting those
 * to the new hub would take a finished deliverable away from someone who
 * completed a fourteen-day programme to get it. Anyone landing on the HUB gets
 * moved forward; anyone opening a specific artefact still gets the artefact.
 *
 * The previous hub is at _archived-portal-page.tsx.bak and in git history.
 */
export default async function ChallengePortalCutover({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  redirect(`/decode/${token}`)
}
