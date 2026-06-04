// Read-only full dump of ONE active client's published nutrition plan, meal by
// meal, food by food, with the live validator's verdict. For reviewing a single
// client's plan in detail before deciding whether to regenerate.
//
// WRITES NOTHING.
//
// Usage:
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/show-nutrition-plan.ts "Razia"

import { createClient } from '@supabase/supabase-js'
import {
  validateNutritionPlan, computeNutritionTotals, computeMealMacros,
  parseCalorieBand, humaniseValidationIssue, detectAppetiteSuppression,
  kcalFromMacros, normalizeFood, MealLike,
} from '../src/lib/nutrition-validation'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)
const C = { reset:'\x1b[0m', bold:'\x1b[1m', dim:'\x1b[2m', red:'\x1b[31m', green:'\x1b[32m', yellow:'\x1b[33m', cyan:'\x1b[36m' }

async function main() {
  const name = process.argv[2]
  if (!name) { console.error('Pass a client name'); process.exit(1) }

  const { data: client, error: clientErr } = await admin
    .from('clients').select('id, name, medications, active')
    .ilike('name', name).maybeSingle()
  if (clientErr) { console.error('Query error:', clientErr.message); process.exit(1) }
  if (!client) { console.error(`No client matching "${name}"`); process.exit(1) }

  const { data: plan } = await admin
    .from('nutrition_plans').select('*')
    .eq('client_id', client.id).eq('is_active', true)
    .order('generated_at', { ascending: false }).limit(1).maybeSingle()

  const { data: baseline } = await admin
    .from('baselines').select('bodyweight_kg, captured_at')
    .eq('client_id', client.id).order('captured_at', { ascending: false })
    .limit(1).maybeSingle()

  const supp = detectAppetiteSuppression(client.medications)

  console.log(`\n${C.bold}${client.name}${C.reset}`)
  console.log(`${C.dim}bodyweight: ${baseline?.bodyweight_kg ?? '—'}kg${C.reset}`)
  console.log(`${C.dim}medications: ${client.medications || '—'}${C.reset}`)
  if (supp.any) console.log(`${C.yellow}appetite suppression: ${[supp.has_stimulant&&'stimulant',supp.has_glp1&&'GLP-1',supp.has_serotonergic&&'serotonergic'].filter(Boolean).join(', ')}${C.reset}`)

  if (!plan) { console.log(`\n${C.dim}No published plan.${C.reset}\n`); return }

  console.log(`\n${C.bold}Plan:${C.reset} ${plan.plan_name}`)
  console.log(`${C.dim}generated ${String(plan.generated_at).slice(0,10)}  |  doctrine v${plan.doctrine_version ?? 'pre'}  |  status ${plan.status}  |  anchor ${plan.protein_anchor_g}P  |  carb_demand ${plan.carb_demand_level ?? '—'}  |  band(stored) ${plan.estimated_calorie_band ?? '—'}${plan.transitional_override_active ? `  |  ${C.yellow}BRIDGE floor ${plan.transitional_override_floor_kcal}kcal${C.reset}` : ''}`)

  const meals = (plan.meals ?? []) as MealLike[]
  for (const meal of meals) {
    const m = computeMealMacros(meal)
    const anyString = (meal.foods ?? []).some(f => normalizeFood(f).protein_g === null)
    console.log(`\n  ${C.cyan}${C.bold}${(meal as any).name ?? 'Meal'}${C.reset}  ${C.dim}${m.protein_g}P / ${m.carb_g}C / ${m.fat_g}F = ${kcalFromMacros(m.protein_g,m.carb_g,m.fat_g)} kcal${anyString?`  ${C.red}[string foods — macros unaccounted]${C.reset}`:''}`)
    for (const f of (meal.foods ?? [])) {
      const nf = normalizeFood(f)
      if (nf.protein_g === null) {
        console.log(`    ${C.red}•${C.reset} ${typeof f === 'string' ? f : (f as any).name ?? JSON.stringify(f)}  ${C.dim}(no macros)${C.reset}`)
      } else {
        console.log(`    ${C.dim}•${C.reset} ${nf.name}  ${C.dim}${nf.protein_g}P/${nf.carb_g}C/${nf.fat_g}F${C.reset}`)
      }
    }
    if ((meal as any).notes) console.log(`    ${C.dim}note: ${(meal as any).notes}${C.reset}`)
  }

  const totals = computeNutritionTotals(meals)
  const dayKcal = kcalFromMacros(totals.protein_g, totals.carb_g, totals.fat_g)
  const band = parseCalorieBand(plan.estimated_calorie_band)
  console.log(`\n  ${C.bold}DAY TOTAL:${C.reset} ${totals.protein_g}P / ${totals.carb_g}C / ${totals.fat_g}F = ${C.bold}${dayKcal} kcal${C.reset}`)
  if (band) {
    const mid = (band.low + band.high) / 2
    const off = Math.round(Math.abs(dayKcal - mid) / mid * 100)
    console.log(`  ${C.bold}STORED BAND:${C.reset} ${plan.estimated_calorie_band}  ${off > 12 ? C.red+`(actual is ${off}% off mid-band)`+C.reset : C.green+'(matches)'+C.reset}`)
  }

  const result = validateNutritionPlan({
    meals, estimated_calorie_band: plan.estimated_calorie_band ?? null,
    protein_anchor_g: Number(plan.protein_anchor_g) || 0,
    bodyweight_kg: baseline?.bodyweight_kg ?? null,
    entry_state: String(plan.entry_state || ''),
    medications: client.medications ?? null,
    carb_demand_level: (String(plan.carb_demand_level || '').toLowerCase() as any) || null,
    transitional_override: plan.transitional_override_active
      ? { active: true, floor_kcal: Number(plan.transitional_override_floor_kcal) || 0 } : null,
  })

  console.log(`\n  ${C.bold}VALIDATOR:${C.reset} ${result.ok ? C.green+'✓ clean'+C.reset : C.red+result.issues.length+' issue(s)'+C.reset}`)
  for (const v of result.issues) console.log(`    ${C.red}•${C.reset} ${humaniseValidationIssue(v)}`)
  console.log()
}

main().catch(e => { console.error(e); process.exit(1) })
