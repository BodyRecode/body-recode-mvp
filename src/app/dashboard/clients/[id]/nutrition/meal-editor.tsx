'use client'

/**
 * MealEditor — client-side inline editor for a nutrition plan's meals.
 *
 * Toggle from view mode (matches the existing read-only display) into edit
 * mode where every field of every food is editable. Includes:
 *   - Freeform food name editing
 *   - Per-food macro editing (P/C/F, kcal auto-computed)
 *   - "Swap food" dropdown → lookup FOOD_DB reference table, enter grams,
 *     auto-populate macros from per-gram × grams
 *   - Add food row
 *   - Delete food row
 *   - Meal name + timing + notes edit
 *   - Meal totals + daily totals live-recompute as edits happen
 *   - Save (PATCH → /api/nutrition-plans/[id]/meals) or Cancel
 *
 * 2026-07-07: shipped after Amanda's Stage 2 plan needed manual meal
 * structure tweaks the engine can't produce cleanly (variety refresh
 * between salmon / chicken thigh / tuna, portion tweaks per client
 * preference). Coach edits stick to nutrition_plans.meals; downstream
 * generators still read the same field, so subsequent regens use the
 * coach-edited state as context.
 */

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FOOD_DB, lookupFood, type FoodMacros } from '@/lib/food-reference'

/**
 * A food touched by the last adjustment, so it can be marked.
 *
 * Kade, 1 Sep 2026: "the change i want highlighted in red so it easily
 * noticeable". A calorie step moves a few numbers across several meals; without
 * marking them the coach has to diff two plans by eye to see what happened.
 */
export type ChangedFood = { meal_index: number; food_index: number; field: string; from: number; to: number }
import { kcalFromMacros, computeMealMacros, normalizeFood, type FoodInput } from '@/lib/nutrition-validation'

interface EditableFood {
  name: string
  protein_g: number
  carb_g: number
  fat_g: number
}

interface EditableMeal {
  meal_number: number
  meal_name: string
  timing: string
  protein_g: number
  carb_g: number
  fat_g: number
  foods: EditableFood[]
  notes: string | null
}

interface Props {
  planId: string
  meal: EditableMeal
  /** Daily protein anchor for target-vs-actual comparison. */
  proteinAnchor?: number
  /** All meals for the plan — used to compute the plan-level daily band. */
  siblingMeals: EditableMeal[]
  /** This meal's position in the plan, so change records can be matched to it. */
  mealIndex?: number
  /** Foods touched by the last adjustment. Rendered in red. */
  changedFoods?: ChangedFood[]
}

/** Turn any FoodInput shape into an EditableFood with sane defaults. */
function toEditableFood(food: FoodInput): EditableFood {
  const n = normalizeFood(food)
  return {
    name: n.name || '',
    protein_g: Number(n.protein_g) || 0,
    carb_g: Number(n.carb_g) || 0,
    fat_g: Number(n.fat_g) || 0,
  }
}

/** Sum per-food macros for the meal total. */
function sumFoods(foods: EditableFood[]) {
  return foods.reduce(
    (acc, f) => ({
      protein_g: acc.protein_g + (Number(f.protein_g) || 0),
      carb_g: acc.carb_g + (Number(f.carb_g) || 0),
      fat_g: acc.fat_g + (Number(f.fat_g) || 0),
    }),
    { protein_g: 0, carb_g: 0, fat_g: 0 },
  )
}

/** Pretty per-gram × grams → integer macro. */
function scaleMacro(perGram: number, grams: number): number {
  return Math.round(perGram * grams * 10) / 10
}

/** Canonical food names sorted alphabetically for the dropdown. */
const FOOD_DB_KEYS = Object.keys(FOOD_DB).sort()

/** Per-gram lookup helper used by the swap dropdown. */
function macrosForGrams(macros: FoodMacros, grams: number) {
  return {
    protein_g: Math.round(scaleMacro(macros.pg_protein, grams)),
    carb_g: Math.round(scaleMacro(macros.pg_carb, grams)),
    fat_g: Math.round(scaleMacro(macros.pg_fat, grams)),
  }
}

