/**
 * Tests for the tape-measure plausibility check.
 *
 *   npm run test:anthro
 */
import { assessAnthropometry, anthropometryPromptSection } from '../src/lib/anthropometry-plausibility'

let failed = 0, passed = 0
function check(name: string, cond: boolean, detail?: string) {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`) }
}

console.log("\nVICKI'S ACTUAL NUMBERS (the case that prompted this)")
{
  const a = assessAnthropometry({ weightKg: 71.4, heightCm: 158, waistCm: 66, hipsCm: 106 })
  check('BMI computes to 28.6', Math.abs(a.bmi! - 28.6) < 0.1, `got ${a.bmi?.toFixed(1)}`)
  check('waist-to-height computes to 0.42', Math.abs(a.whtr! - 0.418) < 0.01, `got ${a.whtr?.toFixed(2)}`)
  check('waist-to-hip computes to 0.62', Math.abs(a.whr! - 0.623) < 0.01, `got ${a.whr?.toFixed(2)}`)
  check('flagged SUSPECT rather than trusted', a.suspect)
  check('names the sub-0.65 ratio problem', a.warnings.some(w => /outside the range/.test(w)))
  check('names the BMI-versus-waist contradiction', a.warnings.some(w => /cannot both describe the same abdomen/.test(w)))
  check('tells the coach to re-measure at the navel', a.warnings.some(w => /navel/.test(w)))

  const prompt = anthropometryPromptSection({ weightKg: 71.4, heightCm: 158, waistCm: 66, hipsCm: 106 })
  check('the prompt REVOKES tape authority when suspect',
    /does NOT outrank the photos/.test(prompt), prompt.slice(0, 200))
  check('the prompt forces low confidence', /pattern_confidence to "low"/.test(prompt))
  check('the prompt does NOT claim the tape outranks photos', !/These measurements are internally consistent/.test(prompt))
}

console.log('\nA PLAUSIBLE MEASUREMENT KEEPS ITS AUTHORITY')
{
  // Same woman, waist re-measured at the navel.
  const a = assessAnthropometry({ weightKg: 71.4, heightCm: 158, waistCm: 88, hipsCm: 106 })
  check('not suspect', !a.suspect, a.warnings.join(' | '))
  check('waist-to-hip 0.83 reads intermediate', a.shape === 'intermediate', `${a.whr?.toFixed(2)} ${a.shape}`)
  const prompt = anthropometryPromptSection({ weightKg: 71.4, heightCm: 158, waistCm: 88, hipsCm: 106 })
  check('the prompt grants tape authority', /OUTRANK any photo read/.test(prompt))
  check('and asks for divergence to be stated', /state the divergence/.test(prompt))
}

console.log('\nGENUINELY GYNOID BODIES ARE NOT FALSELY FLAGGED')
{
  // Lean woman, real hip-dominant distribution. Must pass.
  const a = assessAnthropometry({ weightKg: 58, heightCm: 165, waistCm: 68, hipsCm: 98 })
  check('lean gynoid is not suspect', !a.suspect, a.warnings.join(' | '))
  check('classified gynoid', a.shape === 'gynoid', `${a.whr?.toFixed(2)}`)
}

console.log('\nANDROID AND THE OPPOSITE ERROR')
{
  const a = assessAnthropometry({ weightKg: 95, heightCm: 178, waistCm: 104, hipsCm: 108 })
  check('android is classified and not flagged', a.shape === 'android' && !a.suspect, a.warnings.join(' | '))

  // Lean BMI with a large waist: the mirror-image implausibility.
  const b = assessAnthropometry({ weightKg: 58, heightCm: 170, waistCm: 98, hipsCm: 100 })
  check('lean BMI with a big waist is flagged', b.suspect)
  check('and points at the landmark or a stale bodyweight',
    b.warnings.some(w => /confirm bodyweight is current/.test(w)))
}

console.log('\nMISSING INPUTS')
{
  const a = assessAnthropometry({ weightKg: 71.4, heightCm: null, waistCm: 66, hipsCm: 106 })
  check('no height means the waist cannot be sanity-checked, and it says so',
    a.suspect && a.warnings.some(w => /Height is not recorded/.test(w)))
  const b = assessAnthropometry({ weightKg: 71.4, heightCm: 158, waistCm: 66, hipsCm: null })
  check('no hips means no ratio, and it says so',
    b.whr === null && b.warnings.some(w => /no waist-to-hip ratio/.test(w)))
  const c = assessAnthropometry({ weightKg: null, heightCm: null, waistCm: null, hipsCm: null })
  check('nothing recorded produces an empty prompt section rather than noise',
    anthropometryPromptSection({ weightKg: null, heightCm: null, waistCm: null, hipsCm: null }) === '')
  check('and no false suspicion', !c.suspect)
}

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
