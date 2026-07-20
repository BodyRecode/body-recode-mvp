import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PortalPageShell from '../portal-page-shell'
import FeedbackForm from './feedback-form'
import { isCoachEmail } from '@/lib/coach-auth'

export default async function PortalFeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) return notFound()
  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) {
    redirect(`/portal/${token}`)
  }

  return (
    <PortalPageShell
      backHref={`/portal/${token}`}
      eyebrow="Feedback"
      title="Share feedback"
      description="Tell us what is working, what is not, and what would help. This goes straight to Kade. We read every one and use it to shape what we build next."
    >
      <FeedbackForm clientId={client.id} portalToken={token} />
    </PortalPageShell>
  )
}
