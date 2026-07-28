import { inngest } from './inngest'
import { createAdminClient } from './supabase/admin'
import { Resend } from 'resend'
import { sendSms, formatPhone } from './twilio'
import { darkEmailSignature } from './email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailFeaturedCard, emailNumberedList, emailStatusCard,
} from './email-shell'
import type { TriggerContext } from './automation-engine'
import { appUrl } from '@/lib/app-url'
import { logLeadEvent } from './log-lead-event'
import { legacyLetterToSlug } from './pattern-mapping'
import {
  buildDay14BodyDecodeReportEmail,
  buildDay5UnlockEmail,
  buildDay14FallbackEmail,
  buildDay21FeedbackEmail,
  buildDayZeroIntakeReminderEmail,
} from './challenge-checkin-emails'
import {
  buildBlueprintCheckinPromptEmail,
  buildBlueprintCheckinReminderEmail,
  buildBlueprintWeekEmail,
  buildBlueprintWeek7FollowupEmail,
} from './blueprint-emails'
import { fromCoach, fromBrand } from '@/lib/email-shell'
import { sendMarketingEmail } from '@/lib/marketing-email'
import { coach, logoUrl, brand } from '@/config/tenant'
import {
  buildMembershipCheckinPromptEmail,
  buildMembershipCheckinReminderEmail,
} from './membership-emails'
import { buildExtensionWeekEmail } from './extension-emails'
import { EMAIL_SEQUENCE, STOP_STATUSES as BOOKING_AGENT_STOP_STATUSES } from './booking-agent/sequence'

// ─── Challenge SMS Messages ───────────────────────────────────────────────────
// Rebuilt 2026-05-30 as Minimal Pulse: 1 morning nudge per day (14 messages)
// pointing to the portal, plus 3 afternoon boosts on key days (Day 5 session
// reminder, Day 7 Check-In nudge, Day 14 Body Decode Report nudge). The
// daily coaching content lives in the portal; SMS is the pulse that brings
// the participant back. Previous design sent 3x/day rich coaching messages
// which duplicated the in-portal coaching notes.

const SMS_MORNING: Record<number, string> = {
  1: `Welcome %FIRST%. Day 1 is live in your portal. Today is for setup - read the training plan and nutrition guide, do the morning reset. The work begins gently. Portal: %URL%. To stop these nudges any time, email ${coach().email}.`,
  2: `Day 2 %FIRST%. First training day. Open today's coaching note in the portal before you train: %URL%`,
  3: `Day 3 %FIRST%. Today's coaching note is in the portal: %URL%. The work compounds when the rhythm holds.`,
  4: `Day 4 %FIRST%. Rest day. Today's coaching note is in the portal: %URL%. Sleep is the highest leverage variable - protect it.`,
  5: `Day 5 %FIRST%. Halfway through Week 1. Today the Week One Progress Session lands. Open the portal for today's note + the session: %URL%`,
  6: `Day 6 %FIRST%. Training day. Open today's coaching note before you train: %URL%`,
  7: `Day 7 %FIRST%. End of Week 1. The Body Decode Check-In unlocks today - bottom of the portal home: %URL%`,
  8: `Day 8 %FIRST%. Week 2 begins. The shifts compound from here. Today's coaching note is open: %URL%`,
  9: `Day 9 %FIRST%. Today's coaching note is in the portal: %URL%. Stay steady.`,
  10: `Day 10 %FIRST%. Training day. Open today's coaching note before you train: %URL%`,
  11: `Day 11 %FIRST%. Today's coaching note is in the portal: %URL%. Three days to go.`,
  12: `Day 12 %FIRST%. Training day. Open today's coaching note before you train: %URL%`,
  13: `Day 13 %FIRST%. One day to go. Today's coaching note is in the portal: %URL%`,
  14: `Day 14 %FIRST%. Final day. Your Body Decode Report drops in your inbox today. Today's note is in the portal: %URL%`,
}

const SMS_AFTERNOON_BOOST: Partial<Record<number, string>> = {
  5: `Quick reminder %FIRST%. Your Week One Progress Session is in the portal - watch it before bed if you haven't yet. It breaks down what your body has been doing all week: %URL%`,
  7: `Quick check %FIRST%. Have you done your Body Decode Check-In yet? Takes 3 minutes and unlocks your Day 7 progress read. Portal: %URL%`,
  14: `Your Body Decode Report is in your inbox %FIRST%. The full pattern read, what it means, where it shows up, and what comes next. Open the email.`,
}

function renderSms(template: string, firstName: string, portalUrl: string): string {
  return template.replace(/%FIRST%/g, firstName).replace(/%URL%/g, portalUrl)
}


// ─── Challenge Email Helpers ────────────────────────────────────────────────

// Phase 3a migration (2026-05-22): outer canvas now routed through
// darkEmailShell so the Outlook-safe wrapper + light palette match the
// rest of the system. Body content kept as-is — per-step body composition
// refactor onto the helpers is queued as Phase 3b (would multiply scope
// by 15+ drip steps; the legacy gray-on-white prose remains readable on
// the new canvas).
function challengeEmailShell(body: string): string {
  return darkEmailShell(`
${emailLogo()}
${body}
${darkEmailSignature()}
`)
}

// Render a plain-text automation email body (from the seeded workflow steps)
// into branded inner HTML: paragraphs via emailBody, "Label: https://…" lines
// as CTA buttons, "---" as a divider, and inline URLs linkified. The trailing
// manual "Kade / Body Recode" sign-off is stripped because darkEmailSignature()
// supplies the real one (otherwise the email double-signs).
function renderAutomationBody(body: string): string {
  const text = body
    .replace(/\n+Kade\s*\n+Body Recode\s*$/i, '')
    .trimEnd()
  const parts: string[] = []
  for (const raw of text.split(/\n{2,}/)) {
    const block = raw.trim()
    if (!block) continue
    if (/^-{3,}$/.test(block)) { parts.push(emailDivider()); continue }
    const cta = block.match(/^([^:\n]{2,40}):\s*(https?:\/\/\S+)$/)
    if (cta) { parts.push(emailCta({ href: cta[2], label: cta[1].trim() })); continue }
    const withLinks = block
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#1B6DFC;text-decoration:underline;">$1</a>')
      .replace(/\n/g, '<br/>')
    parts.push(emailBody(withLinks))
  }
  return parts.join('\n')
}

// ─── Challenge Sequence Function ─────────────────────────────────────────────

