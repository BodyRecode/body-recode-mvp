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
