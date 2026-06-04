// Read-only accuracy audit of every active client's PUBLISHED nutrition plan.
//
// Reuses the engine's own logic (normalizeMealAndDayTotals + validateNutritionPlan)
// so the audit agrees exactly with what the live generate route would enforce
// today. Also independently recomputes the calorie band from the structured food
// macros and compares it to the STORED band — this catches the "Luke class" bug
// where a plan was saved before server-side normalisation and the displayed band
// no longer matches the actual macros.
//
// WRITES NOTHING. Pure report. Run, read, then decide which plans to regenerate.
//
// Usage:
//   cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/audit-nutrition-plans.ts

import { createClient } from '@supabase/supabase-js'
import {
  validateNutritionPlan,
  normalizeMealAndDayTotals,
  computeNutritionTotals,
  parseCalorieBand,
  formatCalorieBand,
  humaniseValidationIssue,
  detectAppetiteSuppression,
  kcalFromMacros,
  NUTRITION_DOCTRINE_VERSION,
  MealLike,
} from '../src/lib/nutrition-validation'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

type Row = Record<string, any>

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
}
const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((Math.abs(a - b) / b) * 100))

async function main() {
  const { data: clients, error } = await admin
    .from('clients')
    .select('id, name, medications, active')
    .eq('active', true)
    .order('name')
  if (error) throw error

  console.log(`\n${C.bold}Nutrition Plan Accuracy Audit${C.reset}  ${C.dim}(doctrine ${NUTRITION_DOCTRINE_VERSION})${C.reset}`)
  console.log(`${C.dim}${clients!.length} active clients. Read-only. Reuses live validator.${C.reset}\n`)

  const flagged: string[] = []
  let auditedCount = 0

  for (const client of clients as Row[]) {
    // Current published plan = is_active = true (mirrors coach nutrition page).
    const { data: plan } = await admin
      .from('nutrition_plans')
      .select('*')
      .eq('client_id', client.id)
      .eq('is_active', true)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: baseline } = await admin
      .from('baselines')
      .select('bodyweight_kg, captured_at')
      .eq('client_id', client.id)
      .order('captured_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const supp = detectAppetiteSuppression(client.medications)
    const medFlag = supp.any
      ? `${C.yellow}meds:${[supp.has_stimulant && 'stim', supp.has_glp1 && 'glp1', supp.has_serotonergic && 'sero'].filter(Boolean).join('+')}${C.reset}`
      : `${C.dim}no appetite meds${C.reset}`

    console.log(`${C.bold}${client.name}${C.reset}  ${medFlag}`)

    if (!plan) {
      console.log(`  ${C.dim}— no published nutrition plan${C.reset}\n`)
      continue
    }
    auditedCount++

    const meals = (plan.meals ?? []) as MealLike[]
    const bodyweightKg = baseline?.bodyweight_kg ?? null

    // 1) Stored vs recomputed band (the Luke-class display bug).
    const storedBandStr: string | null = plan.estimated_calorie_band ?? null
    const storedBand = parseCalorieBand(storedBandStr)
    const normalized = normalizeMealAndDayTotals({
      meals: JSON.parse(JSON.stringify(meals)),
      estimated_calorie_band: storedBandStr,
    })
    const recomputedBandStr = normalized.estimated_calorie_band
    const totals = computeNutritionTotals(meals)
    const dayKcal = kcalFromMacros(totals.protein_g, totals.carb_g, totals.fat_g)

    const storedMid = storedBand ? (storedBand.low + storedBand.high) / 2 : null
    const bandDriftPct = storedMid ? pct(dayKcal, storedMid) : null

    // 2) Full validator pass — exactly as generate route builds the input.
    const result = validateNutritionPlan({
      meals,
      estimated_calorie_band: storedBandStr,
      protein_anchor_g: Number(plan.protein_anchor_g) || 0,
      bodyweight_kg: bodyweightKg,
      entry_state: String(plan.entry_state || ''),
      medications: client.medications ?? null,
      carb_demand_level: (String(plan.carb_demand_level || '').toLowerCase() as any) || null,
      transitional_override: plan.transitional_override_active
        ? { active: true, floor_kcal: Number(plan.transitional_override_floor_kcal) || 0 }
        : null,
    })

    const anchor = Number(plan.protein_anchor_g) || 0
    const proteinDelta = anchor ? totals.protein_g - anchor : null

    // Report line
    console.log(
      `  plan: ${C.dim}${plan.plan_name ?? plan.entry_state}${C.reset}  ` +
      `${C.dim}v${plan.doctrine_version ?? 'pre'}${C.reset}  ` +
      `${plan.transitional_override_active ? C.yellow + 'BRIDGE ' + C.reset : ''}` +
      `${meals.length} meals`
    )
    console.log(
      `  macros: ${totals.protein_g}P / ${totals.carb_g}C / ${totals.fat_g}F  →  ${C.bold}${dayKcal} kcal${C.reset}` +
      (anchor ? `   anchor ${anchor}P (${proteinDelta! >= 0 ? '+' : ''}${proteinDelta}P)` : `   ${C.dim}no anchor stored${C.reset}`)
    )

    const issues: string[] = []

    // Band mismatch
    if (storedBand && bandDriftPct !== null && bandDriftPct > 12) {
      issues.push(
        `${C.red}BAND MISMATCH${C.reset}: portal shows "${storedBandStr}" but the actual food macros total ${dayKcal} kcal (${bandDriftPct}% off). Recomputed band would be "${recomputedBandStr}".`
      )
    } else if (!storedBand && meals.length) {
      issues.push(`${C.yellow}NO BAND${C.reset}: plan has meals but no parseable calorie band stored ("${storedBandStr ?? 'null'}").`)
    }

    // Validator issues (the live safety/executability floors)
    for (const v of result.issues) {
      issues.push(`${C.red}${v.code}${C.reset}: ${humaniseValidationIssue(v)}`)
    }

    if (issues.length === 0) {
      console.log(`  ${C.green}✓ accurate — band matches macros, validator clean${C.reset}\n`)
    } else {
      flagged.push(client.name)
      for (const i of issues) console.log(`  ${i}`)
      console.log()
    }
  }

  console.log(`${C.bold}─────────────────────────────────────${C.reset}`)
  console.log(`Audited ${auditedCount} published plans.`)
  if (flagged.length === 0) {
    console.log(`${C.green}All published plans are accurate.${C.reset}\n`)
  } else {
    console.log(`${C.red}${flagged.length} need attention:${C.reset} ${flagged.join(', ')}\n`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
