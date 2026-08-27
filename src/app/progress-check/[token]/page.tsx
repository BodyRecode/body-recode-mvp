import { createAdminClient } from '@/lib/supabase/admin'
import { getCheckInWindowStatus, getWeekNumber } from '@/lib/weekly-checkin-questions'
import ProgressCheckForm from './progress-check-form'

// Client-facing Progress Check (delta re-assessment). Reached via the unique
// token link. Renders the short state re-assessment; on submit the Progress Read
// (Phase 2) is drafted for coach review.
export default async function ProgressCheckPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: pc } = await admin
    .from('progress_checks')
    .select('token, status, client_id, clients(name, onboarding_token, coaching_started_at)')
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

  const clientRel = pc.clients as unknown as
    | { name?: string; onboarding_token?: string; coaching_started_at?: string }
    | { name?: string; onboarding_token?: string; coaching_started_at?: string }[]
    | null
  const client = Array.isArray(clientRel) ? clientRel[0] : clientRel
  const clientName = client?.name ?? ''
  const firstName = clientName.split(' ')[0]

  // Ordering, offered rather than enforced. If her check-in window is open and
  // she has not submitted, the weekly one should go first - but she followed a
  // link her coach sent her, so refusing the page would lose the Progress Check
  // and rescue nothing. A line at the top does the same job without stranding
  // anyone who carries on.
  const window = getCheckInWindowStatus()
  let checkinFirstHref: string | null = null
  if (window.isOpen && client?.onboarding_token && client.coaching_started_at) {
    const week = getWeekNumber(client.coaching_started_at)
    const { count } = await admin
      .from('weekly_checkins')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', pc.client_id)
      .eq('week_number', week)
    if (!count) checkinFirstHref = `/portal/${client.onboarding_token}/checkin`
  }

  return (
    <ProgressCheckForm token={token} firstName={firstName} checkinFirstHref={checkinFirstHref} />
  )
}
