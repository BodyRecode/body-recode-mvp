import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import AgreementForm from './agreement-form'
import { requirePortalClient } from '@/lib/portal-guard'

export default async function AgreementPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const client = await requirePortalClient(token, 'agreement_accepted_at')

  if (!client) return notFound()
  if (client.agreement_accepted_at) redirect(`/portal/${token}`)

  return <AgreementForm clientId={client.id} clientName={client.name} portalToken={token} />
}
