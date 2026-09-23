import { resolveCurrentBodyState } from '@/lib/body-state-current'
import { createAdminClient } from '@/lib/supabase/admin'
import { WeekStrip, WeekStripLegend } from '@/components/dashboard/week-strip'
import { buildWeekStrips } from '@/lib/week-strip-data'
import OffboardPanel from './offboard-panel'
import FreezePanel from './freeze-panel'
import { signedBaselinePhotoSet } from '@/lib/baseline-photos'
import { notFound } from 'next/navigation'
import { ChevronLeft, ChevronRight, ArrowRight, CheckCircle2, Activity, RefreshCw, AlertTriangle as AlertTriangleIcon, Eye, Sparkles } from 'lucide-react'
import { getActiveConstraintManifest } from '@/lib/recovery-state-machine'
import { getSuggestionsForState } from '@/lib/rrs-protocol-suggestions'
import type { RecoveryPlaybookId } from '@/lib/recovery-doctrine'
import { formatDate, readinessPillStyle, readinessMarkStyle } from '@/lib/utils'
import Link from 'next/link'
import { PageHeader, MONO_FONT, PageBody } from '@/components/dashboard/ui'
import { GlanceCard, flagsPill, type GlancePill } from '@/components/glance-card'
import { evaluateReadiness } from '@/lib/readiness-monitor'
import { evaluateRpeCreep } from '@/lib/rpe-creep-monitor'
import { currentBlockWeek } from '@/lib/workout-logging'
import SetStartDate from '@/components/set-start-date'
import PackageManager from '@/components/package-manager'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import { TWO_SESSION_PACKAGE_VALUES } from '@/lib/coaching-packages'
import CopyLinkButton from './copy-link-button'
import AskTestimonialButton from './ask-testimonial-button'
import IssueLoginCodeButton from './issue-login-code-button'
import SendEmailButton from '@/components/send-email-button'
import RegenerateCFFSButton from '@/components/regenerate-cffs-button'
import ReassessmentTriggersPanel from '@/components/reassessment-triggers-panel'
import { getOpenTriggers, REASON_LABEL, OVERDUE_AFTER_DAYS } from '@/lib/reassessment-triggers'
import ClientReadingPanel from './client-reading-panel'
import MedicationsEditor from './medications-editor'
import DietaryConsumptionEditor from './dietary-consumption-editor'
import RegenerateCFWSButton from '@/components/regenerate-cfws-button'
import CoachResponseCard from './coach-response-card'
import MajorSection from './major-section'
import ClientProfileTabs from './client-profile-tabs'
import { tierAllows } from '@/lib/product-tier'
import { productTierForScope } from '@/lib/coach-tier'
import { requireCoachScope } from '@/lib/coach-scope'
import ArtefactAuditPill from './artefact-audit-pill'
import { auditFoundationalReading, auditProgramReading, auditNutritionPlan } from '@/lib/artefact-audit'
import AutoResponseToggle from './auto-response-toggle'
import MedicationsAnalysisPanel from './medications-analysis-panel'
import ReopenCheckinButton from './reopen-checkin-button'
import BloodPanelsPanel, { type BloodPanelData } from './blood-panels-panel'
import NewIntakeButton from '@/components/new-intake-button'
import ReintakeButton from '@/components/re-intake-button'
import PortalInviteButton from '@/components/portal-invite-button'
import SendPortalEmailButton from '@/components/send-portal-email-button'
import SendPortalOrientationButton from '@/components/send-portal-orientation-button'
import SendSupplementaryIntakeButton from '@/components/send-supplementary-intake-button'
import { computeFatDistributionDivergence } from '@/lib/fat-map-divergence'
import SendSupplementaryEmailButton from '@/components/send-supplementary-email-button'
import { Avatar, Pill } from '@/components/dashboard/ui'
import EditClientPhone from '@/components/edit-client-phone'
import OverrideSubscriptionButton from '@/components/override-subscription-button'
import ClientCommunicationsPanel from '@/components/dashboard/client-communications-panel'
import { RecoveryRouterPanel } from './recovery-router-panel'
import { loadRecoverySnapshot } from '@/lib/recovery-history'
import { resolveRouterMode } from '@/lib/recovery-state-machine'
import { BlockProgressPanel } from './block-progress-panel'
import { loadBlockProgress } from '@/lib/block-progress'
import ClientPaymentsSection from '@/components/dashboard/client-payments-section'
import HeightEditor from './height-editor'
import { hormonalSafetyAlerts } from '@/lib/hormonal-safety-alerts'
import { intakeReferralFlags, trainingReferralFlags, type TrainingContext } from '@/lib/electrolyte-safety-gates'
import { thyroidFlagFromScreen, THYROID_REFERRAL_TEXT } from '@/lib/thyroid-hold'
import { boneFlagFromScreen, BONE_REFERRAL_SENTENCE } from '@/lib/bone-protocol'
import { ironFlag, IRON_REFERRAL_SENTENCE, IRON_TIER_TIMEFRAME, type IronScreen } from '@/lib/iron-gate'
import { INDETERMINATE, readPatternLabel } from '@/lib/pattern-doctrine'
import { getTotalQuestions } from '@/lib/intake-questions'
import { readinessLevel } from '@/lib/readiness-levels'
import { BRAND } from '@/lib/brand-tokens'

const PUBLIC_READINESS: Record<string, string> = { Remediation: 'Depleted', Optimisation: 'Transitioning', 'Post-Optimisation': 'Ready' }

