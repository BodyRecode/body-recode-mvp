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
  sortNextActions,
  type ClientNextAction,
  type ClientNextActionInput,
} from '@/lib/client-next-action'
import { derivePaymentSignal } from '@/lib/payment-signal'

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
    { data: programs },
    { data: nutritionPlans },
    { data: cfwsAll },
    { data: weeklyCheckins },
    { data: feedback },
    { data: subscriptions },
    { data: paymentPlans },
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
    admin
      .from('programs')
      .select('id, client_id, block_name, week_duration, generated_at, is_active, program_reading_published_at')
      .eq('is_active', true),
    admin
      .from('nutrition_plans')
      .select('id, client_id, plan_name, is_active, nutrition_reading_published_at')
      .eq('is_active', true),
    admin
      .from('cfws')
      .select('client_id, week_number, generated_at, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour, reassessment_language_triggered, is_archived'),
    admin.from('weekly_checkins').select('client_id, week_number, submitted_at'),
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
  ])

  if (!clients) {
    return null
  }

  // ── Build lookups by client_id for fast in-memory join ─────────────────
  const intakeIds = new Set((intakes ?? []).map((r) => r.client_id))
  const baselineIds = new Set((baselines ?? []).map((r) => r.client_id))
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

    const { paymentSignal, paymentDetail } = derivePaymentSignal({
      hasStarted,
      coachingStartedAt: client.coaching_started_at ?? null,
      clientPackage: client.package ?? null,
      primarySub: primarySubByClient.get(client.id) ?? null,
      paymentPlan: paymentPlanByClient.get(client.id) ?? null,
      today,
    })

    const input: ClientNextActionInput = {
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
            programReadingPublishedAt: activeProgram.program_reading_published_at ?? null,
          }
        : null,
      activeNutritionPlan: activeNutrition
        ? {
            id: activeNutrition.id,
            planName: activeNutrition.plan_name,
            nutritionReadingPublishedAt: activeNutrition.nutrition_reading_published_at ?? null,
          }
        : null,
      readiness,
      unacknowledgedFeedbackCount: feedbackByClient.get(client.id) ?? 0,
      thisWeeksCheckinSubmitted,
      currentWeekNumber,
      paymentSignal,
      paymentDetail,
    }

    actions.push(computeClientNextAction(input))
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
    <Card padding="md" className="mb-6">
      {/* Header strip */}
      <div className="flex items-center justify-between mb-4 px-1 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-[3px] rounded-full bg-[#14b8a6]" />
          <h2
            className="text-[11px] font-bold text-white uppercase"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
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
        <div className="divide-y divide-[#1c1917]">
          {sorted.map((action) => (
            <ActionRow key={action.clientId} action={action} />
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
      className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border uppercase"
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

function ActionRow({ action }: { action: ClientNextAction }) {
  const a = accentColour(action.accent)
  const Icon = iconFor(action)
  return (
    <Link
      href={action.href}
      className="flex items-center gap-3.5 px-1 py-3.5 group hover:bg-[#1c1917]/40 -mx-1 px-2 rounded-lg transition-colors"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
        style={{ background: a.bg, borderColor: a.ring }}
      >
        <Icon size={16} style={{ color: a.text }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13px] font-bold text-white group-hover:text-[#14b8a6] transition-colors truncate">
            {action.clientName}
          </p>
          {action.badge && (
            <span
              className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-full border border-[#0d2d29] bg-[rgba(20,184,166,0.10)] text-[#14b8a6] uppercase"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
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
            className="text-[10px] text-[#57534e] uppercase mt-0.5 truncate"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.1em' }}
          >
            {action.sublabel}
          </p>
        )}
      </div>
      <ArrowUpRight
        size={16}
        className="text-[#57534e] group-hover:text-[#14b8a6] transition-colors shrink-0"
      />
    </Link>
  )
}

function iconFor(action: ClientNextAction) {
  switch (action.stage) {
    case 'active_regression':
    case 'active_checkin_overdue':
      return CircleAlert
    case 'active_reassessment':
    case 'active_drift':
      return AlertTriangle
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
      <p className="text-[14px] text-[#a8a29e] mb-1">No active clients yet</p>
      <p className="text-[12px] text-[#57534e]">
        Per-client focus board will populate as clients onboard.
      </p>
    </div>
  )
}
