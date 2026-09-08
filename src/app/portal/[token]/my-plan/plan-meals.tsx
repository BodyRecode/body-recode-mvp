'use client'

/**
 * Collapsible meals list for the client nutrition plan viewer. Mirrors the
 * program page's session accordion: each meal is a card showing name + timing
 * + kcal; tapping it expands the macro breakdown, foods and notes in place.
 * First meal expanded by default.
 */

import { useState } from 'react'
import { normalizeFood, type FoodInput } from '@/lib/nutrition-validation'

interface Meal {
  meal_number?: number
  meal_name: string
  timing: string
  protein_g: number
  carb_g: number
  fat_g: number
  foods: FoodInput[]
  notes: string | null
}

/**
 * A supplement the coach has ACCEPTED, placed against the meal it is taken
 * with. Only accepted ones are ever passed in; suggestions the coach has not
 * approved never reach the client.
 */
export interface PlanSupplementRow {
  substance_slug: string
  name?: string | null
  dose?: string | null
  timing_note?: string | null
  timing_meal_number?: number | null
  rationale_client_facing?: string | null
  assigned?: boolean
}

export default function PlanMeals({
  meals,
  supplements = [],
}: {
  meals: Meal[]
  /**
   * Added 2026-09-08, closing the Unified Consumption Plan. Her supplements
   * used to live on a separate portal page, so a plan and the things taken with
   * it were two places she had to visit. Anything not tied to a specific meal
   * is rendered by the caller as a standalone group.
   */
  supplements?: PlanSupplementRow[]
}) {
  const [open, setOpen] = useState<Set<number>>(() => new Set(meals.length > 0 ? [0] : []))

  const toggle = (i: number) =>
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] font-medium text-[#98A0AD]">Meals</p>
      {meals.map((meal, i) => {
        const isOpen = open.has(i)
        const totalCals = Math.round(meal.protein_g * 4 + meal.carb_g * 4 + meal.fat_g * 9)
        const denom = totalCals || 1
        const pp = Math.round((meal.protein_g * 4 / denom) * 100)
        const cp = Math.round((meal.carb_g * 4 / denom) * 100)
        const fp = 100 - pp - cp
        return (
          <div key={i} className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[#FAFAF7] transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#141821]">{meal.meal_name}</p>
                <p className="text-xs text-[#98A0AD] mt-0.5">{meal.timing}{totalCals ? ` · ${totalCals} kcal` : ''}</p>
              </div>
              <svg
                className={`w-4 h-4 text-[#98A0AD] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="border-t border-[#E8EAEE]">
                <div className="px-5 py-3 border-b border-[#E8EAEE]/60">
                  <div className="flex gap-3">
                    <div className="text-center">
                      <p className="text-sm font-bold text-[#141821]">{meal.protein_g}g</p>
                      <p className="text-xs text-[#98A0AD]">Protein</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-[#141821]">{meal.carb_g}g</p>
                      <p className="text-xs text-[#98A0AD]">Carbs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-[#141821]">{meal.fat_g}g</p>
                      <p className="text-xs text-[#98A0AD]">Fat</p>
                    </div>
                  </div>
                  <p className="text-[11.5px] text-[#98A0AD] mt-2 tabular-nums">
                    P {pp}% · C {cp}% · F {fp}%
                  </p>
                </div>
                {meal.foods && meal.foods.length > 0 && (
                  <div className="px-5 py-3">
                    <ul className="space-y-1.5">
                      {meal.foods.map((food, fi) => {
                        const f = normalizeFood(food)
                        return (
                          <li key={fi} className="text-xs text-[#666D7A] flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <span className="text-[#98A0AD] shrink-0">·</span>
                              <span>{f.name}</span>
                            </div>
                            {f.kcal !== null && (
                              <span className="text-[#98A0AD] tabular-nums shrink-0">{f.kcal} kcal</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                    {meal.notes && <p className="text-xs text-[#98A0AD] mt-2 italic">{meal.notes}</p>}

                    {/* Accepted supplements taken with THIS meal. */}
                    {(() => {
                      const withMeal = supplements.filter(
                        sup => sup.assigned && sup.timing_meal_number != null && sup.timing_meal_number === meal.meal_number
                      )
                      if (withMeal.length === 0) return null
                      return (
                        <div className="mt-3 pt-3 border-t border-[#EFF1F4]">
                          <p className="text-[10.5px] uppercase tracking-wide text-[#98A0AD] mb-1.5">Take with this meal</p>
                          <ul className="space-y-1">
                            {withMeal.map(sup => (
                              <li key={sup.substance_slug} className="text-xs text-[#666D7A] flex items-start gap-2">
                                <span className="text-[#98A0AD] shrink-0">·</span>
                                <span>
                                  {sup.name ?? sup.substance_slug}
                                  {sup.dose ? <span className="text-[#98A0AD]"> · {sup.dose}</span> : null}
                                  {sup.timing_note ? <span className="text-[#98A0AD]"> · {sup.timing_note}</span> : null}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
