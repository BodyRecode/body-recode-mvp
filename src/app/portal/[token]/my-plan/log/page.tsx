import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import PortalPageShell from '../../portal-page-shell'
import MealLogClient, { type LogMeal } from './meal-log-client'
import { brisbaneToday } from '@/lib/meal-log-write'
import { requirePortalClient } from '@/lib/portal-guard'

interface PlanMeal {
  meal_number?: number
  meal_name?: string
  timing?: string | null
  notes?: string | null
}

export default async function PortalMealLogPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const client = await requirePortalClient(token, 'meal_logging_enabled')
  if (!client) return notFound()

  const { data: plan } = await admin
    .from('nutrition_plans')
    .select('id, plan_name, meals')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .maybeSingle()

  const firstName = client.name?.split(' ')[0] ?? 'there'

  // The page itself refuses when the flag is off, so a bookmarked URL does not
  // reach the logger even though the link is hidden.
  if (!client.meal_logging_enabled) {
    return (
      <PortalPageShell backHref={`/portal/${token}/my-plan`} eyebrow="Nutrition" title="Log today's meals">
        <div className="rounded-2xl border border-[#E8EAEE] bg-white p-6 text-center">
          <p className="text-sm text-[#666D7A]">
            Meal logging is not switched on for you. Your weekly check-in covers your nutrition, so there is nothing to do here.
          </p>
        </div>
      </PortalPageShell>
    )
  }

  if (!plan) {
    return (
      <PortalPageShell backHref={`/portal/${token}/my-plan`} eyebrow="Nutrition" title="Log today's meals">
        <div className="rounded-2xl border border-[#E8EAEE] bg-white p-6 text-center">
          <p className="text-sm text-[#666D7A]">No active nutrition plan yet. Once your coach sets it up, you&apos;ll log your meals here.</p>
        </div>
      </PortalPageShell>
    )
  }

  const meals: LogMeal[] = (Array.isArray(plan.meals) ? (plan.meals as PlanMeal[]) : [])
    .map((m, i) => ({
      meal_number: typeof m.meal_number === 'number' ? m.meal_number : i + 1,
      meal_name: m.meal_name ?? `Meal ${i + 1}`,
      timing: m.timing ?? null,
      notes: m.notes ?? null,
    }))

  const logDate = brisbaneToday()
  const { data: day } = await admin
    .from('meal_adherence_days')
    .select('id, hunger_signal, satisfaction_signal, overall_note')
    .eq('client_id', client.id)
    .eq('nutrition_plan_id', plan.id)
    .eq('log_date', logDate)
    .maybeSingle()

  const initialEntries: Record<number, { outcome: string | null; note: string | null }> = {}
  if (day) {
    const { data: entryRows } = await admin
      .from('meal_adherence_entries')
      .select('meal_number, outcome, note')
      .eq('meal_adherence_day_id', day.id)
    for (const e of entryRows ?? []) initialEntries[e.meal_number] = { outcome: e.outcome, note: e.note }
  }

  return (
    <PortalPageShell
      backHref={`/portal/${token}/my-plan`}
      eyebrow="Nutrition"
      title="Log today's meals"
      description={<>How did today go against your plan, {firstName}?</>}
    >
      <MealLogClient
        token={token}
        clientId={client.id}
        meals={meals}
        initialEntries={initialEntries}
        initialDay={day ? { hungerSignal: day.hunger_signal, satisfactionSignal: day.satisfaction_signal, overallNote: day.overall_note } : null}
        apiBase="/api/portal/meal-log"
        backHref={`/portal/${token}/my-plan`}
        firstName={firstName}
      />
    </PortalPageShell>
  )
}
