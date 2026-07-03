import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { isCoachEmail } from '@/lib/coach-auth'
import { invalidateTenantCache } from '@/lib/tenant-resolver'
import { appUrl } from '@/lib/app-url'

/**
 * POST /api/tenant/stripe/onboard
 *
 * Starts the Stripe Connect onboarding flow for the current coach's tenant.
 *
 * Flow:
 *  1. Ensure the coach has a tenant_config row.
 *  2. If licence.stripeAccountId is missing: create a Standard connected
 *     account via Stripe API + persist the id back to tenant_config.licence.
 *  3. Generate a Stripe AccountLink for onboarding (Stripe-hosted UI).
 *  4. Return the URL for the client to redirect to.
 *
 * On return, Stripe redirects to /api/tenant/stripe/callback which polls the
 * account status + updates licence.stripeAccountStatus.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isCoachEmail(user.email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: existing, error: fetchErr } = await supabase
    .from('tenant_config')
    .select('licence, coach')
    .eq('coach_id', user.id)
    .maybeSingle()

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'no tenant_config row' }, { status: 400 })

  const licence = (existing.licence as { tenantId?: string; stripeAccountId?: string | null; stripeAccountStatus?: string | null }) ?? {}
  const coachData = (existing.coach as { email?: string; firstName?: string; fullName?: string }) ?? {}

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  let stripeAccountId = licence.stripeAccountId ?? null

  if (!stripeAccountId) {
    try {
      const account = await stripe.accounts.create({
        type: 'standard',
        email: coachData.email ?? user.email ?? undefined,
        business_profile: {
          name: coachData.fullName ?? undefined,
        },
        metadata: {
          tenant_id: licence.tenantId ?? '',
          coach_id: user.id,
        },
      })
      stripeAccountId = account.id

      const mergedLicence = { ...licence, stripeAccountId, stripeAccountStatus: 'pending' as const }
      const { error: persistErr } = await supabase
        .from('tenant_config')
        .update({ licence: mergedLicence })
        .eq('coach_id', user.id)
      if (persistErr) return NextResponse.json({ error: persistErr.message }, { status: 500 })

      if (licence.tenantId) invalidateTenantCache(licence.tenantId)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ error: `Stripe account create failed: ${msg}` }, { status: 500 })
    }
  }

  try {
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appUrl()}/dashboard/settings/tenant?stripe_refresh=1`,
      return_url: `${appUrl()}/api/tenant/stripe/callback`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ ok: true, url: accountLink.url, stripeAccountId })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Stripe onboarding link failed: ${msg}` }, { status: 500 })
  }
}
