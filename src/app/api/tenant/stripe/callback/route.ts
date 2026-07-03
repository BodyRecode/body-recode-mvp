import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { isCoachEmail } from '@/lib/coach-auth'
import { invalidateTenantCache } from '@/lib/tenant-resolver'
import { appUrl } from '@/lib/app-url'

/**
 * GET /api/tenant/stripe/callback
 *
 * Return URL from Stripe Connect onboarding. Checks the connected account's
 * current state (charges_enabled + details_submitted) and persists
 * licence.stripeAccountStatus:
 *
 *   charges_enabled=true  → 'active'
 *   details_submitted=true, charges_enabled=false → 'restricted' (verification still needed)
 *   otherwise → 'pending' (still onboarding)
 *
 * Redirects the coach back to /dashboard/settings/tenant with a flag to
 * show the result banner.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isCoachEmail(user.email)) {
    return NextResponse.redirect(new URL('/dashboard/login', appUrl()))
  }

  const { data: existing } = await supabase
    .from('tenant_config')
    .select('licence')
    .eq('coach_id', user.id)
    .maybeSingle()

  const licence = (existing?.licence as { tenantId?: string; stripeAccountId?: string | null; stripeAccountStatus?: string | null }) ?? {}
  const stripeAccountId = licence.stripeAccountId

  if (!stripeAccountId) {
    return NextResponse.redirect(new URL('/dashboard/settings/tenant?stripe_result=no_account', appUrl()))
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  let newStatus: 'pending' | 'active' | 'restricted' = 'pending'
  try {
    const account = await stripe.accounts.retrieve(stripeAccountId)
    if (account.charges_enabled) newStatus = 'active'
    else if (account.details_submitted) newStatus = 'restricted'
    else newStatus = 'pending'
  } catch {
    return NextResponse.redirect(new URL('/dashboard/settings/tenant?stripe_result=retrieve_failed', appUrl()))
  }

  const mergedLicence = { ...licence, stripeAccountStatus: newStatus }
  await supabase
    .from('tenant_config')
    .update({ licence: mergedLicence })
    .eq('coach_id', user.id)

  if (licence.tenantId) invalidateTenantCache(licence.tenantId)

  return NextResponse.redirect(new URL(`/dashboard/settings/tenant?stripe_result=${newStatus}`, appUrl()))
}
