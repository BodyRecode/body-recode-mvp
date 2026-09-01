/**
 * Tests for stepping a plan's calories without rewriting the plan.
 * Run: npx tsx scripts/test-nutrition-step.ts
 */
import { applyCalorieStep, describeStep } from '@/lib/nutrition-step'

let pass = 0, fail = 0
const check = (n: string, c: boolean, extra?: unknown) => {
  if (c) { pass++; console.log(`  PASS  ${n}`) } else { fail++; console.log(`  FAIL  ${n}`, extra !== undefined ? JSON.stringify(extra) : '') }
}
const kcal = (p: any) => p.meals.reduce((s: number, m: any) =>
  s + (m.foods ?? []).reduce((t: number, f: any) => t + (f.protein_g ?? 0)*4 + (f.carb_g ?? 0)*4 + (f.fat_g ?? 0)*9, 0), 0)

const samanthaLike = () => ({
  estimated_calorie_band: '1300-1500 kcal',
  meals: [
    { meal_name: 'Breakfast', foods: [ {name:'3 whole eggs',protein_g:18,carb_g:2,fat_g:15}, {name:'1 banana',protein_g:1,carb_g:27,fat_g:0} ] },
    { meal_name: 'Lunch', foods: [ {name:'150g chicken breast',protein_g:35,carb_g:0,fat_g:4}, {name:'150g white rice',protein_g:3,carb_g:42,fat_g:0} ] },
    { meal_name: 'Afternoon', foods: [ {name:'200g greek yoghurt',protein_g:18,carb_g:8,fat_g:10} ] },
    { meal_name: 'Dinner', foods: [ {name:'180g salmon',protein_g:38,carb_g:0,fat_g:18}, {name:'200g potato',protein_g:4,carb_g:32,fat_g:0} ] },
  ],
})

console.log('\n1. a +150 kcal step')
{
  const p: any = samanthaLike()
  const before = kcal(p)
  const names = JSON.stringify(p.meals.map((m: any) => [m.meal_name, m.foods.map((f: any) => f.name)]))
  const r = applyCalorieStep(p, 150)
  const after = kcal(r.plan)
  check(`landed close to +150 (got ${after - before})`, Math.abs((after - before) - 150) <= 12, after - before)
  check('same meals, same foods, same order', JSON.stringify((r.plan as any).meals.map((m: any) => [m.meal_name, m.foods.map((f: any) => f.name)])) === names)
  check('recorded what it touched', r.changes.length > 0)
  check('protein never touched', r.changes.every(c => c.field !== 'protein_g'), r.changes.map(c=>c.field))
  console.log('       ', describeStep(r))
  r.changes.forEach(c => console.log(`         meal ${c.meal_index} "${c.food_name}" ${c.field} ${c.from} -> ${c.to}`))
}

console.log('\n2. a -200 kcal step')
{
  const p: any = samanthaLike()
  const before = kcal(p)
  const r = applyCalorieStep(p, -200)
  const after = kcal(r.plan)
  check(`landed close to -200 (got ${after - before})`, Math.abs((after - before) + 200) <= 12, after - before)
  check('nothing went negative', (r.plan as any).meals.every((m: any) => m.foods.every((f: any) => (f.carb_g ?? 0) >= 0 && (f.fat_g ?? 0) >= 0)))
}

console.log('\n3. zero and empty cases')
{
  check('zero is a no-op', applyCalorieStep(samanthaLike() as any, 0).changes.length === 0)
  const empty = applyCalorieStep({ meals: [] } as any, 150)
  check('no meals is safe', empty.changes.length === 0 && empty.notes.length > 0)
}

console.log('\n4. protein is the anchor and must not move')
{
  const p: any = samanthaLike()
  const proteinBefore = JSON.stringify(p.meals.map((m: any) => m.foods.map((f: any) => f.protein_g)))
  const r = applyCalorieStep(p, 300)
  check('every protein value unchanged', JSON.stringify((r.plan as any).meals.map((m: any) => m.foods.map((f: any) => f.protein_g))) === proteinBefore)
}

console.log('\n5. an impossible ask reports rather than forcing')
{
  const tiny: any = { meals: [ { meal_name: 'One', foods: [ {name:'egg',protein_g:6,carb_g:1,fat_g:5} ] } ] }
  const r = applyCalorieStep(tiny, -5000)
  check('does not go negative', (r.plan as any).meals[0].foods[0].carb_g >= 0 && (r.plan as any).meals[0].foods[0].fat_g >= 0)
  check('says it fell short', r.notes.some(n => n.includes('short')), r.notes)
}

console.log('\n6. a macro is only added to food that actually carries it')
{
  const p: any = samanthaLike()
  const r = applyCalorieStep(p, 150)
  const touched = r.changes.map(c => c.food_name)
  check('did NOT add carbohydrate to eggs', !touched.includes('3 whole eggs'), touched)
  check('did NOT add carbohydrate to salmon', !touched.includes('180g salmon'), touched)
  check('DID use the banana, rice or potato', touched.some(n => /banana|rice|potato/.test(n)), touched)
  r.changes.forEach(c => console.log(`         ${c.food_name}: ${c.field} ${c.from} -> ${c.to}`))
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
