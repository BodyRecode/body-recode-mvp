import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { ChevronLeft, Activity, RefreshCw, AlertTriangle as AlertTriangleIcon, Eye } from 'lucide-react'
import { formatDate, getStateColour, getReadinessColour } from '@/lib/utils'
import Link from 'next/link'
import { PageHeader, MONO_FONT } from '@/components/dashboard/ui'
import { evaluateReadiness } from '@/lib/readiness-monitor'
import { evaluateRpeCreep } from '@/lib/rpe-creep-monitor'
import { currentBlockWeek } from '@/lib/workout-logging'
import SetStartDate from '@/components/set-start-date'
import PackageManager from '@/components/package-manager'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import { TWO_SESSION_PACKAGE_VALUES } from '@/lib/coaching-packages'
import CopyLinkButton from './copy-link-button'
import SendEmailButton from '@/components/send-email-button'
import RegenerateCFFSButton from '@/components/regenerate-cffs-button'
import ClientReadingPanel from './client-reading-panel'
import MedicationsEditor from './medications-editor'
import DietaryConsumptionEditor from './dietary-consumption-editor'
import RegenerateCFWSButton from '@/components/regenerate-cfws-button'
import CoachResponseCard from './coach-response-card'
import MajorSection from './major-section'
import MedicationsAnalysisPanel from './medications-analysis-panel'
import ReopenCheckinButton from './reopen-checkin-button'
import BloodPanelsPanel, { type BloodPanelData } from './blood-panels-panel'
import NewIntakeButton from '@/components/new-intake-button'
import PortalInviteButton from '@/components/portal-invite-button'
import SendPortalEmailButton from '@/components/send-portal-email-button'
import SendPortalOrientationButton from '@/components/send-portal-orientation-button'
import SendSupplementaryIntakeButton from '@/components/send-supplementary-intake-button'
import SendSupplementaryEmailButton from '@/components/send-supplementary-email-button'
import ClientDangerActions from './client-danger-actions'
import ProfileSidebar from './profile-sidebar'
import EditClientPhone from '@/components/edit-client-phone'
import OverrideSubscriptionButton from '@/components/override-subscription-button'
import ClientCommunicationsPanel from '@/components/dashboard/client-communications-panel'
import { RecoveryRouterPanel } from './recovery-router-panel'
import { loadRecoverySnapshot } from '@/lib/recovery-history'
import { resolveRouterMode } from '@/lib/recovery-state-machine'
import { BlockProgressPanel } from './block-progress-panel'
import { loadBlockProgress } from '@/lib/block-progress'
import ClientPaymentsSection from '@/components/dashboard/client-payments-section'

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (clientError) console.error('Client fetch error:', clientError)
  if (!client) notFound()

  const [{ data: cffsRecords }, { data: invitations }, { data: intakes }, { data: cfwsRecords }, { data: recentCheckins }, { data: baselines }, { data: activePrograms }, { data: draftPrograms }, { data: activeNutritionPlans }, { data: draftNutritionPlans }] = await Promise.all([
    admin
      .from('cffs')
      .select('*')
      .eq('client_id', id)
      .order('generated_at', { ascending: false }),
    admin
      // Pull all invitations (foundational + supplementary) so the page can
      // surface both intake states independently. Ordering newest-first lets
      // us pick the most recent of each kind below.
      .from('intake_invitations')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
    admin
      .from('intakes')
      .select('id, dietary_restrictions, dietary_preferences, typical_day_eating, meals_per_day, fluid_intake, caffeine_intake, alcohol_intake, eating_context, dietary_updated_at')
      .eq('client_id', id)
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .limit(1),
    admin
      .from('cfws')
      .select('*')
      .eq('client_id', id)
      .order('week_number', { ascending: false })
      .limit(4),
    admin
      .from('weekly_checkins')
      .select('id, week_number, form_type, submitted_at, coach_skipped_at')
      .eq('client_id', id)
      .order('week_number', { ascending: false }),
    admin
      .from('baselines')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
    admin
      .from('programs')
      .select('id, block_name, progression_phase, training_goal, training_frequency, week_duration, generated_at')
      .eq('client_id', id)
      .eq('is_active', true)
      .maybeSingle(),
    admin
      .from('programs')
      .select('id, block_name, progression_phase, training_goal, training_frequency, week_duration, generated_at')
      .eq('client_id', id)
      .eq('status', 'draft')
      .maybeSingle(),
    admin
      .from('nutrition_plans')
      .select('id, plan_name, entry_state, carb_demand_level, generated_at, current_direction')
      .eq('client_id', id)
      .eq('is_active', true)
      .maybeSingle(),
    admin
      .from('nutrition_plans')
      .select('id, plan_name, entry_state, carb_demand_level, generated_at')
      .eq('client_id', id)
      .eq('status', 'draft')
      .maybeSingle(),
  ])

  // Client-uploaded blood panels (Health Markers feature). Newest first.
  const { data: bloodPanels } = await admin
    .from('blood_panels')
    .select('id, status, approved_for_plan, submitted_at, collected_on, lab_name, original_filename, client_note, panel_summary, markers, gp_flags, extraction_meta, analysis, analyzed_at, reading, reading_generated_at, reading_published_at, approved_at')
    .eq('client_id', id)
    .order('submitted_at', { ascending: false })

  // Coach response history for this client. Joined to recentCheckins by id
  // so the UI can show a "Coach response" pill on the submission rows AND
  // render the full text in a dedicated history section below.
  const { data: feedbackHistory } = await admin
    .from('weekly_checkin_feedback')
    .select('id, weekly_checkin_id, interpretation, reframe, next_focus, email_sent_at, updated_at, created_at')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  const feedbackByCheckinId = new Map<string, NonNullable<typeof feedbackHistory>[number]>()
  for (const f of feedbackHistory ?? []) feedbackByCheckinId.set(f.weekly_checkin_id, f)

  // Lookup from feedback row back to its check-in (week + form), for the
  // history section headers.
  const checkinMetaById = new Map<string, { week_number: number; form_type: string; submitted_at: string }>()
  for (const ci of recentCheckins ?? []) {
    if (ci.id) checkinMetaById.set(ci.id, { week_number: ci.week_number, form_type: ci.form_type, submitted_at: ci.submitted_at })
  }

  const { data: upcomingClientSessions } = await admin
    .from('client_sessions')
    .select('id, scheduled_at, duration_minutes, status, confirmed_at')
    .eq('client_id', id)
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(6)

  const { data: clientFixedSlots } = await admin
    .from('client_fixed_slots')
    .select('id, day_of_week, session_time, duration_minutes')
    .eq('client_id', id)
    .order('day_of_week', { ascending: true })

  const { data: communicationsData } = await admin
    .from('client_communications')
    .select('id, kind, channel, subject, to_address, meta, sent_at')
    .eq('client_id', id)
    .order('sent_at', { ascending: false })
    .limit(15)
  const communications = communicationsData ?? []

  const activeCffs = cffsRecords?.find(c => !c.is_archived) || null
  const archivedCffs = cffsRecords?.filter(c => c.is_archived) || []
  // Split by kind. The foundational invitation is the original 221-question
  // intake (drives status of the Intake row). The supplementary is the
  // 5-question follow-up added 2026-05-12 (medications + dietary context)
  // and gets its own status row beneath. Treat a row with no `kind` as
  // foundational (default).
  const latestFoundationalInvitation = (invitations ?? [])
    .find(i => (i.kind ?? 'foundational') === 'foundational') || null
  const latestSupplementaryInvitation = (invitations ?? [])
    .find(i => i.kind === 'supplementary') || null
  const latestIntake = intakes?.[0] || null
  const latestIntakeId = latestIntake?.id || null
  const intakeDone = !!latestIntakeId || latestFoundationalInvitation?.status === 'complete'
  const latestCfws = cfwsRecords?.[0] || null
  const checkinToken = client.checkin_token as string | undefined

  // Find the most recent week with both A and B submitted
  const checkinsByWeek = new Map<number, Set<string>>()
  for (const ci of recentCheckins || []) {
    if (!checkinsByWeek.has(ci.week_number)) checkinsByWeek.set(ci.week_number, new Set())
    checkinsByWeek.get(ci.week_number)!.add(ci.form_type)
  }
  const latestCompleteWeek = [...checkinsByWeek.entries()]
    .filter(([, forms]) => forms.has('A') && forms.has('B'))
    .sort((a, b) => b[0] - a[0])[0]?.[0] ?? null
  const latestBaseline = baselines?.[0] || null
  const baselineToken = client.baseline_token as string | undefined
  const activeProgram = activePrograms || null

  // Doctrine: Signal Monitoring and Reassessment Triggers v1.0
  const cfwsForMonitor = (cfwsRecords || []).filter(c => !c.is_archived)

  // RPE creep — Workout Logging Phase C signal. Evaluated for the current
  // week of the active block. Falls into evaluateReadiness as drift on the
  // 'capacity' key + an optional reassessment recommendation.
  const blockWeek = activeProgram?.generated_at
    ? currentBlockWeek(activeProgram.generated_at)
    : null
  const rpeCreep = activeProgram?.id && blockWeek
    ? await evaluateRpeCreep(admin, client.id, activeProgram.id, blockWeek)
    : null

  const readinessReport = client.coaching_started_at
    ? evaluateReadiness({
        cfwsRows: cfwsForMonitor,
        activeCffs: activeCffs,
        activeProgram,
        client: { coaching_started_at: client.coaching_started_at },
        rpeCreep,
      })
    : null

  // Recovery and Regulation — Phase 2 shadow log + active state snapshot
  const recoverySnapshot = await loadRecoverySnapshot(admin, client.id)
  const recoveryMode = resolveRouterMode()

  // Workout logging Phase A — block + session completion snapshot
  const blockProgress = await loadBlockProgress(admin, client.id)
  const draftProgram = draftPrograms || null
  const activeNutritionPlan = activeNutritionPlans || null
  const draftNutritionPlan = draftNutritionPlans || null

  const readinessItems = activeCffs
    ? [
        { label: 'Capacity', value: activeCffs.exposure_readiness_capacity },
        { label: 'Schedule', value: activeCffs.exposure_readiness_schedule },
        { label: 'Regulation', value: activeCffs.exposure_readiness_regulation },
        { label: 'Behaviour', value: activeCffs.exposure_readiness_behaviour },
      ]
    : []

  const cffsSections = activeCffs
    ? [
        { label: 'Client Context Summary', content: activeCffs.client_context_summary },
        { label: 'Primary Patterns & Signals', content: activeCffs.primary_patterns_and_signals },
        { label: 'Capacity Constraints & Guardrails', content: activeCffs.capacity_constraints_and_guardrails },
        { label: 'Risk Flags & Watch Items', content: activeCffs.risk_flags_and_watch_items },
        { label: 'Tensions & Trade-Offs', content: activeCffs.tensions_and_tradeoffs },
        { label: 'Explicit Non-Directives', content: activeCffs.explicit_non_directives },
        { label: 'Closing Interpretive Notes', content: activeCffs.closing_interpretive_notes },
      ]
    : []

  const statusColour = {
    pending: 'text-[#6B6B6B] bg-stone-100 border-stone-200',
    started: 'text-amber-700 bg-amber-50 border-amber-200',
    complete: 'text-green-700 bg-green-50 border-green-200',
  }

  // ── Per-section defaultOpen flags ──────────────────────────────────────
  // Major sections collapse by default; only sections that have a clear
  // coach action open automatically so attention is never hidden behind a
  // click. Mirrors the same action-required signals the Today's Focus
  // state machine uses, but scoped to a single client profile.
  const frPublished = !!activeCffs?.client_reading_published_at
  const cffsActionRequired = !activeCffs || !frPublished
  const baselineActionRequired = !latestBaseline
  // Weekly Check-In opens if the LATEST submitted check-in has no coach
  // response AND was not marked Skipped by the coach. Older check-ins are
  // ignored — see also Today's Focus, same rule applies there. Skip is an
  // explicit per-check-in override.
  const latestCheckin = (recentCheckins ?? [])
    .slice()
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0] ?? null
  const latestCheckinNeedsResponse =
    !!latestCheckin &&
    !!latestCheckin.id &&
    !feedbackByCheckinId.has(latestCheckin.id) &&
    !latestCheckin.coach_skipped_at
  const cfwsActionRequired = latestCheckinNeedsResponse || (!!latestCompleteWeek && (!latestCfws || latestCfws.week_number < latestCompleteWeek))
  const trainingActionRequired = !activeProgram || !!draftProgram
  const nutritionActionRequired = !activeNutritionPlan || !!draftNutritionPlan
  // Payments signal isn't pre-fetched at this scope — leave closed by
  // default; ClientPaymentsSection itself surfaces any past_due / unpaid /
  // canceled flags inline once opened.
  const paymentsActionRequired = false

  // Medications: open if there's an action for the coach.
  const hasMedsText = !!(client.medications && (client.medications as string).trim())
  const medsAnalysis = client.medications_analysis ?? null
  const medsReading = client.medications_reading ?? null
  const medsAnalyzedAt = client.medications_analyzed_at ?? null
  const medsReadingAt = client.medications_reading_generated_at ?? null
  const medsPublishedAt = client.medications_reading_published_at ?? null
  const medsUpdatedAt = client.medications_updated_at ?? null
  const analysisStale = !!medsUpdatedAt && !!medsAnalyzedAt && new Date(medsUpdatedAt) > new Date(medsAnalyzedAt)
  const readingStale =
    (!!medsAnalyzedAt && !!medsReadingAt && new Date(medsAnalyzedAt) > new Date(medsReadingAt)) ||
    (!!medsUpdatedAt && !!medsReadingAt && new Date(medsUpdatedAt) > new Date(medsReadingAt))
  let medsAttention: string | null = null
  if (hasMedsText && !medsAnalysis) medsAttention = 'Analysis not generated'
  else if (analysisStale) medsAttention = 'Analysis rebuild recommended'
  else if (medsAnalysis && !medsReading) medsAttention = 'Reading not generated'
  else if (readingStale) medsAttention = 'Reading rebuild recommended'
  else if (medsReading && !medsPublishedAt) medsAttention = 'Reading not published'
  const medicationsActionRequired = !!medsAttention

  return (
    <div className="flex gap-8 max-w-5xl">
      <ProfileSidebar clientId={id} />
      <div className="flex-1 min-w-0">
      <div id="overview" className="scroll-mt-8">
        <Link
          href="/dashboard/coaching"
          className="inline-flex items-center gap-1 text-[12px] text-[#999999] hover:text-[#3A3A3A] transition-colors mb-4"
        >
          <ChevronLeft size={13} /> All Clients
        </Link>
        <PageHeader
          eyebrow="Client"
          title={client.name}
          subtitle={
            <span className="inline-flex items-center gap-3 flex-wrap" style={{ fontFamily: MONO_FONT, letterSpacing: '0.02em' }}>
              <span>Added {formatDate(client.created_at)}</span>
              {client.email && (
                <>
                  <span className="text-[#E5E5E5]">·</span>
                  <span className="text-[#6B6B6B]">{client.email}</span>
                </>
              )}
              <EditClientPhone clientId={client.id} currentPhone={client.phone ?? null} />
            </span>
          }
          cta={
            <NewIntakeButton
              clientId={client.id}
              clientName={client.name}
              clientEmail={client.email}
            />
          }
        />
      </div>

      {/* Deliberate Start Window */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E5] border-l-[3px] border-l-[#1B6DFC] rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1B6DFC] mb-1">Coaching Start Date</p>
            {client.coaching_started_at ? (
              <p className="text-sm text-[#3A3A3A]">
                {(() => {
                  const start = new Date(client.coaching_started_at)
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  start.setHours(0, 0, 0, 0)
                  const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  if (diff > 0) return `Starts in ${diff} day${diff === 1 ? '' : 's'} - ${start.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}`
                  if (diff === 0) return `Starts today - ${start.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}`
                  return `Active since ${start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`
                })()}
              </p>
            ) : (
              <p className="text-sm text-[#999999]">Not set - set a start date to begin the Deliberate Start Window</p>
            )}
          </div>
          <SetStartDate clientId={client.id} currentDate={client.coaching_started_at} />
        </div>
      </div>

      {/* Fixed Session Slot */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E5] border-l-[3px] border-l-[#1B6DFC] rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1B6DFC]">Face-to-Face Session</p>
          <Link
            href={`/dashboard/clients/${id}/fixed-session`}
            className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
          >
            {(clientFixedSlots ?? []).length > 0 ? 'Manage →' : 'Set up →'}
          </Link>
        </div>
        {(clientFixedSlots ?? []).length > 0 ? (
          <div className="space-y-1">
            {(clientFixedSlots ?? []).map(slot => (
              <div key={slot.id}>
                <span className="text-sm text-[#1A1A1A] font-medium">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][slot.day_of_week]}s
                </span>
                <span className="text-xs text-[#999999] ml-2">
                  · {new Date(`1970-01-01T${slot.session_time}`).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })} · {slot.duration_minutes} min
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#4A4A4A]">No fixed slots assigned yet.</p>
        )}
        {(upcomingClientSessions ?? []).length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#E5E5E5] space-y-2">
            <p className="text-xs text-[#4A4A4A] uppercase tracking-wider mb-2">Booked sessions</p>
            {(upcomingClientSessions ?? []).map(s => (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#3A3A3A]">
                    {new Date(s.scheduled_at).toLocaleDateString('en-AU', {
                      timeZone: 'Australia/Brisbane', weekday: 'short', day: 'numeric', month: 'short',
                    })}
                  </span>
                  <span className="text-xs text-[#4A4A4A] ml-2">
                    {new Date(s.scheduled_at).toLocaleTimeString('en-AU', {
                      timeZone: 'Australia/Brisbane', hour: 'numeric', minute: '2-digit', hour12: true,
                    })} · {s.duration_minutes} min
                  </span>
                </div>
                <span className={`text-xs ${s.confirmed_at ? 'text-blue-500' : 'text-[#999999]'}`}>
                  {s.confirmed_at ? 'Confirmed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Package */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E5] border-l-[3px] border-l-[#1B6DFC] rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1B6DFC]">Coaching Package</p>
          {client.subscription_active ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200 text-blue-500 bg-blue-50">
              Subscription Active
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-[#E5E5E5] text-[#999999]">
                Awaiting Payment
              </span>
              <OverrideSubscriptionButton clientId={client.id} />
            </div>
          )}
        </div>
        <PackageManager
          clientId={client.id}
          currentPackage={client.package}
          subscriptionLinkSendAt={client.subscription_link_send_at ?? null}
          subscriptionLinkSentAt={client.subscription_link_sent_at ?? null}
        />
        {(() => {
          const weekNumber = client.coaching_started_at ? getWeekNumber(client.coaching_started_at) : null
          const isUpgradeCandidate = TWO_SESSION_PACKAGE_VALUES.includes(client.package) && (weekNumber ?? 0) >= 8
          if (!isUpgradeCandidate) return null
          return (
            <div className="mt-3 pt-3 border-t border-[#E5E5E5] flex items-center justify-between">
              <p className="text-xs text-blue-500">Eligible for 2x to 3x upgrade (Week {weekNumber})</p>
              <Link
                href={`/companion/${id}/upgrade`}
                className="text-xs font-semibold text-blue-500 hover:text-blue-700 border border-blue-200/50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Upgrade Companion →
              </Link>
            </div>
          )
        })()}
      </div>

      {/* Communications log - everything sent to the client */}
      <ClientCommunicationsPanel rows={communications} />

      {/* Onboarding status */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E5] border-l-[3px] border-l-[#1B6DFC] rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1B6DFC]">Onboarding</p>
          <div className="flex items-center gap-2 flex-wrap">
            <SendPortalEmailButton clientId={client.id} />
            <SendPortalOrientationButton clientId={client.id} />
            <PortalInviteButton clientId={client.id} onboardingToken={client.onboarding_token} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Agreement', done: !!client.agreement_accepted_at, href: client.agreement_accepted_at ? `/dashboard/clients/${id}/agreement` : null },
            { label: 'Health Declaration', done: !!client.health_declaration_submitted_at, href: client.health_declaration_submitted_at ? `/dashboard/clients/${id}/health-declaration` : null },
            { label: 'Intake', done: intakeDone, href: intakeDone ? `/dashboard/clients/${id}/intake` : null },
            { label: 'Baseline', done: !!baselines?.[0], href: baselines?.[0] ? `/dashboard/clients/${id}/baseline` : null },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.done ? 'bg-blue-500' : 'bg-[#E5E5E5]'}`} />
              {item.href ? (
                <Link href={item.href} className="text-xs text-blue-500 hover:text-blue-700 transition-colors">{item.label} →</Link>
              ) : (
                <span className={`text-xs ${item.done ? 'text-[#3A3A3A]' : 'text-[#4A4A4A]'}`}>{item.label}</span>
              )}
            </div>
          ))}
        </div>
        {client.medical_clearance_required && (() => {
          // Surface whether the "clearance required" auto-email has fired so
          // we can spot silent send failures without digging into the
          // Communications panel. Pulls from the same communications array
          // already fetched above; for a pre-onboarding client this entry,
          // when present, sits well within the 15-row window.
          const clearanceEmail = communications.find(c => c.kind === 'medical_clearance_required')
          const emailSentAt = clearanceEmail?.sent_at as string | undefined
          return (
            <div className="mt-3 pt-3 border-t border-[#E5E5E5] space-y-2">
              <div className="flex items-center justify-between">
                {client.medical_clearance_received_at ? (
                  <p className="text-xs text-blue-500">Medical clearance received</p>
                ) : (
                  <>
                    <p className="text-xs text-amber-700">Medical clearance required</p>
                    <Link href={`/dashboard/clients/${id}/medical-clearance`} className="text-xs text-amber-700 hover:text-amber-700 underline transition-colors">Manage →</Link>
                  </>
                )}
              </div>
              {!client.medical_clearance_received_at && (
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${emailSentAt ? 'bg-blue-500' : 'bg-red-500'}`} />
                  {emailSentAt ? (
                    <p className="text-[10px] text-[#6B6B6B]" title={new Date(emailSentAt).toLocaleString('en-AU')}>
                      Client auto-email sent {new Date(emailSentAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    </p>
                  ) : (
                    <p className="text-[10px] text-red-700">
                      Client auto-email not sent. Run <code className="bg-[#E5E5E5] px-1 rounded">scripts/send-clearance-required-email.ts {client.id}</code> or nudge manually.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Foundational intake status */}
      {latestFoundationalInvitation && (
        <div className="bg-[#FFFFFF] border border-[#E5E5E5] border-l-[3px] border-l-[#1B6DFC] rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1B6DFC] mb-1">Intake</p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${
                    statusColour[latestFoundationalInvitation.status as keyof typeof statusColour]
                  }`}
                >
                  {latestFoundationalInvitation.status}
                </span>
                {latestFoundationalInvitation.status === 'complete' && latestFoundationalInvitation.completed_at && (
                  <span className="text-xs text-[#999999]">
                    Completed {formatDate(latestFoundationalInvitation.completed_at)}
                  </span>
                )}
              </div>
            </div>
            {latestFoundationalInvitation.status !== 'complete' && (
              <div className="flex items-center gap-2">
                {client.email && (
                  <SendEmailButton
                    clientId={client.id}
                    clientName={client.name}
                    clientEmail={client.email}
                    intakeToken={latestFoundationalInvitation.token}
                    variant="outline"
                  />
                )}
                <CopyLinkButton token={latestFoundationalInvitation.token} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Updates section.
          Container for any post-onboarding task the coach has queued for
          the client to complete on their portal. Each item below is its
          own named card; new item types (e.g. delta intake, full re-intake,
          block-end auto-prompt per project_deferred_reassessment_flows)
          slot in alongside as they're built.
          Hidden until the foundational intake is complete - there's
          nothing to "update" before the baseline is in. */}
      {latestFoundationalInvitation?.status === 'complete' && (
        <div id="updates" className="flex items-center justify-between mb-3 mt-2 scroll-mt-8">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" />
            <h2 className="text-[11px] font-bold text-[#1B6DFC] uppercase" style={{ fontFamily: MONO_FONT, letterSpacing: "0.14em" }}>
              Updates <span className="text-[#4A4A4A] font-normal">- post-onboarding follow-ups</span>
            </h2>
          </div>
        </div>
      )}

      {/* Updates · Supplementary intake.
          9-question follow-up (medications + 8 dietary/consumption fields).
          Three states: not sent yet (CTA to add it to the portal), pending
          (sitting in their portal — coach can email or copy the link),
          complete (with completion timestamp). For coach-driven edits of the
          dietary fields, the Dietary & Consumption editor below is the faster
          path; this client-driven flow also auto-regenerates the CFFS.  */}
      {latestFoundationalInvitation?.status === 'complete' && (
        <div className="bg-[#FFFFFF] border border-[#E5E5E5] border-l-[3px] border-l-[#1B6DFC] rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1B6DFC] mb-1">Supplementary intake</p>
              {latestSupplementaryInvitation ? (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${
                      statusColour[latestSupplementaryInvitation.status as keyof typeof statusColour]
                    }`}
                  >
                    {latestSupplementaryInvitation.status}
                  </span>
                  {latestSupplementaryInvitation.status === 'complete' && latestSupplementaryInvitation.completed_at && (
                    <span className="text-xs text-[#999999]">
                      Completed {formatDate(latestSupplementaryInvitation.completed_at)}
                    </span>
                  )}
                  {latestSupplementaryInvitation.status === 'pending' && (
                    <span className="text-xs text-[#999999]">
                      Sitting in their portal since {formatDate(latestSupplementaryInvitation.created_at)}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#999999]">Not sent yet — adds a 9-question follow-up card (meds + dietary/consumption) to the client's portal.</p>
              )}
              {latestSupplementaryInvitation?.status === 'complete' && (
                <p className="text-[11px] text-[#999999] mt-1">Need to update meds or dietary context again? Send a fresh one.</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {(!latestSupplementaryInvitation || latestSupplementaryInvitation.status === 'complete') && (
                <SendSupplementaryIntakeButton
                  clientId={client.id}
                  clientName={client.name}
                />
              )}
              {latestSupplementaryInvitation?.status === 'pending' && (
                <>
                  {client.email && (
                    <SendSupplementaryEmailButton
                      clientId={client.id}
                      clientName={client.name}
                    />
                  )}
                  <CopyLinkButton
                    token={latestSupplementaryInvitation.token}
                    label="Copy follow-up link"
                    path="/intake-supplement"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <MajorSection
        id="medications"
        title="Medications"
        defaultOpen={medicationsActionRequired}
        attentionLabel={medsAttention}
      >
        <MedicationsEditor
          clientId={client.id}
          initialValue={client.medications ?? null}
          updatedAt={client.medications_updated_at ?? null}
          activeProgramGeneratedAt={activeProgram?.generated_at ?? null}
          activeNutritionGeneratedAt={activeNutritionPlan?.generated_at ?? null}
        />

        <MedicationsAnalysisPanel
          clientId={client.id}
          clientFirstName={client.name?.split(' ')[0] ?? 'client'}
          medicationsText={client.medications ?? null}
          medicationsUpdatedAt={client.medications_updated_at ?? null}
          analysis={(client.medications_analysis as null | { medications: Array<{ name: string; purpose: string; client_influence: string; program_influence: string; nutrition_influence: string; recovery_influence: string }>; combined_picture: string }) ?? null}
          analyzedAt={client.medications_analyzed_at ?? null}
          reading={(client.medications_reading as null | { mr_what_youre_taking: string; mr_why_it_matters: string; mr_how_we_account_for_it: string; mr_what_to_watch: string }) ?? null}
          readingGeneratedAt={client.medications_reading_generated_at ?? null}
          readingPublishedAt={client.medications_reading_published_at ?? null}
        />
      </MajorSection>

      {latestIntakeId && (
        <MajorSection
          id="dietary-consumption"
          title="Dietary & Consumption"
          defaultOpen={false}
        >
          <DietaryConsumptionEditor
            clientId={client.id}
            initialValues={{
              dietary_restrictions: latestIntake?.dietary_restrictions ?? '',
              dietary_preferences: latestIntake?.dietary_preferences ?? '',
              typical_day_eating: latestIntake?.typical_day_eating ?? '',
              meals_per_day: latestIntake?.meals_per_day ?? '',
              fluid_intake: latestIntake?.fluid_intake ?? '',
              caffeine_intake: latestIntake?.caffeine_intake ?? '',
              alcohol_intake: latestIntake?.alcohol_intake ?? '',
              eating_context: latestIntake?.eating_context ?? '',
            }}
            updatedAt={latestIntake?.dietary_updated_at ?? null}
            activeProgramGeneratedAt={activeProgram?.generated_at ?? null}
            activeNutritionGeneratedAt={activeNutritionPlan?.generated_at ?? null}
          />
        </MajorSection>
      )}

      <MajorSection
        id="bloods"
        title="Health Markers"
        subtitle="- blood panels"
        defaultOpen={(bloodPanels ?? []).some(p => p.status === 'extracted' || p.status === 'failed')}
        attentionLabel={
          (bloodPanels ?? []).some(p => p.status === 'failed')
            ? 'Read failed'
            : (bloodPanels ?? []).some(p => p.status === 'extracted')
            ? 'Needs review'
            : null
        }
      >
        <BloodPanelsPanel
          clientId={client.id}
          clientFirstName={client.name?.split(' ')[0] ?? 'client'}
          panels={(bloodPanels ?? []) as BloodPanelData[]}
        />
      </MajorSection>

      <MajorSection
        id="cffs"
        title="Foundational Synthesis"
        subtitle="- CFFS"
        defaultOpen={cffsActionRequired}
        attentionLabel={!activeCffs ? 'No CFFS yet' : (!frPublished ? 'FR not published' : null)}
      >
      {!activeCffs ? (
        <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl p-8 text-center">
          <p className="text-[#6B6B6B] mb-2">No CFFS generated yet</p>
          <p className="text-[#4A4A4A] text-sm mb-4">
            {latestFoundationalInvitation?.status === 'pending'
              ? 'Waiting for the client to complete their intake.'
              : latestIntakeId
              ? 'Intake submitted but CFFS generation may have failed.'
              : 'CFFS will be generated automatically when the client submits their intake.'}
          </p>
          {latestIntakeId && (
            <div className="flex justify-center">
              <RegenerateCFFSButton clientId={client.id} intakeId={latestIntakeId} />
            </div>
          )}
        </div>
      ) : (
        <>

          {/* State + Exposure Readiness */}
          <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl overflow-hidden mb-4">
            <div className="px-5 pt-5 pb-4 grid grid-cols-2 gap-4 border-b border-[#E5E5E5]">
              <div>
                <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest mb-2">Body State Classification</p>
                <p className="text-lg font-bold text-[#1A1A1A] leading-tight mb-2">{activeCffs.body_state_classification}</p>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 bg-[#1B6DFC]" />
                  <p className="text-xs text-[#6B6B6B]">Resolution: <span className="text-[#1A1A1A] font-semibold">{activeCffs.resolution_state}</span></p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest mb-3">Exposure Readiness</p>
                <div className="grid grid-cols-2 gap-2">
                  {readinessItems.map(item => (
                    <div key={item.label} className={`px-3 py-2 rounded-lg border-l-2 ${
                      item.value === 'Green' ? 'bg-green-50 border-green-500' :
                      item.value === 'Amber' ? 'bg-amber-50 border-amber-500' :
                      item.value === 'Red' ? 'bg-red-50 border-red-500' :
                      'bg-[#E5E5E5] border-[#D4D4D4]'
                    }`}>
                      <p className={`text-xs font-bold mb-0.5 ${
                        item.value === 'Green' ? 'text-green-400' :
                        item.value === 'Amber' ? 'text-amber-700' :
                        item.value === 'Red' ? 'text-red-700' :
                        'text-[#6B6B6B]'
                      }`}>{item.value}</p>
                      <p className="text-[10px] text-[#999999] font-medium uppercase tracking-wide">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-[#4A4A4A] text-xs">Generated {formatDate(activeCffs.generated_at)}</p>
                {/* Visual Signal Integration: shows whether photos were read at generation time. */}
                {typeof activeCffs.photos_used === 'number' && (
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border uppercase ${
                      activeCffs.photos_used > 0
                        ? 'text-[#1B6DFC] bg-[rgba(27,109,252,0.10)] border-[#B5CFFC]'
                        : 'text-[#999999] bg-[#FFFFFF] border-[#E5E5E5]'
                    }`}
                    style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
                    title={
                      activeCffs.photos_used > 0
                        ? `Baseline photos read by the Fat Map: ${activeCffs.photos_used} of 3`
                        : 'No baseline photos attached at generation time'
                    }
                  >
                    <span
                      className="w-1 h-1 rounded-full"
                      style={{ background: activeCffs.photos_used > 0 ? '#1B6DFC' : '#999999' }}
                    />
                    Photos {activeCffs.photos_used > 0 ? `✓ ${activeCffs.photos_used}/3` : '✗ Not provided'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/clients/${client.id}/cffs-report`}
                  target="_blank"
                  className="text-xs font-medium px-3 py-1.5 border border-[#E5E5E5] text-[#6B6B6B] rounded-lg hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors"
                >
                  Download PDF
                </Link>
                {latestIntakeId && (
                  <RegenerateCFFSButton clientId={client.id} intakeId={latestIntakeId} />
                )}
              </div>
            </div>
          </div>

          {/* Doctrine: Signal Monitoring v1.0 - readiness monitor panel */}
          {readinessReport && (readinessReport.status !== 'clean' || readinessReport.block?.weeksRemaining != null) && (
            <div
              className="bg-[#FFFFFF] border rounded-2xl overflow-hidden mb-4"
              style={{
                borderColor: readinessReport.status === 'regression' ? '#FEE7E7'
                  : readinessReport.status === 'reassessment' ? '#F0DCB4'
                  : '#E5E5E5',
              }}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E5E5]">
                <div className="flex items-center gap-2.5">
                  {readinessReport.status === 'regression' ? (
                    <Activity size={13} className="text-[#DC2626]" />
                  ) : readinessReport.status === 'reassessment' ? (
                    <RefreshCw size={13} className="text-[#B7791F]" />
                  ) : (
                    <AlertTriangleIcon size={13} className="text-[#6B6B6B]" />
                  )}
                  <p
                    className="text-[10px] font-bold uppercase"
                    style={{
                      fontFamily: MONO_FONT,
                      letterSpacing: '0.14em',
                      color: readinessReport.status === 'regression' ? '#DC2626'
                        : readinessReport.status === 'reassessment' ? '#B7791F'
                        : '#3A3A3A',
                    }}
                  >
                    {readinessReport.status === 'regression' ? 'Active Regression - Coach Review Required'
                      : readinessReport.status === 'reassessment' ? 'CFFS Reassessment Recommended'
                      : readinessReport.status === 'advisory' ? 'Drift Advisory'
                      : 'Block Status'}
                  </p>
                </div>
                <span className="text-[10px] text-[#999999]" style={{ fontFamily: MONO_FONT }}>
                  Signal Monitoring v1.0
                </span>
              </div>

              {/* Drift conditions */}
              {readinessReport.drift.length > 0 && (
                <div className="px-5 py-4 border-b border-[#E5E5E5]">
                  <p className="text-[10px] font-bold text-[#999999] uppercase mb-2" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>
                    Drift this week
                  </p>
                  <ul className="space-y-1.5">
                    {readinessReport.drift.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px]">
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: d.severity === 'high' ? '#DC2626' : '#6B6B6B' }}
                        />
                        <span className={d.severity === 'high' ? 'text-[#1A1A1A]' : 'text-[#6B6B6B]'}>{d.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* RPE creep per-exercise breakdown — only when present */}
              {(() => {
                const creepEntry = readinessReport.drift.find(d => d.kind === 'rpe_creep_current_week')
                const creep = creepEntry?.rpeCreep
                if (!creep || creep.findings.length === 0) return null
                return (
                  <div className="px-5 py-4 border-b border-[#E5E5E5]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-[#999999] uppercase" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>
                        RPE creep — week {creep.weekNumberInBlock}
                      </p>
                      <span className="text-[10px] text-[#999999]" style={{ fontFamily: MONO_FONT }}>
                        {creep.creepingCount} exercise{creep.creepingCount === 1 ? '' : 's'}{creep.severeCount > 0 ? ` · ${creep.severeCount} severe` : ''}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {creep.findings.slice(0, 6).map((f, i) => (
                        <li key={i} className="flex items-center justify-between gap-3 text-[12px]">
                          <span className={f.severe ? 'text-[#1A1A1A]' : 'text-[#6B6B6B]'}>{f.exerciseName}</span>
                          <span className="shrink-0 tabular-nums" style={{ fontFamily: MONO_FONT }}>
                            <span className="text-[#999999]">RPE</span>{' '}
                            <span className="text-[#999999]">{f.prescribedRpe}</span>
                            <span className="text-[#999999]"> → </span>
                            <span className={f.severe ? 'text-[#DC2626]' : 'text-[#B7791F]'}>{f.avgLoggedRpe}</span>
                            <span className={f.severe ? 'text-[#DC2626]' : 'text-[#B7791F]'}> (+{f.delta})</span>
                            {f.maxLoggedRpe >= 9.5 && (
                              <span className="text-[#DC2626]"> · max {f.maxLoggedRpe}</span>
                            )}
                            <span className="text-[#999999]"> · {f.setCount} set{f.setCount === 1 ? '' : 's'}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                    {creep.findings.length > 6 && (
                      <p className="text-[11px] text-[#999999] mt-2" style={{ fontFamily: MONO_FONT }}>
                        +{creep.findings.length - 6} more not shown
                      </p>
                    )}
                  </div>
                )
              })()}

              {/* Reassessment reasons */}
              {readinessReport.reassessmentReasons.length > 0 && (
                <div className="px-5 py-4 border-b border-[#E5E5E5]">
                  <p className="text-[10px] font-bold text-[#999999] uppercase mb-2" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>
                    Reassessment triggers
                  </p>
                  <ul className="space-y-2">
                    {readinessReport.reassessmentReasons.map((r, i) => (
                      <li key={i} className="text-[13px]">
                        <p className="text-[#1A1A1A]">{r.message}</p>
                        <p className="text-[11px] text-[#999999] mt-0.5" style={{ fontFamily: MONO_FONT }}>
                          Recommended depth: <span className="text-[#6B6B6B]">{r.recommendedDepth}</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                  {latestIntakeId && (
                    <div className="mt-4">
                      <RegenerateCFFSButton clientId={client.id} intakeId={latestIntakeId} />
                    </div>
                  )}
                </div>
              )}

              {/* Block status */}
              {readinessReport.block && (
                <div className="px-5 py-3">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#999999]">
                      Block <span className="text-[#3A3A3A]">{readinessReport.block.blockName ?? '-'}</span>
                      {readinessReport.block.weekDuration != null && (
                        <> · {readinessReport.block.weekDuration}-week duration</>
                      )}
                    </span>
                    <span
                      className="text-[11px] font-medium"
                      style={{
                        fontFamily: MONO_FONT,
                        color: readinessReport.block.isAtBlockEnd ? '#B7791F' : '#999999',
                      }}
                    >
                      {readinessReport.block.isAtBlockEnd
                        ? 'Block complete - reassessment review'
                        : readinessReport.block.weeksRemaining != null
                          ? `${readinessReport.block.weeksRemaining} week${readinessReport.block.weeksRemaining === 1 ? '' : 's'} remaining`
                          : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Block progress + workout logging (Phase A) */}
          <BlockProgressPanel data={blockProgress} />

          {/* Recovery Router (Phase 2 / observe-only) */}
          <RecoveryRouterPanel snapshot={recoverySnapshot} mode={recoveryMode} />

          {/* What is a CFFS */}
          <div className="border-l-2 border-[#1B6DFC] bg-[#FFFFFF]/50 border border-[#E5E5E5] rounded-2xl p-5 mb-4">
            <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-3">About This Report</p>
            <p className="text-sm font-semibold text-[#1A1A1A] leading-relaxed mb-3">
              This is not a summary. It is a structured interpretation of how this client&apos;s system is currently organising itself.
            </p>
            <p className="text-sm text-[#999999] leading-relaxed">
              The CFFS translates 208 data points across eight signal domains into a single, coherent picture of the client&apos;s current body state. Nothing here prescribes or diagnoses - you remain the interpretive authority.
            </p>
          </div>

          {/* Visual Signal Summary - dedicated read of what the photos contributed.
              Only renders when the Fat Map had photo input at generation time. Sits
              above the standard CFFS sections so coaches can scan the visual layer
              at a glance. */}
          {activeCffs.visual_signal_summary && (
            <div className="mb-3 bg-[#FFFFFF] border border-[#B5CFFC] rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-[#B5CFFC] bg-[rgba(27,109,252,0.06)]">
                <Eye size={13} className="text-[#1B6DFC]" />
                <p
                  className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest"
                  style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
                >
                  Visual Signal Summary
                </p>
                <span
                  className="ml-auto text-[10px] text-[#4A4A4A]"
                  style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
                >
                  What the {activeCffs.photos_used ?? 3} baseline photo{(activeCffs.photos_used ?? 3) === 1 ? '' : 's'} contributed
                </span>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-[#1A1A1A] leading-relaxed">{activeCffs.visual_signal_summary}</p>
              </div>
            </div>
          )}

          {/* CFFS Sections */}
          <div className="space-y-2 mb-6">
            {cffsSections.map((section, i) => (
              <div key={section.label} className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E5E5E5] bg-[#FFFFFF]/80">
                  <span className="text-[11px] font-black text-[#1B6DFC]">{String(i + 1).padStart(2, '0')}</span>
                  <p className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">{section.label}</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm text-[#1A1A1A] leading-relaxed">{section.content}</p>
                </div>
              </div>
            ))}
          </div>

          <ClientReadingPanel
            cffs={activeCffs as Parameters<typeof ClientReadingPanel>[0]['cffs']}
            clientId={client.id}
            clientToken={client.onboarding_token ?? null}
          />

          {/* Archived CFFS */}
          {archivedCffs.length > 0 && (
            <div className="mt-8">
              <p className="text-[#999999] text-sm mb-3">Previous CFFS ({archivedCffs.length})</p>
              <div className="space-y-2">
                {archivedCffs.map(c => (
                  <div
                    key={c.id}
                    className="bg-[#FFFFFF]/50 border border-[#E5E5E5] rounded-lg px-4 py-3 flex items-center justify-between opacity-60"
                  >
                    <span className="text-sm text-[#6B6B6B]">{formatDate(c.generated_at)}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${getStateColour(c.body_state_classification)}`}
                    >
                      {c.body_state_classification}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      </MajorSection>

      {/* Baseline Section */}
      <MajorSection
        id="baseline"
        title="Baseline"
        defaultOpen={baselineActionRequired}
        attentionLabel={baselineActionRequired ? 'Not submitted' : null}
        actionRight={
          baselineToken && !latestBaseline
            ? <CopyLinkButton token={baselineToken} label="Copy baseline link" path="/baseline" />
            : undefined
        }
      >
        {latestBaseline ? (
          <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#999999] uppercase tracking-wider">Week {latestBaseline.re_capture_week} capture · {new Date(latestBaseline.captured_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              {baselineToken && (
                <CopyLinkButton token={baselineToken} label="Re-capture link" path="/baseline" />
              )}
            </div>

            {/* Measurements */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Bodyweight', value: latestBaseline.bodyweight_kg, unit: 'kg' },
                { label: 'Waist', value: latestBaseline.waist_cm, unit: 'cm' },
                { label: 'Hips', value: latestBaseline.hips_cm, unit: 'cm' },
                { label: 'Chest', value: latestBaseline.chest_cm, unit: 'cm' },
              ].map(m => (
                <div key={m.label} className="bg-[#E5E5E5]/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-[#999999] mb-1">{m.label}</p>
                  <p className="text-base font-semibold text-[#1A1A1A]">{m.value ?? '-'}<span className="text-xs text-[#999999] ml-1">{m.unit}</span></p>
                </div>
              ))}
            </div>

            {/* Photos */}
            {(latestBaseline.photo_front_url || latestBaseline.photo_side_url || latestBaseline.photo_back_url) && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Front', url: latestBaseline.photo_front_url },
                  { label: 'Side', url: latestBaseline.photo_side_url },
                  { label: 'Back', url: latestBaseline.photo_back_url },
                ].map(photo => (
                  <div key={photo.label} className="space-y-1.5">
                    <p className="text-xs text-[#999999] text-center">{photo.label}</p>
                    {photo.url ? (
                      <a href={photo.url} target="_blank" rel="noopener noreferrer">
                        <img src={photo.url} alt={photo.label} className="w-full aspect-[3/4] object-cover rounded-xl hover:opacity-80 transition-opacity" />
                      </a>
                    ) : (
                      <div className="w-full aspect-[3/4] bg-[#E5E5E5] rounded-xl flex items-center justify-center">
                        <p className="text-[#4A4A4A] text-xs">No photo</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#FFFFFF]/50 border border-[#E5E5E5] rounded-xl p-5 text-center">
            <p className="text-[#999999] text-sm">No baseline submitted yet</p>
            <p className="text-[#4A4A4A] text-xs mt-1">Send the client their baseline link to begin</p>
          </div>
        )}
      </MajorSection>

      {/* Weekly Check-In Section */}
      <MajorSection
        id="cfws"
        title="Weekly Synthesis"
        subtitle="- CFWS"
        defaultOpen={cfwsActionRequired}
        attentionLabel={latestCheckinNeedsResponse ? 'Latest check-in needs response' : (cfwsActionRequired ? 'New CFWS ready to generate' : null)}
        actionRight={
          <>
            <ReopenCheckinButton clientId={id} overrideUntil={client.checkin_window_override_until ?? null} />
            {checkinToken && <CopyLinkButton token={checkinToken} label="Copy check-in link" path="/checkin" />}
          </>
        }
      >

        {/* Latest CFWS */}
        {latestCfws ? (
          <>
            {/* Readiness grid */}
            <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl overflow-hidden mb-4">
              <div className="px-5 pt-5 pb-4 border-b border-[#E5E5E5]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest">Exposure Readiness</p>
                  <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest">Week {latestCfws.week_number}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Capacity', value: latestCfws.exposure_readiness_capacity },
                    { label: 'Schedule', value: latestCfws.exposure_readiness_schedule },
                    { label: 'Regulation', value: latestCfws.exposure_readiness_regulation },
                    { label: 'Behaviour', value: latestCfws.exposure_readiness_behaviour },
                  ].map(item => (
                    <div key={item.label} className={`px-3 py-2 rounded-lg border-l-2 ${
                      item.value === 'Green' ? 'bg-green-50 border-green-500' :
                      item.value === 'Amber' ? 'bg-amber-50 border-amber-500' :
                      item.value === 'Red' ? 'bg-red-50 border-red-500' :
                      'bg-[#E5E5E5] border-[#D4D4D4]'
                    }`}>
                      <p className={`text-xs font-bold mb-0.5 ${
                        item.value === 'Green' ? 'text-green-400' :
                        item.value === 'Amber' ? 'text-amber-700' :
                        item.value === 'Red' ? 'text-red-700' :
                        'text-[#6B6B6B]'
                      }`}>{item.value}</p>
                      <p className="text-[10px] text-[#999999] font-medium uppercase tracking-wide">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <p className="text-[#4A4A4A] text-xs">Generated {formatDate(latestCfws.generated_at)}</p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/clients/${client.id}/cfws-report`}
                    target="_blank"
                    className="text-xs font-medium px-3 py-1.5 border border-[#E5E5E5] text-[#6B6B6B] rounded-lg hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors"
                  >
                    Download PDF
                  </Link>
                  {latestCompleteWeek && <RegenerateCFWSButton clientId={id} weekNumber={latestCompleteWeek} />}
                </div>
              </div>
            </div>

            {/* About block */}
            <div className="border-l-2 border-[#1B6DFC] bg-[#FFFFFF]/50 border border-[#E5E5E5] rounded-2xl p-5 mb-4">
              <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-3">About This Report</p>
              <p className="text-sm font-semibold text-[#1A1A1A] leading-relaxed mb-3">
                This is not a summary. It is a structured interpretation of how this client&apos;s system is behaving this week.
              </p>
              <p className="text-sm text-[#999999] leading-relaxed">
                The CFWS translates weekly check-in signals across training load, recovery, regulation, and lifestyle into a coherent picture. Nothing here prescribes or diagnoses - you remain the interpretive authority.
              </p>
            </div>

            {/* CFWS Sections */}
            <div className="space-y-2 mb-6">
              {[
                { label: 'Context Snapshot', content: latestCfws.client_context_snapshot },
                { label: 'Dominant Weekly Patterns', content: latestCfws.dominant_weekly_patterns },
                { label: 'Capacity Constraints', content: latestCfws.weekly_capacity_constraints },
                { label: 'Risk Flags', content: latestCfws.weekly_risk_flags },
                { label: 'Tensions & Trade-Offs', content: latestCfws.weekly_tensions_tradeoffs },
                { label: 'Explicit Non-Directives', content: latestCfws.explicit_weekly_non_directives },
                { label: 'Closing Notes', content: latestCfws.closing_weekly_notes },
              ].filter(s => s.content).map((section, i) => (
                <div key={section.label} className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E5E5E5] bg-[#FFFFFF]/80">
                    <span className="text-[11px] font-black text-[#1B6DFC]">{String(i + 1).padStart(2, '0')}</span>
                    <p className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-widest">{section.label}</p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-sm text-[#1A1A1A] leading-relaxed">{section.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-[#FFFFFF]/50 border border-[#E5E5E5] rounded-xl p-5 mb-3 text-center">
            <p className="text-[#999999] text-sm">No weekly synthesis yet</p>
            {latestCompleteWeek ? (
              <div className="mt-3">
                <RegenerateCFWSButton clientId={id} weekNumber={latestCompleteWeek} />
              </div>
            ) : (
              <p className="text-[#4A4A4A] text-xs mt-1">Generated after each A+B check-in pair is complete</p>
            )}
          </div>
        )}

        {/* Check-in submission log */}
        {recentCheckins && recentCheckins.length > 0 && (
          <div className="bg-[#FFFFFF]/50 border border-[#E5E5E5] rounded-xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1B6DFC] mb-3">Recent Submissions</p>
            <div className="space-y-2">
              {recentCheckins.slice(0, 8).map((ci, i) => {
                const fb = ci.id ? feedbackByCheckinId.get(ci.id) : undefined
                const sent = !!fb?.email_sent_at
                const skipped = !!ci.coach_skipped_at && !fb
                return (
                  <Link
                    key={i}
                    href={`/dashboard/clients/${id}/checkins/${ci.week_number}/${ci.form_type}`}
                    className="flex items-center justify-between text-xs hover:bg-[#E5E5E5]/50 -mx-2 px-2 py-1 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[#6B6B6B]">Week {ci.week_number} · Form {ci.form_type}</span>
                      {fb && (
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${sent ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                          {sent ? 'Response sent' : 'Draft'}
                        </span>
                      )}
                      {skipped && (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#E5E5E5] border border-[#D4D4D4] text-[#6B6B6B]">
                          Skipped
                        </span>
                      )}
                    </div>
                    <span className="text-[#4A4A4A]">{formatDate(ci.submitted_at)}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Coach response history */}
        {feedbackHistory && feedbackHistory.length > 0 && (
          <div className="bg-[#FFFFFF]/50 border border-[#E5E5E5] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1B6DFC]">Coach Response History</p>
              <p className="text-[10px] text-[#4A4A4A] uppercase tracking-widest">{feedbackHistory.length} total</p>
            </div>
            <div className="space-y-3">
              {feedbackHistory.map(fb => (
                <CoachResponseCard
                  key={fb.id}
                  clientId={id}
                  feedback={fb}
                  meta={checkinMetaById.get(fb.weekly_checkin_id)}
                />
              ))}
            </div>
          </div>
        )}
      </MajorSection>

      {/* Training Program Section */}
      <MajorSection
        id="training"
        title="Training Program"
        subtitle="PTS"
        defaultOpen={trainingActionRequired}
        attentionLabel={!activeProgram ? 'No active program' : draftProgram ? 'Draft awaiting review' : null}
        actionRight={
          <Link
            href={`/dashboard/clients/${id}/plan`}
            className="text-xs font-medium px-3 py-1.5 border border-[#E5E5E5] text-[#6B6B6B] rounded-lg hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors"
          >
            Macro Plan
          </Link>
        }
      >
        <div className="space-y-2">
          {/* Draft program */}
          {draftProgram && (
            <Link
              href={`/dashboard/clients/${id}/program/draft/${draftProgram.id}`}
              className="block bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl p-5 hover:border-[#D4D4D4] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-[#1A1A1A]">{draftProgram.block_name}</p>
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-700 text-amber-700 uppercase tracking-wide">Draft</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E5E5E5] text-[#6B6B6B] capitalize">{draftProgram.progression_phase}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E5E5E5] text-[#6B6B6B] capitalize">{draftProgram.training_goal}</span>
                </div>
              </div>
              <p className="text-xs text-[#999999]">
                {draftProgram.training_frequency}x/week · {draftProgram.week_duration} weeks · Generated {formatDate(draftProgram.generated_at)}
              </p>
              <p className="text-xs text-[#1B6DFC] mt-2">Review &amp; edit draft →</p>
            </Link>
          )}

          {/* Active program */}
          {activeProgram ? (
            <Link
              href={`/dashboard/clients/${id}/program`}
              className="block bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl p-5 hover:border-[#D4D4D4] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-[#1A1A1A]">{activeProgram.block_name}</p>
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E5E5E5] text-[#6B6B6B] capitalize">
                    {activeProgram.progression_phase}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E5E5E5] text-[#6B6B6B] capitalize">
                    {activeProgram.training_goal}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#999999]">
                {activeProgram.training_frequency}x/week · {activeProgram.week_duration} weeks · Generated {formatDate(activeProgram.generated_at)}
              </p>
              <p className="text-xs text-[#1B6DFC] mt-2">View full program →</p>
            </Link>
          ) : !draftProgram ? (
            <div className="bg-[#FFFFFF]/50 border border-[#E5E5E5] rounded-xl p-5 text-center">
              <p className="text-[#999999] text-sm">No program generated yet</p>
              <p className="text-[#4A4A4A] text-xs mt-1">Generate a program once the CFFS is complete</p>
            </div>
          ) : null}
        </div>
      </MajorSection>

      {/* Nutrition Plan Section */}
      <MajorSection
        id="nutrition"
        title="Nutrition Plan"
        subtitle="HABNS"
        defaultOpen={nutritionActionRequired}
        attentionLabel={!activeNutritionPlan ? 'No active plan' : draftNutritionPlan ? 'Draft awaiting review' : null}
        actionRight={
          <Link
            href={`/dashboard/clients/${id}/nutrition/suggest`}
            className="text-xs font-medium px-3 py-1.5 border border-[#E5E5E5] text-[#6B6B6B] rounded-lg hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors"
          >
            {activeNutritionPlan ? 'Regenerate' : 'Generate Plan'}
          </Link>
        }
      >
        <div className="space-y-2">
          {/* Draft nutrition plan */}
          {draftNutritionPlan && (
            <Link
              href={`/dashboard/clients/${id}/nutrition`}
              className="block bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl p-5 hover:border-[#D4D4D4] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-[#1A1A1A]">{draftNutritionPlan.plan_name}</p>
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-700 text-amber-700 uppercase tracking-wide">Draft</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E5E5E5] text-[#6B6B6B] capitalize">{draftNutritionPlan.entry_state.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E5E5E5] text-[#6B6B6B] capitalize">{draftNutritionPlan.carb_demand_level} carbs</span>
                </div>
              </div>
              <p className="text-xs text-[#999999]">Generated {formatDate(draftNutritionPlan.generated_at)}</p>
              <p className="text-xs text-[#1B6DFC] mt-2">Review &amp; approve draft →</p>
            </Link>
          )}

          {/* Active nutrition plan */}
          {activeNutritionPlan ? (
            <Link
              href={`/dashboard/clients/${id}/nutrition`}
              className="block bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl p-5 hover:border-[#D4D4D4] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-[#1A1A1A]">{activeNutritionPlan.plan_name}</p>
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E5E5E5] text-[#6B6B6B] capitalize">{activeNutritionPlan.entry_state.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E5E5E5] text-[#6B6B6B] capitalize">{activeNutritionPlan.carb_demand_level} carbs</span>
                  {activeNutritionPlan.current_direction && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                      activeNutritionPlan.current_direction === 'progress' ? 'bg-blue-50 text-blue-500' :
                      activeNutritionPlan.current_direction === 'rebuild' ? 'bg-red-50 text-red-700' :
                      'bg-[#E5E5E5] text-[#6B6B6B]'
                    }`}>{activeNutritionPlan.current_direction}</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#999999]">Generated {formatDate(activeNutritionPlan.generated_at)}</p>
              <p className="text-xs text-[#1B6DFC] mt-2">View full nutrition plan →</p>
            </Link>
          ) : !draftNutritionPlan ? (
            <div className="bg-[#FFFFFF]/50 border border-[#E5E5E5] rounded-xl p-5 text-center">
              <p className="text-[#999999] text-sm">No nutrition plan generated yet</p>
              <p className="text-[#4A4A4A] text-xs mt-1">Generate a plan once the CFFS is complete</p>
            </div>
          ) : null}
        </div>
      </MajorSection>

      {/* Payments Section */}
      <MajorSection
        id="payments"
        title="Payments"
        defaultOpen={paymentsActionRequired}
      >
        <ClientPaymentsSection clientId={id} />
      </MajorSection>

      <ClientDangerActions clientId={id} isActive={client.active !== false} />

      </div>
    </div>
  )
}
