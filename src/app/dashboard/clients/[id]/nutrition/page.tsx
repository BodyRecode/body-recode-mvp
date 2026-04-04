import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import NutritionDraftActions from './draft-actions'
import NutritionWeeklyReview from './weekly-review'
import StickyScrollNav from '@/components/sticky-scroll-nav'

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

interface NutritionPlan {
  id: string
  client_id: string
  plan_name: string
  entry_state: string
  body_state: string
  pts_phase: string
  protein_anchor_g: number
  carb_demand_level: string
  estimated_calorie_band: string | null
  meal_frequency: number
  modulation_level: string
  active_strategies: string[]
  nutrient_timing_permission: string
  meals: Meal[]
  training_day_adjustments: {
    carb_increase_g: number
    fat_reduction_g: number
    timing_note: string
    meals_affected: string[]
  } | null
  rest_day_adjustments: { note: string } | null
  food_selection_guidelines: string[]
  substitution_options: { protein: string[]; carbohydrate: string[]; fat: string[] } | null
  execution_rules: string[]
  what_not_to_change: string[]
  entry_state_summary: {
    current_focus: string
    what_this_means: string
    prioritise: string[]
    avoid: string[]
  } | null
  key_priorities: string[]
  weekly_structure_notes: string | null
  progression_notes: string | null
  confidence_level: string
  simplification_required: boolean
  status: 'draft' | 'active'
  is_active: boolean
  generated_at: string
  current_direction: string | null
  last_review_at: string | null
}

function parseText(text: string): { intro: string | null; points: string[] } {
  if (/\(\d+\)/.test(text)) {
    const firstIdx = text.search(/\(\d+\)/)
    const intro = firstIdx > 0 ? text.slice(0, firstIdx).trim() : null
    const rest = firstIdx > 0 ? text.slice(firstIdx) : text
    const points = rest.split(/\s*\(\d+\)\s*/).map((s: string) => s.trim()).filter(Boolean)
    return { intro, points }
  }
  const sentences = text.replace(/([.!?])\s+(?=[A-Z—])/g, '$1|||').split('|||').map((s: string) => s.trim()).filter((s: string) => s.length > 10)
  if (sentences.length >= 3) return { intro: null, points: sentences }
  return { intro: null, points: [text] }
}

function nutritionNavSections(plan: NutritionPlan) {
  return [
    { id: 'identity', title: 'Overview' },
    ...(plan.entry_state_summary ? [{ id: 'current-focus', title: 'Current Focus' }] : []),
    ...(plan.weekly_structure_notes ? [{ id: 'structure', title: 'Structure' }] : []),
    { id: 'meals', title: 'Meals' },
    ...(plan.training_day_adjustments ? [{ id: 'adjustments', title: 'Adjustments' }] : []),
    ...(plan.execution_rules?.length ? [{ id: 'execution', title: 'Execution' }] : []),
    ...(plan.progression_notes ? [{ id: 'progression', title: 'Progression' }] : []),
    ...(plan.substitution_options ? [{ id: 'substitutions', title: 'Substitutions' }] : []),
  ]
}

const entryStateColour: Record<string, string> = {
  stabilisation: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  training_support: 'text-teal-400 bg-teal-400/10 border-teal-400/30',
  high_output_support: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
  recovery_reset: 'text-red-400 bg-red-400/10 border-red-400/30',
}

const carbColour: Record<string, string> = {
  low: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  moderate: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  high: 'text-green-400 bg-green-400/10 border-green-400/30',
}

const directionColour: Record<string, string> = {
  progress: 'text-green-400 bg-green-400/10 border-green-400/30',
  hold: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  rebuild: 'text-red-400 bg-red-400/10 border-red-400/30',
}

function clean(s: string): string {
  return s.replace(/ — /g, ' ').replace(/—/g, ' ')
}

