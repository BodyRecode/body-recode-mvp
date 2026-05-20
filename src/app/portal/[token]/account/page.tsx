import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ClientHeader from '@/components/client-header'
import AccountClient from './account-client'

export default async function AccountPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, phone, package, coaching_started_at, active')
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
        <div className="mb-10">
          <Link href={`/portal/${token}/resources`} className="text-[12px] text-[#999999] hover:text-[#3A3A3A] transition-colors">← Back to resources</Link>
          <h1 className="text-[30px] font-extrabold text-[#1A1A1A] tracking-tight leading-[1.1] mt-4 mb-2">Account and service</h1>
          <p className="text-[#6B6B6B] text-[15px]">Update your details, manage your coaching, and download your data.</p>
        </div>

        <AccountClient
          clientId={client.id}
          clientName={client.name}
          email={client.email}
          phone={client.phone}
          packageLabel={client.package ?? null}
          portalToken={token}
        />

        <div className="h-16" />
      </div>
    </div>
  )
}
