// Collective Fit Scorecard — scoring logic.
// Pure functions: given a coach's answers, score four fit dimensions and roll
// them into one of three tiers. Mirrors the Lead Quality Filter approach
// (green/amber/red per dimension → tier). See COLLECTIVE_FIT_SCORECARD.md.

export type Modality = 'strength' | 'yoga' | 'pilates' | 'other'
export type MethodClarity = 'documented' | 'in_head' | 'figuring_out'
export type Audience = 'engaged' | 'building' | 'not_yet'
export type Timeline = 'now' | 'few_months' | 'exploring'
export type Mindset = 'ownership' | 'cheap_tool'

export interface FitAnswers {
  modality: Modality
  method_clarity: MethodClarity
  audience: Audience
  timeline: Timeline
  mindset: Mindset
}

export type Rating = 'green' | 'amber' | 'red'
export type Tier = 'ready' | 'building' | 'not_yet'

export interface FitResult {
  tier: Tier
  dimensions: { method: Rating; audience: Rating; modality: Rating; readiness: Rating }
}

function methodRating(m: MethodClarity): Rating {
  return m === 'documented' ? 'green' : m === 'in_head' ? 'amber' : 'red'
}
function audienceRating(a: Audience): Rating {
  return a === 'engaged' ? 'green' : a === 'building' ? 'amber' : 'red'
}
// Strength + Yoga are live modality packs; Pilates is next (amber); anything
// else has no path yet (red / hard gate).
function modalityRating(m: Modality): Rating {
  return m === 'strength' || m === 'yoga' ? 'green' : m === 'pilates' ? 'amber' : 'red'
}
function readinessRating(t: Timeline, mind: Mindset): Rating {
  if (mind === 'cheap_tool') return 'red'
  return t === 'now' ? 'green' : t === 'few_months' ? 'amber' : 'red'
}

export function scoreFit(a: FitAnswers): FitResult {
  const dimensions = {
    method: methodRating(a.method_clarity),
    audience: audienceRating(a.audience),
    modality: modalityRating(a.modality),
    readiness: readinessRating(a.timeline, a.mindset),
  }

  const reds = Object.values(dimensions).filter(r => r === 'red').length
  const greens = Object.values(dimensions).filter(r => r === 'green').length

  // Hard gates → not yet: an unsupported modality (no pack + no appetite path)
  // or a cheap-tool mindset (wrong fit for the Collective).
  let tier: Tier
  if (a.modality === 'other' || a.mindset === 'cheap_tool') tier = 'not_yet'
  else if (reds >= 2) tier = 'not_yet'
  else if (greens >= 3 && reds === 0) tier = 'ready'
  else tier = 'building'

  return { tier, dimensions }
}
