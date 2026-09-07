/**
 * Resolve which of a lab's phase-dependent reference bands applies to a
 * female client's blood marker, given where she was in her cycle.
 *
 * WHY THIS EXISTS
 *
 * Labs print FOUR reference ranges for LH, FSH, oestradiol and progesterone,
 * because normal depends on cycle phase. Razia's 25 Aug 2026 panel printed all
 * four and stated no cycle day, so those markers came back flagged 'unknown'
 * and were unusable: an expensive panel producing nothing on the hormones.
 *
 * The extractor cannot fix this and must not try. Its prompt says "the
 * reference range EXACTLY as printed", "set a flag based ONLY on the lab's own
 * printed reference range", "never substitute your own idea of normal". Those
 * rules are load-bearing for scope of practice. Proved on 8 Sep 2026: handing
 * the extractor the cycle dates in the client note changed nothing, correctly.
 *
 * So the band selection happens HERE instead, and deliberately:
 *   - deterministic, no model. Dates in, band out, and you can check the sum.
 *   - written to a SEPARATE field. The lab's printed range and the lab's own
 *     flag are never overwritten.
 *   - conservative. Anything it cannot parse confidently resolves to null and
 *     the marker keeps reading 'unknown', which is the honest answer.
 *
 * It must reach the MARKER ROWS, not just the prose. On 7 Sep the coach
 * analysis was told the cycle day and handled it well, but the CFFS generated
 * six minutes later read the markers table, saw 'unknown', and wrote "cycle
 * phase was not recorded on the report so it cannot be read conclusively".
 * The table beat the prose. Anything that only informs the prose will lose
 * the same way.
 *
 * SCOPE OF PRACTICE. This picks which printed range applies. It does not
 * diagnose, does not name a condition, and does not decide what an
 * out-of-band value means. That stays with the client's GP.
 */

export type CyclePhase = 'follicular' | 'midcycle' | 'luteal' | 'post_menopausal'

/** A single named band parsed out of a lab's printed reference string. */
export interface ParsedBand {
  phase: CyclePhase
  /** Inclusive lower bound. null means open-ended (e.g. "< 120"). */
  low: number | null
  /** Inclusive upper bound. null means open-ended (e.g. "> 49"). */
  high: number | null
  /** The band exactly as printed, for display and audit. */
  printed: string
}

export interface ResolvedBand {
  phase: CyclePhase
  band: ParsedBand
  /** Where the value sits against THIS band only. */
  position: 'below' | 'within' | 'above'
  /** Plain sentence for a coach or a prompt. Never a clinical conclusion. */
  summary: string
}

/**
 * Cycle day from a period start date and a draw date. Day 1 is the first day
 * of bleeding, which is the convention every lab range is written against.
 * Returns null if either date is missing or the arithmetic is implausible.
 */
export function cycleDayFrom(
  lastPeriodStart: string | Date | null | undefined,
  collectedOn: string | Date | null | undefined
): number | null {
  if (!lastPeriodStart || !collectedOn) return null
  const start = new Date(lastPeriodStart)
  const drawn = new Date(collectedOn)
  if (Number.isNaN(start.getTime()) || Number.isNaN(drawn.getTime())) return null
  const days = Math.floor((drawn.getTime() - start.getTime()) / 86400000)
  const day = days + 1 // day 1 is the first day of bleeding, not day 0
  // A draw before the period, or more than a long cycle after it, means the
  // dates cannot be trusted. Say nothing rather than guess.
  if (day < 1 || day > 60) return null
  return day
}

/**
 * Which phase a cycle day falls in, on a conventional 28-day cycle.
 *
 * Boundaries are deliberately coarse. This is a reading aid, not a clinical
 * instrument, and a self-reported period start is approximate at best. Days
 * 13-16 are treated as midcycle because that is the window the lab's own
 * "midcycle peak" band is written for.
 */
export function phaseForCycleDay(day: number): CyclePhase | null {
  if (day < 1) return null
  if (day <= 12) return 'follicular'
  if (day <= 16) return 'midcycle'
  if (day <= 40) return 'luteal'
  return null // beyond a plausible luteal phase, do not guess
}

const PHASE_PATTERNS: { phase: CyclePhase; re: RegExp }[] = [
  { phase: 'follicular', re: /follicular/i },
  { phase: 'midcycle', re: /mid[\s-]?cycle(?:\s+peak)?/i },
  { phase: 'luteal', re: /luteal/i },
  { phase: 'post_menopausal', re: /post[\s-]?menopausal/i },
]

