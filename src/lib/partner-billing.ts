/**
 * Partner billing helpers.
 *
 * Founding Partner Agreement §1 definition of Active Client:
 *   "a coaching client on Partner's Instance who, within any calendar month,
 *    has (i) an active subscription, program, or engagement with Partner, or
 *    (ii) submitted a Weekly Check-In, intake, or other tenant-scoped record."
 *
 * We approximate this by counting distinct client rows on the tenant that
 * either (a) have a training_plan or nutrition_plan updated in the month, or
 * (b) submitted a weekly_checkin in the month.
 *
 * Kade uses the computed numbers to invoice partners manually via Stripe
 * dashboard. Auto-invoicing via Stripe API is a v2 follow-up.
 */

import { createAdminClient } from '@/lib/supabase/admin'

/** First day of a month (UTC) as a YYYY-MM-DD string. */
export function monthStartIso(date: Date = new Date()): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

/**
 * Count Active Clients on the given tenant for the month starting on monthStart.
 * Reads tenant_config.coach_id, then joins client-scoped tables filtered by
 * updated_at (plans) or submitted_at (weekly_checkins) within the month.
 */
export async function computeActiveClientCount(tenantId: string, monthStart: string): Promise<number> {
  const admin = createAdminClient()

  // Resolve coach_id from tenant_config
  const { data: tenant } = await admin
    .from('tenant_config')
    .select('coach_id')
    .eq('licence->>tenantId', tenantId)
    .maybeSingle()

  if (!tenant?.coach_id) return 0
  const coachId = tenant.coach_id as string

  const monthEndDate = new Date(monthStart)
  monthEndDate.setUTCMonth(monthEndDate.getUTCMonth() + 1)
  const monthEnd = monthEndDate.toISOString().slice(0, 10)

  const activeIds = new Set<string>()

  // (a) Clients with a training or nutrition plan updated in the month
  const { data: planRows } = await admin
    .from('training_plans')
    .select('client_id')
    .eq('coach_id', coachId)
    .gte('updated_at', `${monthStart}T00:00:00Z`)
    .lt('updated_at', `${monthEnd}T00:00:00Z`)
  for (const row of planRows ?? []) if (row.client_id) activeIds.add(row.client_id as string)

  const { data: nutritionRows } = await admin
    .from('nutrition_plans')
    .select('client_id')
    .eq('coach_id', coachId)
    .gte('updated_at', `${monthStart}T00:00:00Z`)
    .lt('updated_at', `${monthEnd}T00:00:00Z`)
  for (const row of nutritionRows ?? []) if (row.client_id) activeIds.add(row.client_id as string)

  // (b) Clients who submitted a weekly check-in in the month
  const { data: checkinRows } = await admin
    .from('weekly_checkins')
    .select('client_id')
    .eq('coach_id', coachId)
    .gte('submitted_at', `${monthStart}T00:00:00Z`)
    .lt('submitted_at', `${monthEnd}T00:00:00Z`)
  for (const row of checkinRows ?? []) if (row.client_id) activeIds.add(row.client_id as string)

  return activeIds.size
}

/**
 * Write (or update) the row for (tenant_id, month_start) in
 * partner_active_client_counts with the computed count.
 */
export async function upsertActiveClientCount(tenantId: string, monthStart: string, activeCount: number): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('partner_active_client_counts')
    .upsert(
      { tenant_id: tenantId, month_start: monthStart, active_count: activeCount, computed_at: new Date().toISOString() },
      { onConflict: 'tenant_id,month_start' },
    )
}

/**
 * Fetch the count row(s) for a tenant across recent months. Used by the
 * admin dashboard to show billing history.
 */
export async function recentCounts(tenantId: string, months: number = 6): Promise<Array<{ month_start: string; active_count: number; billed_at: string | null; billed_amount_cents: number | null }>> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('partner_active_client_counts')
    .select('month_start, active_count, billed_at, billed_amount_cents')
    .eq('tenant_id', tenantId)
    .order('month_start', { ascending: false })
    .limit(months)
  return (data ?? []) as Array<{ month_start: string; active_count: number; billed_at: string | null; billed_amount_cents: number | null }>
}
