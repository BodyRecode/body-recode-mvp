/**
 * Client Status — cross-cut view of every client and their payment health.
 *
 * One row per client. Columns:
 *   - Name (link to client detail page)
 *   - Plan
 *   - Commencement fee status
 *   - Subscription status + amount + interval + next charge
 *   - Last paid
 *   - Lifetime (PC)
 *   - Flags
 *
 * Sorted with the most-needs-attention rows on top:
 *   1. past_due / unpaid first
 *   2. no active sub but commencement paid
 *   3. commencement not paid
 *   4. healthy active rows
 *   5. canceled / churned
 */

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import PaymentsNav from '../payments-nav'

type SubStatus = 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'paused'

const STATUS_META: Record<SubStatus | 'none', { label: string; tone: 'good' | 'warn' | 'bad' | 'muted' }> = {
  active:               { label: 'Active',     tone: 'good' },
  trialing:             { label: 'Trialing',   tone: 'good' },
  past_due:             { label: 'Past due',   tone: 'bad' },
  unpaid:               { label: 'Unpaid',     tone: 'bad' },
  canceled:             { label: 'Canceled',   tone: 'muted' },
  incomplete:           { label: 'Incomplete', tone: 'warn' },
  incomplete_expired:   { label: 'Expired',    tone: 'muted' },
  paused:               { label: 'Paused',     tone: 'warn' },
  none:                 { label: 'None',       tone: 'muted' },
}

const TONE_CLASS = {
  good:  'text-blue-500',
  warn:  'text-amber-700',
  bad:   'text-red-700',
  muted: 'text-[#666D7A]',
} as const

const TONE_BG = {
  good:  'bg-blue-50',
  warn:  'bg-amber-50',
  bad:   'bg-red-50',
  muted: 'bg-[#EFF1F4]/40',
} as const

