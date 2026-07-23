/**
 * Shared daily meal-adherence write logic, keyed on clientId.
 *
 * Both the CLIENT portal routes (src/app/api/portal/meal-log/*, token+email
 * auth) and the COACH routes (src/app/api/coach/meal-log/*, session-cookie
 * auth) call these — one source of truth. Auth stays in the routes.
 *
 * A "day" is get-or-created for the client's active plan + today's Brisbane
 * date, snapshotting the plan's `meals` so later plan edits never rewrite
 * history (mirrors session_completions.prescription_snapshot). Entries are
 * keyed on (day, meal_number) since plan meals have no uuid.
 *
 * Every function returns { status, body } so a route can do:
 *   const r = await upsertMealOutcome(admin, {...})
 *   return NextResponse.json(r.body, { status: r.status })
 */

import type { createAdminClient } from '@/lib/supabase/admin'

type Admin = ReturnType<typeof createAdminClient>

export interface WriteResult {
  status: number
  body: Record<string, unknown>
}

export const MEAL_OUTCOMES = ['ate', 'swapped', 'skipped'] as const
export type MealOutcome = (typeof MEAL_OUTCOMES)[number]

/** Today's date in Brisbane as YYYY-MM-DD (the operational timezone). */
export function brisbaneToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' })
}

type DayResolve = { dayId: string } | { error: WriteResult }

/** Get-or-create today's meal-adherence day for the client's active plan. */
async function ensureTodayDay(admin: Admin, clientId: string): Promise<DayResolve> {
  const { data: plan } = await admin
    .from('nutrition_plans')
    .select('id, meals')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .maybeSingle()

  if (!plan) return { error: { status: 404, body: { error: 'No active nutrition plan' } } }

  const logDate = brisbaneToday()

  const { data: existing } = await admin
    .from('meal_adherence_days')
    .select('id')
    .eq('client_id', clientId)
    .eq('nutrition_plan_id', plan.id)
    .eq('log_date', logDate)
    .maybeSingle()

  if (existing) return { dayId: existing.id }

  const { data: created, error } = await admin
    .from('meal_adherence_days')
    .insert({
      client_id: clientId,
      nutrition_plan_id: plan.id,
      log_date: logDate,
      prescription_snapshot: plan.meals ?? [],
    })
    .select('id')
    .single()

  if (error || !created) {
    console.error('[meal-log] day insert failed:', error)
    return { error: { status: 500, body: { error: 'Failed to start meal log' } } }
  }
  return { dayId: created.id }
}

/** Record (or change) one meal's outcome for today. Idempotent per meal_number. */
export async function upsertMealOutcome(
  admin: Admin,
  input: {
    clientId: string
    mealNumber: number
    mealName?: string | null
    sortOrder?: number
    outcome: string
    note?: string | null
  },
): Promise<WriteResult> {
  if (!MEAL_OUTCOMES.includes(input.outcome as MealOutcome)) {
    return { status: 400, body: { error: 'Invalid outcome' } }
  }

  const d = await ensureTodayDay(admin, input.clientId)
  if ('error' in d) return d.error

  const { error } = await admin
    .from('meal_adherence_entries')
    .upsert(
      {
        meal_adherence_day_id: d.dayId,
        meal_number: input.mealNumber,
        meal_name: input.mealName ?? null,
        sort_order: input.sortOrder ?? 0,
        outcome: input.outcome,
        note: input.note ?? null,
      },
      { onConflict: 'meal_adherence_day_id,meal_number' },
    )

  if (error) {
    console.error('[meal-log] entry upsert failed:', error)
    return { status: 500, body: { error: 'Failed to log meal' } }
  }
  return { status: 200, body: { ok: true, dayId: d.dayId } }
}

/** Update today's day-level fields (hunger/satisfaction signal, note, status). */
export async function updateDay(
  admin: Admin,
  input: {
    clientId: string
    hungerSignal?: string | null
    satisfactionSignal?: string | null
    overallNote?: string | null
    status?: 'in_progress' | 'logged'
  },
): Promise<WriteResult> {
  const d = await ensureTodayDay(admin, input.clientId)
  if ('error' in d) return d.error

  const patch: Record<string, unknown> = {}
  if (input.hungerSignal !== undefined) patch.hunger_signal = input.hungerSignal
  if (input.satisfactionSignal !== undefined) patch.satisfaction_signal = input.satisfactionSignal
  if (input.overallNote !== undefined) patch.overall_note = input.overallNote
  if (input.status !== undefined) patch.status = input.status

  if (Object.keys(patch).length > 0) {
    const { error } = await admin.from('meal_adherence_days').update(patch).eq('id', d.dayId)
    if (error) {
      console.error('[meal-log] day update failed:', error)
      return { status: 500, body: { error: 'Failed to save' } }
    }
  }
  return { status: 200, body: { ok: true, dayId: d.dayId } }
}