/** Readiness is the one thing on this record that carries a colour. */
function readinessInk(state: string) {
  return state === 'Remediation' ? BRAND.remediationOnDark
    : state === 'Optimisation' ? BRAND.optimisationOnDark
    : state === 'Post-Optimisation' ? BRAND.postOptimisationOnDark
    : BRAND.darkInk
}

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const scope = await requireCoachScope()
  const canPrescribe = tierAllows(await productTierForScope(createAdminClient(), scope), 'coach')
  const admin = createAdminClient()
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (clientError) console.error('Client fetch error:', clientError)
  if (!client) notFound()

  const [{ data: cffsRecords }, { data: invitations }, { data: intakes }, { data: cfwsRecords }, { data: recentCheckins }, { data: baselines }, { data: activePrograms }, { data: draftPrograms }, { data: activeNutritionPlans }, { data: draftNutritionPlans }, { data: pendingTrajectoryRows }] = await Promise.all([
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
      // date_of_birth + gender are here for the Height panel, which reports
      // what else is still blocking an energy estimate. A height with no age or
      // sex on file still produces no BMR.
      .select('id, date_of_birth, gender, dietary_restrictions, dietary_preferences, typical_day_eating, meals_per_day, fluid_intake, caffeine_intake, alcohol_intake, eating_context, dietary_updated_at')
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
      .select('id, block_name, progression_phase, training_goal, training_frequency, week_duration, generated_at, activated_at, current_direction, pr_why_this_block')
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
      .select('id, plan_name, entry_state, carb_demand_level, generated_at, current_direction, nr_what_this_nutrition_is_doing')
      .eq('client_id', id)
      .eq('is_active', true)
      .maybeSingle(),
    admin
      .from('nutrition_plans')
      .select('id, plan_name, entry_state, carb_demand_level, generated_at')
      .eq('client_id', id)
      .eq('status', 'draft')
      .maybeSingle(),
    // Archived programs with no published trajectory reading. The page
    // surfaces a top-of-page amber banner if one exists, so a block-end
    // reading skipped during a block transition is visible without the
    // coach needing to click into the program page first.
    admin
      .from('programs')
      .select('id, block_name, week_duration, generated_at')
      .eq('client_id', id)
      .eq('is_active', false)
      .neq('status', 'draft')
      .is('trajectory_reading_published_at', null)
      .order('generated_at', { ascending: false })
      .limit(1),
  ])

  const pendingTrajectory = pendingTrajectoryRows?.[0] ?? null

  // Derive the active program + current block week now (pure, from the batch
  // above) so the RPE-creep read can join the parallel batch below.
  const activeProgram = activePrograms || null
  const blockWeek = activeProgram?.generated_at
    ? currentBlockWeek(activeProgram.activated_at ?? activeProgram.generated_at)
    : null

  // Everything here depends only on `id` / `client.id` / `activeProgram` — all
  // known now — so run it as ONE parallel batch rather than ~11 serial DB
  // round-trips. This was the main reason the profile page was slow to open.
  //   - reintake status: latest kind='reintake' invitation + latest reintake
  //     intake_invite send (invitation creation != the email actually going)
  //   - blood panels, coach-feedback history, the three pre-publish audits,
  //     upcoming + fixed sessions, comms log, RRS state, RPE creep, recovery
  //     snapshot, block progress.
  const [
    { data: latestReintakeInvitations },
    { data: latestReintakeSends },
    { data: bloodPanels },
    { data: feedbackHistory },
    frAudit,
    prAudit,
    nrAudit,
    { data: upcomingClientSessions },
    { data: clientFixedSlots },
    { data: communicationsData },
    activeRrsState,
    rpeCreep,
    recoverySnapshot,
    blockProgress,
  ] = await Promise.all([
    admin.from('intake_invitations').select('id, token, created_at, completed_at, status').eq('client_id', id).eq('kind', 'reintake').order('created_at', { ascending: false }).limit(1),
    admin.from('client_communications').select('sent_at, subject, meta').eq('client_id', id).eq('kind', 'intake_invite').contains('meta', { mode: 'reintake' }).order('sent_at', { ascending: false }).limit(1),
    admin.from('blood_panels').select('id, status, approved_for_plan, submitted_at, collected_on, lab_name, original_filename, client_note, panel_summary, markers, gp_flags, extraction_meta, analysis, analyzed_at, reading, reading_generated_at, reading_published_at, approved_at').eq('client_id', id).order('submitted_at', { ascending: false }),
    admin.from('weekly_checkin_feedback').select('id, weekly_checkin_id, interpretation, reframe, next_focus, email_sent_at, updated_at, created_at').eq('client_id', id).order('created_at', { ascending: false }),
    auditFoundationalReading(admin, id),
    auditProgramReading(admin, id),
    auditNutritionPlan(admin, id),
    admin.from('client_sessions').select('id, scheduled_at, duration_minutes, status, confirmed_at').eq('client_id', id).eq('status', 'scheduled').gte('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(6),
    admin.from('client_fixed_slots').select('id, day_of_week, session_time, duration_minutes').eq('client_id', id).order('day_of_week', { ascending: true }),
    admin.from('client_communications').select('id, kind, channel, subject, to_address, meta, sent_at').eq('client_id', id).order('sent_at', { ascending: false }).limit(15),
    getActiveConstraintManifest(id),
    activeProgram?.id && blockWeek ? evaluateRpeCreep(admin, client.id, activeProgram.id, blockWeek) : Promise.resolve(null),
    loadRecoverySnapshot(admin, client.id),
    loadBlockProgress(admin, client.id),
  ])

  const latestReintakeInvitation = latestReintakeInvitations?.[0] ?? null
  const latestReintakeSend = latestReintakeSends?.[0] ?? null
  const communications = communicationsData ?? []

  const feedbackByCheckinId = new Map<string, NonNullable<typeof feedbackHistory>[number]>()
  for (const f of feedbackHistory ?? []) feedbackByCheckinId.set(f.weekly_checkin_id, f)

  // Lookup from feedback row back to its check-in (week + form), for history headers.
  const checkinMetaById = new Map<string, { week_number: number; form_type: string; submitted_at: string }>()
  for (const ci of recentCheckins ?? []) {
    if (ci.id) checkinMetaById.set(ci.id, { week_number: ci.week_number, form_type: ci.form_type, submitted_at: ci.submitted_at })
  }

  // RRS -> Recovery chip. Header surfaces an "RRS state active" chip that
  // deep-links into /recovery for suggestions.
  const rrsChip = activeRrsState
    ? {
        playbook_id: activeRrsState.playbook.id as RecoveryPlaybookId,
        playbook_name: activeRrsState.playbook.name,
        days_active: activeRrsState.state.days_active,
        suggestion_count: getSuggestionsForState(activeRrsState.playbook.id as RecoveryPlaybookId).suggested_protocol_slugs.length,
        sbst_remove: getSuggestionsForState(activeRrsState.playbook.id as RecoveryPlaybookId).sbst_action === 'remove',
      }
    : null

  const activeCffs = cffsRecords?.find(c => !c.is_archived) || null

  // Current body state (2026-08-30). The CFFS value is scored once at intake
  // and never moves; a Progress Read re-scores onto programs.tr_new_body_state.
  // Coach-facing, so an unpublished draft re-score counts here.
  const { data: reScoreRows } = await admin
    .from('programs')
    .select('tr_new_body_state, tr_state_direction, block_name, trajectory_reading_published_at, generated_at')
    .eq('client_id', id)
    .not('tr_new_body_state', 'is', null)
    .order('generated_at', { ascending: false })
    .limit(1)
  // Her newest PUBLISHED Progress Read is her current read (14 Sep 2026).
  const { data: currentProgressRead } = await admin
    .from('progress_reads')
    .select('id, published_at, body_state_classification, state_direction, pattern_classification')
    .eq('client_id', id)
    .eq('status', 'published')
    .eq('is_archived', false)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const bodyState = resolveCurrentBodyState({
    foundational: activeCffs?.body_state_classification ?? null,
    reScore: reScoreRows?.[0] ?? null,
    progressRead: currentProgressRead ?? null,
  })
  const archivedCffs = cffsRecords?.filter(c => c.is_archived) || []
  // Split by kind. The foundational invitation is the original 234-question
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

  // Coach-facing at-a-glance summary for the weekly synthesis (2026-07-11
  // rationale compression). Null on CFWS rows generated before this shipped.
  const cfwsSummary = (latestCfws as {
    rationale_summary?: {
      headline?: string
      scan?: { resolution?: string; trajectory?: string; binding_constraint?: string; flags_count?: number | string }
      operating_rules?: string[]
    }
  } | null)?.rationale_summary ?? null
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

  // Reported-vs-measured fat distribution divergence: self-report (intake fm_01/
  // fm_06) vs the baseline waist-to-hip ratio. When they clash, surface a coach
  // flag pointing toward a hormonal-shift pattern + a panel/GP. Non-diagnostic.
  const { data: fatMapIntake } = await admin
    .from('intakes')
    .select('fat_map_responses, gender, pregnant_or_postpartum, androgen_use, sex_at_birth, cancer_history, gynae_surgery, training_context, thyroid_screen')
    .eq('client_id', id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const fatDivergence = computeFatDistributionDivergence({
    fatMapResponses: (fatMapIntake?.fat_map_responses ?? null) as Record<string, unknown> | null,
    gender: fatMapIntake?.gender as string | null,
    waistCm: latestBaseline?.waist_cm as number | null,
    hipsCm: latestBaseline?.hips_cm as number | null,
  })

  // Pregnant now / non-prescribed androgen use. Also emailed on submit, but an
  // email can be missed or fail, so the profile carries it too.
  const hormonalAlerts = hormonalSafetyAlerts(fatMapIntake as { pregnant_or_postpartum?: string | null; androgen_use?: string | null; cancer_history?: string | null } | null)

  // Fluid, salt and potassium referral flags the system can raise on its own,
  // from what she has already told us. Added 17 Sep 2026 from research pass
  // E1a section 6. Non-diagnostic: each one says what she reported and who to
  // see, never what it might be.
  const referralFlags = intakeReferralFlags(
    (fatMapIntake?.fat_map_responses ?? null) as Record<string, unknown> | null,
    [
      client.medications as string | null,
      client.medical_clearance_conditions as string | null,
      typeof client.health_declaration_data === 'object' && client.health_declaration_data !== null
        ? JSON.stringify(client.health_declaration_data)
        : null,
    ].filter(Boolean).join(' \n '),
  )

  // Lifter and competitor flags from the E1b intake questions (19 Sep 2026).
  const trainingFlags = trainingReferralFlags((fatMapIntake?.training_context ?? null) as TrainingContext | null)

  // Thyroid hold (20 Sep 2026, research pass T1). It never says what it might
  // be, because a questionnaire cannot support that. It says what she ticked,
  // that her eating targets are held, and where she goes.
  const iron = ironFlag((fatMapIntake?.thyroid_screen ?? null) as IronScreen | null)

  const bone = boneFlagFromScreen((fatMapIntake?.thyroid_screen ?? null) as Record<string, unknown> | null)

  const thyroid = thyroidFlagFromScreen(
    (fatMapIntake?.thyroid_screen ?? null) as Record<string, unknown> | null,
    { pregnancyState: /pregnant now|given birth/i.test(String(fatMapIntake?.pregnant_or_postpartum ?? '')) },
  )
  const allReferralFlags = [...referralFlags, ...trainingFlags]

  // Progress photos live in a private bucket; sign them for this render only.
  const baselinePhotos = await signedBaselinePhotoSet(admin, latestBaseline)
  const baselineToken = client.baseline_token as string | undefined

  // Doctrine: Signal Monitoring and Reassessment Triggers v1.0
  // (activeProgram, blockWeek and rpeCreep are resolved in the parallel batch above.)
  const cfwsForMonitor = (cfwsRecords || []).filter(c => !c.is_archived)

  const readinessReport = client.coaching_started_at
    ? evaluateReadiness({
        cfwsRows: cfwsForMonitor,
        activeCffs: activeCffs,
        activeProgram,
        client: { coaching_started_at: client.coaching_started_at },
        rpeCreep,
      })
    : null

  // Open reassessment triggers. Persisted by syncReassessmentTriggers on check-in
  // submit and by the Monday digest cron, so this is a read, not a recompute.
  const openTriggers = await getOpenTriggers(admin, id)

  // Recovery mode + recoverySnapshot/blockProgress are resolved in the batch above.
  const recoveryMode = resolveRouterMode()
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

  // Coach-facing at-a-glance summary (2026-07-11 rationale compression, Phase 1).
  // jsonb column typed loosely off the row; null on legacy CFFS rows generated
  // before this shipped (those fall through to the inline sections).
  const cffsSummary = (activeCffs as {
    rationale_summary?: {
      headline?: string
      scan?: { body_state?: string; resolution?: string; binding_constraint?: string; flags_count?: number | string }
      operating_rules?: string[]
    }
  } | null)?.rationale_summary ?? null

  const statusColour = {
    pending: 'text-[#8A9099] bg-[#14171D] border-[#2A2F39]',
    started: 'text-[#E0A254] bg-[#1A1E26] border-[#4A3A22]',
    complete: 'text-[#6FA98B] bg-[#14171D] border-[#1A1E26]',
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
  // 2026-08-31: this used to test whether a feedback ROW EXISTED, not whether it
  // was SENT. The AI auto-draft writes that row the moment a check-in lands, so
  // generating a draft silently marked the check-in as answered. Razia and
  // Samantha both sat with unsent drafts from 30 Aug while their client pages
  // said "Weekly loop active - Everything is up to date". A draft nobody sent is
  // not a reply; the client heard nothing either way.
  const latestCheckinFeedback = latestCheckin?.id ? feedbackByCheckinId.get(latestCheckin.id) ?? null : null
  const latestCheckinDraftUnsent = !!latestCheckinFeedback && !latestCheckinFeedback.email_sent_at
  const latestCheckinNeedsResponse =
    !!latestCheckin &&
    !!latestCheckin.id &&
    !latestCheckinFeedback?.email_sent_at &&
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

  const weekStrip = (await buildWeekStrips([id]))[id]

  return (
    /* NO CAP. This record was pinned to 980px while Today ran the full width,
       which is why Kade could see the difference between the two pages without
       being able to name it. Prose inside is capped where prose needs capping;
       the page is not. Same rule as PageBody. */
    <PageBody>
      <div className="min-w-0">
      <div id="overview" className="scroll-mt-8">
        <Link
          href="/dashboard/coaching"
          className="xl:hidden inline-flex items-center gap-1 text-[12.5px] text-[#676D76] hover:text-[#FAFAF8] transition-colors mb-4"
        >
          <ChevronLeft size={13} /> All clients
        </Link>
        <PageHeader
          title={
            <span className="flex items-center gap-3 min-w-0">
              <Avatar name={client.name} size={34} />
              <span className="truncate">{client.name}</span>
            </span>
          }
          subtitle={
            <span className="inline-flex items-center gap-2.5 flex-wrap">
              <span className="text-[#8A9099]">Added {formatDate(client.created_at)}</span>
              {client.email && (
                <>
                  <span className="text-[#2A2F39]">·</span>
                  <a href={`mailto:${client.email}`} className="text-[#8A9099] hover:text-[#FAFAF8] transition-colors">{client.email}</a>
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

      {/* Always-visible cockpit: RRS chip + next-step + pending banner sit
          above the tabs so key state shows on every tab. */}

      {/* RRS state chip - deep-links into /recovery where suggestions render */}
      {rrsChip && (
        <div className="mb-4">
          <Link
            href={`/dashboard/clients/${id}/recovery`}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px] transition-colors ${
              rrsChip.sbst_remove
                ? 'border-[#D4817E] bg-[#1A1214] text-[#D4817E] hover:bg-[#1A1214]'
                : 'border-[#4A3A22] bg-[#1A1E26] text-[#E0A254] hover:bg-[#1A1E26]'
            }`}
          >
            <AlertTriangleIcon size={14} className="shrink-0" />
            <span className="font-semibold">RRS state active:</span>
            <span>{rrsChip.playbook_name}</span>
            <span className="text-[10px] opacity-70">({rrsChip.days_active}d)</span>
            <span className="text-[10px] opacity-60">·</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium">
              <Sparkles size={11} />
              {rrsChip.sbst_remove
                ? 'SBST removal action required'
                : `${rrsChip.suggestion_count} recovery suggestion${rrsChip.suggestion_count === 1 ? '' : 's'}`}
            </span>
            <span className="text-[10px] opacity-70 ml-1">Open →</span>
          </Link>
        </div>
      )}

      {/* Status strip + one "next step" (2026-07-12 client-file redesign, safest-first
          slice: additive, reads existing data). Full tabbed restructure to follow post-launch. */}
      {(() => {
        // NO HUE. These four are not readiness, and they were borrowing the
        // readiness and Attention colours, so the same amber meant two things a
        // few pixels apart. A filled mark is a constraint, hollow is clear.
        const mark = (v?: string | null) => {
          const t = readinessLevel(v).tone
          return t === 'strong' ? 'bg-[#FAFAF8]' : t === 'normal' ? 'bg-[#8A9099]' : 'bg-transparent border border-[#4A4F57]'
        }
        const READY = [
          { label: 'Capacity', v: activeCffs?.exposure_readiness_capacity as string | null | undefined },
          { label: 'Schedule', v: activeCffs?.exposure_readiness_schedule as string | null | undefined },
          { label: 'Regulation', v: activeCffs?.exposure_readiness_regulation as string | null | undefined },
          { label: 'Behaviour', v: activeCffs?.exposure_readiness_behaviour as string | null | undefined },
        ]
        const hasActiveProgram = !!activePrograms
        const hasActiveNutrition = !!activeNutritionPlans
        const next =
          !intakeDone ? { t: 'Waiting on their assessment', s: 'Nothing can be read until it is in.', href: null } :
          !latestBaseline ? { t: 'Waiting on baseline', s: 'Client to upload measurements and progress photos.', href: `/dashboard/clients/${id}/baseline` } :
          !activeCffs ? { t: 'Generate their read', s: 'Their assessment is in and nothing has been written yet.', href: `#cffs` } :
          !frPublished ? { t: 'Publish their read', s: 'It is written. They have not seen it yet.', href: `#cffs` } :
          latestCheckinDraftUnsent ? { t: 'Send the check-in reply', s: 'A draft is written and waiting. It has not been sent, so they have heard nothing.', href: `#cfws` } :
          latestCheckinNeedsResponse ? { t: 'Read this week', s: 'Their latest check-in has not been read.', href: `#cfws` } :
          !hasActiveProgram ? { t: 'Generate the first training plan', s: 'Reading published. Design the first block.', href: `/dashboard/clients/${id}/program` } :
          !hasActiveNutrition ? { t: 'Generate the nutrition plan', s: 'Training plan is live - add nutrition.', href: `/dashboard/clients/${id}/nutrition` } :
          { t: 'Weekly loop active', s: 'Everything is up to date - watch the weekly check-ins.', href: null }
        return (
          <div className="mb-6 space-y-3">
            {activeCffs && (
              /* THE BAND. This was fifteen chips at one size in a row, and once
                 the four ratings stopped being coloured it read as nothing at
                 all. The answer was never colour: it is SCALE. The one thing
                 this product produces is the readiness, so the readiness is the
                 biggest thing on the record and the only coloured thing on it,
                 and the four ratings are words you can read instead of dots you
                 have to hover. Same move that made Today work. */
              <div className="br-card overflow-hidden">
                <div className="grid gap-px md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]" style={{ background: '#2A2F39' }}>
                  <div className="px-6 py-5" style={{ background: '#14171D' }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#676D76]">Readiness</p>
                    <p
                      className="text-[34px] font-bold tracking-[-0.03em] leading-none mt-2"
                      style={{ color: readinessInk(bodyState.label ?? '') }}
                    >
                      {bodyState.label}
                    </p>
                    <p className="text-[12.5px] text-[#8A9099] mt-2 leading-relaxed">
                      They read it as {PUBLIC_READINESS[bodyState.label ?? ''] ?? bodyState.label}
                      {bodyState.reScored ? ` · re-scored${bodyState.blockName ? ` at the end of ${bodyState.blockName}` : ''}, their first read said ${bodyState.foundational}` : ''}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-3.5">
                      {client.pattern && (
                        <span
                          title={
                            client.pattern_source === 'cffs'
                              ? 'Read from the full CFFS'
                              : `Provisional read from the ${client.pattern_source ?? 'funnel'}. Sharpens at the next CFFS.`
                          }
                        >
                          <Pill accent="neutral">
                            {readPatternLabel(currentProgressRead?.pattern_classification ?? client.pattern)}
                            {client.pattern_source !== 'cffs' && ' (provisional)'}
                          </Pill>
                        </span>
                      )}
                      {activeCffs.resolution_state && <Pill accent="ink">{activeCffs.resolution_state}</Pill>}
                      {!hasActiveProgram && <Pill accent="neutral">No active plan</Pill>}
                      <Link
                        href={`/dashboard/clients/${id}/proof`}
                        className="text-[11px] font-bold uppercase px-2.5 py-[3px] rounded-full border"
                        style={{ letterSpacing: '0.08em', color: '#C2C6CC', borderColor: '#2A2F39' }}
                      >
                        Twelve weeks
                      </Link>
                      {/* Beside the hand-over on purpose: showing somebody what
                          happened and asking what they thought is one moment. */}
                      <AskTestimonialButton clientId={client.id} clientName={client.name?.split(' ')[0] ?? 'them'} />
                    </div>
                  </div>

                  <div className="px-6 py-5" style={{ background: '#14171D' }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#676D76]">What is holding them back</p>
                    <div className="mt-3.5 space-y-2">
                      {READY.map(r => {
                        const lvl = readinessLevel(r.v)
                        return (
                          <div key={r.label} className="flex items-baseline gap-2.5" title={lvl.meaning}>
                            <span className="text-[12.5px] text-[#8A9099] whitespace-nowrap">{r.label}</span>
                            <span className="flex-1 border-b border-dotted border-[#2A2F39]" aria-hidden />
                            <span
                              className={`text-[12.5px] whitespace-nowrap ${
                                lvl.tone === 'strong' ? 'font-bold text-[#FAFAF8]'
                                : lvl.tone === 'normal' ? 'font-semibold text-[#C2C6CC]'
                                : 'font-medium text-[#676D76]'
                              }`}
                            >
                              {lvl.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Two different messages, so two different cards. With something
                to do it is an instruction and reads blue; with nothing to do
                it is the all-clear, and dressing that in the same urgent blue
                taught the eye to ignore both. */}
            {(() => {
              const allClear = !next.href
              return (
                <div
                  className={`flex items-center gap-3.5 px-5 py-4 ${allClear ? 'br-card' : 'br-card-flagged'}`}
                >
                  <span
                    className="w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center"
                    style={{
                      color: allClear ? '#6FA98B' : '#FAFAF8',
                      background: allClear ? 'rgba(23,114,69,0.09)' : 'rgba(27,109,252,0.10)',
                      boxShadow: `inset 0 0 0 1px ${allClear ? '#1A1E26' : '#2A2F39'}`,
                    }}
                    aria-hidden
                  >
                    {allClear ? <CheckCircle2 size={15} /> : <ArrowRight size={15} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] text-[#676D76] mb-0.5">
                      {allClear ? 'Nothing waiting' : 'Next step'}
                    </p>
                    <p className="text-[16px] font-semibold text-[#FAFAF8] tracking-[-0.015em] leading-snug">{next.t}</p>
                    <p className="text-[13.5px] text-[#8A9099] mt-0.5">{next.s}</p>
                  </div>
                  {next.href && (
                    <Link
                      href={next.href}
                      className="shrink-0 inline-flex items-center gap-1.5 text-[12.5px] font-medium px-3.5 py-[7px] rounded-lg text-[#FAFAF8] border border-[#FFFFFF] bg-[linear-gradient(180deg,#242932,#FAFAF8)] hover:bg-[linear-gradient(180deg,#242932,#FFFFFF)] shadow-[0_1px_2px_rgba(27,109,252,0.4),inset_0_1px_0_rgba(255,255,255,0.28)] transition-all active:translate-y-[0.5px]"
                    >
                      Go
                      <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              )
            })()}
          </div>
        )
      })()}

      {/* Pending block-end Trajectory Reading. Surfaces at top of profile so
          a skipped Progress Read isn't only discoverable from the program
          page (where it sits inline above the active block's panel). */}
      {pendingTrajectory && (() => {
        const endedAt = pendingTrajectory.generated_at && pendingTrajectory.week_duration
          ? new Date(new Date(pendingTrajectory.generated_at).getTime() + pendingTrajectory.week_duration * 7 * 86_400_000).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
          : null
        return (
          <Link
            href={`/dashboard/clients/${id}/program`}
            className="block rounded-xl p-4 mb-4 border border-[#4A3A22] bg-[linear-gradient(180deg,#1A1E26,#1A1E26)] hover:border-[#4A3A22] transition-colors"
          >
            <p className="text-[12.5px] font-medium text-[#E0A254] mb-1">Pending Progress Read</p>
            <p className="text-sm text-[#E0A254]">
              <span className="font-semibold">{pendingTrajectory.block_name}</span> ended{endedAt ? ` around ${endedAt}` : ''} but its Progress Read was never generated. Click through to generate it now →
            </p>
          </Link>
        )
      })()}

      {/* The week strip counts meal logging and logged sessions, both of which
          need a plan somebody prescribed. For a read-only coach's client there
          is nothing to log against, so it is seven empty squares explaining a
          legend for a feature she does not have. 21 Sep 2026. */}
      {canPrescribe && weekStrip && weekStrip.length > 0 && (
        <div className="br-card px-5 py-4 mb-4 flex items-start justify-between gap-5 flex-wrap">
          <div>
            <p className="text-[13.5px] font-semibold text-[#FAFAF8] tracking-[-0.015em] mb-0.5">Last seven days</p>
            <p className="text-[12.5px] text-[#8A9099] mb-3">
              Meal logging fills the square. A logged session is the green dot, and only ever adds.
            </p>
            <WeekStrip days={weekStrip} showInitials />
          </div>
          <div className="max-w-[320px]">
            <WeekStripLegend />
          </div>
        </div>
      )}

      <ClientProfileTabs clientId={id} canPrescribe={canPrescribe}>
      <div data-tab="admin">

      {/* Deliberate Start Window */}
      <div className="br-card p-5 mb-4"
        style={{
          background: 'linear-gradient(180deg,#14171D,#0B0D10)',
          boxShadow: '0 1px 3px rgba(16,24,40,0.09), 0 1px 2px -1px rgba(16,24,40,0.05), inset 0 1px 0 #14171D',
        }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13.5px] font-semibold text-[#FAFAF8] tracking-[-0.015em] mb-1">Coaching Start Date</p>
            {client.coaching_started_at ? (
              <p className="text-sm text-[#C2C6CC]">
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
              <p className="text-sm text-[#676D76]">Not set - set a start date to begin the Deliberate Start Window</p>
            )}
          </div>
          <SetStartDate clientId={client.id} currentDate={client.coaching_started_at} />
        </div>
      </div>

      {/* Fixed Session Slot */}
      <div className="br-card p-5 mb-4"
        style={{
          background: 'linear-gradient(180deg,#14171D,#0B0D10)',
          boxShadow: '0 1px 3px rgba(16,24,40,0.09), 0 1px 2px -1px rgba(16,24,40,0.05), inset 0 1px 0 #14171D',
        }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13.5px] font-semibold text-[#FAFAF8] tracking-[-0.015em]">Face-to-Face Session</p>
          <Link
            href={`/dashboard/clients/${id}/fixed-session`}
            className="text-[12.5px] text-[#FAFAF8] hover:text-[#FFFFFF] transition-colors"
          >
            {(clientFixedSlots ?? []).length > 0 ? 'Manage →' : 'Set up →'}
          </Link>
        </div>
        {(clientFixedSlots ?? []).length > 0 ? (
          <div className="space-y-1">
            {(clientFixedSlots ?? []).map(slot => (
              <div key={slot.id}>
                <span className="text-sm text-[#FAFAF8] font-medium">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][slot.day_of_week]}s
                </span>
                <span className="text-[12.5px] text-[#676D76] ml-2">
                  · {new Date(`1970-01-01T${slot.session_time}`).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })} · {slot.duration_minutes} min
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#C2C6CC]">No fixed slots assigned yet.</p>
        )}
        {(upcomingClientSessions ?? []).length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#2A2F39] space-y-2">
            <p className="text-[12.5px] text-[#C2C6CC] mb-2">Booked sessions</p>
            {(upcomingClientSessions ?? []).map(s => (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <span className="text-[12.5px] text-[#C2C6CC]">
                    {new Date(s.scheduled_at).toLocaleDateString('en-AU', {
                      timeZone: 'Australia/Brisbane', weekday: 'short', day: 'numeric', month: 'short',
                    })}
                  </span>
                  <span className="text-[12.5px] text-[#C2C6CC] ml-2">
                    {new Date(s.scheduled_at).toLocaleTimeString('en-AU', {
                      timeZone: 'Australia/Brisbane', hour: 'numeric', minute: '2-digit', hour12: true,
                    })} · {s.duration_minutes} min
                  </span>
                </div>
                <span className={`text-xs ${s.confirmed_at ? 'text-[#FAFAF8]' : 'text-[#676D76]'}`}>
                  {s.confirmed_at ? 'Confirmed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Package */}
      <div className="br-card p-5 mb-4"
        style={{
          background: 'linear-gradient(180deg,#14171D,#0B0D10)',
          boxShadow: '0 1px 3px rgba(16,24,40,0.09), 0 1px 2px -1px rgba(16,24,40,0.05), inset 0 1px 0 #14171D',
        }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13.5px] font-semibold text-[#FAFAF8] tracking-[-0.015em]">Coaching Package</p>
          {client.subscription_active ? (
            <span className="text-[12.5px] font-semibold px-2.5 py-1 rounded-full border border-[#2A2F39] text-[#FAFAF8] bg-[rgba(27,109,252,0.08)]">
              Subscription Active
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-semibold px-2.5 py-1 rounded-full border border-[#2A2F39] text-[#676D76]">
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
          negotiatedWeeklyPriceCents={client.negotiated_weekly_price_cents ?? null}
          negotiatedStripeLink={client.negotiated_stripe_link ?? null}
          subscriptionLinkSentAt={client.subscription_link_sent_at ?? null}
        />
        {(() => {
          const weekNumber = client.coaching_started_at ? getWeekNumber(client.coaching_started_at) : null
          const isUpgradeCandidate = TWO_SESSION_PACKAGE_VALUES.includes(client.package) && (weekNumber ?? 0) >= 8
          if (!isUpgradeCandidate) return null
          return (
            <div className="mt-3 pt-3 border-t border-[#2A2F39] flex items-center justify-between">
              <p className="text-[12.5px] text-[#FAFAF8]">Eligible for 2x to 3x upgrade (Week {weekNumber})</p>
              <Link
                href={`/companion/${id}/upgrade`}
                className="br-btn"
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
      <div className="br-card p-5 mb-4"
        style={{
          background: 'linear-gradient(180deg,#14171D,#0B0D10)',
          boxShadow: '0 1px 3px rgba(16,24,40,0.09), 0 1px 2px -1px rgba(16,24,40,0.05), inset 0 1px 0 #14171D',
        }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13.5px] font-semibold text-[#FAFAF8] tracking-[-0.015em]">Onboarding</p>
          <div className="flex items-center gap-2 flex-wrap">
            <SendPortalEmailButton clientId={client.id} />
            <SendPortalOrientationButton clientId={client.id} />
            <PortalInviteButton clientId={client.id} onboardingToken={client.onboarding_token} />
            <IssueLoginCodeButton clientId={client.id} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Agreement', done: !!client.agreement_accepted_at, href: client.agreement_accepted_at ? `/dashboard/clients/${id}/agreement` : null },
            { label: 'Health Declaration', done: !!client.health_declaration_submitted_at, href: client.health_declaration_submitted_at ? `/dashboard/clients/${id}/health-declaration` : null },
            { label: 'Intake', done: intakeDone, href: intakeDone ? `/dashboard/clients/${id}/intake` : null },
            { label: 'Baseline', done: !!baselines?.[0], href: baselines?.[0] ? `/dashboard/clients/${id}/baseline` : null },
            // Addressed = a panel uploaded OR the client recorded they'll arrange one.
            { label: (bloodPanels?.length ?? 0) > 0 ? 'Blood Work' : (client.bloodwork_arranged_at ? 'Blood Work (arranging)' : 'Blood Work'), done: (bloodPanels?.length ?? 0) > 0 || !!client.bloodwork_arranged_at, href: null },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.done ? 'bg-[#FAFAF8]' : 'bg-[#1A1E26]'}`} />
              {item.href ? (
                <Link href={item.href} className="text-[12.5px] text-[#FAFAF8] hover:text-[#FFFFFF] transition-colors">{item.label} →</Link>
              ) : (
                <span className={`text-xs ${item.done ? 'text-[#C2C6CC]' : 'text-[#C2C6CC]'}`}>{item.label}</span>
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
            <div className="mt-3 pt-3 border-t border-[#2A2F39] space-y-2">
              <div className="flex items-center justify-between">
                {client.medical_clearance_received_at ? (
                  <p className="text-[12.5px] text-[#FAFAF8]">Medical clearance received</p>
                ) : (
                  <>
                    <p className="text-[12.5px] text-[#E0A254]">Medical clearance required</p>
                    <Link href={`/dashboard/clients/${id}/medical-clearance`} className="text-[12.5px] text-[#E0A254] hover:text-[#E0A254] underline transition-colors">Manage →</Link>
                  </>
                )}
              </div>
              {!client.medical_clearance_received_at && (
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${emailSentAt ? 'bg-[#FAFAF8]' : 'bg-[#D4817E]'}`} />
                  {emailSentAt ? (
                    <p className="text-[10px] text-[#8A9099]" title={new Date(emailSentAt).toLocaleString('en-AU')}>
                      Client auto-email sent {new Date(emailSentAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    </p>
                  ) : (
                    <p className="text-[10px] text-[#D4817E]">
                      Client auto-email not sent. Run <code className="bg-[#1A1E26] px-1 rounded">scripts/send-clearance-required-email.ts {client.id}</code> or nudge manually.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Needs attention: hormonal status answers that must not wait for the read. */}
      {hormonalAlerts.map(alert => (
        <div key={alert.key} className="bg-[#1A1214] border border-[#4A2222] border-l-[3px] border-l-[#D4817E] rounded-xl p-5 mb-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#D4817E]/15 flex items-center justify-center">
              <span className="text-[#D4817E] text-[13.5px] font-bold leading-none">!</span>
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-[#D4817E] mb-1">Needs attention</p>
              <p className="text-sm font-semibold text-[#FAFAF8] mb-1.5">{alert.headline}</p>
              <p className="text-[13.5px] text-[#C2C6CC] leading-relaxed">{alert.detail}</p>
            </div>
          </div>
        </div>
      ))}

      {iron.open && (
        <div className={`${iron.tier === 'emergency' || iron.tier === 'same-day' ? 'bg-[#1A1214] border-[#4A2222] border-l-[#D4817E]' : 'bg-[#1A1E26] border-[#4A3A22] border-l-[#E0A254]'} border border-l-[3px] rounded-xl p-5 mb-4`}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#D4817E]/15 flex items-center justify-center">
              <span className="text-[#D4817E] text-[13.5px] font-bold leading-none">!</span>
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-[#D4817E] mb-1">
                {iron.tier === 'emergency' ? 'Emergency: she needs to be seen now' : iron.tier === 'same-day' ? 'Today, and no training until she has been seen' : iron.tier === 'same-week' ? 'This week, before anything else on her plan' : 'Refer, routine'}
              </p>
              <p className="text-sm font-semibold text-[#FAFAF8] mb-1.5">
                No pattern is assigned for her until she has seen a doctor
              </p>
              <p className="text-[13.5px] text-[#C2C6CC] leading-relaxed mb-2">What she answered, unranked:</p>
              <ul className="text-[13.5px] text-[#C2C6CC] leading-relaxed list-disc ml-4 mb-2">
                {iron.answers.map(a => <li key={a}>{a}</li>)}
              </ul>
              <p className="text-[13.5px] text-[#C2C6CC] leading-relaxed mb-2">{IRON_TIER_TIMEFRAME[iron.tier!]}</p>
              {iron.stopTraining && (
                <p className="text-[13.5px] font-semibold text-[#D4817E] mb-2">Training stops entirely until she has been seen.</p>
              )}
              <p className="text-[12.5px] text-[#8A9099] leading-relaxed mb-2">
                Do not name a cause, do not reassure her, and do not suggest waiting or trying the plan first. <strong>If she feels
                better in a few weeks, that is not evidence her iron is fine</strong>: in the trials, women on a dummy tablet
                reported their tiredness dropping 13 to 29 per cent. Her measured numbers are not a check either, because iron
                improves how someone feels without improving what they can do.
              </p>
              <details className="text-[13.5px] text-[#C2C6CC]">
                <summary className="cursor-pointer font-medium text-[#FAFAF8]">The wording to send her</summary>
                <p className="mt-2 whitespace-pre-line leading-relaxed">{IRON_REFERRAL_SENTENCE}</p>
              </details>
            </div>
          </div>
        </div>
      )}

      {bone.open && (
        <div className={`${bone.urgency === 'same-week' ? 'bg-[#1A1214] border-[#4A2222] border-l-[#D4817E]' : 'bg-[#1A1E26] border-[#4A3A22] border-l-[#E0A254]'} border border-l-[3px] rounded-xl p-5 mb-4`}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#D4817E]/15 flex items-center justify-center">
              <span className="text-[#D4817E] text-[13.5px] font-bold leading-none">!</span>
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-[#D4817E] mb-1">
                {bone.urgency === 'same-week' ? 'Bone: refer this week, and do not add load' : 'Bone: sort this out before load goes on'}
              </p>
              <p className="text-sm font-semibold text-[#FAFAF8] mb-1.5">Stop increasing load or impact until her GP has looked at this</p>
              <ul className="text-[13.5px] text-[#C2C6CC] leading-relaxed list-disc ml-4 mb-2">
                {bone.reasons.map(r => <li key={r}>{r}</li>)}
              </ul>
              <p className="text-[13.5px] text-[#C2C6CC] leading-relaxed mb-2">
                <strong>Say this, verbatim:</strong> &ldquo;{BONE_REFERRAL_SENTENCE}&rdquo;
              </p>
              <p className="text-[12.5px] text-[#8A9099] leading-relaxed">
                Do not interpret a scan or a T-score, do not comment on her medicines, and never attach a fracture-reduction
                percentage to training: no exercise trial has ever been powered to show one.
                {bone.barbellNotOptional && ' She is past her final period, so impact alone will not do it: the barbell is not optional once she is cleared.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {thyroid.open && (
        <div className="bg-[#1A1214] border border-[#4A2222] border-l-[3px] border-l-[#D4817E] rounded-xl p-5 mb-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#D4817E]/15 flex items-center justify-center">
              <span className="text-[#D4817E] text-[13.5px] font-bold leading-none">!</span>
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-[#D4817E] mb-1">Eating targets are held until she has seen a GP</p>
              <p className="text-sm font-semibold text-[#FAFAF8] mb-1.5">Refer for thyroid function tests</p>
              <p className="text-[13.5px] text-[#C2C6CC] leading-relaxed mb-2">
                Triggered because {thyroid.reasons.join('; and ')}.
              </p>
              <p className="text-[13.5px] text-[#C2C6CC] leading-relaxed mb-2">
                The engine will not build or deepen a deficit for her while this is open. That is deliberate: eating less does not
                fix a medical cause, and being in a deficit changes the blood results her doctor is about to read. <strong>Do not tell
                her what you think it is.</strong> A symptom questionnaire cannot separate this from under-recovery, a long deficit,
                low iron or the menopause transition, and it performs close to chance in women in this age range.
              </p>
              <details className="text-[13.5px] text-[#C2C6CC]">
                <summary className="cursor-pointer font-medium text-[#FAFAF8]">The wording to send her</summary>
                <p className="mt-2 whitespace-pre-line leading-relaxed">{THYROID_REFERRAL_TEXT}</p>
              </details>
            </div>
          </div>
        </div>
      )}

      {allReferralFlags.map(flag => (
        <div key={flag.key + flag.headline} className="bg-[#1A1E26] border border-[#4A3A22] border-l-[3px] border-l-[#E0A254] rounded-xl p-5 mb-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#E0A254]/15 flex items-center justify-center">
              <span className="text-[#E0A254] text-[13.5px] font-bold leading-none">!</span>
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-[#E0A254] mb-1">Raise with her, and with her GP</p>
              <p className="text-sm font-semibold text-[#FAFAF8] mb-1.5">{flag.headline}</p>
              <p className="text-[13.5px] text-[#C2C6CC] leading-relaxed">{flag.detail}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Signals to reconcile: reported-vs-measured fat distribution divergence.
          Non-diagnostic coach prompt. Only renders when both signals exist and clash. */}
      {fatDivergence && (
        <div className="bg-[#1A1E26] border border-[#4A3A22] border-l-[3px] border-l-[#E0A254] rounded-xl p-5 mb-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#E0A254]/15 flex items-center justify-center">
              <span className="text-[#E0A254] text-[13.5px] font-bold leading-none">!</span>
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-[#E0A254] mb-1">Signals to reconcile</p>
              <p className="text-sm font-semibold text-[#FAFAF8] mb-1.5">{fatDivergence.headline}</p>
              <p className="text-[13.5px] text-[#C2C6CC] leading-relaxed">{fatDivergence.detail}</p>
            </div>
          </div>
        </div>
      )}

      {/* Foundational intake status */}
      {latestFoundationalInvitation && (
        <div className="br-card p-5 mb-4"
        style={{
          background: 'linear-gradient(180deg,#14171D,#0B0D10)',
          boxShadow: '0 1px 3px rgba(16,24,40,0.09), 0 1px 2px -1px rgba(16,24,40,0.05), inset 0 1px 0 #14171D',
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13.5px] font-semibold text-[#FAFAF8] tracking-[-0.015em] mb-1">Intake</p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${
                    statusColour[latestFoundationalInvitation.status as keyof typeof statusColour]
                  }`}
                >
                  {latestFoundationalInvitation.status}
                </span>
                {latestFoundationalInvitation.status === 'complete' && latestFoundationalInvitation.completed_at && (
                  <span className="text-[12.5px] text-[#676D76]">
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
            <span className="w-7 h-[3px] rounded-full bg-[#FAFAF8]" />
            <h2 className="text-[11px] font-medium text-[#FAFAF8]" style={{ fontFamily: MONO_FONT, letterSpacing: "0.14em" }}>
              Updates <span className="text-[#C2C6CC] font-normal">- post-onboarding follow-ups</span>
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
        <div className="br-card p-5 mb-4"
        style={{
          background: 'linear-gradient(180deg,#14171D,#0B0D10)',
          boxShadow: '0 1px 3px rgba(16,24,40,0.09), 0 1px 2px -1px rgba(16,24,40,0.05), inset 0 1px 0 #14171D',
        }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13.5px] font-semibold text-[#FAFAF8] tracking-[-0.015em] mb-1">Supplementary intake</p>
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
                    <span className="text-[12.5px] text-[#676D76]">
                      Completed {formatDate(latestSupplementaryInvitation.completed_at)}
                    </span>
                  )}
                  {latestSupplementaryInvitation.status === 'pending' && (
                    <span className="text-[12.5px] text-[#676D76]">
                      Sitting in their portal since {formatDate(latestSupplementaryInvitation.created_at)}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[12.5px] text-[#676D76]">Not sent yet — adds a follow-up card to the client&apos;s portal asking only what they have not answered.</p>
              )}
              {fatMapIntake && !fatMapIntake.sex_at_birth && latestSupplementaryInvitation?.status !== 'pending' && (
                <p className="text-[12.5px] text-[#E0A254] mt-1.5">No hormonal status on file. Send a fresh follow-up and it will ask only those questions (about a minute).</p>
              )}
              {latestSupplementaryInvitation?.status === 'complete' && fatMapIntake?.sex_at_birth && (
                <p className="text-[11px] text-[#676D76] mt-1">Need to update meds or dietary context again? Send a fresh one.</p>
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

      </div>
      <div data-tab="health">

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

      </div>
      <div data-tab="overview">

      {/* Supplementary intake newer than active CFFS → coach action prompt.
          As of 2026-06-21 the supplementary intake no longer auto-regenerates
          the CFFS; coach reviews and regenerates manually. Triggered by Kade
          seeing a "Foundational Synthesis generated 21 June 2026" he hadn't
          asked for after Amanda's W7 supplementary submission. */}
      <MajorSection
        id="cffs"
        title="The read"
        subtitle="from their assessment"
        defaultOpen={cffsActionRequired || (
          !!latestSupplementaryInvitation?.completed_at &&
          (!activeCffs?.generated_at || new Date(latestSupplementaryInvitation.completed_at).getTime() > new Date(activeCffs.generated_at).getTime())
        )}
        attentionLabel={!activeCffs ? 'Not read yet' : (
          latestSupplementaryInvitation?.status === 'complete' && latestSupplementaryInvitation.completed_at && activeCffs.generated_at &&
          new Date(latestSupplementaryInvitation.completed_at).getTime() > new Date(activeCffs.generated_at).getTime()
            ? 'Supplementary newer — regenerate'
            : (!frPublished ? 'FR not published' : null)
        )}
        actionRight={frAudit ? <ArtefactAuditPill audit={frAudit} /> : undefined}
      >
      {latestSupplementaryInvitation?.status === 'complete' && latestSupplementaryInvitation.completed_at && activeCffs?.generated_at &&
       new Date(latestSupplementaryInvitation.completed_at).getTime() > new Date(activeCffs.generated_at).getTime() && (
        <div className="mb-4 rounded-xl border border-[#4A3A22] bg-[linear-gradient(180deg,#1A1E26,#1A1E26)] p-4">
          <p className="text-[11px] font-medium text-[#E0A254] mb-1">They have answered more since this read was written</p>
          <p className="text-sm text-[#C2C6CC] leading-relaxed mb-3">
            {client.name?.split(' ')[0] ?? 'The client'} submitted a supplementary intake on {formatDate(latestSupplementaryInvitation.completed_at)}. The dietary + medication context is saved on their file, but the CFFS still reflects the pre-update state. Click Regenerate below to refresh the CFFS so downstream artefacts (program, nutrition, weekly synthesis) read the new context.
          </p>
          {latestIntakeId && (
            <RegenerateCFFSButton clientId={client.id} intakeId={latestIntakeId} />
          )}
        </div>
      )}
      {!activeCffs ? (
        <div className="br-card p-8 text-center">
          <p className="text-[#8A9099] mb-2">Not read yet</p>
          <p className="text-[#C2C6CC] text-sm mb-4">
            {latestFoundationalInvitation?.status === 'pending'
              ? 'Waiting for the client to complete their intake.'
              : latestIntakeId
              ? 'Intake submitted but CFFS generation may have failed.'
              : 'The read is written automatically once they finish their assessment.'}
          </p>
          {latestIntakeId && (
            <div className="flex justify-center">
              <RegenerateCFFSButton clientId={client.id} intakeId={latestIntakeId} />
            </div>
          )}
        </div>
      ) : (
        <>

          {/* Pattern watch. Sits ABOVE the state card because it is the thing
              that needs acting on when new evidence arrives, and a note the
              coach has to go looking for is a note nobody reads. */}
          {activeCffs?.pattern_watch_for && (
            <div className="br-card-flagged px-5 py-4 mb-4">
              <p className="text-[10px] font-medium text-[#FAFAF8] mb-2">
                Watch for
                {activeCffs.pattern_competing_read && activeCffs.pattern_competing_read !== 'None'
                  ? activeCffs.pattern_classification === INDETERMINATE
                    ? ` — leaning toward: ${activeCffs.pattern_competing_read}`
                    : ` — competing read: ${activeCffs.pattern_competing_read}`
                  : ''}
              </p>
              <p className="text-[13.5px] text-[#C2C6CC] leading-relaxed">{activeCffs.pattern_watch_for}</p>
            </div>
          )}

          {/* State + Exposure Readiness */}
          <div className="br-card overflow-hidden mb-4">
            <div className="px-5 pt-5 pb-4 grid grid-cols-2 gap-4 border-b border-[#2A2F39]">
              <div>
                <p className="text-[10px] font-medium text-[#676D76] mb-2">Readiness</p>
                <p className="text-lg font-bold text-[#FAFAF8] leading-tight mb-2">{bodyState.label}</p>
                {bodyState.reScored && (
                  <p className="text-[11px] text-[#8A9099] -mt-1 mb-2">
                    Re-scored to {bodyState.reScoredPublicLabel}{bodyState.direction ? ` (${bodyState.direction})` : ''} at the last Progress Check. The foundational read said {bodyState.foundational} and is unchanged.
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3.5 bg-[#FAFAF8]" />
                  <p className="text-[12.5px] text-[#8A9099]">Resolution: <span className="text-[#FAFAF8] font-semibold">{activeCffs.resolution_state}</span></p>
                </div>
                {/* Pattern sits with the state on the screen the coach actually
                    works from, not only on the printable report. */}
                {activeCffs.pattern_classification && (
                  <div className="mt-4 pt-4 border-t border-[#2A2F39]">
                    <p className="text-[10px] font-medium text-[#676D76] mb-2">Pattern Classification</p>
                    <p className="text-lg font-bold text-[#FAFAF8] leading-tight mb-2">{readPatternLabel(activeCffs.pattern_classification)}</p>
                    {activeCffs.pattern_classification === INDETERMINATE && activeCffs.pattern_competing_read && activeCffs.pattern_competing_read !== 'None' && (
                      <p className="text-[12.5px] text-[#8A9099] -mt-1 mb-2">Leaning toward {activeCffs.pattern_competing_read}. See Watch for.</p>
                    )}
                    {activeCffs.pattern_confidence && activeCffs.pattern_classification !== INDETERMINATE && (
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3.5 bg-[#FAFAF8]" />
                        <p className="text-[12.5px] text-[#8A9099]">
                          Confidence: <span className="text-[#FAFAF8] font-semibold capitalize">{activeCffs.pattern_confidence}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] font-medium text-[#676D76] mb-3">Exposure Readiness</p>
                <div className="grid grid-cols-2 gap-2">
                  {readinessItems.map(item => (
                    <div key={item.label} className={`px-3 py-2 rounded-lg border-l-2 ${
                      readinessLevel(item.value).tone === 'strong' ? 'bg-[#1A1E26] border-[#FAFAF8]' :
                      readinessLevel(item.value).tone === 'normal' ? 'bg-[#14171D] border-[#4A4F57]' :
                      'bg-[#14171D] border-[#2A2F39]'
                    }`}>
                      <p className={`text-xs mb-0.5 ${
                        readinessLevel(item.value).tone === 'strong' ? 'font-bold text-[#FAFAF8]' :
                        readinessLevel(item.value).tone === 'normal' ? 'font-semibold text-[#C2C6CC]' :
                        'font-medium text-[#676D76]'
                      }`}>{readinessLevel(item.value).label}</p>
                      <p className="text-[10px] text-[#676D76] font-medium">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-[#C2C6CC] text-[12.5px]">Generated {formatDate(activeCffs.generated_at)}</p>
                {/* Visual Signal Integration: shows whether photos were read at generation time. */}
                {typeof activeCffs.photos_used === 'number' && (
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border uppercase ${
                      activeCffs.photos_used > 0
                        ? 'text-[#FAFAF8] bg-[rgba(27,109,252,0.10)] border-[#2A2F39]'
                        : 'text-[#676D76] bg-[#14171D] border-[#2A2F39]'
                    }`}
                    title={
                      activeCffs.photos_used > 0
                        ? `Baseline photos read by the Fat Map: ${activeCffs.photos_used} of 3`
                        : 'No baseline photos attached at generation time'
                    }
                  >
                    <span
                      className="w-1 h-1 rounded-full"
                      style={{ background: activeCffs.photos_used > 0 ? '#FAFAF8' : '#676D76' }}
                    />
                    Photos {activeCffs.photos_used > 0 ? `✓ ${activeCffs.photos_used}/3` : '✗ Not provided'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/dashboard/clients/${client.id}/cffs-report`}
                  target="_blank"
                  className="br-btn"
                >
                  Download PDF
                </Link>
                {latestIntakeId && (
                  <RegenerateCFFSButton clientId={client.id} intakeId={latestIntakeId} />
                )}
                {/* Re-intake: sends the client a fresh 234-question intake.
                    Placed alongside Regenerate CFFS because the two actions
                    live on the same axis: "the CFFS needs a refresh — do I
                    regenerate against existing intake data, or ask the client
                    for a full data refresh first?" Re-intake is the heavier
                    of the two; use when enough has shifted since the original
                    intake that the readiness signals themselves are stale. */}
                <ReintakeButton
                  clientId={client.id}
                  clientName={client.name}
                  clientEmail={client.email}
                  latestInvitation={latestReintakeInvitation}
                  latestSentAt={latestReintakeSend?.sent_at ?? null}
                />
              </div>
            </div>
          </div>

          {/* Doctrine: Signal Monitoring v1.0 - readiness monitor panel */}
          {readinessReport && (readinessReport.status !== 'clean' || readinessReport.block?.weeksRemaining != null) && (
            <div
              className="bg-[#14171D] border rounded-xl overflow-hidden mb-4"
              style={{
                borderColor: readinessReport.status === 'regression' ? '#1A1214'
                  : readinessReport.status === 'reassessment' ? '#4A3A22'
                  : '#2A2F39',
              }}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A2F39]">
                <div className="flex items-center gap-2.5">
                  {readinessReport.status === 'regression' ? (
                    <Activity size={13} className="text-[#D4817E]" />
                  ) : readinessReport.status === 'reassessment' ? (
                    <RefreshCw size={13} className="text-[#E0A254]" />
                  ) : (
                    <AlertTriangleIcon size={13} className="text-[#8A9099]" />
                  )}
                  <p
                    className="text-[11px] font-medium"
                    style={{
                      fontFamily: MONO_FONT,
                      letterSpacing: '0.14em',
                      color: readinessReport.status === 'regression' ? '#D4817E'
                        : readinessReport.status === 'reassessment' ? '#E0A254'
                        : '#C2C6CC',
                    }}
                  >
                    {readinessReport.status === 'regression' ? 'Active Regression - Coach Review Required'
                      : readinessReport.status === 'reassessment' ? 'Worth reading again'
                      : readinessReport.status === 'advisory' ? 'Drift Advisory'
                      : 'Block Status'}
                  </p>
                </div>
                <span className="text-[10px] text-[#676D76]" style={{ fontFamily: MONO_FONT }}>
                  Signal Monitoring v1.0
                </span>
              </div>

              {/* Drift conditions */}
              {readinessReport.drift.length > 0 && (
                <div className="px-5 py-4 border-b border-[#2A2F39]">
                  <p className="text-[10px] font-medium text-[#676D76] mb-2">
                    Drift this week
                  </p>
                  <ul className="space-y-1.5">
                    {readinessReport.drift.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13.5px]">
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: d.severity === 'high' ? '#D4817E' : '#8A9099' }}
                        />
                        <span className={d.severity === 'high' ? 'text-[#FAFAF8]' : 'text-[#8A9099]'}>{d.message}</span>
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
                  <div className="px-5 py-4 border-b border-[#2A2F39]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-medium text-[#676D76]">
                        RPE creep — week {creep.weekNumberInBlock}
                      </p>
                      <span className="text-[10px] text-[#676D76]" style={{ fontFamily: MONO_FONT }}>
                        {creep.creepingCount} exercise{creep.creepingCount === 1 ? '' : 's'}{creep.severeCount > 0 ? ` · ${creep.severeCount} severe` : ''}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {creep.findings.slice(0, 6).map((f, i) => (
                        <li key={i} className="flex items-center justify-between gap-3 text-[12.5px]">
                          <span className={f.severe ? 'text-[#FAFAF8]' : 'text-[#8A9099]'}>{f.exerciseName}</span>
                          <span className="shrink-0 tabular-nums" style={{ fontFamily: MONO_FONT }}>
                            <span className="text-[#676D76]">RPE</span>{' '}
                            <span className="text-[#676D76]">{f.prescribedRpe}</span>
                            <span className="text-[#676D76]"> → </span>
                            <span className={f.severe ? 'text-[#D4817E]' : 'text-[#E0A254]'}>{f.avgLoggedRpe}</span>
                            <span className={f.severe ? 'text-[#D4817E]' : 'text-[#E0A254]'}> (+{f.delta})</span>
                            {f.maxLoggedRpe >= 9.5 && (
                              <span className="text-[#D4817E]"> · max {f.maxLoggedRpe}</span>
                            )}
                            <span className="text-[#676D76]"> · {f.setCount} set{f.setCount === 1 ? '' : 's'}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                    {creep.findings.length > 6 && (
                      <p className="text-[11px] text-[#676D76] mt-2" style={{ fontFamily: MONO_FONT }}>
                        +{creep.findings.length - 6} more not shown
                      </p>
                    )}
                  </div>
                )
              })()}

              {/* Reassessment reasons */}
              {readinessReport.reassessmentReasons.length > 0 && (
                <div className="px-5 py-4 border-b border-[#2A2F39]">
                  <p className="text-[10px] font-medium text-[#676D76] mb-2">
                    Reassessment triggers
                  </p>
                  <ul className="space-y-2">
                    {readinessReport.reassessmentReasons.map((r, i) => (
                      <li key={i} className="text-[13.5px]">
                        <p className="text-[#FAFAF8]">{r.message}</p>
                        <p className="text-[11px] text-[#676D76] mt-0.5" style={{ fontFamily: MONO_FONT }}>
                          Recommended depth: <span className="text-[#8A9099]">{r.recommendedDepth}</span>
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
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-[#676D76]">
                      Block <span className="text-[#C2C6CC]">{readinessReport.block.blockName ?? '-'}</span>
                      {readinessReport.block.weekDuration != null && (
                        <> · {readinessReport.block.weekDuration}-week duration</>
                      )}
                    </span>
                    <span
                      className="text-[11px] font-medium"
                      style={{
                        fontFamily: MONO_FONT,
                        color: readinessReport.block.isAtBlockEnd ? '#E0A254' : '#676D76',
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

          {/* Coach-side logging: log a session on the client's behalf when you
              train them in person. Hidden for package = 'online' (2026-07-30):
              an online client is never trained in person, so the button is noise
              at best and, if used, records a session that did not happen with
              you. The numbered packages (1x, 2x, 3x) are in-person session
              counts; contra and no_charge are ambiguous so the button stays. */}
          {activeProgram && client.package !== 'online' && (
            <div className="mt-3">
              <Link
                href={`/dashboard/clients/${id}/train`}
                className="br-btn br-btn-primary"
              >
                Log a session →
              </Link>
              <p className="mt-1.5 text-[12.5px] text-[#676D76]">Log a workout on {(client.name ?? 'the client').split(' ')[0]}&apos;s behalf when you train them in person. It appears in their portal too.</p>
            </div>
          )}

          {/* Open reassessment triggers. Sits above the interpretive panels
              because it is the only block on this page that represents unfinished
              work: each item needs a decision before it leaves the screen. */}
          <ReassessmentTriggersPanel
            triggers={openTriggers}
            clientEmail={client.email}
            reasonLabels={REASON_LABEL}
            overdueAfterDays={OVERDUE_AFTER_DAYS}
          />

          {/* Recovery Router (Phase 2 / observe-only) */}
          <RecoveryRouterPanel snapshot={recoverySnapshot} mode={recoveryMode} />

          {/* Coach-facing at-a-glance summary (2026-07-11 rationale compression).
              Leads the CFFS block; the 7 interpretive sections collapse below.
              Legacy CFFS rows (no rationale_summary) skip this and show the
              sections inline, unchanged. */}
          {cffsSummary?.headline && (
            <GlanceCard
              className="mb-4"
              headline={cffsSummary.headline}
              pills={[
                cffsSummary.scan?.body_state ? { text: cffsSummary.scan.body_state, tone: 'neutral' } : null,
                cffsSummary.scan?.resolution ? { text: cffsSummary.scan.resolution, tone: 'neutral' } : null,
                cffsSummary.scan?.binding_constraint ? { text: `Binding: ${cffsSummary.scan.binding_constraint}`, tone: 'accent' } : null,
                flagsPill(cffsSummary.scan?.flags_count),
              ].filter(Boolean) as GlancePill[]}
              bulletGroups={[{ tone: 'accent', items: (cffsSummary.operating_rules ?? []).filter(Boolean) }]}
            />
          )}

          {/* What is a CFFS */}
          <div className="br-card p-5 mb-4">
            <p className="text-[10px] font-medium text-[#FAFAF8] mb-3">About This Report</p>
            <p className="text-sm font-semibold text-[#FAFAF8] leading-relaxed mb-3">
              This is not a summary. It is a structured interpretation of how this client&apos;s system is currently organising itself.
            </p>
            <p className="text-sm text-[#676D76] leading-relaxed">
              The CFFS translates {getTotalQuestions()} data points across eight signal domains into a single, coherent picture of the client&apos;s current readiness and the pattern driving it. Nothing here prescribes or diagnoses - you remain the interpretive authority.
            </p>
          </div>

          {/* Visual Signal Summary - dedicated read of what the photos contributed.
              Only renders when the Fat Map had photo input at generation time. Sits
              above the standard CFFS sections so coaches can scan the visual layer
              at a glance. */}
          {activeCffs.visual_signal_summary && (
            <div className="mb-3 bg-[#14171D] border border-[#2A2F39] rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-[#2A2F39] bg-[rgba(27,109,252,0.06)]">
                <Eye size={13} className="text-[#FAFAF8]" />
                <p
                  className="text-[10px] font-medium text-[#FAFAF8]"
                >
                  Visual Signal Summary
                </p>
                <span
                  className="ml-auto text-[10px] text-[#C2C6CC]"
                >
                  What the {activeCffs.photos_used ?? 3} baseline photo{(activeCffs.photos_used ?? 3) === 1 ? '' : 's'} contributed
                </span>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-[#FAFAF8] leading-relaxed">{activeCffs.visual_signal_summary}</p>
              </div>
            </div>
          )}

          {/* CFFS Sections — the full interpretive analysis. When the at-a-glance
              summary exists (2026-07-11+), these collapse behind a toggle so the
              coach scans the card first. Legacy rows with no summary render the
              sections open by default (unchanged behaviour). */}
          <details className="mb-6 group" open={!cffsSummary?.headline}>
            <summary className="cursor-pointer text-[11px] font-semibold text-[#FAFAF8] hover:text-[#FFFFFF] select-none list-none flex items-center gap-1.5 mb-3">
              <span className="transition-transform group-open:rotate-90">▸</span>
              Full interpretive analysis ({cffsSections.length} sections)
            </summary>
            <div className="space-y-2">
              {cffsSections.map((section, i) => (
                <div key={section.label} className="br-card overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-[#2A2F39] bg-[#14171D]/80">
                    <span className="text-[11px] font-black text-[#FAFAF8]">{String(i + 1).padStart(2, '0')}</span>
                    <p className="text-[10px] font-medium text-[#8A9099]">{section.label}</p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-sm text-[#FAFAF8] leading-relaxed">{section.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </details>

          <ClientReadingPanel
            cffs={activeCffs as Parameters<typeof ClientReadingPanel>[0]['cffs']}
            clientId={client.id}
            clientToken={client.onboarding_token ?? null}
            clientFirstName={String(client.name ?? '').split(/\s+/)[0] || 'your client'}
          />

          {/* Archived CFFS */}
          {archivedCffs.length > 0 && (
            <div className="mt-8">
              <p className="text-[#676D76] text-sm mb-3">Earlier reads ({archivedCffs.length})</p>
              <div className="space-y-2">
                {archivedCffs.map(c => (
                  <div
                    key={c.id}
                    className="br-card-inset px-4 py-3 flex items-center justify-between opacity-60"
                  >
                    <span className="text-sm text-[#8A9099]">{formatDate(c.generated_at)}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full border"
                      style={readinessPillStyle(c.body_state_classification, true)}
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

      </div>
      <div data-tab="health">

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
        {/* Height sits above the capture card because it is not a per-capture
            measurement and, unlike the rest of them, it can be entered here.
            Clients with no baseline still need one on file or their nutrition
            plan carries no energy requirement. */}
        <HeightEditor
          clientId={client.id}
          clientHeightCm={client.height_cm ?? null}
          clientHeightRecordedAt={client.height_recorded_at ?? null}
          clientHeightSource={client.height_source ?? null}
          baselineHeightCm={latestBaseline?.height_cm ?? null}
          baselineCapturedAt={latestBaseline?.captured_at ?? null}
          hasBodyweight={!!latestBaseline?.bodyweight_kg}
          hasAge={!!latestIntake?.date_of_birth}
          hasSex={!!latestIntake?.gender}
        />

        {latestBaseline ? (
          <div className="br-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[12.5px] text-[#676D76]">Week {latestBaseline.re_capture_week} capture · {new Date(latestBaseline.captured_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
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
                <div key={m.label} className="bg-[#1A1E26]/50 rounded-xl p-3 text-center">
                  <p className="text-[12.5px] text-[#676D76] mb-1">{m.label}</p>
                  <p className="text-base font-semibold text-[#FAFAF8]">{m.value ?? '-'}<span className="text-[12.5px] text-[#676D76] ml-1">{m.unit}</span></p>
                </div>
              ))}
            </div>

            {/* Photos */}
            {(baselinePhotos.front || baselinePhotos.side || baselinePhotos.back) && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Front', url: baselinePhotos.front },
                  { label: 'Side', url: baselinePhotos.side },
                  { label: 'Back', url: baselinePhotos.back },
                ].map(photo => (
                  <div key={photo.label} className="space-y-1.5">
                    <p className="text-[12.5px] text-[#676D76] text-center">{photo.label}</p>
                    {photo.url ? (
                      <a href={photo.url} target="_blank" rel="noopener noreferrer">
                        <img src={photo.url} alt={photo.label} className="w-full aspect-[3/4] object-cover rounded-xl hover:opacity-80 transition-opacity" />
                      </a>
                    ) : (
                      <div className="w-full aspect-[3/4] bg-[#1A1E26] rounded-xl flex items-center justify-center">
                        <p className="text-[#C2C6CC] text-[12.5px]">No photo</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="br-card p-5 text-center">
            <p className="text-[#676D76] text-sm">No baseline submitted yet</p>
            <p className="text-[#C2C6CC] text-[12.5px] mt-1">Send the client their baseline link to begin</p>
          </div>
        )}
      </MajorSection>

      </div>
      <div data-tab="overview">

      {/* Weekly Check-In Section */}
      <MajorSection
        id="cfws"
        title="This week's read"
        subtitle="from their check-in"
        defaultOpen={cfwsActionRequired}
        attentionLabel={latestCheckinDraftUnsent ? 'Draft written but NOT SENT' : (latestCheckinNeedsResponse ? 'Latest check-in needs response' : (cfwsActionRequired ? 'A new week is ready to read' : null))}
        actionRight={
          <>
            <ReopenCheckinButton clientId={id} overrideUntil={client.checkin_window_override_until ?? null} />
            {checkinToken && <CopyLinkButton token={checkinToken} label="Copy check-in link" path="/checkin" />}
          </>
        }
      >

        <AutoResponseToggle
          clientId={id}
          initialEnabled={client.auto_checkin_response_enabled ?? true}
        />

        {/* Latest CFWS */}
        {latestCfws ? (
          <>
            {/* Readiness grid */}
            <div className="br-card overflow-hidden mb-4">
              <div className="px-5 pt-5 pb-4 border-b border-[#2A2F39]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-medium text-[#676D76]">Exposure Readiness</p>
                  <p className="text-[10px] font-medium text-[#FAFAF8]">Week {latestCfws.week_number}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Capacity', value: latestCfws.exposure_readiness_capacity },
                    { label: 'Schedule', value: latestCfws.exposure_readiness_schedule },
                    { label: 'Regulation', value: latestCfws.exposure_readiness_regulation },
                    { label: 'Behaviour', value: latestCfws.exposure_readiness_behaviour },
                  ].map(item => (
                    <div key={item.label} className={`px-3 py-2 rounded-lg border-l-2 ${
                      readinessLevel(item.value).tone === 'strong' ? 'bg-[#1A1E26] border-[#FAFAF8]' :
                      readinessLevel(item.value).tone === 'normal' ? 'bg-[#14171D] border-[#4A4F57]' :
                      'bg-[#14171D] border-[#2A2F39]'
                    }`}>
                      <p className={`text-xs mb-0.5 ${
                        readinessLevel(item.value).tone === 'strong' ? 'font-bold text-[#FAFAF8]' :
                        readinessLevel(item.value).tone === 'normal' ? 'font-semibold text-[#C2C6CC]' :
                        'font-medium text-[#676D76]'
                      }`}>{readinessLevel(item.value).label}</p>
                      <p className="text-[10px] text-[#676D76] font-medium">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <p className="text-[#C2C6CC] text-[12.5px]">Generated {formatDate(latestCfws.generated_at)}</p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/clients/${client.id}/cfws-report`}
                    target="_blank"
                    className="br-btn"
                  >
                    Download PDF
                  </Link>
                  {latestCompleteWeek && <RegenerateCFWSButton clientId={id} weekNumber={latestCompleteWeek} />}
                </div>
              </div>
            </div>

            {/* Coach-facing at-a-glance summary (2026-07-11 rationale compression).
                Leads the weekly synthesis; the sections collapse below. Legacy
                CFWS rows (no rationale_summary) render sections inline. */}
            {cfwsSummary?.headline && (
              <GlanceCard
                className="mb-4"
                headline={cfwsSummary.headline}
                pills={[
                  cfwsSummary.scan?.trajectory ? { text: cfwsSummary.scan.trajectory, tone: 'accent' } : null,
                  cfwsSummary.scan?.resolution ? { text: cfwsSummary.scan.resolution, tone: 'neutral' } : null,
                  cfwsSummary.scan?.binding_constraint ? { text: `Binding: ${cfwsSummary.scan.binding_constraint}`, tone: 'neutral' } : null,
                  flagsPill(cfwsSummary.scan?.flags_count),
                ].filter(Boolean) as GlancePill[]}
                bulletGroups={[{ tone: 'accent', items: (cfwsSummary.operating_rules ?? []).filter(Boolean) }]}
              />
            )}

            {/* About block */}
            <div className="br-card p-5 mb-4">
              <p className="text-[10px] font-medium text-[#FAFAF8] mb-3">About This Report</p>
              <p className="text-sm font-semibold text-[#FAFAF8] leading-relaxed mb-3">
                This is not a summary. It is a structured interpretation of how this client&apos;s system is behaving this week.
              </p>
              <p className="text-sm text-[#676D76] leading-relaxed">
                The CFWS translates weekly check-in signals across training load, recovery, regulation, and lifestyle into a coherent picture. Nothing here prescribes or diagnoses - you remain the interpretive authority.
              </p>
            </div>

            {/* CFWS Sections — collapse behind a toggle when the summary exists. */}
            {(() => {
              const cfwsSections = [
                { label: 'Context Snapshot', content: latestCfws.client_context_snapshot },
                { label: 'Dominant Weekly Patterns', content: latestCfws.dominant_weekly_patterns },
                { label: 'Capacity Constraints', content: latestCfws.weekly_capacity_constraints },
                { label: 'Risk Flags', content: latestCfws.weekly_risk_flags },
                { label: 'Tensions & Trade-Offs', content: latestCfws.weekly_tensions_tradeoffs },
                { label: 'Explicit Non-Directives', content: latestCfws.explicit_weekly_non_directives },
                { label: 'Closing Notes', content: latestCfws.closing_weekly_notes },
              ].filter(s => s.content)
              return (
                <details className="mb-6 group" open={!cfwsSummary?.headline}>
                  <summary className="cursor-pointer text-[11px] font-semibold text-[#FAFAF8] hover:text-[#FFFFFF] select-none list-none flex items-center gap-1.5 mb-3">
                    <span className="transition-transform group-open:rotate-90">▸</span>
                    Full weekly analysis ({cfwsSections.length} sections)
                  </summary>
                  <div className="space-y-2">
                    {cfwsSections.map((section, i) => (
                      <div key={section.label} className="br-card overflow-hidden">
                        <div className="flex items-center gap-3 px-5 py-3 border-b border-[#2A2F39] bg-[#14171D]/80">
                          <span className="text-[11px] font-black text-[#FAFAF8]">{String(i + 1).padStart(2, '0')}</span>
                          <p className="text-[10px] font-medium text-[#8A9099]">{section.label}</p>
                        </div>
                        <div className="px-5 py-4">
                          <p className="text-sm text-[#FAFAF8] leading-relaxed">{section.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )
            })()}
          </>
        ) : (
          <div className="br-card p-5 mb-3 text-center">
            <p className="text-[#676D76] text-sm">No read for this week yet</p>
            {latestCompleteWeek ? (
              <div className="mt-3">
                <RegenerateCFWSButton clientId={id} weekNumber={latestCompleteWeek} />
              </div>
            ) : (
              <p className="text-[#C2C6CC] text-[12.5px] mt-1">Written once the week’s check-in is in</p>
            )}
          </div>
        )}

        {/* Check-in submission log */}
        {recentCheckins && recentCheckins.length > 0 && (
          <div className="br-card p-4">
            <p className="text-[13.5px] font-semibold text-[#FAFAF8] tracking-[-0.015em] mb-3">Recent Submissions</p>
            <div className="space-y-2">
              {recentCheckins.slice(0, 8).map((ci, i) => {
                const fb = ci.id ? feedbackByCheckinId.get(ci.id) : undefined
                const sent = !!fb?.email_sent_at
                const skipped = !!ci.coach_skipped_at && !fb
                return (
                  <Link
                    key={i}
                    href={`/dashboard/clients/${id}/checkins/${ci.week_number}/${ci.form_type}`}
                    className="flex items-center justify-between text-[12.5px] hover:bg-[#1A1E26]/50 -mx-2 px-2 py-1 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[#8A9099]">Week {ci.week_number} check-in</span>
                      {fb && (
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${sent ? 'bg-[#1A1E26] border border-[#2A2F39] text-[#8A9099]' : 'bg-[#1A1E26] border border-[#2A2F39] text-[#C2C6CC]'}`}>
                          {sent ? 'Response sent' : 'Draft'}
                        </span>
                      )}
                      {skipped && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#1A1E26] border border-[#2A2F39] text-[#8A9099]">
                          Skipped
                        </span>
                      )}
                    </div>
                    <span className="text-[#C2C6CC]">{formatDate(ci.submitted_at)}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Coach response history */}
        {feedbackHistory && feedbackHistory.length > 0 && (
          <div className="br-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13.5px] font-semibold text-[#FAFAF8] tracking-[-0.015em]">Coach Response History</p>
              <p className="text-[10px] text-[#C2C6CC]">{feedbackHistory.length} total</p>
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

      </div>
      <div data-tab="training">

      {/* Training Program Section */}
      <MajorSection
        id="training"
        title="Training Program"
        subtitle="PTS"
        defaultOpen={trainingActionRequired}
        attentionLabel={!activeProgram ? 'No active program' : draftProgram ? 'Draft awaiting review' : null}
        actionRight={
          <>
            {prAudit && <ArtefactAuditPill audit={prAudit} />}
            <Link
              href={`/dashboard/clients/${id}/plan`}
              className="br-btn"
            >
              Macro Plan
            </Link>
          </>
        }
      >
        <div className="space-y-2">
          {/* Draft program */}
          {draftProgram && (
            <Link
              href={`/dashboard/clients/${id}/program/draft/${draftProgram.id}`}
              className="block br-card p-5 br-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-[#FAFAF8]">{draftProgram.block_name}</p>
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1A1E26] border border-[#2A2F39] text-[#8A9099]">Draft</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1A1E26] text-[#8A9099] capitalize">{draftProgram.progression_phase}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1A1E26] text-[#8A9099] capitalize">{draftProgram.training_goal}</span>
                </div>
              </div>
              <p className="text-[12.5px] text-[#676D76]">
                {draftProgram.training_frequency}x/week · {draftProgram.week_duration} weeks · Generated {formatDate(draftProgram.generated_at)}
              </p>
              <p className="text-[12.5px] text-[#FAFAF8] mt-2">Review &amp; edit draft →</p>
            </Link>
          )}

          {/* Active program */}
          {activeProgram ? (
            <Link
              href={`/dashboard/clients/${id}/program`}
              className="block br-card p-5 br-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-[#FAFAF8]">{activeProgram.block_name}</p>
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1A1E26] text-[#8A9099] capitalize">
                    {activeProgram.progression_phase}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1A1E26] text-[#8A9099] capitalize">
                    {activeProgram.training_goal}
                  </span>
                </div>
              </div>
              <p className="text-[12.5px] text-[#676D76]">
                {activeProgram.training_frequency}x/week · {activeProgram.week_duration} weeks · Generated {formatDate(activeProgram.generated_at)}
              </p>
              {activeProgram.pr_why_this_block && (
                <p className="text-[12.5px] text-[#8A9099] mt-2 leading-relaxed line-clamp-3">{activeProgram.pr_why_this_block}</p>
              )}
              <p className="text-[12.5px] text-[#FAFAF8] mt-2">View full program →</p>
            </Link>
          ) : !draftProgram ? (
            <div className="br-card p-5 text-center">
              <p className="text-[#676D76] text-sm">No program generated yet</p>
              <p className="text-[#C2C6CC] text-[12.5px] mt-1">Generate a program once the read is complete</p>
            </div>
          ) : null}
        </div>
      </MajorSection>

      </div>
      <div data-tab="nutrition">

      {/* Nutrition Plan Section */}
      <MajorSection
        id="nutrition"
        title="Nutrition Plan"
        subtitle="HABNS"
        defaultOpen={nutritionActionRequired}
        attentionLabel={!activeNutritionPlan ? 'No active plan' : draftNutritionPlan ? 'Draft awaiting review' : null}
        actionRight={
          <>
            {nrAudit && <ArtefactAuditPill audit={nrAudit} />}
            <Link
              href={`/dashboard/clients/${id}/nutrition/suggest`}
              className="br-btn"
            >
              {activeNutritionPlan ? 'Regenerate' : 'Generate Plan'}
            </Link>
          </>
        }
      >
        <div className="space-y-2">
          {/* Draft nutrition plan */}
          {draftNutritionPlan && (
            <Link
              href={`/dashboard/clients/${id}/nutrition`}
              className="block br-card p-5 br-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-[#FAFAF8]">{draftNutritionPlan.plan_name}</p>
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1A1E26] border border-[#2A2F39] text-[#8A9099]">Draft</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1A1E26] text-[#8A9099] capitalize">{draftNutritionPlan.entry_state.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1A1E26] text-[#8A9099] capitalize">{draftNutritionPlan.carb_demand_level} carbs</span>
                </div>
              </div>
              <p className="text-[12.5px] text-[#676D76]">Generated {formatDate(draftNutritionPlan.generated_at)}</p>
              <p className="text-[12.5px] text-[#FAFAF8] mt-2">Review &amp; approve draft →</p>
            </Link>
          )}

          {/* Active nutrition plan */}
          {activeNutritionPlan ? (
            <Link
              href={`/dashboard/clients/${id}/nutrition`}
              className="block br-card p-5 br-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-[#FAFAF8]">{activeNutritionPlan.plan_name}</p>
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1A1E26] text-[#8A9099] capitalize">{activeNutritionPlan.entry_state.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#1A1E26] text-[#8A9099] capitalize">{activeNutritionPlan.carb_demand_level} carbs</span>
                  {activeNutritionPlan.current_direction && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                      activeNutritionPlan.current_direction === 'progress' ? 'bg-[rgba(27,109,252,0.08)] text-[#FAFAF8]' :
                      activeNutritionPlan.current_direction === 'rebuild' ? 'bg-[#1A1214] text-[#D4817E]' :
                      'bg-[#1A1E26] text-[#8A9099]'
                    }`}>{activeNutritionPlan.current_direction}</span>
                  )}
                </div>
              </div>
              <p className="text-[12.5px] text-[#676D76]">Generated {formatDate(activeNutritionPlan.generated_at)}</p>
              {activeNutritionPlan.nr_what_this_nutrition_is_doing && (
                <p className="text-[12.5px] text-[#8A9099] mt-2 leading-relaxed line-clamp-3">{activeNutritionPlan.nr_what_this_nutrition_is_doing}</p>
              )}
              <p className="text-[12.5px] text-[#FAFAF8] mt-2">View full nutrition plan →</p>
            </Link>
          ) : !draftNutritionPlan ? (
            <div className="br-card p-5 text-center">
              <p className="text-[#676D76] text-sm">No nutrition plan generated yet</p>
              <p className="text-[#C2C6CC] text-[12.5px] mt-1">Generate a plan once the read is complete</p>
            </div>
          ) : null}
        </div>
      </MajorSection>

      </div>
      <div data-tab="admin">

      {/* Engagement state controls. Freeze (pause, reversible) sits above
          Offboard (end, considered) so the softer action is reached first. */}
      <div className="mb-4">
        <FreezePanel
          clientId={id}
          clientName={client.name ?? 'this client'}
          endedAt={client.ended_at ?? null}
          frozenAt={client.frozen_at ?? null}
          freezeNotes={client.freeze_notes ?? null}
        />
      </div>
      <div className="mb-4">
        <OffboardPanel
          clientId={id}
          clientName={client.name ?? 'this client'}
          endedAt={client.ended_at ?? null}
          endReason={client.end_reason ?? null}
          retainUntil={client.retain_until ?? null}
        />
      </div>

      {/* Payments Section */}
      <MajorSection
        id="payments"
        title="Payments"
        defaultOpen={paymentsActionRequired}
      >
        <ClientPaymentsSection clientId={id} />
      </MajorSection>

      </div>
      </ClientProfileTabs>

      </div>
    </PageBody>
  )
}