function formatAud(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return `$${amount.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatDate(input: string | null | undefined): string {
  if (!input) return '—'
  return new Date(input).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

export default async function ClientStatusPage() {
  const supabase = await createClient()

  // Pull all clients with their plan + subs in one round-trip per relation
  const { data: clients } = await supabase
    .from('clients')
    .select(`
      id, name, email, stripe_customer_id, active, created_at,
      client_payment_plan(commencement_fee_paid_at, payment_plans(name)),
      client_subscriptions(id, status, amount, currency, billing_interval, current_period_end, cancel_at_period_end, created_at)
    `)
    .order('created_at', { ascending: false })

  // Pull all paid payments for LTV calculation in one shot
  const { data: payments } = await supabase
    .from('be_payments')
    .select('client_id, amount, status, paid_at, created_at, be_products(category)')
    .eq('status', 'paid')

  // Build per-client aggregates
  type Aggregate = {
    lifetime_pc: number
    last_paid_at: string | null
  }
  const agg = new Map<string, Aggregate>()
  for (const p of payments ?? []) {
    if (!p.client_id) continue
    const cat = Array.isArray(p.be_products)
      ? p.be_products[0]?.category
      : (p.be_products as { category: string | null } | null)?.category
    const isPC = cat == null || cat === 'performance_coaching'
    const cur = agg.get(p.client_id) ?? { lifetime_pc: 0, last_paid_at: null }
    if (isPC) cur.lifetime_pc += Number(p.amount ?? 0)
    const candidateDate = p.paid_at ?? p.created_at
    if (candidateDate && (!cur.last_paid_at || candidateDate > cur.last_paid_at)) {
      cur.last_paid_at = candidateDate
    }
    agg.set(p.client_id, cur)
  }

  // Build display rows
  type Row = {
    id: string
    name: string
    planName: string
    commencementPaid: boolean
    sub: SubStatus | 'none'
    subAmount: number | null
    subInterval: string | null
    nextCharge: string | null
    cancelAtPeriodEnd: boolean
    lastPaid: string | null
    lifetimePC: number
    stripeLinked: boolean
    flags: number
  }

  const rows: Row[] = (clients ?? []).map(c => {
    const plan = Array.isArray(c.client_payment_plan)
      ? c.client_payment_plan[0]
      : c.client_payment_plan as { commencement_fee_paid_at: string | null; payment_plans: { name: string } | { name: string }[] | null } | null
    const planName = (() => {
      const p = plan?.payment_plans
      if (!p) return '—'
      if (Array.isArray(p)) return p[0]?.name ?? '—'
      return p.name ?? '—'
    })()
    const commencementPaid = !!plan?.commencement_fee_paid_at

    const subs = (c.client_subscriptions ?? []) as Array<{ status: SubStatus; amount: number | null; billing_interval: string | null; current_period_end: string | null; cancel_at_period_end: boolean; created_at: string }>
    const primary = subs.find(s => ['active', 'trialing'].includes(s.status))
      ?? subs.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))[0]
      ?? null

    const a = agg.get(c.id) ?? { lifetime_pc: 0, last_paid_at: null }

    // Count flags for sort weight
    let flags = 0
    if (primary && (primary.status === 'past_due' || primary.status === 'unpaid')) flags += 100
    if (commencementPaid && !primary) flags += 50
    if (commencementPaid && primary && !['active', 'trialing'].includes(primary.status)) flags += 30
    if (!commencementPaid && c.active !== false) flags += 10
    if (!c.stripe_customer_id) flags += 5

    return {
      id: c.id,
      name: c.name ?? c.email ?? 'Unnamed',
      planName,
      commencementPaid,
      sub: primary?.status ?? 'none',
      subAmount: primary?.amount ?? null,
      subInterval: primary?.billing_interval ?? null,
      nextCharge: primary?.current_period_end ?? null,
      cancelAtPeriodEnd: !!primary?.cancel_at_period_end,
      lastPaid: a.last_paid_at,
      lifetimePC: a.lifetime_pc,
      stripeLinked: !!c.stripe_customer_id,
      flags,
    }
  })

  // Sort: most flags first, then by lifetime value descending
  rows.sort((a, b) => b.flags - a.flags || b.lifetimePC - a.lifetimePC)

  // Headline counts
  const counts = {
    active: rows.filter(r => r.sub === 'active' || r.sub === 'trialing').length,
    pastDue: rows.filter(r => r.sub === 'past_due' || r.sub === 'unpaid').length,
    noSub: rows.filter(r => r.sub === 'none' && r.commencementPaid).length,
    noCommencement: rows.filter(r => !r.commencementPaid).length,
  }

  return (
    <div className="max-w-6xl">
      <div className="br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E8EAEE] bg-white/[0.88] backdrop-blur-md print:static print:bg-transparent">
        <h1 className="text-[22px] font-semibold tracking-[-0.025em] mb-1">Payments</h1>
        <p className="text-[#666D7A] text-sm">Products, invoices, and payment history</p>
      </div>

      <PaymentsNav />

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#141821] mb-1">Client Status</h2>
        <p className="text-[#666D7A] text-sm">Every client and their payment plan health. Sorted with attention-needed rows on top.</p>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <CountCard label="Active" value={counts.active} icon={CheckCircle2} tone="good" />
        <CountCard label="Past due" value={counts.pastDue} icon={AlertTriangle} tone="bad" />
        <CountCard label="No active sub" value={counts.noSub} icon={Clock} tone="warn" />
        <CountCard label="No Foundational Read" value={counts.noCommencement} icon={XCircle} tone="muted" />
      </div>

      {/* Table */}
      <div className="border border-[#E8EAEE] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1.2fr_1fr_1.3fr_0.9fr_0.9fr] gap-3 px-4 py-3 bg-[#F4F6F9] border-b border-[#E8EAEE] text-[10px] font-semibold text-[#666D7A]">
          <div>Client</div>
          <div>Plan</div>
          <div>Foundational Read</div>
          <div>Subscription</div>
          <div className="text-right">Last paid</div>
          <div className="text-right">Lifetime PC</div>
        </div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-[#666D7A] text-sm">No clients yet.</div>
        ) : (
          rows.map(r => {
            const meta = STATUS_META[r.sub]
            return (
              <Link
                key={r.id}
                href={`/dashboard/clients/${r.id}#payments`}
                className="grid grid-cols-[2fr_1.2fr_1fr_1.3fr_0.9fr_0.9fr] gap-3 px-4 py-3 border-b border-[#E8EAEE] last:border-b-0 hover:bg-[#F4F6F9]/50 transition-colors items-center"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#141821] truncate">{r.name}</p>
                  {!r.stripeLinked && (
                    <p className="text-[10px] text-amber-700/80 mt-0.5">No Stripe link</p>
                  )}
                </div>
                <div className="text-[12.5px] text-[#666D7A] truncate">{r.planName}</div>
                <div className="text-[12.5px]">
                  {r.commencementPaid ? (
                    <span className="text-blue-500">Paid</span>
                  ) : (
                    <span className="text-amber-700">Not paid</span>
                  )}
                </div>
                <div className="text-[12.5px] min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${TONE_BG[meta.tone]}`} />
                    <span className={`${TONE_CLASS[meta.tone]} font-medium`}>{meta.label}</span>
                  </div>
                  {r.sub !== 'none' && (
                    <p className="text-[#666D7A] text-[11px] mt-0.5 truncate">
                      {formatAud(r.subAmount)}{r.subInterval ? `/${r.subInterval}` : ''}
                      {r.nextCharge && ['active', 'trialing', 'past_due'].includes(r.sub) && (
                        <span className="text-[#98A0AD]"> · next {formatDate(r.nextCharge)}</span>
                      )}
                      {r.cancelAtPeriodEnd && <span className="text-amber-700"> · cancels</span>}
                    </p>
                  )}
                </div>
                <div className="text-[12.5px] text-[#666D7A] text-right">{formatDate(r.lastPaid)}</div>
                <div className="text-[12.5px] text-[#141821] text-right font-medium">{formatAud(r.lifetimePC)}</div>
              </Link>
            )
          })
        )}
      </div>

      <p className="text-[12.5px] text-[#98A0AD] mt-3">
        Click any row to jump to that client&apos;s Payments section. Status is cached from Stripe; use the &quot;Refresh from Stripe&quot; button on a client to pull live state.
      </p>
    </div>
  )
}

function CountCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof CheckCircle2; tone: 'good' | 'warn' | 'bad' | 'muted' }) {
  return (
    <div className="bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} className={TONE_CLASS[tone]} />
        <p className="text-[10px] font-semibold text-[#666D7A]">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${TONE_CLASS[tone]}`}>{value}</p>
    </div>
  )
}
