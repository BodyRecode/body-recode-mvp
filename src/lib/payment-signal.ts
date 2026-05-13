/**
 * Shared per-client payment-signal derivation.
 *
 * Two surfaces read this:
 *   - Today's Focus widget (per-client row stage)
 *   - Dashboard overview "Payments: current / overdue" indicator
 *
 * Same rules in both places so the binary indicator and the row stage
 * never disagree.
 */

import type { PaymentSignal } from './client-next-action'
import { isNonBillingPackage } from './coaching-packages'

export interface PaymentSignalInput {
  hasStarted: boolean
  coachingStartedAt: string | null
  /**
   * The client's coaching package value (clients.package). When set to a
   * non-billing tier (contra / no_charge) the client is explicitly exempt
   * from payment tracking — overrides any subscription/plan data.
   */
  clientPackage: string | null
  primarySub:
    | {
        status: string
        amount: number | null
        currency: string | null
        billing_interval: string | null
        current_period_end: string | null
        canceled_at: string | null
      }
    | null
  paymentPlan: { commencement_fee_paid_at: string | null } | null
  today: Date
}

export interface PaymentSignalResult {
  paymentSignal: PaymentSignal | null
  paymentDetail: string | null
}

/**
 * Map the cached Stripe subscription + client_payment_plan rows into a single
 * paymentSignal.
 *
 * Rules (mirrors the per-client payments section so signals stay consistent):
 *   - past_due / unpaid on the primary sub  → red flag (most urgent)
 *   - canceled primary sub while the client is in active coaching → red flag
 *   - no live sub + on a plan + coaching started 7+ days ago + commencement
 *     fee not received → amber flag (gives a brief grace window so the
 *     dashboard doesn't scream the moment someone starts)
 *
 * Returns null for clients with no plan and no subscriptions — these are
 * exempt (contra deals, free legacy clients).
 */
export function derivePaymentSignal(args: PaymentSignalInput): PaymentSignalResult {
  const { primarySub, paymentPlan, hasStarted, coachingStartedAt, today, clientPackage } = args

  // Explicit exemption: contra / no-charge packages skip the tracker entirely.
  // Wins over any subscription or plan data — if the coach set the package to
  // a non-billing tier, that's a deliberate "don't bill me about this client".
  if (isNonBillingPackage(clientPackage)) {
    return { paymentSignal: null, paymentDetail: null }
  }

  // Implicit exemption: no plan, no subscriptions = no expectation of billing.
  if (!primarySub && !paymentPlan) {
    return { paymentSignal: null, paymentDetail: null }
  }

  if (primarySub?.status === 'past_due') {
    return {
      paymentSignal: 'past_due',
      paymentDetail: formatSubAmount(primarySub) + ' · last charge failed',
    }
  }

  if (primarySub?.status === 'unpaid') {
    return {
      paymentSignal: 'unpaid',
      paymentDetail:
        formatSubAmount(primarySub) +
        ' · Stripe has stopped retrying, client action required',
    }
  }

  if (primarySub?.status === 'canceled' && hasStarted) {
    const when = primarySub.canceled_at
      ? new Date(primarySub.canceled_at).toLocaleDateString('en-AU', {
          day: 'numeric',
          month: 'short',
        })
      : null
    return {
      paymentSignal: 'canceled',
      paymentDetail: when
        ? `Canceled ${when} · client still flagged active`
        : 'Recurring sub no longer billing, client still flagged active',
    }
  }

  // Commencement-missing: must have a plan attached, no fee received yet, and
  // coaching has been running for at least a week. Avoids flagging on day 1.
  if (
    paymentPlan &&
    !paymentPlan.commencement_fee_paid_at &&
    hasStarted &&
    coachingStartedAt
  ) {
    const startedAt = new Date(coachingStartedAt).getTime()
    const daysSinceStart = Math.floor((today.getTime() - startedAt) / 86400000)
    if (daysSinceStart >= 7) {
      return {
        paymentSignal: 'commencement_missing',
        paymentDetail: `${daysSinceStart} days in, $240 commencement fee not received`,
      }
    }
  }

  return { paymentSignal: null, paymentDetail: null }
}

function formatSubAmount(sub: {
  amount: number | null
  currency: string | null
  billing_interval: string | null
}): string {
  if (sub.amount == null) return 'Subscription'
  const currency = (sub.currency ?? 'aud').toUpperCase()
  const interval = sub.billing_interval ? `/${sub.billing_interval}` : ''
  return `${currency} $${Number(sub.amount).toLocaleString('en-AU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}${interval}`
}
