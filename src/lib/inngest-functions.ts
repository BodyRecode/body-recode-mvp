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
} from './challenge-checkin-emails'
import {
  buildBlueprintCheckinPromptEmail,
  buildBlueprintCheckinReminderEmail,
} from './blueprint-emails'

// ─── Challenge SMS Messages ───────────────────────────────────────────────────
// Rebuilt 2026-05-30 as Minimal Pulse: 1 morning nudge per day (14 messages)
// pointing to the portal, plus 3 afternoon boosts on key days (Day 5 session
// reminder, Day 7 Check-In nudge, Day 14 Body Decode Report nudge). The
// daily coaching content lives in the portal; SMS is the pulse that brings
// the participant back. Previous design sent 3x/day rich coaching messages
// which duplicated the in-portal coaching notes.

const SMS_MORNING: Record<number, string> = {
  1: `Welcome %FIRST%. Day 1 is live in your portal. Today is for setup - read the training plan and nutrition guide, do the morning reset. The work begins gently. Portal: %URL%`,
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

    const portalUrl = `https://bodyrecode.au/challenge/${token}`
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Welcome email AND coach notification are sent synchronously by
    // /api/challenge/enroll/route.ts so confirmation never depends on Inngest pickup.
    // This function owns only the time-shifted steps below.

    // ── Step 1: Wait 4 days → Day 5 Zoom invite ───────────────────────────
    await step.sleep('wait-for-day-5', '4d')

    await step.run('send-day5-zoom-invite', async () => {
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
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
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
          from: 'Kade at Body Recode <kade@bodyrecode.au>',
          to: email,
          subject: built.subject,
          html: built.html,
        })
      } else {
        // No Check-In on record. Plain ascension push, no result content.
        const built = buildDay14FallbackEmail({ firstName })
        await resend.emails.send({
          from: 'Kade at Body Recode <kade@bodyrecode.au>',
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
    const portalUrl = `https://bodyrecode.au/challenge/${token}`

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
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
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
              <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;" />
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
        from: 'Body Recode <kade@bodyrecode.au>',
        to: 'kade@bodyrecode.au',
        subject: `Automation: ${interpolate(config.message ?? 'Action triggered', templateVars)}`,
        html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#FFFFFF;color:#aaa;">
          <img src="https://bodyrecode.au/logo-black.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
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

const BLUEPRINT_PATTERN_CONFIG: Record<string, { label: string; colour: string }> = {
  'stress-stored':   { label: 'Stress-Stored',    colour: '#DC2626' },
  'metabolic-drift': { label: 'Insulin-Drift',    colour: '#B7791F' },
  'hormonal-shift':  { label: 'Estrogen-Shift',   colour: '#8b5cf6' },
  'system-overload': { label: 'Androgen-Decline', colour: '#1B6DFC' },
}

const BLUEPRINT_WEEK_EMAILS: Record<number, {
  subject: (firstName: string) => string
  body: (firstName: string, portalUrl: string) => string
  patternBlock: Record<string, string>
}> = {
  1: {
    subject: (n) => `Week 1 starts today, ${n}`,
    body: (n, url) => `
${emailEyebrow('Week 1 · Regulate')}
${emailHeading('Re-establish biological rhythm.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('Your six-week programme starts today. The first two weeks are called the Regulate phase — and the goal is simple: re-establish biological rhythm.')}
${emailBody('This week is not about pushing hard. It is about removing the inputs that have been keeping your system in a stressed state and replacing them with a structure your body can actually respond to. Consistent meals, controlled training intensity, prioritised sleep.')}
${emailBody('Your first education lesson — Cortisol and the Stress Response — is now unlocked in your portal. It explains the biology behind why this phase is designed the way it is. Worth reading before your first session.', { bottom: 28 })}
${emailCta({ href: url, label: 'Open your portal' })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'Your cortisol curve is the target this week. Eat breakfast within an hour of waking, never train fasted, and keep caffeine before noon. Every one of these rules is directly lowering the cortisol load your body is carrying.',
      'metabolic-drift': 'Start the post-meal walk habit this week - 15 minutes after every meal. And protein first at every meal without exception. These two things are the foundation everything else builds on.',
      'hormonal-shift':  'The most important thing you can do this week is eat. Full meals, generous fat, consistent timing. Do not skip breakfast. Do not reduce portions. Your hormonal axis responds to adequacy, not restriction.',
      'system-overload': 'Eat before every session. Always. Your nervous system cannot recover from training on empty and this week is about giving it every advantage. Keep rest periods at two to three minutes between sets.',
    },
  },
  2: {
    subject: (n) => `Week 2 - your insulin lesson is unlocked`,
    body: (n, url) => `
${emailEyebrow('Week 2 · Insulin and Blood Sugar')}
${emailHeading('Why timing beats quantity.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('You are into your second week. Your education lesson for this week — Insulin and Blood Sugar Control — is now unlocked in the portal.')}
${emailBody('This lesson explains why the timing of your carbohydrates matters more than the quantity, why snacking keeps fat metabolism switched off even if you are eating healthy food, and why afternoon cravings are not a willpower problem.')}
${emailBody('If your energy has been more even this week than last week, or the afternoon crash has softened, that is your cortisol curve starting to normalise. The insulin work this week builds on that foundation.', { bottom: 28 })}
${emailCta({ href: url, label: 'Read the lesson' })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'Cortisol raises blood sugar directly even without eating - through a process called gluconeogenesis. As your cortisol load comes down this week, your insulin sensitivity improves as a downstream effect. The two are linked.',
      'metabolic-drift': 'Insulin sensitivity is your primary target. The fasting gaps between your meals, the post-training carb window, and the post-meal walks are all working on this directly. Stay strict with the rest day protocol this week.',
      'hormonal-shift':  'Insulin resistance drives oestrogen excess through increased aromatase activity. Improving your insulin sensitivity is a direct lever for the hormonal balance your pattern needs. Keep fat intake generous this week.',
      'system-overload': 'One night of poor sleep reduces insulin sensitivity by 20 to 30 percent the next day. Sleep quality is a metabolic variable for your pattern, not just a recovery variable. Protect it this week.',
    },
  },
  3: {
    subject: (n) => `${n} - you are at the midpoint`,
    body: (n, url) => `
${emailEyebrow('Week 3 · Adapt Phase Begins')}
${emailHeading('Progressive load starts now.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('Three weeks in. You have moved through the full Regulate phase and the Adapt phase starts this week. Progressive load begins — your training intensity target increases and the sessions will ask more of you.')}
${emailBody('Your Week 3 education lesson — Testosterone and Muscle Signal — is now unlocked. It covers why training harder and eating less are two of the most reliable ways to suppress the hormone responsible for body composition change, and what actually drives it instead.')}
${emailBody('This is also a good week to submit your check-in if you have not already. Eight markers, two minutes. It gives you a clear picture of what has shifted since Week 1.', { bottom: 28 })}
${emailCta({ href: url, label: 'Submit your check-in' })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'Cortisol and testosterone have a direct inverse relationship. As your cortisol curve normalises through the Adapt phase, testosterone signal recovers as a downstream effect. The controlled training intensity is protecting this recovery.',
      'metabolic-drift': 'Improving insulin sensitivity reduces aromatase activity, which increases testosterone availability. The Session B finisher is now your most important metabolic tool. Do not skip it.',
      'hormonal-shift':  'For your pattern, the balance of testosterone relative to oestrogen is the critical variable. Do not push to the lower end of your RIR target if recovery feels compromised this week. Consistency outweighs intensity.',
      'system-overload': 'Chronic neurological overload is one of the most reliable ways to suppress testosterone. The recovery-first structure this week - three RIR, extended rest, no finisher - is directly protecting testosterone output.',
    },
  },
  4: {
    subject: (n) => `Week 4 - thyroid and metabolic rate`,
    body: (n, url) => `
${emailEyebrow('Week 4 · Thyroid and Metabolic Rate')}
${emailHeading('Why cutting calories backfires.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('Four weeks in. Your Week 4 education lesson — Thyroid and Metabolic Rate — is now unlocked.')}
${emailBody('This lesson covers the mechanism behind why cutting calories makes the body burn less, not more. And why each restriction cycle leaves metabolic rate a little lower than before. If you have dieted multiple times in the past and felt like it gets harder each time, this lesson explains exactly why — and what the programme has been doing to reverse it.')}
${emailBody('Body composition changes are often most visible around now for people who have been consistent through the first three weeks. If things are shifting, it is because the hormonal environment has changed enough to allow it.', { bottom: 28 })}
${emailCta({ href: url, label: 'Read the lesson' })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'Cortisol impairs the conversion of inactive T4 to active T3. Reducing your cortisol load through the programme directly supports thyroid function. You do not need to target the thyroid separately - it improves as cortisol normalises.',
      'metabolic-drift': 'Thyroid function improves as insulin sensitivity is restored and systemic inflammation reduces. Both are direct targets of your programme. Metabolic rate recovery is a downstream effect of the primary work you have been doing.',
      'hormonal-shift':  'Oestrogen excess can block thyroid receptors directly, reducing hormone effectiveness even when blood levels appear normal. Restoring hormonal balance through your programme removes this block. Keep fat intake generous this week.',
      'system-overload': 'Subclinical thyroid suppression is common in your pattern due to the combination of chronic stress load and often-inadequate food intake. The non-negotiable food volume in your programme is protecting thyroid output.',
    },
  },
  5: {
    subject: (n) => `Week 5 - the final lesson`,
    body: (n, url) => `
${emailEyebrow('Week 5 · Sleep Hormones and Recovery')}
${emailHeading('The upstream variable.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('Five weeks in. Your final education lesson — Sleep Hormones and Recovery — is now unlocked.')}
${emailBody('This lesson ties all five hormones together. It covers what actually happens during sleep, why alcohol reduces recovery even when it helps you fall asleep, and why one night of poor sleep undoes more progress than most people realise. Every hormone in this series resets during sleep. It is the upstream variable that determines how much everything else is working.')}
${emailBody('This is also a peak effort week for most patterns. Your sessions should feel different to Week 1 — more output from the same perceived effort. That is the system responding. Keep sleep as the priority this week to convert the training stimulus into actual adaptation.', { bottom: 28 })}
${emailCta({ href: url, label: 'Read the lesson' })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'Sleep is treated as a training variable in your programme because it is one. Poor sleep is the fastest way to spike cortisol and undo a week of work. If sleep quality is not where you need it, reduce session intensity before anything else.',
      'metabolic-drift': 'One night of poor sleep reduces insulin sensitivity by 20 to 30 percent the following day. Given that insulin sensitivity is your primary target, sleep quality is not optional this week. It is part of the protocol.',
      'hormonal-shift':  'Deep sleep is when growth hormone peaks and reproductive hormones complete their daily reset cycle. Disrupted sleep directly disrupts the hormonal balance your programme is working to restore. Protecting sleep is protecting the result.',
      'system-overload': 'Sleep is the primary recovery stimulus for your nervous system. It outranks training in your programme. The highest-leverage action available to you right now is consistent, high-quality sleep. Everything else is built around protecting it.',
    },
  },
  6: {
    subject: (n) => `Final week, ${n}. What comes next.`,
    body: (n, url) => `
${emailEyebrow('Week 6 · Embed and Deload')}
${emailHeading('Final week — adaptations land here.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('Final week. This is a deload week — training volume drops by 30 percent, intensity stays controlled, and nutrition stays exactly the same. The body makes its biggest adaptations when load drops and recovery takes over.')}
${emailBody('Take some time this week to compare where you are now with where you started. Energy through the day. Sleep quality. Afternoon crashes. Hunger between meals. Training recovery. These are the markers that the programme targets first, and after six weeks of consistent work they should look different to Week 1.')}
${emailBody('The 6-Week Blueprint was Stage 2. What you have built here is the hormonal foundation that makes Stage 3 possible. Your portal will show you what comes next.', { bottom: 28 })}
${emailCta({ href: url, label: 'See what comes next' })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'Six weeks of lowered cortisol load has changed your biological baseline. The visceral fat that cortisol was protecting should be more accessible now. The next phase builds progressive intensity on a system that can actually handle it.',
      'metabolic-drift': 'Your insulin sensitivity is significantly different to Week 1. The afternoon crashes, the urgent between-meal hunger, the inability to use fat as fuel - these patterns shift when the hormonal environment changes. You have changed the environment.',
      'hormonal-shift':  'Restriction and overtraining were driving your pattern. Six weeks of adequacy and consistency has been correcting the hormonal imbalance at the root. The physical changes may still be arriving - they often lag the hormonal changes by two to three weeks.',
      'system-overload': 'Your nervous system has had six weeks of reduced demand and adequate recovery. The flat, unresponsive feeling that characterised your pattern at the start should be significantly different now. Stage 3 introduces progressive challenge to a system that can absorb it.',
    },
  },
}

// Phase 3a migration — outer wrapper now goes through darkEmailShell.
// Pattern callout block preserved (it's specific to the Blueprint flow
// and intentionally on-brand); body content kept as-is for Phase 3b.
function blueprintEmailShell(body: string, patternLabel: string, patternColour: string, patternCallout: string): string {
  const patternBlock = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:3px solid ${patternColour};margin:24px 0 0;">
        <tr>
          <td style="padding-left:16px;">
            <p style="font-size:11px;font-weight:700;color:${patternColour};letter-spacing:0.12em;text-transform:uppercase;margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${patternLabel}</p>
            <p style="font-size:13px;color:#4A4A4A;line-height:1.7;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${patternCallout}</p>
          </td>
        </tr>
      </table>`
  return darkEmailShell(`
${emailLogo()}
${body}
${patternBlock}
${darkEmailSignature()}
`)
}

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
    const portalUrl = `https://bodyrecode.au/blueprint/${token}`

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
        const pc = BLUEPRINT_PATTERN_CONFIG[pattern] ?? BLUEPRINT_PATTERN_CONFIG['stress-stored']
        const emailDef = BLUEPRINT_WEEK_EMAILS[week]
        const patternCallout = emailDef.patternBlock[pattern] ?? emailDef.patternBlock['stress-stored']

        await resend.emails.send({
          from: 'Kade at Body Recode <kade@bodyrecode.au>',
          to: email,
          subject: emailDef.subject(firstName),
          html: blueprintEmailShell(
            emailDef.body(firstName, portalUrl),
            pc.label,
            pc.colour,
            patternCallout,
          ),
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
      const pc = BLUEPRINT_PATTERN_CONFIG[pattern] ?? BLUEPRINT_PATTERN_CONFIG['stress-stored']

      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject: `${firstName}, you finished the Blueprint.`,
        html: blueprintEmailShell(
          `
${emailEyebrow('Blueprint Complete')}
${emailHeading(`Six weeks done, ${firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('You finished the 6-Week Body Rewire Blueprint. That is not a small thing.')}
${emailBody('Most people who start a structured programme abandon it before Week 3. You went all six weeks. That means your hormonal environment, your training capacity, your metabolic baseline — all of them are in a different place to where they were when you started.')}
${emailBody('Stage 3 is where this becomes a long-term result. Progressive challenge applied to a system that can now absorb it. If you want to talk through what the right next step looks like for your pattern, reply to this email and I will come back to you personally.', { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Open your portal' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
`,
          pc.label,
          pc.colour,
          `You completed the ${pc.label} pattern programme. The work you have done over six weeks has addressed the specific biological mechanism driving your pattern. Reply to this email if you want to discuss Stage 3.`,
        ),
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
            from: 'Kade at Body Recode <kade@bodyrecode.au>',
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
            from: 'Kade at Body Recode <kade@bodyrecode.au>',
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
            await resend.emails.send({
              from: 'Kade at Body Recode <kade@bodyrecode.au>',
              to: email,
              subject: `Block ${block} Week ${completedWeek} check-in is due`,
              html: darkEmailShell(`
${emailLogo()}
${emailEyebrow(`Membership · Block ${block} Week ${completedWeek}`)}
${emailHeading(`Block ${block} Week ${completedWeek} check-in is due.`)}
${emailDivider()}
${emailBody(`Hi ${first_name},`)}
${emailBody(`Block ${block} Week ${completedWeek} is complete. Week ${week} is now live in your portal.`)}
${emailBody(`Submit your Week ${completedWeek} check-in before moving on. This is the data that feeds your monthly Loom review — the more consistent the data, the more useful the feedback.`, { bottom: 28 })}
${emailCta({ href: portalUrl, label: `Submit Week ${completedWeek} check-in` })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`, { previewText: `${first_name}, submit your Block ${block} Week ${completedWeek} check-in.` }),
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
            await resend.emails.send({
              from: 'Kade at Body Recode <kade@bodyrecode.au>',
              to: email,
              subject: `Reminder: Block ${block} Week ${completedWeek} check-in not yet submitted`,
              html: darkEmailShell(`
${emailLogo()}
${emailEyebrow(`Membership · Block ${block} Week ${completedWeek}`)}
${emailHeading('Your check-in is still outstanding.')}
${emailDivider()}
${emailBody(`Hi ${first_name},`)}
${emailBody(`Your Block ${block} Week ${completedWeek} check-in is still outstanding. This data is what your monthly Loom review is built from — without it, I am working blind.`, { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Submit check-in now' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${darkEmailSignature()}
`, { previewText: `${first_name}, your Block ${block} Week ${completedWeek} check-in is overdue.` }),
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
            from: 'Kade at Body Recode <kade@bodyrecode.au>',
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
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
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
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
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
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
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
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
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
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
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
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject: `Last one from me`,
        html: reengagementEmailShell(`
${emailEyebrow('Final Touchpoint')}
${emailHeading('Last one from me.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody("This is the last email in this sequence. I don't want to keep showing up in your inbox if the timing isn't right.")}
${emailBody("If you ever want to come back, the door is open. The system works whenever you're ready for it.")}
${emailBody('One other thing — if you know someone who would benefit from any of the Body Recode programmes, send them to <a href="https://app.bodyrecode.au" style="color:#1B6DFC;font-weight:600;text-decoration:none;">app.bodyrecode.au</a>. The challenge is free and a good starting point for anyone.')}
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
