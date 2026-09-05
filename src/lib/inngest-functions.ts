import { inngest } from './inngest'
import { createAdminClient } from './supabase/admin'
import { nextMorningAEST } from './aest-morning'
import { decodeFirstMorning } from './decode-days'
import { Resend } from 'resend'
import { sendSms, formatPhone } from './twilio'
import { darkEmailSignature } from './email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailFeaturedCard, emailNumberedList, emailStatusCard,
} from './email-shell'
import type { TriggerContext } from './automation-engine'
import { appUrl, marketingUrl } from '@/lib/app-url'
import { logLeadEvent } from './log-lead-event'
import { legacyLetterToSlug } from './pattern-mapping'
import { CHECKIN_PATTERNS } from './checkin-patterns'
import {
  buildDay14BodyDecodeReportEmail,
  buildDay5UnlockEmail,
  buildDay14FallbackEmail,
  buildDay7CheckInPromptEmail,
  buildCheckInReminderEmail,
  buildDay21FeedbackEmail,
  buildDayZeroIntakeReminderEmail,
  buildFormsReminderEmail,
} from './challenge-checkin-emails'
import {
  buildBlueprintCheckinPromptEmail,
  buildBlueprintCheckinReminderEmail,
  buildBlueprintWeekEmail,
  buildBlueprintWeek7FollowupEmail,
} from './blueprint-emails'
import { fromCoach, fromBrand } from '@/lib/email-shell'
import { sendMarketingEmail } from '@/lib/marketing-email'
import {
  buildDecodeDayEmail, buildDecodeQuestionsNudgeEmail,
  DECODE_SMS, DECODE_SMS_QUESTIONS_NUDGE,
} from '@/lib/decode-daily-emails'
import { coach, logoUrl, brand } from '@/config/tenant'
import {
  buildMembershipCheckinPromptEmail,
  buildMembershipCheckinReminderEmail,
} from './membership-emails'
import { buildExtensionWeekEmail } from './extension-emails'
import { EMAIL_SEQUENCE, STOP_STATUSES as BOOKING_AGENT_STOP_STATUSES } from './booking-agent/sequence'
import { buildPrepFormReminderEmail } from './booking-emails'
import { buildDormantReadEmail, buildDormantSms, buildDormantOfferEmail } from './dormant-lead-emails'

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
  7: `Day 7 %FIRST%. End of Week 1. Your Body Decode Check-In is open - 10 taps, about a minute. It's the one thing your Day 14 pattern read is built from: %URL%`,
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
  7: `Quick check %FIRST%. Have you done your Body Decode Check-In yet? It's 10 taps, about a minute, nothing to type - and it's what unlocks your Day 14 pattern read. Portal: %URL%`,
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

