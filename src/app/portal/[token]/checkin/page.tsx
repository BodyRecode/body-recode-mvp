import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { getWeekNumber, getCheckInWindowStatus, isCheckinTestMode } from '@/lib/weekly-checkin-questions'
import CheckInForm from '@/app/checkin/[token]/checkin-form'

export default async function PortalCheckinPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ form?: string }>
}) {
  const { token } = await params
  const sp = await searchParams
  // Coach-supplied form override: ?form=a or ?form=b lets the coach pin the
  // form to the one the client missed when their per-client rotation has
  // drifted out of phase with the global rotation. Used together with the
  // checkin_window_override_until 24h reopen button. Validated to A or B
  // and ignored otherwise.
  const overrideForm: 'A' | 'B' | null = sp?.form
    ? (sp.form.toUpperCase() === 'A' ? 'A' : sp.form.toUpperCase() === 'B' ? 'B' : null)
    : null
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
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-xs font-bold tracking-widest text-[#1B6DFC] uppercase mb-6">
            <a href="https://bodyrecode.au" className="text-xs font-bold tracking-widest text-[#1B6DFC] uppercase">Body Recode™</a>
          </p>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Your program is being built</h1>
          <p className="text-[#999999] text-sm mb-4">Weekly check-ins begin once your training program is in place. Your coach is reviewing your intake and baseline now.</p>
          <p className="text-[#999999] text-xs mb-8">We will let you know the moment your program is ready.</p>
          <a href={`/portal/${token}`} className="text-xs font-semibold text-[#1B6DFC] hover:text-[#5390FF] transition-colors">← Back to portal</a>
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
          <p className="text-xs font-bold tracking-widest text-[#1B6DFC] uppercase mb-6">
            <a href="https://bodyrecode.au" className="text-xs font-bold tracking-widest text-[#1B6DFC] uppercase">Body Recode™</a>
          </p>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Window not open</h1>
          <p className="text-[#999999] text-sm mb-4">The check-in window opens <span className="text-[#1A1A1A]">Friday at 6:00pm</span> and closes Sunday at 6:00pm Brisbane time.</p>
          <p className="text-[#999999] text-xs mb-8">Next window opens {opensAt} (Brisbane)</p>
          <a href={`/portal/${token}`} className="text-xs font-semibold text-[#1B6DFC] hover:text-[#5390FF] transition-colors">← Back to portal</a>
        </div>
      </div>
    )
  }

  const startDate = client.coaching_started_at || client.created_at
  const weekNumber = getWeekNumber(startDate)
  // Form-pick priority:
  //   1. ?form= URL override (manual coach hand-off)
  //   2. checkin_window_override_form (smart Reopen — 2026-06-21) — set
  //      automatically by the Reopen API when the client missed a window
  //      and the global rotation has since ticked past it
  //   3. Current global rotation
  const overrideFormDb: 'A' | 'B' | null =
    (overrideActive && (client.checkin_window_override_form === 'A' || client.checkin_window_override_form === 'B'))
      ? client.checkin_window_override_form
      : null
  let formType: 'A' | 'B' = overrideForm ?? overrideFormDb ?? window.formType

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
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-xs font-bold tracking-widest text-[#1B6DFC] uppercase mb-6">
            <a href="https://bodyrecode.au" className="text-xs font-bold tracking-widest text-[#1B6DFC] uppercase">Body Recode™</a>
          </p>
          <div className="w-14 h-14 bg-[#FFFFFF] border border-[#E5E5E5] rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#1B6DFC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Already submitted</h1>
          <p className="text-[#999999] text-sm mb-8">Your check-in for this week has been received. Your coach will review it shortly.</p>
          <a href={`/portal/${token}`} className="text-xs font-semibold text-[#1B6DFC] hover:text-[#5390FF] transition-colors">← Back to portal</a>
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
