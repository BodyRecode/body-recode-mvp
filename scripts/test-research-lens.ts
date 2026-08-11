/**
 * Research Lens — deterministic core regression tests.
 *
 * Covers the data-hygiene floor (parseMarkerValue), unit-aware derived metrics
 * (the TG:HDL scaling + HOMA-IR divisor traps), marker alias resolution, and
 * pattern detection. The prose layer (Haiku) is NOT tested here — detection is
 * deterministic and that is what must never silently break.
 *
 * Run: `npx tsx scripts/test-research-lens.ts`
 * Run before any commit touching src/lib/research-lens.ts.
 */

import {
  parseMarkerValue,
  resolveMarkerId,
  buildResearchLensCore,
  computeDerived,
  resolveMarkers,
} from '../src/lib/research-lens'
import type { BloodMarker } from '../src/lib/blood-panel-prompt'

let pass = 0, fail = 0
function check(name: string, ok: boolean, detail = '') {
  const icon = ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'
  console.log(`${icon} ${name}${detail ? `  — ${detail}` : ''}`)
  ok ? pass++ : fail++
}
const m = (name: string, value: string, unit: string | null = null, reference_range: string | null = null): BloodMarker =>
  ({ name, value, unit, reference_range, flag: 'unknown' })
// Flag-aware marker: the hormonal-shift pattern keys off the lab's own flag.
const mf = (name: string, value: string, flag: BloodMarker['flag'], unit: string | null = 'IU/L'): BloodMarker =>
  ({ name, value, unit, reference_range: null, flag })

console.log('\n=== parseMarkerValue ===')
check('plain integer', parseMarkerValue('145').n === 145)
check('decimal', parseMarkerValue('5.2').n === 5.2)
check('less-than qualifier', (() => { const p = parseMarkerValue('<0.1'); return p.n === 0.1 && p.qualifier === '<' })())
check('greater-than qualifier', (() => { const p = parseMarkerValue('>90'); return p.n === 90 && p.qualifier === '>' })())
check('comma thousands', parseMarkerValue('1,011').n === 1011)
check('Negative -> non-numeric null', (() => { const p = parseMarkerValue('Negative'); return p.n === null && p.nonNumeric === true })())
check('Not detected -> null', parseMarkerValue('Not detected').n === null)
check('empty string -> null', parseMarkerValue('').n === null)
check('null -> null', parseMarkerValue(null).n === null)
check('never returns NaN', !Number.isNaN(parseMarkerValue('abc').n as number) && parseMarkerValue('abc').n === null)

console.log('\n=== marker resolution (alias map) ===')
check('Total Cholesterol', resolveMarkerId('Total Cholesterol') === 'total_cholesterol')
check('HDL-C variant', resolveMarkerId('HDL-C') === 'hdl')
check('Chol - LDL variant', resolveMarkerId('Chol - LDL') === 'ldl')
check('Lp(a) with parens', resolveMarkerId('Lp(a)') === 'lpa')
check('fasting insulin', resolveMarkerId('Fasting Insulin') === 'insulin_fasting')
check('unknown -> null', resolveMarkerId('Reticulocyte Count') === null)

console.log('\n=== unit traps: TG:HDL scaling ===')
{
  // mmol/L: TG 2.3 / HDL 1.2 = 1.92 -> elevated (>=1.5)
  const { derived } = computeDerived(resolveMarkers([m('Triglycerides','2.3','mmol/L'), m('HDL','1.2','mmol/L')]).resolved)
  check('mmol TG:HDL computed', derived.tg_hdl_ratio?.system === 'mmol' && Math.abs((derived.tg_hdl_ratio?.value ?? 0) - 1.92) < 0.01, `got ${derived.tg_hdl_ratio?.value}`)
}
{
  // mg/dL: TG 150 / HDL 40 = 3.75 -> elevated against the mg/dL threshold (3.5), NOT the mmol one
  const { derived } = computeDerived(resolveMarkers([m('Triglycerides','150','mg/dL'), m('HDL','40','mg/dL')]).resolved)
  check('mg/dL TG:HDL flagged mgdl system', derived.tg_hdl_ratio?.system === 'mgdl' && Math.abs((derived.tg_hdl_ratio?.value ?? 0) - 3.75) < 0.01, `got ${derived.tg_hdl_ratio?.value} (${derived.tg_hdl_ratio?.system})`)
}