// ─── Challenge Check-In Prompt Function ──────────────────────────────────────
//
// Added 2026-08-03. The Body Decode Check-In gates the entire Day 14 pattern
// reveal, but nothing in the email arc ever asked for it - only two SMS on
// Day 7. Completion sat at 2/28 (7%) against 21/28 (75%) for the Day 0 intake,
// so 17 of the 18 people who finished got the no-result fallback at Day 14
// instead of the Body Decode Report (and therefore never saw the Blueprint
// pitch that converts).
//
// Deliberately a SEPARATE function rather than extra steps inside
// challenge-sequence. Inngest has no memoised result for a newly-added step
// id, so inserting sleeps into a function with runs already in flight would
// make every mid-challenge run execute the new sleeps on its next replay and
// push its Day 14 email out by the combined duration. A new function only ever
// starts on new `challenge/enrolled` events, so in-flight participants are
// untouched. Anyone mid-challenge right now is handled by a one-off send
// instead (scripts/send-checkin-catchup.ts).
export const challengeCheckinPromptFunction = inngest.createFunction(
  {
    id: 'challenge-checkin-prompt',
    retries: 2,
    triggers: [{ event: 'challenge/enrolled' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    // Challenge-only. /decode posts to the same enrol route and fires the same
    // event, so without this a Body Decode signup would receive the entire
    // 14-day Challenge arc on top of her own. See the `product` field on
    // /api/challenge/enroll.
    if ((event.data as { product?: string }).product === 'decode') return

    const { token, email, firstName } = event.data as {
      token: string
      email: string
      firstName: string
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Returns null when the prompt should be skipped: enrollment gone,
    // no longer active, or the Check-In is already done. Also returns the
    // lead id so the send can be logged against the lead's timeline.
    async function shouldSend(stepId: string): Promise<{ send: boolean; leadId: string | null }> {
      return await step.run(stepId, async () => {
        const admin = createAdminClient()
        const { data } = await admin
          .from('challenge_enrollments')
          .select('status, quiz_completed_at, lead_id')
          .eq('token', token)
          .single()
        if (!data || data.status !== 'active') return { send: false, leadId: null }
        return { send: !data.quiz_completed_at, leadId: data.lead_id ?? null }
      })
    }

    // ── Day 7: the Check-In unlocks ───────────────────────────────────────
    await step.sleep('checkin-wait-to-day-7', '6d')
    await alignToNextMorningAEST(step, 'checkin-day-7-morning')

    const day7 = await shouldSend('checkin-day-7-should-send')
    if (day7.send) {
      await step.run('send-day7-checkin-prompt', async () => {
        const built = buildDay7CheckInPromptEmail({ firstName, token })
        const sent = await resend.emails.send({
          from: fromCoach(),
          to: email,
          subject: built.subject,
          html: built.html,
        })
        // Log it. Without this there is no way to distinguish "ignored the
        // prompt" from "never received one", which is exactly the ambiguity
        // that made the 3-of-29 Check-In figure unreadable.
        if (day7.leadId) {
          await logLeadEvent({
            leadId: day7.leadId,
            type: 'challenge_checkin_prompt_sent',
            subject: built.subject,
            resendEmailId: sent.data?.id ?? undefined,
            notes: 'Day 7 Body Decode Check-In prompt',
          })
        }
      })
    }

    // ── Day 11: reminder, non-completers only ─────────────────────────────
    await step.sleep('checkin-wait-to-day-11', '4d')
    await alignToNextMorningAEST(step, 'checkin-day-11-morning')

    const day11 = await shouldSend('checkin-day-11-should-send')
    if (day11.send) {
      await step.run('send-day11-checkin-reminder', async () => {
        const built = buildCheckInReminderEmail({ firstName, token, daysLeft: 3 })
        const sent = await resend.emails.send({
          from: fromCoach(),
          to: email,
          subject: built.subject,
          html: built.html,
        })
        if (day11.leadId) {
          await logLeadEvent({
            leadId: day11.leadId,
            type: 'challenge_checkin_reminder_sent',
            subject: built.subject,
            resendEmailId: sent.data?.id ?? undefined,
            notes: 'Day 11 Check-In reminder, non-completers only',
          })
        }
      })
    }
  }
)

// ─── Challenge Sequence Function ─────────────────────────────────────────────

export const challengeSequenceFunction = inngest.createFunction(
  {
    id: 'challenge-sequence',
    retries: 2,
    triggers: [{ event: 'challenge/enrolled' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    // Challenge-only. /decode posts to the same enrol route and fires the same
    // event, so without this a Body Decode signup would receive the entire
    // 14-day Challenge arc on top of her own. See the `product` field on
    // /api/challenge/enroll.
    if ((event.data as { product?: string }).product === 'decode') return

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

      // Pass the pattern through so the win-back can reference their read.
      // The sequence has always had a patternNote line ready for this, but the
      // trigger never sent patternLabel, so it rendered blank for everyone -
      // including people who had just been given a full Body Decode Report.
      const { data: read } = await admin
        .from('challenge_enrollments')
        .select('quiz_result')
        .eq('token', token)
        .maybeSingle()
      const patternLabel = read?.quiz_result
        ? CHECKIN_PATTERNS[legacyLetterToSlug(read.quiz_result as string)]?.label ?? null
        : null

      await inngest.send({
        name: 'reengagement/challenge-no-ascension',
        data: { email, firstName, phone: phone ?? null, source: 'challenge', patternLabel },
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
    // Challenge-only. /decode posts to the same enrol route and fires the same
    // event, so without this a Body Decode signup would receive the entire
    // 14-day Challenge arc on top of her own. See the `product` field on
    // /api/challenge/enroll.
    if ((event.data as { product?: string }).product === 'decode') return

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

// ─── PAR-Q + Health Declaration Reminder ─────────────────────────────────────
//
// Added 2026-08-14. The Challenge has TWO gates and only the first was chased.
// The Day 0 intake opens the portal; the PAR-Q and Health Declaration then gate
// training and nutrition. Five of the twenty-four participants with portal
// access were stuck behind that second gate with no follow-up of any kind -
// inside a fitness programme, unable to see the fitness. None of them reached
// the Day 7 Check-In.
//
// Deliberately a separate function rather than extra steps in the intake
// reminder: the two gates are cleared independently and at different times, so
// one sequence cannot express both without the guards fighting each other.
//
// Timed at 2 and 4 days so both land BEFORE Day 5, when the Week One Progress
// Session unlocks and a locked training plan starts costing real content.
export const challengeFormsReminderFunction = inngest.createFunction(
  {
    id: 'challenge-forms-reminder',
    retries: 2,
    triggers: [{ event: 'challenge/enrolled' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    // Challenge-only. /decode posts to the same enrol route and fires the same
    // event, so without this a Body Decode signup would receive the entire
    // 14-day Challenge arc on top of her own. See the `product` field on
    // /api/challenge/enroll.
    if ((event.data as { product?: string }).product === 'decode') return

    const { leadId, token, email, firstName } = event.data as {
      leadId: string
      token: string
      email: string
      firstName: string
    }

    const portalUrl = `${brand().marketingDomain}/challenge/${token}`
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Only chase people who cleared gate one. Someone still stuck on the Day 0
    // intake is already being chased by challenge-intake-reminder, and two
    // sequences nagging about different forms on the same days reads as spam.
    const stillNeedsForms = async (stepId: string): Promise<boolean> =>
      step.run(stepId, async () => {
        const admin = createAdminClient()
        const { data } = await admin
          .from('challenge_enrollments')
          .select('status, body_decode_intake_completed_at, parq_completed_at, health_dec_completed_at')
          .eq('token', token)
          .single()
        if (!data || data.status !== 'active') return false
        if (!data.body_decode_intake_completed_at) return false
        return !(data.parq_completed_at && data.health_dec_completed_at)
      })

    const sendFormsSms = async (stepId: string, body: string): Promise<void> => {
      await step.run(stepId, async () => {
        const { sendLeadSms } = await import('@/lib/speed-to-lead-sms')
        await sendLeadSms({ leadId, trigger: 'challenge_enrolled', body })
      })
    }

    // ── Nudge 1: ~2 days in ────────────────────────────────────────────
    await step.sleep('forms-reminder-1-wait', '2d')
    await alignToNextMorningAEST(step, 'forms-reminder-1-morning')

    if (await stillNeedsForms('forms-reminder-1-check')) {
      await step.run('send-forms-reminder-1', async () => {
        const built = buildFormsReminderEmail({ firstName, portalUrl, second: false })
        await resend.emails.send({ from: fromCoach(), to: email, subject: built.subject, html: built.html })
      })
      await sendFormsSms(
        'send-forms-reminder-1-sms',
        `${firstName}, your read is done but your training plan is still locked. It is a 12-tap health screen, nothing to type: ${portalUrl}`,
      )
    }

    // ── Nudge 2: ~4 days in, still before Day 5 ────────────────────────
    await step.sleep('forms-reminder-2-wait', '2d')
    await alignToNextMorningAEST(step, 'forms-reminder-2-morning')

    if (await stillNeedsForms('forms-reminder-2-check')) {
      await step.run('send-forms-reminder-2', async () => {
        const built = buildFormsReminderEmail({ firstName, portalUrl, second: true })
        await resend.emails.send({ from: fromCoach(), to: email, subject: built.subject, html: built.html })
      })
      await sendFormsSms(
        'send-forms-reminder-2-sms',
        `${firstName}, your Week One session lands tomorrow and your training is still locked. 12 taps clears it: ${portalUrl}`,
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
// MOVED to src/lib/aest-morning.ts so the Body Decode day gate can share it.
// Read the header there: two copies of this cadence is what let the page and
// the emails drift a day apart.

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
    // Challenge-only. /decode posts to the same enrol route and fires the same
    // event, so without this a Body Decode signup would receive the entire
    // 14-day Challenge arc on top of her own. See the `product` field on
    // /api/challenge/enroll.
    if ((event.data as { product?: string }).product === 'decode') return

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
      // Check enrollment still active before each day's messages. Returns the
      // lead id too so every send below is attributable in sms_logs - day 7 in
      // particular, which is the only nudge asking for the Check-In.
      const gate = await step.run(`sms-check-active-day${day}`, async () => {
        const admin = createAdminClient()
        const { data } = await admin
          .from('challenge_enrollments')
          .select('status, lead_id')
          .eq('token', token)
          .single()
        return { active: data?.status === 'active', leadId: (data?.lead_id as string | null) ?? null }
      })
      if (!gate.active) return

      // Morning portal nudge
      await step.run(`sms-day${day}-morning`, async () => {
        const msg = renderSms(SMS_MORNING[day], firstName, portalUrl)
        await sendSms({ to: formattedPhone, message: msg, leadId: gate.leadId, trigger: `challenge_day${day}_morning` })
      })

      const afternoonBoost = SMS_AFTERNOON_BOOST[day]
      if (afternoonBoost) {
        // ~8h after morning for the boost, so early afternoon.
        await step.sleep(`sms-day${day}-afternoon-wait`, '8h')
        await step.run(`sms-day${day}-afternoon`, async () => {
          const msg = renderSms(afternoonBoost, firstName, portalUrl)
          await sendSms({ to: formattedPhone, message: msg, leadId: gate.leadId, trigger: `challenge_day${day}_afternoon` })
        })
      }

      // Re-anchor to 7am Brisbane for the next day rather than adding 16h or
      // 24h to wherever this day happened to finish.
      //
      // Fixed 2026-08-12. The old cascade anchored once on Day 1 and then added
      // fixed sleeps for thirteen days. Every retry, every queue delay and every
      // few seconds of step execution pushed the whole sequence later, and it
      // never corrected. Participants were getting "morning" nudges through the
      // afternoon by the back half of the Challenge. Re-anchoring each day means
      // drift cannot accumulate: worst case one day is late, the next is right.
      if (day < 14) {
        await alignToNextMorningAEST(step, `sms-day${day}-next-morning`)
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
        // BCC the coach, per feedback_bcc_kade_on_client_sends.
        //
        // Added 2026-08-17. These drip emails were the one prospect-facing send
        // path with no coach copy, which is how a duplicate sequence emailed
        // six leads twice a touch for three weeks without Kade seeing a single
        // one of them. A silent copy is the cheapest possible detector: the
        // same message arriving twice in your own inbox is unmissable, and no
        // dashboard or log has to be checked for it to be noticed.
        bcc: [coach().email],
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
        // Monotonic. /api/cron/funnel-week-advance recomputes the week owed
        // from purchase_date every morning and is the primary writer; this run
        // is the second one. Whichever gets there first wins, and neither may
        // move a client backwards - the old `!== week - 1` also let a run that
        // resumed behind the cron drag the portal back a week.
        if (data.current_week >= week) return

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
          // Monotonic, same reason as the Blueprint loop. Without this a
          // resumed run could pull a member back to an earlier week of the
          // block the cron had already carried them past.
          if ((data.current_week ?? 1) >= week) return

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

          // membership_checkins stores an ABSOLUTE week (Block A 1-6, B 7-12,
          // C 13-18) because the table is unique on (enrollment_id,
          // week_number) with no block column. Looking it up block-relative
          // found Block A's row while chasing Block B's and stayed silent.
          const blockOffset = BLOCKS.indexOf(block) * WEEKS_PER_BLOCK
          const { data: existing } = await admin
            .from('membership_checkins')
            .select('id')
            .eq('enrollment_id', enrollment.id)
            .eq('week_number', blockOffset + completedWeek)
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
        // Monotonic, same reason as the Blueprint loop.
        if (data.current_week >= week) return

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

      // Extension completers are NOT Blueprint completers. This used to fire
      // 'reengagement/blueprint-no-ascension' with source:'blueprint', so
      // someone who had just finished the 90-Day Extension was pitched the
      // 90-Day Extension. Their next rung is the Membership.
      await inngest.send({
        name: 'reengagement/extension-no-ascension',
        data: {
          email,
          firstName,
          source: 'extension',
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
      { event: 'reengagement/extension-no-ascension' },
      { event: 'reengagement/membership-cancelled' },
    ],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { email, firstName, source, patternLabel, phone } = event.data as {
      email: string
      firstName: string
      source: 'challenge' | 'blueprint' | 'extension' | 'membership'
      patternLabel?: string
      phone?: string | null
    }

    const extensionUrl = `${appUrl()}/extension`
    const membershipUrl = `${appUrl()}/membership`
    const blueprintUrl = `${appUrl()}/blueprint`
    const patternNote = patternLabel ? ` Your ${patternLabel} pattern doesn't reset when you stop - it's still there when you come back.` : ''

    // Until 2026-08-03 this sequence pitched every source the same thing from
    // Day 30 onward: the 90-Day Extension, then the Membership. For a Challenge
    // graduate that skipped a whole stage, and the Day 30 copy even opened with
    // "if the weekly membership commitment felt like too much", which they were
    // never offered.
    //
    // Ladder rule (Kade, 2026-08-04): the 90-Day Extension is ONLY for people
    // who did the Blueprint and did not continue into the Membership. It is not
    // an entry product, and it is not a win-back for a lapsed member.
    //   challenge  -> Blueprint. They have not done it, so pitching the
    //                 Extension or Membership skips a whole stage. Blueprint is
    //                 also the only one of the three currently live.
    //   blueprint  -> Extension. Exactly the case the Extension exists for.
    //   membership -> Membership. A lapsed member is already past the Extension;
    //                 the ask is to come back, not to step down a tier.
    const isChallenge = source === 'challenge'
    const OFFERS = {
      challenge: {
        url: blueprintUrl,
        ctaLabel: 'See the Blueprint',
        eyebrow: '6-Week Body Rewire Blueprint',
        price: '$97 one-time',
        card: 'Six weeks of pattern-specific corrective work. Training calibrated to your pattern, nutrition timed to it, weekly coaching written for it. No subscription, no lock-in.',
        nudge: 'The 6-Week Blueprint is still there at $97 if the timing is better now. Six weeks of corrective work built around your pattern, picked up from the baseline you already built.',
        openLine: 'If committing to something ongoing felt like too much, this is the smaller step.',
      },
      blueprint: {
        url: extensionUrl,
        ctaLabel: 'See the Extension',
        eyebrow: '90-Day Body Rewire Extension',
        price: '$197 one-time',
        card: "12 weeks of progressive pattern-specific programming. No subscription, no ongoing commitment. Same portal, same pattern-driven training and nutrition you've already experienced.",
        nudge: 'The 90-Day Extension is still available at $197 if the timing is better now. It gives you 12 weeks of the next stage of programming, picked up exactly where you left off.',
        openLine: "If the weekly membership commitment felt like too much right now, there's another option.",
      },
      // An Extension completer has just done 12 weeks of the thing. Their next
      // rung is the Membership, NOT the Extension they only just finished -
      // which is what they got before 2026-08-04, because extension-week-advance
      // fired the win-back labelled source:'blueprint'.
      extension: {
        url: membershipUrl,
        ctaLabel: 'See the Membership',
        eyebrow: 'Body Recode Membership',
        price: '$49 per week',
        card: 'Progressive six-week blocks built around your pattern, the nutrition precision layer updated each block, a monthly coach review of your check-in data, and the group call. Cancel anytime.',
        nudge: 'The Membership is still open at $49 a week if the timing is better now. It picks up from the base you built across the Extension rather than starting again.',
        openLine: 'You have done twelve weeks of the work. The Membership is what keeps it moving.',
      },
      membership: {
        url: membershipUrl,
        ctaLabel: 'See the Membership',
        eyebrow: 'Body Recode Membership',
        price: '$49 per week',
        card: 'Progressive six-week blocks built around your pattern, the nutrition precision layer updated each block, a monthly coach review of your check-in data, and the group call. Cancel anytime.',
        nudge: 'The Membership is still open at $49 a week if the timing is better now. The same system you were in, picked up from wherever your pattern is today.',
        openLine: 'If you have been thinking about picking the system back up, it is still here.',
      },
    } as const
    const nextOffer = OFFERS[source] ?? OFFERS.blueprint

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
          : source === 'extension'
            ? 'You finished the 90-Day Extension a few days ago.'
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
      const ctx = source === 'challenge' ? 'challenge' : source === 'blueprint' ? 'Blueprint' : source === 'extension' ? 'Extension' : 'membership'
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
      // Three-way for the same reason as OFFERS above: a lapsed member has
      // already been past the Extension, so the consolidation framing is wrong
      // for them.
      const nextStageContext = source === 'challenge'
        ? `The 6-Week Blueprint is where the work you started gets structure and direction. It is built around your biological pattern, not a generic plan.`
        : source === 'blueprint'
          ? `The 90-Day Extension is designed for exactly where you are. You have done the foundation work, and you need time to consolidate it before committing to the full membership.`
          : source === 'extension'
            ? `The Membership is the step after the Extension. Same pattern-driven blocks, but ongoing, with a monthly review of your check-in data rather than a fixed end date.`
            : `The Membership is the same system you were already in. Progressive blocks built around your pattern, updated as it shifts, with no lock-in if the timing changes again.`
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
${emailEyebrow(nextOffer.eyebrow)}
${emailHeading('A lower-commitment way back in.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(nextOffer.openLine, { bottom: 24 })}
${emailStatusCard({
  eyebrow: nextOffer.eyebrow,
  headline: nextOffer.price,
  body: nextOffer.card,
})}
${emailCta({ href: nextOffer.url, label: nextOffer.ctaLabel })}
${emailUrlFallback(nextOffer.url, 'Or paste this link into your browser')}
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
${emailBody(nextOffer.nudge, { bottom: 24 })}
${emailCta({ href: nextOffer.url, label: nextOffer.ctaLabel })}
${emailUrlFallback(nextOffer.url, 'Or paste this link into your browser')}
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
${emailBody(isChallenge
  ? "You have not picked the Blueprint up yet, so here is the whole ladder in one place, plainly."
  : "If you've been thinking about the full membership, here's the short version of what it is:")}
${emailFeaturedCard(
  emailNumberedList([
    'Progressive 6-week training blocks built around your pattern — Block A, B, and C',
    'Nutrition precision layer updated each block',
    'Monthly coach Loom — I review your check-in data and send a personal response',
    'Monthly group Q&amp;A call',
    'Cancel anytime. No lock-in.',
  ]),
  { eyebrow: isChallenge ? 'Where the Blueprint leads · $49 per week' : '$49 per week' },
)}
${emailCta({ href: isChallenge ? blueprintUrl : membershipUrl, label: isChallenge ? 'Start with the Blueprint' : 'See the Membership' })}
${emailUrlFallback(isChallenge ? blueprintUrl : membershipUrl, 'Or paste this link into your browser')}
`),
      })
    })

    // Mirror the Membership offer as an SMS (consent-gated + capped).
    await step.run('sms-day60', async () => {
      await smsLeadByEmail(email, isChallenge
        ? `${firstName}, the 6-Week Blueprint is open if you want to correct the pattern your Challenge read named - $97 one-time, no subscription: ${blueprintUrl}`
        : `${firstName}, the Body Recode Membership is open if you want the full system - progressive blocks built around your pattern, $49/wk, cancel anytime: ${membershipUrl}`)
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
${emailBody(`One other thing. If you know someone who would benefit from any of the Body Recode programmes, send them to <a href="${marketingUrl()}/challenge" style="color:#1B6DFC;font-weight:600;text-decoration:none;">bodyrecode.au/challenge</a>. The challenge is free and a good starting point for anyone.`)}
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
          .select('is_active, trigger_config')
          .eq('id', workflowId)
          .maybeSingle()
        if (!wf) return 'workflow_deleted'
        if (wf.is_active === false) return 'workflow_deactivated'
        if (!ctx.leadId) return null
        const { data } = await admin
          .from('leads')
          .select('converted_to_client_id, status, active, zoom_1_date, biological_sex')
          .eq('id', ctx.leadId)
          .maybeSingle()
        if (!data) return 'lead_deleted'
        if (data.active === false) return 'lead_inactive'
        // A male in the scorecard follow-up sequence is being aimed at The Body
        // Decode, which opens "a free assessment for WOMEN whose bodies have
        // stopped responding". The copy itself is sex-neutral, so this was
        // invisible until a man completed the scorecard on 24 Aug 2026 and got
        // "Why your body has stopped responding" pointing at a page that
        // excludes him in its first line.
        //
        // Scoped to the female sequence by trigger_config, NOT applied to every
        // workflow: the male sequence runs on this same executor and must not
        // stop itself. Sex is only ever 'M' or 'F' or null here (see
        // scorecard/submit), and null keeps the existing behaviour.
        //
        // This is the belt. The braces are in scorecard/submit, which now fires
        // a different trigger for males so they never enter this sequence at
        // all. Both exist because this one also catches anyone ALREADY in
        // flight, which the trigger split cannot do.
        const trigForm = (wf.trigger_config as { form?: string } | null)?.form
        if (trigForm === 'scorecard' && data.biological_sex === 'M') return 'male_wrong_sequence'
        if (data.converted_to_client_id) return 'converted_to_client'
        if (data.status === 'closed_declined') return 'closed_declined'
        // Stop the moment they engage, not only when they convert.
        //
        // Added 2026-08-17. Dee Berry held her discovery call on 13 Aug and then
        // received two more cold-sequence emails — including "Last one from me",
        // which asks her to book a call she had already had. She was neither
        // converted nor declined, so every guard above passed and the drip
        // carried on underneath the conversation.
        //
        // A booked or completed call means the sequence has done its job. Its
        // entire purpose is to get them onto a call; continuing past that point
        // can only make the practice look like it is not paying attention.
        if (data.zoom_1_date) return 'call_booked_or_held'
        // Status, not just the date: Dee's row said zoom_1_completed while
        // zoom_1_date was still null, so a date-only check would have missed
        // exactly the person who prompted this fix.
        const ENGAGED_STATUSES = [
          'zoom_1_booked',
          'zoom_1_completed',
          'zoom_2_booked',
          'commencement_fee_paid',
          'active_coaching',
          'active_deliberate_start',
        ]
        if (typeof data.status === 'string' && ENGAGED_STATUSES.includes(data.status)) {
          return `engaged_${data.status}`
        }
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
        .select('id, title, caption, graphic, publish_attempts, brand')
        .in('brand', ['body_recode', 'personal_brand'])
        .eq('platform', 'instagram')
        // Stories are excluded unless marked story_auto: the API strips
        // stickers, so only the plain-image ones can publish themselves.
        .or('type.neq.story,story_auto.eq.true')
        .is('posted_at', null)
        .not('scheduled_publish_at', 'is', null)
        .lte('scheduled_publish_at', nowIso)
        .or('publish_attempts.is.null,publish_attempts.lt.3')
        .limit(20) // safety cap per tick; large backlogs catch up on subsequent ticks
      if (error) throw new Error(`Find due posts failed: ${error.message}`)
      return (data ?? []) as Array<{ id: string; title: string; caption: string | null; graphic: string | null; publish_attempts: number | null; brand: string | null }>
    })

    if (!dueRows.length) {
      return { processed: 0, message: 'No due posts.' }
    }

    const { publishToInstagram, igAccountConfigured, igAccountHandle } = await import('@/lib/instagram-publish')
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

          // Each brand publishes to its own account. No fallback: if the
          // personal account is not connected the row is left alone with a
          // clear error, because the alternative is Kade's personal posts
          // landing on @body_recode_ in front of the client audience.
          const account = row.brand === 'personal_brand' ? 'personal_brand' as const : 'body_recode' as const
          if (!igAccountConfigured(account)) {
            await admin.from('calendar_posts').update({
              publish_error: `[env] ${igAccountHandle(account)} is not connected - add its token and IG account id to the environment`,
              publish_attempts: (row.publish_attempts ?? 0) + 1,
            }).eq('id', row.id)
            return { id: row.id, title: row.title, ok: false, error: `${igAccountHandle(account)} not connected` }
          }

          await admin.from('calendar_posts').update({
            publish_attempts: (row.publish_attempts ?? 0) + 1,
            publish_error: null,
          }).eq('id', row.id)

          // The BR footer points at @kade_dunstone_, which is right on the brand
          // account and nonsense on the personal one.
          const finalCaption = account === 'body_recode' ? appendBrFooter(caption) : caption
          // Fire (immediate path - no scheduled_publish_time -> no Meta whitelist gate)
          const r = await publishToInstagram({ imageUrls, caption: finalCaption, account })

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
  async ({ event, step }: { event: { data: { leadId?: string; token?: string; product?: string } }; step: any }) => {
    // THE SIXTH LISTENER ON challenge/enrolled, and the one the 24 Aug sweep
    // missed. The other five got this guard; this one did not, because its event
    // type was narrowed to { leadId, token } and `product` was not even visible
    // to read.
    //
    // What it sends is tplChallengeEnrolled: "welcome to the 14-Day Body Decode.
    // Day 1 lands tomorrow morning." Every Body Decode signup with SMS opt-in
    // would have got it, naming a product that no longer exists.
    //
    // Worse than the wording: sendLeadSms caps at one message per 24h, so this
    // would have SUPPRESSED the legitimate Day 1 SMS from decode-daily-arc. The
    // Decode arc sends its own SMS; there is nothing for speed-to-lead to add.
    //
    // It had not fired yet only because no real Decode signup has opted into SMS
    // since the cutover. It would have hit the first one.
    if (event.data.product === 'decode') return { ok: true, reason: 'decode_has_its_own_sms' }
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

// ═══════════════════════════════════════════════════════════════════════════
// Pre-call form chase
// ═══════════════════════════════════════════════════════════════════════════
//
// Fires when a lead requests a call time via /book. Before 2026-08-06 the
// pre-call form link went out exactly once, inside the booking-confirmation
// email, sitting underneath copy whose headline was about their requested time.
// Nothing chased it, the form appeared nowhere else in the product, and nothing
// recorded whether the email had even sent. Leads were turning up to calls with
// no brief.
//
// Two nudges, 24h and 72h, each re-reading the lead's events so anyone who has
// completed the form is never chased. Transactional rather than marketing: they
// asked for the call and this is a step in delivering it. Same carve-out the
// Day 0 intake reminder uses, documented at the top of marketing-email.ts.
export const prepFormReminderFunction = inngest.createFunction(
  {
    id: 'prep-form-reminder',
    retries: 2,
    triggers: [{ event: 'booking/time-requested' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { leadId, email, firstName, prepUrl } = event.data as {
      leadId: string
      email: string
      firstName: string
      prepUrl: string
    }

    if (!leadId || !email || !prepUrl) return { skipped: 'missing data' }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // True while the form is still outstanding. Read fresh each time so the
    // guard is the single source of truth for "do they still need chasing".
    const stillNeedsPrepForm = async (stepId: string): Promise<boolean> =>
      step.run(stepId, async () => {
        const admin = createAdminClient()
        const { data } = await admin
          .from('lead_events')
          .select('id')
          .eq('lead_id', leadId)
          .eq('type', 'prep_form_completed')
          .limit(1)
        return !data || data.length === 0
      })

    const sendNudge = async (stepId: string, second: boolean): Promise<void> => {
      const built = buildPrepFormReminderEmail({ firstName, prepUrl, second })
      const sent = await step.run(stepId, async () => {
        const res = await resend.emails.send({
          from: fromCoach(),
          to: email,
          subject: built.subject,
          html: built.html,
        })
        return { id: res.data?.id ?? null, error: res.error?.message ?? null }
      })
      await step.run(`${stepId}-log`, async () => {
        await logLeadEvent({
          leadId,
          type: 'prep_form_reminder_sent',
          subject: built.subject,
          resendEmailId: sent.id ?? undefined,
          notes: sent.error
            ? `SEND FAILED: ${sent.error}`
            : `Nudge ${second ? 2 : 1} of 2. Pre-call form still outstanding at send time.`,
        })
      })
    }

    // ── Nudge 1: ~24h after the request, realigned to next 7am AEST ──────
    await step.sleep('prep-form-reminder-1-wait', '1d')
    await alignToNextMorningAEST(step, 'prep-form-reminder-1-morning')
    if (await stillNeedsPrepForm('prep-form-reminder-1-check')) {
      await sendNudge('send-prep-form-reminder-1', false)
    }

    // ── Nudge 2: ~72h after the request, firmer copy ─────────────────────
    await step.sleep('prep-form-reminder-2-wait', '2d')
    await alignToNextMorningAEST(step, 'prep-form-reminder-2-morning')
    if (await stillNeedsPrepForm('prep-form-reminder-2-check')) {
      await sendNudge('send-prep-form-reminder-2', true)
    }

    return { leadId }
  },
)

// ═══════════════════════════════════════════════════════════════════════════
// Dormant lead reactivation
// ═══════════════════════════════════════════════════════════════════════════
//
// 84 of 136 leads were sitting at "new check-in" having never moved. They
// completed a scorecard, gave their details, and nothing was ever sent. That is
// the largest pool in the business by a factor of ten and it needs no ad spend,
// which matters more than usual right now because the Meta ads are paused.
//
// Three touches over ten days, then it stops. Every step re-reads the lead and
// bails if they have replied, booked, converted or opted out, so nobody who has
// already re-engaged keeps getting chased.
//
// Marketing, not transactional. These people are cold and did not ask for this,
// so it goes through sendMarketingEmail() with the unsubscribe footer, unlike
// the pre-call form chase which is transactional.
export const dormantLeadReactivationFunction = inngest.createFunction(
  {
    id: 'dormant-lead-reactivation',
    retries: 2,
    triggers: [{ event: 'lead/dormant-reactivation' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const { leadId } = event.data as { leadId: string }
    if (!leadId) return { skipped: 'no leadId' }

    // Re-read every time. Returns null once they are no longer a dormant lead,
    // which is the signal to stop the whole sequence.
    const stillDormant = async (stepId: string) =>
      step.run(stepId, async () => {
        const admin = createAdminClient()
        const { data } = await admin
          .from('leads')
          .select('id, name, email, status, active, converted_to_client_id, scorecard_body_state, scorecard_score, scorecard_profile, scorecard_profile_confidence, storage_direction')
          .eq('id', leadId)
          .maybeSingle()
        if (!data) return null
        if (data.status !== 'new_check_in') return null      // they moved, someone picked them up
        if (data.converted_to_client_id) return null
        if (data.active === false) return null
        return data
      })

    const ctxFor = async (lead: Record<string, unknown>) => {
      const admin = createAdminClient()
      const { data: enrolment } = await admin
        .from('challenge_enrollments')
        .select('id')
        .eq('lead_id', leadId)
        .maybeSingle()
      return {
        firstName: String(lead.name ?? '').split(' ')[0] || 'there',
        bodyState: String(lead.scorecard_body_state),
        score: (lead.scorecard_score as number | null) ?? null,
        profile: (lead.scorecard_profile as string | null) ?? null,
        provisional: lead.scorecard_profile_confidence === 'low',
        didChallenge: !!enrolment,
        storageDirection: (lead.storage_direction as never) ?? null,
      }
    }

    // ── Touch 1: the read ────────────────────────────────────────────────
    const lead1 = await stillDormant('dormant-check-1')
    if (!lead1) return { stopped: 'no longer dormant at touch 1' }

    await step.run('dormant-send-read', async () => {
      const ctx = await ctxFor(lead1)
      const built = buildDormantReadEmail(ctx)
      const res = await sendMarketingEmail({
        to: lead1.email as string,
        subject: built.subject,
        html: built.html,
        from: fromCoach(),
        source: 'dormant-reactivation-1-read',
      })
      await logLeadEvent({
        leadId,
        type: 'dormant_reactivation_sent',
        subject: built.subject,
        resendEmailId: res.ok ? res.id ?? undefined : undefined,
        notes: res.ok ? 'Touch 1 of 3: their read.' : `Touch 1 NOT sent: ${res.reason}`,
      })
    })

    // ── Touch 2: SMS, four days later ────────────────────────────────────
    await step.sleep('dormant-wait-to-sms', '4d')
    await alignToNextMorningAEST(step, 'dormant-sms-morning')

    const lead2 = await stillDormant('dormant-check-2')
    if (!lead2) return { stopped: 'no longer dormant at touch 2' }

    await step.run('dormant-send-sms', async () => {
      const { sendLeadSms } = await import('@/lib/speed-to-lead-sms')
      const ctx = await ctxFor(lead2)
      const res = await sendLeadSms({
        leadId,
        trigger: 'dormant_reactivation',
        body: buildDormantSms(ctx),
      })
      if (!res.ok) console.log(`[dormant] SMS skipped for ${leadId}: ${res.reason}`)
    })

    // ── Touch 3: the state-matched next step, six days later ─────────────
    await step.sleep('dormant-wait-to-offer', '6d')
    await alignToNextMorningAEST(step, 'dormant-offer-morning')

    const lead3 = await stillDormant('dormant-check-3')
    if (!lead3) return { stopped: 'no longer dormant at touch 3' }

    await step.run('dormant-send-offer', async () => {
      const ctx = await ctxFor(lead3)
      const built = buildDormantOfferEmail(ctx)
      const res = await sendMarketingEmail({
        to: lead3.email as string,
        subject: built.subject,
        html: built.html,
        from: fromCoach(),
        source: 'dormant-reactivation-3-offer',
      })
      await logLeadEvent({
        leadId,
        type: 'dormant_reactivation_sent',
        subject: built.subject,
        resendEmailId: res.ok ? res.id ?? undefined : undefined,
        notes: res.ok ? 'Touch 3 of 3: state-matched offer. Sequence complete.' : `Touch 3 NOT sent: ${res.reason}`,
      })
    })

    return { leadId, completed: true }
  },
)

// ── Reassessment digest (weekly cron) ───────────────────────────────
// Monday 07:00 Brisbane = 21:00 UTC Sunday. The check-in window closes Sunday
// 6:30pm Brisbane and the CFWS generates on submit, so every trigger for the
// week exists by then.
//
// Also re-syncs triggers for every active client first, which is what catches
// the time-based reasons (block_end, twelve_week_cap). Those do not depend on a
// check-in, so nothing else would ever fire them.
export const reassessmentDigestCron = inngest.createFunction(
  {
    id: 'reassessment-digest',
    name: 'Reassessment digest · Monday morning',
    retries: 2,
    triggers: [{ cron: '0 21 * * 0' }], // 21:00 UTC Sunday = 07:00 Monday Brisbane
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ step }: { step: any }) => {
    const { syncReassessmentTriggers } = await import('@/lib/reassessment-triggers')
    const { buildReassessmentDigest, loadOpenTriggersWithClients } = await import('@/lib/reassessment-digest')
    const { fromBrand, COACH_BCC } = await import('@/lib/email-shell')

    const admin = createAdminClient()

    // Re-sync every live client so time-based triggers land.
    const synced = await step.run('sync-triggers', async () => {
      const { data: clients } = await admin
        .from('clients')
        .select('id')
        .not('coaching_started_at', 'is', null)
        .is('ended_at', null)
        .is('frozen_at', null)
      let created = 0
      for (const c of clients ?? []) {
        const r = await syncReassessmentTriggers(admin, c.id).catch(() => ({ created: 0 }))
        created += r.created
      }
      return { clients: clients?.length ?? 0, created }
    })

    const digest = await step.run('build-digest', async () => {
      const rows = await loadOpenTriggersWithClients(admin)
      return buildReassessmentDigest(rows)
    })

    // Silent on a clean week. An empty digest every Monday teaches you to ignore it.
    if (!digest) return { synced, sent: false, reason: 'no open triggers' }

    await step.run('send-digest', async () => {
      const to = COACH_BCC
      if (!to.length) return { skipped: 'no coach address' }
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { error } = await resend.emails.send({
        from: fromBrand(),
        to,
        subject: digest.subject,
        html: digest.html,
      })
      if (error) throw new Error(`digest send failed: ${error.message}`)
      return { sent: true }
    })

    // Stamp so a still-open trigger does not reappear as "new" next week. It
    // comes back only once it crosses the overdue threshold.
    await step.run('stamp-notified', async () => {
      await admin
        .from('reassessment_triggers')
        .update({ notified_at: new Date().toISOString() })
        .in('id', digest.triggerIds)
        .is('notified_at', null)
      return { stamped: digest.triggerIds.length }
    })

    return { synced, sent: true, newCount: digest.newCount, overdueCount: digest.overdueCount }
  }
)


// ─── THE BODY DECODE · daily arc ─────────────────────────────────────────
//
// One email and one SMS a day for five days, each pointing at that day's
// lesson, plus a single nudge for anyone who signed up and never answered the
// questions.
//
// THIS IS THE FUNCTION THE WHOLE REBUILD DEPENDS ON. The Challenge lost 14 of
// the 15 people who cleared every form, and its Day 7 prompts did not exist in
// code until 3 August, so 28 of 29 enrolments went through a funnel that never
// asked them to come back. Five good pages nobody returns to is the same
// outcome with better copy.
//
// Design decisions that are deliberate, not incidental:
//
//   EVERY SEND LOGS. project_checkin_prompt_logging_and_cohort is explicit that
//   an unlogged email on a gating step makes its completion number
//   uninterpretable, because "ignored it" and "never got one" look identical.
//   That is the exact hole that hid the Challenge's central number for two
//   months. Every email here writes a lead event with its Resend id.
//
//   RE-ANCHOR TO 7AM EACH DAY rather than adding 24h. A fixed cascade drifts by
//   every retry and queue delay and never corrects; the Challenge's "morning"
//   nudges were landing in the afternoon by the back half. Worst case here is
//   one late day, then it self-corrects.
//
//   RE-READ THE ENROLMENT BEFORE EVERY SEND, so anyone who goes inactive stops
//   hearing from us mid-arc.
//
//   MARKETING CLASS, so the unsubscribe footer and suppression list apply.
export const decodeDailyArcFunction = inngest.createFunction(
  {
    id: 'decode-daily-arc',
    retries: 2,
    triggers: [{ event: 'challenge/enrolled' }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const d = event.data as {
      leadId?: string
      token: string
      email: string
      firstName: string
      phone?: string
      product?: string
    }
    // The mirror of the guard on the five Challenge functions: this one runs
    // ONLY for Body Decode signups.
    if (d.product !== 'decode') return

    const { token, email, firstName, phone } = d
    const base = `${brand().marketingDomain}/decode/${token}`
    const formattedPhone = phone ? formatPhone(phone) : null

    // Read enrolled_at from the ROW rather than taking the clock here.
    //
    // The page gate computes every unlock from that column, so anchoring the
    // sends to anything else is how the two drifted apart in the first place.
    // It is also replay-safe: a bare new Date() outside step.run returns a
    // different value on every Inngest retry, which is exactly the kind of
    // silent shift that made the old mismatch so hard to see.
    const enrolledAt: string = await step.run('decode-read-enrolled-at', async () => {
      const admin = createAdminClient()
      const { data } = await admin
        .from('challenge_enrollments')
        .select('enrolled_at')
        .eq('token', token)
        .maybeSingle()
      return (data?.enrolled_at as string) ?? new Date().toISOString()
    })

    // decodeFirstMorning, NOT nextMorningAEST. The pages call the same function,
    // so when a lesson opens and when its email sends are one decision made in
    // one place. It also enforces a minimum gap after enrolment: without it,
    // signing up at 6:59am put this email sixty seconds after the welcome one.
    await step.sleepUntil('decode-anchor-7am', decodeFirstMorning(enrolledAt))

    for (let day = 1; day <= 5; day++) {
      const gate = await step.run(`decode-gate-day${day}`, async () => {
        const admin = createAdminClient()
        const { data } = await admin
          .from('challenge_enrollments')
          .select('status, lead_id, leads(scorecard_body_state)')
          .eq('token', token)
          .single()
        const lead = Array.isArray(data?.leads) ? data?.leads[0] : data?.leads
        return {
          active: data?.status === 'active',
          leadId: (data?.lead_id as string | null) ?? null,
          // No scorecard means no read, so the day lessons have nothing to
          // explain. She gets the questions nudge below instead.
          hasRead: !!lead?.scorecard_body_state,
        }
      })
      if (!gate.active) return

      if (day === 1 && !gate.hasRead) {
        // One nudge, once, and only on day 1. Someone who has not answered has
        // no read at all, so chasing her through five lessons about a result
        // she does not have would be noise. This is the single highest-value
        // send in the arc.
        await step.run('decode-questions-nudge-email', async () => {
          const { subject, html } = buildDecodeQuestionsNudgeEmail({ firstName, portalUrl: base })
          const res = await sendMarketingEmail({
            from: fromCoach(), source: 'decode', to: email, subject, html,
          })
          if (gate.leadId) {
            await logLeadEvent({
              leadId: gate.leadId,
              type: 'decode_questions_nudge_sent',
              subject,
              resendEmailId: (res as { id?: string }).id,
            })
          }
        })
        if (formattedPhone) {
          await step.run('decode-questions-nudge-sms', async () => {
            await sendSms({
              to: formattedPhone,
              message: renderSms(DECODE_SMS_QUESTIONS_NUDGE, firstName, base),
              leadId: gate.leadId,
              trigger: 'decode_questions_nudge',
            })
          })
        }
        // Give her the day back rather than stacking a lesson on top of a nudge.
        await alignToNextMorningAEST(step, 'decode-nudge-next-morning')
        continue
      }

      const dayUrl = `${base}/day/${day}`

      await step.run(`decode-day${day}-email`, async () => {
        const { subject, html } = buildDecodeDayEmail({ day, firstName, dayUrl })
        const res = await sendMarketingEmail({
          from: fromCoach(), source: 'decode', to: email, subject, html,
        })
        if (gate.leadId) {
          await logLeadEvent({
            leadId: gate.leadId,
            type: 'decode_day_email_sent',
            subject: `Day ${day} · ${subject}`,
            resendEmailId: (res as { id?: string }).id,
          })
        }
      })

      if (formattedPhone) {
        // Four hours after the email, so the two do not land together.
        await step.sleep(`decode-day${day}-sms-wait`, '4h')
        await step.run(`decode-day${day}-sms`, async () => {
          await sendSms({
            to: formattedPhone,
            message: renderSms(DECODE_SMS[day], firstName, dayUrl),
            leadId: gate.leadId,
            trigger: `decode_day${day}`,
          })
        })
      }

      if (day < 5) await alignToNextMorningAEST(step, `decode-day${day}-next-morning`)
    }
  }
)