export const challengeSequenceFunction = inngest.createFunction(
  {
    id: 'challenge-sequence',
    retries: 2,
    triggers: [{ event: 'challenge/enrolled' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { token, email, firstName, phone } = event.data as {
      leadId: string
      token: string
      email: string
      firstName: string
      phone?: string
    }

    const portalUrl = `${brand().marketingDomain}/challenge/${token}`
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Welcome email AND coach notification are sent synchronously by
    // /api/challenge/enroll/route.ts so confirmation never depends on Inngest pickup.
    // This function owns only the time-shifted steps below.

    // ── Step 1: Wait 4 days → Day 5 Week One Progress Session unlock ─────
    // Zoom was retired; the Day 5 deliverable is now the in-portal Week One
    // Progress Session video. The email body + subject + CTA already point at
    // the in-portal session (see buildDay5UnlockEmail). This step just gates
    // the timing. Sleep 4d then realign to next 7am AEST so the email always
    // lands in the morning regardless of enrollment hour.
    await step.sleep('wait-for-day-5', '4d')
    await alignToNextMorningAEST(step, 'wait-for-day-5-morning')

    await step.run('send-day5-session-unlock', async () => {
      // Check enrollment is still active before sending
      const admin = createAdminClient()
      const { data: enrollment } = await admin
        .from('challenge_enrollments')
        .select('status')
        .eq('token', token)
        .single()
      if (!enrollment || enrollment.status !== 'active') return

      const sessionVideoUrl = process.env.CHALLENGE_SESSION_VIDEO_URL ?? portalUrl
      const built = buildDay5UnlockEmail({ firstName, portalUrl, sessionVideoUrl })
      await resend.emails.send({
        from: fromCoach(),
        to: email,
        subject: built.subject,
        html: built.html,
      })
    })

    // ── Step 2: Wait 9 more days → Day 14 ascension ───────────────────────
    // Realign to morning after the 9d sleep so Day 14 email lands 7am AEST.
    await step.sleep('wait-for-day-14', '9d')
    await alignToNextMorningAEST(step, 'wait-for-day-14-morning')

    await step.run('send-day14-ascension', async () => {
      const admin = createAdminClient()
      const { data: enrollment } = await admin
        .from('challenge_enrollments')
        .select('status, quiz_completed_at, quiz_result, quiz_answers')
        .eq('token', token)
        .single()
      if (!enrollment || enrollment.status !== 'active') return

      // Day 14 branches on whether the Check-In was completed during the
      // Challenge.
      //   If completed: send the Body Decode Report email - full pattern
      //     reveal + actions + Blueprint ascension push. Uses the shared
      //     builder so it matches the late-taker email from the API route.
      //   If NOT completed: send the original ascension email - no result
      //     to reveal, just acknowledgement + Blueprint push.
      const completedCheckIn = Boolean(enrollment.quiz_completed_at && enrollment.quiz_result)

      if (completedCheckIn) {
        const patternSlug = legacyLetterToSlug(enrollment.quiz_result as string)
        const answersRecord = (enrollment.quiz_answers ?? {}) as Record<string, string>
        const markerRatings = Object.fromEntries(
          Object.entries(answersRecord).filter(([k]) => !k.startsWith('sq'))
        )
        const progressScore = Object.entries(markerRatings)
          .filter(([, v]) => v === 'better')
          .length

        const built = buildDay14BodyDecodeReportEmail({
          firstName,
          patternSlug,
          progressScore,
        })

        await resend.emails.send({
          from: fromCoach(),
          to: email,
          subject: built.subject,
          html: built.html,
        })
      } else {
        // No Check-In on record. Plain ascension push, no result content.
        const built = buildDay14FallbackEmail({ firstName, enrollmentToken: token })
        await resend.emails.send({
          from: fromCoach(),
          to: email,
          subject: built.subject,
          html: built.html,
        })
      }

      // Log completion
      await admin
        .from('challenge_enrollments')
        .update({ status: 'completed' })
        .eq('token', token)
    })

    // 7-day grace, then check if they purchased Blueprint
    await step.sleep('wait-ascension-grace', '7d')

    await step.run('check-challenge-ascension', async () => {
      const admin = createAdminClient()

      // Matched on email first; if they bought under a different email, fall
      // back to the phone captured at Blueprint checkout (normalised E.164).
      const { data: byEmail } = await admin
        .from('blueprint_enrollments')
        .select('id')
        .ilike('email', email)
        .maybeSingle()
      if (byEmail) return // ascended - no re-engagement needed

      const phoneE164 = phone ? formatPhone(phone) : null
      if (phoneE164) {
        const { data: byPhone } = await admin
          .from('blueprint_enrollments')
          .select('id')
          .eq('phone', phoneE164)
          .limit(1)
        if (byPhone && byPhone.length > 0) return // bought under a different email
      }

      await inngest.send({
        name: 'reengagement/challenge-no-ascension',
        data: { email, firstName, phone: phone ?? null, source: 'challenge' },
      })
    })

    // Same 7d wait window above doubles as the gate for Day 21 feedback ask
    // (Day 21 = 14 + 7). Lighter NPS + open-question prompt; runs whether
    // or not they ascended to Blueprint.
    await step.run('send-day21-feedback-email', async () => {
      const admin = createAdminClient()
      const { data: enrollment } = await admin
        .from('challenge_enrollments')
        .select('status')
        .eq('token', token)
        .single()
      // Skip cancelled enrolments only - completed + active both get the ask.
      if (enrollment?.status === 'cancelled') return

      const built = buildDay21FeedbackEmail({ firstName, enrollmentToken: token })
      await resend.emails.send({
        from: fromCoach(),
        to: email,
        subject: built.subject,
        html: built.html,
      })
    })
  }
)

// ─── Day 0 Intake (Scorecard) Reminder Function ──────────────────────────────
// Chases Challenge enrollers who have not completed the Day 0 Body Decode
// Intake (the in-portal scorecard). Two nudges: ~24h then ~72h after
// enrollment, both realigned to 7am AEST so they land in the morning. Each
// step re-reads the enrollment and bails the moment the intake is done or the
// enrollment is no longer active, so completers never get chased.
//
// Runs on the same 'challenge/enrolled' trigger as the main sequence. It is
// safe even for scorecard-path enrollers (who arrive intake-complete): the
// completion guard short-circuits before any email is sent.
export const challengeIntakeReminderFunction = inngest.createFunction(
  {
    id: 'challenge-intake-reminder',
    retries: 2,
    triggers: [{ event: 'challenge/enrolled' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { leadId, token, email, firstName } = event.data as {
      leadId: string
      token: string
      email: string
      firstName: string
    }

    const portalUrl = `${brand().marketingDomain}/challenge/${token}`
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Returns true if a reminder should still be sent (enrollment active AND
    // intake not yet completed). Reading fresh each time makes the guard the
    // single source of truth for "do they still need chasing".
    const stillNeedsIntake = async (stepId: string): Promise<boolean> =>
      step.run(stepId, async () => {
        const admin = createAdminClient()
        const { data: enrollment } = await admin
          .from('challenge_enrollments')
          .select('status, body_decode_intake_completed_at')
          .eq('token', token)
          .single()
        if (!enrollment || enrollment.status !== 'active') return false
        return !enrollment.body_decode_intake_completed_at
      })

    // SMS reminder runs alongside the email. Routed through sendLeadSms so it
    // is consent-gated (skips anyone not opted-in or opted-out via STOP),
    // frequency-capped, and logged to sms_logs. Silent no-op for the ~half of
    // enrollers who never opted into SMS - the email still carries them.
    const sendIntakeSms = async (stepId: string, body: string): Promise<void> => {
      await step.run(stepId, async () => {
        const { sendLeadSms } = await import('@/lib/speed-to-lead-sms')
        await sendLeadSms({ leadId, trigger: 'challenge_enrolled', body })
      })
    }

    // ── Nudge 1: ~24h after enrollment, realigned to next 7am AEST ──────
    await step.sleep('intake-reminder-1-wait', '1d')
    await alignToNextMorningAEST(step, 'intake-reminder-1-morning')

    if (await stillNeedsIntake('intake-reminder-1-check')) {
      await step.run('send-intake-reminder-1', async () => {
        const built = buildDayZeroIntakeReminderEmail({ firstName, portalUrl, second: false })
        await resend.emails.send({
          from: fromCoach(),
          to: email,
          subject: built.subject,
          html: built.html,
        })
      })
      await sendIntakeSms(
        'send-intake-reminder-1-sms',
        `Hi ${firstName}, your 14-Day Body Decode Challenge is waiting on one 2-minute step - your starting read. Do it and your Challenge unlocks: ${portalUrl}`,
      )
    }

    // ── Nudge 2: ~72h after enrollment (2 more days), firmer copy ───────
    await step.sleep('intake-reminder-2-wait', '2d')
    await alignToNextMorningAEST(step, 'intake-reminder-2-morning')

    if (await stillNeedsIntake('intake-reminder-2-check')) {
      await step.run('send-intake-reminder-2', async () => {
        const built = buildDayZeroIntakeReminderEmail({ firstName, portalUrl, second: true })
        await resend.emails.send({
          from: fromCoach(),
          to: email,
          subject: built.subject,
          html: built.html,
        })
      })
      await sendIntakeSms(
        'send-intake-reminder-2-sms',
        `${firstName}, your Challenge is still on hold. Your 2-minute starting read is all that is between you and Day 1: ${portalUrl}. Reply if something got in the way.`,
      )
    }
  }
)

// ─── Challenge SMS Sequence Function ─────────────────────────────────────────

/**
 * Compute the next 7am Brisbane time (AEST, UTC+10 year-round — Queensland
 * doesn't observe daylight saving). Returns the next occurrence at or after
 * `from`, meaning: if `from` is before today's 7am AEST, returns today 7am;
 * otherwise returns tomorrow 7am.
 */
function nextMorningAEST(from: Date): Date {
  // 7am AEST = 21:00 UTC (previous UTC day, since Brisbane is UTC+10)
  const target = new Date(from)
  target.setUTCHours(21, 0, 0, 0)  // 21:00 UTC = 07:00 AEST next day
  if (target <= from) {
    target.setUTCDate(target.getUTCDate() + 1)
  }
  return target
}

/**
 * Inngest helper: after any preceding step.sleep(), sleep further until the
 * next 7am AEST. Use when a durable workflow wants a "fire at morning after
 * N days" cadence — a 24h/7d step.sleep drifts to whatever hour the enrollment
 * happened; this realigns to 7am.
 *
 * Wraps the current-time read in step.run() for Inngest determinism (replay
 * safety). The subsequent step.sleepUntil() waits for the computed anchor.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function alignToNextMorningAEST(step: any, id: string): Promise<void> {
  const anchorIso = await step.run(`${id}-compute-anchor`, async () =>
    nextMorningAEST(new Date()).toISOString()
  )
  await step.sleepUntil(id, new Date(anchorIso))
}

// Send a consent-gated SMS to a lead resolved by email. Used by the Blueprint,
// Membership and re-engagement sequences (which key off email/token, not
// leadId) to mirror a key email touchpoint as an SMS. Routes through
// sendLeadSms so it is opt-in only, STOP-respecting, frequency-capped
// (1/24h, 3/7d) and logged to sms_logs. Silent no-op if no matching lead or
// the lead never opted into SMS - the email still carries them. Never throws
// (so a sequence step can't fail on the SMS path).
async function smsLeadByEmail(email: string, body: string): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data: lead } = await admin
      .from('leads')
      .select('id')
      .ilike('email', email)
      .limit(1)
      .maybeSingle()
    if (!lead) return
    const { sendLeadSms } = await import('@/lib/speed-to-lead-sms')
    await sendLeadSms({ leadId: lead.id, trigger: 'manual', body })
  } catch (e) {
    console.error('[smsLeadByEmail] failed:', e)
  }
}

export const challengeSmsFunction = inngest.createFunction(
  {
    id: 'challenge-sms-sequence',
    retries: 2,
    triggers: [{ event: 'challenge/enrolled' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { token, phone, firstName } = event.data as {
      token: string
      phone: string
      firstName: string
    }

    if (!phone) return

    const formattedPhone = formatPhone(phone)
    const portalUrl = `${brand().marketingDomain}/challenge/${token}`

    // Anchor Day 1 morning nudge to next 7am Brisbane (AEST, UTC+10 year-round).
    // Was: sleep 1h then fire — landed at enrollment_time + 1h which drifted
    // into PM for afternoon enrollments. All downstream day-N mornings inherit
    // this anchor via the +24h cascade below.
    await step.sleepUntil('sms-initial-wait-until-7am-aest', nextMorningAEST(new Date()))

    // Minimal Pulse cadence:
    //   - Day 1-14: one morning nudge per day pointing to the portal
    //   - Day 5 afternoon: Week One Progress Session reminder
    //   - Day 7 afternoon: Body Decode Check-In nudge
    //   - Day 14 afternoon: Body Decode Report nudge (after the Day 14 email
    //     has fired from challengeSequenceFunction)
    // 14 morning + 3 afternoon boosts = 17 SMS across the 14 days.
    for (let day = 1; day <= 14; day++) {
      // Check enrollment still active before each day's messages
      const isActive = await step.run(`sms-check-active-day${day}`, async () => {
        const admin = createAdminClient()
        const { data } = await admin
          .from('challenge_enrollments')
          .select('status')
          .eq('token', token)
          .single()
        return data?.status === 'active'
      })
      if (!isActive) return

      // Morning portal nudge
      await step.run(`sms-day${day}-morning`, async () => {
        const msg = renderSms(SMS_MORNING[day], firstName, portalUrl)
        await sendSms({ to: formattedPhone, message: msg })
      })

      const afternoonBoost = SMS_AFTERNOON_BOOST[day]
      if (afternoonBoost) {
        // ~8h after morning for the boost
        await step.sleep(`sms-day${day}-afternoon-wait`, '8h')
        await step.run(`sms-day${day}-afternoon`, async () => {
          const msg = renderSms(afternoonBoost, firstName, portalUrl)
          await sendSms({ to: formattedPhone, message: msg })
        })
        // Remaining ~16h to next day's morning
        if (day < 14) {
          await step.sleep(`sms-day${day}-next-day-wait`, '16h')
        }
      } else {
        // No boost today, full 24h sleep to next morning
        if (day < 14) {
          await step.sleep(`sms-day${day}-next-day-wait`, '24h')
        }
      }
    }
  }
)

interface Contact {
  name: string
  email: string | null
  phone: string | null
}

interface Step {
  id: string
  type: string
  action_type: string | null
  config: Record<string, string>
  position: number
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

function stepSleepDuration(config: Record<string, string>): string {
  const amount = parseInt(config.amount) || 1
  const unit = config.unit || 'hours'
  const map: Record<string, string> = {
    minutes: 'm',
    hours: 'h',
    days: 'd',
  }
  return `${amount}${map[unit] ?? 'h'}`
}

async function executeAction(
  step: Step,
  ctx: TriggerContext,
  contact: Contact | null,
  templateVars: Record<string, string>
): Promise<void> {
  const admin = createAdminClient()
  const config = step.config

  switch (step.action_type) {
    case 'send_email': {
      if (!contact?.email || !process.env.RESEND_API_KEY) break
      const interpolatedBody = interpolate(config.body ?? '', templateVars)
      const interpolatedSubject = interpolate(config.subject ?? '', templateVars)
      // Branded shell — same darkEmailShell + primitives the rest of the system
      // uses, so automation emails match the design instead of the old faded
      // plain-text look.
      const html = darkEmailShell(
        `${emailLogo()}\n${renderAutomationBody(interpolatedBody)}\n${darkEmailSignature()}`,
        { previewText: interpolatedSubject },
      )
      // Drip steps are marketing, so they route through sendMarketingEmail:
      // suppression check, unsubscribe footer and List-Unsubscribe header in
      // one place rather than per sequence.
      const result = await sendMarketingEmail({
        from: fromCoach(),
        to: contact.email,
        subject: interpolatedSubject,
        html,
        source: `automation-step-${step.position}`,
      })
      if (!result.ok) {
        if (!result.skipped) {
          console.error('[automation send_email] send failed:', result.reason, 'to:', contact.email, 'subject:', interpolatedSubject)
        }
        break
      }
      if (ctx.leadId) {
        await logLeadEvent({
          leadId: ctx.leadId,
          type: 'email_sent',
          subject: interpolatedSubject,
          resendEmailId: result.id ?? undefined,
          notes: `Automation step ${step.position}`,
        })
      }
      break
    }

    case 'notify_coach': {
      if (!process.env.RESEND_API_KEY) break
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: fromBrand(),
        to: coach().email,
        subject: `Automation: ${interpolate(config.message ?? 'Action triggered', templateVars)}`,
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#FFFFFF;color:#aaa;">
          <img src="${logoUrl()}" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
          <p style="font-size:16px;color:#fff;font-weight:600;">${interpolate(config.message ?? '', templateVars)}</p>
          ${contact ? `<p style="color:#aaa;">Contact: ${contact.name} (${contact.email ?? 'no email'})</p>` : ''}
        </div>`,
      })
      break
    }

    case 'add_tag': {
      if (!config.tag || !ctx.leadId) break
      const { data: existingTag } = await admin
        .from('be_tags')
        .select('id')
        .eq('name', config.tag)
        .maybeSingle()

      let tagId = existingTag?.id
      if (!tagId) {
        const { data: lead } = await admin
          .from('leads')
          .select('coach_id')
          .eq('id', ctx.leadId)
          .single()
        const { data: newTag } = await admin
          .from('be_tags')
          .insert({ name: config.tag, coach_id: lead?.coach_id })
          .select('id')
          .single()
        tagId = newTag?.id
      }

      if (tagId) {
        await admin
          .from('be_lead_tags')
          .upsert({ lead_id: ctx.leadId, tag_id: tagId })
      }
      break
    }

    case 'remove_tag': {
      if (!config.tag || !ctx.leadId) break
      const { data: tag } = await admin
        .from('be_tags')
        .select('id')
        .eq('name', config.tag)
        .maybeSingle()
      if (tag) {
        await admin
          .from('be_lead_tags')
          .delete()
          .eq('lead_id', ctx.leadId)
          .eq('tag_id', tag.id)
      }
      break
    }

    case 'move_pipeline_stage': {
      if (!config.stage || !ctx.leadId) break
      await admin
        .from('leads')
        .update({ status: config.stage })
        .eq('id', ctx.leadId)
      break
    }

    case 'send_sms': {
      if (!contact?.phone) break
      await sendSms({
        to: formatPhone(contact.phone),
        message: interpolate(config.message ?? '', templateVars),
      })
      break
    }
  }
}

// ─── Blueprint Email Sequence ─────────────────────────────────────────────────


export const blueprintEmailSequenceFunction = inngest.createFunction(
  {
    id: 'blueprint-email-sequence',
    retries: 2,
    triggers: [{ event: 'blueprint/enrolled' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { token, email, firstName } = event.data as {
      token: string
      email: string
      firstName: string
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const portalUrl = `${brand().marketingDomain}/blueprint/${token}`

    for (let week = 1; week <= 6; week++) {
      // Week 1 fires after 1 day, subsequent weeks at 7-day intervals
      await step.sleep(`wait-before-week-${week}-email`, week === 1 ? '1d' : '7d')
      await alignToNextMorningAEST(step, `wait-before-week-${week}-morning`)

      await step.run(`send-week-${week}-email`, async () => {
        const admin = createAdminClient()

        // Fetch current pattern (may have changed from pending since enrollment)
        const { data: enrollment } = await admin
          .from('blueprint_enrollments')
          .select('pattern, status')
          .eq('token', token)
          .single()

        if (!enrollment || enrollment.status !== 'active') return

        const pattern = enrollment.pattern === 'pending' ? 'stress-stored' : enrollment.pattern
        const built = buildBlueprintWeekEmail({
          week: week as 1 | 2 | 3 | 4 | 5 | 6,
          firstName,
          portalUrl,
          pattern,
        })
        await resend.emails.send({
          from: fromCoach(),
          to: email,
          subject: built.subject,
          html: built.html,
        })
      })
    }

    // Week 7 follow-up (7 days after week 6 email, aligned to 7am AEST)
    await step.sleep('wait-before-week-7-followup', '7d')
    await alignToNextMorningAEST(step, 'wait-before-week-7-followup-morning')

    await step.run('send-week-7-followup', async () => {
      const admin = createAdminClient()
      const { data: enrollment } = await admin
        .from('blueprint_enrollments')
        .select('pattern, status')
        .eq('token', token)
        .single()

      if (!enrollment) return

      const pattern = enrollment.pattern === 'pending' ? 'stress-stored' : enrollment.pattern
      const built = buildBlueprintWeek7FollowupEmail({ firstName, portalUrl, pattern })
      await resend.emails.send({
        from: fromCoach(),
        to: email,
        subject: built.subject,
        html: built.html,
      })
    })
  }
)

// ─── Blueprint Week Advance Function ─────────────────────────────────────────

export const blueprintWeekAdvanceFunction = inngest.createFunction(
  {
    id: 'blueprint-week-advance',
    retries: 2,
    triggers: [{ event: 'blueprint/enrolled' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { token, email, firstName } = event.data as { token: string; email: string; firstName: string }

    for (let week = 2; week <= 6; week++) {
      await step.sleep(`wait-for-week-${week}`, '7d')
      await alignToNextMorningAEST(step, `wait-for-week-${week}-morning`)

      await step.run(`advance-to-week-${week}`, async () => {
        const admin = createAdminClient()
        const { data } = await admin
          .from('blueprint_enrollments')
          .select('current_week, status')
          .eq('token', token)
          .single()

        if (!data || data.status !== 'active') return
        if (data.current_week !== week - 1) return

        await admin
          .from('blueprint_enrollments')
          .update({ current_week: week })
          .eq('token', token)

        // Send check-in prompt for the completed week
        if (process.env.RESEND_API_KEY) {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const portalUrl = `${appUrl()}/blueprint/${token}`
          const completedWeek = week - 1
          const built = buildBlueprintCheckinPromptEmail({
            firstName,
            completedWeek,
            newWeek: week,
            portalUrl,
          })
          await resend.emails.send({
            from: fromCoach(),
            to: email,
            subject: built.subject,
            html: built.html,
          })
        }
      })

      // 2-day reminder if check-in not submitted (aligned to 7am AEST)
      await step.sleep(`reminder-delay-week-${week}`, '2d')
      await alignToNextMorningAEST(step, `reminder-delay-week-${week}-morning`)

      await step.run(`checkin-reminder-week-${week}`, async () => {
        const admin = createAdminClient()
        const { data: enrollment } = await admin
          .from('blueprint_enrollments')
          .select('id, status')
          .eq('token', token)
          .single()

        if (!enrollment || enrollment.status !== 'active') return

        const completedWeek = week - 1
        const { data: existing } = await admin
          .from('blueprint_checkins')
          .select('id')
          .eq('enrollment_id', enrollment.id)
          .eq('week_number', completedWeek)
          .maybeSingle()

        if (existing) return // already submitted

        if (process.env.RESEND_API_KEY) {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const portalUrl = `${appUrl()}/blueprint/${token}`
          const built = buildBlueprintCheckinReminderEmail({
            firstName,
            completedWeek,
            portalUrl,
          })
          await resend.emails.send({
            from: fromCoach(),
            to: email,
            subject: built.subject,
            html: built.html,
          })
          // Mirror the reminder as an SMS - only reached when the check-in is
          // still outstanding (guarded by the `existing` check above).
          await smsLeadByEmail(email, `${firstName}, your Week ${completedWeek} Blueprint check-in is still open - it takes 2 minutes in the portal: ${portalUrl}`)
        }
      })
    }

    // After week 6 - 14-day grace then check if they joined membership
    await step.sleep('wait-blueprint-ascension-grace', '14d')

    await step.run('check-blueprint-ascension', async () => {
      const admin = createAdminClient()
      const { data: membership } = await admin
        .from('membership_enrollments')
        .select('id')
        .ilike('email', email)
        .maybeSingle()

      if (membership) return // ascended - no re-engagement needed

      const { data: enrollment } = await admin
        .from('blueprint_enrollments')
        .select('pattern')
        .eq('token', token)
        .single()

      const patternLabels: Record<string, string> = {
        'stress-stored': 'Stress-Stored',
        'metabolic-drift': 'Insulin-Drift',
        'hormonal-shift': 'Estrogen-Shift',
        'system-overload': 'Androgen-Decline',
      }

      await inngest.send({
        name: 'reengagement/blueprint-no-ascension',
        data: {
          email,
          firstName,
          source: 'blueprint',
          patternLabel: patternLabels[enrollment?.pattern ?? ''] ?? undefined,
        },
      })
    })
  }
)

// ─── Membership Week/Block Advance Function ───────────────────────────────────

export const membershipWeekAdvanceFunction = inngest.createFunction(
  {
    id: 'membership-week-advance',
    retries: 2,
    triggers: [{ event: 'membership/enrolled' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { token, email, first_name } = event.data as { token: string; email: string; first_name: string }

    const BLOCKS = ['A', 'B', 'C']
    const WEEKS_PER_BLOCK = 6

    for (const block of BLOCKS) {
      for (let week = (block === 'A' ? 2 : 1); week <= WEEKS_PER_BLOCK; week++) {
        await step.sleep(`wait-block-${block}-week-${week}`, '7d')
        await alignToNextMorningAEST(step, `wait-block-${block}-week-${week}-morning`)

        await step.run(`advance-block-${block}-week-${week}`, async () => {
          const admin = createAdminClient()
          const { data } = await admin
            .from('membership_enrollments')
            .select('id, current_block, current_week, cancelled_at')
            .eq('token', token)
            .single()

          if (!data || data.cancelled_at) return
          if (data.current_block !== block) return

          await admin
            .from('membership_enrollments')
            .update({ current_week: week })
            .eq('token', token)

          const completedWeek = week - 1
          if (completedWeek < 1) return

          // Send check-in prompt for the completed week
          if (process.env.RESEND_API_KEY) {
            const resend = new Resend(process.env.RESEND_API_KEY)
            const portalUrl = `${appUrl()}/membership/${token}`
            const built = buildMembershipCheckinPromptEmail({
              firstName: first_name,
              block,
              completedWeek,
              newWeek: week,
              portalUrl,
            })
            await resend.emails.send({
              from: fromCoach(),
              to: email,
              subject: built.subject,
              html: built.html,
            })
          }
        })

        // 2-day reminder if check-in not submitted (aligned to 7am AEST)
        await step.sleep(`reminder-delay-block-${block}-week-${week}`, '2d')
        await alignToNextMorningAEST(step, `reminder-delay-block-${block}-week-${week}-morning`)

        await step.run(`checkin-reminder-block-${block}-week-${week}`, async () => {
          const admin = createAdminClient()
          const { data: enrollment } = await admin
            .from('membership_enrollments')
            .select('id, cancelled_at')
            .eq('token', token)
            .single()

          if (!enrollment || enrollment.cancelled_at) return

          const completedWeek = week - 1
          if (completedWeek < 1) return

          const { data: existing } = await admin
            .from('membership_checkins')
            .select('id')
            .eq('enrollment_id', enrollment.id)
            .eq('week_number', completedWeek)
            .maybeSingle()

          if (existing) return

          if (process.env.RESEND_API_KEY) {
            const resend = new Resend(process.env.RESEND_API_KEY)
            const portalUrl = `${appUrl()}/membership/${token}`
            const built = buildMembershipCheckinReminderEmail({
              firstName: first_name,
              block,
              completedWeek,
              portalUrl,
            })
            await resend.emails.send({
              from: fromCoach(),
              to: email,
              subject: built.subject,
              html: built.html,
            })
            // Mirror the reminder as an SMS - only reached when the check-in is
            // still outstanding (guarded by the `existing` check above).
            await smsLeadByEmail(email, `${first_name}, your Block ${block} Week ${completedWeek} check-in is still open - it takes 2 minutes in the portal: ${portalUrl}`)
          }
        })
      }

      // Advance to next block after week 6 deload
      if (block !== 'C') {
        const nextBlock = BLOCKS[BLOCKS.indexOf(block) + 1]
        await step.run(`advance-to-block-${nextBlock}`, async () => {
          const admin = createAdminClient()
          const { data } = await admin
            .from('membership_enrollments')
            .select('current_block, cancelled_at')
            .eq('token', token)
            .single()

          if (!data || data.cancelled_at) return
          if (data.current_block !== block) return

          await admin
            .from('membership_enrollments')
            .update({ current_block: nextBlock, current_week: 1 })
            .eq('token', token)
        })
      }
    }
  }
)

// ─── Extension Week Advance Function ─────────────────────────────────────────

export const extensionWeekAdvanceFunction = inngest.createFunction(
  {
    id: 'extension-week-advance',
    retries: 2,
    triggers: [{ event: 'extension/enrolled' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { token, email, firstName } = event.data as { token: string; email: string; firstName: string }

    for (let week = 2; week <= 12; week++) {
      await step.sleep(`wait-extension-week-${week}`, '7d')
      await alignToNextMorningAEST(step, `wait-extension-week-${week}-morning`)

      await step.run(`advance-extension-week-${week}`, async () => {
        const admin = createAdminClient()
        const { data } = await admin
          .from('extension_enrollments')
          .select('current_week, pattern')
          .eq('token', token)
          .single()

        if (!data) return
        if (data.current_week !== week - 1) return

        await admin
          .from('extension_enrollments')
          .update({ current_week: week })
          .eq('token', token)

        if (process.env.RESEND_API_KEY) {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const portalUrl = `${appUrl()}/extension/${token}`
          // Pattern-aware weekly email for the new week; it opens the week and
          // prompts the just-completed week's check-in in one touch.
          const built = buildExtensionWeekEmail({ week, firstName, portalUrl, pattern: data.pattern })
          await resend.emails.send({
            from: fromCoach(),
            to: email,
            subject: built.subject,
            html: built.html,
          })
        }
      })
    }

    // After week 12 - check if they joined membership
    await step.sleep('wait-extension-ascension-grace', '7d')

    await step.run('check-extension-ascension', async () => {
      const admin = createAdminClient()
      const { data: membership } = await admin
        .from('membership_enrollments')
        .select('id')
        .ilike('email', email)
        .maybeSingle()

      if (membership) return

      const { data: enrollment } = await admin
        .from('extension_enrollments')
        .select('pattern')
        .eq('token', token)
        .single()

      const patternLabels: Record<string, string> = {
        'stress-stored': 'Stress-Stored',
        'metabolic-drift': 'Insulin-Drift',
        'hormonal-shift': 'Estrogen-Shift',
        'system-overload': 'Androgen-Decline',
      }

      await inngest.send({
        name: 'reengagement/blueprint-no-ascension',
        data: {
          email,
          firstName,
          source: 'blueprint',
          patternLabel: patternLabels[enrollment?.pattern ?? ''] ?? undefined,
        },
      })
    })
  }
)

// ─── Re-Engagement Sequence Function ─────────────────────────────────────────
// Triggered by: challenge/completed-no-ascension, blueprint/completed-no-ascension, membership/cancelled

// Phase 3c migration — bodies now composed from helpers. The wrapper
// prepends the logo and appends the signature; each step's content is
// fully composed (eyebrow + heading + divider + body / featured cards /
// status cards / CTAs). Removed the auto-prepended greeting because each
// step composes its own with emailBody for consistent styling.
function reengagementEmailShell(content: string) {
  return darkEmailShell(`
${emailLogo()}
${content}
${darkEmailSignature()}
`)
}

export const reengagementSequenceFunction = inngest.createFunction(
  {
    id: 'reengagement-sequence',
    retries: 2,
    triggers: [
      { event: 'reengagement/challenge-no-ascension' },
      { event: 'reengagement/blueprint-no-ascension' },
      { event: 'reengagement/membership-cancelled' },
    ],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { email, firstName, source, patternLabel, phone } = event.data as {
      email: string
      firstName: string
      source: 'challenge' | 'blueprint' | 'membership'
      patternLabel?: string
      phone?: string | null
    }

    const extensionUrl = `${appUrl()}/extension`
    const membershipUrl = `${appUrl()}/membership`
    const patternNote = patternLabel ? ` Your ${patternLabel} pattern doesn't reset when you stop - it's still there when you come back.` : ''

    // Conversion guard: has this person taken a paid step SINCE the sequence
    // started? Checked before every email so we stop the instant they convert
    // and never pitch someone a product they've already bought.
    //
    // Source-aware, because "converted" means different things per entry point:
    //   - challenge  → bought the Blueprint, the Extension, or an active Membership
    //   - blueprint  → bought the Extension, or an active Membership (owns Blueprint)
    //   - membership → re-subscribed (any active Membership row again)
    // Each product is matched on email first, then on the phone captured at
    // checkout (catches a buyer who paid under a different email than enrolled).
    const emailLower = email.toLowerCase()
    const phoneE164 = phone ? formatPhone(phone) : null
    const hasConverted = async (stepId: string): Promise<boolean> =>
      step.run(stepId, async () => {
        const admin = createAdminClient()

        // Bought this product? Matched by email, then phone fallback.
        const boughtProduct = async (table: 'blueprint_enrollments' | 'extension_enrollments'): Promise<boolean> => {
          const { data: byEmail } = await admin.from(table).select('id').ilike('email', emailLower).limit(1)
          if (byEmail && byEmail.length > 0) return true
          if (phoneE164) {
            const { data: byPhone } = await admin.from(table).select('id').eq('phone', phoneE164).limit(1)
            if (byPhone && byPhone.length > 0) return true
          }
          return false
        }

        const { data: mem } = await admin
          .from('membership_enrollments')
          .select('id')
          .ilike('email', emailLower)
          .is('cancelled_at', null)
          .limit(1)
        if (mem && mem.length > 0) return true

        // Challenge entrants convert by buying the Blueprint (the next step).
        if (source === 'challenge' && await boughtProduct('blueprint_enrollments')) return true
        // Both challenge and blueprint entrants convert by buying the Extension.
        if ((source === 'challenge' || source === 'blueprint') && await boughtProduct('extension_enrollments')) return true

        return false
      })

    // Email 1: Day 3 - check in
    if (await hasConverted('convert-check-before-day3')) return
    await step.run('send-day3', async () => {
      if (!process.env.RESEND_API_KEY) return
      const sourceContext = source === 'challenge'
        ? 'You finished the 14-day challenge a few days ago.'
        : source === 'blueprint'
          ? 'You completed the 6-Week Blueprint a few days ago.'
          : 'Your Body Recode membership has ended.'
      await sendMarketingEmail({
        from: fromCoach(),
        source: 'reengagement',
        to: email,
        subject: `Checking in, ${firstName}`,
        html: reengagementEmailShell(`
${emailEyebrow('Checking In')}
${emailHeading(`How is it going, ${firstName}?`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(`${sourceContext} I wanted to check in and see how things are going.`)}
${emailBody(`The work you put in doesn't disappear the moment a programme ends.${patternNote}`)}
${emailBody(`If the timing wasn't right, or life got in the way, that's fine. There's no pressure here. But if you've been thinking about what's next, I want to make sure you know the door is still open.`)}
${emailBody("Reply to this email if you want to talk through where you're at. I read every reply.", { size: 14 })}
`),
      })
    })

    // Mirror the soft check-in as an SMS (consent-gated + capped).
    await step.run('sms-day3', async () => {
      const ctx = source === 'challenge' ? 'challenge' : source === 'blueprint' ? 'Blueprint' : 'membership'
      // NOTE: BR SMS sends from the one-way alphanumeric sender ID "BodyRecode"
      // (Twilio Messaging Service MG3cab…, 0 numbers / 1 alpha sender) — recipients
      // CANNOT reply to a text. Never promise an SMS reply here; point to the paired
      // email (which does take replies). See project_sms_one_way_sender.
      await smsLeadByEmail(email, `Hi ${firstName}, checking in after your ${ctx}. No pressure, just seeing how you're going. I've emailed you too - reply there any time. - Kade`)
    })

    await step.sleep('wait-day3-to-14', '11d')

    // Email 2: Day 14 - what the next stage looks like
    if (await hasConverted('convert-check-before-day14')) return
    await step.run('send-day14', async () => {
      if (!process.env.RESEND_API_KEY) return
      const nextStageContext = source === 'challenge'
        ? `The 6-Week Blueprint is where the work you started gets structure and direction. It's built around your biological pattern — not a generic plan.`
        : `The 90-Day Extension is designed for exactly where you are — you've done the foundation work, and you need time to consolidate it before committing to the full membership.`
      await sendMarketingEmail({
        from: fromCoach(),
        source: 'reengagement',
        to: email,
        subject: `What the next step looks like for you`,
        html: reengagementEmailShell(`
${emailEyebrow('The Next Stage')}
${emailHeading('What comes next, in plain terms.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('I want to give you a clear picture of what the next stage of the Body Recode system looks like — not a pitch, just information.')}
${emailBody(nextStageContext)}
${emailBody("The biology doesn't care about the gap between stages. Whether you pick this up tomorrow or in three months, the pattern is still there and the system still works. You just need to decide when you're ready.")}
${emailBody("Reply if you have questions or want to know which pathway fits where you're at right now.", { size: 14 })}
`),
      })
    })

    await step.sleep('wait-day14-to-30', '16d')

    // Email 3: Day 30 - re-entry offer
    if (await hasConverted('convert-check-before-day30')) return
    await step.run('send-day30', async () => {
      if (!process.env.RESEND_API_KEY) return
      await sendMarketingEmail({
        from: fromCoach(),
        source: 'reengagement',
        to: email,
        subject: `A lower-commitment way back in`,
        html: reengagementEmailShell(`
${emailEyebrow('90-Day Extension')}
${emailHeading('A lower-commitment way back in.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody("If the weekly membership commitment felt like too much right now, there's another option.", { bottom: 24 })}
${emailStatusCard({
  eyebrow: '90-Day Body Rewire Extension',
  headline: '$197 one-time',
  body: "12 weeks of progressive pattern-specific programming. No subscription, no ongoing commitment. Same portal, same pattern-driven training and nutrition you've already experienced.",
})}
${emailCta({ href: extensionUrl, label: 'See the Extension' })}
${emailUrlFallback(extensionUrl, 'Or paste this link into your browser')}
${emailBody("Not ready yet? That's fine. I'll check back in.", { size: 14 })}
`),
      })
    })

    await step.sleep('wait-day30-to-45', '15d')

    // Email 4: Day 45 - reminder
    if (await hasConverted('convert-check-before-day45')) return
    await step.run('send-day45', async () => {
      if (!process.env.RESEND_API_KEY) return
      await sendMarketingEmail({
        from: fromCoach(),
        source: 'reengagement',
        to: email,
        subject: `Still here if you want it`,
        html: reengagementEmailShell(`
${emailEyebrow('Short Nudge')}
${emailHeading('Still here if you want it.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('Just a short one.')}
${emailBody('The 90-Day Extension is still available at $197 if the timing is better now. It gives you 12 weeks of the next stage of programming — picked up exactly where you left off.', { bottom: 24 })}
${emailCta({ href: extensionUrl, label: 'See the 90-Day Extension' })}
${emailUrlFallback(extensionUrl, 'Or paste this link into your browser')}
${emailBody('Reply any time if you want to talk through it.', { size: 14 })}
`),
      })
    })

    await step.sleep('wait-day45-to-60', '15d')

    // Email 5: Day 60 - membership offer direct
    if (await hasConverted('convert-check-before-day60')) return
    await step.run('send-day60', async () => {
      if (!process.env.RESEND_API_KEY) return
      await sendMarketingEmail({
        from: fromCoach(),
        source: 'reengagement',
        to: email,
        subject: `The membership is still open`,
        html: reengagementEmailShell(`
${emailEyebrow('Body Recode Membership')}
${emailHeading('The membership is still open.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody("If you've been thinking about the full membership, here's the short version of what it is:")}
${emailFeaturedCard(
  emailNumberedList([
    'Progressive 6-week training blocks built around your pattern — Block A, B, and C',
    'Nutrition precision layer updated each block',
    'Monthly coach Loom — I review your check-in data and send a personal response',
    'Monthly group Q&amp;A call',
    'Cancel anytime. No lock-in.',
  ]),
  { eyebrow: '$49 per week' },
)}
${emailCta({ href: membershipUrl, label: 'See the Membership' })}
${emailUrlFallback(membershipUrl, 'Or paste this link into your browser')}
`),
      })
    })

    // Mirror the Membership offer as an SMS (consent-gated + capped).
    await step.run('sms-day60', async () => {
      await smsLeadByEmail(email, `${firstName}, the Body Recode Membership is open if you want the full system - progressive blocks built around your pattern, $49/wk, cancel anytime: ${membershipUrl}`)
    })

    await step.sleep('wait-day60-to-90', '30d')

    // Email 6: Day 90 - final touchpoint + referral
    if (await hasConverted('convert-check-before-day90')) return
    await step.run('send-day90', async () => {
      if (!process.env.RESEND_API_KEY) return
      await sendMarketingEmail({
        from: fromCoach(),
        source: 'reengagement',
        to: email,
        subject: `Last one from me`,
        html: reengagementEmailShell(`
${emailEyebrow('Final Touchpoint')}
${emailHeading('Last one from me.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody("This is the last email in this sequence. I don't want to keep showing up in your inbox if the timing isn't right.")}
${emailBody("If you ever want to come back, the door is open. The system works whenever you're ready for it.")}
${emailBody('One other thing — if you know someone who would benefit from any of the Body Recode programmes, send them to <a href="${appUrl()}" style="color:#1B6DFC;font-weight:600;text-decoration:none;">app.bodyrecode.au</a>. The challenge is free and a good starting point for anyone.')}
${emailBody('Take care of yourself.', { size: 14 })}
`),
      })
    })
  }
)

// ─── Execute Workflow Function ────────────────────────────────────────────────

export const executeWorkflowFunction = inngest.createFunction(
  {
    id: 'execute-workflow',
    retries: 3,
    triggers: [{ event: 'automation/workflow.triggered' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { workflowId, executionId, ctx, contact, templateVars } = event.data as {
      workflowId: string
      executionId: string | null
      ctx: TriggerContext
      contact: Contact | null
      templateVars: Record<string, string>
    }

    // Fetch steps fresh from DB (idempotent)
    const steps: Step[] = await step.run('fetch-steps', async () => {
      const admin = createAdminClient()
      const { data } = await admin
        .from('be_workflow_steps')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('position')
      return (data ?? []) as Step[]
    })

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i]

      // Bail out if the lead has converted to a client or been explicitly
      // declined since this workflow started. Long sleep steps (days/weeks
      // between drip emails) mean the lead's state may have moved on by the
      // time we wake; we don't want a freshly-converted client receiving
      // 'finish your scorecard' nudges.
      const stopReason: string | null = await step.run(`check-lead-state-${i}`, async () => {
        const admin = createAdminClient()
        const { data: wf } = await admin
          .from('be_workflows')
          .select('is_active')
          .eq('id', workflowId)
          .maybeSingle()
        if (!wf) return 'workflow_deleted'
        if (wf.is_active === false) return 'workflow_deactivated'
        if (!ctx.leadId) return null
        const { data } = await admin
          .from('leads')
          .select('converted_to_client_id, status, active')
          .eq('id', ctx.leadId)
          .maybeSingle()
        if (!data) return 'lead_deleted'
        if (data.active === false) return 'lead_inactive'
        if (data.converted_to_client_id) return 'converted_to_client'
        if (data.status === 'closed_declined') return 'closed_declined'
        return null
      })

      if (stopReason) {
        if (executionId) {
          await step.run('mark-cancelled', async () => {
            const admin = createAdminClient()
            await admin
              .from('be_workflow_executions')
              .update({
                status: 'cancelled',
                completed_at: new Date().toISOString(),
                error_message: `Stopped at step ${i}: ${stopReason}`,
              })
              .eq('id', executionId)
          })
        }
        return
      }

      // Update current step in execution log
      if (executionId) {
        await step.run(`update-progress-${i}`, async () => {
          const admin = createAdminClient()
          await admin
            .from('be_workflow_executions')
            .update({ current_step: i })
            .eq('id', executionId)
        })
      }

      if (s.type === 'wait') {
        const duration = stepSleepDuration(s.config)
        await step.sleep(`wait-${s.id}`, duration)
        continue
      }

      if (s.type === 'action') {
        await step.run(`action-${s.id}`, async () => {
          await executeAction(s, ctx, contact, templateVars)
        })
      }
    }

    // Mark completed
    if (executionId) {
      await step.run('mark-completed', async () => {
        const admin = createAdminClient()
        await admin
          .from('be_workflow_executions')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', executionId)
      })
    }
  }
)


// ─── Digital Asset Engine Fulfilment ──────────────────────────────────────────
// Phase C — bolt_on_ai products with fulfilment_kind='instant_engine'.
// Triggered by the Stripe webhook after the purchase row is inserted.
// Runs the engine, renders the deep-dive PDF, uploads to library, sends
// the ready email. See src/lib/instant-engine-fulfilment.ts for the body.
export const digitalAssetEngineFulfilmentFunction = inngest.createFunction(
  {
    id: 'digital-asset-engine-fulfilment',
    retries: 3,
    triggers: [{ event: 'digital_asset/engine_call' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { purchase_id } = event.data as { purchase_id: string }

    await step.run('fulfil-instant-engine', async () => {
      const { fulfilInstantEngine } = await import('@/lib/instant-engine-fulfilment')
      await fulfilInstantEngine(purchase_id)
    })

    return { ok: true, purchase_id }
  }
)

/* ===========================================================================
 * Weekly Check-In Auto-Response
 *
 * Trigger: weekly-checkin/submitted (fired from /api/submit-weekly-checkin/
 * route.ts after a successful insert).
 *
 * Flow (2026-06-15 onwards — explicit coach-approval gate):
 *   1. 30s settle delay so any rapid back-to-back writes complete.
 *   2. Eligibility gate: client.auto_checkin_response_enabled must be true;
 *      check-in must not be skipped; no feedback row already exists (coach
 *      beat us, or duplicate event). Every exit stamps
 *      weekly_checkins.auto_response_attempted_at for diagnostics.
 *   3. Generate draft via shared generateFeedbackDraft. On failure, stamp
 *      failure_reason and exit (Today's Focus surfaces the AI-failed flag,
 *      coach writes manually).
 *   4. Insert weekly_checkin_feedback row WITHOUT email_sent_at, with
 *      auto_generated_at = now and a random approval_token (column default).
 *   4b. Email Kade an [Approve] preview containing the client's full
 *       check-in answers + the AI-drafted response + an Approve & Send
 *       button pointing at /api/coach/approve-checkin-response?token=...
 *       Best-effort; a preview-send failure does not abort the worker.
 *   5. Done. No sleepUntil, no auto-send. The client only hears back if
 *      Kade clicks Approve & Send in the email (or Send now in the
 *      dashboard, which uses the existing manual route).
 *
 * Removed 2026-06-15: silent 4h auto-send. Ruby's Week 6 silent drop
 * (the bug that motivated the 2026-06-14 hardening) confirmed that an
 * email-inbox gate is more reliable than a dashboard-watch gate.
 *
 * Auto-retries: Inngest default per-step retries handle transient failures.
 * The eligibility checks are idempotent — re-running them is safe.
 * ========================================================================== */
export const weeklyCheckinAutoResponseFunction = inngest.createFunction(
  {
    id: 'weekly-checkin-auto-response',
    retries: 2,
    triggers: [{ event: 'weekly-checkin/submitted' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { checkin_id } = event.data as { checkin_id: string }

    // ── Step 1: settle delay ────────────────────────────────────────────
    await step.sleep('settle', '30s')

    // ── Step 2: eligibility gate ───────────────────────────────────────
    // Every exit (pass or fail) stamps weekly_checkins.auto_response_attempted_at
    // so silent drops become visible in the DB. Pre-2026-06-14 the gate
    // returned silently on fail — Ruby's Week 6 was lost to this and we
    // couldn't tell "ran and gated" from "never ran" from "send failed".
    const gate = await step.run('check-eligibility', async () => {
      const admin = createAdminClient()

      const stamp = async (reason: string | null) => {
        await admin
          .from('weekly_checkins')
          .update({
            auto_response_attempted_at: new Date().toISOString(),
            auto_response_failure_reason: reason,
          })
          .eq('id', checkin_id)
      }

      const { data: checkin } = await admin
        .from('weekly_checkins')
        .select('id, client_id, week_number, form_type, coach_skipped_at')
        .eq('id', checkin_id)
        .maybeSingle()
      if (!checkin) { await stamp('gate: check-in not found'); return { ok: false, reason: 'check-in not found' } }
      if (checkin.coach_skipped_at) { await stamp('gate: coach skipped'); return { ok: false, reason: 'coach skipped' } }

      const { data: client } = await admin
        .from('clients')
        .select('id, name, auto_checkin_response_enabled')
        .eq('id', checkin.client_id)
        .maybeSingle()
      if (!client) { await stamp('gate: client not found'); return { ok: false, reason: 'client not found' } }
      if (!client.auto_checkin_response_enabled) { await stamp('gate: auto-response disabled for client'); return { ok: false, reason: 'auto-response disabled for client' } }

      const { data: existingFeedback } = await admin
        .from('weekly_checkin_feedback')
        .select('id')
        .eq('weekly_checkin_id', checkin_id)
        .maybeSingle()
      if (existingFeedback) { await stamp('gate: feedback already exists (coach beat us)'); return { ok: false, reason: 'feedback already exists (coach beat us)' } }

      return { ok: true as const, checkin, clientName: client.name as string | null }
    })

    if (!gate.ok) return { ok: false, reason: gate.reason }

    // ── Step 3: generate draft ─────────────────────────────────────────
    const generated = await step.run('generate-draft', async () => {
      const { generateFeedbackDraft } = await import('@/lib/weekly-checkin-feedback-generate')
      const admin = createAdminClient()
      const result = await generateFeedbackDraft(admin, checkin_id)

      await admin
        .from('weekly_checkins')
        .update({
          auto_response_attempted_at: new Date().toISOString(),
          auto_response_failure_reason: result.ok ? null : result.error,
        })
        .eq('id', checkin_id)

      if (!result.ok) {
        return { ok: false as const, error: result.error }
      }
      return { ok: true as const, draft: result.draft }
    })

    if (!generated.ok) return { ok: false, reason: `generate failed: ${generated.error}` }

    // ── Step 4: insert feedback row + mint approval token ──────────────
    // 2026-06-15: the silent 4h auto-send was removed in favour of an
    // explicit Kade-click gate. auto_send_scheduled_at is still written
    // for historical telemetry but no Inngest sleep keys off it anymore.
    const inserted = await step.run('insert-feedback-draft', async () => {
      const admin = createAdminClient()
      const { data, error } = await admin
        .from('weekly_checkin_feedback')
        .insert({
          weekly_checkin_id: checkin_id,
          client_id: gate.checkin.client_id,
          coach_id: null, // system-generated, no human coach id
          interpretation: generated.draft.interpretation,
          reframe: generated.draft.reframe,
          next_focus: generated.draft.next_focus,
          auto_generated_at: new Date().toISOString(),
        })
        .select('id, approval_token')
        .single()
      if (error) throw new Error(`feedback insert failed: ${error.message}`)
      return { id: data.id, approvalToken: data.approval_token as string }
    })

    // ── Step 4b: email Kade the [Approve] preview ──────────────────────
    // 2026-06-15: this email is now THE gate on whether the client ever
    // hears back. It carries the client's full check-in answers + the
    // AI-drafted response + an Approve & Send button. No auto-send,
    // no 4h sleep — Kade's click is the only path to delivery (other
    // than the dashboard Send-now button, which still works).
    //
    // Per feedback_preview_new_emails: auto-triggered Inngest sends to
    // the client must surface to Kade before they reach the client. The
    // new gate makes that absolute.
    //
    // Best-effort: a preview-send failure must NEVER abort the worker.
    // If it fails, the feedback row + approval token are still in the
    // DB and Kade can act via the dashboard.
    await step.run('email-coach-approval-preview', async () => {
      try {
        const { buildWeeklyCheckinDraftPreviewEmail } = await import('@/lib/weekly-checkin-draft-preview-email')
        const { appUrlFor } = await import('@/lib/app-url')
        const { FORM_A_SECTIONS, FORM_B_SECTIONS } = await import('@/lib/weekly-checkin-questions')

        const admin = createAdminClient()
        const { data: checkinRow } = await admin
          .from('weekly_checkins')
          .select('responses, form_type')
          .eq('id', checkin_id)
          .maybeSingle()

        const responses = (checkinRow?.responses ?? {}) as Record<string, string>
        const sections = (checkinRow?.form_type === 'B' ? FORM_B_SECTIONS : FORM_A_SECTIONS)
          .map(section => ({
            title: section.title,
            items: section.questions
              .map(q => ({ label: q.text, value: (responses[q.id] ?? '').toString() }))
              .filter(item => item.value.trim().length > 0),
          }))
          .filter(s => s.items.length > 0)

        const firstName = (gate.clientName ?? 'Client').split(' ')[0]
        const dashboardUrl = appUrlFor(`/dashboard/clients/${gate.checkin.client_id}#weekly-checkins`)
        const approveUrl = appUrlFor(`/api/coach/approve-checkin-response?token=${inserted.approvalToken}`)
        const { subject, html } = buildWeeklyCheckinDraftPreviewEmail({
          clientFirstName: firstName,
          weekNumber: gate.checkin.week_number,
          formType: gate.checkin.form_type as 'A' | 'B',
          interpretation: generated.draft.interpretation,
          reframe: generated.draft.reframe,
          nextFocus: generated.draft.next_focus,
          approveUrl,
          dashboardUrl,
          checkinSections: sections,
        })

        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: `Body Recode Platform <${coach().email}>`,
          to: coach().email,
          subject,
          html,
        })
        return { ok: true }
      } catch (err) {
        console.error('Approval preview email failed (non-blocking):', err)
        return { ok: false, error: err instanceof Error ? err.message : String(err) }
      }
    })

    // No more sleepUntil + send-or-skip. The approval endpoint at
    // /api/coach/approve-checkin-response handles delivery from here.
    return { ok: true, checkin_id }
  }
)

// ─── Weekly Pattern Report Sequence ───────────────────────────────────────────
// Fired by the Stripe webhook when a Member buys the Weekly Pattern Report
// product (engine_call='weekly_pattern_report'). Delivers 4 reports at 7-day
// intervals using the SAME orchestrator as one-shot deep-dives.
//
// Each delivery creates a CHILD digital_asset_purchases row (synthetic
// stripe_session_id, links back to the parent in raw.parent_purchase_id) so
// each report's PDF + status lives independently. The parent purchase tracks
// the subscription, the children are the deliveries.
//
// Maximum lifespan 4 weeks - Inngest holds sleeps across that span natively.
export const weeklyPatternReportSequenceFunction = inngest.createFunction(
  {
    id: 'weekly-pattern-report-sequence',
    retries: 3,
    triggers: [{ event: 'digital_asset/weekly_pattern_purchased' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { parent_purchase_id, product_id, email } = event.data as {
      parent_purchase_id: string
      product_id: string
      email: string
    }

    for (let week = 1; week <= 4; week++) {
      if (week > 1) {
        // Inngest holds sleeps across the function lifetime; no in-process cost.
        await step.sleep(`wait-week-${week}`, '7d')
        await alignToNextMorningAEST(step, `wait-week-${week}-morning`)
      }
      await step.run(`deliver-week-${week}`, async () => {
        const admin = createAdminClient()

        // Idempotency: if delivery N already exists for this parent, skip.
        const { data: existing } = await admin
          .from('digital_asset_purchases')
          .select('id')
          .eq('stripe_session_id', `wpr_${parent_purchase_id}_${week}`)
          .maybeSingle()
        if (existing) return { skipped: true, reason: 'already-delivered', week }

        const { data: child, error: childErr } = await admin
          .from('digital_asset_purchases')
          .insert({
            client_id: null,
            email_at_purchase: email.toLowerCase(),
            product_id,
            stripe_payment_id: null,
            stripe_session_id: `wpr_${parent_purchase_id}_${week}`,
            status: 'paid',
            source: 'weekly_pattern_sequence',
            raw: { parent_purchase_id, delivery_number: week },
          })
          .select('id')
          .single()
        if (childErr || !child) {
          throw new Error(`Failed to create child purchase for week ${week}: ${childErr?.message}`)
        }

        const { fulfilInstantEngine } = await import('@/lib/instant-engine-fulfilment')
        await fulfilInstantEngine(child.id)
        return { delivered: true, week, child_purchase_id: child.id }
      })
    }

    // Mark the parent as completed once all four deliveries are done.
    await step.run('mark-parent-completed', async () => {
      const admin = createAdminClient()
      await admin
        .from('digital_asset_purchases')
        .update({ status: 'completed', fulfilled_at: new Date().toISOString() })
        .eq('id', parent_purchase_id)
    })

    return { ok: true, parent_purchase_id }
  }
)

// ── IG publisher cron ───────────────────────────────────────────────
// Every 5 minutes, find Body Recode IG posts that are due to publish
// (scheduled_publish_at <= now, not yet posted, brand=body_recode,
// platform=instagram, type != story, attempts < 3) and fire the immediate
// publishToInstagram() path. Replaces Meta's broken scheduled_publish_time
// API which gate-keeps Dev-mode apps on an undocumented whitelist.
//
// See `project_instagram_native_publishing` for the why.
export const igPublisherCron = inngest.createFunction(
  {
    id: 'ig-publisher-cron',
    name: 'IG publisher cron · publish due posts',
    triggers: [{ cron: '*/5 * * * *' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ step }: { step: any }) => {
    const admin = createAdminClient()

    const dueRows = await step.run('find-due-posts', async () => {
      const nowIso = new Date().toISOString()
      const { data, error } = await admin
        .from('calendar_posts')
        .select('id, title, caption, graphic, publish_attempts')
        .eq('brand', 'body_recode')
        .eq('platform', 'instagram')
        .neq('type', 'story')
        .is('posted_at', null)
        .not('scheduled_publish_at', 'is', null)
        .lte('scheduled_publish_at', nowIso)
        .or('publish_attempts.is.null,publish_attempts.lt.3')
        .limit(20) // safety cap per tick; large backlogs catch up on subsequent ticks
      if (error) throw new Error(`Find due posts failed: ${error.message}`)
      return (data ?? []) as Array<{ id: string; title: string; caption: string | null; graphic: string | null; publish_attempts: number | null }>
    })

    if (!dueRows.length) {
      return { processed: 0, message: 'No due posts.' }
    }

    const { publishToInstagram } = await import('@/lib/instagram-publish')
    const { appendBrFooter } = await import('@/lib/br-post-footer')
    const { appUrl } = await import('@/lib/app-url')

    type RowResult = { id: string; title: string; ok: boolean; postUrl?: string | null; error?: string }
    const results: RowResult[] = []

    for (const row of dueRows) {
      // Process each row in its own step so retries/replays stay clean
      const result = await step.run(`publish-${row.id}`, async (): Promise<RowResult> => {
        try {
          // Validate inputs
          const rawGraphic = (row.graphic ?? '').trim()
          if (!rawGraphic) {
            await admin.from('calendar_posts').update({
              publish_error: '[validate] graphic_missing',
              publish_attempts: (row.publish_attempts ?? 0) + 1,
            }).eq('id', row.id)
            return { id: row.id, title: row.title, ok: false, error: 'graphic_missing' }
          }
          const imageUrls: string[] = rawGraphic.split(',').map((s: string) => s.trim()).filter(Boolean).map((u: string) => {
            if (u.startsWith('http://') || u.startsWith('https://')) return u
            if (u.startsWith('/')) return `${appUrl()}${u}`
            return u
          })
          if (imageUrls.some((u: string) => u.includes('/api/content/graphic'))) {
            await admin.from('calendar_posts').update({
              publish_error: '[validate] live_render_unsupported',
              publish_attempts: (row.publish_attempts ?? 0) + 1,
            }).eq('id', row.id)
            return { id: row.id, title: row.title, ok: false, error: 'live_render_unsupported' }
          }
          const caption = (row.caption ?? '').trim()
          if (!caption) {
            await admin.from('calendar_posts').update({
              publish_error: '[validate] caption_missing',
              publish_attempts: (row.publish_attempts ?? 0) + 1,
            }).eq('id', row.id)
            return { id: row.id, title: row.title, ok: false, error: 'caption_missing' }
          }

          await admin.from('calendar_posts').update({
            publish_attempts: (row.publish_attempts ?? 0) + 1,
            publish_error: null,
          }).eq('id', row.id)

          // Fire (immediate path - no scheduled_publish_time -> no Meta whitelist gate)
          const r = await publishToInstagram({ imageUrls, caption: appendBrFooter(caption) })

          if (!r.ok) {
            await admin.from('calendar_posts').update({
              publish_error: `[${r.stage}] ${r.error}`,
            }).eq('id', row.id)
            return { id: row.id, title: row.title, ok: false, error: `${r.stage}: ${r.error}` }
          }

          await admin.from('calendar_posts').update({
            ig_container_id: r.containerId,
            ig_post_id: r.postId,
            ig_post_url: r.postUrl,
            posted_at: new Date().toISOString(),
            scheduled_publish_at: null,
            publish_error: null,
          }).eq('id', row.id)

          return { id: row.id, title: row.title, ok: true, postUrl: r.postUrl ?? null }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          await admin.from('calendar_posts').update({
            publish_error: `[exception] ${msg}`,
            publish_attempts: (row.publish_attempts ?? 0) + 1,
          }).eq('id', row.id)
          return { id: row.id, title: row.title, ok: false, error: msg }
        }
      })
      results.push(result)
    }

    const sent = results.filter(r => r.ok).length
    const failed = results.filter(r => !r.ok).length
    return { processed: results.length, sent, failed, results }
  }
)

// ── Speed-to-lead SMS ────────────────────────────────────────────────
// Contact-within-60s pipeline. Fires an SMS as soon as a lead completes
// the scorecard or enrols in the Challenge, respecting Aussie Spam Act
// consent + AEST send-window rules. Reads sms_opt_in_at / sms_opted_out_at
// on the lead; caps at 1 SMS per lead per 24h + 3 per week.
//
// See project_speed_to_lead_sms + feedback_ship_checklist for the ops rules.

async function processSpeedToLeadStep(
  leadId: string,
  trigger: 'scorecard_completed' | 'challenge_enrolled' | 'waitlist_joined' | 'purchase_report' | 'noshow_reminder',
  bookingUrl: string | undefined,
  step: {
    run: <T>(id: string, fn: () => Promise<T>) => Promise<T>
    sleepUntil: (id: string, at: Date) => Promise<void>
  },
  extra?: { productName?: string },
): Promise<{ ok: boolean; reason?: string; error?: string; sendAt?: string }> {
  const { computeSendAt } = await import('@/lib/sms-send-window')
  const { sendLeadSms } = await import('@/lib/speed-to-lead-sms')
  const { tplScorecardCompleted, tplChallengeEnrolled, tplWaitlistJoined, tplPurchaseReport, tplNoShowReminder } = await import('@/lib/sms-templates')

  const scheduled = await step.run('compute-send-at', async () => {
    return computeSendAt(new Date(), trigger).toISOString()
  })
  await step.sleepUntil(`wait-for-send-window-${leadId}`, new Date(scheduled))

  const admin = createAdminClient()
  const { data: lead } = await admin
    .from('leads')
    .select('id, name, sms_opt_in_at, sms_opted_out_at')
    .eq('id', leadId)
    .maybeSingle()
  if (!lead) return { ok: false, reason: 'lead_not_found' }
  const firstName = lead.name?.split(' ')[0] ?? null

  const body =
    trigger === 'scorecard_completed'
      ? tplScorecardCompleted({ firstName, bookingUrl })
      : trigger === 'challenge_enrolled'
        ? tplChallengeEnrolled({ firstName })
        : trigger === 'waitlist_joined'
          ? tplWaitlistJoined({ firstName, productName: extra?.productName })
          : trigger === 'purchase_report'
            ? tplPurchaseReport({ firstName, bookingUrl })
            : tplNoShowReminder({ firstName, bookingUrl })

  const result = await step.run(`send-${leadId}`, async () => sendLeadSms({ leadId, trigger, body }))
  return { ok: result.ok, reason: result.ok ? undefined : result.reason, error: result.ok ? undefined : result.error, sendAt: scheduled }
}

export const speedToLeadScorecardFunction = inngest.createFunction(
  {
    id: 'speed-to-lead-scorecard',
    name: 'Speed-to-lead · scorecard SMS',
    retries: 2,
    triggers: [{ event: 'scorecard/completed' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: { data: { leadId: string; bookingUrl?: string } }; step: any }) => {
    const { leadId, bookingUrl } = event.data
    return processSpeedToLeadStep(leadId, 'scorecard_completed', bookingUrl, step)
  },
)

export const speedToLeadChallengeFunction = inngest.createFunction(
  {
    id: 'speed-to-lead-challenge',
    name: 'Speed-to-lead · challenge SMS',
    retries: 2,
    triggers: [{ event: 'challenge/enrolled' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: { data: { leadId?: string; token?: string } }; step: any }) => {
    const { leadId } = event.data
    if (!leadId) return { ok: false, reason: 'no_lead_id' }
    return processSpeedToLeadStep(leadId, 'challenge_enrolled', undefined, step)
  },
)

export const speedToLeadWaitlistFunction = inngest.createFunction(
  {
    id: 'speed-to-lead-waitlist',
    name: 'Speed-to-lead · waitlist SMS',
    retries: 2,
    triggers: [{ event: 'waitlist/joined' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: { data: { leadId?: string; productName?: string } }; step: any }) => {
    const { leadId, productName } = event.data
    if (!leadId) return { ok: false, reason: 'no_lead_id' }
    return processSpeedToLeadStep(leadId, 'waitlist_joined', undefined, step, { productName })
  },
)

export const speedToLeadPurchaseFunction = inngest.createFunction(
  {
    id: 'speed-to-lead-purchase',
    name: 'Speed-to-lead · report purchase SMS',
    retries: 2,
    triggers: [{ event: 'purchase/report' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: { data: { leadId?: string; bookingUrl?: string } }; step: any }) => {
    const { leadId, bookingUrl } = event.data
    if (!leadId) return { ok: false, reason: 'no_lead_id' }
    return processSpeedToLeadStep(leadId, 'purchase_report', bookingUrl, step)
  },
)

// No-show reminder. Fires on booking/scheduled, sleeps until scheduled + 30 min,
// checks if the lead status is still zoom_1_booked (i.e. coach has not marked
// the call as completed or no-show). If yes, sends the no-show SMS.
// ── Partner Active Client Counter (monthly cron) ────────────────────
// Runs on the 1st of each month at 22:00 UTC (08:00 AEST). For every tenant
// with licence.partnerBilling set, computes the previous month's Active
// Client count and upserts into partner_active_client_counts. Kade reads
// these on the admin dashboard to invoice partners.
export const partnerActiveClientCounterCron = inngest.createFunction(
  {
    id: 'partner-active-client-counter',
    name: 'Partner active-client counter · monthly',
    retries: 2,
    triggers: [{ cron: '0 22 1 * *' }], // 22:00 UTC on the 1st = 08:00 AEST on the 1st
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ step }: { step: any }) => {
    const { computeActiveClientCount, upsertActiveClientCount, monthStartIso } = await import('@/lib/partner-billing')

    const admin = createAdminClient()

    // Compute the previous month's start (the month we're now billing for)
    const now = new Date()
    const prevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    const monthStart = monthStartIso(prevMonth)

    const tenants = await step.run('fetch-billable-tenants', async () => {
      const { data } = await admin
        .from('tenant_config')
        .select('licence')
        .not('licence->partnerBilling', 'is', null)
      const rows = (data ?? []) as Array<{ licence: { tenantId: string; partnerBilling: unknown } }>
      return rows
        .filter((r) => r.licence?.partnerBilling)
        .map((r) => r.licence.tenantId)
    })

    const results: Array<{ tenantId: string; count: number; error?: string }> = []
    for (const tenantId of tenants) {
      try {
        const count = await step.run(`count-${tenantId}`, async () => computeActiveClientCount(tenantId, monthStart))
        await step.run(`persist-${tenantId}`, async () => upsertActiveClientCount(tenantId, monthStart, count))
        results.push({ tenantId, count })
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        results.push({ tenantId, count: 0, error: msg })
      }
    }

    return { processed: results.length, monthStart, results }
  },
)

export const speedToLeadNoShowFunction = inngest.createFunction(
  {
    id: 'speed-to-lead-noshow',
    name: 'Speed-to-lead · no-show SMS',
    retries: 2,
    triggers: [{ event: 'booking/scheduled' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: { data: { leadId?: string; scheduledAt?: string } }; step: any }) => {
    const { leadId, scheduledAt } = event.data
    if (!leadId || !scheduledAt) return { ok: false, reason: 'missing_data' }

    // Sleep until scheduled_at + 30 minutes
    const noShowCheckAt = new Date(new Date(scheduledAt).getTime() + 30 * 60 * 1000)
    await step.sleepUntil(`wait-for-noshow-check-${leadId}`, noShowCheckAt)

    // Check lead status. If moved on (completed / closed_no_show / advanced),
    // do nothing. Only fire the SMS if status is still zoom_1_booked.
    const admin = createAdminClient()
    const stillBooked = await step.run('check-status', async () => {
      const { data: lead } = await admin
        .from('leads')
        .select('status')
        .eq('id', leadId)
        .maybeSingle()
      return lead?.status === 'zoom_1_booked' || lead?.status === 'zoom_booked'
    })

    if (!stillBooked) return { ok: false, reason: 'coach_handled_or_advanced' }

    return processSpeedToLeadStep(leadId, 'noshow_reminder', undefined, step)
  },
)

// ─── Booking Agent Sequence ──────────────────────────────────────────────────
// Adapts Brian Mark's "0 to $100K/month" outreach into the BR system: for a
// scorecard lead who hasn't booked a call, draft a short series of branded
// touches toward a booked strategy call, then STOP the moment they book.
//
// Option A: every touch is DRAFTED for Kade's approval (see draftTouch) — this
// function never sends. Between touches it re-checks that the lead is still
// eligible, so it winds itself down as soon as they book, opt out, or Kade
// pauses/takes over the conversation.
export const bookingAgentSequenceFunction = inngest.createFunction(
  {
    id: 'booking-agent-sequence',
    retries: 2,
    // One run per lead — a re-enrol for an already-running lead is ignored.
    concurrency: [{ key: 'event.data.leadId', limit: 1 }],
    triggers: [{ event: 'booking-agent/start' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { leadId } = event.data as { leadId: string }
    if (!leadId) return { ok: false, reason: 'no_lead' }

    for (const touch of EMAIL_SEQUENCE) {
      // Wait out this touch's delay (from enrolment for touch 1, else from the
      // previous touch).
      await step.sleep(`wait-${touch.key}`, touch.delay)

      // Stop-check: has the lead booked, gone inactive, or been paused by Kade?
      const stop = await step.run(`stop-check-${touch.key}`, async () => {
        const admin = createAdminClient()
        const { data: lead } = await admin
          .from('leads')
          .select('status, active, booking_agent_state')
          .eq('id', leadId)
          .maybeSingle()
        if (!lead) return true
        if (lead.active === false) return true
        if (lead.booking_agent_state !== 'active') return true
        return BOOKING_AGENT_STOP_STATUSES.has(lead.status)
      })
      if (stop) return { ok: true, stoppedAt: touch.key }

      // Draft the touch into the approval queue (no send).
      await step.run(`draft-${touch.key}`, async () => {
        const { draftTouch } = await import('./booking-agent/draft-touch')
        return draftTouch(leadId, touch)
      })
    }

    // Sequence exhausted with no booking — mark the agent done so it won't be
    // re-checked, and leave the lead for Kade / re-engagement flows.
    await step.run('mark-done', async () => {
      const admin = createAdminClient()
      await admin.from('leads').update({ booking_agent_state: 'done' }).eq('id', leadId)
    })

    return { ok: true, completed: true }
  },
)
