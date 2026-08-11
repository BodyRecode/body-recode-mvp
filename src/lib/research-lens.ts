/**
 * Research Lens — coach/admin-only contextual interpretation over a single
 * uploaded blood panel. Reasons ACROSS markers (the contextual lipid model:
 * ApoB over LDL, ratios over single numbers, pattern over value) in a way the
 * conservative client-facing Blood Panel pipeline deliberately does not.
 *
 * HARD BOUNDARIES (see research-lens-prd.md §3/§3a):
 * - Coach/admin ONLY. Never client-facing. Never written to blood_panels.reading
 *   /analysis/approved_for_plan. Never injected into CFFS or program/nutrition.
 * - Pattern + question, never a verdict. Never diagnoses, never names a disease,
 *   never recommends supplements/doses/medication changes.
 * - Uses the lab's own ranges; does not override the existing per-marker `flag`.
 * - This is the coach's private thinking tool for deciding what to take to a
 *   clinician. Clinical interpretation is Arete's lane, not coaching's.
 *
 * This module is the DETERMINISTIC core: value parsing, marker resolution,
 * derived metrics, and pattern detection against config thresholds. The prose
 * framing layer (Haiku) lives in the route and consumes this module's output.
 * It shares NO prompt strings with the client pipeline.
 */

import type { BloodMarker } from './blood-panel-prompt'

/* ──────────────────────────────────────────────────────────────────────────
 * 1. Value parsing — the data-hygiene floor (PRD §5a)
 *
 * blood_panels.markers[].value is a STRING ("<0.1", ">90", "Negative",
 * "5.2", "1,011"). Every metric depends on turning these into safe numbers.
 * ────────────────────────────────────────────────────────────────────────── */

export interface ParsedValue {
  /** Numeric value, or null if the string is not a usable number. */
  n: number | null
  /** Present when the source carried a < or > bound. */
  qualifier?: '<' | '>'
  /** True for textual results like "Negative" / "Not detected". */
  nonNumeric?: boolean
}

const NON_NUMERIC_RE = /[a-df-zA-DF-Z]/ // any letter except a lone 'e' (sci notation); catches Negative/Trace/etc.

export function parseMarkerValue(value: string | null | undefined): ParsedValue {
  if (value == null) return { n: null, nonNumeric: true }
  let s = String(value).trim()
  if (!s) return { n: null, nonNumeric: true }

  let qualifier: '<' | '>' | undefined
  if (s[0] === '<' || s[0] === '>') {
    qualifier = s[0] as '<' | '>'
    s = s.slice(1).trim()
  }

  // Strip thousands separators only (commas between digits). Leave decimals.
  const cleaned = s.replace(/,(?=\d{3}\b)/g, '')

  // Reject textual results outright ("Negative", "Not detected", "Trace").
  if (NON_NUMERIC_RE.test(cleaned)) return { n: null, nonNumeric: true, qualifier }

  const n = Number(cleaned)
  if (!Number.isFinite(n)) return { n: null, nonNumeric: true, qualifier }
  return qualifier ? { n, qualifier } : { n }
}

/* ──────────────────────────────────────────────────────────────────────────
 * 2. Marker resolution — free-text name -> canonical id via an alias map.
 *
 * No canonical taxonomy exists yet, so this hand-built map is the single
 * place that grows. Unmatched names go to unresolved_markers, never guessed.
 * Matching is case-insensitive on a normalised form.
 * ────────────────────────────────────────────────────────────────────────── */

export type MarkerId =
  | 'total_cholesterol' | 'hdl' | 'ldl' | 'triglycerides' | 'non_hdl'
  | 'apob' | 'apoa1' | 'lpa'
  | 'glucose_fasting' | 'insulin_fasting' | 'hba1c'
  | 'hscrp'
  // Reproductive-axis markers — for the hormonal-shift pattern (perimenopausal
  // direction). Read against the lab's own sex/age reference ranges via the flag.
  | 'fsh' | 'lh' | 'estradiol' | 'amh' | 'shbg'

