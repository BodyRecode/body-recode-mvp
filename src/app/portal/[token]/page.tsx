import { ListChecks, MessageCircle, FileText, CalendarDays, NotebookPen, LayoutGrid, type LucideIcon } from 'lucide-react'
import { resolveCurrentBodyState } from '@/lib/body-state-current'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCheckInWindowStatus, getWeekNumber, isCheckinTestMode, lastCheckinWindowOpenMs } from '@/lib/weekly-checkin-questions'
import ClientHeader from '@/components/client-header'
import { isCoachEmail } from '@/lib/coach-auth'
import { brand, coach } from '@/config/tenant'

function SectionLabel({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-8 h-8 rounded-lg bg-[#1B6DFC]/10 flex items-center justify-center text-[#1B6DFC]"><Icon size={16} strokeWidth={2.5} /></span>
      <p className="text-[11px] font-semibold tracking-[0.1em] text-[#1B6DFC] uppercase">{text}</p>
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
      <div className="min-h-screen bg-[#FFFFFF] text-[#141821] flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E8EAEE] rounded-2xl p-8">
          <img src={`${t.marketingDomain}${t.logoUrlLight}`} width="220" alt={t.name} className="mb-8" />
          <h1 className="text-xl font-bold text-[#141821] mb-3">Wrong account signed in</h1>
          <p className="text-sm text-[#666D7A] leading-relaxed mb-2">
            This portal link belongs to a different account. You&apos;re currently signed in as{' '}
            <span className="text-[#141821] font-medium">{user.email}</span>.
          </p>
          <p className="text-sm text-[#666D7A] leading-relaxed mb-6">
            Sign out and sign in with the email address this link was sent to.
          </p>
          <form action="/portal/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full py-3.5 bg-[#1B6DFC] hover:bg-[#1560E0] text-white font-bold text-sm rounded-2xl transition-colors"
            >
              Sign out and use a different email
            </button>
          </form>
          <p className="mt-5 text-xs text-[#98A0AD] leading-relaxed">
            Want to keep your other session open? Open this link in a private/incognito window instead.
          </p>
        </div>
      </div>
    )
  }

  // is_active=true is the single source of truth for the current plan.
  const { data: activeProgram } = await admin
    .from('programs')
    .select('id, block_name, last_review_at, week_duration, generated_at, activated_at')
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

  // Personal GP request list, if the coach has prepared one for this client.

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

  // Client-facing state (2026-08-30). requirePublished: the client should meet
  // a new state inside a Progress Read the coach has approved, never via this
  // line quietly changing before anything has been said to them.
  const { data: portalReScoreRows } = await admin
    .from('programs')
    .select('tr_new_body_state, tr_state_direction, block_name, trajectory_reading_published_at, generated_at')
    .eq('client_id', client.id)
    .not('tr_new_body_state', 'is', null)
    .order('generated_at', { ascending: false })
    .limit(1)
  const portalBodyState = resolveCurrentBodyState({
    foundational: publishedReading?.body_state_classification ?? null,
    reScore: portalReScoreRows?.[0] ?? null,
    requirePublished: true,
  })

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
  // Server component: rendered once per request, so reading the clock here is
  // deterministic for that render. The purity rule targets client render.
  // eslint-disable-next-line react-hooks/purity
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
  const lastWindowOpenMs = lastCheckinWindowOpenMs()
  // Friday 6pm + 2 days 6 hours = the Monday 00:00 that ends that weekend.
  const weekendEndsMs = lastWindowOpenMs + (2 * 24 + 6) * 60 * 60 * 1000
  const submittedThisWindow = Array.isArray(client.weekly_checkins)
    ? client.weekly_checkins.some((c: { submitted_at?: string | null }) =>
        c.submitted_at && new Date(c.submitted_at).getTime() >= lastWindowOpenMs)
    : false
  // Test mode moves the window around, so it keeps the old per-week signal.
  const showCheckinDone = testMode
    ? checkinDoneThisWeek
    // eslint-disable-next-line react-hooks/purity
    : submittedThisWindow && Date.now() < weekendEndsMs

  // The Progress Check no longer needs a lock here. The ordering is enforced
  // where it belongs - at send time: the invite only goes out on a Monday,
  // after the weekend's check-in is in. An earlier version gated the card
  // instead, which meant an invite sent on a Friday morning was taken away
  // again at 6pm when the next window opened. Sent means available.
  //
  // Still used to tell her whether she is waiting on her own check-in or on
  // her coach, before an invite exists.
  const progressCheckUnlocked = submittedThisWindow

  // Where the block itself is up to. Until now the portal said nothing about a
  // block ending - the Progress Check card only appeared once the coach had
  // sent an invite, so a client in her final week, or past it, saw nothing at
  // all. This is stated as fact about the block rather than as a promise of a
  // task, because the send is still manual and a promised form that never
  // arrives is worse than no mention.
  const blockPhase: 'final_week' | 'ended' | null = (() => {
    // activated_at is the block's true start; generated_at is when the draft
    // was built and can be weeks earlier.
    const startedAt = activeProgram?.activated_at ?? activeProgram?.generated_at
    if (!startedAt || !activeProgram?.week_duration) return null
    const weeksIn = Math.floor(
      // eslint-disable-next-line react-hooks/purity
      (Date.now() - new Date(startedAt).getTime()) / (7 * 24 * 60 * 60 * 1000),
    ) + 1
    if (weeksIn > activeProgram.week_duration) return 'ended'
    if (weeksIn === activeProgram.week_duration) return 'final_week'
    return null
  })()

  /**
   * The single next thing, and how it is said.
   *
   * The portal used to open with "Welcome, Cristobal. Your coaching portal,
   * everything in one place" and then leave her to work out which of fifteen
   * sections wanted something from her. Intake loses nine people, the PAR-Q
   * five, day 1-14 fourteen of fifteen. A screen that opens on one instruction
   * is the only part of a redesign aimed at that.
   *
   * Written as sentences rather than labels: this is a note from a coach about
   * where she is up to, not an app telling her a task is outstanding.
   */
  const nextUp: {
    eyebrow: string
    headline: string
    body: string
    cta: { label: string; href: string } | null
    /** No action of hers - a calm state rather than an instruction. */
    resting?: boolean
  } = (() => {
    const firstOutstanding = tasks.find(t => !t.done && t.available && t.href)
    if (!allOnboardingDone && firstOutstanding) {
      return {
        eyebrow: 'To get started',
        headline: firstOutstanding.title,
        body: firstOutstanding.description,
        cta: { label: 'Start', href: firstOutstanding.href! },
      }
    }
    if (pendingProgressCheck && progressCheckUnlocked) {
      return {
        eyebrow: 'Next for you',
        headline: 'Your Progress Check',
        body: `You have finished this block. A few questions, your measurements and three photos - about ten minutes. It is what lets ${coach().firstName} read the whole block back to you and show you what has moved.`,
        cta: { label: 'Start my Progress Check', href: `/progress-check/${pendingProgressCheck.token}` },
      }
    }
    if (windowOpen && !showCheckinDone && activeProgram) {
      return {
        eyebrow: 'This week',
        headline: `Your week ${weekNumber} check-in`,
        body: isClosingDay
          ? 'The window closes tonight at 6:30 pm. A few minutes is all it takes.'
          : `A few minutes on how the week has actually gone. It closes ${closesAt}.`,
        cta: { label: 'Start my check-in', href: `/portal/${token}/checkin` },
      }
    }
    if (pendingProgressCheck && !progressCheckUnlocked) {
      return {
        eyebrow: 'Next for you',
        headline: 'Your Progress Check',
        body: 'Your check-in for this week comes first - it is the shorter of the two. This opens as soon as it is in.',
        cta: null,
      }
    }
    if (missedCheckin) {
      return {
        eyebrow: 'This week',
        headline: 'Last week\u2019s check-in did not come through',
        body: `Nothing to fix - the window has closed. The next one opens ${opensAt}, and ${coach().firstName} will read the two together.`,
        cta: null,
      }
    }
    if (blockPhase === 'ended') {
      return {
        eyebrow: 'Next for you',
        headline: 'You have finished this block',
        body: `${activeProgram?.block_name ?? 'Your block'}. Your Progress Check is on its way through - it will appear here.`,
        cta: null,
        resting: true,
      }
    }
    if (blockPhase === 'final_week') {
      return {
        eyebrow: 'This week',
        headline: 'Final week of this block',
        body: `${activeProgram?.block_name ?? 'Your block'}. Finish the week and send your check-in, and your Progress Check opens next.`,
        cta: null,
        resting: true,
      }
    }
    if (!activeProgram) {
      return {
        eyebrow: 'Where you are up to',
        headline: 'Your program is being built',
        body: `${coach().firstName} is reading your intake and baseline now. Weekly check-ins begin once it is in place, and you will hear the moment it is ready.`,
        cta: null,
        resting: true,
      }
    }
    return {
      eyebrow: 'Where you are up to',
      headline: `Nothing waiting on you, ${firstName}`,
      body: `Week ${weekNumber} of ${activeProgram.block_name}. Your check-in is in and the next window opens ${opensAt}.`,
      cta: null,
      resting: true,
    }
  })()

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#141821]">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        {/* The one thing, at full size. Everything else is a line further down. */}
        <div
          className="relative overflow-hidden rounded-[18px] px-7 pt-7 pb-6 mb-8 shadow-[0_14px_34px_rgba(11,31,51,0.28)]"
          style={{ background: 'linear-gradient(140deg, #17191F 0%, #0C1B33 100%)' }}
        >
          <div
            className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(27,109,252,0.28), transparent 70%)' }}
          />
          <div className="relative">
            <p className="text-[11px] tracking-[0.12em] uppercase text-[#8FB4F5] mb-3">{nextUp.eyebrow}</p>
            <h1 className="text-[26px] font-semibold text-white tracking-[-0.03em] leading-[1.18] mb-2.5">
              {nextUp.headline}
            </h1>
            <p className="text-white/65 text-[14px] leading-relaxed">{nextUp.body}</p>
            {nextUp.cta && (
              <Link
                href={nextUp.cta.href}
                className="block text-center mt-6 bg-[#1B6DFC] hover:bg-[#1056D6] text-white text-[15px] font-semibold py-4 rounded-xl transition-colors"
              >
                {nextUp.cta.label}
              </Link>
            )}
            {!nextUp.cta && !nextUp.resting && (
              <p className="mt-5 text-[12.5px] text-white/45">Nothing to do here just yet.</p>
            )}
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
                      ? 'border-[#B5CFFC] bg-[#EFF5FE]'
                      : task.available
                      ? 'border-[#E8EAEE] bg-[#FFFFFF] hover:border-[#CFD4DC]'
                      : 'border-[#E8EAEE] bg-[#FFFFFF]/50 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center ${task.done ? 'bg-[#1B6DFC]' : 'border-2 border-[#CFD4DC]'}`}>
                      {task.done && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold mb-0.5 ${task.done ? 'text-[#1B6DFC]' : 'text-[#141821]'}`}>{task.title}</p>
                      <p className="text-xs text-[#98A0AD]">{task.description}</p>
                      {!task.done && task.notice && (
                        <p className="mt-2 text-xs text-[#A96A12]/80">{task.notice}</p>
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
                        <p className="mt-2 text-xs text-[#98A0AD]">Your coach will send this link when ready.</p>
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
              className="block rounded-2xl border border-[#B5CFFC] bg-[#EFF5FE] p-5 hover:border-[#1B6DFC]/60 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#141821] mb-1">
                    {unreadCoachReplies === 1 ? 'You have a new message' : `You have ${unreadCoachReplies} new messages`}
                  </p>
                  <p className="text-xs text-[#666D7A] leading-relaxed">
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
              className="block rounded-2xl border border-[#B5CFFC] bg-[#EFF5FE] p-5 hover:border-[#1B6DFC]/60 hover:bg-[#EFF5FE] transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#141821] mb-1">5 follow-up questions</p>
                  <p className="text-xs text-[#666D7A] leading-relaxed">
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
              className="block rounded-2xl border border-[#E8EAEE] bg-[#FFFFFF] p-5 hover:border-[#1B6DFC]/40 hover:bg-[#EFF5FE] transition-colors mb-3"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#141821] mb-1">Foundational Reading</p>
                  <p className="text-xs text-[#666D7A] leading-relaxed">
                    A read of how your body is currently organising itself
                    {portalBodyState.label ? `, currently in ${portalBodyState.label}.` : '.'}
                  </p>
                </div>
                <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">View →</span>
              </div>
            </Link>
            {client.medications_reading_published_at && (
              <Link
                href={`/portal/${token}/medications-reading`}
                className="block rounded-2xl border border-[#E8EAEE] bg-[#FFFFFF] p-5 hover:border-[#1B6DFC]/40 hover:bg-[#EFF5FE] transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#141821] mb-1">Medications Reading</p>
                    <p className="text-xs text-[#666D7A] leading-relaxed">
                      What you&apos;re currently taking, why it matters for your coaching, and what we account for in your program and nutrition.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">View →</span>
                </div>
              </Link>
            )}
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
                <p className="text-sm font-semibold text-[#141821] mb-1">Your Progress Check is ready</p>
                <p className="text-xs text-[#666D7A] leading-relaxed">
                  You have reached the end of a block. A few questions, your measurements and three
                  photos - this is what lets {coach().firstName} re-read where you are now and show
                  you what has moved. →
                </p>
              </Link>
            )}
            {!activeProgram ? (
              <div className="rounded-2xl border border-[#E8EAEE] bg-[#FFFFFF] p-5">
                <p className="text-sm font-semibold text-[#141821] mb-1">Your program is being built</p>
                <p className="text-xs text-[#666D7A] leading-relaxed">Weekly check-ins begin once your training program is in place. Your coach is reviewing your intake and baseline now. We will let you know the moment your program is ready.</p>
              </div>
            ) : showCheckinDone ? (
              <div className="rounded-2xl border border-[#B5CFFC] bg-[#EFF5FE] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 rounded-full bg-[#1B6DFC] flex items-center justify-center flex-shrink-0 shadow-[0_1px_2px_rgba(27,109,252,0.4),inset_0_1px_0_rgba(255,255,255,0.25)]">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1B6DFC]">Check-in done for this week</p>
                    <p className="text-xs text-[#98A0AD] mt-0.5">Week {weekNumber} submitted. Your coach will review shortly.</p>
                  </div>
                </div>
                <div className="border-t border-[#DDE9FD] pt-3 flex items-center justify-between">
                  <p className="text-xs text-[#98A0AD]">Next check-in opens {opensAt}.</p>
                  {recentCheckins.length > 1 && (
                    <p className="text-xs text-[#98A0AD]">{recentCheckins.length} week streak</p>
                  )}
                </div>
              </div>
            ) : windowOpen ? (
              <Link
                href={`/portal/${token}/checkin`}
                className={`block rounded-2xl border p-5 transition-colors ${isClosingDay ? 'border-[#B7791F]/50 bg-[#B7791F]/5 hover:border-[#C08A2D]/60' : 'border-[#E8EAEE] bg-[#FFFFFF] hover:border-[#1B6DFC]/40 hover:bg-[#EFF5FE]'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#141821] mb-1">Weekly check-in, Form {activeFormType}</p>
                    {isClosingDay ? (
                      <p className="text-xs text-[#A96A12] font-medium">Closes today at 6:30pm Brisbane time. Do it now.</p>
                    ) : (
                      <p className="text-xs text-[#666D7A]">Week {weekNumber} · Closes {closesAt}.</p>
                    )}
                  </div>
                  <span className={`text-xs font-bold ml-4 ${isClosingDay ? 'text-[#A96A12]' : 'text-[#1B6DFC]'}`}>Start →</span>
                </div>
              </Link>
            ) : missedCheckin ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-[#F5C9C9]/50 bg-[#FDEDED] p-5">
                  <p className="text-sm font-semibold text-[#C82626] mb-1">You missed last week&apos;s check-in</p>
                  <p className="text-xs text-[#C82626]/70">The window closed without a submission. Your coach won&apos;t have data for this week.</p>
                </div>
                <div className="rounded-2xl border border-[#E8EAEE] bg-[#FFFFFF]/50 p-4">
                  <p className="text-xs text-[#98A0AD]">Next window opens {opensAt}.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E8EAEE] bg-[#FFFFFF] p-5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full border border-[#E8EAEE] bg-[#FFFFFF] flex items-center justify-center flex-shrink-0">
                    <CalendarDays size={14} className="text-[#98A0AD]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#141821]">Check-in opens Friday 6:00 pm</p>
                    <p className="text-xs text-[#666D7A] mt-0.5">Nothing to do until then. It stays open until Sunday 6:30 pm.</p>
                  </div>
                </div>
              </div>
            )}
            {!pendingProgressCheck && blockPhase && (
              <div className="rounded-2xl border border-[#B5CFFC] bg-[#F3F7FF] p-5 mt-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full border border-[#B5CFFC] bg-[#FFFFFF] flex items-center justify-center flex-shrink-0">
                    <NotebookPen size={14} className="text-[#1B6DFC]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#141821]">
                      {blockPhase === 'final_week'
                        ? 'Final week of this block'
                        : progressCheckUnlocked
                          ? 'Your Progress Check is coming'
                          : 'You have finished this block'}
                    </p>
                    <p className="text-xs text-[#666D7A] mt-0.5 leading-relaxed">
                      {activeProgram?.block_name}.{' '}
                      {/* Three states, because "what am I waiting on" has three
                          different answers and telling her the wrong one is
                          worse than telling her nothing. */}
                      {blockPhase === 'final_week'
                        ? `Finish the week and send your check-in, and your Progress Check opens next: a few questions plus your measurements and photos, so ${coach().firstName} can read the whole block back to you.`
                        : progressCheckUnlocked
                          ? `Your Progress Check is on its way through - it will appear here. A few questions plus your measurements and photos, so ${coach().firstName} can read the whole block back to you and show you what has moved.`
                          : `Your Progress Check opens once this week's check-in is in: a few questions plus your measurements and photos, so ${coach().firstName} can read the whole block back to you and show you what has moved.`}
                    </p>
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
            <p className="text-xs text-[#98A0AD] leading-relaxed">A look at what unlocks as your coach builds your plan. You can take measurements anytime.</p>
          </div>
        )}


        {/* Coach feedback */}
        {(latestProgramReview?.coach_notes || latestNutritionReview?.coach_notes) && (
          <div className="mb-10">
            <SectionLabel icon={MessageCircle} text="From your coach" />
            <div className="space-y-3">
              {latestProgramReview?.coach_notes && (
                <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-[#1B6DFC] uppercase tracking-widest">Training</p>
                    <p className="text-xs text-[#98A0AD]">{new Date(latestProgramReview.reviewed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <p className="text-sm text-[#43474F] leading-relaxed">{latestProgramReview.coach_notes}</p>
                </div>
              )}
              {latestNutritionReview?.coach_notes && (
                <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-[#1B6DFC] uppercase tracking-widest">Nutrition</p>
                    <p className="text-xs text-[#98A0AD]">{new Date(latestNutritionReview.reviewed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <p className="text-sm text-[#43474F] leading-relaxed">{latestNutritionReview.coach_notes}</p>
                </div>
              )}
            </div>
          </div>
        )}



        {/* Everything else - one line each.
            These are destinations, not messages. Each used to get a section
            heading, an icon chip and a description card, so eleven places she
            might browse to carried the same visual weight as the one thing
            actually being asked of her. They are a list now. Anything that is
            a MESSAGE to her - a reply, a new reading, a note from her coach -
            keeps its own block above. */}
        {allOnboardingDone && (
          <div className="mb-10">
            <p className="text-[12.5px] text-[#98A0AD] mb-3">Everything else</p>
            <div className="rounded-2xl border border-[#E8EAEE] overflow-hidden bg-white">
              {([
                { href: `/portal/${token}/program`, label: 'Training program', meta: activeProgram?.block_name ?? null, show: true },
                { href: `/portal/${token}/my-plan`, label: 'Nutrition plan', meta: null, show: true },
                { href: `/portal/${token}/routine`, label: 'Daily sequences', meta: null, show: true },
                { href: `/portal/${token}/recovery`, label: 'Recovery protocols', meta: null, show: (activeRecoveryCount ?? 0) > 0 },
                { href: `/portal/${token}/supplements`, label: 'Supplement stack', meta: null, show: (activeSupplementCount ?? 0) > 0 },
                { href: `/portal/${token}/sessions`, label: 'Your sessions', meta: null, show: client.session_type === 'face_to_face' },
                { href: `/portal/${token}/progress`, label: 'Progress', meta: null, show: true },
                { href: `/portal/${token}/bloods`, label: 'Health markers', meta: null, show: true },
                { href: `/portal/${token}/checkin-history`, label: 'Your check-ins', meta: recentCheckins.length > 0 ? `${recentCheckins.length} recent` : null, show: true },
                { href: `/portal/${token}/message`, label: `Message ${coach().firstName}`, meta: null, show: true },
                { href: `/portal/${token}/resources`, label: 'Readings and guides', meta: null, show: true },
                { href: `/portal/${token}/feedback`, label: 'Share feedback', meta: null, show: true },
              ] as { href: string; label: string; meta: string | null; show: boolean }[])
                .filter(i => i.show)
                .map(i => (
                  <Link
                    key={i.href}
                    href={i.href}
                    className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#EFF1F4] last:border-b-0 hover:bg-[#F7F9FC] transition-colors"
                  >
                    <span className="text-[15px] text-[#141821] min-w-0 truncate">{i.label}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      {i.meta && <span className="text-[12.5px] text-[#98A0AD] truncate max-w-[130px]">{i.meta}</span>}
                      <span className="text-[#CFD4DC]">&rsaquo;</span>
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        )}

        <div className="h-16" />{/* canonical bottom spacer */}
      </div>
    </div>
  )
}
