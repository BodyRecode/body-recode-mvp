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
import RegenerateCFWSButton from '@/components/regenerate-cfws-button'
import CoachResponseCard from './coach-response-card'
import MajorSection from './major-section'
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
      .select('id')
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
      .select('id, week_number, form_type, submitted_at')
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
  // Split by kind. The foundational invitation is the original 208-question
  // intake (drives status of the Intake row). The supplementary is the
  // 5-question follow-up added 2026-05-12 (medications + dietary context)
  // and gets its own status row beneath. Treat a row with no `kind` as
  // foundational (default).
  const latestFoundationalInvitation = (invitations ?? [])
    .find(i => (i.kind ?? 'foundational') === 'foundational') || null
  const latestSupplementaryInvitation = (invitations ?? [])
    .find(i => i.kind === 'supplementary') || null
  const latestIntakeId = intakes?.[0]?.id || null
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
    pending: 'text-[#a8a29e] bg-[#1c1917] border-[#1c1917]',
    started: 'text-amber-300 bg-amber-950/50 border-amber-800',
    complete: 'text-green-300 bg-green-950/50 border-green-800',
  }

  // ── Per-section defaultOpen flags ──────────────────────────────────────
  // Major sections collapse by default; only sections that have a clear
  // coach action open automatically so attention is never hidden behind a
  // click. Mirrors the same action-required signals the Today's Focus
  // state machine uses, but scoped to a single client profile.
  const frPublished = !!activeCffs?.client_reading_published_at
  const cffsActionRequired = !activeCffs || !frPublished
  const baselineActionRequired = !latestBaseline
  // Weekly Check-In opens if a submitted check-in has no coach response yet.
  const anyUnansweredCheckin = (recentCheckins ?? []).some(ci => ci.id && !feedbackByCheckinId.has(ci.id))
  const cfwsActionRequired = anyUnansweredCheckin || (!!latestCompleteWeek && (!latestCfws || latestCfws.week_number < latestCompleteWeek))
  const trainingActionRequired = !activeProgram || !!draftProgram
  const nutritionActionRequired = !activeNutritionPlan || !!draftNutritionPlan
  // Payments signal isn't pre-fetched at this scope — leave closed by
  // default; ClientPaymentsSection itself surfaces any past_due / unpaid /
  // canceled flags inline once opened.
  const paymentsActionRequired = false

  return (
    <div className="flex gap-8 max-w-5xl">
      <ProfileSidebar clientId={id} />
      <div className="flex-1 min-w-0">
      <div id="overview" className="scroll-mt-8">
        <Link
          href="/dashboard/coaching"
          className="inline-flex items-center gap-1 text-[12px] text-[#57534e] hover:text-[#d4cfc9] transition-colors mb-4"
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
                  <span className="text-[#1c1917]">·</span>
                  <span className="text-[#a8a29e]">{client.email}</span>
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
      <div className="bg-[#111110] border border-[#1c1917] rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#57534e] mb-1">Coaching Start Date</p>
            {client.coaching_started_at ? (
              <p className="text-sm text-[#d4cfc9]">
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
              <p className="text-sm text-[#57534e]">Not set - set a start date to begin the Deliberate Start Window</p>
            )}
          </div>
          <SetStartDate clientId={client.id} currentDate={client.coaching_started_at} />
        </div>
      </div>

      {/* Fixed Session Slot */}
      <div className="bg-[#111110] border border-[#1c1917] rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wider text-[#57534e]">Face-to-Face Session</p>
          <Link
            href={`/dashboard/clients/${id}/fixed-session`}
            className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
          >
            {(clientFixedSlots ?? []).length > 0 ? 'Manage →' : 'Set up →'}
          </Link>
        </div>
        {(clientFixedSlots ?? []).length > 0 ? (
          <div className="space-y-1">
            {(clientFixedSlots ?? []).map(slot => (
              <div key={slot.id}>
                <span className="text-sm text-white font-medium">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][slot.day_of_week]}s
                </span>
                <span className="text-xs text-[#57534e] ml-2">
                  · {new Date(`1970-01-01T${slot.session_time}`).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })} · {slot.duration_minutes} min
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#3c3835]">No fixed slots assigned yet.</p>
        )}
        {(upcomingClientSessions ?? []).length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#1c1917] space-y-2">
            <p className="text-xs text-[#3c3835] uppercase tracking-wider mb-2">Booked sessions</p>
            {(upcomingClientSessions ?? []).map(s => (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#d4cfc9]">
                    {new Date(s.scheduled_at).toLocaleDateString('en-AU', {
                      timeZone: 'Australia/Brisbane', weekday: 'short', day: 'numeric', month: 'short',
                    })}
                  </span>
                  <span className="text-xs text-[#3c3835] ml-2">
                    {new Date(s.scheduled_at).toLocaleTimeString('en-AU', {
                      timeZone: 'Australia/Brisbane', hour: 'numeric', minute: '2-digit', hour12: true,
                    })} · {s.duration_minutes} min
                  </span>
                </div>
                <span className={`text-xs ${s.confirmed_at ? 'text-teal-400' : 'text-[#57534e]'}`}>
                  {s.confirmed_at ? 'Confirmed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Package */}
      <div className="bg-[#111110] border border-[#1c1917] rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wider text-[#57534e]">Coaching Package</p>
          {client.subscription_active ? (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-teal-400/30 text-teal-400 bg-teal-400/10">
              Subscription Active
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-[#1c1917] text-[#57534e]">
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
            <div className="mt-3 pt-3 border-t border-[#1c1917] flex items-center justify-between">
              <p className="text-xs text-teal-400">Eligible for 2x to 3x upgrade (Week {weekNumber})</p>
              <Link
                href={`/companion/${id}/upgrade`}
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 border border-teal-800/50 px-3 py-1.5 rounded-lg transition-colors"
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
      <div className="bg-[#111110] border border-[#1c1917] rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wider text-[#57534e]">Onboarding</p>
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
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.done ? 'bg-teal-400' : 'bg-[#1c1917]'}`} />
              {item.href ? (
                <Link href={item.href} className="text-xs text-teal-400 hover:text-teal-300 transition-colors">{item.label} →</Link>
              ) : (
                <span className={`text-xs ${item.done ? 'text-[#d4cfc9]' : 'text-[#3c3835]'}`}>{item.label}</span>
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
            <div className="mt-3 pt-3 border-t border-[#1c1917] space-y-2">
              <div className="flex items-center justify-between">
                {client.medical_clearance_received_at ? (
                  <p className="text-xs text-teal-400">Medical clearance received</p>
                ) : (
                  <>
                    <p className="text-xs text-amber-400">Medical clearance required</p>
                    <Link href={`/dashboard/clients/${id}/medical-clearance`} className="text-xs text-amber-400 hover:text-amber-300 underline transition-colors">Manage →</Link>
                  </>
                )}
              </div>
              {!client.medical_clearance_received_at && (
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${emailSentAt ? 'bg-teal-400' : 'bg-red-500'}`} />
                  {emailSentAt ? (
                    <p className="text-[10px] text-[#a8a29e]" title={new Date(emailSentAt).toLocaleString('en-AU')}>
                      Client auto-email sent {new Date(emailSentAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    </p>
                  ) : (
                    <p className="text-[10px] text-red-400">
                      Client auto-email not sent. Run <code className="bg-[#1c1917] px-1 rounded">scripts/send-clearance-required-email.ts {client.id}</code> or nudge manually.
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
        <div className="bg-[#111110] border border-[#1c1917] rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#57534e] mb-1">Intake</p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${
                    statusColour[latestFoundationalInvitation.status as keyof typeof statusColour]
                  }`}
                >
                  {latestFoundationalInvitation.status}
                </span>
                {latestFoundationalInvitation.status === 'complete' && latestFoundationalInvitation.completed_at && (
                  <span className="text-xs text-[#57534e]">
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
            <span className="w-7 h-[3px] rounded-full bg-[#14b8a6]" />
            <h2 className="text-[11px] font-bold text-white uppercase" style={{ fontFamily: MONO_FONT, letterSpacing: "0.14em" }}>
              Updates <span className="text-[#3c3835] font-normal">- post-onboarding follow-ups</span>
            </h2>
          </div>
        </div>
      )}

      {/* Updates · Supplementary intake.
          5-question follow-up (medications + dietary context) added
          2026-05-12. Three states: not sent yet (CTA to add it to the
          portal), pending (sitting in their portal — coach can email or
          copy the link), complete (with completion timestamp).  */}
      {latestFoundationalInvitation?.status === 'complete' && (
        <div className="bg-[#111110] border border-[#1c1917] rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#57534e] mb-1">Supplementary intake</p>
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
                    <span className="text-xs text-[#57534e]">
                      Completed {formatDate(latestSupplementaryInvitation.completed_at)}
                    </span>
                  )}
                  {latestSupplementaryInvitation.status === 'pending' && (
                    <span className="text-xs text-[#57534e]">
                      Sitting in their portal since {formatDate(latestSupplementaryInvitation.created_at)}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#57534e]">Not sent yet — adds a 5-question follow-up card to the client's portal.</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!latestSupplementaryInvitation && (
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

      <MedicationsEditor
        clientId={client.id}
        initialValue={client.medications ?? null}
        updatedAt={client.medications_updated_at ?? null}
        activeProgramGeneratedAt={activeProgram?.generated_at ?? null}
        activeNutritionGeneratedAt={activeNutritionPlan?.generated_at ?? null}
      />

      <MajorSection
        id="cffs"
        title="Foundational Synthesis"
        subtitle="- CFFS"
        defaultOpen={cffsActionRequired}
        attentionLabel={!activeCffs ? 'No CFFS yet' : (!frPublished ? 'FR not published' : null)}
      >
      {!activeCffs ? (
        <div className="bg-[#111110] border border-[#1c1917] rounded-xl p-8 text-center">
          <p className="text-[#a8a29e] mb-2">No CFFS generated yet</p>
          <p className="text-[#3c3835] text-sm mb-4">
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
          <div className="bg-[#111110] border border-[#1c1917] rounded-xl overflow-hidden mb-4">
            <div className="px-5 pt-5 pb-4 grid grid-cols-2 gap-4 border-b border-[#1c1917]">
              <div>
                <p className="text-[10px] font-bold text-[#57534e] uppercase tracking-widest mb-2">Body State Classification</p>
                <p className="text-lg font-bold text-white leading-tight mb-2">{activeCffs.body_state_classification}</p>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 bg-[#14b8a6]" />
                  <p className="text-xs text-[#a8a29e]">Resolution: <span className="text-[#e7e5e4] font-semibold">{activeCffs.resolution_state}</span></p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#57534e] uppercase tracking-widest mb-3">Exposure Readiness</p>
                <div className="grid grid-cols-2 gap-2">
                  {readinessItems.map(item => (
                    <div key={item.label} className={`px-3 py-2 rounded-lg border-l-2 ${
                      item.value === 'Green' ? 'bg-green-950/40 border-green-500' :
                      item.value === 'Amber' ? 'bg-amber-950/40 border-amber-500' :
                      item.value === 'Red' ? 'bg-red-950/40 border-red-500' :
                      'bg-[#1c1917] border-[#292524]'
                    }`}>
                      <p className={`text-xs font-bold mb-0.5 ${
                        item.value === 'Green' ? 'text-green-400' :
                        item.value === 'Amber' ? 'text-amber-400' :
                        item.value === 'Red' ? 'text-red-400' :
                        'text-[#a8a29e]'
                      }`}>{item.value}</p>
                      <p className="text-[10px] text-[#57534e] font-medium uppercase tracking-wide">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-[#3c3835] text-xs">Generated {formatDate(activeCffs.generated_at)}</p>
                {/* Visual Signal Integration: shows whether photos were read at generation time. */}
                {typeof activeCffs.photos_used === 'number' && (
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border uppercase ${
                      activeCffs.photos_used > 0
                        ? 'text-[#14b8a6] bg-[rgba(20,184,166,0.10)] border-[#0d2d29]'
                        : 'text-[#57534e] bg-[#0c0a09] border-[#1c1917]'
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
                      style={{ background: activeCffs.photos_used > 0 ? '#14b8a6' : '#57534e' }}
                    />
                    Photos {activeCffs.photos_used > 0 ? `✓ ${activeCffs.photos_used}/3` : '✗ Not provided'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/clients/${client.id}/cffs-report`}
                  target="_blank"
                  className="text-xs font-medium px-3 py-1.5 border border-[#1c1917] text-[#a8a29e] rounded-lg hover:border-[#292524] hover:text-[#e7e5e4] transition-colors"
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
              className="bg-[#111110] border rounded-2xl overflow-hidden mb-4"
              style={{
                borderColor: readinessReport.status === 'regression' ? '#3a1414'
                  : readinessReport.status === 'reassessment' ? '#3a2410'
                  : '#1c1917',
              }}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#1c1917]">
                <div className="flex items-center gap-2.5">
                  {readinessReport.status === 'regression' ? (
                    <Activity size={13} className="text-[#ef4444]" />
                  ) : readinessReport.status === 'reassessment' ? (
                    <RefreshCw size={13} className="text-[#f59e0b]" />
                  ) : (
                    <AlertTriangleIcon size={13} className="text-[#a8a29e]" />
                  )}
                  <p
                    className="text-[10px] font-bold uppercase"
                    style={{
                      fontFamily: MONO_FONT,
                      letterSpacing: '0.14em',
                      color: readinessReport.status === 'regression' ? '#ef4444'
                        : readinessReport.status === 'reassessment' ? '#f59e0b'
                        : '#d4cfc9',
                    }}
                  >
                    {readinessReport.status === 'regression' ? 'Active Regression - Coach Review Required'
                      : readinessReport.status === 'reassessment' ? 'CFFS Reassessment Recommended'
                      : readinessReport.status === 'advisory' ? 'Drift Advisory'
                      : 'Block Status'}
                  </p>
                </div>
                <span className="text-[10px] text-[#57534e]" style={{ fontFamily: MONO_FONT }}>
                  Signal Monitoring v1.0
                </span>
              </div>

              {/* Drift conditions */}
              {readinessReport.drift.length > 0 && (
                <div className="px-5 py-4 border-b border-[#1c1917]">
                  <p className="text-[10px] font-bold text-[#57534e] uppercase mb-2" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>
                    Drift this week
                  </p>
                  <ul className="space-y-1.5">
                    {readinessReport.drift.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px]">
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: d.severity === 'high' ? '#ef4444' : '#a8a29e' }}
                        />
                        <span className={d.severity === 'high' ? 'text-[#e7e5e4]' : 'text-[#a8a29e]'}>{d.message}</span>
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
                  <div className="px-5 py-4 border-b border-[#1c1917]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-[#57534e] uppercase" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>
                        RPE creep — week {creep.weekNumberInBlock}
                      </p>
                      <span className="text-[10px] text-[#57534e]" style={{ fontFamily: MONO_FONT }}>
                        {creep.creepingCount} exercise{creep.creepingCount === 1 ? '' : 's'}{creep.severeCount > 0 ? ` · ${creep.severeCount} severe` : ''}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {creep.findings.slice(0, 6).map((f, i) => (
                        <li key={i} className="flex items-center justify-between gap-3 text-[12px]">
                          <span className={f.severe ? 'text-[#e7e5e4]' : 'text-[#a8a29e]'}>{f.exerciseName}</span>
                          <span className="shrink-0 tabular-nums" style={{ fontFamily: MONO_FONT }}>
                            <span className="text-[#57534e]">RPE</span>{' '}
                            <span className="text-[#57534e]">{f.prescribedRpe}</span>
                            <span className="text-[#57534e]"> → </span>
                            <span className={f.severe ? 'text-[#ef4444]' : 'text-[#f59e0b]'}>{f.avgLoggedRpe}</span>
                            <span className={f.severe ? 'text-[#ef4444]' : 'text-[#f59e0b]'}> (+{f.delta})</span>
                            {f.maxLoggedRpe >= 9.5 && (
                              <span className="text-[#ef4444]"> · max {f.maxLoggedRpe}</span>
                            )}
                            <span className="text-[#57534e]"> · {f.setCount} set{f.setCount === 1 ? '' : 's'}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                    {creep.findings.length > 6 && (
                      <p className="text-[11px] text-[#57534e] mt-2" style={{ fontFamily: MONO_FONT }}>
                        +{creep.findings.length - 6} more not shown
                      </p>
                    )}
                  </div>
                )
              })()}

              {/* Reassessment reasons */}
              {readinessReport.reassessmentReasons.length > 0 && (
                <div className="px-5 py-4 border-b border-[#1c1917]">
                  <p className="text-[10px] font-bold text-[#57534e] uppercase mb-2" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>
                    Reassessment triggers
                  </p>
                  <ul className="space-y-2">
                    {readinessReport.reassessmentReasons.map((r, i) => (
                      <li key={i} className="text-[13px]">
                        <p className="text-[#e7e5e4]">{r.message}</p>
                        <p className="text-[11px] text-[#57534e] mt-0.5" style={{ fontFamily: MONO_FONT }}>
                          Recommended depth: <span className="text-[#a8a29e]">{r.recommendedDepth}</span>
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
                    <span className="text-[#57534e]">
                      Block <span className="text-[#d4cfc9]">{readinessReport.block.blockName ?? '-'}</span>
                      {readinessReport.block.weekDuration != null && (
                        <> · {readinessReport.block.weekDuration}-week duration</>
                      )}
                    </span>
                    <span
                      className="text-[11px] font-medium"
                      style={{
                        fontFamily: MONO_FONT,
                        color: readinessReport.block.isAtBlockEnd ? '#f59e0b' : '#57534e',
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
          <div className="border-l-2 border-[#14b8a6] bg-[#111110]/50 border border-[#1c1917] rounded-2xl p-5 mb-4">
            <p className="text-[10px] font-bold text-[#14b8a6] uppercase tracking-widest mb-3">About This Report</p>
            <p className="text-sm font-semibold text-[#e7e5e4] leading-relaxed mb-3">
              This is not a summary. It is a structured interpretation of how this client&apos;s system is currently organising itself.
            </p>
            <p className="text-sm text-[#57534e] leading-relaxed">
              The CFFS translates 208 data points across eight signal domains into a single, coherent picture of the client&apos;s current body state. Nothing here prescribes or diagnoses - you remain the interpretive authority.
            </p>
          </div>

          {/* Visual Signal Summary - dedicated read of what the photos contributed.
              Only renders when the Fat Map had photo input at generation time. Sits
              above the standard CFFS sections so coaches can scan the visual layer
              at a glance. */}
          {activeCffs.visual_signal_summary && (
            <div className="mb-3 bg-[#111110] border border-[#0d2d29] rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-[#0d2d29] bg-[rgba(20,184,166,0.06)]">
                <Eye size={13} className="text-[#14b8a6]" />
                <p
                  className="text-[10px] font-bold text-[#14b8a6] uppercase tracking-widest"
                  style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
                >
                  Visual Signal Summary
                </p>
                <span
                  className="ml-auto text-[10px] text-[#3c3835]"
                  style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
                >
                  What the {activeCffs.photos_used ?? 3} baseline photo{(activeCffs.photos_used ?? 3) === 1 ? '' : 's'} contributed
                </span>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-[#e7e5e4] leading-relaxed">{activeCffs.visual_signal_summary}</p>
              </div>
            </div>
          )}

          {/* CFFS Sections */}
          <div className="space-y-2 mb-6">
            {cffsSections.map((section, i) => (
              <div key={section.label} className="bg-[#111110] border border-[#1c1917] rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-[#1c1917] bg-[#111110]/80">
                  <span className="text-[11px] font-black text-[#14b8a6]">{String(i + 1).padStart(2, '0')}</span>
                  <p className="text-[10px] font-bold text-[#a8a29e] uppercase tracking-widest">{section.label}</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm text-[#e7e5e4] leading-relaxed">{section.content}</p>
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
              <p className="text-[#57534e] text-sm mb-3">Previous CFFS ({archivedCffs.length})</p>
              <div className="space-y-2">
                {archivedCffs.map(c => (
                  <div
                    key={c.id}
                    className="bg-[#111110]/50 border border-[#1c1917] rounded-lg px-4 py-3 flex items-center justify-between opacity-60"
                  >
                    <span className="text-sm text-[#a8a29e]">{formatDate(c.generated_at)}</span>
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
          <div className="bg-[#111110] border border-[#1c1917] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#57534e] uppercase tracking-wider">Week {latestBaseline.re_capture_week} capture · {new Date(latestBaseline.captured_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
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
                <div key={m.label} className="bg-[#1c1917]/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-[#57534e] mb-1">{m.label}</p>
                  <p className="text-base font-semibold text-white">{m.value ?? '-'}<span className="text-xs text-[#57534e] ml-1">{m.unit}</span></p>
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
                    <p className="text-xs text-[#57534e] text-center">{photo.label}</p>
                    {photo.url ? (
                      <a href={photo.url} target="_blank" rel="noopener noreferrer">
                        <img src={photo.url} alt={photo.label} className="w-full aspect-[3/4] object-cover rounded-xl hover:opacity-80 transition-opacity" />
                      </a>
                    ) : (
                      <div className="w-full aspect-[3/4] bg-[#1c1917] rounded-xl flex items-center justify-center">
                        <p className="text-[#3c3835] text-xs">No photo</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#111110]/50 border border-[#1c1917] rounded-xl p-5 text-center">
            <p className="text-[#57534e] text-sm">No baseline submitted yet</p>
            <p className="text-[#3c3835] text-xs mt-1">Send the client their baseline link to begin</p>
          </div>
        )}
      </MajorSection>

      {/* Weekly Check-In Section */}
      <MajorSection
        id="cfws"
        title="Weekly Synthesis"
        subtitle="- CFWS"
        defaultOpen={cfwsActionRequired}
        attentionLabel={anyUnansweredCheckin ? 'Unanswered check-in' : (cfwsActionRequired ? 'New CFWS ready to generate' : null)}
        actionRight={
          checkinToken
            ? <CopyLinkButton token={checkinToken} label="Copy check-in link" path="/checkin" />
            : undefined
        }
      >

        {/* Latest CFWS */}
        {latestCfws ? (
          <>
            {/* Readiness grid */}
            <div className="bg-[#111110] border border-[#1c1917] rounded-xl overflow-hidden mb-4">
              <div className="px-5 pt-5 pb-4 border-b border-[#1c1917]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-[#57534e] uppercase tracking-widest">Exposure Readiness</p>
                  <p className="text-[10px] font-bold text-[#14b8a6] uppercase tracking-widest">Week {latestCfws.week_number}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Capacity', value: latestCfws.exposure_readiness_capacity },
                    { label: 'Schedule', value: latestCfws.exposure_readiness_schedule },
                    { label: 'Regulation', value: latestCfws.exposure_readiness_regulation },
                    { label: 'Behaviour', value: latestCfws.exposure_readiness_behaviour },
                  ].map(item => (
                    <div key={item.label} className={`px-3 py-2 rounded-lg border-l-2 ${
                      item.value === 'Green' ? 'bg-green-950/40 border-green-500' :
                      item.value === 'Amber' ? 'bg-amber-950/40 border-amber-500' :
                      item.value === 'Red' ? 'bg-red-950/40 border-red-500' :
                      'bg-[#1c1917] border-[#292524]'
                    }`}>
                      <p className={`text-xs font-bold mb-0.5 ${
                        item.value === 'Green' ? 'text-green-400' :
                        item.value === 'Amber' ? 'text-amber-400' :
                        item.value === 'Red' ? 'text-red-400' :
                        'text-[#a8a29e]'
                      }`}>{item.value}</p>
                      <p className="text-[10px] text-[#57534e] font-medium uppercase tracking-wide">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <p className="text-[#3c3835] text-xs">Generated {formatDate(latestCfws.generated_at)}</p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/clients/${client.id}/cfws-report`}
                    target="_blank"
                    className="text-xs font-medium px-3 py-1.5 border border-[#1c1917] text-[#a8a29e] rounded-lg hover:border-[#292524] hover:text-[#e7e5e4] transition-colors"
                  >
                    Download PDF
                  </Link>
                  {latestCompleteWeek && <RegenerateCFWSButton clientId={id} weekNumber={latestCompleteWeek} />}
                </div>
              </div>
            </div>

            {/* About block */}
            <div className="border-l-2 border-[#14b8a6] bg-[#111110]/50 border border-[#1c1917] rounded-2xl p-5 mb-4">
              <p className="text-[10px] font-bold text-[#14b8a6] uppercase tracking-widest mb-3">About This Report</p>
              <p className="text-sm font-semibold text-[#e7e5e4] leading-relaxed mb-3">
                This is not a summary. It is a structured interpretation of how this client&apos;s system is behaving this week.
              </p>
              <p className="text-sm text-[#57534e] leading-relaxed">
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
                <div key={section.label} className="bg-[#111110] border border-[#1c1917] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-[#1c1917] bg-[#111110]/80">
                    <span className="text-[11px] font-black text-[#14b8a6]">{String(i + 1).padStart(2, '0')}</span>
                    <p className="text-[10px] font-bold text-[#a8a29e] uppercase tracking-widest">{section.label}</p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-sm text-[#e7e5e4] leading-relaxed">{section.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-[#111110]/50 border border-[#1c1917] rounded-xl p-5 mb-3 text-center">
            <p className="text-[#57534e] text-sm">No weekly synthesis yet</p>
            {latestCompleteWeek ? (
              <div className="mt-3">
                <RegenerateCFWSButton clientId={id} weekNumber={latestCompleteWeek} />
              </div>
            ) : (
              <p className="text-[#3c3835] text-xs mt-1">Generated after each A+B check-in pair is complete</p>
            )}
          </div>
        )}

        {/* Check-in submission log */}
        {recentCheckins && recentCheckins.length > 0 && (
          <div className="bg-[#111110]/50 border border-[#1c1917] rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-[#57534e] mb-3">Recent Submissions</p>
            <div className="space-y-2">
              {recentCheckins.slice(0, 8).map((ci, i) => {
                const fb = ci.id ? feedbackByCheckinId.get(ci.id) : undefined
                const sent = !!fb?.email_sent_at
                return (
                  <Link
                    key={i}
                    href={`/dashboard/clients/${id}/checkins/${ci.week_number}/${ci.form_type}`}
                    className="flex items-center justify-between text-xs hover:bg-[#1c1917]/50 -mx-2 px-2 py-1 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[#a8a29e]">Week {ci.week_number} · Form {ci.form_type}</span>
                      {fb && (
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${sent ? 'bg-teal-500/10 border border-teal-500/30 text-teal-300' : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'}`}>
                          {sent ? 'Response sent' : 'Draft'}
                        </span>
                      )}
                    </div>
                    <span className="text-[#3c3835]">{formatDate(ci.submitted_at)}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Coach response history */}
        {feedbackHistory && feedbackHistory.length > 0 && (
          <div className="bg-[#111110]/50 border border-[#1c1917] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider text-[#57534e]">Coach Response History</p>
              <p className="text-[10px] text-[#3c3835] uppercase tracking-widest">{feedbackHistory.length} total</p>
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
            className="text-xs font-medium px-3 py-1.5 border border-[#1c1917] text-[#a8a29e] rounded-lg hover:border-[#292524] hover:text-[#e7e5e4] transition-colors"
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
              className="block bg-[#111110] border border-[#1c1917] rounded-xl p-5 hover:border-[#292524] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-[#e7e5e4]">{draftProgram.block_name}</p>
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-700 text-amber-400 uppercase tracking-wide">Draft</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1c1917] text-[#a8a29e] capitalize">{draftProgram.progression_phase}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1c1917] text-[#a8a29e] capitalize">{draftProgram.training_goal}</span>
                </div>
              </div>
              <p className="text-xs text-[#57534e]">
                {draftProgram.training_frequency}x/week · {draftProgram.week_duration} weeks · Generated {formatDate(draftProgram.generated_at)}
              </p>
              <p className="text-xs text-[#14b8a6] mt-2">Review &amp; edit draft →</p>
            </Link>
          )}

          {/* Active program */}
          {activeProgram ? (
            <Link
              href={`/dashboard/clients/${id}/program`}
              className="block bg-[#111110] border border-[#1c1917] rounded-xl p-5 hover:border-[#292524] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-[#e7e5e4]">{activeProgram.block_name}</p>
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1c1917] text-[#a8a29e] capitalize">
                    {activeProgram.progression_phase}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1c1917] text-[#a8a29e] capitalize">
                    {activeProgram.training_goal}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#57534e]">
                {activeProgram.training_frequency}x/week · {activeProgram.week_duration} weeks · Generated {formatDate(activeProgram.generated_at)}
              </p>
              <p className="text-xs text-[#14b8a6] mt-2">View full program →</p>
            </Link>
          ) : !draftProgram ? (
            <div className="bg-[#111110]/50 border border-[#1c1917] rounded-xl p-5 text-center">
              <p className="text-[#57534e] text-sm">No program generated yet</p>
              <p className="text-[#3c3835] text-xs mt-1">Generate a program once the CFFS is complete</p>
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
            className="text-xs font-medium px-3 py-1.5 border border-[#1c1917] text-[#a8a29e] rounded-lg hover:border-[#292524] hover:text-[#e7e5e4] transition-colors"
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
              className="block bg-[#111110] border border-[#1c1917] rounded-xl p-5 hover:border-[#292524] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-[#e7e5e4]">{draftNutritionPlan.plan_name}</p>
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-700 text-amber-400 uppercase tracking-wide">Draft</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1c1917] text-[#a8a29e] capitalize">{draftNutritionPlan.entry_state.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1c1917] text-[#a8a29e] capitalize">{draftNutritionPlan.carb_demand_level} carbs</span>
                </div>
              </div>
              <p className="text-xs text-[#57534e]">Generated {formatDate(draftNutritionPlan.generated_at)}</p>
              <p className="text-xs text-[#14b8a6] mt-2">Review &amp; approve draft →</p>
            </Link>
          )}

          {/* Active nutrition plan */}
          {activeNutritionPlan ? (
            <Link
              href={`/dashboard/clients/${id}/nutrition`}
              className="block bg-[#111110] border border-[#1c1917] rounded-xl p-5 hover:border-[#292524] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-[#e7e5e4]">{activeNutritionPlan.plan_name}</p>
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1c1917] text-[#a8a29e] capitalize">{activeNutritionPlan.entry_state.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1c1917] text-[#a8a29e] capitalize">{activeNutritionPlan.carb_demand_level} carbs</span>
                  {activeNutritionPlan.current_direction && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                      activeNutritionPlan.current_direction === 'progress' ? 'bg-teal-500/10 text-teal-400' :
                      activeNutritionPlan.current_direction === 'rebuild' ? 'bg-red-500/10 text-red-400' :
                      'bg-[#1c1917] text-[#a8a29e]'
                    }`}>{activeNutritionPlan.current_direction}</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#57534e]">Generated {formatDate(activeNutritionPlan.generated_at)}</p>
              <p className="text-xs text-[#14b8a6] mt-2">View full nutrition plan →</p>
            </Link>
          ) : !draftNutritionPlan ? (
            <div className="bg-[#111110]/50 border border-[#1c1917] rounded-xl p-5 text-center">
              <p className="text-[#57534e] text-sm">No nutrition plan generated yet</p>
              <p className="text-[#3c3835] text-xs mt-1">Generate a plan once the CFFS is complete</p>
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

