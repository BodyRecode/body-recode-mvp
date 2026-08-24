import { redirect } from 'next/navigation'

/**
 * The 14-Day Body Decode Challenge landing page. CUT OVER 24 Aug 2026.
 *
 * Replaced by The Body Decode at /decode. The page is kept as a redirect rather
 * than deleted because the URL is printed on things we cannot edit:
 *
 *   - the gym floor banner and A6 flyer QR codes
 *   - Meta ad creatives already uploaded
 *   - Instagram bio and story links
 *   - the live scorecard follow-up emails until those steps are edited by hand
 *
 * THE QUERY STRING IS PRESERVED DELIBERATELY. The floor banner carries
 * ?utm_source=gym_floor&utm_campaign=funnelb_floor_banner, and that is the only
 * attribution the in-person channel has. Dropping it would make the highest
 * intent surface Body Recode owns look like direct traffic.
 *
 * Cutover was safe because ZERO real enrolments were still inside their 14 days:
 * the most recent was 7 August, so the last cohort finished on the 21st. That
 * was checked against the database rather than assumed.
 *
 * The previous page is at _archived-landing-page.tsx.bak and in git history. It
 * is the frozen master template the landing kit was extracted from, so it is
 * worth being able to read even though nothing renders it now.
 */
export default async function ChallengeCutover({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue
    if (Array.isArray(v)) v.forEach(val => qs.append(k, val))
    else qs.set(k, v)
  }
  const query = qs.toString()
  redirect(`/decode${query ? `?${query}` : ''}`)
}