const ALIASES: Record<MarkerId, string[]> = {
  total_cholesterol: ['total cholesterol', 'cholesterol total', 'chol', 'cholesterol', 'tc', 'serum cholesterol'],
  hdl: ['hdl', 'hdl cholesterol', 'hdl-c', 'chol hdl', 'cholesterol hdl', 'hdl chol'],
  ldl: ['ldl', 'ldl cholesterol', 'ldl-c', 'chol ldl', 'cholesterol ldl', 'ldl chol', 'ldl calculated'],
  triglycerides: ['triglycerides', 'trigs', 'tg', 'triglyceride', 'serum triglycerides'],
  non_hdl: ['non hdl cholesterol', 'non-hdl', 'non hdl', 'non-hdl-c'],
  apob: ['apob', 'apo b', 'apolipoprotein b', 'apo-b'],
  apoa1: ['apoa1', 'apo a1', 'apolipoprotein a1', 'apo-a1', 'apo a-1'],
  lpa: ['lpa', 'lp(a)', 'lipoprotein a', 'lipoprotein (a)', 'lp a'],
  glucose_fasting: ['fasting glucose', 'glucose fasting', 'glucose', 'fasting blood glucose', 'bsl fasting', 'serum glucose'],
  insulin_fasting: ['fasting insulin', 'insulin fasting', 'insulin'],
  hba1c: ['hba1c', 'hba1c (ifcc)', 'haemoglobin a1c', 'glycated haemoglobin', 'a1c'],
  hscrp: ['hscrp', 'hs-crp', 'high sensitivity crp', 'high-sensitivity crp', 'crp high sensitivity'],
  fsh: ['fsh', 'follicle stimulating hormone', 'follicle-stimulating hormone', 'follicle stimulating hormone (fsh)'],
  lh: ['lh', 'luteinising hormone', 'luteinizing hormone', 'luteinising hormone (lh)', 'luteinizing hormone (lh)'],
  estradiol: ['estradiol', 'oestradiol', 'e2', 'estradiol (e2)', 'oestradiol (e2)', 'serum estradiol', 'serum oestradiol'],
  amh: ['amh', 'anti mullerian hormone', 'anti-mullerian hormone', 'anti mullerian hormone (amh)', 'anti-mullerian hormone (amh)'],
  shbg: ['shbg', 'sex hormone binding globulin', 'sex hormone-binding globulin', 'sex hormone binding globulin (shbg)'],
}

function normaliseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9()]+/g, ' ').replace(/\s+/g, ' ').trim()
}

const ALIAS_LOOKUP: Map<string, MarkerId> = (() => {
  const m = new Map<string, MarkerId>()
  for (const [id, names] of Object.entries(ALIASES) as [MarkerId, string[]][]) {
    for (const n of names) m.set(normaliseName(n), id)
  }
  return m
})()

export function resolveMarkerId(name: string): MarkerId | null {
  return ALIAS_LOOKUP.get(normaliseName(name)) ?? null
}

/* ──────────────────────────────────────────────────────────────────────────
 * 3. Resolved-marker view — id, parsed number, unit.
 * ────────────────────────────────────────────────────────────────────────── */

export interface ResolvedMarker {
  id: MarkerId
  raw: BloodMarker
  parsed: ParsedValue
  unit: string | null
}

export interface ResolutionResult {
  resolved: Partial<Record<MarkerId, ResolvedMarker>>
  inputs: Array<{ name: string; value: string; unit: string | null; resolved_marker_id: MarkerId | null }>
  unresolved_markers: string[]
}

export function resolveMarkers(markers: BloodMarker[]): ResolutionResult {
  const resolved: Partial<Record<MarkerId, ResolvedMarker>> = {}
  const inputs: ResolutionResult['inputs'] = []
  const unresolved_markers: string[] = []

  for (const m of markers) {
    const id = resolveMarkerId(m.name)
    inputs.push({ name: m.name, value: m.value, unit: m.unit, resolved_marker_id: id })
    if (!id) { unresolved_markers.push(m.name); continue }
    // First occurrence wins if a panel lists a marker twice.
    if (!resolved[id]) resolved[id] = { id, raw: m, parsed: parseMarkerValue(m.value), unit: m.unit }
  }
  return { resolved, inputs, unresolved_markers }
}

/* ──────────────────────────────────────────────────────────────────────────
 * 4. Unit handling.
 *
 * AU labs report lipids and glucose in mmol/L. We detect the unit per value
 * and pick thresholds accordingly. The TG:HDL ratio and HOMA-IR are the two
 * silent-failure traps (PRD §5/§6).
 * ────────────────────────────────────────────────────────────────────────── */

type System = 'mmol' | 'mgdl' | 'unknown'

