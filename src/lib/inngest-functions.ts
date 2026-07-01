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
} from './challenge-checkin-emails'
import {
  buildBlueprintCheckinPromptEmail,
  buildBlueprintCheckinReminderEmail,
  buildBlueprintWeekEmail,
  buildBlueprintWeek7FollowupEmail,
} from './blueprint-emails'
import { fromCoach, fromBrand } from '@/lib/email-shell'
import { coach, logoUrl, brand } from '@/config/tenant'
import {
  buildMembershipCheckinPromptEmail,
  buildMembershipCheckinReminderEmail,
} from './membership-emails'

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
    // the timing.
    await step.sleep('wait-for-day-5', '4d')

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
    await step.sleep('wait-for-day-14', '9d')

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
      const { data: blueprint } = await admin
        .from('blueprint_enrollments')
        .select('id')
        .ilike('email', email)
        .maybeSingle()

      if (blueprint) return // ascended - no re-engagement needed

      await inngest.send({
        name: 'reengagement/challenge-no-ascension',
        data: { email, firstName, source: 'challenge' },
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

// ─── Challenge SMS Sequence Function ─────────────────────────────────────────

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

    // Wait 1 hour after enrollment before first message
    await step.sleep('sms-initial-wait', '1h')

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
      const resend = new Resend(process.env.RESEND_API_KEY)
      const bodyHtml = interpolate(config.body ?? '', templateVars)
        .replace(/\n/g, '<br/>')
      const interpolatedSubject = interpolate(config.subject ?? '', templateVars)
      const { data: sent, error: sendError } = await resend.emails.send({
        from: fromCoach(),
        to: contact.email,
        subject: interpolatedSubject,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="light only"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
              <img src="${logoUrl()}" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#999999;">
              ${bodyHtml}
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`,
      })
      if (sendError) {
        console.error('[automation send_email] Resend error:', sendError, 'to:', contact.email, 'subject:', interpolatedSubject)
        break
      }
      if (ctx.leadId) {
        await logLeadEvent({
          leadId: ctx.leadId,
          type: 'email_sent',
          subject: interpolatedSubject,
          resendEmailId: sent?.id,
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

    // Week 7 follow-up (7 days after week 6 email)
    await step.sleep('wait-before-week-7-followup', '7d')

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

      // 2-day reminder if check-in not submitted
      await step.sleep(`reminder-delay-week-${week}`, '2d')

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

        // 2-day reminder if check-in not submitted
        await step.sleep(`reminder-delay-block-${block}-week-${week}`, '2d')

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

      await step.run(`advance-extension-week-${week}`, async () => {
        const admin = createAdminClient()
        const { data } = await admin
          .from('extension_enrollments')
          .select('current_week')
          .eq('token', token)
          .single()

        if (!data) return
        if (data.current_week !== week - 1) return

        await admin
          .from('extension_enrollments')
          .update({ current_week: week })
          .eq('token', token)

        const completedWeek = week - 1
        if (process.env.RESEND_API_KEY) {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const portalUrl = `${appUrl()}/extension/${token}`
          await resend.emails.send({
            from: fromCoach(),
            to: email,
            subject: `Extension Week ${completedWeek} check-in is due`,
            html: darkEmailShell(`
${emailLogo()}
${emailEyebrow(`90-Day Extension · Week ${completedWeek}`)}
${emailHeading(`Week ${completedWeek} check-in is due.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(`Extension Week ${completedWeek} is complete. Week ${week} is now live. Submit your check-in before moving on.`, { bottom: 28 })}
${emailCta({ href: portalUrl, label: `Submit Week ${completedWeek} check-in` })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`, { previewText: `${firstName}, submit your Extension Week ${completedWeek} check-in.` }),
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
    const { email, firstName, source, patternLabel } = event.data as {
      email: string
      firstName: string
      source: 'challenge' | 'blueprint' | 'membership'
      patternLabel?: string
    }

    const extensionUrl = `${appUrl()}/extension`
    const membershipUrl = `${appUrl()}/membership`
    const patternNote = patternLabel ? ` Your ${patternLabel} pattern doesn't reset when you stop - it's still there when you come back.` : ''

    // Email 1: Day 3 - check in
    await step.run('send-day3', async () => {
      if (!process.env.RESEND_API_KEY) return
      const resend = new Resend(process.env.RESEND_API_KEY)
      const sourceContext = source === 'challenge'
        ? 'You finished the 14-day challenge a few days ago.'
        : source === 'blueprint'
          ? 'You completed the 6-Week Blueprint a few days ago.'
          : 'Your Body Recode membership has ended.'
      await resend.emails.send({
        from: fromCoach(),
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

    await step.sleep('wait-day3-to-14', '11d')

    // Email 2: Day 14 - what the next stage looks like
    await step.run('send-day14', async () => {
      if (!process.env.RESEND_API_KEY) return
      const resend = new Resend(process.env.RESEND_API_KEY)
      const nextStageContext = source === 'challenge'
        ? `The 6-Week Blueprint is where the work you started gets structure and direction. It's built around your biological pattern — not a generic plan.`
        : `The 90-Day Extension is designed for exactly where you are — you've done the foundation work, and you need time to consolidate it before committing to the full membership.`
      await resend.emails.send({
        from: fromCoach(),
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
    await step.run('send-day30', async () => {
      if (!process.env.RESEND_API_KEY) return
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: fromCoach(),
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
    await step.run('send-day45', async () => {
      if (!process.env.RESEND_API_KEY) return
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: fromCoach(),
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
    await step.run('send-day60', async () => {
      if (!process.env.RESEND_API_KEY) return
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: fromCoach(),
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

    await step.sleep('wait-day60-to-90', '30d')

    // Email 6: Day 90 - final touchpoint + referral
    await step.run('send-day90', async () => {
      if (!process.env.RESEND_API_KEY) return
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: fromCoach(),
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
          const r = await publishToInstagram({ imageUrls, caption })

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