export default function MealEditor({ planId, meal, proteinAnchor, siblingMeals, mealIndex, changedFoods }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Draft state — a per-instance mutable copy. Only synced back to server on Save.
  const [draftName, setDraftName] = useState(meal.meal_name || '')
  const [draftTiming, setDraftTiming] = useState(meal.timing || '')
  const [draftNotes, setDraftNotes] = useState(meal.notes || '')
  const [draftFoods, setDraftFoods] = useState<EditableFood[]>(meal.foods.map(toEditableFood))

  const mealMacros = useMemo(() => sumFoods(draftFoods), [draftFoods])
  const mealKcal = kcalFromMacros(mealMacros.protein_g, mealMacros.carb_g, mealMacros.fat_g)

  // Daily band preview must be computed at the top of the component (before
  // any conditional return) so hook order is stable between view / edit
  // mode renders. Rules of Hooks: previously this was defined after the
  // if (!editing) early return, which threw "Rendered more hooks than
  // during the previous render" on the first toggle into edit mode.
  const dailyPreview = useMemo(() => {
    const totalP = siblingMeals.reduce((acc, m) => acc + (m.meal_number === meal.meal_number ? mealMacros.protein_g : (Number(m.protein_g) || 0)), 0)
    const totalC = siblingMeals.reduce((acc, m) => acc + (m.meal_number === meal.meal_number ? mealMacros.carb_g : (Number(m.carb_g) || 0)), 0)
    const totalF = siblingMeals.reduce((acc, m) => acc + (m.meal_number === meal.meal_number ? mealMacros.fat_g : (Number(m.fat_g) || 0)), 0)
    return {
      protein_g: Math.round(totalP),
      carb_g: Math.round(totalC),
      fat_g: Math.round(totalF),
      kcal: kcalFromMacros(totalP, totalC, totalF),
    }
  }, [siblingMeals, mealMacros, meal.meal_number])

  // View-mode display: keep parity with the current page.tsx render.
  if (!editing) {
    const view = computeMealMacros(meal)
    const denom = view.kcal || 1
    const pp = Math.round((meal.protein_g * 4 / denom) * 100)
    const cp = Math.round((meal.carb_g * 4 / denom) * 100)
    const fp = 100 - pp - cp
    return (
      <div className="bg-[#F4F6F9] br-card overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E8EAEE] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#141821] text-sm">{meal.meal_name}</h3>
            <p className="text-[10px] text-[#98A0AD] mt-0.5">{meal.timing}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-[#141821] tabular-nums">{view.kcal} kcal</p>
              <p className="text-[10px] text-[#666D7A] mt-0.5 tabular-nums">
                {meal.protein_g}g P · {meal.carb_g}g C · {meal.fat_g}g F
              </p>
              <p className="text-[10px] text-[#98A0AD] mt-0.5 tabular-nums">
                P {pp}% · C {cp}% · F {fp}%
              </p>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="text-[10px] font-semibold px-2.5 py-1 border border-[#E8EAEE] text-[#666D7A] rounded-md hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="space-y-1.5">
            {meal.foods.map((food, i) => {
              const f = normalizeFood(food)
              // Changed by the last adjustment. Marked per FIELD, not per food,
              // so a carbohydrate change does not light up the protein figure.
              const changed = (changedFoods ?? []).filter(c => c.meal_index === mealIndex && c.food_index === i)
              const changedFields = new Set(changed.map(c => c.field))
              const wasChanged = changed.length > 0
              const macro = (field: string, label: string, value: number | null) =>
                changedFields.has(field)
                  ? <span className="text-[#DC2626] font-semibold"><span className="text-[10px]">{label}</span> {value}g</span>
                  : <span className="text-[#666D7A]"><span className="text-[10px] text-[#98A0AD]">{label}</span> {value}g</span>
              return (
                <div key={i} className={`flex items-start justify-between gap-3${wasChanged ? ' bg-[#FDEDED] -mx-2 px-2 py-1 rounded' : ''}`}>
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className={`mt-0.5 shrink-0 ${wasChanged ? 'text-[#DC2626]' : 'text-[#98A0AD]'}`}>•</span>
                    <p className="text-sm text-[#141821]">
                      {f.name}
                      {wasChanged && (
                        <span className="ml-2 text-[10px] font-semibold text-[#DC2626] uppercase tracking-wide">changed</span>
                      )}
                    </p>
                  </div>
                  {f.protein_g !== null && (
                    <div className="flex items-baseline gap-3 shrink-0 tabular-nums text-[12.5px] pt-0.5">
                      {macro('protein_g', 'P', f.protein_g)}
                      {macro('carb_g', 'C', f.carb_g)}
                      {macro('fat_g', 'F', f.fat_g)}
                      <span className="text-[#666D7A] font-medium w-[60px] text-right">{f.kcal} kcal</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {meal.notes && (
            <p className="text-[12.5px] text-[#98A0AD] italic mt-2">{meal.notes}</p>
          )}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════ EDIT MODE ═══════════════════════════════

  function updateFood(i: number, patch: Partial<EditableFood>) {
    setDraftFoods(prev => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)))
  }

  function deleteFood(i: number) {
    setDraftFoods(prev => prev.filter((_, idx) => idx !== i))
  }

  function addFood() {
    setDraftFoods(prev => [...prev, { name: '', protein_g: 0, carb_g: 0, fat_g: 0 }])
  }

  /** Handler for the "Swap food" dropdown per row. */
  function swapFood(i: number, canonical: string) {
    const macros = FOOD_DB[canonical]
    if (!macros) return
    const gramsStr = prompt(
      `Portion of "${canonical}" in grams:`,
      '100',
    )
    if (gramsStr === null) return
    const grams = Number(gramsStr)
    if (!Number.isFinite(grams) || grams <= 0) {
      alert('Grams must be a positive number.')
      return
    }
    const scaled = macrosForGrams(macros, grams)
    updateFood(i, {
      name: `${grams}g ${canonical}`,
      ...scaled,
    })
  }

  async function save() {
    setError(null)
    // Persist meal totals derived from the edited foods so downstream reads
    // (Program Reading, next-block generator, coach dashboard) see consistent
    // meal-level numbers matching the food rows.
    const updatedMeal: EditableMeal = {
      ...meal,
      meal_name: draftName.trim() || meal.meal_name,
      timing: draftTiming.trim() || meal.timing,
      notes: draftNotes.trim() || null,
      protein_g: Math.round(mealMacros.protein_g),
      carb_g: Math.round(mealMacros.carb_g),
      fat_g: Math.round(mealMacros.fat_g),
      foods: draftFoods.map(f => ({
        name: f.name.trim(),
        protein_g: Number(f.protein_g) || 0,
        carb_g: Number(f.carb_g) || 0,
        fat_g: Number(f.fat_g) || 0,
      })),
    }
    const newMeals = siblingMeals.map(m => (m.meal_number === meal.meal_number ? updatedMeal : m))

    startTransition(async () => {
      try {
        const res = await fetch(`/api/nutrition-plans/${planId}/meals`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meals: newMeals }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
        setEditing(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed')
      }
    })
  }

  function cancel() {
    // Reset draft to server-truth values and exit edit mode.
    setDraftName(meal.meal_name || '')
    setDraftTiming(meal.timing || '')
    setDraftNotes(meal.notes || '')
    setDraftFoods(meal.foods.map(toEditableFood))
    setError(null)
    setEditing(false)
  }

  return (
    <div className="bg-white border-2 border-[#1B6DFC] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E8EAEE] bg-[rgba(27,109,252,0.08)]/40 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <input
            type="text"
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            className="w-full font-semibold text-[#141821] text-sm bg-white border border-[#E8EAEE] rounded px-2 py-1 focus:outline-none focus:border-[#1B6DFC]"
            placeholder="Meal name"
          />
          <input
            type="text"
            value={draftTiming}
            onChange={e => setDraftTiming(e.target.value)}
            className="w-full text-[10px] text-[#666D7A] bg-white border border-[#E8EAEE] rounded px-2 py-1 focus:outline-none focus:border-[#1B6DFC]"
            placeholder="Timing (e.g. 07:00–08:00)"
          />
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-[#141821] tabular-nums">{mealKcal} kcal</p>
          <p className="text-[10px] text-[#666D7A] mt-0.5 tabular-nums">
            {Math.round(mealMacros.protein_g)}g P · {Math.round(mealMacros.carb_g)}g C · {Math.round(mealMacros.fat_g)}g F
          </p>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="space-y-2">
          {draftFoods.map((f, i) => (
            <div key={i} className="flex items-start gap-2 group">
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  value={f.name}
                  onChange={e => updateFood(i, { name: e.target.value })}
                  placeholder="e.g. 150g chicken thigh (raw)"
                  className="w-full text-sm text-[#141821] bg-[#FBFCFD] border border-[#E8EAEE] rounded px-2 py-1 focus:outline-none focus:border-[#1B6DFC]"
                />
                <div className="flex items-center gap-2">
                  <select
                    value=""
                    onChange={e => {
                      if (e.target.value) swapFood(i, e.target.value)
                      e.target.value = ''
                    }}
                    className="text-[10px] text-[#666D7A] bg-white border border-[#E8EAEE] rounded px-1.5 py-0.5 hover:border-[#1B6DFC] focus:outline-none focus:border-[#1B6DFC] max-w-[220px]"
                  >
                    <option value="">🔄 Swap food from reference table…</option>
                    {FOOD_DB_KEYS.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                  {lookupFood(f.name) && (
                    <span className="text-[9px] text-[#177245] bg-[#EDF8F1] px-1.5 py-0.5 rounded">In table</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <label className="flex items-center gap-1 text-[10px] text-[#98A0AD] tabular-nums">
                  P
                  <input
                    type="number"
                    value={f.protein_g}
                    onChange={e => updateFood(i, { protein_g: Number(e.target.value) })}
                    className="w-14 text-[12.5px] text-[#141821] bg-[#FBFCFD] border border-[#E8EAEE] rounded px-1.5 py-1 focus:outline-none focus:border-[#1B6DFC]"
                    step="0.1"
                    min="0"
                  />g
                </label>
                <label className="flex items-center gap-1 text-[10px] text-[#98A0AD] tabular-nums">
                  C
                  <input
                    type="number"
                    value={f.carb_g}
                    onChange={e => updateFood(i, { carb_g: Number(e.target.value) })}
                    className="w-14 text-[12.5px] text-[#141821] bg-[#FBFCFD] border border-[#E8EAEE] rounded px-1.5 py-1 focus:outline-none focus:border-[#1B6DFC]"
                    step="0.1"
                    min="0"
                  />g
                </label>
                <label className="flex items-center gap-1 text-[10px] text-[#98A0AD] tabular-nums">
                  F
                  <input
                    type="number"
                    value={f.fat_g}
                    onChange={e => updateFood(i, { fat_g: Number(e.target.value) })}
                    className="w-14 text-[12.5px] text-[#141821] bg-[#FBFCFD] border border-[#E8EAEE] rounded px-1.5 py-1 focus:outline-none focus:border-[#1B6DFC]"
                    step="0.1"
                    min="0"
                  />g
                </label>
                <div className="w-[60px] text-right text-[12.5px] font-medium text-[#141821] tabular-nums pt-1">
                  {kcalFromMacros(Number(f.protein_g) || 0, Number(f.carb_g) || 0, Number(f.fat_g) || 0)} kcal
                </div>
                <button
                  onClick={() => deleteFood(i)}
                  className="text-[11px] text-[#98A0AD] hover:text-[#C82626] transition-colors px-1"
                  title="Delete food"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addFood}
          className="mt-3 text-[12.5px] font-semibold px-3 py-1.5 border border-dashed border-[#E8EAEE] text-[#666D7A] rounded hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors"
        >
          + Add food
        </button>

        <div className="mt-4">
          <label className="text-[11.5px] font-medium text-[#666D7A] mb-1 block">Meal notes</label>
          <textarea
            value={draftNotes}
            onChange={e => setDraftNotes(e.target.value)}
            placeholder="Optional preparation / execution note for this meal"
            rows={2}
            className="w-full text-[12.5px] text-[#141821] bg-[#FBFCFD] border border-[#E8EAEE] rounded px-2 py-1.5 focus:outline-none focus:border-[#1B6DFC]"
          />
        </div>

        <div className="mt-4 pt-3 border-t border-[#E8EAEE] flex items-center justify-between">
          <div className="text-[11px] text-[#666D7A]">
            Daily preview:{' '}
            <span className="font-semibold text-[#141821] tabular-nums">
              {dailyPreview.kcal} kcal
            </span>
            {' '}·{' '}
            <span className="tabular-nums">
              {dailyPreview.protein_g}g P
              {proteinAnchor ? (
                <span className={`ml-1 text-[10px] ${Math.abs(dailyPreview.protein_g - proteinAnchor) > 20 ? 'text-[#A96A12]' : 'text-[#177245]'}`}>
                  vs {proteinAnchor}g anchor
                </span>
              ) : null}
            </span>
            {' '}·{' '}
            <span className="tabular-nums">{dailyPreview.carb_g}g C</span>
            {' '}·{' '}
            <span className="tabular-nums">{dailyPreview.fat_g}g F</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cancel}
              disabled={pending}
              className="text-[12.5px] font-semibold px-3 py-1.5 text-[#666D7A] rounded hover:text-[#141821] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={pending}
              className="text-[12.5px] font-semibold px-4 py-1.5 bg-[#1B6DFC] text-white rounded hover:bg-[#1057CC] transition-colors disabled:opacity-50"
            >
              {pending ? 'Saving…' : 'Save meal'}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-[11px] text-[#C82626]">{error}</p>
        )}
      </div>
    </div>
  )
}