function lipidSystem(unit: string | null): System {
  if (!unit) return 'unknown'
  const u = unit.toLowerCase()
  if (u.includes('mmol')) return 'mmol'
  if (u.includes('mg')) return 'mgdl'
  return 'unknown'
}

/* ──────────────────────────────────────────────────────────────────────────
 * 5. Derived metrics — only computed when every input parses + unit is known.
 *    A skipped metric records WHY in missing[].
 * ────────────────────────────────────────────────────────────────────────── */

export interface DerivedMetrics {
  non_hdl?: { value: number; unit: string }
  remnant_cholesterol?: { value: number; unit: string }
  tg_hdl_ratio?: { value: number; system: System }
  homa_ir?: { value: number; system: System }
  apob_apoa1?: { value: number }
}

function usable(r?: ResolvedMarker): r is ResolvedMarker {
  return !!r && r.parsed.n != null && r.parsed.qualifier === undefined
}

export function computeDerived(
  resolved: Partial<Record<MarkerId, ResolvedMarker>>
): { derived: DerivedMetrics; missing: string[] } {
  const derived: DerivedMetrics = {}
  const missing: string[] = []
  const { total_cholesterol: tc, hdl, ldl, triglycerides: tg, glucose_fasting: glu, insulin_fasting: ins, apob, apoa1 } = resolved

  // non-HDL = TC - HDL
  if (usable(tc) && usable(hdl)) {
    derived.non_hdl = { value: round(tc.parsed.n! - hdl.parsed.n!), unit: tc.unit ?? hdl.unit ?? '' }
  } else missing.push('non-HDL needs total cholesterol and HDL (both numeric).')

  // remnant = TC - HDL - LDL
  if (usable(tc) && usable(hdl) && usable(ldl)) {
    derived.remnant_cholesterol = { value: round(tc.parsed.n! - hdl.parsed.n! - ldl.parsed.n!), unit: tc.unit ?? '' }
  } else missing.push('remnant cholesterol needs total cholesterol, HDL, and LDL (all numeric).')

  // TG:HDL — unit-aware (thresholds differ ~2.3x between systems)
  if (usable(tg) && usable(hdl)) {
    const sys = lipidSystem(tg.unit ?? hdl.unit)
    derived.tg_hdl_ratio = { value: round(tg.parsed.n! / hdl.parsed.n!), system: sys }
    if (sys === 'unknown') missing.push('TG:HDL computed but unit is unknown, so the elevated threshold cannot be applied with confidence.')
  } else missing.push('TG:HDL needs triglycerides and HDL (both numeric).')

  // HOMA-IR — unit-aware divisor: mmol/L /22.5, mg/dL /405
  if (usable(glu) && usable(ins)) {
    const sys = lipidSystem(glu.unit)
    if (sys === 'mmol') derived.homa_ir = { value: round((glu.parsed.n! * ins.parsed.n!) / 22.5), system: 'mmol' }
    else if (sys === 'mgdl') derived.homa_ir = { value: round((glu.parsed.n! * ins.parsed.n!) / 405), system: 'mgdl' }
    else missing.push('HOMA-IR needs a known glucose unit (mmol/L or mg/dL) to pick the right divisor.')
  } else missing.push('HOMA-IR needs fasting glucose and fasting insulin (both numeric).')

  // ApoB:ApoA1
  if (usable(apob) && usable(apoa1)) {
    derived.apob_apoa1 = { value: round(apob.parsed.n! / apoa1.parsed.n!) }
  }

  return { derived, missing }
}

function round(n: number): number { return Math.round(n * 100) / 100 }

/* ──────────────────────────────────────────────────────────────────────────
 * 6. Pattern detection — config-driven. Thresholds are DEFAULTS TO CONFIRM,
 *    not validated clinical cutoffs. mmol/L defaults (AU labs).
 * ────────────────────────────────────────────────────────────────────────── */

export type PatternId =
  | 'metabolic_insulin_resistance'
  | 'lean_mass_hyper_responder'
  | 'particle_discordance'
  | 'high_lpa'
  | 'hormonal_shift'
  | 'inflammation'
  | 'elevated_ldl_apob_unexplained'

export interface DetectedPattern {
  id: PatternId
  label: string
  /** The deterministic evidence that fired this pattern (markers + derived). */
  evidence: string
  confidence: 'low' | 'moderate'
}

