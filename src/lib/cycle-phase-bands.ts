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

/**
 * Attach the resolved band to the marker rows themselves.
 *
 * WHY THIS IS SEPARATE FROM resolvePanelBands
 *
 * `resolvePanelBands` resolves at READ time, for one consumer that asked. That
 * was enough for the CFFS prompt and nothing else. Every other reader of a
 * panel (the coach markers table, the client's portal, the blood analysis, the
 * research lens) goes to the stored rows, and those rows still said 'unknown'.
 * Razia's LH, FSH, oestradiol and progesterone read as four uninterpretable
 * numbers everywhere except one prompt, three weeks after she told us the date
 * that makes them interpretable.
 *
 * So the answer is written ONTO the row, once, and every reader gets it.
 *
 * WHAT IS AND IS NOT TOUCHED
 *
 * `phase_resolved` is added. `flag`, `value`, `unit` and `reference_range` are
 * returned exactly as the lab printed them and as the extractor transcribed
 * them. The lab's own verdict is never overwritten, because a phase band is
 * our arithmetic on a self-reported date and the lab's range is the lab's.
 * A reader that wants the lab's view still has it; a reader that wants the
 * phase view now has that too, clearly labelled as separate.
 *
 * Idempotent, and safe to re-run whenever a cycle date is added or corrected:
 * a marker that no longer resolves has any previous `phase_resolved` removed
 * rather than left behind stale.
 */
export interface MarkerWithBand {
  name: string
  value: string
  unit?: string | null
  reference_range: string | null
  flag?: string
  phase_resolved?: {
    phase: CyclePhase
    position: 'below' | 'within' | 'above'
    band_printed: string
    cycle_day: number
    summary: string
  }
  [key: string]: unknown
}

export function annotateMarkersWithPhaseBands<T extends MarkerWithBand>(
  markers: T[],
  cycleDay: number | null
): { markers: T[]; resolvedCount: number; changed: boolean } {
  let resolvedCount = 0
  let changed = false

  const out = markers.map(m => {
    const resolved = cycleDay == null ? null : resolveMarkerBand({
      name: m.name,
      value: m.value,
      unit: m.unit,
      reference_range: m.reference_range,
      cycleDay,
    })

    if (!resolved) {
      // Nothing resolvable now. Drop any stale annotation from a previous run
      // rather than leaving a band that no longer applies.
      if (m.phase_resolved) {
        changed = true
        const { phase_resolved: _dropped, ...rest } = m
        return rest as T
      }
      return m
    }

    resolvedCount++
    const next = {
      phase: resolved.phase,
      position: resolved.position,
      band_printed: resolved.band.printed,
      cycle_day: cycleDay as number,
      summary: resolved.summary,
    }
    // Field by field, NOT JSON.stringify: Postgres returns jsonb keys in its
    // own order, so stringifying would report a difference on every run and
    // rewrite every panel forever.
    const prev = m.phase_resolved
    if (
      !prev ||
      prev.phase !== next.phase ||
      prev.position !== next.position ||
      prev.band_printed !== next.band_printed ||
      prev.cycle_day !== next.cycle_day ||
      prev.summary !== next.summary
    ) changed = true
    return { ...m, phase_resolved: next } as T
  })

  return { markers: out, resolvedCount, changed }
}

/* ===========================================================
 * Cycle context for the WEEKLY read (added 2026-09-09)
 *
 * Everything above serves blood panels: which of a lab's four printed bands
 * applies. This section serves a different question — where in her cycle a
 * given CHECK-IN week sits — because the same week means different things at
 * day 3 and at day 24, and until now the weekly read had no idea which it was
 * looking at. cycle-phase-bands.ts was referenced only by the blood-panel path.
 *
 * Same discipline as above: deterministic, no model, and anything it cannot
 * resolve confidently returns null so the read says nothing rather than guess.
 * =========================================================== */

