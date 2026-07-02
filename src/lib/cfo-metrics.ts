/**
 * CFO metrics — server-side computations from live Supabase data.
 *
 * Every function returns a Promise<number | null | ...> so a missing table or
 * empty result doesn't crash rendering; null bubbles up and the UI shows a
 * dash. Coach-facing dashboards MUST NOT break on data absence.
 *
 * Timezone: computations use UTC internally; the "trailing 30d" window is
 * naive (now - 30 * 24h). Good enough for weekly-cadence CFO reviews.
 */

import { createAdminClient } from './supabase/admin'

type PaymentRow = {
  amount: number | string
  created_at: string
  status?: string | null
  refunded_amount?: number | string | null
}

type SubscriptionRow = {
  amount: number | string
  billing_interval: 'week' | 'month' | 'year' | string
  canceled_at: string | null
  cancel_at_period_end: boolean | null
  status: string
}

export type CfoSnapshot = {
  mrr: number | null
  activeSubscriptions: number | null
  weeklyRecurring: number | null
  monthlyRecurring: number | null
  revenue30d: number | null
  revenueLifetime: number | null
  paymentCount30d: number | null
  activeClients: number | null
  refundRate30d: number | null
  refundedAmount30d: number | null
  averageRevenuePerClient: number | null
  churnedThisMonth: number | null
  computedAt: string
}

const WEEKS_PER_MONTH = 4.345  // 52 / 12
const MONTHS_PER_YEAR = 12

function normalizeToMonthly(amount: number, interval: string): number {
  switch (interval) {
    case 'week':
      return amount * WEEKS_PER_MONTH
    case 'month':
      return amount
    case 'year':
      return amount / MONTHS_PER_YEAR
    default:
      return amount
  }
}

export async function getCfoSnapshot(): Promise<CfoSnapshot> {
  const admin = createAdminClient()
  const now = new Date()
  const cutoff30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

  // Fetch in parallel — each nullable to keep partial failures graceful
  const [subs, payments30d, allPayments, clients, churnedThisMonth] = await Promise.all([
    admin
      .from('client_subscriptions')
      .select('amount, billing_interval, canceled_at, cancel_at_period_end, status')
      .is('canceled_at', null)
      .then((r) => (r.error ? null : (r.data as SubscriptionRow[]))),
    admin
      .from('be_payments')
      .select('amount, created_at, status, refunded_amount')
      .gte('created_at', cutoff30d)
      .then((r) => (r.error ? null : (r.data as PaymentRow[]))),
    admin
      .from('be_payments')
      .select('amount, created_at, status')
      .then((r) => (r.error ? null : (r.data as PaymentRow[]))),
    admin
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .then((r) => (r.error ? null : r.count ?? 0)),
    admin
      .from('client_subscriptions')
      .select('id', { count: 'exact', head: true })
      .gte('canceled_at', firstOfMonth)
      .then((r) => (r.error ? null : r.count ?? 0)),
  ])

  // MRR computation
  let mrr: number | null = null
  let weeklyRecurring: number | null = null
  let monthlyRecurring: number | null = null
  if (subs) {
    const active = subs.filter((s) => s.status === 'active' || !s.status)
    weeklyRecurring = active
      .filter((s) => s.billing_interval === 'week')
      .reduce((sum, s) => sum + Number(s.amount || 0), 0)
    monthlyRecurring = active
      .filter((s) => s.billing_interval === 'month')
      .reduce((sum, s) => sum + Number(s.amount || 0), 0)
    mrr = active.reduce(
      (sum, s) => sum + normalizeToMonthly(Number(s.amount || 0), s.billing_interval),
      0
    )
  }

  const activeSubscriptions = subs?.filter((s) => s.status === 'active' || !s.status).length ?? null

  // Revenue windows
  const revenue30d = payments30d
    ? payments30d.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    : null
  const revenueLifetime = allPayments
    ? allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    : null
  const paymentCount30d = payments30d?.length ?? null

  // Refunds
  let refundedAmount30d: number | null = null
  let refundRate30d: number | null = null
  if (payments30d) {
    refundedAmount30d = payments30d.reduce(
      (sum, p) => sum + Number(p.refunded_amount || 0),
      0
    )
    if (revenue30d && revenue30d > 0) {
      refundRate30d = (refundedAmount30d / revenue30d) * 100
    } else {
      refundRate30d = 0
    }
  }

  // Average revenue per client
  const averageRevenuePerClient =
    revenueLifetime !== null && clients !== null && clients > 0
      ? revenueLifetime / clients
      : null

  return {
    mrr,
    activeSubscriptions,
    weeklyRecurring,
    monthlyRecurring,
    revenue30d,
    revenueLifetime,
    paymentCount30d,
    activeClients: clients,
    refundRate30d,
    refundedAmount30d,
    averageRevenuePerClient,
    churnedThisMonth,
    computedAt: now.toISOString(),
  }
}
