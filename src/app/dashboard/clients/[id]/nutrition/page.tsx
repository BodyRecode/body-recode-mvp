import { createAdminClient } from '@/lib/supabase/admin'
import ClientPageNav from '../client-page-nav'
import { PageHeader, Btn } from '@/components/dashboard/ui'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { detectBridgeReadiness } from '@/lib/client-next-action'
import NutritionDraftActions from './draft-actions'
import DeleteNutritionPlanButton from './delete-button'
import NutritionWeeklyReview from './weekly-review'
import NutritionReadingPanel from './nutrition-reading-panel'
import NotifyClientButton from './notify-client-button'
import NutritionCoachGuidanceEditor from './coach-guidance-editor'
import NutritionRegenerateButton from './regenerate-button'
import StickyScrollNav from '@/components/sticky-scroll-nav'
import MealLoggingToggle from './meal-logging-toggle'
import { GlanceCard } from '@/components/glance-card'
import {
  computeNutritionTotals,
  computeMealMacros,
  normalizeFood,
  parseCalorieBand,
  kcalFromMacros,
  type FoodInput,
} from '@/lib/nutrition-validation'
import { DOCTRINE_VERSIONS, isDoctrineStale } from '@/lib/doctrine-versions'
import MealEditor from './meal-editor'

interface Meal {
  meal_number: number
  meal_name: string
  timing: string
  protein_g: number
  carb_g: number
  fat_g: number
  foods: FoodInput[]
  notes: string | null
}

/** What the last surgical adjustment did. Null after a full regeneration. */
interface LastStep {
  summary?: string
  notes?: string[]
  changes?: { meal_index: number; food_index: number; food_name: string; field: string; from: number; to: number }[]
}

interface NutritionPlan {
  id: string
  client_id: string
  last_step?: LastStep | null
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
  // Bridge mode metadata (added 2026-05-25). Nullable for plans generated
  // before the migration ran.
  transitional_override_active?: boolean | null
  transitional_override_floor_kcal?: number | null
  transitional_override_justification?: string | null
  transitional_override_expires_at?: string | null
  // Phase 4 commit 2: doctrine version stamp. Null for plans inserted before
  // the doctrine-versioning migration ran (grandfathered).
  doctrine_version?: string | null
  // 2026-06-09: client-facing notification decoupled from reading state.
  // Null until the coach clicks Notify on the active plan view.
  published_to_client_at?: string | null
  published_to_client_by?: string | null
  nutrition_reading_published_at?: string | null
  // Standing coach steering for the nutrition generator. Read at every
  // Generate / Regenerate; carries forward across regen via inheritance.
  // Editable inline via the NutritionCoachGuidanceEditor on the draft and
  // active plan views.
  coach_guidance?: string | null
}

function parseText(text: string): { intro: string | null; points: string[] } {
  if (/\(\d+\)/.test(text)) {
    const firstIdx = text.search(/\(\d+\)/)
    const intro = firstIdx > 0 ? text.slice(0, firstIdx).trim() : null
    const rest = firstIdx > 0 ? text.slice(firstIdx) : text
    const points = rest.split(/\s*\(\d+\)\s*/).map((s: string) => s.trim()).filter(Boolean)
    return { intro, points }
  }
  const sentences = text.replace(/([.!?])\s+(?=[A-Z-])/g, '$1|||').split('|||').map((s: string) => s.trim()).filter((s: string) => s.length > 10)
  if (sentences.length >= 3) return { intro: null, points: sentences }
  return { intro: null, points: [text] }
}

function nutritionNavSections(plan: NutritionPlan) {
  return [
    { id: 'identity', title: 'Overview' },
    ...(plan.entry_state_summary ? [{ id: 'current-focus', title: 'Current Focus' }] : []),
    ...(plan.weekly_structure_notes ? [{ id: 'structure', title: 'Structure' }] : []),
    { id: 'daily-totals', title: 'Daily Totals' },
    { id: 'meals', title: 'Meals' },
    ...(plan.training_day_adjustments ? [{ id: 'adjustments', title: 'Adjustments' }] : []),
    ...(plan.execution_rules?.length ? [{ id: 'execution', title: 'Execution' }] : []),
    ...(plan.progression_notes ? [{ id: 'progression', title: 'Progression' }] : []),
    ...(plan.substitution_options ? [{ id: 'substitutions', title: 'Substitutions' }] : []),
  ]
}

const entryStateColour: Record<string, string> = {
  stabilisation: 'text-[#A96A12] bg-[#FDF6E9] border-[#F1DEB8]',
  training_support: 'text-[#1B6DFC] bg-[rgba(27,109,252,0.08)] border-[#B5CFFC]',
  high_output_support: 'text-violet-700 bg-violet-50 border-violet-200',
  recovery_reset: 'text-[#C82626] bg-[#FDEDED] border-[#F5C9C9]',
}

