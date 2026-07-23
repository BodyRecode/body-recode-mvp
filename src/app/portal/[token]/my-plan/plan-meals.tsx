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

export default function PlanMeals({ meals }: { meals: Meal[] }) {
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
      <p className="text-xs font-bold text-[#999999] uppercase tracking-widest">Meals</p>
      {meals.map((meal, i) => {
        const isOpen = open.has(i)
        const totalCals = Math.round(meal.protein_g * 4 + meal.carb_g * 4 + meal.fat_g * 9)
        const denom = totalCals || 1
        const pp = Math.round((meal.protein_g * 4 / denom) * 100)
        const cp = Math.round((meal.carb_g * 4 / denom) * 100)
        const fp = 100 - pp - cp
        return (
          <div key={i} className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[#FAFAF7] transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1A1A1A]">{meal.meal_name}</p>
                <p className="text-xs text-[#999999] mt-0.5">{meal.timing}{totalCals ? ` · ${totalCals} kcal` : ''}</p>
              </div>
              <svg
                className={`w-4 h-4 text-[#999999] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="border-t border-[#E5E5E5]">
                <div className="px-5 py-3 border-b border-[#E5E5E5]/60">
                  <div className="flex gap-3">
                    <div className="text-center">
                      <p className="text-sm font-bold text-[#1A1A1A]">{meal.protein_g}g</p>
                      <p className="text-xs text-[#999999]">Protein</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-[#1A1A1A]">{meal.carb_g}g</p>
                      <p className="text-xs text-[#999999]">Carbs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-[#1A1A1A]">{meal.fat_g}g</p>
                      <p className="text-xs text-[#999999]">Fat</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#999999] mt-2 tabular-nums uppercase tracking-wider">
                    P {pp}% · C {cp}% · F {fp}%
                  </p>
                </div>
                {meal.foods && meal.foods.length > 0 && (
                  <div className="px-5 py-3">
                    <ul className="space-y-1.5">
                      {meal.foods.map((food, fi) => {
                        const f = normalizeFood(food)
                        return (
                          <li key={fi} className="text-xs text-[#6B6B6B] flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <span className="text-[#999999] shrink-0">·</span>
                              <span>{f.name}</span>
                            </div>
                            {f.kcal !== null && (
                              <span className="text-[#999999] tabular-nums shrink-0">{f.kcal} kcal</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                    {meal.notes && <p className="text-xs text-[#999999] mt-2 italic">{meal.notes}</p>}
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
