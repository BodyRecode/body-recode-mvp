/**
 * Builds the seven-day engagement strip for a set of clients in one pass.
 *
 * Batched deliberately: the coaching list renders every active client, and a
 * per-client round trip would be a dozen queries to draw one row of squares.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { WeekDayState } from '@/components/dashboard/week-strip'

const INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** yyyy-mm-dd in Brisbane, which is what log_date stores. */
function brisbaneDate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Brisbane',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export function lastSevenDays(): { date: string; initial: string; weekday: number }[] {
  const out: { date: string; initial: string; weekday: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = brisbaneDate(d)
    // Weekday from the ISO parts, so it matches the Brisbane date rather than
    // the server's local one.
    const [y, m, day] = iso.split('-').map(Number)
    const weekday = new Date(Date.UTC(y, m - 1, day)).getUTCDay()
    out.push({ date: iso, initial: INITIALS[weekday], weekday })
  }
  return out
}

export type WeekStripMap = Record<string, WeekDayState[]>

export async function buildWeekStrips(clientIds: string[]): Promise<WeekStripMap> {
  const days = lastSevenDays()
  const today = days[days.length - 1].date
  const from = days[0].date
  if (clientIds.length === 0) return {}

  const admin = createAdminClient()

  const [{ data: planRows }, { data: dayRows }, { data: sessionRows }] = await Promise.all([
    admin
      .from('nutrition_plans')
      .select('id, client_id, created_at')
      .in('client_id', clientIds)
      .eq('is_active', true),
    admin
      .from('meal_adherence_days')
      .select('id, client_id, log_date')
      .in('client_id', clientIds)
      .gte('log_date', from),
    admin
      .from('session_completions')
      .select('client_id, completed_at')
      .in('client_id', clientIds)
      .eq('status', 'completed')
      .not('completed_at', 'is', null),
  ])

  // Meal outcomes hang off the day rows, so one more query covers every client.
  const dayIds = (dayRows ?? []).map(d => d.id)
  const outcomesByDay = new Map<string, { logged: number; total: number }>()
  if (dayIds.length > 0) {
    const { data: entries } = await admin
      .from('meal_adherence_entries')
      .select('meal_adherence_day_id, outcome')
      .in('meal_adherence_day_id', dayIds)
    for (const e of entries ?? []) {
      const cur = outcomesByDay.get(e.meal_adherence_day_id) ?? { logged: 0, total: 0 }
      cur.total += 1
      if (e.outcome) cur.logged += 1
      outcomesByDay.set(e.meal_adherence_day_id, cur)
    }
  }

  const planStart = new Map<string, string>()
  for (const p of planRows ?? []) {
    if (p.created_at) planStart.set(p.client_id, brisbaneDate(new Date(p.created_at)))
  }

  const dayByClientDate = new Map<string, string>()
  for (const d of dayRows ?? []) dayByClientDate.set(`${d.client_id}|${d.log_date}`, d.id)

  const workoutDates = new Set<string>()
  for (const s of sessionRows ?? []) {
    if (!s.completed_at) continue
    workoutDates.add(`${s.client_id}|${brisbaneDate(new Date(s.completed_at))}`)
  }

  const out: WeekStripMap = {}
  for (const clientId of clientIds) {
    const start = planStart.get(clientId)
    out[clientId] = days.map(d => {
      const key = `${clientId}|${d.date}`
      const workout = workoutDates.has(key)
      // No active plan, or the plan did not exist yet: nothing was asked of
      // this day, so it must not read as a missed one.
      if (!start || d.date < start) {
        return {
          date: d.date,
          initial: d.initial,
          meals: 'not-asked' as const,
          workout,
          isToday: d.date === today,
          label: `${d.date} · no nutrition plan yet${workout ? ' · session logged' : ''}`,
        }
      }
      const dayId = dayByClientDate.get(key)
      const counts = dayId ? outcomesByDay.get(dayId) : undefined
      const meals: WeekDayState['meals'] =
        !counts || counts.logged === 0
          ? 'none'
          : counts.logged >= counts.total
            ? 'full'
            : 'partial'
      const mealText =
        meals === 'none'
          ? 'no meals logged'
          : `${counts!.logged} of ${counts!.total} meals logged`
      return {
        date: d.date,
        initial: d.initial,
        meals,
        workout,
        isToday: d.date === today,
        label: `${d.date} · ${mealText}${workout ? ' · session logged' : ''}`,
      }
    })
  }
  return out
}
