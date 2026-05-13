/**
 * Per-client Payments section, rendered inside /dashboard/clients/[id]/.
 *
 * Shows:
 *   - Plan label + commencement fee status
 *   - Live subscription status (active / past_due / canceled / none) with
 *     amount, interval, next charge date
 *   - Last 5 Performance Coaching payments
 *   - Lifetime PC value (sum of paid be_payments where product category =
 *     performance_coaching, or where no product is linked)
 *   - Health flags (red callout for "should have recurring but doesn't" etc)
 *   - Refresh from Stripe button + Stripe dashboard link
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { CheckCircle2, AlertTriangle, CircleDollarSign, ExternalLink, CreditCard, Clock, XCircle } from 'lucide-react'
import RefreshStripeButton from './refresh-stripe-button'
import MarkCommencementButton from './mark-commencement-button'

function formatAud(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return `$${amount.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatDate(input: string | null | undefined): string {
  if (!input) return '—'
  return new Date(input).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_META: Record<string, { label: string; tone: 'good' | 'warn' | 'bad' | 'muted'; icon: typeof CheckCircle2 }> = {
  active:               { label: 'Active',             tone: 'good',  icon: CheckCircle2 },
  trialing:             { label: 'Trialing',           tone: 'good',  icon: Clock },
  past_due:             { label: 'Past due',           tone: 'bad',   icon: AlertTriangle },
  unpaid:               { label: 'Unpaid',             tone: 'bad',   icon: AlertTriangle },
  canceled:             { label: 'Canceled',           tone: 'muted', icon: XCircle },
  incomplete:           { label: 'Incomplete',         tone: 'warn',  icon: Clock },
  incomplete_expired:   { label: 'Incomplete (expired)', tone: 'muted', icon: XCircle },
  paused:               { label: 'Paused',             tone: 'warn',  icon: Clock },
}

const TONE_CLASS = {
  good:  'text-teal-400',
  warn:  'text-amber-400',
  bad:   'text-red-400',
  muted: 'text-stone-500',
} as const

export default async function ClientPaymentsSection({ clientId }: { clientId: string }) {
  const admin = createAdminClient()

  const [
    { data: client },
    { data: planRow },
    { data: subs },
    { data: payments },
    { data: ltvRows },
  ] = await Promise.all([
    admin.from('clients').select('id, name, email, stripe_customer_id').eq('id', clientId).single(),
    admin
      .from('client_payment_plan')
      .select('client_id, commencement_fee_paid_at, commencement_fee_stripe_payment_id, expected_subscription_amount, payment_plans(name, commencement_fee, subscription_interval)')
      .eq('client_id', clientId)
      .maybeSingle(),
    admin
      .from('client_subscriptions')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false }),
    admin
      .from('be_payments')
      .select('id, amount, status, paid_at, created_at, stripe_subscription_id, be_products(name, category)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(5),
    admin
      .from('be_payments')
      .select('amount, status, be_products(category)')
      .eq('client_id', clientId)
      .eq('status', 'paid'),
  ])

  // Lifetime Performance Coaching value: sum amounts where product category is
  // performance_coaching OR where no product is linked (legacy payments). Legacy
  // payments with no product are treated as PC by default since this is a PC-only
  // platform; once the user tags products with categories the filter sharpens.
  const lifetimePC = (ltvRows ?? []).reduce<number>((sum, row) => {
    const cat = Array.isArray(row.be_products)
      ? row.be_products[0]?.category
      : (row.be_products as { category: string | null } | null)?.category
    if (cat == null || cat === 'performance_coaching') return sum + Number(row.amount ?? 0)
    return sum
  }, 0)

  // Pick the "primary" subscription (active first, else most recent)
  const primarySub = (subs ?? []).find(s => ['active', 'trialing'].includes(s.status))
    ?? (subs ?? [])[0]
    ?? null

  // Resolve plan label. Supabase typegen sometimes hands relations back as
  // an array, sometimes as a singleton — normalize both shapes.
  type PlanShape = { name: string; commencement_fee: number | null; subscription_interval: string | null }
  const rawPlan = planRow?.payment_plans as PlanShape | PlanShape[] | null | undefined
  const plan: PlanShape | null = Array.isArray(rawPlan) ? (rawPlan[0] ?? null) : (rawPlan ?? null)
  const planLabel = plan?.name ?? '— no plan assigned —'
  const expectedCommencement = plan?.commencement_fee
  const commencementPaid = !!planRow?.commencement_fee_paid_at

  // Health flags
  const flags: string[] = []
  if (!commencementPaid) flags.push(`Commencement fee${expectedCommencement ? ` ($${expectedCommencement})` : ''} not marked paid`)
  if (commencementPaid && !primarySub) flags.push('Commencement paid but no active subscription found')
  if (primarySub && ['past_due', 'unpaid'].includes(primarySub.status)) flags.push(`Subscription is ${primarySub.status.replace('_', ' ')}`)
  if (!client?.stripe_customer_id) flags.push('No Stripe customer linked yet — run backfill or refresh to match')

  const subMeta = primarySub ? STATUS_META[primarySub.status] ?? STATUS_META.canceled : null

  return (
    <section id="payments" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Payments</h2>
        <div className="flex items-center gap-2">
          {client?.stripe_customer_id && (
            <a
              href={`https://dashboard.stripe.com/customers/${client.stripe_customer_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-400 hover:text-white border border-stone-800 hover:border-stone-700 rounded-lg transition-colors"
            >
              <ExternalLink size={12} />
              Open in Stripe
            </a>
          )}
          <RefreshStripeButton clientId={clientId} />
        </div>
      </div>

      {/* Health flags */}
      {flags.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              {flags.map((f, i) => (
                <p key={i} className="text-xs text-red-300">{f}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Plan + status grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Plan card */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-2">Plan</p>
          <p className="text-sm font-medium text-white mb-1">{planLabel}</p>
          <p className="text-xs text-stone-500">
            Commencement: {commencementPaid ? (
              <span className="text-teal-400">paid {formatDate(planRow?.commencement_fee_paid_at)}</span>
            ) : (
              <span className="text-amber-400">not paid</span>
            )}
          </p>
          {!commencementPaid && (
            <div className="mt-3">
              <MarkCommencementButton clientId={clientId} />
            </div>
          )}
        </div>

        {/* Subscription card */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-2">Subscription</p>
          {primarySub && subMeta ? (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <subMeta.icon size={13} className={TONE_CLASS[subMeta.tone]} />
                <p className={`text-sm font-medium ${TONE_CLASS[subMeta.tone]}`}>{subMeta.label}</p>
              </div>
              <p className="text-xs text-stone-400">
                {formatAud(primarySub.amount)}{primarySub.billing_interval ? ` / ${primarySub.billing_interval}` : ''}
              </p>
              {primarySub.current_period_end && ['active', 'trialing', 'past_due'].includes(primarySub.status) && (
                <p className="text-xs text-stone-500 mt-1">
                  Next charge: {formatDate(primarySub.current_period_end)}
                </p>
              )}
              {primarySub.cancel_at_period_end && (
                <p className="text-xs text-amber-400 mt-1">Cancels at period end</p>
              )}
            </>
          ) : (
            <p className="text-sm text-stone-500">No subscription found</p>
          )}
        </div>
      </div>

      {/* Lifetime + recent payments */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CircleDollarSign size={14} className="text-stone-400" />
            <p className="text-xs font-semibold text-stone-300">Lifetime (Performance Coaching)</p>
          </div>
          <p className="text-lg font-bold text-white">{formatAud(lifetimePC)}</p>
        </div>

        {payments && payments.length > 0 ? (
          <div className="space-y-1.5">
            {payments.map(p => {
              const productName = Array.isArray(p.be_products)
                ? p.be_products[0]?.name
                : (p.be_products as { name: string } | null)?.name ?? 'Manual'
              const cfg = STATUS_META[p.status === 'paid' ? 'active' : p.status === 'failed' ? 'past_due' : 'incomplete']
              return (
                <div key={p.id} className="flex items-center justify-between text-xs py-1">
                  <div className="text-stone-400">
                    <span className="text-stone-300">{productName}</span>
                    <span className="text-stone-600 ml-2">{formatDate(p.paid_at ?? p.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-300">{formatAud(p.amount)}</span>
                    <span className={`uppercase text-[10px] font-semibold ${cfg ? TONE_CLASS[cfg.tone] : 'text-stone-500'}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <CreditCard size={12} />
            No payments recorded yet
          </div>
        )}
      </div>

      {/* All subscriptions (if more than one) */}
      {(subs?.length ?? 0) > 1 && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-2">All subscriptions</p>
          <div className="space-y-1.5">
            {subs!.map(s => {
              const meta = STATUS_META[s.status] ?? STATUS_META.canceled
              return (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <meta.icon size={11} className={TONE_CLASS[meta.tone]} />
                    <span className="text-stone-300">{s.plan_label ?? s.stripe_subscription_id}</span>
                    <span className="text-stone-600 ml-1">{formatAud(s.amount)}{s.billing_interval ? `/${s.billing_interval}` : ''}</span>
                  </div>
                  <span className={`uppercase text-[10px] font-semibold ${TONE_CLASS[meta.tone]}`}>{meta.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
