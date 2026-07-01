import { createAdminClient } from '@/lib/supabase/admin'
import { getWeekNumber, getCheckInWindowStatus, isCheckinTestMode } from '@/lib/weekly-checkin-questions'
import CheckInForm from './checkin-form'
import { brand } from "@/config/tenant";

export default async function CheckInPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('*')
    .eq('checkin_token', token)
    .maybeSingle()

  if (!client) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-6"><a href={brand().marketingDomain} className="text-xs font-bold tracking-widest text-blue-500 uppercase">Body Recode™</a></p>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Link not found</h1>
          <p className="text-stone-500 text-sm">This check-in link is invalid. Please contact your coach.</p>
        </div>
      </div>
    )
  }

  const window = getCheckInWindowStatus()
  const testMode = isCheckinTestMode()
  // Per-client override set by coach via the Reopen button on the client
  // profile. When `checkin_window_override_until` is a future timestamp the
  // window is open for this client only, regardless of the global schedule.
  const overrideUntil = client.checkin_window_override_until ? new Date(client.checkin_window_override_until) : null
  const overrideActive = overrideUntil ? overrideUntil.getTime() > Date.now() : false

  // Window is closed — show next open time
  if (!window.isOpen && !testMode && !overrideActive) {
    const opensAt = window.opensAt.toLocaleString('en-AU', {
      timeZone: 'Australia/Brisbane',
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-6"><a href={brand().marketingDomain} className="text-xs font-bold tracking-widest text-blue-500 uppercase">Body Recode™</a></p>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Window not open</h1>
          <p className="text-stone-500 text-sm mb-4">The check-in window opens <span className="text-[#1A1A1A]">Friday at 6:00pm</span> and closes Sunday at 6:00pm Brisbane time.</p>
          <p className="text-stone-400 text-xs">Next window opens {opensAt} (Brisbane)</p>
        </div>
      </div>
    )
  }

  const startDate = client.coaching_started_at || client.created_at
  const weekNumber = getWeekNumber(startDate)
  const { formType } = window

  // Check if already submitted this window
  const { data: existing } = await admin
    .from('weekly_checkins')
    .select('id')
    .eq('client_id', client.id)
    .eq('week_number', weekNumber)
    .eq('form_type', formType)
    .single()

  if (existing) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-6"><a href={brand().marketingDomain} className="text-xs font-bold tracking-widest text-blue-500 uppercase">Body Recode™</a></p>
          <div className="w-14 h-14 bg-stone-100 border border-stone-200 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Already submitted</h1>
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
