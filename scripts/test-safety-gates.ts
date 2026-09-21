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

// Thyroid, from research pass T1 (20 September 2026).
function runT(text: string, hold = false) {
  return findGateViolations({ text, medications: NONE, thyroidHold: hold }).map(v => v.code)
}
expect('kelp is blocked for everyone, flag or no flag',
  runT('Add a kelp supplement for iodine.'), ['THYROID_PRODUCT_BREACH'])
// "thyroid support" is both a banned product and an interpretation, so both
// rules firing is correct rather than a duplicate.
expect('a thyroid support formula is blocked, on both counts',
  runT('A thyroid support complex may help here.'), ['THYROID_PRODUCT_BREACH', 'THYROID_INTERPRETATION_BREACH'])
expect('naming the thyroid as a cause is caught',
  runT('This looks thyroid-driven, which explains the stall.'), ['THYROID_INTERPRETATION_BREACH'])
expect('"sluggish thyroid" is caught',
  runT('A sluggish thyroid would account for this.'), ['THYROID_INTERPRETATION_BREACH'])
expect('"metabolism repair" is caught',
  runT('We will start with metabolism repair.'), ['THYROID_INTERPRETATION_BREACH'])
expect('saying what she reported, without attributing it, passes',
  runT('You told us your energy has dropped and you feel the cold more. That is worth your doctor looking at.'), [])
expect('cutting food while the hold is open is refused',
  runT('We will reduce your calories by 200 to restart progress.', true), ['THYROID_HOLD_BREACH'])
expect('the same sentence with NO hold passes',
  runT('We will reduce your calories by 200 to restart progress.', false), [])
expect('holding intake while the flag is open passes',
  runT('Your intake stays exactly where it is until you have been seen.', true), [])
expect('a fasting window while the hold is open is refused',
  runT('Try eating less in the mornings to sharpen the deficit.', true), ['THYROID_HOLD_BREACH'])

// The readings path: same rules, applied across every section of a reading.
import { findReadingGateViolations, readingGateRetryMessage } from '../src/lib/reading-safety-check'

const readingFields = {
  nr_why_this_plan: 'Your plan is built around steady meals.',
  nr_what_this_nutrition_is_doing: 'Aim for 3 litres of water a day to support this.',
  nr_how_well_know_its_working: 'We will look at your energy through the week.',
}
expect('a reading section breaking the fluid gate is caught',
  findReadingGateViolations(readingFields, { medications: 'Sertraline 100mg', trainingContext: null }).map(v => v.code),
  ['FLUID_GATE_BREACH'])
expect('the same reading for an ungated client passes',
  findReadingGateViolations(readingFields, { medications: 'Vitamin D', trainingContext: null }).map(v => v.code),
  [])
expect('one rule broken in two sections is reported once',
  findReadingGateViolations(
    { a: 'Drink 2 litres a day.', b: 'Remember, 2 litres a day.' },
    { medications: 'Sertraline 100mg', trainingContext: null },
  ).map(v => v.code),
  ['FLUID_GATE_BREACH'])
expect('a reading retry message is produced',
  [readingGateRetryMessage(findReadingGateViolations(readingFields, { medications: 'Sertraline 100mg', trainingContext: null })).length > 0 ? 'yes' : 'no'],
  ['yes'])

console.log('')
const sample = findGateViolations({ text: 'Aim for 3 litres of water a day and use a lite salt.', medications: 'Ramipril and indapamide' })
console.log('Sample retry instruction sent back to the model:\n')
console.log(gateViolationInstruction(sample))
console.log('')

/* ── The four surfaces gated on 20 September 2026 ────────────────────────
 *
 * The read itself, the weekly read, the progress read and the trajectory
 * reading all reached a client while three sibling readings were gated and
 * these four were not. They share one check, so what is proven here is that
 * the check fires on the SHAPE each of them actually passes: a flat object of
 * client-facing prose under that route's own field names.
 *
 * As above, half of these prove the same sentence PASSES for a client the rule
 * does not cover. A gate that fires on everyone gets switched off.
 */
console.log('\n--- the four surfaces gated 20 Sep 2026 ---')

const POTASSIUM_MEDS = 'Spironolactone 50mg daily'
const ON_LITHIUM = 'Lithium carbonate 400mg'
const SAFE_MEDS = 'Vitamin D, fish oil'

function readingCodes(fields: Record<string, unknown>, meds: string | null) {
  return findReadingGateViolations(fields, { medications: meds, trainingContext: null }).map(v => v.code)
}