/**
 * Parse a self-reported period start date out of a free-text answer.
 *
 * DELIBERATELY STRICT, and day-first. The clients are Australian, so "3/9"
 * means 3 September, never 9 March. Ambiguity is not resolved by preference:
 * anything that does not match a known shape returns null, and null means the
 * read stays silent on her cycle. A wrong date is worse than no date, because
 * it produces a confident phase that is off by two weeks.
 *
 * Accepts: 2026-09-03 (ISO) · 3/9/2026 · 3-9-26 · 3.9.2026 · "3 Sep 2026" ·
 * "3 September" (current year assumed).
 * Rejects: anything else, including bare "last Tuesday" or "about 3 weeks ago".
 */
export function parsePeriodStart(raw: string | null | undefined, today: Date = new Date()): string | null {
  if (!raw) return null
  const t = raw.trim().toLowerCase()
  if (!t || /^(n\/?a|none|no|nil|-|—)$/.test(t)) return null

  let y: number | null = null
  let m: number | null = null
  let d: number | null = null

  // ISO first — unambiguous, and what a date input would give us.
  const iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) {
    y = Number(iso[1]); m = Number(iso[2]); d = Number(iso[3])
  }

  // Day-first numeric: 3/9/2026, 3-9-26, 3.9.2026, 3/9
  if (y === null) {
    const dmy = t.match(/^(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2}|\d{4}))?$/)
    if (dmy) {
      d = Number(dmy[1]); m = Number(dmy[2])
      if (dmy[3]) {
        const yy = Number(dmy[3])
        y = yy < 100 ? 2000 + yy : yy
      } else {
        y = today.getFullYear()
      }
    }
  }

  // "3 Sep 2026" / "3 September" / "sep 3"
  if (y === null) {
    const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const named = t.match(/^(\d{1,2})\s*(?:st|nd|rd|th)?\s+([a-z]{3,9})\.?(?:\s+(\d{4}))?$/)
      || t.match(/^([a-z]{3,9})\.?\s+(\d{1,2})\s*(?:st|nd|rd|th)?(?:\s+(\d{4}))?$/)
    if (named) {
      const isDayFirst = /^\d/.test(named[1])
      const dayPart = isDayFirst ? named[1] : named[2]
      const monPart = isDayFirst ? named[2] : named[1]
      const idx = MONTHS.indexOf(monPart.slice(0, 3))
      if (idx >= 0) {
        d = Number(dayPart); m = idx + 1; y = named[3] ? Number(named[3]) : today.getFullYear()
      }
    }
  }

  if (y === null || m === null || d === null) return null
  if (m < 1 || m > 12 || d < 1 || d > 31) return null

  const parsed = new Date(Date.UTC(y, m - 1, d))
  // Reject a date the calendar rolled over (31 February becomes 3 March).
  if (parsed.getUTCMonth() !== m - 1 || parsed.getUTCDate() !== d) return null

  // A year was assumed for a bare "3/9". If that lands in the future, she means
  // last year. Only ever roll BACKWARDS — a period cannot start tomorrow.
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  let ms = parsed.getTime()
  if (ms > todayUtc) {
    const rolled = new Date(Date.UTC(y - 1, m - 1, d))
    ms = rolled.getTime()
    if (ms > todayUtc) return null
  }
  // Older than a long cycle and it cannot describe the current one.
  if ((todayUtc - ms) / 86400000 > 60) return null

  return new Date(ms).toISOString().slice(0, 10)
}

export interface CycleContext {
  /** Day 1 is the first day of bleeding. */
  cycleDay: number
  phase: CyclePhase
  /** One plain sentence for the prompt. Never a clinical conclusion. */
  summary: string
}

/**
 * Where a check-in week sits in her cycle. Null whenever it cannot be resolved,
 * which includes a missing date, a stale one, or a day beyond a plausible
 * luteal phase — in every one of those cases the read must say nothing rather
 * than state a phase it is not sure of.
 */
export function cycleContextFor(
  lastPeriodStart: string | Date | null | undefined,
  onDate: string | Date | null | undefined
): CycleContext | null {
  const cycleDay = cycleDayFrom(lastPeriodStart, onDate)
  if (cycleDay === null) return null
  const phase = phaseForCycleDay(cycleDay)
  if (phase === null || phase === 'post_menopausal') return null
  return {
    cycleDay,
    phase,
    summary: `approximately day ${cycleDay} of her cycle, which is the ${PHASE_LABEL[phase].toLowerCase()} phase`,
  }
}
