/**
 * Today's Focus — per-client "what to do next" board.
 *
 * 2026-05-13: rewrote from coach-level metrics to a per-client state-aware
 * widget. Each active client gets ONE row showing the single most-relevant
 * next action: an onboarding-stage call-out (Generate CFFS / Publish FR /
 * Build Macro Arc / etc.), a readiness signal (regression / reassessment /
 * drift advisory), an overdue check-in, or a steady-state "Week N of M"
 * label. Sorted by priority so anything waiting on you sits at the top.
 *
 * The state machine lives in src/lib/client-next-action.ts. This file just
 * batches the data fetch and renders.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import { evaluateReadiness, type ReadinessReport } from '@/lib/readiness-monitor'
import {
  ArrowUpRight,
  AlertTriangle,
  CircleAlert,
  CreditCard,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { Card, MONO_FONT, accentColour } from '@/components/dashboard/ui'
import {
  computeClientNextAction,
  computeConcurrentActions,
  sortNextActions,
  type ClientNextAction,
  type ClientNextActionInput,
} from '@/lib/client-next-action'
import { derivePaymentSignal } from '@/lib/payment-signal'
import { getPlaybook, type RecoveryPlaybookId } from '@/lib/recovery-doctrine'

export default async function TodayWidget() {
  const admin = createAdminClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // ── Batch fetch everything needed to compute the state machine ─────────
  // Single round-trip per table. All Promise.all'd. Joins are done in-memory
  // so we keep the SQL simple and predictable.
  const [
    { data: clients },
    { data: intakes },
    { data: baselines },
    { data: cffsRows },
    { data: trainingPlans },
    { data: progressCheckRows },
    { data: programs },
    { data: archivedProgramsPendingTrajectory },
    { data: nutritionPlans },
    { data: cfwsAll },
    { data: weeklyCheckins },
    { data: feedback },
    { data: subscriptions },
    { data: paymentPlans },
    { data: checkinFeedbackRows },
    { data: recoveryAssignmentRows },
    { data: supplementAssignmentRows },
    { data: recoveryStateRows },
  ] = await Promise.all([
    admin
      .from('clients')
      .select('id, name, coaching_started_at, package')
      .eq('active', true)
      .order('name', { ascending: true }),
    admin.from('intakes').select('client_id'),
    admin.from('baselines').select('client_id'),
    admin
      .from('cffs')
      .select('id, client_id, generated_at, client_reading_published_at, is_archived'),
    admin.from('training_plans').select('client_id'),
    // Progress Checks already raised, so the block-end prompt stops once one
    // has been sent rather than nagging until the reading is generated.
    admin.from('progress_checks').select('program_id, status'),
    admin
      .from('programs')
      .select('id, client_id, block_name, week_duration, generated_at, activated_at, is_active, program_reading_published_at')
      .eq('is_active', true),
    // Archived programs whose block-end trajectory reading was never published.
    // Caller computes "most recent unpublished per client" client-side.
    admin
      .from('programs')
      .select('id, client_id, block_name, week_duration, generated_at')
      .eq('is_active', false)
      .neq('status', 'draft')
      .is('trajectory_reading_published_at', null)
      .order('generated_at', { ascending: false }),
    admin
      .from('nutrition_plans')
      .select('id, client_id, plan_name, is_active, nutrition_reading_published_at, transitional_override_active, transitional_override_floor_kcal, transitional_override_expires_at')
      .eq('is_active', true),
    admin
      .from('cfws')
      .select('client_id, week_number, generated_at, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour, reassessment_language_triggered, is_archived'),
    admin.from('weekly_checkins').select('id, client_id, week_number, form_type, submitted_at, coach_skipped_at, responses'),
    admin
      .from('client_feedback')
      .select('client_id')
      .is('acknowledged_at', null),
    admin
      .from('client_subscriptions')
      .select('client_id, status, amount, currency, billing_interval, current_period_end, canceled_at, created_at')
      .order('created_at', { ascending: false }),
    admin
      .from('client_payment_plan')
      .select('client_id, commencement_fee_paid_at'),
    // Look up which check-ins already have a coach feedback row so we can
    // surface the "respond to check-in" action for the unanswered ones.
    admin
      .from('weekly_checkin_feedback')
      .select('weekly_checkin_id'),
    // Layer 3 prescription surfaces, so Today's Focus can flag a client in a
    // recovery state with nothing assigned to recover with, and a long-steady
    // client who has never had either plan built (2026-08-17).
    admin
      .from('recovery_protocol_assignments')
      .select('client_id')
      .eq('status', 'active'),
    admin
      .from('supplement_assignments')
      .select('client_id')
      .eq('status', 'active'),
    admin
      .from('recovery_states')
      .select('client_id, playbook_id')
      .eq('status', 'active'),
  ])

  if (!clients) {
    return null
  }

  // ── Build lookups by client_id for fast in-memory join ─────────────────
  const intakeIds = new Set((intakes ?? []).map((r) => r.client_id))
  const baselineIds = new Set((baselines ?? []).map((r) => r.client_id))
  const progressChecksByProgram = new Map<string, { status: string }>()
  for (const pc of progressCheckRows ?? []) {
    if (pc.program_id) progressChecksByProgram.set(pc.program_id, { status: pc.status })
  }
  const planIds = new Set((trainingPlans ?? []).map((r) => r.client_id))

  const cffsByClient = new Map<string, NonNullable<typeof cffsRows>>()
  for (const c of cffsRows ?? []) {
    if (c.is_archived) continue
    const list = cffsByClient.get(c.client_id) ?? []
    list.push(c)
    cffsByClient.set(c.client_id, list)
  }

  const programByClient = new Map<string, NonNullable<typeof programs>[number]>()
  for (const p of programs ?? []) programByClient.set(p.client_id, p)

  // Most recent archived program per client whose trajectory reading was
  // never published. The fetch already orders by generated_at desc, so the
  // first hit per client is the freshest unpublished one — leave the rest
  // in case the coach has multiple skipped blocks (rare but possible).
  const pendingTrajectoryByClient = new Map<string, NonNullable<typeof archivedProgramsPendingTrajectory>[number]>()
  for (const p of archivedProgramsPendingTrajectory ?? []) {
    if (!pendingTrajectoryByClient.has(p.client_id)) pendingTrajectoryByClient.set(p.client_id, p)
  }

  const nutritionByClient = new Map<string, NonNullable<typeof nutritionPlans>[number]>()
  for (const n of nutritionPlans ?? []) nutritionByClient.set(n.client_id, n)

  const cfwsByClient = new Map<string, NonNullable<typeof cfwsAll>>()
  for (const c of cfwsAll ?? []) {
    if (c.is_archived) continue
    const list = cfwsByClient.get(c.client_id) ?? []
    list.push(c)
    cfwsByClient.set(c.client_id, list)
  }

  const checkinsByClient = new Map<string, NonNullable<typeof weeklyCheckins>>()
  for (const ci of weeklyCheckins ?? []) {
    const list = checkinsByClient.get(ci.client_id) ?? []
    list.push(ci)
    checkinsByClient.set(ci.client_id, list)
  }

  const feedbackByClient = new Map<string, number>()
  for (const f of feedback ?? []) {
    feedbackByClient.set(f.client_id, (feedbackByClient.get(f.client_id) ?? 0) + 1)
  }

  // Check-ins that already have a coach response. Used to compute the
  // "respond to check-in" Today's Focus action.
  const checkinIdsAnswered = new Set((checkinFeedbackRows ?? []).map(r => r.weekly_checkin_id))

  // ── Layer 3 prescription lookups (2026-08-17) ───────────────────────────
  const recoveryCountByClient = new Map<string, number>()
  for (const r of recoveryAssignmentRows ?? []) {
    recoveryCountByClient.set(r.client_id, (recoveryCountByClient.get(r.client_id) ?? 0) + 1)
  }
  const supplementCountByClient = new Map<string, number>()
  for (const r of supplementAssignmentRows ?? []) {
    supplementCountByClient.set(r.client_id, (supplementCountByClient.get(r.client_id) ?? 0) + 1)
  }
  const recoveryStateByClient = new Map<string, string>()
  for (const r of recoveryStateRows ?? []) {
    recoveryStateByClient.set(r.client_id, getPlaybook(r.playbook_id as RecoveryPlaybookId).name)
  }

  // ── Payments lookup ─────────────────────────────────────────────────────
  // Subscriptions arrive ordered created_at desc. Per client we want the
  // "primary" one (active/trialing first, else the most recent record) — same
  // selection rule as client-payments-section.tsx so signals stay consistent.
  type SubRow = NonNullable<typeof subscriptions>[number]
  const allSubsByClient = new Map<string, SubRow[]>()
  for (const s of subscriptions ?? []) {
    const list = allSubsByClient.get(s.client_id) ?? []
    list.push(s)
    allSubsByClient.set(s.client_id, list)
  }
  const primarySubByClient = new Map<string, SubRow>()
  for (const [cid, list] of allSubsByClient.entries()) {
    const live = list.find((s) => s.status === 'active' || s.status === 'trialing')
    primarySubByClient.set(cid, live ?? list[0])
  }

  const paymentPlanByClient = new Map<string, NonNullable<typeof paymentPlans>[number]>()
  for (const p of paymentPlans ?? []) paymentPlanByClient.set(p.client_id, p)

  // ── For each client, build the snapshot + run the state machine ────────
  const actions: ClientNextAction[] = []
  const concurrent = new Map<string, ClientNextAction[]>()
  for (const client of clients) {
    const clientCffs = (cffsByClient.get(client.id) ?? []).sort(
      (a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
    )
    const latestCffs = clientCffs[0] ?? null
    const activeProgram = programByClient.get(client.id) ?? null
    const activeNutrition = nutritionByClient.get(client.id) ?? null

    const cfwsSorted = (cfwsByClient.get(client.id) ?? []).sort(
      (a, b) => (b.week_number ?? 0) - (a.week_number ?? 0)
    )

    // Readiness only meaningful once coaching has actually begun
    let readiness: ReadinessReport | null = null
    const startDate = client.coaching_started_at ? new Date(client.coaching_started_at) : null
    const hasStarted = startDate ? startDate <= today : false
    if (hasStarted && client.coaching_started_at) {
      readiness = evaluateReadiness({
        cfwsRows: cfwsSorted,
        activeCffs: latestCffs,
        activeProgram,
        client: { coaching_started_at: client.coaching_started_at },
        // RPE creep deliberately omitted at the dashboard widget level. Per-client
        // page already includes it; the widget surfaces the rolled-up readiness
        // status which already folds creep findings on the client profile.
        rpeCreep: null,
      })
    }

    const currentWeekNumber = client.coaching_started_at
      ? getWeekNumber(client.coaching_started_at)
      : 0

    const clientCheckins = checkinsByClient.get(client.id) ?? []
    const thisWeeksCheckinSubmitted = currentWeekNumber > 0
      ? clientCheckins.some((ci) => ci.week_number === currentWeekNumber)
      : false

    // ONLY the latest check-in is considered. Older un-responded check-ins
    // do not generate Today's Focus rows — a per-check-in Skip exists for
    // explicit coach control if needed. Days-since drives the accent
    // (teal up to 2 days old, amber from day 3 on).
    let unansweredCheckin: ClientNextActionInput['unansweredCheckin'] = null
    const latest = [...clientCheckins].sort(
      (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    )[0]
    if (latest && !checkinIdsAnswered.has(latest.id) && !latest.coach_skipped_at) {
      const daysSince = Math.max(
        0,
        Math.floor((today.getTime() - new Date(latest.submitted_at).getTime()) / 86400000)
      )
      unansweredCheckin = {
        weekNumber: latest.week_number,
        formType: latest.form_type as 'A' | 'B',
        submittedAt: latest.submitted_at,
        daysSince,
      }
    }

    const { paymentSignal, paymentDetail } = derivePaymentSignal({
      hasStarted,
      coachingStartedAt: client.coaching_started_at ?? null,
      clientPackage: client.package ?? null,
      primarySub: primarySubByClient.get(client.id) ?? null,
      paymentPlan: paymentPlanByClient.get(client.id) ?? null,
      today,
    })

    const recoveryStateName = recoveryStateByClient.get(client.id) ?? null

    const input: ClientNextActionInput = {
      activeRecoveryProtocolCount: recoveryCountByClient.get(client.id) ?? 0,
      activeSupplementCount: supplementCountByClient.get(client.id) ?? 0,
      activeRecoveryStateName: recoveryStateName,
      clientId: client.id,
      clientName: client.name,
      coachingStartedAt: client.coaching_started_at ?? null,
      hasIntake: intakeIds.has(client.id),
      hasBaseline: baselineIds.has(client.id),
      hasActiveCFFS: !!latestCffs,
      frPublished: !!latestCffs?.client_reading_published_at,
      hasTrainingPlan: planIds.has(client.id),
      activeProgram: activeProgram
        ? {
            id: activeProgram.id,
            blockName: activeProgram.block_name,
            weekDuration: activeProgram.week_duration ?? null,
            generatedAt: activeProgram.generated_at ?? null,
            activatedAt: activeProgram.activated_at ?? null,
            programReadingPublishedAt: activeProgram.program_reading_published_at ?? null,
          }
        : null,
      progressCheckForActiveBlock: activeProgram
        ? progressChecksByProgram.get(activeProgram.id) ?? null
        : null,
      activeNutritionPlan: activeNutrition
        ? {
            id: activeNutrition.id,
            planName: activeNutrition.plan_name,
            nutritionReadingPublishedAt: activeNutrition.nutrition_reading_published_at ?? null,
            transitionalOverrideActive: !!activeNutrition.transitional_override_active,
            transitionalOverrideFloorKcal: activeNutrition.transitional_override_floor_kcal ?? null,
            transitionalOverrideExpiresAt: activeNutrition.transitional_override_expires_at ?? null,
          }
        : null,
      // detectBridgeReadiness needs the MOST RECENT 2 check-ins. The fetch
      // at line 82 doesn't .order() so clientCheckins is in arbitrary DB
      // order — slicing without a sort can hand the function ancient
      // check-ins from the early bridge phase (when the client was
      // struggling), making readiness never fire. Sort desc before slice.
      // Audit finding #6 on 2026-05-25.
      recentCheckinResponsesForBridge: !!activeNutrition?.transitional_override_active
        ? [...clientCheckins]
            .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
            .slice(0, 2)
            .map(c => ({
              week_number: c.week_number,
              submitted_at: c.submitted_at,
              responses: c.responses as Record<string, unknown> ?? {},
            }))
        : undefined,
      readiness,
      unacknowledgedFeedbackCount: feedbackByClient.get(client.id) ?? 0,
      thisWeeksCheckinSubmitted,
      currentWeekNumber,
      unansweredCheckin,
      pendingTrajectoryReading: (() => {
        const p = pendingTrajectoryByClient.get(client.id)
        if (!p) return null
        return {
          programId: p.id,
          blockName: p.block_name,
          generatedAt: p.generated_at ?? null,
          weekDuration: p.week_duration ?? null,
        }
      })(),
      paymentSignal,
      paymentDetail,
    }

    const primary = computeClientNextAction(input)
    actions.push(primary)
    // Everything else still outstanding on this client. The row shows one
    // action; these are the concurrent ones that used to be invisible behind
    // it - a failed payment under an unanswered check-in, a block in its final
    // week under either.
    concurrent.set(input.clientId, computeConcurrentActions(input, primary))
  }

  const sorted = sortNextActions(actions)

  // Headline counts for the header strip
  const awaitingCoach = sorted.filter((a) => a.priority <= 20).length
  const drifting = sorted.filter((a) => a.priority === 30).length
  const totalFeedback = Array.from(feedbackByClient.values()).reduce((s, n) => s + n, 0)
  const paymentIssues = sorted.filter((a) =>
    a.stage === 'payment_past_due' ||
    a.stage === 'payment_unpaid' ||
    a.stage === 'payment_canceled' ||
    a.stage === 'payment_commencement_missing'
  ).length

  return (
    <Card padding="md" className="mb-6" accent="blue">
      {/* Header strip */}
      <div className="flex items-center justify-between mb-4 px-1 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-[3px] rounded-full bg-[#1B6DFC]" />
          <h2
            className="text-[11px] font-medium text-[#141821]"
          >
            Today&apos;s Focus
          </h2>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <SummaryPill
            value={sorted.length}
            label={`active client${sorted.length === 1 ? '' : 's'}`}
          />
          {awaitingCoach > 0 && (
            <SummaryPill
              value={awaitingCoach}
              label={`awaiting you`}
              accent="teal"
            />
          )}
          {drifting > 0 && (
            <SummaryPill
              value={drifting}
              label={`drifting`}
              accent="amber"
            />
          )}
          {paymentIssues > 0 && (
            <SummaryPill
              value={paymentIssues}
              label={`payment issue${paymentIssues === 1 ? '' : 's'}`}
              accent="red"
              icon={<CreditCard size={10} />}
            />
          )}
          {totalFeedback > 0 && (
            <SummaryPill
              value={totalFeedback}
              label={`new feedback`}
              accent="teal"
              icon={<MessageSquare size={10} />}
            />
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyStateBlock />
      ) : (
        <div className="divide-y divide-[#EFF1F4]">
          {sorted.map((action, i) => (
            <ActionRow key={action.clientId} action={action} index={i} also={concurrent.get(action.clientId) ?? []} />
          ))}
        </div>
      )}
    </Card>
  )
}