/** "2-12" | "< 120" | "> 49" | "20 - 110" -> bounds. null if unparseable. */
function parseBounds(raw: string): { low: number | null; high: number | null } | null {
  const t = raw.replace(/,/g, '').trim()
  const range = t.match(/(-?\d+(?:\.\d+)?)\s*(?:-|to|–)\s*(-?\d+(?:\.\d+)?)/i)
  if (range) return { low: Number(range[1]), high: Number(range[2]) }
  const lt = t.match(/[<≤]\s*(-?\d+(?:\.\d+)?)/)
  if (lt) return { low: null, high: Number(lt[1]) }
  const gt = t.match(/[>≥]\s*(-?\d+(?:\.\d+)?)/)
  if (gt) return { low: Number(gt[1]), high: null }
  return null
}

/**
 * Pull the named phase bands out of a lab's printed reference string.
 *
 * Handles the shape QML prints, e.g.
 *   "Phase-dependent (Follicular 2-12, Midcycle Peak 10-130, Luteal 1-17,
 *    Post-Menopausal 15-60); cycle phase not indicated on report"
 *
 * Returns [] for any range that is not phase-dependent, which is most of them.
 */
export function parsePhaseBands(referenceRange: string | null | undefined): ParsedBand[] {
  if (!referenceRange) return []
  const text = String(referenceRange)

  // Find where each phase name starts, then take the text up to the next one.
  const hits: { phase: CyclePhase; index: number; length: number }[] = []
  for (const { phase, re } of PHASE_PATTERNS) {
    const m = text.match(re)
    if (m && m.index != null) hits.push({ phase, index: m.index, length: m[0].length })
  }
  if (hits.length < 2) return [] // one phase name alone is not a phase-dependent range
  hits.sort((a, b) => a.index - b.index)

  const bands: ParsedBand[] = []
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].index + hits[i].length
    const end = i + 1 < hits.length ? hits[i + 1].index : text.length
    const segment = text.slice(start, end)
    const bounds = parseBounds(segment)
    if (!bounds) continue // e.g. "Midcycle rising" carries no numbers
    bands.push({
      phase: hits[i].phase,
      low: bounds.low,
      high: bounds.high,
      printed: `${text.slice(hits[i].index, hits[i].index + hits[i].length)} ${segment.replace(/^[\s:]+|[\s;,)]+$/g, '')}`.trim(),
    })
  }
  return bands
}

/** Numeric value out of a lab's printed value string. "< 1.3" -> 1.3. */
export function parseMarkerValue(value: string | number | null | undefined): number | null {
  if (value == null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const m = String(value).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)
  return m ? Number(m[0]) : null
}

/**
 * Resolve one marker against the band for the client's cycle phase.
 *
 * Returns null, meaning "still cannot say", whenever anything is uncertain:
 * no cycle day, a day outside a plausible cycle, a range that is not
 * phase-dependent, no band printed for that phase, or an unreadable value.
 */
export function resolveMarkerBand(input: {
  name: string
  value: string | number | null | undefined
  unit?: string | null
  reference_range: string | null | undefined
  cycleDay: number | null
}): ResolvedBand | null {
  const { name, value, unit, reference_range, cycleDay } = input
  if (cycleDay == null) return null

  const phase = phaseForCycleDay(cycleDay)
  if (!phase) return null

  const bands = parsePhaseBands(reference_range)
  if (!bands.length) return null

  const band = bands.find(b => b.phase === phase)
  if (!band) return null

  const numeric = parseMarkerValue(value)
  if (numeric == null) return null

  let position: ResolvedBand['position'] = 'within'
  if (band.low != null && numeric < band.low) position = 'below'
  else if (band.high != null && numeric > band.high) position = 'above'

  const range =
    band.low != null && band.high != null ? `${band.low} to ${band.high}`
    : band.high != null ? `under ${band.high}`
    : `over ${band.low}`
  const where =
    position === 'within' ? 'sits within' : position === 'below' ? 'sits below' : 'sits above'
  const phaseLabel = PHASE_LABEL[phase]

  return {
    phase,
    band,
    position,
    summary: `${name} ${value}${unit ? ' ' + unit : ''} ${where} the ${phaseLabel} range the lab printed (${range}), based on an approximate cycle day ${cycleDay}.`,
  }
}

export const PHASE_LABEL: Record<CyclePhase, string> = {
  follicular: 'follicular',
  midcycle: 'midcycle',
  luteal: 'luteal',
  post_menopausal: 'post-menopausal',
}

/**
 * Resolve a whole panel. Returns a map keyed by marker name for the markers
 * where a band could be resolved. Markers not in the map are unchanged and
 * still read as the lab printed them.
 */
export function resolvePanelBands(
  markers: { name: string; value: string; unit?: string | null; reference_range: string | null }[],
  cycleDay: number | null
): Record<string, ResolvedBand> {
  const out: Record<string, ResolvedBand> = {}
  if (cycleDay == null) return out
  for (const m of markers) {
    const r = resolveMarkerBand({ ...m, cycleDay })
    if (r) out[m.name] = r
  }
  return out
}
