import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ClientHeader from '@/components/client-header'
import Link from 'next/link'

interface Meal {
  meal_number: number
  meal_name: string
  timing: string
  protein_g: number
  carb_g: number
  fat_g: number
  foods: string[]
  notes: string | null
}

interface EntryStateSummary {
  current_focus: string
  what_this_means: string
  prioritise: string[]
  avoid: string[]
}

interface TrainingDayAdjustments {
  carb_increase_g: number
  fat_reduction_g: number
  timing_note: string
  meals_affected: string[]
}

const directionColour: Record<string, string> = {
  progress: 'text-green-400 bg-green-400/10 border-green-400/30',
  hold: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  rebuild: 'text-red-400 bg-red-400/10 border-red-400/30',
}

const directionLabel: Record<string, string> = {
  progress: 'Making progress',
  hold: 'Staying steady',
  rebuild: 'Struggling',
}

export default async function PortalMyPlanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) return notFound()

  const { data: plan } = await admin
    .from('nutrition_plans')
    .select('id, plan_name, entry_state, estimated_calorie_band, meal_frequency, meals, training_day_adjustments, rest_day_adjustments, execution_rules, what_not_to_change, entry_state_summary, current_direction, last_review_at')
    .eq('client_id', client.id)
    .eq('status', 'active')
    .maybeSingle()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href={`/portal/${token}`} className="text-stone-500 hover:text-stone-300 text-sm transition-colors">← Back</Link>
          <h1 className="text-2xl font-bold text-white mt-4 mb-1">Your Nutrition Plan</h1>
          <p className="text-stone-400 text-sm">Your current daily nutrition prescription.</p>
        </div>

        {!plan ? (
          <div className="rounded-2xl border border-stone-800 bg-stone-900 p-6 text-center">
            <p className="text-stone-500 text-sm">No active nutrition plan yet. Your coach will set this up for you.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Overview */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-lg font-bold text-white">{plan.plan_name}</p>
                  <p className="text-xs text-stone-500 mt-0.5 capitalize">{plan.entry_state?.replace(/_/g, ' ')}</p>
                </div>
                {plan.current_direction && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize shrink-0 ${directionColour[plan.current_direction] || 'text-stone-400 bg-stone-800 border-stone-700'}`}>
                    {directionLabel[plan.current_direction] ?? plan.current_direction}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-800/60 rounded-xl px-3 py-2.5">
                  <p className="text-xs text-stone-500 mb-0.5">Meals / day</p>
                  <p className="text-sm font-semibold text-white">{plan.meal_frequency}</p>
                </div>
                {plan.estimated_calorie_band && (
                  <div className="bg-stone-800/60 rounded-xl px-3 py-2.5">
                    <p className="text-xs text-stone-500 mb-0.5">Calorie range</p>
                    <p className="text-sm font-semibold text-white">{plan.estimated_calorie_band}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Current focus */}
            {plan.entry_state_summary && (() => {
              const summary = plan.entry_state_summary as EntryStateSummary
              return (
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Current focus</p>
                  <p className="text-sm font-semibold text-white mb-1">{summary.current_focus}</p>
                  <p className="text-sm text-stone-400 leading-relaxed mb-4">{summary.what_this_means}</p>
                  {summary.prioritise?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-teal-500 mb-2">Prioritise</p>
                      <ul className="space-y-1">
                        {summary.prioritise.map((item, i) => (
                          <li key={i} className="text-xs text-stone-400 flex gap-2">
                            <span className="text-teal-600 shrink-0">·</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {summary.avoid?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-500 mb-2">Avoid</p>
                      <ul className="space-y-1">
                        {summary.avoid.map((item, i) => (
                          <li key={i} className="text-xs text-stone-400 flex gap-2">
                            <span className="text-amber-600 shrink-0">·</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Meals */}
            {Array.isArray(plan.meals) && plan.meals.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Meals</p>
                {(plan.meals as Meal[]).map((meal, i) => {
                  const totalCals = Math.round(meal.protein_g * 4 + meal.carb_g * 4 + meal.fat_g * 9)
                  return (
                    <div key={i} className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
                      <div className="px-5 py-3 border-b border-stone-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-white">{meal.meal_name}</p>
                            <p className="text-xs text-stone-500 mt-0.5">{meal.timing}</p>
                          </div>
                          <p className="text-xs text-stone-500">{totalCals} kcal</p>
                        </div>
                        <div className="flex gap-3 mt-3">
                          <div className="text-center">
                            <p className="text-sm font-bold text-white">{meal.protein_g}g</p>
                            <p className="text-xs text-stone-600">Protein</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-white">{meal.carb_g}g</p>
                            <p className="text-xs text-stone-600">Carbs</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-white">{meal.fat_g}g</p>
                            <p className="text-xs text-stone-600">Fat</p>
                          </div>
                        </div>
                      </div>
                      {meal.foods && meal.foods.length > 0 && (
                        <div className="px-5 py-3">
                          <ul className="space-y-1">
                            {meal.foods.map((food, fi) => (
                              <li key={fi} className="text-xs text-stone-400 flex gap-2">
                                <span className="text-stone-600 shrink-0">·</span>
                                <span>{food}</span>
                              </li>
                            ))}
                          </ul>
                          {meal.notes && <p className="text-xs text-stone-600 mt-2 italic">{meal.notes}</p>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Training day adjustments */}
            {plan.training_day_adjustments && (() => {
              const adj = plan.training_day_adjustments as TrainingDayAdjustments
              return (
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Training day adjustments</p>
                  <div className="flex gap-3 mb-3">
                    {adj.carb_increase_g > 0 && (
                      <div className="bg-stone-800/60 rounded-xl px-3 py-2">
                        <p className="text-xs text-stone-500">Extra carbs</p>
                        <p className="text-sm font-bold text-white">+{adj.carb_increase_g}g</p>
                      </div>
                    )}
                    {adj.fat_reduction_g > 0 && (
                      <div className="bg-stone-800/60 rounded-xl px-3 py-2">
                        <p className="text-xs text-stone-500">Reduced fat</p>
                        <p className="text-sm font-bold text-white">-{adj.fat_reduction_g}g</p>
                      </div>
                    )}
                  </div>
                  {adj.timing_note && <p className="text-xs text-stone-400 leading-relaxed mb-2">{adj.timing_note}</p>}
                  {adj.meals_affected?.length > 0 && (
                    <p className="text-xs text-stone-600">Applies to: {adj.meals_affected.join(', ')}</p>
                  )}
                </div>
              )
            })()}

            {/* Execution rules */}
            {Array.isArray(plan.execution_rules) && plan.execution_rules.length > 0 && (
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">How to follow this plan</p>
                <ul className="space-y-2">
                  {(plan.execution_rules as string[]).map((rule, i) => (
                    <li key={i} className="text-xs text-stone-400 flex gap-2 leading-relaxed">
                      <span className="text-teal-600 shrink-0 font-bold">{i + 1}.</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What not to change */}
            {Array.isArray(plan.what_not_to_change) && plan.what_not_to_change.length > 0 && (
              <div className="bg-amber-950/20 border border-amber-800/30 rounded-2xl p-5">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">Do not change these</p>
                <ul className="space-y-2">
                  {(plan.what_not_to_change as string[]).map((item, i) => (
                    <li key={i} className="text-xs text-stone-400 flex gap-2 leading-relaxed">
                      <span className="text-amber-600 shrink-0">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link
              href={`/portal/${token}/nutrition`}
              className="block w-full py-3.5 bg-stone-800 hover:bg-stone-700 text-white font-semibold text-sm rounded-2xl text-center transition-colors"
            >
              Submit weekly nutrition check-in →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