console.log('\n=== unit traps: HOMA-IR divisor ===')
{
  // mmol/L: glucose 5.0 * insulin 9 / 22.5 = 2.0
  const { derived } = computeDerived(resolveMarkers([m('Fasting Glucose','5.0','mmol/L'), m('Fasting Insulin','9','mIU/L')]).resolved)
  check('mmol HOMA-IR uses /22.5', Math.abs((derived.homa_ir?.value ?? 0) - 2.0) < 0.01, `got ${derived.homa_ir?.value}`)
}
{
  // mg/dL: glucose 90 * insulin 9 / 405 = 2.0
  const { derived } = computeDerived(resolveMarkers([m('Fasting Glucose','90','mg/dL'), m('Fasting Insulin','9','mIU/L')]).resolved)
  check('mg/dL HOMA-IR uses /405', Math.abs((derived.homa_ir?.value ?? 0) - 2.0) < 0.01, `got ${derived.homa_ir?.value}`)
}
{
  // unknown glucose unit -> no HOMA-IR, recorded in missing
  const { derived, missing } = computeDerived(resolveMarkers([m('Fasting Glucose','5.0',null), m('Fasting Insulin','9','mIU/L')]).resolved)
  check('unknown glucose unit -> no HOMA-IR', derived.homa_ir === undefined && missing.some(x => x.includes('HOMA-IR')))
}

console.log('\n=== safe-compute discipline ===')
{
  // a < qualifier value must NOT be silently used in a ratio
  const { derived } = computeDerived(resolveMarkers([m('Triglycerides','<0.2','mmol/L'), m('HDL','1.5','mmol/L')]).resolved)
  check('qualified value excluded from TG:HDL', derived.tg_hdl_ratio === undefined)
}
{
  // non-numeric excluded
  const { derived } = computeDerived(resolveMarkers([m('Total Cholesterol','Pending','mmol/L'), m('HDL','1.5','mmol/L')]).resolved)
  check('non-numeric excluded from non-HDL', derived.non_hdl === undefined)
}

console.log('\n=== pattern detection ===')
{
  // metabolic / IR: high TG + low HDL (mmol)
  const core = buildResearchLensCore([m('Triglycerides','2.4','mmol/L'), m('HDL','0.9','mmol/L'), m('HbA1c','5.9','%')])
  check('metabolic/IR fires', core.patterns.some(p => p.id === 'metabolic_insulin_resistance'))
}
{
  // LMHR triad: high LDL + high HDL + low TG
  const core = buildResearchLensCore([m('LDL','5.2','mmol/L'), m('HDL','1.8','mmol/L'), m('Triglycerides','0.6','mmol/L')])
  check('LMHR triad fires', core.patterns.some(p => p.id === 'lean_mass_hyper_responder'))
  check('LMHR suppresses unexplained-LDL duplicate', !core.patterns.some(p => p.id === 'elevated_ldl_apob_unexplained'))
}
{
  // high Lp(a) nmol
  const core = buildResearchLensCore([m('Lp(a)','140','nmol/L')])
  check('high Lp(a) fires', core.patterns.some(p => p.id === 'high_lpa'))
}
{
  // inflammation
  const core = buildResearchLensCore([m('hs-CRP','5.5','mg/L')])
  check('inflammation fires', core.patterns.some(p => p.id === 'inflammation'))
}
{
  // hormonal shift: lab-flagged high FSH is the anchor
  const core = buildResearchLensCore([mf('FSH','42','high')])
  check('hormonal shift fires on lab-flagged high FSH', core.patterns.some(p => p.id === 'hormonal_shift'))
}
{
  // FSH high + estradiol low + LH high -> moderate confidence
  const core = buildResearchLensCore([mf('FSH','42','high'), mf('Oestradiol','40','low'), mf('LH','30','high')])
  const p = core.patterns.find(x => x.id === 'hormonal_shift')
  check('hormonal shift moderate with corroborators', p?.confidence === 'moderate', `got ${p?.confidence}`)
}
{
  // normal-flagged hormones -> no hormonal pattern (uses the lab's ranges, not ours)
  const core = buildResearchLensCore([mf('FSH','6','normal'), mf('Oestradiol','300','normal')])
  check('normal-flagged hormones -> no hormonal pattern', !core.patterns.some(p => p.id === 'hormonal_shift'))
}
{
  // sparse iron-only panel -> no contextual patterns
  const core = buildResearchLensCore([m('Ferritin','18','ug/L'), m('Haemoglobin','145','g/L')])
  check('sparse panel -> no patterns', core.patterns.length === 0)
  check('sparse panel -> unresolved markers recorded', core.unresolved_markers.length === 2)
}

console.log('\n═══════════════════════════════════════════════')
console.log(` RESULT: ${pass} pass, ${fail} fail (${pass + fail} total)`)
console.log('═══════════════════════════════════════════════\n')
process.exit(fail > 0 ? 1 : 0)
