import { redirect } from 'next/navigation'

/**
 * The canonical Body State Scorecard lives at performance.bodyrecode.au/scorecard
 * (in the performance-bodyrecode repo). The bodyrecode.au/scorecard URL is preserved
 * as a redirect because it is referenced from many live surfaces:
 *
 *   - Instagram bio link (?source=instagram, ?source=instagram_story)
 *   - LinkedIn profile / post / comment links
 *   - Facebook + Meta ad creatives
 *   - QR codes (floor banner, flyer)
 *   - Internal dashboard source-tracking templates
 *
 * The redirect preserves the query string so source tracking continues to work
 * end-to-end. The performance-bodyrecode scorecard page submits back to this repo's
 * APIs (/api/scorecard/submit, /api/scorecard-report/checkout) so the backend
 * infrastructure stays in place.
 *
 * Removed the local scorecard implementation 2026-05-31 to eliminate the
 * source-of-truth confusion between two scorecard pages on two domains.
 */
export default async function ScorecardRedirect({
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
  redirect(`https://performance.bodyrecode.au/scorecard${query ? `?${query}` : ''}`)
}
