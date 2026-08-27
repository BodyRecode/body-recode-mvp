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

  /**
   * A Progress Check already raised against the ACTIVE program, if any. Used
   * to stop the block-end prompt nagging once one has been sent.
   */
  progressCheckForActiveBlock: { status: string } | null

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
  /**
   * The most-recently archived program for this client that has not yet had
   * its trajectory reading published. Surfaces a "generate block-end reading"
   * action in Today's Focus so the artefact doesn't get skipped when the
   * coach has already moved on to the next block. Caller computes by
   * left-joining archived programs against trajectory_reading_published_at
   * IS NULL.
   */
  pendingTrajectoryReading: {
    programId: string
    blockName: string
    generatedAt: string | null
    weekDuration: number | null
  } | null

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
   *   commencement_missing  → on a plan, coaching has started, $297 commencement not received (amber, p20)
   *
   * Null means either no flagged signal or the client is exempt (no
   * client_payment_plan + no client_subscriptions row — e.g. contra deals).
   */
  paymentSignal: PaymentSignal | null
  /** Short context line for the payment signal. e.g. "Past due since 8 May". */
  paymentDetail: string | null

  /**
   * Layer 3 prescription surfaces (added 2026-08-17).
   *
   * Both libraries went live 21 July and sat at zero assignments across every
   * client for four weeks, because nothing ever told the coach to open them.
   * These two counts plus the active recovery state let Today's Focus say so.
   *
   * Callers that don't fetch them can leave the counts at 0 and the state
   * null: the "no plan yet" nudge only fires for clients who are otherwise
   * steady and well past onboarding, so a missing count degrades to silence
   * rather than a false prompt.
   */
  activeRecoveryProtocolCount: number
  activeSupplementCount: number
  /** Display name of the active RRS playbook, if the client is in one. */
  activeRecoveryStateName: string | null
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
  | 'block_end_progress_check_due'
  | 'active_trajectory_reading_pending'
  | 'active_drift'
  | 'active_recovery_no_protocols'    // in an RRS state with nothing assigned to help
  | 'active_layer3_unset'             // steady, but no recovery or supplement plan ever built
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

  // Persistent metadata badges (independent of stage). When bridge mode is
  // active, the expiry countdown is always shown so coaches can see at a
  // glance which clients are on transitional plans and when they need
  // attention — even if the bridge isn't yet the most urgent action.
  let bridgeBadge: string | null = null
  if (input.activeNutritionPlan?.transitionalOverrideActive && input.activeNutritionPlan.transitionalOverrideExpiresAt) {
    const expiry = new Date(input.activeNutritionPlan.transitionalOverrideExpiresAt)
    const now = new Date()
    const days = Math.ceil((expiry.getTime() - now.getTime()) / 86400000)
    if (days < 0) bridgeBadge = `Bridge expired ${-days}d`
    else if (days === 0) bridgeBadge = 'Bridge expires today'
    else bridgeBadge = `Bridge ${days}d`
  }
  const feedbackBadge =
    input.unacknowledgedFeedbackCount > 0
      ? `${input.unacknowledgedFeedbackCount} feedback`
      : null
  // Compose: bridge badge first when present (always-visible signal), then
  // feedback badge if any. Both show separately in the UI via the badge
  // field convention — joined by middle-dot for the single-badge slot.
  const composedBadge =
    bridgeBadge && feedbackBadge ? `${bridgeBadge} · ${feedbackBadge}` :
    bridgeBadge ?? feedbackBadge

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
      badge: composedBadge,
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
      badge: composedBadge,
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
      badge: composedBadge,
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
      badge: composedBadge,
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
      badge: composedBadge,
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
      badge: composedBadge,
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
      badge: composedBadge,
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
      badge: composedBadge,
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
      badge: composedBadge,
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
      badge: composedBadge,
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
      badge: composedBadge,
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
      badge: composedBadge,
    }
  }

  if (input.paymentSignal === 'commencement_missing') {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'payment_commencement_missing',
      headline: 'Foundational Read outstanding',
      sublabel: input.paymentDetail ?? 'On a plan, coaching has started, $297 fee not received',
      href: `${profileHref}#payments`,
      accent: 'amber',
      priority: 20,
      badge: composedBadge,
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
      badge: composedBadge,
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
      badge: composedBadge,
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
      badge: composedBadge,
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
      badge: composedBadge,
    }
  }

  // ── Block ended, no Progress Check sent ────────────────────────────────
  // Until now the only signal that a block had ended was the daily cron email
  // and the button appearing on the client's Training page - so a milestone
  // was missed by simply not opening that page in the right week. Surfacing it
  // here puts it where the coach already looks every morning.
  if (
    input.activeProgram?.generatedAt &&
    input.activeProgram.weekDuration &&
    !input.progressCheckForActiveBlock
  ) {
    const started = new Date(input.activeProgram.generatedAt).getTime()
    const weeksIn = Math.floor((Date.now() - started) / (1000 * 60 * 60 * 24 * 7)) + 1
    if (weeksIn >= input.activeProgram.weekDuration) {
      const over = weeksIn - input.activeProgram.weekDuration
      return {
        clientId: input.clientId,
        clientName: input.clientName,
        stage: 'block_end_progress_check_due',
        headline: 'Send the Progress Check',
        sublabel:
          over > 0
            ? `${input.activeProgram.blockName} ended ${over} week${over === 1 ? '' : 's'} ago`
            : `${input.activeProgram.blockName} has reached its end`,
        href: `${profileHref}/program`,
        accent: 'amber',
        priority: 20,
        badge: composedBadge,
      }
    }
  }

  // Pending block-end Trajectory Reading on an archived program. Surfaces
  // after check-in feedback (responding to a fresh client signal beats
  // generating a retrospective reading) but before bridge / drift / steady
  // so the artefact gets generated before too many blocks pile up. Common
  // case: coach published the next block, archiving the previous one,
  // without firing the trajectory reading on the way out.
  if (input.pendingTrajectoryReading) {
    const t = input.pendingTrajectoryReading
    const endedLabel = t.generatedAt && t.weekDuration
      ? new Date(new Date(t.generatedAt).getTime() + t.weekDuration * 7 * 86_400_000).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
      : null
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'active_trajectory_reading_pending',
      headline: `Generate block-end reading for ${t.blockName}`,
      sublabel: endedLabel ? `Block ended around ${endedLabel}` : 'Block already archived without its trajectory reading',
      href: `${profileHref}/program`,
      accent: 'amber',
      priority: 20,
      badge: composedBadge,
    }
  }

  // ── Bridge mode lifecycle ──────────────────────────────────────────────
  // When a nutrition plan has transitional_override active, surface the
  // bridge state before drift / steady so the coach is prompted to step
  // up (or extend) the bridge before it silently lapses.
  const anp = input.activeNutritionPlan
  // Audit finding #7: active without expiry → still surface so the bridge
  // isn't invisible. Treat as expiring-now and amber priority. Happens if
  // a coach manually toggles the active flag in the DB, or after a partial
  // schema migration where some columns are present and others aren't.
  if (anp?.transitionalOverrideActive && !anp.transitionalOverrideExpiresAt) {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'active_bridge_expiring',
      headline: 'Bridge plan: no expiry set',
      sublabel: `Floor ${anp.transitionalOverrideFloorKcal ?? '?'} kcal. Regenerate to set a fresh expiry, or remove the override.`,
      href: `${profileHref}/nutrition/suggest`,
      accent: 'amber',
      priority: 30,
      badge: composedBadge,
    }
  }
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
        badge: composedBadge,
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
        badge: composedBadge,
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
        badge: composedBadge,
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
      badge: composedBadge,
    }
  }

  // ── In a recovery state with nothing prescribed to help ────────────────
  // RRS constrains the program and nutrition, but it deliberately never
  // prescribes protocols (that is the Layer 2 / Layer 3 boundary). So a
  // client can sit in a recovery state for weeks with the system holding
  // their training back and nothing actually given to them to recover with.
  if (input.activeRecoveryStateName && input.activeRecoveryProtocolCount === 0) {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'active_recovery_no_protocols',
      headline: 'In a recovery state with no protocols assigned',
      sublabel: `${input.activeRecoveryStateName}. Build a recovery plan so there is something to recover with.`,
      href: `${profileHref}/recovery`,
      accent: 'amber',
      priority: 30,
      badge: composedBadge,
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
      badge: composedBadge,
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

  // ── Steady, but neither Layer 3 library has ever been used ─────────────
  // Deliberately gated on 4+ weeks of coaching. A client still bedding in
  // their program and nutrition does not need a third plan, and firing this
  // at week 1 would make it noise the coach learns to skip.
  const weeksCoaching = startDate
    ? Math.floor((today.getTime() - startDate.getTime()) / (86400000 * 7))
    : 0
  if (
    !isPreStart &&
    weeksCoaching >= 4 &&
    input.activeRecoveryProtocolCount === 0 &&
    input.activeSupplementCount === 0
  ) {
    return {
      clientId: input.clientId,
      clientName: input.clientName,
      stage: 'active_layer3_unset',
      headline: 'Steady - no recovery or supplement plan yet',
      sublabel: `${weekLabel}. ${weeksCoaching} weeks in with neither built.`,
      href: `${profileHref}/recovery`,
      accent: 'neutral',
      priority: 40,
      badge: feedbackBadge,
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
    // Audit #12: was /no longer.*(caught|skipping|struggling)/i which matches
    // "I'm no longer caught up on work, still struggling" — coincidence-safe
    // because the negative marker wins, but tighten anyway. Restrict to "no
    // longer" within 4 words of the marker word.
    /\bno longer(\s+\S+){0,4}\s+(caught|skipping|struggling)/i,
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
