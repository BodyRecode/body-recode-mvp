import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import AgreementForm from './agreement-form'

export default async function AgreementPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, agreement_accepted_at')
    .eq('onboarding_token', token)
    .single()

  if (!client) return notFound()
  if (client.agreement_accepted_at) redirect(`/portal/${token}`)

  return <AgreementForm clientId={client.id} clientName={client.name} portalToken={token} />
}
