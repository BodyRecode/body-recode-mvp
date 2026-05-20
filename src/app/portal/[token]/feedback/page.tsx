import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ClientHeader from '@/components/client-header'
import FeedbackForm from './feedback-form'

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
  if ((user.email ?? '').toLowerCase() !== (client.email ?? '').toLowerCase()) {
    redirect(`/portal/${token}`)
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <Link
            href={`/portal/${token}`}
            className="text-[12px] text-[#999999] hover:text-[#3A3A3A] transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-[28px] font-extrabold text-[#1A1A1A] tracking-tight leading-[1.1] mt-4 mb-2">
            Share feedback
          </h1>
          <p className="text-[#6B6B6B] text-[14px] leading-relaxed">
            Tell us what is working, what is not, and what would help. This goes straight to Kade.
            We read every one and use it to shape what we build next.
          </p>
        </div>

        <FeedbackForm clientId={client.id} portalToken={token} />

        <div className="h-16" />
      </div>
    </div>
  )
}
