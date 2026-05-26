/**
 * Per-client "what to do next" state machine.
 *
 * Given a snapshot of one client's onboarding artefacts (intake, baseline,
 * CFFS, FR publish state, training plan, active program, PR publish state,
 * nutrition plan, NR publish state) plus their readiness report and any
 * unacknowledged feedback, compute the single most-relevant next action.
 *
 * Drives the Today's Focus widget on the coach dashboard so coaches can
 * scan-glance who needs attention without opening each client profile.
 *
 * Architectural note: this helper is intentionally synchronous and takes
 * pre-fetched data. The Today's Focus widget batches all queries up-front
 * with Promise.all rather than running N async helpers in series.
 */

import type { ReadinessReport } from './readiness-monitor'

/* ──────────────────────────────────────────────────────────────────────────
 * Input snapshot — what we need to know about ONE client
 * ────────────────────────────────────────────────────────────────────────── */

export interface ClientNextActionInput {
  clientId: string
  clientName: string
  coachingStartedAt: string | null

  /** Has the client submitted their foundational intake? */
  hasIntake: boolean
  /** Has the client submitted their baseline (measurements + photos)? */
  hasBaseline: boolean

  /** Is there an active (non-archived) CFFS row? */
  hasActiveCFFS: boolean
  /** Has the FR been published on the active CFFS? */
  frPublished: boolean

  /** Is there a training plan (macro arc) row for this client? */
  hasTrainingPlan: boolean

  /** The active program row, if any. */
  activeProgram: {
    id: string
    blockName: string
    weekDuration: number | null
    generatedAt: string | null
    programReadingPublishedAt: string | null
  } | null

  /** The active nutrition_plans row, if any. */
  activeNutritionPlan: {
    id: string
    planName: string
    nutritionReadingPublishedAt: string | null
    // Bridge mode metadata. When transitionalOverrideActive is true and the
    // plan is still in its bridge window, the state machine surfaces an
    // action card before / on / after expiry.
    transitionalOverrideActive: boolean
    transitionalOverrideFloorKcal: number | null
    transitionalOverrideExpiresAt: string | null
  } | null

  /**
   * Latest 2 weekly check-ins, used to detect readiness-to-step-up signals
   * during bridge mode. State machine scans the response blobs for
   * eating-consistency markers (appetite improving, hitting protein,
   * meal-prep on track). Caller fetches.
   */
  recentCheckinResponsesForBridge?: Array<{
    week_number: number
    submitted_at: string
    responses: Record<string, unknown>
  }>;

  /** Optional readiness report from evaluateReadiness(). Overlays the stage. */
  readiness?: ReadinessReport | null

  /** Number of unacknowledged client_feedback rows. */
  unacknowledgedFeedbackCount: number

  /** Whether the current week's check-in has been submitted (computed by caller). */
  thisWeeksCheckinSubmitted: boolean
  /** The current coaching week number (1-indexed), or 0 if not yet started. */
  currentWeekNumber: number

  /**
   * Latest check-in submitted by this client that has no coach feedback row
   * yet. When set, Today's Focus surfaces a "respond to check-in" action so
   * coach feedback doesn't slip through the cracks. Caller computes by
   * left-joining weekly_checkins → weekly_checkin_feedback and picking the
   * most recent unanswered one.
   */
  unansweredCheckin: {
    weekNumber: number
    formType: 'A' | 'B'
    submittedAt: string
    daysSince: number
  } | null

  /**
   * Payment signal from the Client Payment Tracker.
   *
   *   past_due / unpaid     → Stripe subscription is currently broken (red, p10)
   *   canceled              → primary subscription canceled while client still active (red, p10)
   *   commencement_missing  → on a plan, coaching has started, $240 commencement not received (amber, p20)
   *
   * Null means either no flagged signal or the client is exempt (no
   * client_payment_plan + no client_subscriptions row — e.g. contra deals).
   */
  paymentSignal: PaymentSignal | null
  /** Short context line for the payment signal. e.g. "Past due since 8 May". */
  paymentDetail: string | null
}

export type PaymentSignal =
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'commencement_missing'

/* ──────────────────────────────────────────────────────────────────────────
 * Output — one structured action per client
 * ────────────────────────────────────────────────────────────────────────── */