function NutritionPlanBody({ plan, idPrefix = '' }: { plan: NutritionPlan; idPrefix?: string }) {
  return (
    <div className="space-y-4">

      {/* Identity card */}
      <div id={`${idPrefix}identity`} className="scroll-mt-8 bg-stone-900 border border-stone-800 rounded-xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{plan.plan_name}</h2>
            <p className="text-xs text-stone-500 mt-1">
              {plan.meal_frequency} meals/day · {plan.protein_anchor_g}g protein · {plan.pts_phase}
            </p>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${entryStateColour[plan.entry_state] || 'text-stone-400 bg-stone-800 border-stone-700'}`}>
              {plan.entry_state.replace(/_/g, ' ')}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${carbColour[plan.carb_demand_level] || 'text-stone-400 bg-stone-800 border-stone-700'}`}>
              {plan.carb_demand_level} carbs
            </span>
          </div>
        </div>
        {plan.estimated_calorie_band && (
          <p className="text-xs text-stone-500">~{plan.estimated_calorie_band}</p>
        )}
        {plan.current_direction && (
          <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${directionColour[plan.current_direction] || ''}`}>
            Weekly direction: {plan.current_direction}
          </span>
        )}
        <p className="text-xs text-stone-600 mt-3">
          Generated {new Date(plan.generated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Entry State Summary */}
      {plan.entry_state_summary && (
        <div id={`${idPrefix}current-focus`} className="scroll-mt-8 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-800">
            <span className="text-[11px] font-black text-[#10E1C2]">01</span>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Current Focus</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-white font-medium">{clean(plan.entry_state_summary.current_focus)}</p>
            <p className="text-sm text-stone-300 leading-relaxed">{clean(plan.entry_state_summary.what_this_means)}</p>
            {plan.entry_state_summary.prioritise?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-[#10E1C2] uppercase tracking-wider mb-1.5">Prioritise</p>
                <div className="space-y-1">
                  {plan.entry_state_summary.prioritise.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-teal-400 mt-0.5">•</span>
                      <p className="text-sm text-stone-300">{clean(item)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {plan.entry_state_summary.avoid?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Avoid</p>
                <div className="space-y-1">
                  {plan.entry_state_summary.avoid.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-stone-600 mt-0.5">•</span>
                      <p className="text-sm text-stone-400">{clean(item)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weekly Structure Notes */}
      {plan.weekly_structure_notes && (() => {
        const { intro, points } = parseText(clean(plan.weekly_structure_notes))
        return (
          <div id={`${idPrefix}structure`} className="scroll-mt-8 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-800">
              <span className="text-[11px] font-black text-[#10E1C2]">02</span>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Structure Logic</p>
            </div>
            <div className="px-5 py-4 space-y-2">
              {intro && <p className="text-sm text-stone-200 leading-relaxed">{intro}</p>}
              {points.length > 1 ? points.map((point, i) => (
                <div key={i} className="flex items-start gap-2.5 border-l-2 border-stone-700 pl-3">
                  <p className="text-sm text-stone-300 leading-relaxed">{point}</p>
                </div>
              )) : <p className="text-sm text-stone-200 leading-relaxed">{points[0]}</p>}
            </div>
          </div>
        )
      })()}

      {/* Meals */}
      <div id={`${idPrefix}meals`} className="scroll-mt-8">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 px-1">Meal Structure</p>
        <div className="space-y-3">
          {plan.meals.map((meal) => (
            <div key={meal.meal_number} className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-stone-100 text-sm">{meal.meal_name}</h3>
                  <p className="text-[10px] text-stone-600 mt-0.5">{meal.timing}</p>
                </div>
                <div className="flex gap-3 text-xs tabular-nums">
                  <span className="text-stone-300">{meal.protein_g}g P</span>
                  <span className="text-stone-500">{meal.carb_g}g C</span>
                  <span className="text-stone-500">{meal.fat_g}g F</span>
                </div>
              </div>
              <div className="px-5 py-4">
                <div className="space-y-1.5">
                  {meal.foods.map((food, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-stone-600 mt-0.5">•</span>
                      <p className="text-sm text-stone-300">{clean(food)}</p>
                    </div>
                  ))}
                </div>
                {meal.notes && (
                  <p className="text-xs text-stone-600 italic mt-2">{clean(meal.notes)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Training Day Adjustments */}
      {plan.training_day_adjustments && (
        <div id={`${idPrefix}adjustments`} className="scroll-mt-8 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-800">
            <span className="text-[11px] font-black text-[#10E1C2]">03</span>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Training Day Adjustments</p>
          </div>
          <div className="px-5 py-4 space-y-2">
            <div className="flex gap-4 text-sm">
              <span className="text-stone-400">+{plan.training_day_adjustments.carb_increase_g}g carbs</span>
              {plan.training_day_adjustments.fat_reduction_g > 0 && (
                <span className="text-stone-500">−{plan.training_day_adjustments.fat_reduction_g}g fat</span>
              )}
            </div>
            {plan.training_day_adjustments.timing_note && (
              <p className="text-sm text-stone-300">{clean(plan.training_day_adjustments.timing_note)}</p>
            )}
            {plan.training_day_adjustments.meals_affected?.length > 0 && (
              <p className="text-xs text-stone-500">Applies to: {plan.training_day_adjustments.meals_affected.join(', ')}</p>
            )}
          </div>
        </div>
      )}

      {/* Execution Rules */}
      {plan.execution_rules?.length > 0 && (
        <div id={`${idPrefix}execution`} className="scroll-mt-8 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-800">
            <span className="text-[11px] font-black text-[#10E1C2]">04</span>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Execution Rules</p>
          </div>
          <div className="px-5 py-4 space-y-2">
            {plan.execution_rules.map((rule, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5 shrink-0">•</span>
                <p className="text-sm text-stone-300">{clean(rule)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What Not to Change */}
      {plan.what_not_to_change?.length > 0 && (
        <div className="bg-stone-800/40 border border-stone-800 rounded-xl px-5 py-4">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">What Not to Change</p>
          <div className="space-y-1.5">
            {plan.what_not_to_change.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-stone-600 mt-0.5 shrink-0">—</span>
                <p className="text-xs text-stone-400">{clean(item)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progression Notes */}
      {plan.progression_notes && (() => {
        const { intro, points } = parseText(clean(plan.progression_notes))
        return (
          <div id={`${idPrefix}progression`} className="scroll-mt-8 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-800">
              <span className="text-[11px] font-black text-[#10E1C2]">05</span>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Progression Notes</p>
            </div>
            <div className="px-5 py-4 space-y-2">
              {intro && <p className="text-sm text-stone-200 leading-relaxed">{intro}</p>}
              {points.length > 1 ? points.map((point, i) => (
                <div key={i} className="flex items-start gap-2.5 border-l-2 border-stone-700 pl-3">
                  <p className="text-sm text-stone-300 leading-relaxed">{point}</p>
                </div>
              )) : <p className="text-sm text-stone-200 leading-relaxed">{points[0]}</p>}
            </div>
          </div>
        )
      })()}

      {/* Substitutions */}
      {plan.substitution_options && (
        <div id={`${idPrefix}substitutions`} className="scroll-mt-8 bg-stone-900 border border-stone-800 rounded-xl p-5">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3">Food Substitutions</p>
          <div className="grid grid-cols-3 gap-4">
            {(['protein', 'carbohydrate', 'fat'] as const).map(cat => (
              plan.substitution_options![cat]?.length > 0 && (
                <div key={cat}>
                  <p className="text-[10px] font-bold text-stone-600 uppercase tracking-wider mb-2 capitalize">{cat}</p>
                  <div className="space-y-1">
                    {plan.substitution_options![cat].map((item, i) => (
                      <p key={i} className="text-xs text-stone-400">• {clean(item)}</p>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default async function NutritionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .maybeSingle()

  if (!client) notFound()

  const { data: plans } = await admin
    .from('nutrition_plans')
    .select('*')
    .eq('client_id', id)
    .order('generated_at', { ascending: false })

  const draftPlan = plans?.find(p => p.status === 'draft') as NutritionPlan | undefined
  const activePlan = plans?.find(p => p.is_active) as NutritionPlan | undefined
  const archivedPlans = plans?.filter(p => !p.is_active && p.status !== 'draft') as NutritionPlan[]

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
            <Link href={`/dashboard/clients/${id}`} className="hover:text-stone-300 transition-colors">{client.name}</Link>
            <span>/</span>
            <span className="text-stone-300">Nutrition Plan</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Nutrition Plan</h1>
        </div>
        <Link
          href={`/dashboard/clients/${id}/nutrition/suggest`}
          className="text-xs font-medium px-3 py-1.5 border border-stone-700 text-stone-400 rounded-lg hover:border-stone-500 hover:text-stone-200 transition-colors"
        >
          {activePlan || draftPlan ? 'Regenerate' : 'Generate Plan'}
        </Link>
      </div>

      {/* Draft */}
      {draftPlan && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-700 text-amber-400 uppercase tracking-wide">
              Draft — Pending Approval
            </span>
            <NutritionDraftActions planId={draftPlan.id} clientId={id} />
          </div>
          <NutritionPlanBody plan={draftPlan} idPrefix="draft-" />
        </div>
      )}

      {/* Rebuild alert */}
      {activePlan?.current_direction === 'rebuild' && (
        <div className="mb-4 flex items-start gap-3 bg-red-950/40 border border-red-800/60 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-400">Client is struggling with nutrition</p>
            <p className="text-xs text-red-400/70 mt-0.5">Latest check-in direction is Rebuild. Consider adjusting the plan or generating a new one.</p>
          </div>
          <Link href="./nutrition/suggest" className="text-xs font-semibold text-red-400 hover:text-red-300 shrink-0 mt-0.5">Regenerate →</Link>
        </div>
      )}

      {/* Active plan */}
      {activePlan ? (
        <div>
          {draftPlan && (
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="flex-1 h-px bg-stone-800" />
              <p className="text-xs text-stone-600 uppercase tracking-widest">Current Active Plan</p>
              <div className="flex-1 h-px bg-stone-800" />
            </div>
          )}

          <div className="flex gap-8">
            <StickyScrollNav sections={nutritionNavSections(activePlan)} />
            <div className="flex-1 min-w-0">
              <NutritionPlanBody plan={activePlan} />
            </div>
          </div>

          {/* Weekly Review */}
          <div className="mt-6">
            <NutritionWeeklyReview planId={activePlan.id} currentDirection={activePlan.current_direction} lastReviewAt={activePlan.last_review_at} />
          </div>

          {/* Archived */}
          {archivedPlans.length > 0 && (
            <div className="mt-6">
              <p className="text-stone-500 text-sm mb-3">Previous Plans ({archivedPlans.length})</p>
              <div className="space-y-2">
                {archivedPlans.map(p => (
                  <div key={p.id} className="bg-stone-900/50 border border-stone-800 rounded-lg px-4 py-3 flex items-center justify-between opacity-60">
                    <span className="text-sm text-stone-400">{p.plan_name}</span>
                    <span className="text-xs text-stone-600">
                      {new Date(p.generated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}<span className="capitalize">{p.entry_state.replace(/_/g, ' ')}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : !draftPlan ? (
        <div className="text-center py-16 border-2 border-dashed border-stone-800 rounded-xl">
          <p className="text-stone-500 mb-4">No nutrition plan generated yet.</p>
          <Link
            href={`/dashboard/clients/${id}/nutrition/suggest`}
            className="text-xs font-medium px-3 py-1.5 border border-stone-700 text-stone-400 rounded-lg hover:border-stone-500 hover:text-stone-200 transition-colors"
          >
            Generate Plan
          </Link>
        </div>
      ) : null}
    </div>
  )
}
