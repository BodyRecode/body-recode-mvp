import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { tenantStripe } from '@/lib/tenant-stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { freezeClient } from '@/lib/freeze-client'
import { isCoachUser, forbidden } from '@/lib/api-auth'

/**
 * Pause a coaching engagement. Coach-only, and REVERSIBLE via /unfreeze. Use
 * for holidays, saving-up breaks and injury recovery. For a real end, use the
 * offboard route instead.
 *
 * Order of operations, hardest-to-undo last:
 *   1. App state (clients.frozen_at + email suppression) via freezeClient
 *   2. Stripe subscription cancellation
 *
 * If Stripe fails the app freeze still lands. The coach can retry the Stripe
 * cancel from the Stripe dashboard: better a locked-out client with billing
 * still ticking (visible immediately) than a client with billing off but the
 * portal still open (silent failure).
 */

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { stripe, opts } = tenantStripe()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const { notes } = body as { notes?: string }

  const admin = createAdminClient()
  const result = await freezeClient(admin, { clientId: id, notes, frozenBy: user.id })

  if (!result.ok) return NextResponse.json({ error: result.error, steps: result.steps }, { status: 400 })

  const { data: client } = await admin
    .from('clients')
    .select('email, stripe_customer_id')
    .eq('id', id)
    .maybeSingle()

  let stripeCancelled = 0
  const stripeErrors: string[] = []

  try {
    let customerId = client?.stripe_customer_id as string | undefined

    if (!customerId && client?.email) {
      const found = await stripe.customers.list({ email: client.email.toLowerCase(), limit: 1 }, opts)
      customerId = found.data[0]?.id
    }

    if (customerId) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 20 }, opts)
      const pastDue = await stripe.subscriptions.list({ customer: customerId, status: 'past_due', limit: 20 }, opts)
      const trialing = await stripe.subscriptions.list({ customer: customerId, status: 'trialing', limit: 20 }, opts)
      const all = [...subs.data, ...pastDue.data, ...trialing.data]

      for (const sub of all) {
        try {
          await stripe.subscriptions.cancel(sub.id, opts)
          stripeCancelled += 1
        } catch (err: unknown) {
          stripeErrors.push(`${sub.id}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
    }
  } catch (err: unknown) {
    stripeErrors.push(err instanceof Error ? err.message : String(err))
  }

  result.steps.push({
    step: `Stripe subscriptions cancelled (${stripeCancelled})`,
    done: stripeErrors.length === 0,
    detail: stripeErrors.length > 0 ? stripeErrors.join('; ') : undefined,
  })

  return NextResponse.json(result)
}
