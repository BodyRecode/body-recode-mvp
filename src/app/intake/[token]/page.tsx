import { createAdminClient } from '@/lib/supabase/admin'
import IntakeForm from './intake-form'

export default async function IntakePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: invitation } = await admin
    .from('intake_invitations')
    .select('*, clients(name, phone, date_of_birth, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, onboarding_token, health_declaration_data)')
    .eq('token', token)
    .single()

  if (!invitation) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold text-stone-900 mb-2">Link not found</h1>
          <p className="text-stone-500 text-sm">This intake link is invalid or has expired. Please contact your coach.</p>
        </div>
      </div>
    )
  }

  const clientRecord = invitation.clients as {
    name: string
    phone: string | null
    date_of_birth: string | null
    emergency_contact_name: string | null
    emergency_contact_relationship: string | null
    emergency_contact_phone: string | null
    onboarding_token: string | null
    health_declaration_data: {
      personalDetails?: { dob?: string; phone?: string }
      emergencyContact?: { name?: string; relationship?: string; phone?: string }
    } | null
  } | null
  const portalToken = clientRecord?.onboarding_token ?? null

  // Single source of truth for identity. The client enters these once in the
  // Health Declaration (the first onboarding form); they are promoted to
  // first-class `clients` columns there. The intake reads them here and asks
  // the client to CONFIRM rather than re-type. We fall back to the health
  // declaration JSONB for any client onboarded before the canonical columns
  // existed, so nothing regresses for in-flight clients.
  const hd = clientRecord?.health_declaration_data ?? null
  const identity: Record<string, string> = {
    full_name: clientRecord?.name ?? '',
    date_of_birth: clientRecord?.date_of_birth ?? hd?.personalDetails?.dob ?? '',
    mobile_number: clientRecord?.phone ?? hd?.personalDetails?.phone ?? '',
    emergency_contact_name: clientRecord?.emergency_contact_name ?? hd?.emergencyContact?.name ?? '',
    emergency_contact_relationship: clientRecord?.emergency_contact_relationship ?? hd?.emergencyContact?.relationship ?? '',
    emergency_contact_phone: clientRecord?.emergency_contact_phone ?? hd?.emergencyContact?.phone ?? '',
  }

  if (invitation.status === 'complete') {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-[#1B6DFC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-4">Submitted</p>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-3 tracking-tight">Already submitted</h1>
          <p className="text-stone-400 text-[15px] leading-relaxed mb-8">
            Your intake has been completed. Your coach will review it and be in touch shortly.
          </p>
          {portalToken && (
            <a
              href={`/portal/${portalToken}`}
              className="inline-block px-6 py-3 bg-[#1B6DFC] hover:bg-blue-300 text-white font-bold text-sm rounded-2xl transition-colors"
            >
              Back to your portal
            </a>
          )}
        </div>
      </div>
    )
  }

  return <IntakeForm token={token} clientName={clientRecord?.name} portalToken={portalToken} identity={identity} />
}
