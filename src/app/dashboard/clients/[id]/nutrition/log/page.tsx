/**
 * Coach-side daily meal log — the coach logs a client's meals against their
 * plan (e.g. reviewing the day together in person). Mirrors the portal meal
 * log, resolving the client by id and posting to the coach meal-log routes.
 * Same tables → it shows in the client's portal too.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MealLogClient, { type LogMeal } from '@/app/portal/[token]/my-plan/log/meal-log-client'
import { brisbaneToday } from '@/lib/meal-log-write'

interface PlanMeal {
  meal_number?: number
  meal_name?: string
  timing?: string | null
  notes?: string | null
}

export default async function CoachMealLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin.from('clients').select('id, name').eq('id', id).maybeSingle()
  if (!client) return notFound()

  const { data: plan } = await admin
    .from('nutrition_plans')
    .select('id, plan_name, meals')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .maybeSingle()

  const firstName = client.name?.split(' ')[0] ?? 'this client'

  if (!plan) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href={`/dashboard/clients/${id}/nutrition`} className="text-xs font-semibold text-[#1B6DFC] hover:text-[#5390FF]">← Back to nutrition</Link>
        <div className="mt-6 rounded-2xl border border-[#E5E5E5] bg-white p-6 text-center">
          <p className="text-sm text-[#6B6B6B]">No active nutrition plan for {firstName} yet. Publish a plan first.</p>
        </div>
      </div>
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

  const backHref = `/dashboard/clients/${id}/nutrition`

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={backHref} className="text-xs font-semibold text-[#1B6DFC] hover:text-[#5390FF]">← Back to nutrition</Link>
      <div className="mt-4 mb-5">
        <p className="text-[10px] font-bold tracking-widest text-[#999999] uppercase mb-1">Log meals · {client.name}</p>
        <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">{plan.plan_name}</h1>
      </div>
      <MealLogClient
        token=""
        clientId={client.id}
        meals={meals}
        initialEntries={initialEntries}
        initialDay={day ? { hungerSignal: day.hunger_signal, satisfactionSignal: day.satisfaction_signal, overallNote: day.overall_note } : null}
        apiBase="/api/coach/meal-log"
        backHref={backHref}
      />
    </div>
  )
}
