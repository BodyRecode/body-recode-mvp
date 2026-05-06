import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { getWeekNumber, getCheckInWindowStatus } from '@/lib/weekly-checkin-questions'
import CheckInForm from '@/app/checkin/[token]/checkin-form'

export default async function PortalCheckinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('*')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) return notFound()

  // Gate per 13_FEATURE_REGISTRY.md "Weekly check-in program gate".
  // The check-in evaluates training response, so requires an active program.
  const { data: activeProgram } = await admin
    .from('programs')
    .select('id')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!activeProgram) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-xs font-bold tracking-widest text-[#14b8a6] uppercase mb-6">
            <a href="https://bodyrecode.au" className="text-xs font-bold tracking-widest text-[#14b8a6] uppercase">Body Recode™</a>
          </p>
          <h1 className="text-xl font-semibold text-white mb-2">Your program is being built</h1>
          <p className="text-[#57534e] text-sm mb-4">Weekly check-ins begin once your training program is in place. Your coach is reviewing your intake and baseline now.</p>
          <p className="text-[#3c3835] text-xs mb-8">We will let you know the moment your program is ready.</p>
          <a href={`/portal/${token}`} className="text-xs font-semibold text-[#14b8a6] hover:text-[#5eead4] transition-colors">← Back to portal</a>
        </div>
      </div>
    )
  }

  const window = getCheckInWindowStatus()
  const testMode = process.env.CHECKIN_TEST_MODE?.trim().toLowerCase() === 'true'

  if (!window.isOpen && !testMode) {
    const opensAt = window.opensAt.toLocaleString('en-AU', {
      timeZone: 'Australia/Brisbane',
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-xs font-bold tracking-widest text-[#14b8a6] uppercase mb-6">
            <a href="https://bodyrecode.au" className="text-xs font-bold tracking-widest text-[#14b8a6] uppercase">Body Recode™</a>
          </p>
          <h1 className="text-xl font-semibold text-white mb-2">Window not open</h1>
          <p className="text-[#57534e] text-sm mb-4">The check-in window opens <span className="text-white">Friday at 6:00pm</span> and closes Sunday at 6:00pm Brisbane time.</p>
          <p className="text-[#3c3835] text-xs mb-8">Next window opens {opensAt} (Brisbane)</p>
          <a href={`/portal/${token}`} className="text-xs font-semibold text-[#14b8a6] hover:text-[#5eead4] transition-colors">← Back to portal</a>
        </div>
      </div>
    )
  }

  const startDate = client.coaching_started_at || client.created_at
  const weekNumber = getWeekNumber(startDate)
  let { formType } = window

  const { data: existing } = await admin
    .from('weekly_checkins')
    .select('id')
    .eq('client_id', client.id)
    .eq('week_number', weekNumber)
    .eq('form_type', formType)
    .single()

  // In test mode: if current form already submitted, flip to the other form
  if (existing && testMode) {
    const otherType: 'A' | 'B' = formType === 'A' ? 'B' : 'A'
    const { data: otherExisting } = await admin
      .from('weekly_checkins')
      .select('id')
      .eq('client_id', client.id)
      .eq('week_number', weekNumber)
      .eq('form_type', otherType)
      .single()
    if (!otherExisting) {
      formType = otherType
    }
  }

  const alreadyDone = existing && !(testMode && formType !== window.formType)

  if (alreadyDone) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-xs font-bold tracking-widest text-[#14b8a6] uppercase mb-6">
            <a href="https://bodyrecode.au" className="text-xs font-bold tracking-widest text-[#14b8a6] uppercase">Body Recode™</a>
          </p>
          <div className="w-14 h-14 bg-[#111110] border border-[#1c1917] rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#14b8a6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Already submitted</h1>
          <p className="text-[#57534e] text-sm mb-8">Your check-in for this week has been received. Your coach will review it shortly.</p>
          <a href={`/portal/${token}`} className="text-xs font-semibold text-[#14b8a6] hover:text-[#5eead4] transition-colors">← Back to portal</a>
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
