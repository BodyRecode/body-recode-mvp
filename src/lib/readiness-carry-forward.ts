/**
 * Carrying re-scored exposure readiness into a new training block.
 *
 * THE PROBLEM (found 2026-08-30 on Cristobal at week 8):
 * `generate-program` derives its eligibility level and doctrine clamp from
 * `cffs.exposure_readiness_*`. Those are scored ONCE, at intake, and never
 * move again. But readiness is genuinely re-scored EVERY WEEK in the CFWS.
 *
 * Cristobal's CFFS (11 Jul) said regulation Red. Every weekly synthesis from
 * week 3 to week 8 said regulation Green. Six consecutive weeks. Because the
 * generator only ever read the CFFS, his next block would have been clamped to
 * Stabilisation Only on a constraint the data cleared five weeks earlier.
 *
 * A first attempt at the state carry-forward told the prompt "where a readiness
 * flag is more restrictive than the re-scored state implies, apply the more
 * restrictive constraint". That sounds conservative and is not: it guarantees a
 * stale Red beats six weeks of Green. It does not fail safe, it fails stuck.
 *
 * THE RULE, deliberately one rule in both directions so it stays predictable:
 * a domain is carried only when the last `WINDOW` consecutive weekly syntheses
 * agree UNANIMOUSLY on it. Unanimity is what stops a single disrupted week from
 * moving a clamp — Cristobal's week 8 schedule dropped to Amber for travel, and
 * under this rule schedule is simply not carried that week rather than flipping.
 *
 * Consistent with existing doctrine: `sustained_instability` reassessment
 * triggers already fire off two consecutive CFWS, so consecutive weeklies are
 * already treated as authoritative for driving action.
 *
 * This NEVER writes to `cffs`. The foundational read is untouched; the carry is
 * applied to an in-memory copy for one generation and recorded on the block.
 */

export const READINESS_DOMAINS = ['capacity', 'schedule', 'regulation', 'behaviour'] as const
export type ReadinessDomain = (typeof READINESS_DOMAINS)[number]

/** How many consecutive weekly syntheses must agree before a domain carries. */
export const WINDOW = 3

export type ReadinessValue = 'Green' | 'Amber' | 'Red'

export interface WeeklyReadinessRow {
  week_number: number
  exposure_readiness_capacity: string | null
  exposure_readiness_schedule: string | null
  exposure_readiness_regulation: string | null
  exposure_readiness_behaviour: string | null
}

export interface DomainCarry {
  domain: ReadinessDomain
  /** What the CFFS still says. */
  foundational: string | null
  /** Unanimous value across the window, or null when the weeks disagree. */
  weekly: ReadinessValue | null
  /** True when `weekly` is set AND differs from `foundational`. */
  carried: boolean
  /** Why it did not carry, for the coach-facing panel. */
  heldReason: 'weeks_disagree' | 'matches_foundational' | 'insufficient_weeks' | null
}

export interface ReadinessCarryForward {
  /** Weeks actually examined, newest first. Empty when there is no CFWS. */
  weeksExamined: number[]
  domains: DomainCarry[]
  /** True when at least one domain would change. */
  hasChange: boolean
}

const COLUMN: Record<ReadinessDomain, keyof WeeklyReadinessRow> = {
  capacity: 'exposure_readiness_capacity',
  schedule: 'exposure_readiness_schedule',
  regulation: 'exposure_readiness_regulation',
  behaviour: 'exposure_readiness_behaviour',
}

const normalise = (v: unknown): ReadinessValue | null => {
  if (typeof v !== 'string') return null
  const t = v.trim().toLowerCase()
  if (t === 'green') return 'Green'
  if (t === 'amber') return 'Amber'
  if (t === 'red') return 'Red'
  return null
}

export interface FoundationalReadiness {
  exposure_readiness_capacity: string | null
  exposure_readiness_schedule: string | null
  exposure_readiness_regulation: string | null
  exposure_readiness_behaviour: string | null
}

/**
 * Pure derivation. `weeklyRows` may arrive in any order; the newest WINDOW
 * rows by week_number are the ones considered.
 */
