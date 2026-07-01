import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCheckInWindowStatus, getWeekNumber, isCheckinTestMode } from '@/lib/weekly-checkin-questions'
import ClientHeader from '@/components/client-header'
import { isCoachEmail } from '@/lib/coach-auth'
import { brand } from '@/config/tenant'

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const t = brand()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('*, baselines(id), intake_invitations(status, token, kind), weekly_checkins(id, week_number, form_type, submitted_at), session_type')
    .eq('onboarding_token', token)
    .single()

  if (!client) return notFound()

  const userEmail = (user.email ?? '').toLowerCase()
  const clientEmail = (client.email ?? '').toLowerCase()
  if (userEmail !== clientEmail && !isCoachEmail(userEmail)) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A] flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-8">
          <img src={`${t.marketingDomain}${t.logoUrlLight}`} width="220" alt={t.name} className="mb-8" />
          <h1 className="text-xl font-bold text-[#1A1A1A] mb-3">Wrong account signed in</h1>
          <p className="text-sm text-[#6B6B6B] leading-relaxed mb-2">
            This portal link belongs to a different account. You&apos;re currently signed in as{' '}
            <span className="text-[#1A1A1A] font-medium">{user.email}</span>.
          </p>
          <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6">
            Sign out and sign in with the email address this link was sent to.
          </p>
          <form action="/portal/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#1B6DFC] hover:bg-[#5390FF] text-white font-bold text-sm rounded-2xl transition-colors"
            >
              Sign out and use a different email
            </button>
          </form>
          <p className="mt-5 text-xs text-[#999999] leading-relaxed">
            Want to keep your other session open? Open this link in a private/incognito window instead.
          </p>
        </div>
      </div>
    )
  }

  // is_active=true is the single source of truth for the current plan.
  // status='active' can match multiple rows (promote demotes via is_active
  // only) and break .maybeSingle(). See fix in /portal/[token]/my-plan/page.tsx.
  const { data: activeNutritionPlan } = await admin
    .from('nutrition_plans')
    .select('id, plan_name, last_review_at')
    .eq('client_id', client?.id ?? '')
    .eq('is_active', true)
    .maybeSingle()

  const { data: activeProgram } = await admin
    .from('programs')
    .select('id, block_name, last_review_at')
    .eq('client_id', client?.id ?? '')
    .eq('is_active', true)
    .maybeSingle()

  const { data: latestProgramReview } = await admin
    .from('program_reviews')
    .select('coach_notes, direction, reviewed_at')
    .eq('client_id', client?.id ?? '')
    .not('coach_notes', 'is', null)
    .order('reviewed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: latestNutritionReview } = await admin
    .from('nutrition_reviews')
    .select('coach_notes, reviewed_at')
    .eq('client_id', client?.id ?? '')
    .not('coach_notes', 'is', null)
    .order('reviewed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Load fixed slots for sessions card
  const { data: fixedSlots } = await admin
    .from('client_fixed_slots')
    .select('id, day_of_week, session_time, duration_minutes')
    .eq('client_id', client.id)
    .order('day_of_week', { ascending: true })

  // Foundational Reading (only the published one)
  const { data: publishedReadingRows } = await admin
    .from('cffs')
    .select('client_reading_published_at, body_state_classification')
    .eq('client_id', client.id)
    .eq('is_archived', false)
    .not('client_reading_published_at', 'is', null)
    .order('client_reading_published_at', { ascending: false })
    .limit(1)
  const publishedReading = publishedReadingRows?.[0] ?? null

  const firstName = client.name?.split(' ')[0] ?? 'there'
  const agreementDone = !!client.agreement_accepted_at
  const healthDone = !!client.health_declaration_submitted_at
  // Foundational vs supplementary invitations are now stored on the same
  // table distinguished by `kind`. Onboarding-side logic only cares about
  // the foundational intake. The supplementary intake is its own card below.
  const foundationalInvitations = (Array.isArray(client.intake_invitations) ? client.intake_invitations : [])
    .filter((i: { kind?: string }) => (i.kind ?? 'foundational') === 'foundational')
  const intakeDone = foundationalInvitations.some((i: { status: string }) => i.status === 'complete')
  const pendingInvitation = foundationalInvitations.find((i: { status: string; token: string }) => i.status !== 'complete') ?? null
  const intakeToken = pendingInvitation?.token ?? null

  // Pending supplementary intake (5-question follow-up). Surfaces as its own
  // card on the portal so the client sees it the next time they sign in.
  const pendingSupplementary = (Array.isArray(client.intake_invitations) ? client.intake_invitations : [])
    .find((i: { status: string; token: string; kind?: string }) => i.kind === 'supplementary' && i.status === 'pending') ?? null
  const baselineDone = Array.isArray(client.baselines) && client.baselines.length > 0
  const clearanceRequired = !!client.medical_clearance_required
  const clearanceReceived = !!client.medical_clearance_received_at
  const clearanceBlocking = clearanceRequired && !clearanceReceived

  const tasks = [
    {
      id: 'agreement',
      title: 'Coaching Agreement',
      description: 'Review and sign your coaching agreement before we begin.',
      done: agreementDone,
      href: `/portal/${token}/agreement`,
      available: true,
      notice: null,
    },
    {
      id: 'health',
      title: 'Health Declaration',
      description: 'Complete your health and readiness screening.',
      done: healthDone,
      href: `/portal/${token}/health-declaration`,
      available: agreementDone,
      notice: null,
    },
    ...(clearanceRequired ? [{
      id: 'clearance',
      title: 'Medical Clearance',
      description: 'Download the clearance form, take it to your GP, and upload the completed form here.',
      done: clearanceReceived,
      href: clearanceReceived ? null : `/portal/${token}/medical-clearance`,
      available: healthDone,
      notice: null,
    }] : []),
    {
      id: 'intake',
      title: 'Foundational Intake',
      description: 'Complete your full intake. This informs your entire coaching structure.',
      done: intakeDone,
      href: intakeToken ? `/intake/${intakeToken}` : null,
      available: healthDone && !clearanceBlocking,
      notice: clearanceBlocking ? 'Unlocks once medical clearance is received.' : null,
    },
    {
      id: 'baseline',
      title: 'Baseline Documentation',
      description: 'Submit your baseline measurements and progress photos.',
      done: baselineDone,
      href: client.baseline_token ? `/baseline/${client.baseline_token}` : null,
      available: intakeDone,
    },
  ]

  const allOnboardingDone = agreementDone && healthDone && intakeDone && baselineDone && !clearanceBlocking

  const recentCheckins = Array.isArray(client.weekly_checkins)
    ? [...client.weekly_checkins].sort((a: { submitted_at: string }, b: { submitted_at: string }) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()).slice(0, 3)
    : []

  // Per-check-in coach feedback lookup. Only the 3 recent IDs, so cheap.
  const recentCheckinIds = (recentCheckins as Array<{ id?: string }>).map(c => c.id).filter(Boolean) as string[]
  const { data: recentFeedbackRows } = recentCheckinIds.length > 0
    ? await admin
        .from('weekly_checkin_feedback')
        .select('weekly_checkin_id')
        .in('weekly_checkin_id', recentCheckinIds)
    : { data: [] as Array<{ weekly_checkin_id: string }> }
  const checkinIdsWithFeedback = new Set((recentFeedbackRows ?? []).map(r => r.weekly_checkin_id))

  const now = Date.now()
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  const programReviewedThisWeek = activeProgram?.last_review_at
    ? (now - new Date(activeProgram.last_review_at).getTime()) < sevenDays
    : false
  const nutritionReviewedThisWeek = activeNutritionPlan?.last_review_at
    ? (now - new Date(activeNutritionPlan.last_review_at).getTime()) < sevenDays
    : false

  const checkinWindow = getCheckInWindowStatus()
  const testMode = isCheckinTestMode()
  // Per-client override (set by coach via the Reopen button on the client
  // profile). When `checkin_window_override_until` is a future timestamp the
  // window is open for this client only, regardless of the global Fri-Sun
  // schedule. Used when a client missed their window and the coach wants to
  // let them complete it ad-hoc.
  const overrideUntil = client.checkin_window_override_until ? new Date(client.checkin_window_override_until) : null
  const overrideActive = overrideUntil ? overrideUntil.getTime() > Date.now() : false
  const windowOpen = checkinWindow.isOpen || testMode || overrideActive
  const startDate = client.coaching_started_at || client.created_at
  const weekNumber = startDate ? getWeekNumber(startDate) : null

  const thisWeekFormADone = weekNumber && Array.isArray(client.weekly_checkins)
    ? !!client.weekly_checkins.find((c: { week_number: number; form_type: string }) => c.week_number === weekNumber && c.form_type === 'A')
    : false
  const thisWeekFormBDone = weekNumber && Array.isArray(client.weekly_checkins)
    ? !!client.weekly_checkins.find((c: { week_number: number; form_type: string }) => c.week_number === weekNumber && c.form_type === 'B')
    : false

  // In test mode, both forms need to be submitted before showing "done".
  // In normal mode, the per-client week contains exactly ONE check-in window
  // (Fri 6pm → Sun 6:30pm), and whichever form was rotated to that window is
  // what the client submitted. Checking against the CURRENT rotation
  // (checkinWindow.formType) is wrong when the system has moved on to the
  // next form before the per-client week ends — Amanda submitted Form A on
  // Sun 5/24 in her per-client week 3, then the system rotated to Form B on
  // Mon 5/25, and the portal started telling her she "missed" because she
  // had no Form B for her week 3. Fix: a per-client week is complete if
  // ANY check-in row exists for that week_number.
  const checkinDoneThisWeek = testMode
    ? (thisWeekFormADone && thisWeekFormBDone)
    : (thisWeekFormADone || thisWeekFormBDone)

  // Determine which form to show next.
  // Priority: smart-Reopen override_form (2026-06-21) > test-mode flip >
  // current global rotation. The override_form is set by the coach Reopen
  // API when the client's last form matches the current rotation (i.e.
  // they missed the previous window and the catch-up would otherwise land
  // on the same form they just did).
  const smartOverrideForm: 'A' | 'B' | null =
    (overrideActive && (client.checkin_window_override_form === 'A' || client.checkin_window_override_form === 'B'))
      ? client.checkin_window_override_form
      : null
  const activeFormType: 'A' | 'B' = smartOverrideForm
    ?? (testMode && checkinWindow.formType === 'A' && thisWeekFormADone && !thisWeekFormBDone
      ? 'B'
      : testMode && checkinWindow.formType === 'B' && thisWeekFormBDone && !thisWeekFormADone
      ? 'A'
      : checkinWindow.formType)

  const opensAt = checkinWindow.opensAt.toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const closesAt = checkinWindow.closesAt.toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  // Is it Sunday? (closing day - show urgency)
  const nowDate = new Date()
  const brisbaneDay = new Date(nowDate.getTime() + 10 * 60 * 60 * 1000).getUTCDay()
  const isClosingDay = brisbaneDay === 0 // Sunday

  // Did client miss last week's check-in? Window closed and no submission for current week
  const missedCheckin = !windowOpen && !checkinDoneThisWeek && weekNumber && weekNumber > 1

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-[30px] font-extrabold text-[#1A1A1A] tracking-tight leading-[1.1] mb-2">Welcome, {firstName}</h1>
          <p className="text-[#6B6B6B] text-[15px]">Your coaching portal, everything in one place.</p>
        </div>

        {/* Onboarding tasks */}
        {!allOnboardingDone && (
          <div className="mb-10">
            <div className="flex items-center gap-2.5 mb-4"><span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" /><p className="text-[11px] font-bold tracking-widest text-white uppercase">Getting started</p></div>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-2xl border p-4 transition-colors ${
                    task.done
                      ? 'border-blue-200 bg-blue-50'
                      : task.available
                      ? 'border-[#E5E5E5] bg-[#FFFFFF] hover:border-[#D4D4D4]'
                      : 'border-[#E5E5E5] bg-[#FFFFFF]/50 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center ${task.done ? 'bg-[#1B6DFC]' : 'border-2 border-[#D4D4D4]'}`}>
                      {task.done && (
                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold mb-0.5 ${task.done ? 'text-[#1B6DFC]' : 'text-[#1A1A1A]'}`}>{task.title}</p>
                      <p className="text-xs text-[#999999]">{task.description}</p>
                      {!task.done && task.notice && (
                        <p className="mt-2 text-xs text-amber-700/80">{task.notice}</p>
                      )}
                      {!task.done && task.available && task.href && !task.notice && (
                        <Link
                          href={task.href}
                          className="inline-block mt-3 text-xs font-bold text-black bg-[#1B6DFC] px-4 py-2 rounded-xl hover:bg-[#5390FF] transition-colors"
                        >
                          Start →
                        </Link>
                      )}
                      {!task.done && task.available && !task.href && !task.notice && (
                        <p className="mt-2 text-xs text-[#999999]">Your coach will send this link when ready.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending supplementary intake - shown when the coach has added a
            follow-up intake task. Surfaces right at the top of post-onboarding
            content so the client sees and completes it on next sign-in. */}
        {pendingSupplementary && (
          <div className="mb-10">
            <div className="flex items-center gap-2.5 mb-4"><span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" /><p className="text-[11px] font-bold tracking-widest text-white uppercase">A quick follow-up from Kade</p></div>
            <Link
              href={`/intake-supplement/${pendingSupplementary.token}`}
              className="block rounded-2xl border border-blue-200 bg-blue-50 p-5 hover:border-[#1B6DFC]/60 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A1A] mb-1">5 follow-up questions</p>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed">
                    A few new questions have been added since you completed your original intake — covering medications and dietary context. About 3 minutes.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">Start →</span>
              </div>
            </Link>
          </div>
        )}

        {/* Foundational Reading - shown the moment Kade publishes it */}
        {publishedReading && (
          <div className="mb-10">
            <div className="flex items-center gap-2.5 mb-4"><span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" /><p className="text-[11px] font-bold tracking-widest text-white uppercase">Your Reading</p></div>
            <Link
              href={`/portal/${token}/foundational-reading`}
              className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors mb-3"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Foundational Reading</p>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed">
                    A read of how your body is currently organising itself
                    {publishedReading.body_state_classification ? `, currently in ${publishedReading.body_state_classification}.` : '.'}
                  </p>
                </div>
                <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">View →</span>
              </div>
            </Link>
            {client.medications_reading_published_at && (
              <Link
                href={`/portal/${token}/medications-reading`}
                className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Medications Reading</p>
                    <p className="text-xs text-[#6B6B6B] leading-relaxed">
                      What you&apos;re currently taking, why it matters for your coaching, and what we account for in your program and nutrition.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">View →</span>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Sessions - face-to-face clients */}
        {allOnboardingDone && client.session_type === 'face_to_face' && (
          <div className="mb-10">
            <div className="flex items-center gap-2.5 mb-4"><span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" /><p className="text-[11px] font-bold tracking-widest text-white uppercase">Sessions</p></div>
            <Link
              href={`/portal/${token}/sessions`}
              className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Your face-to-face sessions</p>
                  {(fixedSlots ?? []).length > 0 ? (
                    <div className="space-y-0.5 mt-1">
                      {(fixedSlots ?? []).map(slot => (
                        <p key={slot.id} className="text-xs text-[#6B6B6B]">
                          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][slot.day_of_week]}s · {new Date(`1970-01-01T${slot.session_time}`).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })} · {slot.duration_minutes} min
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#999999]">Fixed slot not yet assigned</p>
                  )}
                </div>
                <span className="text-xs font-bold text-[#1B6DFC] ml-4">View →</span>
              </div>
            </Link>
          </div>
        )}

        {/* Weekly check-in task. Gated on active program existence per
            13_FEATURE_REGISTRY.md "Weekly check-in program gate". The check-in
            evaluates training response, so it only opens once a program exists. */}
        {allOnboardingDone && client.coaching_started_at && (
          <div className="mb-10">
            <div className="flex items-center gap-2.5 mb-4"><span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" /><p className="text-[11px] font-bold tracking-widest text-white uppercase">This week</p></div>
            {!activeProgram ? (
              <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5">
                <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Your program is being built</p>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">Weekly check-ins begin once your training program is in place. Your coach is reviewing your intake and baseline now. We will let you know the moment your program is ready.</p>
              </div>
            ) : checkinDoneThisWeek ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-5 h-5 rounded-full bg-[#1B6DFC] flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1B6DFC]">Check-in done for this week</p>
                    <p className="text-xs text-[#999999] mt-0.5">Week {weekNumber} submitted. Your coach will review shortly.</p>
                  </div>
                </div>
                <div className="border-t border-blue-100 pt-3 flex items-center justify-between">
                  <p className="text-xs text-[#999999]">Next check-in opens {opensAt}.</p>
                  {recentCheckins.length > 1 && (
                    <p className="text-xs text-[#999999]">{recentCheckins.length} week streak</p>
                  )}
                </div>
              </div>
            ) : windowOpen ? (
              <Link
                href={`/portal/${token}/checkin`}
                className={`block rounded-2xl border p-5 transition-colors ${isClosingDay ? 'border-amber-500/50 bg-amber-500/5 hover:border-amber-400/60' : 'border-[#E5E5E5] bg-[#FFFFFF] hover:border-[#1B6DFC]/40 hover:bg-blue-50'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Weekly check-in, Form {activeFormType}</p>
                    {isClosingDay ? (
                      <p className="text-xs text-amber-700 font-medium">Closes today at 6:30pm Brisbane time. Do it now.</p>
                    ) : (
                      <p className="text-xs text-[#6B6B6B]">Week {weekNumber} · Closes {closesAt}.</p>
                    )}
                  </div>
                  <span className={`text-xs font-bold ml-4 ${isClosingDay ? 'text-amber-700' : 'text-[#1B6DFC]'}`}>Start →</span>
                </div>
              </Link>
            ) : missedCheckin ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-red-200/50 bg-red-50 p-5">
                  <p className="text-sm font-semibold text-red-700 mb-1">You missed last week&apos;s check-in</p>
                  <p className="text-xs text-red-700/70">The window closed without a submission. Your coach won&apos;t have data for this week.</p>
                </div>
                <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF]/50 p-4">
                  <p className="text-xs text-[#999999]">Next window opens {opensAt}.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF]/50 p-5">
                <p className="text-sm font-semibold text-[#999999] mb-1">Check-in window closed</p>
                <p className="text-xs text-[#999999]">Opens {opensAt} every Friday.</p>
              </div>
            )}
          </div>
        )}

        {/* Preview header during onboarding */}
        {!allOnboardingDone && (
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-2"><span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" /><p className="text-[11px] font-bold tracking-widest text-white uppercase">Your portal</p></div>
            <p className="text-xs text-[#999999] leading-relaxed">A look at what unlocks as your coach builds your plan. You can take measurements anytime.</p>
          </div>
        )}

        {/* Training */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4"><span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" /><p className="text-[11px] font-bold tracking-widest text-white uppercase">Training</p></div>
            {activeProgram ? (
              <div className="space-y-3">
                {programReviewedThisWeek ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#1B6DFC] flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1B6DFC]">Training check-in submitted</p>
                        <p className="text-xs text-[#999999] mt-0.5">Your coach will review shortly.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={`/portal/${token}/training`}
                    className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Weekly training check-in</p>
                        <p className="text-xs text-[#6B6B6B]">How did your sessions go this week?</p>
                      </div>
                      <span className="text-xs font-bold text-[#1B6DFC] ml-4">Start →</span>
                    </div>
                  </Link>
                )}
                <Link
                  href={`/portal/${token}/program`}
                  className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF]/50 p-4 hover:border-[#E5E5E5] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#3A3A3A]">View your program</p>
                      <p className="text-xs text-[#999999] mt-0.5">{activeProgram.block_name}</p>
                    </div>
                    <span className="text-xs text-[#999999] ml-4">→</span>
                  </div>
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF]/50 p-5">
                <p className="text-sm font-semibold text-[#6B6B6B] mb-1">Your program is being built</p>
                <p className="text-xs text-[#999999] leading-relaxed">Your coach is putting your training program together based on your intake. You will see it here once it is ready.</p>
              </div>
            )}
        </div>

        {/* Nutrition */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4"><span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" /><p className="text-[11px] font-bold tracking-widest text-white uppercase">Nutrition</p></div>
            {activeNutritionPlan ? (
              <div className="space-y-3">
                {nutritionReviewedThisWeek ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#1B6DFC] flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1B6DFC]">Nutrition check-in submitted</p>
                        <p className="text-xs text-[#999999] mt-0.5">Your coach will review shortly.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={`/portal/${token}/nutrition`}
                    className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Weekly nutrition check-in</p>
                        <p className="text-xs text-[#6B6B6B]">How are you going with your plan?</p>
                      </div>
                      <span className="text-xs font-bold text-[#1B6DFC] ml-4">Start →</span>
                    </div>
                  </Link>
                )}
                <Link
                  href={`/portal/${token}/my-plan`}
                  className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF]/50 p-4 hover:border-[#E5E5E5] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#3A3A3A]">View your nutrition plan</p>
                      <p className="text-xs text-[#999999] mt-0.5">{activeNutritionPlan.plan_name}</p>
                    </div>
                    <span className="text-xs text-[#999999] ml-4">→</span>
                  </div>
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF]/50 p-5">
                <p className="text-sm font-semibold text-[#6B6B6B] mb-1">Your nutrition plan is being built</p>
                <p className="text-xs text-[#999999] leading-relaxed">Your coach is building your nutrition plan. You will see it here once it is ready.</p>
              </div>
            )}
        </div>

        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4"><span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" /><p className="text-[11px] font-bold tracking-widest text-white uppercase">Progress</p></div>
          <Link
            href={`/portal/${token}/progress`}
            className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF]/50 p-4 hover:border-[#E5E5E5] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#3A3A3A]">Measurements</p>
                <p className="text-xs text-[#999999] mt-0.5">Track your bodyweight, waist, hips and chest over time.</p>
              </div>
              <span className="text-xs text-[#999999] ml-4">→</span>
            </div>
          </Link>
        </div>

        {/* Health Markers - always-on self-serve blood test upload */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4"><span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" /><p className="text-[11px] font-bold tracking-widest text-white uppercase">Health Markers</p></div>
          <Link
            href={`/portal/${token}/bloods`}
            className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF]/50 p-4 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#3A3A3A]">Blood test results</p>
                <p className="text-xs text-[#999999] mt-0.5">Have recent blood work? Upload a copy so your coach can factor it into your plan.</p>
              </div>
              <span className="text-xs text-[#999999] ml-4">→</span>
            </div>
          </Link>
        </div>

        {/* Coach feedback */}
        {(latestProgramReview?.coach_notes || latestNutritionReview?.coach_notes) && (
          <div className="mb-10">
            <div className="flex items-center gap-2.5 mb-4"><span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" /><p className="text-[11px] font-bold tracking-widest text-white uppercase">From your coach</p></div>
            <div className="space-y-3">
              {latestProgramReview?.coach_notes && (
                <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-[#1B6DFC] uppercase tracking-widest">Training</p>
                    <p className="text-xs text-[#999999]">{new Date(latestProgramReview.reviewed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <p className="text-sm text-[#3A3A3A] leading-relaxed">{latestProgramReview.coach_notes}</p>
                </div>
              )}
              {latestNutritionReview?.coach_notes && (
                <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-[#1B6DFC] uppercase tracking-widest">Nutrition</p>
                    <p className="text-xs text-[#999999]">{new Date(latestNutritionReview.reviewed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <p className="text-sm text-[#3A3A3A] leading-relaxed">{latestNutritionReview.coach_notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent check-ins */}
        {recentCheckins.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold tracking-widest text-[#999999] uppercase">Recent check-ins</p>
              <Link href={`/portal/${token}/checkin-history`} className="text-xs text-[#1B6DFC] hover:text-[#1B6DFC] transition-colors">View all →</Link>
            </div>
            <div className="space-y-2">
              {recentCheckins.map((c: { id?: string; week_number: number; form_type: string; submitted_at: string }, i: number) => {
                const hasFeedback = c.id ? checkinIdsWithFeedback.has(c.id) : false
                return (
                  <Link
                    key={c.id ?? i}
                    href={`/portal/${token}/checkin/${c.week_number}/${c.form_type.toLowerCase()}`}
                    className="flex items-center justify-between rounded-xl bg-[#FFFFFF] px-4 py-3 hover:bg-[#E5E5E5] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <p className="text-sm text-[#1A1A1A] font-medium">Week {c.week_number}, Form {c.form_type}</p>
                      {hasFeedback && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B6DFC] bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">Coach response</span>
                      )}
                    </div>
                    <p className="text-xs text-[#999999] ml-3 shrink-0">{new Date(c.submitted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Resources */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4"><span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" /><p className="text-[11px] font-bold tracking-widest text-white uppercase">Resources</p></div>
          <Link
            href={`/portal/${token}/resources`}
            className="flex items-center justify-between w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl px-5 py-4 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors mb-3"
          >
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">All resources</p>
              <p className="text-xs text-[#999999] mt-0.5">Progress, readings, glossary, practical guides, message your coach, account.</p>
            </div>
            <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">View →</span>
          </Link>
          <a
            href={`${t.appDomain}/coaching-guide`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl px-5 py-4 hover:border-[#E5E5E5] transition-colors mb-3"
          >
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">Active Coaching Client Guide</p>
              <p className="text-xs text-[#999999] mt-0.5">How the coaching process works and what to expect each week.</p>
            </div>
            <svg className="w-5 h-5 text-[#6B6B6B] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <Link
            href={`/portal/${token}/feedback`}
            className="flex items-center justify-between w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl px-5 py-4 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">Share feedback</p>
              <p className="text-xs text-[#999999] mt-0.5">Tell us what is working, what is not, what would help.</p>
            </div>
            <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">Open →</span>
          </Link>
        </div>

        <div className="h-10" />{/* spacer for fixed footer */}
      </div>
    </div>
  )
}
