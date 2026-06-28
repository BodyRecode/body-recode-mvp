/**
 * CEO Dashboard — the Company Scorecard.
 *
 * Built on the one rule from Ryan Deiss's Scalable Operating System: the
 * scorecard MIRRORS the Value Engines. Every metric here maps to a stage in
 * how Body Recode acquires customers (Growth Engine) or serves them
 * (Fulfilment Engine), plus the CEO-level cash view.
 *
 * Two deliberate departures from the book, because Kade runs near-solo rather
 * than a team:
 *   1. Actuals are AUTO-PULLED from Supabase/Stripe, not entered by hand. The
 *      manual-entry rule exists so a team "owns its numbers"; with a live
 *      system and one operator it is friction with no payoff.
 *   2. Targets live in TARGETS below (a config object), reviewed each quarter
 *      per Deiss's Quarterly Sprint cadence — not a DB table. v2 = inline-
 *      editable targets + persisted weekly snapshots for true historical trend.
 *
 * Flow metrics (Growth Engine) are bucketed week-over-week — the spine of the
 * scorecard. Snapshot metrics (point-in-time: MRR, active clients, etc.) can't
 * be back-computed reliably, so they show current value only until weekly
 * snapshotting lands in v2.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { derivePaymentSignal } from '@/lib/payment-signal'

export type EngineKey = 'growth' | 'fulfilment' | 'cash'
export type Direction = 'higher' | 'lower'
export type Unit = 'count' | 'currency' | 'percent'
export type Status = 'green' | 'yellow' | 'red'

/* ── Targets ──────────────────────────────────────────────────────────────
 * DRAFT defaults. Review these at the start of each quarter (Deiss's Quarterly
 * Sprint Planning). A target is what "winning" looks like for one week (flow
 * metrics) or right now (snapshot metrics). Edit the numbers, redeploy.
 * Currency is AUD. */
export const TARGETS: Record<string, number> = {
  // Growth Engine — weekly flow
  new_leads: 25,
  decode_sales: 8,
  challenge_enrolls: 10,
  zoom_calls: 5,
  blueprint_sales: 4,
  new_clients: 2,
  cash_collected: 1500,
  // Fulfilment Engine + Cash — snapshots
  mrr: 6000,
  active_clients: 15,
  active_members: 20,
  checkin_rate: 90,
  overdue: 0,
}

/** Blueprint list price (AUD) — not stored per-enrolment, so configured. */
const BLUEPRINT_PRICE = 97

export interface MetricDef {
  key: string
  label: string
  engine: EngineKey
  direction: Direction
  unit: Unit
  /** Short note on what stage of the Value Engine this measures. */
  hint: string
}

/** Growth Engine = weekly flow. Rendered as the week-over-week trend table. */
export const FLOW_METRICS: MetricDef[] = [
  { key: 'new_leads',        label: 'New Scorecard Leads',  engine: 'growth', direction: 'higher', unit: 'count',    hint: 'Top of funnel — quiz completions' },
  { key: 'decode_sales',     label: 'Decode / Digital Sales', engine: 'growth', direction: 'higher', unit: 'count',  hint: '$37 entry offer + packs' },
  { key: 'challenge_enrolls',label: 'Challenge Enrollments', engine: 'growth', direction: 'higher', unit: 'count',   hint: 'Free 14-day Challenge starts' },
  { key: 'zoom_calls',       label: 'Zoom Calls',           engine: 'growth', direction: 'higher', unit: 'count',    hint: 'Sales calls (by call date)' },
  { key: 'blueprint_sales',  label: 'Blueprint Sales',      engine: 'growth', direction: 'higher', unit: 'count',    hint: '$97 Blueprint purchases' },
  { key: 'new_clients',      label: 'New Coaching Clients', engine: 'growth', direction: 'higher', unit: 'count',    hint: 'Commencement fee paid' },
  { key: 'cash_collected',   label: 'Cash Collected',       engine: 'cash',   direction: 'higher', unit: 'currency', hint: 'One-time + digital (recurring shows in MRR)' },
]

/** Fulfilment Engine + Cash = point-in-time snapshots. */
export const SNAPSHOT_METRICS: MetricDef[] = [
  { key: 'mrr',            label: 'MRR',                  engine: 'cash',        direction: 'higher', unit: 'currency', hint: 'Active subscriptions, normalised monthly' },
  { key: 'active_clients', label: 'Active Coaching Clients', engine: 'fulfilment', direction: 'higher', unit: 'count', hint: 'Started and not churned' },
  { key: 'active_members', label: 'Active Members',       engine: 'fulfilment',  direction: 'higher', unit: 'count',    hint: 'Membership, not cancelled' },
  { key: 'checkin_rate',   label: 'Check-In Completion',  engine: 'fulfilment',  direction: 'higher', unit: 'percent',  hint: 'This week, across active clients' },
  { key: 'overdue',        label: 'Payments Overdue',     engine: 'cash',        direction: 'lower',  unit: 'count',    hint: 'Past due / unpaid / missing fee' },
]

