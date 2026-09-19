/**
 * The safety gates, checked on output rather than asked for in a prompt.
 * Run: npx tsx scripts/test-safety-gates.ts
 *
 * Two things matter equally here: that a breach is caught for the client it
 * applies to, and that the SAME sentence passes for a client it does not apply
 * to. A check that fires on everyone would be turned off within a week.
 */
import { findGateViolations, gateViolationInstruction } from '../src/lib/safety-gate-enforcement'
import type { TrainingContext } from '../src/lib/electrolyte-safety-gates'

let failed = 0
function expect(name: string, got: string[], want: string[]) {
  const same = got.length === want.length && want.every(w => got.includes(w))
  if (!same) { failed++; console.log(`FAIL  ${name}\n      wanted [${want.join(', ')}]\n      got    [${got.join(', ')}]`) }
  else console.log(`ok    ${name}`)
}
function run(text: string, meds: string | null, ctx: TrainingContext | null = null) {
  return findGateViolations({ text, medications: meds, trainingContext: ctx }).map(v => v.code)
}

const SPIRO = 'Spironolactone 50mg daily'
const SSRI = 'Sertraline 100mg'
const NONE = 'Vitamin D, fish oil'
const GLIFLOZIN = 'Empagliflozin 10mg'
const LITHIUM = 'Lithium carbonate 400mg'

// Potassium gate
expect('salt substitute for a client holding potassium',
  run('Use a lite salt on your eggs to boost potassium.', SPIRO), ['POTASSIUM_GATE_BREACH'])
expect('the SAME sentence for a client with no gate passes',
  run('Use a lite salt on your eggs to boost potassium.', NONE), [])
expect('potassium supplement caught',
  run('Add a potassium supplement in the evening.', SPIRO), ['POTASSIUM_GATE_BREACH'])
expect('ordinary food potassium is NOT a breach',
  run('Include a banana and plenty of leafy greens for potassium.', SPIRO), [])

// Fluid gate
expect('daily litre target for a client behind the fluid gate',
  run('Aim for 2 to 3 litres of water a day.', SSRI), ['FLUID_GATE_BREACH'])
expect('the same target for an ungated client passes',
  run('Aim for 2 to 3 litres of water a day.', NONE), [])
expect('glasses per day also caught',
  run('Drink 8 glasses of water a day.', SSRI), ['FLUID_GATE_BREACH'])
expect('millilitres also caught',
  run('Target 3000ml daily.', SSRI), ['FLUID_GATE_BREACH'])
expect('drink to thirst is the wording we want, and passes',
  run('Drink to thirst through the day, more when it is hot.', SSRI), [])
expect('low-salt diet for a gated client',
  run('Move to a low-sodium diet for the next month.', SSRI), ['SALT_CHANGE_BREACH'])

// SGLT2
expect('fasting prescribed to a gliflozin client',
  run('Use a 16:8 intermittent fasting window on rest days.', GLIFLOZIN), ['SGLT2_FASTING_BREACH'])
expect('keto prescribed to a gliflozin client',
  run('A ketogenic approach suits this phase.', GLIFLOZIN), ['SGLT2_FASTING_BREACH'])
expect('fasting for someone NOT on one of those medicines passes',
  run('Use a 16:8 intermittent fasting window on rest days.', NONE), [])

// Lithium
// Lithium sits behind the fluid gate as well, so a salt instruction genuinely
// breaks two rules at once. Both are reported.
expect('salt change for a lithium client',
  run('Add a pinch of salt to your morning water.', LITHIUM), ['SALT_CHANGE_BREACH', 'LITHIUM_SALT_FLUID_BREACH'])

// Contest
const COMPETING: TrainingContext = { tr_competes: 'Yes' }
const NOT_COMPETING: TrainingContext = { tr_competes: 'No' }
expect('carb load grams for a competitor',
  run('Peak week: load 600g carbohydrate on the Thursday.', NONE, COMPETING), ['CONTEST_NUMBERS_BREACH'])
expect('sodium milligrams for a competitor',
  run('Take 3000mg sodium on show morning.', NONE, COMPETING), ['CONTEST_NUMBERS_BREACH'])
expect('diuretics named for a competitor',
  run('A mild diuretic on the Friday sharpens the look.', NONE, COMPETING), ['CONTEST_NUMBERS_BREACH'])
expect('ordinary carbohydrate grams for a NON-competitor pass',
  run('Post-training meal: 600g of cooked rice across the day.', NONE, NOT_COMPETING), [])
expect('education without numbers passes for a competitor',
  run('Rehearse any change two to four weeks out and change one thing at a time.', NONE, COMPETING), [])

// Combinations and the empty case
expect('two gates at once',
  run('Aim for 3 litres of water a day and use a salt substitute.', 'Ramipril and indapamide'),
  ['POTASSIUM_GATE_BREACH', 'FLUID_GATE_BREACH'])
expect('an ordinary plan for an ordinary client raises nothing',
  run('Breakfast: three eggs in butter with half an avocado. Drink water with each meal.', NONE), [])
expect('no text at all raises nothing', run('', SPIRO), [])

console.log('')
const sample = findGateViolations({ text: 'Aim for 3 litres of water a day and use a lite salt.', medications: 'Ramipril and indapamide' })
console.log('Sample retry instruction sent back to the model:\n')
console.log(gateViolationInstruction(sample))
console.log('')
console.log(failed === 0 ? 'SAFETY GATES HOLD' : `${failed} CASE(S) FAILED`)
process.exit(failed === 0 ? 0 : 1)