export type NextActionStage =
  | 'waiting_intake'
  | 'waiting_baseline'
  | 'waiting_cffs'
  | 'waiting_fr'
  | 'waiting_training_plan'
  | 'waiting_program'
  | 'waiting_pr'
  | 'waiting_nutrition'
  | 'waiting_nr'
  | 'payment_past_due'
  | 'payment_unpaid'
  | 'payment_canceled'
  | 'payment_commencement_missing'
  | 'active_regression'
  | 'active_reassessment'
  | 'active_checkin_overdue'
  | 'active_checkin_feedback_pending'
  | 'active_drift'
  | 'active_bridge_expiring'         // bridge mode plan within 7 days of expiry
  | 'active_bridge_expired'          // bridge mode plan past its expiry date
  | 'active_bridge_ready_step_up'    // bridge mode + check-in signals suggest readiness to ramp
  | 'active_steady'
  | 'pre_start'

export type NextActionAccent = 'teal' | 'amber' | 'red' | 'neutral'

/**
 * Priority controls sort order in Today's Focus.
 *  10 = critical, top of list (regression / overdue / blocked-on-coach)
 *  20 = high (action-required by coach)
 *  30 = medium (drift advisory, feedback notes)
 *  40 = low (steady state)
 *  50 = pre-start (countdown only)
 */
export type NextActionPriority = 10 | 20 | 30 | 40 | 50

export interface ClientNextAction {
  clientId: string
  clientName: string
  stage: NextActionStage
  /** Short label rendered as the primary action. e.g. "Generate CFFS" */
  headline: string
  /** Optional secondary line for context. e.g. "Block 1 · Week 2 of 4" */
  sublabel: string | null
  /** Where the Open Profile link goes (defaults to client profile). */
  href: string
  accent: NextActionAccent
  priority: NextActionPriority
  /** Optional badge shown to the side of the action. e.g. "3 feedback" */
  badge: string | null
}

/* ──────────────────────────────────────────────────────────────────────────
 * The state machine
 * ────────────────────────────────────────────────────────────────────────── */

