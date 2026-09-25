import { redirect, notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * The check-in form used to live here, on a page that ASKED NOBODY WHO THEY
 * WERE. Anyone holding the link could open a client's check-in and submit it.
 *
 * It predates the portal. The portal now has its own check-in at
 * /portal/<token>/checkin, which is behind a sign-in and reuses the same form
 * component (still in this folder, still live — it is the PAGE that was the
 * hole, not the form).
 *
 * This is a redirect rather than a deletion because the link is in emails
 * already sent. An old link keeps working, and now it asks who is holding it.
 * 25 Sep 2026.
 */
export default async function LegacyCheckinRedirect({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('onboarding_token')
    .eq('checkin_token', token)
    .maybeSingle()

  if (!client?.onboarding_token) notFound()
  redirect(`/portal/${client.onboarding_token}/checkin`)
}