// Default thresholds (mmol/L unless noted). Coach signs off; v2 may make editable.
export const THRESHOLDS = {
  tg_hdl_high_mmol: 1.5,
  tg_hdl_high_mgdl: 3.5,
  hdl_low_mmol: 1.0,
  tg_high_mmol: 1.7,
  ldl_high_mmol: 4.9,
  hdl_high_mmol: 1.6,
  tg_low_mmol: 0.8,
  non_hdl_high_mmol: 3.8,
  hba1c_high_pct: 5.7,
  glucose_high_mmol: 5.6,
  homa_ir_high: 2.0,
  hscrp_high: 3.0,
  lpa_high_nmol: 100, // nmol/L; mg/dL ~ >50
  lpa_high_mgdl: 50,
} as const

export function detectPatterns(
  resolved: Partial<Record<MarkerId, ResolvedMarker>>,
  derived: DerivedMetrics
): DetectedPattern[] {
  const out: DetectedPattern[] = []
  const v = (id: MarkerId) => (usable(resolved[id]) ? resolved[id]!.parsed.n! : null)
  const tg = v('triglycerides'), hdl = v('hdl'), ldl = v('ldl')
  const hba1c = v('hba1c'), glu = v('glucose_fasting'), hscrp = v('hscrp')
  const apob = v('apob'), lpa = v('lpa')
  const tghdl = derived.tg_hdl_ratio
  const homa = derived.homa_ir
  const nonhdl = derived.non_hdl

  const tgHdlElevated = tghdl
    ? (tghdl.system === 'mgdl' ? tghdl.value >= THRESHOLDS.tg_hdl_high_mgdl : tghdl.value >= THRESHOLDS.tg_hdl_high_mmol)
    : false

  // 1. Metabolic / insulin resistance — the genuine-concern pattern.
  {
    const ev: string[] = []
    if (tg != null && tg >= THRESHOLDS.tg_high_mmol) ev.push(`triglycerides ${tg}`)
    if (hdl != null && hdl <= THRESHOLDS.hdl_low_mmol) ev.push(`HDL ${hdl}`)
    if (tgHdlElevated && tghdl) ev.push(`TG:HDL ${tghdl.value}`)
    if (homa && homa.value >= THRESHOLDS.homa_ir_high) ev.push(`HOMA-IR ${homa.value}`)
    if (hba1c != null && hba1c >= THRESHOLDS.hba1c_high_pct) ev.push(`HbA1c ${hba1c}`)
    if (glu != null && glu >= THRESHOLDS.glucose_high_mmol) ev.push(`fasting glucose ${glu}`)
    const core = (tg != null && tg >= THRESHOLDS.tg_high_mmol) && (hdl != null && hdl <= THRESHOLDS.hdl_low_mmol)
    if (core || (tgHdlElevated && (homa || hba1c != null || glu != null))) {
      out.push({ id: 'metabolic_insulin_resistance', label: 'Metabolic / insulin-resistance pattern', evidence: ev.join(', '), confidence: ev.length >= 3 ? 'moderate' : 'low' })
    }
  }

  // 2. Lean-mass hyper-responder triad — high LDL + high HDL + low TG.
  if (ldl != null && hdl != null && tg != null &&
      ldl >= THRESHOLDS.ldl_high_mmol && hdl >= THRESHOLDS.hdl_high_mmol && tg <= THRESHOLDS.tg_low_mmol) {
    out.push({ id: 'lean_mass_hyper_responder', label: 'Lean-mass hyper-responder triad', evidence: `LDL ${ldl}, HDL ${hdl}, triglycerides ${tg}`, confidence: 'moderate' })
  }

  // 3. Particle discordance — LDL unremarkable but ApoB or non-HDL high.
  {
    const ldlOk = ldl != null && ldl < THRESHOLDS.ldl_high_mmol
    const apobHigh = apob != null // ApoB present at all is worth surfacing when LDL looks fine; threshold confirmation is a coach call
    const nonHdlHigh = nonhdl && nonhdl.value >= THRESHOLDS.non_hdl_high_mmol
    if (ldlOk && (nonHdlHigh || (apobHigh && nonHdlHigh))) {
      out.push({ id: 'particle_discordance', label: 'Possible particle discordance', evidence: `LDL ${ldl} within range but ${nonHdlHigh ? `non-HDL ${nonhdl!.value}` : ''}${apob != null ? ` (ApoB ${apob} present)` : ''}`.trim(), confidence: 'low' })
    }
  }

  // 4. High Lp(a).
  if (lpa != null) {
    const unit = (resolved.lpa?.unit ?? '').toLowerCase()
    const high = unit.includes('mg') ? lpa >= THRESHOLDS.lpa_high_mgdl : lpa >= THRESHOLDS.lpa_high_nmol
    if (high) out.push({ id: 'high_lpa', label: 'Elevated Lp(a)', evidence: `Lp(a) ${lpa}${resolved.lpa?.unit ? ' ' + resolved.lpa.unit : ''}`, confidence: 'moderate' })
  }

  // 5. Inflammation — elevated hsCRP (non-specific).
  if (hscrp != null && hscrp >= THRESHOLDS.hscrp_high) {
    out.push({ id: 'inflammation', label: 'Elevated inflammatory marker', evidence: `hsCRP ${hscrp}`, confidence: 'low' })
  }

  // 6. Markedly elevated LDL/ApoB, unexplained -> clinician conversation, no condition named.
  if ((ldl != null && ldl >= THRESHOLDS.ldl_high_mmol) || (nonhdl && nonhdl.value >= THRESHOLDS.non_hdl_high_mmol)) {
    // Only when NOT already captured by the LMHR triad (which has its own framing).
    const isTriad = out.some(p => p.id === 'lean_mass_hyper_responder')
    if (!isTriad) {
      const ev = [ldl != null && ldl >= THRESHOLDS.ldl_high_mmol ? `LDL ${ldl}` : null, nonhdl && nonhdl.value >= THRESHOLDS.non_hdl_high_mmol ? `non-HDL ${nonhdl.value}` : null].filter(Boolean).join(', ')
      out.push({ id: 'elevated_ldl_apob_unexplained', label: 'Elevated LDL / ApoB worth a clinician conversation', evidence: ev, confidence: 'low' })
    }
  }

  // 7. Reproductive-hormone shift (perimenopausal direction). Keyed OFF THE LAB'S
  // OWN FLAG, never our own hormone thresholds, so the lab's sex/age reference
  // range does the demographic work. Raised FSH is the anchor; low estradiol,
  // raised LH, or low AMH corroborate. Pattern + question, never a verdict: this
  // is the marker-side corroborator for a hormonal-shift Fat Map read and always
  // routes to a clinician for the actual medical call.
  {
    const flagged = (id: MarkerId, dir: 'high' | 'low') =>
      dir === 'high'
        ? (resolved[id]?.raw.flag === 'high' || resolved[id]?.raw.flag === 'very_high')
        : (resolved[id]?.raw.flag === 'low' || resolved[id]?.raw.flag === 'very_low')
    const fshHigh = flagged('fsh', 'high')
    const e2Low = flagged('estradiol', 'low')
    const lhHigh = flagged('lh', 'high')
    const amhLow = flagged('amh', 'low')
    const ev: string[] = []
    if (fshHigh) ev.push(`FSH ${resolved.fsh!.raw.value} (lab-flagged high)`)
    if (e2Low) ev.push(`estradiol ${resolved.estradiol!.raw.value} (lab-flagged low)`)
    if (lhHigh) ev.push(`LH ${resolved.lh!.raw.value} (lab-flagged high)`)
    if (amhLow) ev.push(`AMH ${resolved.amh!.raw.value} (lab-flagged low)`)
    const corroborators = [e2Low, lhHigh, amhLow].filter(Boolean).length
    if (fshHigh || (e2Low && lhHigh)) {
      out.push({
        id: 'hormonal_shift',
        label: 'Reproductive-hormone shift pattern',
        evidence: ev.join(', '),
        confidence: fshHigh && corroborators >= 1 ? 'moderate' : 'low',
      })
    }
  }

  return out
}

