import { createAdminClient } from '@/lib/supabase/admin'
import ProgressCheckForm from './progress-check-form'

// Client-facing Progress Check (delta re-assessment). Reached via the unique
// token link. Renders the short state re-assessment; on submit the Progress Read
// (Phase 2) is drafted for coach review.
export default async function ProgressCheckPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: pc } = await admin
    .from('progress_checks')
    .select('token, status, clients(name)')
    .eq('token', token)
    .maybeSingle()

  if (!pc) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Link not found</h1>
          <p className="text-[#6B6B6B] text-sm">This Progress Check link is invalid or has expired. Please contact your coach.</p>
        </div>
      </div>
    )
  }

  if (pc.status === 'complete') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-[#1B6DFC]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-6 h-6 text-[#1B6DFC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Progress Check received</h1>
          <p className="text-[#6B6B6B] text-sm leading-relaxed">Thanks. Kade will read this alongside your recent check-ins and send through your Progress Read.</p>
        </div>
      </div>
    )
  }

  const clientRel = pc.clients as unknown as { name?: string } | { name?: string }[] | null
  const clientName = (Array.isArray(clientRel) ? clientRel[0]?.name : clientRel?.name) ?? ''
  const firstName = clientName.split(' ')[0]
  return <ProgressCheckForm token={token} firstName={firstName} />
}
