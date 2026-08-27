/**
 * Roster next-actions — the cross-client "what to do next" computation.
 *
 * Powers the co-pilot's practice-wide awareness (Phase 4). It runs the SAME
 * per-client state machine (src/lib/client-next-action.ts) the Today's Focus
 * board uses, so the co-pilot's "who needs attention" matches the board.
 *
 * NOTE (tech debt): the fetch + snapshot assembly below MIRRORS the inline copy
 * in src/app/dashboard/today.tsx. They were left as two copies deliberately —
 * refactoring the live dashboard page was out of scope for this change. If you
 * touch one, touch both, and reconcile into this single function when the
 * dashboard can be re-verified end to end.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import { evaluateReadiness, type ReadinessReport } from '@/lib/readiness-monitor'
import {
  computeClientNextAction,
  sortNextActions,
  type ClientNextAction,
  type ClientNextActionInput,
} from '@/lib/client-next-action'
import { derivePaymentSignal } from '@/lib/payment-signal'
import { getPlaybook, type RecoveryPlaybookId } from '@/lib/recovery-doctrine'

export interface RosterNextActions {
  actions: ClientNextAction[]
  totalFeedback: number
}

export async function computeRosterNextActions(admin: SupabaseClient): Promise<RosterNextActions> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

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
    admin
      .from('weekly_checkin_feedback')
      .select('weekly_checkin_id'),
    // Layer 3 prescription surfaces (2026-08-17). Mirrors today.tsx.
    admin.from('recovery_protocol_assignments').select('client_id').eq('status', 'active'),
    admin.from('supplement_assignments').select('client_id').eq('status', 'active'),
    admin.from('recovery_states').select('client_id, playbook_id').eq('status', 'active'),
  ])

  if (!clients) return { actions: [], totalFeedback: 0 }

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

  const checkinIdsAnswered = new Set((checkinFeedbackRows ?? []).map(r => r.weekly_checkin_id))

  // ── Layer 3 prescription lookups (2026-08-17). Mirrors today.tsx. ───────
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

    let readiness: ReadinessReport | null = null
    const startDate = client.coaching_started_at ? new Date(client.coaching_started_at) : null
    const hasStarted = startDate ? startDate <= today : false
    if (hasStarted && client.coaching_started_at) {
      readiness = evaluateReadiness({
        cfwsRows: cfwsSorted,
        activeCffs: latestCffs,
        activeProgram,
        client: { coaching_started_at: client.coaching_started_at },
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

    const input: ClientNextActionInput = {
      activeRecoveryProtocolCount: recoveryCountByClient.get(client.id) ?? 0,
      activeSupplementCount: supplementCountByClient.get(client.id) ?? 0,
      activeRecoveryStateName: recoveryStateByClient.get(client.id) ?? null,
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

    actions.push(computeClientNextAction(input))
  }

  const totalFeedback = Array.from(feedbackByClient.values()).reduce((s, n) => s + n, 0)
  return { actions: sortNextActions(actions), totalFeedback }
}