// The read itself. Its fields are the ones a client opens first, and anything
// wrong here propagates into every plan and weekly read afterwards.
const aRead = {
  what_is_happening: 'Your fatigue pattern fits a regulation picture.',
  what_to_do: 'Add a lite salt to your eggs each morning for the potassium.',
}
expect(
  'the read: potassium advice is refused for a client whose medicine holds potassium',
  readingCodes(aRead, POTASSIUM_MEDS),
  ['POTASSIUM_GATE_BREACH'],
)
expect(
  'the read: THE SAME SENTENCE passes for a client it does not apply to',
  readingCodes(aRead, SAFE_MEDS),
  [],
)

// The weekly read. Shorter, but it is the one she gets every week.
const aWeeklyRead = {
  resolution_state: 'Holding steady',
  what_moved: 'Sleep improved on the nights you finished training before seven.',
}
expect(
  'the weekly read: ordinary prose passes',
  readingCodes(aWeeklyRead, POTASSIUM_MEDS),
  [],
)
expect(
  'the weekly read: a fluid target is refused on lithium',
  readingCodes({ ...aWeeklyRead, this_week: 'Aim for three litres of water a day.' }, ON_LITHIUM),
  ['LITHIUM_SALT_FLUID_BREACH', 'FLUID_GATE_BREACH'],
)

// Her version of the progress read, which is the half that goes in her portal.
// The coach-only half is deliberately NOT checked: it is allowed to discuss her
// medicines, and that is the point of it being coach-only.
const herProgressRead = {
  where_you_are: 'Your capacity has come up since the last read.',
  what_changed: 'Consistency is the clearest mover.',
}
expect(
  'her progress read: ordinary prose passes',
  readingCodes(herProgressRead, ON_LITHIUM),
  [],
)
expect(
  'her progress read: a salt change is refused on lithium',
  readingCodes({ ...herProgressRead, one_thing: 'Start adding more salt to your food.' }, ON_LITHIUM),
  ['LITHIUM_SALT_FLUID_BREACH', 'SALT_CHANGE_BREACH'],
)

// The trajectory reading, written at the end of a block.
expect(
  'the trajectory reading: a thyroid product is refused for everyone',
  readingCodes({ what_this_block_did: 'Consider a thyroid support supplement to lift your metabolism.' }, SAFE_MEDS),
  ['THYROID_PRODUCT_BREACH', 'THYROID_INTERPRETATION_BREACH'],
)
expect(
  'the trajectory reading: the same paragraph without the product passes',
  readingCodes({ what_this_block_did: 'Your work capacity rose across the block.' }, SAFE_MEDS),
  [],
)


/* ── The co-pilot, gated 21 September 2026 ───────────────────────────────
 *
 * It was the last surface where the engine could say to a coach, in a
 * conversation, something the read itself would have been refused for writing.
 * Survivable with Kade's own clients because he would catch it. Not
 * survivable with somebody else's.
 *
 * The client-scoped co-pilot knows her medicines, so the full rules apply. The
 * general one has no client loaded, so only the rules that hold for everybody
 * can fire, and that partial gate is the honest position rather than none.
 */
console.log('\n--- the co-pilot, gated 21 Sep 2026 ---')

expect(
  'client co-pilot: potassium advice is refused for a client whose medicine holds it',
  readingCodes({ answer: 'For her cramping, a lite salt on her eggs would lift her potassium.' }, POTASSIUM_MEDS),
  ['POTASSIUM_GATE_BREACH'],
)
expect(
  'client co-pilot: THE SAME ANSWER passes for a client the rule does not cover',
  readingCodes({ answer: 'For her cramping, a lite salt on her eggs would lift her potassium.' }, SAFE_MEDS),
  [],
)
expect(
  'client co-pilot: explaining her read is never blocked',
  readingCodes({ answer: 'She landed in Remediation because regulation is the limiter: her sleep and stress scores are both low while her training time is fully available.' }, POTASSIUM_MEDS),
  [],
)
expect(
  'general co-pilot: a thyroid product is refused with no client loaded',
  run('A thyroid support supplement would lift a stalled metabolism.', null),
  ['THYROID_PRODUCT_BREACH', 'THYROID_INTERPRETATION_BREACH'],
)
expect(
  'general co-pilot: teaching the doctrine passes',
  run('Regulation is rated on sleep, stress load and recovery, and it caps what the other three can do.', null),
  [],
)


console.log(failed === 0 ? 'SAFETY GATES HOLD' : `${failed} CASE(S) FAILED`)
process.exit(failed === 0 ? 0 : 1)