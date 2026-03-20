import { createAdminClient } from '@/lib/supabase/admin'
import { getWeekNumber, getFormType } from '@/lib/weekly-checkin-questions'
import CheckInForm from './checkin-form'

export default async function CheckInPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, coaching_started_at, created_at')
    .eq('checkin_token', token)
    .single()

  if (!client) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-6">Body Recode™</p>
          <h1 className="text-xl font-semibold text-white mb-2">Link not found</h1>
          <p className="text-stone-500 text-sm">This check-in link is invalid. Please contact your coach.</p>
        </div>
      </div>
    )
  }

  const startDate = client.coaching_started_at || client.created_at
  const weekNumber = getWeekNumber(startDate)
  const formType = getFormType(weekNumber)

  // Check if already submitted this week
  const { data: existing } = await admin
    .from('weekly_checkins')
    .select('id')
    .eq('client_id', client.id)
    .eq('week_number', weekNumber)
    .eq('form_type', formType)
    .single()

  if (existing) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-6">Body Recode™</p>
          <div className="w-14 h-14 bg-stone-900 border border-stone-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Already submitted</h1>
          <p className="text-stone-500 text-sm">Your check-in for this week has been received. Your coach will review it shortly.</p>
        </div>
      </div>
    )
  }

  return (
    <CheckInForm
      clientId={client.id}
      clientName={client.name}
      weekNumber={weekNumber}
      formType={formType}
    />
  )
}
