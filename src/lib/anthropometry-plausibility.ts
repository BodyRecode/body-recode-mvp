/**
 * Is this tape measurement believable?
 *
 * Written 2026-07-30, the same day as the rule it guards, because that rule was
 * wrong on its own.
 *
 * Earlier the CFFS was told a tape measure outranks a photograph, after a photo
 * read of "midsection-dominant storage" was used to override a measured
 * waist-to-hip of 0.62. The principle is right: a circumference is a number off
 * the body and a photograph is subject to posture, angle, lens and stance.
 *
 * The first thing that rule did was use a probably-wrong number to overrule a
 * coach looking at his own client. Vicki S measures 71.4kg at 158cm, BMI 28.6,
 * with a stated waist of 66cm. A 66cm waist is roughly a size 8. Her
 * waist-to-height is 0.42, which reads as slim, while her BMI reads as
 * overweight. Those two cannot both be describing the same abdomen. The likely
 * cause is landmark: a waist taken at the narrowest point, which on many women
 * sits high under the ribs, under-reads abdominal girth badly.
 *
 * "Measurement beats image" only holds while the measurement is plausible.
 * This module supplies the missing half. It does not correct anything, because
 * only a re-measure can; it says loudly that the number should not be trusted
 * yet.
 *
 * Waist-to-height is used as the cross-check rather than waist alone because it
 * is scale-free and better validated against central adiposity than BMI is.
 */

export interface AnthropometryInput {
  weightKg: number | null
  heightCm: number | null
  waistCm: number | null
  hipsCm: number | null
}

export interface PlausibilityResult {
  bmi: number | null
  /** Waist divided by height. Scale-free proxy for central adiposity. */
  whtr: number | null
  /** Waist divided by hips. Drives the gynoid / android read. */
  whr: number | null
  shape: 'gynoid' | 'android' | 'intermediate' | null
  /** True when a measurement contradicts itself or the rest of the body. */
  suspect: boolean
  /** Coach-facing reasons. Empty when nothing is off. */
  warnings: string[]
}

/**
 * Normal human female waist-to-hip runs roughly 0.65 to 1.00. Below 0.65 is
 * outside almost the entire population and is far more likely to be a landmark
 * error than a distinctive shape.
 */
const WHR_FLOOR = 0.65
const WHR_CEILING = 1.15

export function assessAnthropometry(input: AnthropometryInput): PlausibilityResult {
  const { weightKg, heightCm, waistCm, hipsCm } = input
  const warnings: string[] = []

  const bmi = weightKg && heightCm ? weightKg / Math.pow(heightCm / 100, 2) : null
  const whtr = waistCm && heightCm ? waistCm / heightCm : null
  const whr = waistCm && hipsCm ? waistCm / hipsCm : null

  const shape = whr == null ? null : whr < 0.80 ? 'gynoid' : whr > 0.85 ? 'android' : 'intermediate'

  // 1. Ratio outside the range human bodies actually occupy.
  if (whr != null && whr < WHR_FLOOR) {
    warnings.push(
      `Waist-to-hip of ${whr.toFixed(2)} is below ${WHR_FLOOR}, which is outside the range almost all female bodies occupy. ` +
      `Far more likely a landmark error than a real shape: check whether the waist was taken at the narrowest point ` +
      `(often high, under the ribs) rather than at the navel.`
    )
  }
  if (whr != null && whr > WHR_CEILING) {
    warnings.push(`Waist-to-hip of ${whr.toFixed(2)} is above ${WHR_CEILING}. Check the hip landmark was the widest point.`)
  }

  // 2. BMI and waist-to-height telling opposite stories about the same abdomen.
  if (bmi != null && whtr != null) {
    if (bmi >= 27 && whtr < 0.48) {
      warnings.push(
        `BMI ${bmi.toFixed(1)} reads as overweight while waist-to-height ${whtr.toFixed(2)} reads as slim. ` +
        `Those cannot both describe the same abdomen. The waist measurement is the suspect number, not the weight. ` +
        `Re-measure at the navel before using this ratio to type a pattern.`
      )
    }
    if (bmi < 22 && whtr > 0.55) {
      warnings.push(
        `BMI ${bmi.toFixed(1)} reads as lean while waist-to-height ${whtr.toFixed(2)} indicates substantial central girth. ` +
        `Check the waist landmark and confirm bodyweight is current.`
      )
    }
  }

  // 3. Nothing to cross-check against.
  if (waistCm && !heightCm) {
    warnings.push('Height is not recorded, so the waist measurement cannot be sanity-checked. Capture it at the next baseline.')
  }
  if (waistCm && !hipsCm) {
    warnings.push('Hips are not recorded, so no waist-to-hip ratio is available and spatial patterning rests on self-report and photos alone.')
  }

  return { bmi, whtr, whr, shape, suspect: warnings.length > 0, warnings }
}

/**
 * The measurement block for the CFFS prompt.
 *
 * When the numbers are sound it tells the model they outrank a photo read. When
 * they are not, it says so and hands authority back to the coach's own eyes,
 * which is the correct order when the tape is the unreliable input.
 */
export function anthropometryPromptSection(input: AnthropometryInput): string {
  const a = assessAnthropometry(input)
  if (a.whr == null && a.whtr == null) return ''

  const lines: string[] = ['', 'ANTHROPOMETRY (derived, not self-reported)']
  if (a.bmi != null) lines.push(`  BMI: ${a.bmi.toFixed(1)}`)
  if (a.whtr != null) lines.push(`  Waist-to-height: ${a.whtr.toFixed(2)}`)
  if (a.whr != null) lines.push(`  Waist-to-hip: ${a.whr.toFixed(2)} — ${a.shape?.toUpperCase()}`)

  if (!a.suspect) {
    lines.push('  These measurements are internally consistent. They OUTRANK any photo read of distribution.')
    lines.push('  If your read of the photos disagrees with them, state the divergence; do not resolve it in favour of the image.')
    return lines.join('\n')
  }

  lines.push('')
  lines.push('  ⚠ MEASUREMENT SUSPECT — DO NOT TYPE A PATTERN OFF THESE NUMBERS')
  for (const w of a.warnings) lines.push(`  - ${w}`)
  lines.push('')
  lines.push('  Because the tape is unreliable here, it does NOT outrank the photos or the')
  lines.push('  coach\'s read. Weight the photo read, the intake signals and the mechanism')
  lines.push('  evidence instead, set pattern_confidence to "low", and say in the rationale')
  lines.push('  that a re-measure at consistent landmarks is required before the pattern')
  lines.push('  can be settled.')
  return lines.join('\n')
}