/* ───────────────────────────────────────────────────────────────────────── */

function SummaryPill({
  value,
  label,
  accent = 'neutral',
  icon,
}: {
  value: number
  label: string
  accent?: 'teal' | 'amber' | 'red' | 'neutral'
  icon?: React.ReactNode
}) {
  const a = accentColour(accent)
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border"
      style={{
        fontFamily: MONO_FONT,
        letterSpacing: '0.08em',
        color: a.text,
        background: a.bg,
        borderColor: a.ring,
      }}
    >
      {icon}
      <span className="font-bold">{value}</span>
      <span>{label}</span>
    </span>
  )
}

function ActionRow({
  action,
  index,
  also,
}: {
  action: ClientNextAction
  index: number
  /** Other work outstanding on the same client, shown under the headline. */
  also: ClientNextAction[]
}) {
  const a = accentColour(action.accent)
  const Icon = iconFor(action)
  const row = (
    <Link
      href={action.href}
      className="flex items-center gap-3.5 px-1 py-3.5 group hover:bg-[#EFF1F4]/40 -mx-1 px-2 rounded-lg transition-colors"
    >
      <span
        className="text-[11px] font-medium tabular-nums text-[#98A0AD] group-hover:text-[#1B6DFC] transition-colors shrink-0 w-6 text-right"
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
        style={{ background: a.bg, borderColor: a.ring }}
      >
        <Icon size={16} style={{ color: a.text }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13px] font-bold text-[#141821] group-hover:text-[#1B6DFC] transition-colors truncate">
            {action.clientName}
          </p>
          {action.badge && (
            <span
              className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-full border border-[#B5CFFC] bg-[rgba(27,109,252,0.08)] text-[#1B6DFC]"
            >
              {action.badge}
            </span>
          )}
        </div>
        <p
          className="text-[13px] mt-0.5 truncate"
          style={{ color: a.text }}
        >
          {action.headline}
        </p>
        {action.sublabel && (
          <p
            className="text-[10px] text-[#98A0AD] mt-0.5 truncate"
          >
            {action.sublabel}
          </p>
        )}
      </div>
      <ArrowUpRight
        size={16}
        className="text-[#98A0AD] group-hover:text-[#1B6DFC] transition-colors shrink-0"
      />
    </Link>
  )

  if (also.length === 0) return row

  return (
    <div>
      {row}
      <div className="flex flex-wrap gap-1.5 pl-[68px] pb-3 -mt-1">
        {also.map(extra => {
          const ea = accentColour(extra.accent)
          const EIcon = iconFor(extra)
          return (
            <Link
              key={extra.stage}
              href={extra.href}
              title={extra.sublabel ?? undefined}
              className="inline-flex items-center gap-1.5 text-[11px] px-2 py-[3px] rounded-full border transition-colors hover:brightness-95"
              style={{ background: ea.bg, borderColor: ea.ring, color: ea.text }}
            >
              <EIcon size={11} />
              {extra.headline}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function iconFor(action: ClientNextAction) {
  switch (action.stage) {
    case 'active_regression':
    case 'active_checkin_overdue':
    case 'active_bridge_expired':
      return CircleAlert
    case 'active_reassessment':
    case 'active_drift':
    case 'active_bridge_expiring':
      return AlertTriangle
    case 'active_bridge_ready_step_up':
      return Sparkles
    case 'payment_past_due':
    case 'payment_unpaid':
    case 'payment_canceled':
    case 'payment_commencement_missing':
      return CreditCard
    default:
      return Sparkles
  }
}

function EmptyStateBlock() {
  return (
    <div className="py-8 text-center">
      <p className="text-[14px] text-[#666D7A] mb-1">No active clients yet</p>
      <p className="text-[12px] text-[#98A0AD]">
        Per-client focus board will populate as clients onboard.
      </p>
    </div>
  )
}