const carbColour: Record<string, string> = {
  low: 'text-[#1056D6] bg-[rgba(27,109,252,0.08)] border-[#B5CFFC]',
  moderate: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  high: 'text-green-400 bg-green-400/10 border-green-400/30',
}

const directionColour: Record<string, string> = {
  progress: 'text-green-400 bg-green-400/10 border-green-400/30',
  hold: 'text-[#A96A12] bg-[#FDF6E9] border-[#F1DEB8]',
  rebuild: 'text-[#C82626] bg-[#FDEDED] border-[#F5C9C9]',
}

const directionLabel: Record<string, string> = {
  progress: 'Making progress',
  hold: 'Staying steady',
  rebuild: 'Struggling',
}

function clean(s: string): string {
  return s.replace(/ - /g, ' ').replace(/-/g, ' ')
}

function NutritionPlanBody({
  plan,
  idPrefix = '',
  bridgeBodyweightKg = null,
  bridgeReadinessSignal = null,
}: {
  plan: NutritionPlan
  idPrefix?: string
  // Optional bridge-mode context computed at page level. Only set on the
  // active plan when transitional_override_active is true.
  bridgeBodyweightKg?: number | null
  bridgeReadinessSignal?: { ready: boolean; reason: string } | null
}) {
  // Kade, 1 Sep 2026: a diet adjustment changes only the named thing, and the
  // change must be easy to spot. `last_step` records exactly which foods moved.
  const lastStep = plan.last_step ?? null
  const lastStepChanges = lastStep?.changes ?? []
  return (
    <div className="space-y-4">

      {/* Identity card */}
      <div id={`${idPrefix}identity`} className="scroll-mt-8 bg-[#F4F6F9] br-card p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-[#141821]">{plan.plan_name}</h2>
            <p className="text-[12.5px] text-[#666D7A] mt-1">
              {plan.meal_frequency} meals/day · {plan.protein_anchor_g}g protein · {plan.pts_phase}
            </p>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${entryStateColour[plan.entry_state] || 'text-[#666D7A] bg-[#EFF1F4] border-[#E8EAEE]'}`}>
              {plan.entry_state.replace(/_/g, ' ')}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${carbColour[plan.carb_demand_level] || 'text-[#666D7A] bg-[#EFF1F4] border-[#E8EAEE]'}`}>
              {plan.carb_demand_level} carbs
            </span>
          </div>
        </div>
        {plan.estimated_calorie_band && (
          <p className="text-[12.5px] text-[#666D7A]">~{plan.estimated_calorie_band}</p>
        )}
        {plan.current_direction && (
          <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full border ${directionColour[plan.current_direction] || ''}`}>
            {directionLabel[plan.current_direction] ?? plan.current_direction}
          </span>
        )}
        <p className="text-[12.5px] text-[#98A0AD] mt-3">
          Generated {new Date(plan.generated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          {plan.doctrine_version && (
            <span className="text-[#98A0AD]"> · Doctrine v{plan.doctrine_version}</span>
          )}
        </p>
      </div>

      {/* Stale-doctrine hint. Only surfaces when the plan was stamped with a
          version (post Phase 4 commit 2) AND that version differs from the
          current constant. Soft hint, not blocking — the existing plan stays
          valid until the coach regenerates. Plans with null doctrine_version
          are grandfathered and show no hint. */}
      {plan.doctrine_version && isDoctrineStale(plan.doctrine_version, 'nutrition_plan') && (
        <div className="scroll-mt-8 bg-[#F4F6F9] br-card p-5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#666D7A] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-[#666D7A] mb-1">Doctrine update available</p>
              <p className="text-sm text-[#141821] leading-relaxed">
                This plan was generated under <span className="font-mono text-[#141821]">v{plan.doctrine_version}</span>. Current doctrine is <span className="font-mono text-[#141821]">v{DOCTRINE_VERSIONS.nutrition_plan}</span>. Regenerating will apply the latest validator rules (e.g. tightened appetite-suppression caps, bridge-mode behaviour, carb-demand mapping). Existing plan stays valid until you regenerate.
              </p>
              <Link
                href={`/dashboard/clients/${plan.client_id}/nutrition/suggest`}
                className="inline-block mt-2 text-[12.5px] font-semibold text-[#1560E0] hover:text-[#1056D6]"
              >
                Regenerate with current doctrine →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Bridge mode banner. The whole bridging arc at a glance:
            START (current bridge floor) → TARGET (bodyweight-derived) → WEEKS
          plus the check-in readiness signal that says whether the client is
          ready to step up. Coach makes the step-up decision right here without
          opening Today's Focus or scrolling check-ins. */}
      {plan.transitional_override_active && (() => {
        const startKcal = plan.transitional_override_floor_kcal ?? 0
        // Target = the kcal the standard (non-bridge) plan would land at for
        // this client at their PRESCRIBED carb demand level. Uses doctrine
        // TARGET multipliers, not the validator's safety FLOOR multipliers
        // (safety floor was wrong here — it's "below this is dangerous", not
        // "this is the prescription"). Per-demand g/kg:
        //   protein: 1.7 (anchor)
        //   carbs:   1.4 (low) / 2.7 (moderate) / 4.2 (high)  — midpoints of
        //            doctrine ranges from nutrition-prompt.ts
        //   fat:     1.0 (target — above the 0.7 safety floor)
        const carbMultiplier =
          plan.carb_demand_level === 'high' ? 4.2 :
          plan.carb_demand_level === 'moderate' ? 2.7 :
          1.4  // low or unspecified
        const targetKcal = bridgeBodyweightKg
          ? Math.round((
              (bridgeBodyweightKg * 1.7 * 4) +
              (bridgeBodyweightKg * carbMultiplier * 4) +
              (bridgeBodyweightKg * 1.0 * 9)
            ) / 50) * 50
          : null
        const expiry = plan.transitional_override_expires_at ? new Date(plan.transitional_override_expires_at) : null
        const daysToExpiry = expiry ? Math.ceil((expiry.getTime() - Date.now()) / 86400000) : null
        const weeksToTarget = daysToExpiry !== null ? Math.max(0, Math.ceil(daysToExpiry / 7)) : null
        const generatedDate = new Date(plan.generated_at)
        const daysIntoBridge = Math.floor((Date.now() - generatedDate.getTime()) / 86400000)
        const totalBridgeDays = expiry ? Math.ceil((expiry.getTime() - generatedDate.getTime()) / 86400000) : null
        const progressPct = totalBridgeDays && totalBridgeDays > 0
          ? Math.min(100, Math.max(0, Math.round((daysIntoBridge / totalBridgeDays) * 100)))
          : 0
        const gapKcal = targetKcal ? targetKcal - startKcal : null

        // Staged ramp math. Standard step size is 200 kcal per 2-week stage
        // (= 100 kcal/week, the reverse-dieting safe pace). Total stages =
        // ceil(gap / 200), total weeks-to-target = stages × 2. "Current stage"
        // is computed from how far we've come if we assume the client started
        // at some "true zero" — we use the plan's current floor as the
        // current-stage floor and count stages remaining to target.
        const STAGE_KCAL = 200
        const stagesRemaining = gapKcal && gapKcal > 0 ? Math.ceil(gapKcal / STAGE_KCAL) : 0
        const totalRampWeeks = stagesRemaining * 2
        const nextStageKcal = gapKcal && gapKcal > 0
          ? Math.min(startKcal + STAGE_KCAL, targetKcal ?? startKcal)
          : startKcal
        return (
          <div id={`${idPrefix}bridge-mode`} className="scroll-mt-8 bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)] border border-[#F1DEB8] rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-5 h-5 text-[#A96A12] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black text-[#A96A12] mb-1">Bridge Mode (Staged Ramp)</p>
                <p className="text-sm text-[#141821] leading-relaxed">
                  Currently feeding at <span className="font-semibold tabular-nums">{startKcal} kcal</span>{targetKcal && stagesRemaining > 0 && (
                    <>, ramping to <span className="font-semibold tabular-nums">~{targetKcal} kcal</span> over <span className="font-semibold">{stagesRemaining} more stage{stagesRemaining === 1 ? '' : 's'}</span> (~{totalRampWeeks} weeks at +{STAGE_KCAL} kcal per 2-week stage).</>
                  )}{targetKcal && stagesRemaining === 0 && (
                    <>. Already at the target floor — remove the override on next regenerate.</>
                  )}{!targetKcal && <>. Target unknown (baseline bodyweight missing).</>}
                </p>
                <p className="text-[12.5px] text-[#666D7A] mt-1 leading-relaxed">
                  Reverse-dieting pace: ~100 kcal/week. Each stage = 2 weeks at the current floor; step up if check-ins show eating consistency, hold if not.
                </p>
              </div>
            </div>

            {/* Start → target progress bar with stage markers */}
            {targetKcal && (
              <div className="pl-8 mb-4">
                <div className="flex items-baseline justify-between text-[12.5px] mb-1.5">
                  <span className="text-[#666D7A]"><span className="font-mono tabular-nums">{startKcal}</span> current stage</span>
                  <span className="text-[#98A0AD] text-[10px]">
                    {gapKcal && gapKcal > 0 ? <>next: <span className="font-mono">{nextStageKcal}</span> · target: <span className="font-mono">{targetKcal}</span></> : 'at target'}
                  </span>
                  <span className="text-[#666D7A]"><span className="font-mono tabular-nums">{targetKcal}</span> target</span>
                </div>
                <div className="h-2 bg-[#EFF1F4] rounded-full overflow-hidden">
                  <div className="h-full bg-[#B7791F] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-[11px] text-[#666D7A] mt-1">
                  Stage progress: {daysIntoBridge}/{totalBridgeDays} days through this 2-week stage{stagesRemaining > 0 && <> · {stagesRemaining} stage{stagesRemaining === 1 ? '' : 's'} remaining</>}
                </p>
              </div>
            )}

            {/* Check-in readiness signal */}
            {bridgeReadinessSignal && (
              <div className="pl-8 mb-4">
                <p className="text-[10px] font-medium text-[#A96A12] mb-1.5">Step-up readiness (from recent check-ins)</p>
                {bridgeReadinessSignal.ready ? (
                  <div className="bg-[#EDF8F1] border border-emerald-300 rounded-lg px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <span className="text-[#177245] mt-0.5">✓</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-emerald-800">Ready to step up</p>
                        <p className="text-[12.5px] text-[#177245] mt-1 leading-relaxed">{bridgeReadinessSignal.reason}</p>
                        <Link
                          href={`/dashboard/clients/${plan.client_id}/nutrition/suggest`}
                          className="inline-block mt-2 text-[12.5px] font-semibold text-emerald-800 hover:text-emerald-900 underline"
                        >
                          Regenerate with a higher bridge floor →
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#FBFCFD] border border-[#E8EAEE] rounded-lg px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <span className="text-[#666D7A] mt-0.5">·</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#141821]">Hold the current bridge</p>
                        <p className="text-[12.5px] text-[#666D7A] mt-1 leading-relaxed">{bridgeReadinessSignal.reason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {plan.transitional_override_justification && (
              <div className="pl-8 mb-4">
                <p className="text-[10px] font-medium text-[#A96A12] mb-1">Coach justification</p>
                <p className="text-[12.5px] text-[#141821] leading-relaxed italic">{plan.transitional_override_justification}</p>
              </div>
            )}

            {expiry && (
              <div className="pl-8 pt-3 border-t border-[#F1DEB8]">
                <p className="text-[12.5px] text-[#666D7A]">
                  <span className="font-semibold text-[#A96A12]">Bridge window expires:</span>{' '}
                  {expiry.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {daysToExpiry !== null && daysToExpiry >= 0 && <> (in {daysToExpiry} day{daysToExpiry === 1 ? '' : 's'})</>}
                  {daysToExpiry !== null && daysToExpiry < 0 && <> ({-daysToExpiry} day{daysToExpiry === -1 ? '' : 's'} overdue)</>}
                  {' — '}regenerate then to remove the override and apply the standard {targetKcal && <>~{targetKcal} kcal </>}prescription.
                </p>
              </div>
            )}
          </div>
        )
      })()}

      {/* Entry State Summary */}
      {plan.entry_state_summary && (
        <div id={`${idPrefix}current-focus`} className="scroll-mt-8">
          <GlanceCard
            headline={clean(plan.entry_state_summary.current_focus)}
            subline={clean(plan.entry_state_summary.what_this_means)}
            bulletGroups={[
              { label: 'Prioritise', tone: 'accent', items: (plan.entry_state_summary.prioritise ?? []).map(clean).filter(Boolean) },
              { label: 'Avoid', tone: 'muted', items: (plan.entry_state_summary.avoid ?? []).map(clean).filter(Boolean) },
            ]}
          />
        </div>
      )}

      {/* Weekly Structure Notes */}
      {plan.weekly_structure_notes && (() => {
        const { intro, points } = parseText(clean(plan.weekly_structure_notes))
        return (
          <div id={`${idPrefix}structure`} className="scroll-mt-8 bg-[#F4F6F9] br-card overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E8EAEE]">
              <span className="text-[11px] font-black text-[#1B6DFC]">01</span>
              <p className="text-[10px] font-medium text-[#666D7A]">Structure Logic</p>
            </div>
            <div className="px-5 py-4 space-y-2">
              {intro && <p className="text-sm text-[#141821] leading-relaxed">{intro}</p>}
              {points.length > 1 ? points.map((point, i) => (
                <div key={i} className="flex items-start gap-2.5 border-l-2 border-[#E8EAEE] pl-3">
                  <p className="text-sm text-[#141821] leading-relaxed">{point}</p>
                </div>
              )) : <p className="text-sm text-[#141821] leading-relaxed">{points[0]}</p>}
            </div>
          </div>
        )
      })()}

      {/* Daily totals + match readout */}
      {(() => {
        const totals = computeNutritionTotals(plan.meals)
        const band = parseCalorieBand(plan.estimated_calorie_band)
        const proteinAnchor = plan.protein_anchor_g
        const proteinDelta = proteinAnchor ? totals.protein_g - proteinAnchor : null
        const proteinOk = proteinDelta !== null && Math.abs(proteinDelta) <= 5
        const kcalInBand = band ? totals.kcal >= band.low * 0.95 && totals.kcal <= band.high * 1.05 : null
        const proteinKcal = totals.protein_g * 4
        const carbKcal = totals.carb_g * 4
        const fatKcal = totals.fat_g * 9
        const denom = proteinKcal + carbKcal + fatKcal || 1
        const proteinPct = Math.round((proteinKcal / denom) * 100)
        const carbPct = Math.round((carbKcal / denom) * 100)
        const fatPct = 100 - proteinPct - carbPct
        return (
          <div id={`${idPrefix}daily-totals`} className="scroll-mt-8 bg-[#F4F6F9] br-card overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E8EAEE]">
              <span className="text-[11px] font-black text-[#1B6DFC]">↑</span>
              <p className="text-[10px] font-medium text-[#666D7A]">Daily Totals (sum of meals)</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-[22px] font-semibold text-[#141821] tracking-[-0.025em] tabular-nums">{totals.kcal.toLocaleString()} <span className="text-sm font-normal text-[#666D7A]">kcal</span></p>
                  <p className="text-[12.5px] text-[#666D7A] mt-1 tabular-nums">
                    {totals.protein_g}g P · {totals.carb_g}g C · {totals.fat_g}g F
                  </p>
                </div>
                <div className="text-right text-[12.5px]">
                  {band ? (
                    <div className={kcalInBand ? 'text-[#1B6DFC]' : 'text-[#C82626]'}>
                      <p className="font-semibold">{kcalInBand ? 'Inside band' : 'Outside band'}</p>
                      <p className="text-[#666D7A] mt-0.5 tabular-nums">Target {band.low}–{band.high} kcal</p>
                    </div>
                  ) : (
                    <p className="text-[#666D7A]">No band stated</p>
                  )}
                </div>
              </div>
              <div className="pt-1">
                <div className="flex h-2 rounded-full overflow-hidden bg-[#EFF1F4]">
                  <div style={{ width: `${proteinPct}%` }} className="bg-[#1B6DFC]" />
                  <div style={{ width: `${carbPct}%` }} className="bg-[#B7791F]" />
                  <div style={{ width: `${fatPct}%` }} className="bg-violet-400" />
                </div>
                <div className="flex justify-between mt-2 text-[10px] tabular-nums">
                  <span className="text-[#1B6DFC]">P {proteinPct}%</span>
                  <span className="text-[#A96A12]">C {carbPct}%</span>
                  <span className="text-violet-300">F {fatPct}%</span>
                </div>
              </div>
              {proteinAnchor > 0 && (
                <div className="flex items-center justify-between text-[12.5px] pt-3 border-t border-[#E8EAEE]">
                  <p className="text-[#666D7A]">Protein anchor</p>
                  <p className={proteinOk ? 'text-[#1B6DFC]' : 'text-[#C82626]'}>
                    <span className="tabular-nums">{totals.protein_g}g</span> vs anchor <span className="tabular-nums">{proteinAnchor}g</span>
                    {proteinDelta !== null && (
                      <span className="text-[#666D7A] ml-1">({proteinDelta > 0 ? '+' : ''}{proteinDelta}g)</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Meals — coach-editable via inline MealEditor (2026-07-07). Each meal
          renders in view mode by default, with an Edit button that opens
          per-food + macro editing including a "Swap food" dropdown backed by
          the FOOD_DB reference table. */}
      <div id={`${idPrefix}meals`} className="scroll-mt-8">
        <p className="text-[12.5px] font-medium text-[#666D7A] mb-3 px-1">Meal Structure</p>
        {/* What the last adjustment did. Kade, 1 Sep 2026: adjustments change
            only the named thing, and the change must be easy to spot. */}
        {lastStep && (
          <div className="mb-3 rounded-lg border border-[#EFAFAF] bg-[#FDEDED] px-4 py-3">
            <p className="text-[12.5px] font-semibold text-[#8A1919]">{lastStep.summary}</p>
            <p className="text-[11px] text-[#8A1919] opacity-80 mt-0.5">
              Changed items are marked in red below. Everything else is unchanged.
            </p>
            {Array.isArray(lastStep.notes) && lastStep.notes.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {lastStep.notes.map((n: string, i: number) => (
                  <li key={i} className="text-[11px] text-[#8A1919] opacity-80">{n}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="space-y-3">
          {plan.meals.map((meal, mi) => (
            <MealEditor
              key={meal.meal_number}
              planId={plan.id}
              meal={meal as unknown as Parameters<typeof MealEditor>[0]['meal']}
              proteinAnchor={plan.protein_anchor_g}
              siblingMeals={plan.meals as unknown as Parameters<typeof MealEditor>[0]['siblingMeals']}
              mealIndex={mi}
              changedFoods={lastStepChanges}
            />
          ))}
        </div>
      </div>

      {/* Training Day Adjustments */}
      {plan.training_day_adjustments && (
        <div id={`${idPrefix}adjustments`} className="scroll-mt-8 bg-[#F4F6F9] br-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E8EAEE]">
            <span className="text-[11px] font-black text-[#1B6DFC]">02</span>
            <p className="text-[10px] font-medium text-[#666D7A]">Training Day Adjustments</p>
          </div>
          <div className="px-5 py-4 space-y-2">
            <div className="flex gap-4 text-sm">
              <span className="text-[#666D7A]">+{plan.training_day_adjustments.carb_increase_g}g carbs</span>
              {plan.training_day_adjustments.fat_reduction_g > 0 && (
                <span className="text-[#666D7A]">−{plan.training_day_adjustments.fat_reduction_g}g fat</span>
              )}
            </div>
            {plan.training_day_adjustments.timing_note && (
              <p className="text-sm text-[#141821]">{clean(plan.training_day_adjustments.timing_note)}</p>
            )}
            {plan.training_day_adjustments.meals_affected?.length > 0 && (
              <p className="text-[12.5px] text-[#666D7A]">Applies to: {plan.training_day_adjustments.meals_affected.join(', ')}</p>
            )}
          </div>
        </div>
      )}

      {/* Execution Rules */}
      {plan.execution_rules?.length > 0 && (
        <div id={`${idPrefix}execution`} className="scroll-mt-8 bg-[#F4F6F9] br-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E8EAEE]">
            <span className="text-[11px] font-black text-[#1B6DFC]">03</span>
            <p className="text-[10px] font-medium text-[#666D7A]">Execution Rules</p>
          </div>
          <div className="px-5 py-4 space-y-2">
            {plan.execution_rules.map((rule, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#1B6DFC] mt-0.5 shrink-0">•</span>
                <p className="text-sm text-[#141821]">{clean(rule)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What Not to Change */}
      {plan.what_not_to_change?.length > 0 && (
        <div className="bg-[#EFF1F4]/40 br-card px-5 py-4">
          <p className="text-[10px] font-medium text-[#666D7A] mb-2">What Not to Change</p>
          <div className="space-y-1.5">
            {plan.what_not_to_change.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#98A0AD] mt-0.5 shrink-0">-</span>
                <p className="text-[12.5px] text-[#666D7A]">{clean(item)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progression Notes */}
      {plan.progression_notes && (() => {
        const { intro, points } = parseText(clean(plan.progression_notes))
        return (
          <div id={`${idPrefix}progression`} className="scroll-mt-8 bg-[#F4F6F9] br-card overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E8EAEE]">
              <span className="text-[11px] font-black text-[#1B6DFC]">04</span>
              <p className="text-[10px] font-medium text-[#666D7A]">Progression Notes</p>
            </div>
            <div className="px-5 py-4 space-y-2">
              {intro && <p className="text-sm text-[#141821] leading-relaxed">{intro}</p>}
              {points.length > 1 ? points.map((point, i) => (
                <div key={i} className="flex items-start gap-2.5 border-l-2 border-[#E8EAEE] pl-3">
                  <p className="text-sm text-[#141821] leading-relaxed">{point}</p>
                </div>
              )) : <p className="text-sm text-[#141821] leading-relaxed">{points[0]}</p>}
            </div>
          </div>
        )
      })()}

      {/* Substitutions */}
      {plan.substitution_options && (
        <div id={`${idPrefix}substitutions`} className="scroll-mt-8 bg-[#F4F6F9] br-card p-5">
          <p className="text-[10px] font-medium text-[#666D7A] mb-3">Food Substitutions</p>
          <div className="grid grid-cols-3 gap-4">
            {(['protein', 'carbohydrate', 'fat'] as const).map(cat => (
              plan.substitution_options![cat]?.length > 0 && (
                <div key={cat}>
                  <p className="text-[10px] font-medium text-[#98A0AD] mb-2 capitalize">{cat}</p>
                  <div className="space-y-1">
                    {plan.substitution_options![cat].map((item, i) => (
                      <p key={i} className="text-[12.5px] text-[#666D7A]">• {clean(item)}</p>
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
    .select('id, name, onboarding_token, meal_logging_enabled')
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

  // Daily meal-adherence rollup for the last 7 days, so the coach sees at a
  // glance how the plan is landing day to day (complements the weekly review).
  let mealAdherence: { days: number; ate: number; swapped: number; skipped: number; total: number; pct: number } | null = null
  if (activePlan) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const { data: recentDays } = await admin
      .from('meal_adherence_days')
      .select('id')
      .eq('client_id', id)
      .eq('nutrition_plan_id', activePlan.id)
      .gte('log_date', weekAgo)
    const dayIds = (recentDays ?? []).map(d => d.id)
    let ate = 0, swapped = 0, skipped = 0
    if (dayIds.length > 0) {
      const { data: entryRows } = await admin
        .from('meal_adherence_entries')
        .select('outcome')
        .in('meal_adherence_day_id', dayIds)
        .not('outcome', 'is', null)
      ate = (entryRows ?? []).filter(e => e.outcome === 'ate').length
      swapped = (entryRows ?? []).filter(e => e.outcome === 'swapped').length
      skipped = (entryRows ?? []).filter(e => e.outcome === 'skipped').length
    }
    const total = ate + swapped + skipped
    mealAdherence = { days: dayIds.length, ate, swapped, skipped, total, pct: total ? Math.round((ate / total) * 100) : 0 }
  }

  // Bridge-mode context: compute target kcal from baseline bodyweight and pull
  // recent check-in responses for the readiness-to-step-up signal. Only
  // fetched when there's an active bridge plan, to avoid the wasted query
  // for the 90% of clients who aren't on a bridge.
  let bridgeBodyweightKg: number | null = null
  let bridgeReadinessSignal: { ready: boolean; reason: string } | null = null
  if (activePlan?.transitional_override_active) {
    const [{ data: baseline }, { data: bridgeCheckins }] = await Promise.all([
      admin
        .from('baselines')
        .select('bodyweight_kg')
        .eq('client_id', id)
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from('weekly_checkins')
        .select('week_number, submitted_at, responses')
        .eq('client_id', id)
        .order('submitted_at', { ascending: false })
        .limit(2),
    ])
    bridgeBodyweightKg = baseline?.bodyweight_kg ?? null
    bridgeReadinessSignal = detectBridgeReadiness(
      (bridgeCheckins ?? []).map(c => ({
        week_number: c.week_number,
        submitted_at: c.submitted_at,
        responses: c.responses as Record<string, unknown> ?? {},
      }))
    )
  }

  return (
    <div className="max-w-[980px]">
      <PageHeader
        eyebrow={<Link href={`/dashboard/clients/${id}`} className="hover:text-[#1B6DFC] transition-colors">{client.name}</Link>}
        title="Nutrition Plan"
        cta={<>
          {activePlan && (
            <Btn href={`/dashboard/clients/${id}/nutrition/log`} variant="primary" size="sm">
              Log today&apos;s meals
            </Btn>
          )}
          {activePlan && (
            <NotifyClientButton
              planId={activePlan.id}
              publishedToClientAt={activePlan.published_to_client_at ?? null}
              nutritionReadingPublishedAt={activePlan.nutrition_reading_published_at ?? null}
            />
          )}
          {activePlan && (
            <DeleteNutritionPlanButton planId={activePlan.id} label="Delete Active Plan" />
          )}
          {draftPlan && !activePlan && (
            <DeleteNutritionPlanButton
              planId={draftPlan.id}
              label="Delete Draft"
              confirmMessage="Delete this draft nutrition plan? This cannot be undone."
            />
          )}
          <Btn href={`/dashboard/clients/${id}/nutrition/suggest`} size="sm">
            {activePlan || draftPlan ? 'Regenerate' : 'Generate Plan'}
          </Btn>
        </>}
      />
      <ClientPageNav clientId={id} />

      {/* Daily meal adherence — last 7 days */}
      {activePlan && mealAdherence && mealAdherence.days > 0 && (
        <div
          className="mb-8 rounded-xl border border-[#E8EAEE] p-4"
          style={{
            background: 'linear-gradient(180deg,#FFFFFF,#FBFCFD)',
            boxShadow: '0 1px 3px rgba(16,24,40,0.09), 0 1px 2px -1px rgba(16,24,40,0.05), inset 0 1px 0 #FFFFFF',
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[12.5px] text-[#666D7A]">Meal adherence, last 7 days</p>
            <span className="text-[13px] font-semibold text-[#141821] tabular-nums">{mealAdherence.pct}% on plan</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-[#EFF1F4]">
            <div className="bg-[#1B6DFC]" style={{ width: `${mealAdherence.total ? (mealAdherence.ate / mealAdherence.total) * 100 : 0}%` }} />
            <div className="bg-[#C08A2D]" style={{ width: `${mealAdherence.total ? (mealAdherence.swapped / mealAdherence.total) * 100 : 0}%` }} />
            <div className="bg-[#D4D4D4]" style={{ width: `${mealAdherence.total ? (mealAdherence.skipped / mealAdherence.total) * 100 : 0}%` }} />
          </div>
          <div className="flex gap-4 mt-2.5 text-[12px] text-[#666D7A]">
            <span><span className="font-semibold text-[#1B6DFC] tabular-nums">{mealAdherence.ate}</span> ate</span>
            <span><span className="font-semibold text-[#A96A12] tabular-nums">{mealAdherence.swapped}</span> swapped</span>
            <span><span className="font-semibold text-[#666D7A] tabular-nums">{mealAdherence.skipped}</span> skipped</span>
            <span className="ml-auto text-[#98A0AD]">{mealAdherence.days} day{mealAdherence.days === 1 ? '' : 's'} logged</span>
          </div>
        </div>
      )}

      {/* Draft */}
      {draftPlan && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12.5px] font-medium px-2.5 py-1 rounded-full bg-[#FDF6E9] border border-[#A96A12] text-[#A96A12]">
              Draft - Pending Approval
            </span>
            <div className="flex items-center gap-2">
              <NutritionRegenerateButton nutritionPlanId={draftPlan.id} />
              <NutritionDraftActions planId={draftPlan.id} clientId={id} />
            </div>
          </div>
          <NutritionCoachGuidanceEditor
            nutritionPlanId={draftPlan.id}
            initial={draftPlan.coach_guidance ?? null}
          />
          <NutritionPlanBody plan={draftPlan} idPrefix="draft-" />
        </div>
      )}

      {/* Rebuild alert */}
      {activePlan?.current_direction === 'rebuild' && (
        <div className="mb-4 flex items-start gap-3 bg-[#FDEDED] border border-[#F5C9C9]/60 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-[#C82626] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#C82626]">Client is struggling with nutrition</p>
            <p className="text-[12.5px] text-[#C82626]/70 mt-0.5">Latest check-in direction is Rebuild. Consider adjusting the plan or generating a new one.</p>
          </div>
          <Link href="./nutrition/suggest" className="text-[12.5px] font-semibold text-[#C82626] hover:text-[#C82626] shrink-0 mt-0.5">Regenerate →</Link>
        </div>
      )}

      {/* Active plan */}
      {activePlan ? (
        <div>
          {draftPlan && (
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="flex-1 h-px bg-[#EFF1F4]" />
              <p className="text-[12.5px] text-[#98A0AD]">Current Active Plan</p>
              <div className="flex-1 h-px bg-[#EFF1F4]" />
            </div>
          )}

          {/* Nutrition Reading - client-facing interpretation card */}
          <NutritionReadingPanel
            plan={activePlan as unknown as Parameters<typeof NutritionReadingPanel>[0]['plan']}
            clientToken={client.onboarding_token}
          />

          {/* Standing coach guidance — read at every Regenerate. Mirrors the
              program-side editor so the coach can refine steering without
              going back to the prescription form. */}
          <NutritionCoachGuidanceEditor
            nutritionPlanId={activePlan.id}
            initial={activePlan.coach_guidance ?? null}
          />

          <div className="mb-3 flex items-center justify-end">
            <NutritionRegenerateButton nutritionPlanId={activePlan.id} />
          </div>

          <div className="flex gap-8">
            <StickyScrollNav sections={nutritionNavSections(activePlan)} />
            <div className="flex-1 min-w-0">
              <NutritionPlanBody
                plan={activePlan}
                bridgeBodyweightKg={bridgeBodyweightKg}
                bridgeReadinessSignal={bridgeReadinessSignal}
              />
            </div>
          </div>

          <MealLoggingToggle
            clientId={client.id}
            enabled={!!client.meal_logging_enabled}
            clientFirstName={client.name?.split(' ')[0] ?? 'They'}
          />

          {/* Weekly Review */}
          <div className="mt-6">
            <NutritionWeeklyReview planId={activePlan.id} currentDirection={activePlan.current_direction} lastReviewAt={activePlan.last_review_at} />
          </div>

          {/* Archived */}
          {archivedPlans.length > 0 && (
            <div className="mt-6">
              <p className="text-[#666D7A] text-sm mb-3">Previous Plans ({archivedPlans.length})</p>
              <div className="space-y-2">
                {archivedPlans.map(p => (
                  <div key={p.id} className="bg-[#F4F6F9]/50 border border-[#E8EAEE] rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-[#666D7A] opacity-70">{p.plan_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[12.5px] text-[#98A0AD]">
                        {new Date(p.generated_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}<span className="capitalize">{p.entry_state.replace(/_/g, ' ')}</span>
                      </span>
                      <DeleteNutritionPlanButton
                        planId={p.id}
                        label="Delete"
                        confirmMessage="Delete this archived nutrition plan? This cannot be undone."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : !draftPlan ? (
        <div className="text-center py-16 border-2 border-dashed border-[#E8EAEE] rounded-xl">
          <p className="text-[#666D7A] mb-4">No nutrition plan generated yet.</p>
          <Link
            href={`/dashboard/clients/${id}/nutrition/suggest`}
            className="text-[12.5px] font-medium px-3 py-1.5 border border-[#E8EAEE] text-[#666D7A] rounded-lg hover:border-[#CFD4DC] hover:text-[#141821] transition-colors"
          >
            Generate Plan
          </Link>
        </div>
      ) : null}
    </div>
  )
}
