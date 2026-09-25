import { redirect, notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * A client dashboard that asked nobody who they were. It selected the whole
 * client row on a link alone: name, email, dates, everything on that record.
 *
 * It predates the portal and nothing in the product has linked to it for
 * months. A redirect rather than a deletion, because the link may be in an
 * email already sent; the portal home shows the same things and asks for a
 * sign-in first. 25 Sep 2026.
 */
export default async function LegacyClientViewRedirect({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('onboarding_token')
    .eq('checkin_token', token)
    .maybeSingle()

  if (!client?.onboarding_token) notFound()
  redirect(`/portal/${client.onboarding_token}`)
}