/* ── Week maths (ISO weeks, Monday start) ───────────────────────────────── */
function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function startOfISOWeek(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const dow = (x.getDay() + 6) % 7 // Mon = 0 … Sun = 6
  x.setDate(x.getDate() - dow)
  return x
}

export interface WeekRange {
  start: Date
  end: Date
  label: string
  isCurrent: boolean
}

/** `completed` finished ISO weeks (oldest first) + the current partial week. */
export function recentWeeks(now: Date, completed = 6): WeekRange[] {
  const curStart = startOfISOWeek(now)
  const weeks: WeekRange[] = []
  for (let i = completed; i >= 1; i--) {
    const start = addDays(curStart, -7 * i)
    weeks.push({ start, end: addDays(start, 7), label: weekLabel(start), isCurrent: false })
  }
  weeks.push({ start: curStart, end: addDays(curStart, 7), label: 'This wk', isCurrent: true })
  return weeks
}

function weekLabel(start: Date): string {
  return start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

/* ── Status (traffic light) ─────────────────────────────────────────────── */
export function statusFor(actual: number, target: number, direction: Direction): Status {
  if (direction === 'higher') {
    if (actual >= target) return 'green'
    if (target > 0 && actual >= target * 0.8) return 'yellow'
    return 'red'
  }
  // lower-is-better
  if (actual <= target) return 'green'
  const yellowCeiling = target === 0 ? 1 : target * 1.25
  if (actual <= yellowCeiling) return 'yellow'
  return 'red'
}

/* ── Formatting ─────────────────────────────────────────────────────────── */
const AUD = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })

export function formatValue(value: number, unit: Unit): string {
  if (unit === 'currency') return AUD.format(Math.round(value))
  if (unit === 'percent') return `${Math.round(value)}%`
  return String(Math.round(value))
}

/** Normalise a subscription's amount to a monthly figure for MRR. */
function toMonthly(amount: number, interval: string | null): number {
  switch (interval) {
    case 'day': return amount * 30
    case 'week': return (amount * 52) / 12
    case 'fortnight': return (amount * 26) / 12
    case 'year': return amount / 12
    case 'month':
    default: return amount
  }
}

/* ── Compute ────────────────────────────────────────────────────────────── */
export interface FlowResult extends MetricDef {
  target: number
  values: number[]      // one per week in `weeks`
  lastWeek: number      // most recent COMPLETED week
  thisWeek: number      // current partial week (to date)
  status: Status        // lastWeek vs target
}

export interface SnapshotResult extends MetricDef {
  target: number
  actual: number
  status: Status
}

export interface ScorecardData {
  weeks: WeekRange[]
  flow: FlowResult[]
  snapshots: SnapshotResult[]
  heroes: { mrr: number; activeClients: number; cashThisWeek: number; checkinRate: number }
  generatedAt: Date
}

type Row = Record<string, unknown>
const asDate = (v: unknown): Date | null => (v ? new Date(v as string) : null)

function bucket(weeks: WeekRange[], dates: (Date | null)[], amounts?: number[]): number[] {
  return weeks.map(w =>
    dates.reduce<number>((acc, dt, i) => {
      if (dt && dt >= w.start && dt < w.end) return acc + (amounts ? amounts[i] : 1)
      return acc
    }, 0),
  )
}

