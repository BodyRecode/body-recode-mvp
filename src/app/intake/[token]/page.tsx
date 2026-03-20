import { createAdminClient } from '@/lib/supabase/admin'
import IntakeForm from './intake-form'

export default async function IntakePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: invitation } = await admin
    .from('intake_invitations')
    .select('*, clients(name)')
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

  if (invitation.status === 'complete') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-stone-900 mb-2">Already submitted</h1>
          <p className="text-stone-500 text-sm">Your intake has been completed. Your coach will review it and be in touch shortly.</p>
        </div>
      </div>
    )
  }

  const clientName = (invitation.clients as { name: string } | null)?.name

  return <IntakeForm token={token} clientName={clientName} />
}