export function computeClientNextAction(input: ClientNextActionInput): ClientNextAction {
  const profileHref = `/dashboard/clients/${input.clientId}`

  // Feedback badge overlay (independent of stage)
  const feedbackBadge =
    input.unacknowledgedFeedbackCount > 0
      ? `${input.unacknowledgedFeedbackCount} feedback`
      : null

  // ── Pre-start: client signed up but coaching_started_at in future ──────
  // We still surface their onboarding-stage progress, but flag it as pre-start
  // so the widget can render it less urgently.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = input.coachingStartedAt ? new Date(input.coachingStartedAt) : null
  const isPreStart = startDate ? startDate > today : false

  // ── Stage 1: waiting on intake ─────────────────────────────────────────
  if (!input.hasIntake) {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'waiting_intake',
      headline: 'Waiting on intake form',
      sublabel: 'Client to complete the foundational intake',
      href: profileHref,
      accent: 'neutral',
      priority: 50,
      badge: feedbackBadge,
    }
  }

  // ── Stage 2: waiting on baseline ───────────────────────────────────────
  if (!input.hasBaseline) {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'waiting_baseline',
      headline: 'Waiting on baseline submission',
      sublabel: 'Client to upload measurements and progress photos',
      href: profileHref,
      accent: 'neutral',
      priority: 50,
      badge: feedbackBadge,
    }
  }

  // ── Stage 3: both forms in, no CFFS ────────────────────────────────────
  if (!input.hasActiveCFFS) {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'waiting_cffs',
      headline: 'Generate CFFS',
      sublabel: 'Onboarding complete - ready for synthesis',
      href: `${profileHref}#cffs`,
      accent: 'teal',
      priority: 20,
      badge: feedbackBadge,
    }
  }

  // ── Stage 4: CFFS exists, FR not published ─────────────────────────────
  if (!input.frPublished) {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'waiting_fr',
      headline: 'Publish Foundational Reading',
      sublabel: 'CFFS is generated - client is waiting on their reading',
      href: `${profileHref}#cffs`,
      accent: 'teal',
      priority: 20,
      badge: feedbackBadge,
    }
  }

  // ── Stage 5: FR published, no training plan (macro arc) ────────────────
  if (!input.hasTrainingPlan) {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'waiting_training_plan',
      headline: 'Build Macro Arc',
      sublabel: 'No training plan yet - design the multi-block arc',
      href: `${profileHref}/program`,
      accent: 'teal',
      priority: 20,
      badge: feedbackBadge,
    }
  }

  // ── Stage 6: training plan exists, no active program ───────────────────
  if (!input.activeProgram) {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'waiting_program',
      headline: 'Generate first program',
      sublabel: 'Macro arc is in - generate the first block',
      href: `${profileHref}/program`,
      accent: 'teal',
      priority: 20,
      badge: feedbackBadge,
    }
  }

  const ap = input.activeProgram

  // ── Stage 7: active program, no PR published ───────────────────────────
  if (!ap.programReadingPublishedAt) {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'waiting_pr',
      headline: 'Publish Program Reading',
      sublabel: `${ap.blockName} is live - publish the why before the what`,
      href: `${profileHref}/program`,
      accent: 'teal',
      priority: 20,
      badge: feedbackBadge,
    }
  }

  // ── Stage 8: active program, no active nutrition plan ──────────────────
  if (!input.activeNutritionPlan) {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'waiting_nutrition',
      headline: 'Generate nutrition plan',
      sublabel: 'Program is live but no nutrition plan attached yet',
      href: `${profileHref}/nutrition`,
      accent: 'teal',
      priority: 20,
      badge: feedbackBadge,
    }
  }

  const np = input.activeNutritionPlan

  // ── Stage 9: nutrition plan exists, no NR published ────────────────────
  if (!np.nutritionReadingPublishedAt) {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'waiting_nr',
      headline: 'Publish Nutrition Reading',
      sublabel: `${np.planName} is live - publish the why behind the meals`,
      href: `${profileHref}/nutrition`,
      accent: 'teal',
      priority: 20,
      badge: feedbackBadge,
    }
  }

  // ── Payments overlay ───────────────────────────────────────────────────
  // Money problems preempt readiness signals: if the client isn't paying you
  // (or the system says they should be but the subscription is broken),
  // nothing else on the board matters until it's resolved.

  if (input.paymentSignal === 'past_due') {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'payment_past_due',
      headline: 'Subscription past due',
      sublabel: input.paymentDetail ?? 'Stripe shows the recurring charge as past due',
      href: `${profileHref}#payments`,
      accent: 'red',
      priority: 10,
      badge: feedbackBadge,
    }
  }

  if (input.paymentSignal === 'unpaid') {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'payment_unpaid',
      headline: 'Subscription unpaid',
      sublabel: input.paymentDetail ?? 'Stripe has stopped retrying - client action required',
      href: `${profileHref}#payments`,
      accent: 'red',
      priority: 10,
      badge: feedbackBadge,
    }
  }

  if (input.paymentSignal === 'canceled') {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'payment_canceled',
      headline: 'Subscription canceled',
      sublabel: input.paymentDetail ?? 'Client is active but the recurring sub is no longer billing',
      href: `${profileHref}#payments`,
      accent: 'red',
      priority: 10,
      badge: feedbackBadge,
    }
  }

  if (input.paymentSignal === 'commencement_missing') {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'payment_commencement_missing',
      headline: 'Commencement fee outstanding',
      sublabel: input.paymentDetail ?? 'On a plan, coaching has started, $240 fee not received',
      href: `${profileHref}#payments`,
      accent: 'amber',
      priority: 20,
      badge: feedbackBadge,
    }
  }

  // ── Active client paths ────────────────────────────────────────────────
  // Everything is in place. Now overlay readiness signals.

  // Readiness regression (Signal Monitoring v1.0 - red status)
  if (input.readiness?.status === 'regression') {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'active_regression',
      headline: 'Active regression - coach review required',
      sublabel: input.readiness.drift[0]?.message ?? 'Multiple signals trending down',
      href: `${profileHref}#readiness`,
      accent: 'red',
      priority: 10,
      badge: feedbackBadge,
    }
  }

  // Readiness reassessment recommended (amber)
  if (input.readiness?.status === 'reassessment') {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'active_reassessment',
      headline: 'CFFS reassessment recommended',
      sublabel: input.readiness.reassessmentReasons[0]?.message ?? 'Signal pattern warrants reassessment',
      href: `${profileHref}#readiness`,
      accent: 'amber',
      priority: 10,
      badge: feedbackBadge,
    }
  }

  // Check-in overdue
  // Gate on the active program's age, not just coaching_started_at. The
  // check-in evaluates the training program, so a program generated less
  // than a week ago hasn't had a Fri-Sun check-in window fully elapse
  // since it went live — there's no realistic missed window yet. This
  // catches the "I just made their program but coaching_started_at was
  // weeks ago" case (Amanda, Ruby-Cate) where the old logic flagged red
  // for a check-in the client physically couldn't have done.
  const programGeneratedAt = ap.generatedAt
  const programAgeDays = programGeneratedAt
    ? Math.floor(
        (today.getTime() - new Date(programGeneratedAt).getTime()) / 86400000
      )
    : 0

  if (
    !isPreStart &&
    input.currentWeekNumber > 0 &&
    programAgeDays >= 7 &&
    !input.thisWeeksCheckinSubmitted
  ) {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'active_checkin_overdue',
      headline: `Check-in overdue (week ${input.currentWeekNumber})`,
      sublabel: 'This week\'s weekly check-in has not been submitted yet',
      href: profileHref,
      accent: 'red',
      priority: 10,
      badge: feedbackBadge,
    }
  }

  // Coach feedback pending on the latest check-in. Surfaces after the more
  // urgent regression/reassessment/overdue states so a missing response
  // doesn't preempt a structural issue, but before drift advisory because
  // responding to the client IS the action that addresses early drift.
  if (input.unansweredCheckin) {
    const u = input.unansweredCheckin
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'active_checkin_feedback_pending',
      headline: `Respond to Week ${u.weekNumber} Form ${u.formType} check-in`,
      sublabel:
        u.daysSince <= 0
          ? 'Submitted today - send your read'
          : `Submitted ${u.daysSince} day${u.daysSince === 1 ? '' : 's'} ago - send your read`,
      href: `${profileHref}/checkins/${u.weekNumber}/${u.formType.toLowerCase()}`,
      accent: u.daysSince >= 3 ? 'amber' : 'teal',
      priority: 20,
      badge: feedbackBadge,
    }
  }

  // ── Bridge mode lifecycle ──────────────────────────────────────────────
  // When a nutrition plan has transitional_override active, surface the
  // bridge state before drift / steady so the coach is prompted to step
  // up (or extend) the bridge before it silently lapses.
  const anp = input.activeNutritionPlan
  if (anp?.transitionalOverrideActive && anp.transitionalOverrideExpiresAt) {
    const expiry = new Date(anp.transitionalOverrideExpiresAt)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / 86400000)

    if (daysUntilExpiry < 0) {
      // Past expiry — bridge has lapsed but no regen happened. Critical.
      return {
        clientId: input.clientId,
        clientName: input.clientName,
        stage: 'active_bridge_expired',
        headline: `Bridge plan expired ${-daysUntilExpiry} day${daysUntilExpiry === -1 ? '' : 's'} ago`,
        sublabel: `Regenerate nutrition to step up from ${anp.transitionalOverrideFloorKcal} kcal floor`,
        href: `${profileHref}/nutrition/suggest`,
        accent: 'red',
        priority: 20,
        badge: feedbackBadge,
      }
    }

    // Scan recent check-in responses for eating-consistency markers. If
    // both of the latest 2 check-ins suggest readiness, surface a
    // step-up prompt regardless of the expiry timer.
    const readinessSignal = detectBridgeReadiness(input.recentCheckinResponsesForBridge ?? [])
    if (readinessSignal.ready) {
      return {
        clientId: input.clientId,
        clientName: input.clientName,
        stage: 'active_bridge_ready_step_up',
        headline: 'Bridge plan: ready to step up',
        sublabel: readinessSignal.reason,
        href: `${profileHref}/nutrition/suggest`,
        accent: 'teal',
        priority: 20,
        badge: feedbackBadge,
      }
    }

    if (daysUntilExpiry <= 7) {
      return {
        clientId: input.clientId,
        clientName: input.clientName,
        stage: 'active_bridge_expiring',
        headline: `Bridge plan expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
        sublabel: `Floor ${anp.transitionalOverrideFloorKcal} kcal. Review check-ins and regenerate to step up.`,
        href: `${profileHref}/nutrition`,
        accent: 'amber',
        priority: 30,
        badge: feedbackBadge,
      }
    }
  }

  // Drift advisory (grey)
  if (input.readiness?.status === 'advisory') {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'active_drift',
      headline: 'Drift advisory',
      sublabel: input.readiness.drift[0]?.message ?? 'Watch this week for further movement',
      href: `${profileHref}#readiness`,
      accent: 'amber',
      priority: 30,
      badge: feedbackBadge,
    }
  }

  // Pre-start fallback (everything's ready but coaching hasn't begun)
  if (isPreStart && startDate) {
    const days = Math.max(0, Math.round((startDate.getTime() - today.getTime()) / 86400000))
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'pre_start',
      headline:
        days === 0 ? 'Starts today' : `Starts in ${days} day${days === 1 ? '' : 's'}`,
      sublabel: 'All readings published - pre-start window',
      href: profileHref,
      accent: 'neutral',
      priority: 50,
      badge: feedbackBadge,
    }
  }

  // ── Steady state ───────────────────────────────────────────────────────
  // Active client, all artefacts published, no readiness flags, check-in done.
  // BlockStatus uses overall coaching week + block start week, so compute
  // week-within-block here.
  const block = input.readiness?.block
  let weekLabel: string = ap.blockName
  if (block && block.currentWeek != null && block.blockStartWeek != null && block.weekDuration != null) {
    const weekInBlock = block.currentWeek - block.blockStartWeek + 1
    if (weekInBlock >= 1 && weekInBlock <= block.weekDuration) {
      weekLabel = `${ap.blockName} · Week ${weekInBlock} of ${block.weekDuration}`
    }
  }

  return {
    clientId: input.clientId,
    clientName: input.clientName,
    stage: 'active_steady',
    headline: 'Steady - on track',
    sublabel: weekLabel,
    href: profileHref,
    accent: 'neutral',
    priority: 40,
    badge: feedbackBadge,
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Bridge mode readiness detection
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Scans recent weekly check-in response blobs for eating-consistency
 * markers that suggest the client is ready to step up their bridge floor
 * toward the full bodyweight-derived target. Conservative — requires at
 * least 2 check-ins and explicit positive language from the client.
 *
 * Markers (positive — suggest readiness):
 *   - meal timing / prep on track
 *   - appetite stabilising or returning
 *   - hitting protein goals
 *   - eating consistently
 *   - no longer "caught on the hop"
 *
 * Anti-markers (negative — suggest NOT ready, keep bridge):
 *   - still struggling with appetite
 *   - skipping meals
 *   - difficulty hitting protein
 *   - inconsistent eating
 *
 * If anti-markers fire, readiness is false regardless of positives.
 */
export function detectBridgeReadiness(
  recentCheckins: Array<{
    week_number: number
    submitted_at: string
    responses: Record<string, unknown>
  }>
): { ready: boolean; reason: string } {
  if (recentCheckins.length < 1) {
    return { ready: false, reason: 'No recent check-ins to assess' }
  }

  const positiveMarkers = [
    /meal\s*prep.*(on track|consistent|good|hitting|done|sorted)/i,
    /hitting\s*(my\s*)?protein/i,
    /(appetite|hunger).*(back|returning|improving|better|stable|stabili[sz]ing)/i,
    /eating.*(more\s*)?consistent(ly)?/i,
    /(getting|got)\s*meals\s*in/i,
    /protein\s*(goals?\s*)?(hit|on track)/i,
    /no longer.*(caught|skipping|struggling)/i,
  ]

  const negativeMarkers = [
    /still\s*(finding|struggling|hard|difficult)/i,
    /skipping\s*meals/i,
    /caught\s*on\s*the\s*hop/i,
    /(can('|no)t|cannot)\s*(eat|finish)/i,
    /appetite\s*(suppressed|low|gone|down|terrible)/i,
    /hard\s*to\s*hit\s*protein/i,
    /(not|haven'?t)\s*been\s*eating/i,
  ]

  let positiveHits = 0
  let negativeHits = 0
  const reasons: string[] = []

  for (const checkin of recentCheckins.slice(0, 2)) {
    for (const [, value] of Object.entries(checkin.responses ?? {})) {
      if (typeof value !== 'string' || value.trim().length === 0) continue
      const text = value
      for (const m of negativeMarkers) {
        if (m.test(text)) {
          negativeHits++
          break // one negative per response is enough
        }
      }
      for (const m of positiveMarkers) {
        if (m.test(text)) {
          positiveHits++
          if (reasons.length < 2 && text.length < 200) reasons.push(`Week ${checkin.week_number}: "${text}"`)
          break
        }
      }
    }
  }

  // Conservative: any negative marker keeps the bridge active.
  if (negativeHits > 0) {
    return { ready: false, reason: `Client still reports eating struggles in recent check-ins (${negativeHits} signals) — keep bridge active.` }
  }
  // Need at least 2 positive hits across the recent check-ins to be confident.
  if (positiveHits >= 2) {
    return {
      ready: true,
      reason: reasons.length > 0
        ? `Check-in signals: ${reasons[0].slice(0, 120)}${reasons[0].length > 120 ? '...' : ''}`
        : `${positiveHits} positive eating-consistency markers in recent check-ins`,
    }
  }
  return { ready: false, reason: 'Not enough positive readiness signals in recent check-ins yet' }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers for sorting
 * ────────────────────────────────────────────────────────────────────────── */

export function sortNextActions(actions: ClientNextAction[]): ClientNextAction[] {
  // Priority asc (10 first), then alphabetical by client name as tiebreaker.
  return [...actions].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return a.clientName.localeCompare(b.clientName)
  })
}
