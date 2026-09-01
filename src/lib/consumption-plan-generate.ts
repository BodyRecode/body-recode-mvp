/**
 * One act that produces a client's food AND her supplements.
 *
 * Unified Consumption Plan, step 3 (spec: 2026-09-01). Previously the coach
 * generated a nutrition plan on one screen and a supplement stack on another,
 * reviewed them separately, published them separately, and the client had to
 * find them in two places.
 *
 * ── What this does NOT do ──
 *
 * It does not merge the two engines. The supplement engine keeps its own
 * structure: a deterministic gate removes structurally-knowable exclusions, the
 * model chooses only from what survives, a deterministic validator drops
 * anything outside that set, and doses come from the library rather than the
 * model. Those properties are the reason the engine is trustworthy, and this
 * file calls it unchanged rather than absorbing it.
 *
 * ── The food must never depend on the supplements ──
 *
 * Kade's decision, 1 Sep 2026: if the supplement side fails, the plan still
 * generates, with no supplement section and the error surfaced to the coach.
 * A client's food does not wait on the supplement engine being healthy. That is
 * why the supplement work is wrapped and its failure is reported rather than
 * thrown.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { composeSupplementsOntoMeals, type PlanSupplement, type CompositionIssue } from '@/lib/consumption-plan'

export interface ConsumptionPlanResult {
  planId: string
  /** Supplements written onto the plan. Empty when the supplement side failed. */
  supplements: PlanSupplement[]
  issues: CompositionIssue[]
  /** Set when the supplement side failed. The plan still exists. */
  supplementError: string | null
  publishable: boolean
}

/**
 * Attach supplements to a nutrition plan that has already been generated.
 *
 * Split out from the generation call so the plan is saved and safe before any
 * supplement work begins. If everything below this line fails, the client still
 * has her food.
 */
export async function attachSupplementsToPlan(
  admin: SupabaseClient,
  clientId: string,
  planId: string,
): Promise<ConsumptionPlanResult> {
  const base: ConsumptionPlanResult = {
    planId, supplements: [], issues: [], supplementError: null, publishable: true,
  }

  const { data: plan, error: planErr } = await admin
    .from('nutrition_plans')
    .select('id, meals')
    .eq('id', planId)
    .maybeSingle()

  if (planErr || !plan) {
    return { ...base, supplementError: `could not read the plan back: ${planErr?.message ?? 'not found'}` }
  }

  let proposed: PlanSupplement[] = []
  try {
    const { generateSupplementSuggestions } = await import('@/lib/supplement-suggestions')
    const result = await generateSupplementSuggestions(admin, clientId)
    if (!result.ok) {
      return { ...base, supplementError: result.error }
    }

    // Everything the coach has already accepted carries forward. Nothing here
    // assigns anything new: a fresh suggestion arrives unassigned and stays
    // invisible to the client until the coach accepts it.
    const { data: assignments } = await admin
      .from('supplement_assignments')
      .select('substance_slug')
      .eq('client_id', clientId)
      .eq('status', 'active')
    const assignedSlugs = new Set((assignments ?? []).map(a => a.substance_slug))

    proposed = (result.suggestions ?? []).map(s => ({
      substance_slug: s.slug,
      name: s.name,
      tier: s.recommendedTier ?? null,
      dose: null, // resolved from the library at render time, never from the model
      timing_meal_number: null,
      timing_note: null,
      rationale_coach_facing: s.rationale ?? null,
      rationale_client_facing: null,
      watch: s.watch ? [s.watch] : null,
      carried_forward: assignedSlugs.has(s.slug),
      assigned: assignedSlugs.has(s.slug),
    }))
  } catch (e) {
    return { ...base, supplementError: e instanceof Error ? e.message : String(e) }
  }

  const composed = composeSupplementsOntoMeals((plan.meals as never[]) ?? [], proposed)

  const { error: saveErr } = await admin
    .from('nutrition_plans')
    .update({ supplements: composed.supplements })
    .eq('id', planId)

  if (saveErr) {
    return { ...base, issues: composed.issues, supplementError: `could not save supplements: ${saveErr.message}` }
  }

  return {
    planId,
    supplements: composed.supplements,
    issues: composed.issues,
    supplementError: null,
    publishable: composed.publishable,
  }
}