/* ──────────────────────────────────────────────────────────────────────────
 * 7. Top-level deterministic assembly. The route adds the Haiku prose layer
 *    and the disclaimer; this returns everything that is computed, not written.
 * ────────────────────────────────────────────────────────────────────────── */

export interface ResearchLensCore {
  inputs: ResolutionResult['inputs']
  derived: DerivedMetrics
  patterns: DetectedPattern[]
  unresolved_markers: string[]
  missing_for_patterns: string[]
}

export function buildResearchLensCore(markers: BloodMarker[]): ResearchLensCore {
  const { resolved, inputs, unresolved_markers } = resolveMarkers(markers ?? [])
  const { derived, missing } = computeDerived(resolved)
  const patterns = detectPatterns(resolved, derived)
  return { inputs, derived, patterns, unresolved_markers, missing_for_patterns: missing }
}

/* ──────────────────────────────────────────────────────────────────────────
 * 8. Prose framing layer (Haiku). DETERMINISTIC detection has already happened;
 *    the model ONLY turns each fired pattern into pattern + question prose. It
 *    invents no patterns and asserts no findings. Kept in this module so it
 *    shares nothing with the client-facing blood-panel prompts.
 * ────────────────────────────────────────────────────────────────────────── */

export interface FramedPattern {
  id: PatternId
  label: string
  observation: string
  whatWouldClarify: string[]
  clinicianQuestion: string
  caveat: string
  confidence: 'low' | 'moderate'
}

