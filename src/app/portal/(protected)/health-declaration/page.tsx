import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import HealthDeclarationForm from './health-declaration-form'

export default async function HealthDeclarationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, agreement_accepted_at, health_declaration_submitted_at')
    .eq('portal_user_id', user!.id)
    .single()

  if (!client) redirect('/portal/dashboard')
  if (!client.agreement_accepted_at) redirect('/portal/agreement')
  if (client.health_declaration_submitted_at) redirect('/portal/dashboard')

  return <HealthDeclarationForm clientId={client.id} clientName={client.name} />
}
