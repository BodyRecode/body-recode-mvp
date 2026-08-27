import { ListChecks, MessageCircle, FileText, CalendarDays, NotebookPen, LayoutGrid, Dumbbell, Salad, LineChart, Activity, BookOpen, Sunrise, Snowflake, Pill, type LucideIcon } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCheckInWindowStatus, getWeekNumber, isCheckinTestMode } from '@/lib/weekly-checkin-questions'
import ClientHeader from '@/components/client-header'
import { isCoachEmail } from '@/lib/coach-auth'
import { getGpRequestUrl } from '@/lib/gp-request'
import { brand, coach } from '@/config/tenant'

function SectionLabel({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-8 h-8 rounded-lg bg-[#1B6DFC]/10 flex items-center justify-center text-[#1B6DFC]"><Icon size={16} strokeWidth={2.5} /></span>
      <p className="text-[10px] font-bold tracking-widest text-[#1B6DFC] uppercase" style={{ letterSpacing: '0.18em' }}>{text}</p>
    </div>
  )
}

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const t = brand()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('*, baselines(id), intake_invitations(status, token, kind), weekly_checkins(id, week_number, form_type, submitted_at), progress_checks(id, token, status, created_at), session_type')
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

  const { count: activeRecoveryCount } = await admin
    .from('recovery_protocol_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', client?.id ?? '')
    .eq('status', 'active')

  const { count: activeSupplementCount } = await admin
    .from('supplement_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', client?.id ?? '')
    .eq('status', 'active')

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

  // Gender drives which baseline-bloodwork education PDF we surface in the
  // Health Markers section. Lives on intakes, not clients. Clients whose
  // gender is unset or neither male nor female don't see the card at all —
  // there is no appropriate version to serve them, and the guide page itself
  // bounces them if they reach the URL directly.
  const { data: genderIntake } = await admin
    .from('intakes')
    .select('gender')
    .eq('client_id', client.id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const bloodworkGuideGender = (genderIntake?.gender ?? '').toLowerCase()
  const showBloodworkGuide = bloodworkGuideGender === 'male' || bloodworkGuideGender === 'female'

  // Personal GP request list, if the coach has prepared one for this client.
  const gpRequestUrl = await getGpRequestUrl(admin, client.id)

  // Blood work is an onboarding step with two completion paths: the client has
  // uploaded a panel, OR has recorded they will arrange one. Either addresses it.
  const { count: bloodPanelCount } = await admin
    .from('blood_panels')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', client.id)
  const bloodworkAddressed = (bloodPanelCount ?? 0) > 0 || !!client.bloodwork_arranged_at

  // Unread coach replies drive the message card near the top of the portal.
  const { count: unreadCoachRepliesCount } = await admin
    .from('client_messages')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', client.id)
    .eq('sender', 'coach')
    .is('client_read_at', null)
  const unreadCoachReplies = unreadCoachRepliesCount ?? 0

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
    {
      id: 'bloodwork',
      title: 'Blood Work',
      description: 'A blood panel is part of your Foundational Read. Upload recent results, or let me know you will get a panel done.',
      done: bloodworkAddressed,
      href: `/portal/${token}/bloods`,
      available: baselineDone,
    },
  ]

  const allOnboardingDone = agreementDone && healthDone && intakeDone && baselineDone && bloodworkAddressed && !clearanceBlocking

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

  // Outstanding Progress Check (block-end / 12-week milestone). Sent by email
  // today, which means a lost email is a missed milestone - so it also lives
  // here, where she already goes.
  const pendingProgressCheck = (Array.isArray(client.progress_checks) ? client.progress_checks : [])
    .filter((p: { status: string }) => p.status !== 'complete')
    .sort((a: { created_at: string }, b: { created_at: string }) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] as
    | { id: string; token: string; status: string; created_at: string }
    | undefined

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

  // Did the client miss last week's check-in?
  //
  // We must NOT key this on the current per-client weekNumber: the per-client
  // week rolls over on the client's own start-day, so from the moment their
  // week ticks over (e.g. Sunday night) until the next global window opens
  // (Friday 6pm), there is legitimately no submission for the *new* week yet —
  // the window hasn't happened. Keying on that made the portal tell clients
  // who checked in last weekend that they "missed", every Mon–Thu.
  //
  // Correct signal: did they submit during the most recently CLOSED window?
  // When the window is closed, checkinWindow.opensAt is the NEXT Friday 6pm, so
  // the previous window opened 7 days earlier. Any submission at/after that
  // timestamp means the last window was completed → not missed.
  const previousWindowOpenMs = checkinWindow.opensAt.getTime() - 7 * 24 * 60 * 60 * 1000
  const submittedInLastWindow = Array.isArray(client.weekly_checkins)
    ? client.weekly_checkins.some((c: { submitted_at?: string | null }) =>
        c.submitted_at && new Date(c.submitted_at).getTime() >= previousWindowOpenMs)
    : false
  const missedCheckin = !windowOpen && !submittedInLastWindow && weekNumber && weekNumber > 1

  // How long the "check-in done" confirmation stands.
  //
  // It used to be keyed on the per-client week number, which rolls over on the
  // client's OWN start day - so a Tuesday starter kept seeing "done for this
  // week" until Tuesday, days after the window it referred to had closed. The
  // confirmation belongs to the weekend it was submitted in, so it clears at
  // midnight Sunday and the rest of the week shows the reminder instead.
  //
  // Brisbane is UTC+10 year round, so wall-clock is read by shifting and using
  // the UTC getters - same convention as brisbaneDay above.
  const BRIS_OFFSET_MS = 10 * 60 * 60 * 1000
  const brisNow = new Date(Date.now() + BRIS_OFFSET_MS)
  // The most recent Friday 6pm at or before now.
  let daysBackToFriday = (brisNow.getUTCDay() - 5 + 7) % 7
  if (daysBackToFriday === 0 && brisNow.getUTCHours() < 18) daysBackToFriday = 7
  const lastWindowOpenMs =
    Date.UTC(
      brisNow.getUTCFullYear(),
      brisNow.getUTCMonth(),
      brisNow.getUTCDate() - daysBackToFriday,
      18, 0, 0,
    ) - BRIS_OFFSET_MS
  // Friday 6pm + 2 days 6 hours = the Monday 00:00 that ends that weekend.
  const weekendEndsMs = lastWindowOpenMs + (2 * 24 + 6) * 60 * 60 * 1000
  const submittedThisWindow = Array.isArray(client.weekly_checkins)
    ? client.weekly_checkins.some((c: { submitted_at?: string | null }) =>
        c.submitted_at && new Date(c.submitted_at).getTime() >= lastWindowOpenMs)
    : false
  // Test mode moves the window around, so it keeps the old per-week signal.
  const showCheckinDone = testMode
    ? checkinDoneThisWeek
    : submittedThisWindow && Date.now() < weekendEndsMs

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        {/* Premium hero panel */}
        <div className="relative overflow-hidden rounded-[18px] p-7 mb-8 shadow-[0_14px_34px_rgba(11,31,51,0.28)]" style={{ background: 'linear-gradient(140deg, #17191F 0%, #0C1B33 100%)' }}>
          <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(27,109,252,0.28), transparent 70%)' }} />
          <div className="relative">
            <p className="text-[11px] font-bold tracking-widest text-[#8FB4F5] uppercase mb-2.5">Performance Coaching</p>
            <h1 className="text-[30px] font-extrabold text-white tracking-tight leading-[1.1] mb-2">Welcome, {firstName}</h1>
            <p className="text-white/60 text-[14px] leading-relaxed">Your coaching portal, everything in one place.</p>
          </div>
        </div>

        {/* Onboarding tasks */}
        {!allOnboardingDone && (
          <div className="mb-10">
            <SectionLabel icon={ListChecks} text="Getting started" />
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
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
                          className="inline-block mt-3 text-xs font-bold text-white bg-[#1B6DFC] px-4 py-2 rounded-xl hover:bg-[#1056D6] transition-colors"
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

        {/* Unread reply from the coach. Sits above everything else that is
            optional: a message waiting is the one thing the client should not
            have to go looking for. */}
        {unreadCoachReplies > 0 && (
          <div className="mb-10">
            <SectionLabel icon={MessageCircle} text={`New from ${coach().firstName}`} />
            <Link
              href={`/portal/${token}/message`}
              className="block rounded-2xl border border-blue-200 bg-blue-50 p-5 hover:border-[#1B6DFC]/60 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A1A] mb-1">
                    {unreadCoachReplies === 1 ? 'You have a new message' : `You have ${unreadCoachReplies} new messages`}
                  </p>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed">
                    {coach().firstName} replied to you. Open the conversation to read it and reply.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">Read →</span>
              </div>
            </Link>
          </div>
        )}

        {/* Pending supplementary intake - shown when the coach has added a
            follow-up intake task. Surfaces right at the top of post-onboarding
            content so the client sees and completes it on next sign-in. */}
        {pendingSupplementary && (
          <div className="mb-10">
            <SectionLabel icon={MessageCircle} text="A quick follow-up from Kade" />
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
            <SectionLabel icon={FileText} text="Your Reading" />
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

        {/* Daily anchors - Morning Reset + Evening Rhythm sequences.
            Always shown post-onboarding: these are foundation practices,
            not gated on any specific artefact being published. */}
        {allOnboardingDone && (
          <div className="mb-10">
            <SectionLabel icon={Sunrise} text="Daily Sequences" />
            <Link
              href={`/portal/${token}/routine`}
              className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Morning Reset + Evening Rhythm</p>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed">Two short sequences that anchor your day - one on waking, one before sleep. Do them consistently before you worry about optimising anything else.</p>
                </div>
                <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">Open →</span>
              </div>
            </Link>
          </div>
        )}

        {allOnboardingDone && (activeRecoveryCount ?? 0) > 0 && (
          <div className="mb-10">
            <SectionLabel icon={Snowflake} text="Recovery" />
            <Link
              href={`/portal/${token}/recovery`}
              className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A1A] mb-1">{activeRecoveryCount} recovery protocol{activeRecoveryCount === 1 ? '' : 's'} active</p>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed">Situational tools your coach has assigned. Do these when your body signals it needs them, not every day.</p>
                </div>
                <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">Open →</span>
              </div>
            </Link>
          </div>
        )}

        {allOnboardingDone && (activeSupplementCount ?? 0) > 0 && (
          <div className="mb-10">
            <SectionLabel icon={Pill} text="Supplement Stack" />
            <Link
              href={`/portal/${token}/supplements`}
              className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A1A] mb-1">{activeSupplementCount} substance{activeSupplementCount === 1 ? '' : 's'} prescribed</p>
                  <p className="text-xs text-[#6B6B6B] leading-relaxed">Each has three tiers - Essential, Enhanced, Elite. Pick the tier that fits your budget and commitment level.</p>
                </div>
                <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">Open →</span>
              </div>
            </Link>
          </div>
        )}

        {/* Sessions - face-to-face clients */}
        {allOnboardingDone && client.session_type === 'face_to_face' && (
          <div className="mb-10">
            <SectionLabel icon={CalendarDays} text="Sessions" />
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
            <SectionLabel icon={NotebookPen} text="This week" />
            {pendingProgressCheck && (
              <Link
                href={`/progress-check/${pendingProgressCheck.token}`}
                className="block rounded-2xl border border-[#B5CFFC] bg-[#F3F7FF] p-5 mb-3 hover:border-[#1B6DFC] transition-colors"
              >
                <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Your Progress Check is ready</p>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">
                  You have reached the end of a block. A few minutes of questions, your measurements
                  and three photos - this is what lets {coach().firstName} re-read where you are now
                  and show you what has moved. →
                </p>
              </Link>
            )}
            {!activeProgram ? (
              <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5">
                <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Your program is being built</p>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">Weekly check-ins begin once your training program is in place. Your coach is reviewing your intake and baseline now. We will let you know the moment your program is ready.</p>
              </div>
            ) : showCheckinDone ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 rounded-full bg-[#1B6DFC] flex items-center justify-center flex-shrink-0 shadow-[0_1px_2px_rgba(27,109,252,0.4),inset_0_1px_0_rgba(255,255,255,0.25)]">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
              <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full border border-[#E5E5E5] bg-[#FFFFFF] flex items-center justify-center flex-shrink-0">
                    <CalendarDays size={14} className="text-[#999999]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">Check-in opens Friday 6:00 pm</p>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">Nothing to do until then. It stays open until Sunday 6:30 pm.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview header during onboarding */}
        {!allOnboardingDone && (
          <div className="mb-6">
            <SectionLabel icon={LayoutGrid} text="Your portal" />
            <p className="text-xs text-[#999999] leading-relaxed">A look at what unlocks as your coach builds your plan. You can take measurements anytime.</p>
          </div>
        )}

        {/* Training. The weekly training check-in is now folded into the single
            "This week" check-in above, so this section is just the read-only
            program viewer. */}
        <div className="mb-10">
          <SectionLabel icon={Dumbbell} text="Training" />
            {activeProgram ? (
              <div className="space-y-3">
                <Link
                  href={`/portal/${token}/program`}
                  className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF]/50 p-4 hover:border-[#E5E5E5] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#3A3A3A]">View your program</p>
                      <p className="text-xs text-[#999999] mt-0.5">{activeProgram.block_name}</p>
                    </div>
                    <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">View →</span>
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

        {/* Nutrition. The weekly nutrition check-in is now folded into the single
            "This week" check-in above, so this section is just the read-only
            plan viewer. */}
        <div className="mb-10">
          <SectionLabel icon={Salad} text="Nutrition" />
            {activeNutritionPlan ? (
              <div className="space-y-3">
                <Link
                  href={`/portal/${token}/my-plan`}
                  className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF]/50 p-4 hover:border-[#E5E5E5] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#3A3A3A]">View your nutrition plan</p>
                      <p className="text-xs text-[#999999] mt-0.5">{activeNutritionPlan.plan_name}</p>
                    </div>
                    <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">View →</span>
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
          <SectionLabel icon={LineChart} text="Progress" />
          <Link
            href={`/portal/${token}/progress`}
            className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF]/50 p-4 hover:border-[#E5E5E5] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#3A3A3A]">Measurements</p>
                <p className="text-xs text-[#999999] mt-0.5">Track your bodyweight, waist, hips and chest over time.</p>
              </div>
              <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">View →</span>
            </div>
          </Link>
        </div>

        {/* Health Markers - always-on self-serve blood test upload, plus the
            gender-matched baseline-bloodwork education guide. */}
        <div className="mb-10">
          <SectionLabel icon={Activity} text="Health Markers" />
          <div className="space-y-3">
            {gpRequestUrl && (
              <a
                href={gpRequestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-[#1B6DFC] bg-blue-50 p-4 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">Your blood test request — for your GP</p>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">A list of the markers to discuss, prepared for you. Print or save it and take it to your appointment.</p>
                  </div>
                  <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">Open →</span>
                </div>
              </a>
            )}
            <Link
              href={`/portal/${token}/bloods`}
              className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF]/50 p-4 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#3A3A3A]">Blood test results</p>
                  <p className="text-xs text-[#999999] mt-0.5">Have recent blood work? Upload a copy so your coach can factor it into your plan.</p>
                </div>
                <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">View →</span>
              </div>
            </Link>
            {showBloodworkGuide && (
              <Link
                href={`/portal/${token}/guides/baseline-bloodwork`}
                className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF]/50 p-4 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#3A3A3A]">Understanding your baseline bloodwork</p>
                    <p className="text-xs text-[#999999] mt-0.5">What a comprehensive baseline panel covers and what each marker measures. Download the guide to keep.</p>
                  </div>
                  <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">View →</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Coach feedback */}
        {(latestProgramReview?.coach_notes || latestNutritionReview?.coach_notes) && (
          <div className="mb-10">
            <SectionLabel icon={MessageCircle} text="From your coach" />
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

        {/* Talk to your coach - always present, not only when a reply is
            waiting. Contacting the coach should never require hunting through
            Resources for it. */}
        <div className="mb-10">
          <SectionLabel icon={MessageCircle} text={`Talk to ${coach().firstName}`} />
          <Link
            href={`/portal/${token}/message`}
            className="flex items-center justify-between w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl px-5 py-4 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">Messages</p>
              <p className="text-xs text-[#999999] mt-0.5">
                Ask about your plan, your training, or how you are feeling. Replies land here.
              </p>
            </div>
            <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">Open →</span>
          </Link>
        </div>

        {/* Resources */}
        <div className="mb-10">
          <SectionLabel icon={BookOpen} text="Resources" />
          <Link
            href={`/portal/${token}/resources`}
            className="flex items-center justify-between w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl px-5 py-4 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors mb-3"
          >
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">All resources</p>
              <p className="text-xs text-[#999999] mt-0.5">Progress, readings, glossary, practical guides, account.</p>
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

        <div className="h-16" />{/* canonical bottom spacer */}
      </div>
    </div>
  )
}