export const RESEARCH_LENS_DISCLAIMER =
  'Exploratory cross-marker reading for the coach only. Not medical advice, not a diagnosis. A clinician is the right person for any medical decision.'

export function buildLensProseSystemPrompt(): string {
  return `You are a research assistant helping a performance coach think about a single blood panel. The coach is NOT a doctor. Your output is read ONLY by the coach as a private thinking tool. It is never shown to the client and never used to give the client medical advice.

A deterministic engine has ALREADY detected which contextual patterns are present in this panel. Your only job is to turn each already-detected pattern into careful prose. You do NOT decide whether a pattern is present, you do NOT invent new patterns, and you do NOT assert findings.

ABSOLUTE RULES:
- Frame everything as PATTERN + QUESTION, never a verdict. "This pattern is consistent with X being worth exploring" not "the client has X".
- Never name a disease or diagnosis. Never say a marker "means" or "is caused by" a condition.
- Never recommend a supplement, a dose, or starting/stopping/changing any medication.
- Never reinterpret the lab's reference ranges.
- Every pattern ends pointing toward a clinician for the medical side. The coach's job is what to watch and what question to ask, not to treat.
- Conservative, precise, plain. No hype. No em dashes. No exclamation marks.

For EACH pattern you are given, produce:
- observation: 2-3 sentences on what the marker combination suggests is worth exploring (pattern language, not diagnosis).
- whatWouldClarify: 1-3 concrete additional tests or data points that would sharpen the picture (e.g. "ApoB", "Lp(a)", "fasting insulin", "a repeat panel when well").
- clinicianQuestion: one sentence the coach (or client) could take to a clinician, phrased as a question.
- caveat: one sentence naming the main uncertainty (single panel, threshold is a default, confounder, etc.).

OUTPUT FORMAT:
Return ONLY a single JSON object, no preamble, no fences:
{
  "patterns": [
    { "id": "<id as given>", "observation": "string", "whatWouldClarify": ["string"], "clinicianQuestion": "string", "caveat": "string" }
  ]
}
If given zero patterns, return { "patterns": [] }.`
}

export function buildLensProseUserPrompt(core: ResearchLensCore): string {
  const lines: string[] = []
  lines.push('DETECTED PATTERNS (already confirmed by the deterministic engine — frame each, do not re-judge):')
  for (const p of core.patterns) {
    lines.push(`- id: ${p.id} | ${p.label} | evidence: ${p.evidence} | confidence: ${p.confidence}`)
  }
  if (core.patterns.length === 0) lines.push('(none)')
  lines.push('')
  lines.push('DERIVED METRICS (context):')
  const d = core.derived
  if (d.non_hdl) lines.push(`- non-HDL: ${d.non_hdl.value} ${d.non_hdl.unit}`)
  if (d.remnant_cholesterol) lines.push(`- remnant cholesterol: ${d.remnant_cholesterol.value} ${d.remnant_cholesterol.unit}`)
  if (d.tg_hdl_ratio) lines.push(`- TG:HDL: ${d.tg_hdl_ratio.value} (unit system: ${d.tg_hdl_ratio.system})`)
  if (d.homa_ir) lines.push(`- HOMA-IR: ${d.homa_ir.value}`)
  if (d.apob_apoa1) lines.push(`- ApoB:ApoA1: ${d.apob_apoa1.value}`)
  lines.push('')
  if (core.missing_for_patterns.length) {
    lines.push('NOT ASSESSABLE (mention as "what would clarify" where relevant):')
    core.missing_for_patterns.forEach(m => lines.push(`- ${m}`))
    lines.push('')
  }
  lines.push('TASK: Frame each detected pattern per the rules. Pattern + question, never a verdict. Return JSON only.')
  return lines.join('\n')
}