export function deriveReadinessCarryForward(
  weeklyRows: WeeklyReadinessRow[],
  foundational: FoundationalReadiness | null
): ReadinessCarryForward {
  const window = [...weeklyRows]
    .sort((a, b) => b.week_number - a.week_number)
    .slice(0, WINDOW)

  const enough = window.length >= WINDOW

  const domains: DomainCarry[] = READINESS_DOMAINS.map(domain => {
    const foundationalValue = foundational?.[COLUMN[domain] as keyof FoundationalReadiness] ?? null

    if (!enough) {
      return { domain, foundational: foundationalValue, weekly: null, carried: false, heldReason: 'insufficient_weeks' }
    }

    const values = window.map(r => normalise(r[COLUMN[domain]]))
    const first = values[0]
    const unanimous = first !== null && values.every(v => v === first)

    if (!unanimous) {
      return { domain, foundational: foundationalValue, weekly: null, carried: false, heldReason: 'weeks_disagree' }
    }
    if (normalise(foundationalValue) === first) {
      return { domain, foundational: foundationalValue, weekly: first, carried: false, heldReason: 'matches_foundational' }
    }
    return { domain, foundational: foundationalValue, weekly: first, carried: true, heldReason: null }
  })

  return {
    weeksExamined: window.map(r => r.week_number),
    domains,
    hasChange: domains.some(d => d.carried),
  }
}

/**
 * Applies the carried domains onto a copy of the foundational readiness.
 * Domains that did not carry keep their CFFS value. Never mutates the input.
 */
export function applyReadinessCarryForward<T extends FoundationalReadiness>(
  foundational: T,
  carry: ReadinessCarryForward
): T {
  const out = { ...foundational }
  for (const d of carry.domains) {
    if (d.carried && d.weekly) {
      out[COLUMN[d.domain] as keyof FoundationalReadiness] = d.weekly as T[keyof FoundationalReadiness]
    }
  }
  return out
}

/**
 * Render the weekly readiness record as EVIDENCE for a prompt.
 *
 * Added 2026-09-08. `applyReadinessCarryForward` above silently substitutes a
 * value, which is right for a program generator: it needs one number to clamp
 * against and no opinion about it.
 *
 * The foundational read is the opposite case. It must stay the anchor, because
 * the weekly synthesis scores itself AGAINST the foundational read. If the
 * foundational read then took its numbers from the weeklies, the two would be
 * reading each other: one drifting week nudges the foundational read, that
 * becomes the new anchor, the next week drifts further from it, and nothing
 * holds still.
 *
 * So the foundational read is shown what the weeks say and made to reconcile
 * it in the open, rather than being handed a substituted number or left blind
 * to a month of data. Informed by the weeklies, not scored from them.
 */
export function formatReadinessEvidenceForPrompt(
  carry: ReadinessCarryForward
): string | null {
  if (!carry.weeksExamined.length) return null

  const lines: string[] = []
  lines.push('WEEKLY READINESS EVIDENCE (from the coach-facing weekly syntheses, NOT a substitute for your own read):')
  lines.push(
    `Weeks examined, newest first: ${carry.weeksExamined.join(', ')}. A domain below is only reported as agreed when all ${WINDOW} of those weeks give the SAME value. One disrupted week is deliberately not enough to move anything.`
  )

  for (const d of carry.domains) {
    const label = d.domain.charAt(0).toUpperCase() + d.domain.slice(1)
    if (d.weekly && d.carried) {
      lines.push(
        `  - ${label}: the last ${WINDOW} weeks agree on ${d.weekly}. The intake-based read says ${d.foundational ?? 'unscored'}. These DISAGREE.`
      )
    } else if (d.weekly) {
      lines.push(`  - ${label}: the last ${WINDOW} weeks agree on ${d.weekly}, matching the intake-based read.`)
    } else if (d.heldReason === 'weeks_disagree') {
      lines.push(`  - ${label}: the weeks do NOT agree, so they carry no weight here. Score this from the intake evidence.`)
    } else {
      lines.push(`  - ${label}: fewer than ${WINDOW} weekly syntheses on file. Score this from the intake evidence.`)
    }
  }

  lines.push(
    'How to use this. Where the weeks unanimously disagree with the intake-based read, that is real evidence and you should generally follow it, because intake answers describe how life was on one day months ago and the weeks describe how it has actually been since. Say in pattern_rationale which you went with and why. Where the weeks agree with the intake read, or do not agree with each other, score the domain from the intake evidence as normal. Never move a domain more than one step (Green to Amber, or Amber to Red) on weekly evidence alone.'
  )

  return lines.join('\n')
}
