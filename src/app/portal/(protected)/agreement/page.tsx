import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AgreementForm from './agreement-form'

export default async function AgreementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, agreement_accepted_at')
    .eq('portal_user_id', user!.id)
    .single()

  if (!client) redirect('/portal/dashboard')
  if (client.agreement_accepted_at) redirect('/portal/dashboard')

  return <AgreementForm clientId={client.id} clientName={client.name} clientEmail={client.email} />
}
