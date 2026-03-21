import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import HealthDeclarationForm from './health-declaration-form'

export default async function HealthDeclarationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, agreement_accepted_at, health_declaration_submitted_at')
    .eq('onboarding_token', token)
    .single()

  if (!client) return notFound()
  if (!client.agreement_accepted_at) redirect(`/portal/${token}`)
  if (client.health_declaration_submitted_at) redirect(`/portal/${token}`)

  return <HealthDeclarationForm clientId={client.id} clientName={client.name} portalToken={token} />
}