export async function computeScorecard(admin: SupabaseClient, now = new Date()): Promise<ScorecardData> {
  const weeks = recentWeeks(now, 6)
  const windowStart = weeks[0].start.toISOString()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const curWeek = weeks[weeks.length - 1]

  // Fetch everything once. Flow tables are window-bounded; snapshot tables full.
  const safe = <T,>(p: PromiseLike<{ data: T[] | null }>) =>
    Promise.resolve(p).then(r => r.data ?? []).catch(() => [] as T[])

  const [
    leads, clients, subs, payPlans, plans, digital, products,
    challenge, blueprint, membership, checkins,
  ] = await Promise.all([
    safe<Row>(admin.from('leads').select('created_at, zoom_1_date').gte('created_at', windowStart)),
    safe<Row>(admin.from('clients').select('id, name, coaching_started_at, active, package')),
    safe<Row>(admin.from('client_subscriptions').select('client_id, status, amount, billing_interval, current_period_end, canceled_at, created_at').order('created_at', { ascending: false })),
    safe<Row>(admin.from('client_payment_plan').select('client_id, commencement_fee_paid_at, payment_plan_id')),
    safe<Row>(admin.from('payment_plans').select('id, commencement_fee')),
    safe<Row>(admin.from('digital_asset_purchases').select('product_id, status, purchased_at').gte('purchased_at', windowStart)),
    safe<Row>(admin.from('be_products').select('id, price')),
    safe<Row>(admin.from('challenge_enrollments').select('enrolled_at').gte('enrolled_at', windowStart)),
    safe<Row>(admin.from('blueprint_enrollments').select('purchase_date').gte('purchase_date', windowStart)),
    safe<Row>(admin.from('membership_enrollments').select('joined_at, cancelled_at')),
    safe<Row>(admin.from('weekly_checkins').select('client_id, submitted_at').gte('submitted_at', curWeek.start.toISOString())),
  ])

  const priceById = new Map(products.map(p => [p.id as string, Number(p.price) || 0]))
  const feeByPlan = new Map(plans.map(p => [p.id as string, Number(p.commencement_fee) || 0]))

  // ── Flow buckets ────────────────────────────────────────────────────────
  const newLeads = bucket(weeks, leads.map(l => asDate(l.created_at)))
  const zoomCalls = bucket(weeks, leads.map(l => asDate(l.zoom_1_date)))
  const challengeEnrolls = bucket(weeks, challenge.map(c => asDate(c.enrolled_at)))
  const blueprintSales = bucket(weeks, blueprint.map(b => asDate(b.purchase_date)))

  const paidDigital = digital.filter(d => d.status === 'paid' || d.status === 'fulfilled')
  const decodeSales = bucket(weeks, paidDigital.map(d => asDate(d.purchased_at)))
  const digitalRevenue = bucket(
    weeks,
    paidDigital.map(d => asDate(d.purchased_at)),
    paidDigital.map(d => priceById.get(d.product_id as string) ?? 0),
  )

  const newClients = bucket(weeks, payPlans.map(p => asDate(p.commencement_fee_paid_at)))
  const feeRevenue = bucket(
    weeks,
    payPlans.map(p => asDate(p.commencement_fee_paid_at)),
    payPlans.map(p => feeByPlan.get(p.payment_plan_id as string) ?? 0),
  )
  const blueprintRevenue = bucket(weeks, blueprint.map(b => asDate(b.purchase_date)), blueprint.map(() => BLUEPRINT_PRICE))
  const cashCollected = weeks.map((_, i) => digitalRevenue[i] + feeRevenue[i] + blueprintRevenue[i])

  const flowValues: Record<string, number[]> = {
    new_leads: newLeads,
    decode_sales: decodeSales,
    challenge_enrolls: challengeEnrolls,
    zoom_calls: zoomCalls,
    blueprint_sales: blueprintSales,
    new_clients: newClients,
    cash_collected: cashCollected,
  }

  const lastIdx = weeks.length - 2 // most recent completed week
  const flow: FlowResult[] = FLOW_METRICS.map(m => {
    const values = flowValues[m.key]
    const lastWeek = values[lastIdx]
    const target = TARGETS[m.key] ?? 0
    return {
      ...m, target, values, lastWeek, thisWeek: values[values.length - 1],
      status: statusFor(lastWeek, target, m.direction),
    }
  })

  // ── Snapshots ─────────────────────────────────────────────────────────────
  // Pick one "primary" subscription per client (prefer active/trialing).
  const subByClient = new Map<string, Row>()
  for (const s of subs) {
    const cid = s.client_id as string
    const existing = subByClient.get(cid)
    const live = s.status === 'active' || s.status === 'trialing'
    if (!existing) subByClient.set(cid, s)
    else if (live && existing.status !== 'active' && existing.status !== 'trialing') subByClient.set(cid, s)
  }
  const planByClient = new Map(payPlans.map(p => [p.client_id as string, p]))

  const mrr = subs
    .filter(s => (s.status === 'active' || s.status === 'trialing') && asDate(s.current_period_end) && asDate(s.current_period_end)! >= now)
    .reduce((sum, s) => sum + toMonthly(Number(s.amount) || 0, (s.billing_interval as string) ?? null), 0)

  const activeClientRows = clients.filter(c => c.active !== false && asDate(c.coaching_started_at) && asDate(c.coaching_started_at)! <= today)
  const activeClients = activeClientRows.length
  const activeMembers = membership.filter(m => !m.cancelled_at).length

  const checkinClients = new Set(checkins.map(c => c.client_id as string))
  const activeIds = new Set(activeClientRows.map(c => c.id as string))
  const checkedIn = [...checkinClients].filter(id => activeIds.has(id)).length
  const checkinRate = activeClients > 0 ? (checkedIn / activeClients) * 100 : 0

  let overdue = 0
  for (const c of clients) {
    if (c.active === false) continue
    const hasStarted = asDate(c.coaching_started_at) ? asDate(c.coaching_started_at)! <= today : false
    const { paymentSignal } = derivePaymentSignal({
      hasStarted,
      coachingStartedAt: (c.coaching_started_at as string) ?? null,
      clientPackage: (c.package as string) ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      primarySub: (subByClient.get(c.id as string) as any) ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      paymentPlan: (planByClient.get(c.id as string) as any) ?? null,
      today,
    })
    if (paymentSignal) overdue++
  }

  const snapValues: Record<string, number> = {
    mrr, active_clients: activeClients, active_members: activeMembers,
    checkin_rate: checkinRate, overdue,
  }
  const snapshots: SnapshotResult[] = SNAPSHOT_METRICS.map(m => {
    const target = TARGETS[m.key] ?? 0
    const actual = snapValues[m.key]
    return { ...m, target, actual, status: statusFor(actual, target, m.direction) }
  })

  return {
    weeks,
    flow,
    snapshots,
    heroes: { mrr, activeClients, cashThisWeek: cashCollected[cashCollected.length - 1], checkinRate },
    generatedAt: now,
  }
}
