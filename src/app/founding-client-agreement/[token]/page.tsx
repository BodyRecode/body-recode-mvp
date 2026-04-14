import { createAdminClient } from '@/lib/supabase/admin'
import AgreementForm from './agreement-form'

export default async function FoundingClientAgreementPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: agreement } = await admin
    .from('founding_client_agreements')
    .select('id, status, lead_id, client_id')
    .eq('token', token)
    .maybeSingle()

  if (!agreement) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Body Recode™</p>
          <h1 className="text-xl font-bold text-white mb-3">Agreement not found</h1>
          <p className="text-stone-400 text-sm">This link is invalid or has expired. Please contact your coach.</p>
        </div>
      </div>
    )
  }

  if (agreement.status === 'signed') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-teal-400/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-4">Body Recode™</p>
          <h1 className="text-2xl font-bold text-white mb-3">Agreement already signed.</h1>
          <p className="text-stone-400 text-sm leading-relaxed">Your Founding Client Case Study Agreement has been completed. Your coach will be in touch with next steps.</p>
        </div>
      </div>
    )
  }

  // Resolve first name — direct entry uses client_id, funnel entry uses lead_id
  let firstName = 'there'

  if (agreement.client_id) {
    const { data: client } = await admin
      .from('clients')
      .select('name')
      .eq('id', agreement.client_id)
      .maybeSingle()
    firstName = client?.name?.split(' ')[0] ?? 'there'
  } else if (agreement.lead_id) {
    const { data: lead } = await admin
      .from('leads')
      .select('name')
      .eq('id', agreement.lead_id)
      .maybeSingle()
    firstName = lead?.name?.split(' ')[0] ?? 'there'
  }

  return <AgreementForm token={token} firstName={firstName} />
}
