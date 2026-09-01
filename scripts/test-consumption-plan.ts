/**
 * Tests for supplement placement on a consumption plan.
 * Run: npx tsx scripts/test-consumption-plan.ts
 */
import { composeSupplementsOntoMeals, clientVisibleSupplements, type PlanMeal, type PlanSupplement } from '@/lib/consumption-plan'

let pass = 0, fail = 0
const check = (name: string, cond: boolean, extra?: unknown) => {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}`, extra !== undefined ? JSON.stringify(extra) : '') }
}

const meals: PlanMeal[] = [
  { meal_number: 1, meal_name: 'Breakfast' },
  { meal_number: 2, meal_name: 'Lunch' },
  { meal_number: 3, meal_name: 'Afternoon meal' },
  { meal_number: 4, meal_name: 'Dinner' },
]
const supp = (o: Partial<PlanSupplement>): PlanSupplement =>
  ({ substance_slug: 'x', name: 'X', dose: '1 cap', assigned: true, rationale_client_facing: 'Helps you sleep.', ...o })

console.log('\n1. a supplement pointing at a meal that exists')
{
  const r = composeSupplementsOntoMeals(meals, [supp({ substance_slug: 'magnesium', timing_meal_number: 4 })])
  check('kept on meal 4', r.supplements[0].timing_meal_number === 4)
  check('no issues', r.issues.length === 0, r.issues)
  check('publishable', r.publishable)
}

console.log('\n2. a supplement pointing at a meal that does NOT exist')
{
  const r = composeSupplementsOntoMeals(meals, [supp({ substance_slug: 'creatine', timing_meal_number: 9 })])
  check('NOT dropped', r.supplements.length === 1)
  check('moved to standalone', r.supplements[0].timing_meal_number === null)
  check('reported as orphan_meal', r.issues[0]?.kind === 'orphan_meal')
  check('still publishable (not client-facing harm)', r.publishable)
}

console.log('\n3. plan with NO supplements at all')
{
  const r = composeSupplementsOntoMeals(meals, [])
  check('no supplements', r.supplements.length === 0)
  check('no issues', r.issues.length === 0)
  check('publishable', r.publishable)
}

console.log('\n4. plan with no meals but a supplement referencing one')
{
  const r = composeSupplementsOntoMeals([], [supp({ timing_meal_number: 1 })])
  check('survives as standalone', r.supplements[0].timing_meal_number === null)
  check('reported', r.issues.some(i => i.kind === 'orphan_meal'))
}

console.log('\n5. assigned supplement with NO client explanation blocks publishing')
{
  const r = composeSupplementsOntoMeals(meals, [supp({ rationale_client_facing: '' })])
  check('blocks publishing', r.publishable === false)
  check('reason given', r.issues.some(i => i.kind === 'missing_client_rationale'))
}

console.log('\n6. an UNASSIGNED proposal is not held to client-facing rules')
{
  const r = composeSupplementsOntoMeals(meals, [supp({ assigned: false, rationale_client_facing: '' })])
  check('does not block publishing', r.publishable === true, r.issues)
}

console.log('\n7. missing dose is reported but does not block')
{
  const r = composeSupplementsOntoMeals(meals, [supp({ dose: '' })])
  check('reported', r.issues.some(i => i.kind === 'missing_dose'))
  check('does not block', r.publishable === true)
}

console.log('\n8. what the client sees')
{
  const r = composeSupplementsOntoMeals(meals, [
    supp({ substance_slug: 'c', timing_meal_number: null }),
    supp({ substance_slug: 'a', timing_meal_number: 1 }),
    supp({ substance_slug: 'b', timing_meal_number: 4 }),
    supp({ substance_slug: 'proposed', assigned: false, timing_meal_number: 2 }),
  ])
  const seen = clientVisibleSupplements(r.supplements).map(s => s.substance_slug)
  check('unassigned proposal hidden', !seen.includes('proposed'), seen)
  check('meal order, standalone last', JSON.stringify(seen) === JSON.stringify(['a','b','c']), seen)
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
