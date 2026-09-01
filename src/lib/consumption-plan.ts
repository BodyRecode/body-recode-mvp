/**
 * Placing supplements against the meals they are taken with.
 *
 * Part of the Unified Consumption Plan (spec: 2026-09-01). Supplements used to
 * be generated with no knowledge of the meal schedule, so "take with breakfast"
 * could point at a breakfast that did not exist in the plan. Because both are
 * now decided in one pass, a supplement's meal reference can be CHECKED against
 * the meals in the same plan.
 *
 * This module does the checking. It never invents a placement and never drops a
 * supplement silently: anything it cannot place becomes standalone and is
 * reported, because a supplement quietly vanishing from a plan is the failure
 * that would be hardest to notice.
 */

import { findLeakedTerms } from '@/lib/banned-client-terms'

export interface PlanMeal {
  meal_number?: number | null
  meal_name?: string | null
  timing?: string | null
}

export interface PlanSupplement {
  substance_slug: string
  name: string
  tier?: string | null
  /** Resolved from the supplement library at render time, never from the model. */
  dose?: string | null
  /** References PlanMeal.meal_number in the SAME plan. Null = standalone. */
  timing_meal_number?: number | null
  timing_note?: string | null
  rationale_coach_facing?: string | null
  /** Shown to the client, so it must survive the client-facing term audit. */
  rationale_client_facing?: string | null
  watch?: string[] | null
  carried_forward?: boolean
  /** Only coach-assigned supplements are rendered to the client. */
  assigned?: boolean
}

export interface CompositionIssue {
  substance_slug: string
  /** 'orphan_meal' | 'missing_client_rationale' | 'leaked_term' | 'missing_dose' */
  kind: 'orphan_meal' | 'missing_client_rationale' | 'leaked_term' | 'missing_dose'
  detail: string
}

export interface CompositionResult {
  supplements: PlanSupplement[]
  issues: CompositionIssue[]
  /** True when nothing blocks publishing this plan to the client. */
  publishable: boolean
}

/**
 * Attach supplements to meals, verify every reference, and report anything wrong.
 *
 * Issues are returned, not thrown. The coach sees them and decides. Only
 * `leaked_term` and `missing_client_rationale` block publishing, because those
 * are the two that would put bad text in front of a client.
 */
export function composeSupplementsOntoMeals(
  meals: PlanMeal[],
  supplements: PlanSupplement[],
): CompositionResult {
  const mealNumbers = new Set(
    (meals ?? [])
      .map(m => (typeof m.meal_number === 'number' ? m.meal_number : null))
      .filter((n): n is number => n !== null),
  )

  const issues: CompositionIssue[] = []
  const placed: PlanSupplement[] = []

  for (const s of supplements ?? []) {
    const out: PlanSupplement = { ...s }

    // A meal reference that does not exist in THIS plan. Becomes standalone
    // rather than disappearing, and is always reported.
    if (out.timing_meal_number != null && !mealNumbers.has(out.timing_meal_number)) {
      issues.push({
        substance_slug: s.substance_slug,
        kind: 'orphan_meal',
        detail: `references meal ${out.timing_meal_number}, which this plan does not contain (meals present: ${[...mealNumbers].sort((a, b) => a - b).join(', ') || 'none'}). Moved to standalone.`,
      })
      out.timing_meal_number = null
    }

    if (!out.dose || !String(out.dose).trim()) {
      issues.push({
        substance_slug: s.substance_slug,
        kind: 'missing_dose',
        detail: 'no dose resolved from the library.',
      })
    }

    // Client-facing checks apply only to what the client will actually see.
    if (out.assigned) {
      const clientText = (out.rationale_client_facing ?? '').trim()
      if (!clientText) {
        issues.push({
          substance_slug: s.substance_slug,
          kind: 'missing_client_rationale',
          detail: 'assigned, but has no client-facing explanation. Kade decided the client sees why, not just what.',
        })
      } else {
        const leaked = findLeakedTerms(clientText)
        if (leaked.length > 0) {
          issues.push({
            substance_slug: s.substance_slug,
            kind: 'leaked_term',
            detail: `client-facing text contains ${leaked.join(', ')}.`,
          })
        }
      }
    }

    placed.push(out)
  }

  const blocking = issues.filter(i => i.kind === 'leaked_term' || i.kind === 'missing_client_rationale')
  return { supplements: placed, issues, publishable: blocking.length === 0 }
}

/** What the CLIENT sees: assigned only, in meal order, standalone last. */
export function clientVisibleSupplements(supplements: PlanSupplement[] | null | undefined): PlanSupplement[] {
  return (supplements ?? [])
    .filter(s => s.assigned)
    .sort((a, b) => {
      const an = a.timing_meal_number ?? Number.MAX_SAFE_INTEGER
      const bn = b.timing_meal_number ?? Number.MAX_SAFE_INTEGER
      return an - bn
    })
}
