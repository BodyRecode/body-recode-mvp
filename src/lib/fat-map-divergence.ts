// Reported-vs-measured fat-distribution divergence.
//
// The intake asks the client where they store fat (self-report: fm_01 midsection,
// fm_06 hips/thighs). The baseline tape gives a waist-to-hip ratio (measured).
// When the self-report and the tape disagree, that gap is a coaching signal worth
// reconciling before the Fat Map read is trusted, and a hormonal-shift pattern is
// one thing worth ruling in or out. This is the exact miss in the case where a
// client's reported midsection storage did not match her measured ratio.
//
// Non-diagnostic by construction: it only flags the divergence and points toward
// the pattern + a clinician. Signals suggest, they do not diagnose.

export interface FatDistributionDivergence {
  reported: 'central' | 'lower'
  measured: 'central' | 'lower'
  whr: number
  headline: string
  detail: string
}

// WHO-style waist-to-hip bands, sex-specific. Central = abdominal storage,
// lower = gluteofemoral. The middle band is treated as ambiguous (no flag).
function measuredRegion(whr: number, gender: string | null | undefined): 'central' | 'lower' | 'mid' {
  const g = (gender ?? '').toLowerCase()
  const female = g === 'female' || g === 'woman' || g === 'f'
  const highCut = female ? 0.85 : 0.90
  const lowCut = female ? 0.80 : 0.85
  if (whr >= highCut) return 'central'
  if (whr < lowCut) return 'lower'
  return 'mid'
}

export function computeFatDistributionDivergence(input: {
  fatMapResponses: Record<string, unknown> | null | undefined
  gender: string | null | undefined
  waistCm: number | null | undefined
  hipsCm: number | null | undefined
}): FatDistributionDivergence | null {
  const fm = input.fatMapResponses ?? {}
  const num = (v: unknown): number | null => (typeof v === 'number' ? v : null)
  const midScore = num(fm.fm_01) // "store fat primarily around my midsection"
  const lowerScore = num(fm.fm_06) // "store fat predominantly around my hips and thighs"

  const waist = input.waistCm
  const hips = input.hipsCm
  if (waist == null || hips == null || !(hips > 0) || !(waist > 0)) return null
  const whr = Math.round((waist / hips) * 100) / 100

  // Dominant self-reported region: clearly strong (>= 3 of 4) and clearly ahead
  // of the other region (>= 2 points). Anything less is not a confident report.
  let reported: 'central' | 'lower' | null = null
  if (midScore != null && lowerScore != null) {
    if (midScore >= 3 && midScore - lowerScore >= 2) reported = 'central'
    else if (lowerScore >= 3 && lowerScore - midScore >= 2) reported = 'lower'
  } else if (midScore != null && midScore >= 3) reported = 'central'
  else if (lowerScore != null && lowerScore >= 3) reported = 'lower'
  if (!reported) return null

  const measured = measuredRegion(whr, input.gender)
  if (measured === 'mid') return null // ambiguous ratio, no confident clash

  const clash =
    (reported === 'central' && measured === 'lower') ||
    (reported === 'lower' && measured === 'central')
  if (!clash) return null

  const reportedLabel = reported === 'central' ? 'around the midsection' : 'around the hips and thighs'
  const measuredLabel = measured === 'central' ? 'a central (abdominal) ratio' : 'a lower-body ratio'

  return {
    reported,
    measured,
    whr,
    headline: 'Reported and measured fat distribution disagree',
    detail: `She reports storing fat ${reportedLabel}, but her waist-to-hip ratio of ${whr} reads as ${measuredLabel}. That gap is worth reconciling before the Fat Map pattern is trusted. A hormonal-shift pattern is one thing worth ruling in or out, so a blood panel and a GP conversation are worth considering. Signals suggest, they do not diagnose.`,
  }
}
