/**
 * Tests for the energy requirement calculation.
 *
 *   npm run test:energy
 */
import {
  estimateBMR, estimateEnergyRequirement, ageFromDob, normaliseSex, ACTIVITY_FACTORS,
} from '../src/lib/energy-requirement'

let failed = 0, passed = 0
function check(name: string, cond: boolean, detail?: string) {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`) }
}

console.log('\nBMR (Mifflin-St Jeor)')
{
  // Vicki: female, 52, 71.4kg. Height 165cm as a worked example.
  const b = estimateBMR('female', 52, 165, 71.4)
  check('female 52y 165cm 71.4kg is ~1324', Math.abs(b - 1324) <= 2, `got ${b}`)
  const m = estimateBMR('male', 52, 165, 71.4)
  check('male is 166 kcal higher than female at identical inputs', m - b === 166, `got ${m - b}`)
  check('BMR rises with height', estimateBMR('female', 52, 175, 71.4) > b)
  check('BMR falls with age', estimateBMR('female', 62, 165, 71.4) < b)
}

console.log('\nMISSING INPUTS ARE STATED, NOT GUESSED')
{
  const e = estimateEnergyRequirement({
    sex: 'female', ageYears: 52, heightCm: null, weightKg: 71.4,
    activityLevel: 'moderately_active', entryState: 'stabilisation',
  })
  check('no height gives a null estimate rather than a number', e.bmr === null && e.tdee === null)
  check('the missing input is named', e.missing.includes('height'), e.missing.join(','))
  check('the workings say not to guess', e.workings.some(w => /Do not guess/.test(w)))
}

console.log('\nENTRY STATE SETS THE DIRECTION')
{
  const base = { sex: 'female' as const, ageYears: 52, heightCm: 165, weightKg: 71.4, activityLevel: 'moderately_active' as const }
  const stab = estimateEnergyRequirement({ ...base, entryState: 'stabilisation' })
  const reset = estimateEnergyRequirement({ ...base, entryState: 'recovery_reset' })
  const high = estimateEnergyRequirement({ ...base, entryState: 'high_output_support' })

  check('stabilisation tops out AT maintenance, never above', stab.targetHigh! <= stab.tdee!)
  check('stabilisation deficit is mild, not more than 10 per cent',
    stab.targetLow! >= Math.round(stab.tdee! * 0.89), `${stab.targetLow} vs tdee ${stab.tdee}`)
  check('recovery_reset never sits below maintenance', reset.targetLow! >= reset.tdee!)
  check('high_output_support can exceed maintenance', high.targetHigh! > high.tdee!)
}

console.log('\nACTIVITY IS THE BIGGEST LEVER')
{
  const base = { sex: 'female' as const, ageYears: 52, heightCm: 165, weightKg: 71.4, entryState: 'stabilisation' as const }
  const sed = estimateEnergyRequirement({ ...base, activityLevel: 'sedentary' })
  const mod = estimateEnergyRequirement({ ...base, activityLevel: 'moderately_active' })
  const very = estimateEnergyRequirement({ ...base, activityLevel: 'very_active' })
  check('sedentary < moderate < very active', sed.tdee! < mod.tdee! && mod.tdee! < very.tdee!)
  check('one step of activity moves TDEE by 200+ kcal',
    very.tdee! - mod.tdee! > 200, `${mod.tdee} -> ${very.tdee}`)
  check('the workings warn about activity error', mod.workings.some(w => /widest source of error/.test(w)))
  check('every activity level has a description a coach can pick from',
    Object.values(ACTIVITY_FACTORS).every(a => a.description.length > 30))
}

console.log("\nVICKI'S ACTUAL CASE")
{
  // No car, walks and cycles for all transport, 3 resistance sessions.
  const e = estimateEnergyRequirement({
    sex: 'female', ageYears: 52, heightCm: 165, weightKg: 71.4,
    activityLevel: 'moderately_active', entryState: 'stabilisation',
  })
  check('TDEE lands in the 2000-2100 range', e.tdee! >= 2000 && e.tdee! <= 2100, `got ${e.tdee}`)
  // Her current plan is 1934 kcal.
  check('her 1934 kcal plan falls inside the target band',
    1934 >= e.targetLow! && 1934 <= e.targetHigh!, `band ${e.targetLow}-${e.targetHigh}`)
  console.log('        ' + e.workings.join('\n        '))
}

console.log('\nHELPERS')
{
  check('age from dob', ageFromDob('1974-01-22', new Date('2026-07-30')) === 52)
  check('birthday not yet reached this year',
    ageFromDob('1974-12-22', new Date('2026-07-30')) === 51)
  check('null dob gives null', ageFromDob(null) === null)
  check('nonsense dob gives null rather than NaN', ageFromDob('not a date') === null)
  check('sex normalises from intake free text',
    normaliseSex('Female') === 'female' && normaliseSex('male') === 'male')
  check('unrecognised sex is null, not assumed', normaliseSex('prefer not to say') === null)
}

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
