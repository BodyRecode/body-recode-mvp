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
import { CHECKIN_PATTERNS } from './checkin-patterns'
import { legacyLetterToSlug } from './pattern-mapping'

// ─── Day 14 Result Reveal email helper ────────────────────────────────────
// Builds the in-email Result Reveal block (progress score card + pattern
// card + actions card) for the Day 14 email when the participant has
// completed the Check-In. Mirrors the visual treatment of the new Day 7
// result email so they feel like the same brand voice. The Blueprint
// ascension push is appended by the Day 14 step itself.
function buildResultRevealBlock(
  patternSlug: string,
  progressScore: number,
): string {
  const p = CHECKIN_PATTERNS[patternSlug]
  if (!p) return ''
  const progressPercent = Math.round((progressScore / 8) * 100)
  return `
<div style="background:#FFFFFF;border:1px solid #E5E5E5;border-left:3px solid #1B6DFC;border-radius:14px;padding:24px 26px;margin:0 0 16px;">
  <p style="font-size:11px;font-weight:700;color:#1056D6;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    Your 14-Day Progress
  </p>
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
    <tr>
      <td style="vertical-align:baseline;padding:0;">
        <span style="font-size:52px;font-weight:900;color:#1B6DFC;letter-spacing:-0.04em;line-height:1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${progressScore}</span>
      </td>
      <td style="vertical-align:baseline;padding:0 0 0 14px;">
        <span style="font-size:15px;font-weight:600;color:#4A4A4A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">of 8 markers<br/>improving</span>
      </td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 14px;">
    <tr>
      <td bgcolor="#E5E5E5" style="background:#E5E5E5;height:8px;line-height:0;border-radius:99px;">
        <table cellpadding="0" cellspacing="0" border="0" width="${progressPercent}%">
          <tr><td bgcolor="#1B6DFC" style="background:#1B6DFC;height:8px;line-height:0;border-radius:99px;">&nbsp;</td></tr>
        </table>
      </td>
    </tr>
  </table>
  <p style="font-size:14px;color:#4A4A4A;margin:0;line-height:1.65;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    ${progressScore >= 6
      ? 'Strong fortnight. Your system has responded well to the structure.'
      : progressScore >= 4
      ? 'Solid progress. The markers that have not shifted yet will often follow as the rhythm carries through.'
      : 'Your body is still finding its baseline. The shifts will continue as you carry the rhythm forward.'}
  </p>
</div>

<div style="background:#FFFFFF;border:1px solid ${p.color}25;border-left:3px solid ${p.color};border-radius:14px;padding:24px;margin:0 0 16px;">
  <p style="font-size:11px;font-weight:700;color:${p.color};letter-spacing:0.14em;text-transform:uppercase;margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    Your Biological Pattern
  </p>
  <p style="font-size:21px;font-weight:800;color:#1A1A1A;margin:0 0 14px;letter-spacing:-0.01em;line-height:1.2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    ${p.label}
  </p>
  <p style="font-size:14px;color:#4A4A4A;line-height:1.75;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    ${p.desc}
  </p>
</div>

<div style="background:#FFFFFF;border:1px solid #E5E5E5;border-radius:14px;padding:24px;margin:0 0 24px;">
  <p style="font-size:11px;font-weight:700;color:#1B6DFC;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    What to focus on going forward
  </p>
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    ${p.actions.map((action, i) => `
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:28px;">
          <span style="font-size:11px;font-weight:800;color:${p.color};font-family:monospace;">${String(i + 1).padStart(2, '0')}</span>
        </td>
        <td style="padding:8px 0;font-size:14px;color:#4A4A4A;line-height:1.65;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${action}</td>
      </tr>
    `).join('')}
  </table>
</div>
`
}

// ─── Challenge SMS Messages ───────────────────────────────────────────────────

const SMS_MESSAGES: Record<number, { morning: string; afternoon: string; evening: string }> = {
  1: {
    morning: `Morning.\n\nDay 1 is not about doing everything perfectly. It is about finding a steadier rhythm for today.\n\nIf you wake up feeling heavy or foggy, that is expected. Your body is shifting gears.\n\nKeep things simple this morning. One step at a time.`,
    afternoon: `A quick check in.\n\nMost people feel a small dip around this time. The afternoon crash is part of the old pattern you are working to steady.\n\nIf you notice tiredness or cravings today, nothing is wrong. This usually settles within a few days.\n\nJust stay consistent with the basics. Light meals, steady water, no pressure.`,
    evening: `Tonight is about slowing down.\n\nYour body is still regulating and it is normal if you feel a little tired or mentally drained.\n\nKeep things simple tonight. A light meal, some time away from your phone, and an earlier sleep if you can.\n\nDay 1 is complete. You showed up. That is enough.`,
  },
  2: {
    morning: `Morning.\n\nDay 2 can feel a little heavier than yesterday. Your body is still clearing old patterns and settling into new ones, so waking up slower or feeling flat is completely normal.\n\nToday is about gentle consistency. No pressure to move fast.`,
    afternoon: `Checking in.\n\nIf you notice a small crash or stronger cravings today, that is common on Day 2. Your system is shifting away from old patterns and it takes a little energy to stabilise.\n\nYou are not doing anything wrong. Stay focused on the basics.`,
    evening: `Day 2 is usually where the tiredness shows up.\n\nIf you feel a bit drained or your mood is softer tonight, that is expected. Your body is adjusting and this is part of the process.\n\nKeep your evening calm. A quiet space, a warm shower, or logging off earlier can make tomorrow feel lighter.\n\nYou are doing well. Today counts.`,
  },
  3: {
    morning: `Morning.\n\nDay 3 often brings the first small lift. You might notice moments where your head feels a little clearer or your body feels lighter, even if it comes and goes.\n\nThis is your system starting to steady itself. Keep your morning simple.`,
    afternoon: `A quick check in.\n\nIf you are feeling more settled in some moments but still get an afternoon dip, that is normal. Day 3 often brings a mix of clarity and tiredness.\n\nStay consistent with the basics and keep things steady. These small shifts are the first signs of progress.`,
    evening: `Tonight is about calming the day down.\n\nIf you feel a little clearer or less bloated tonight, notice it. Even small changes matter.\n\nYour body responds to consistency faster than you think. Keep your evening slow and gentle.\n\nDay 3 is complete. You are doing well.`,
  },
  4: {
    morning: `Morning.\n\nDay 4 often feels a little steadier. Your body is beginning to find a rhythm and you may notice fewer dramatic swings in energy or hunger this morning.\n\nKeep your morning clear and simple. Today is about letting your body build on the consistency you have already started.`,
    afternoon: `Checking in.\n\nBy Day 4, most people feel a more predictable afternoon dip rather than the heavy crash from earlier in the week.\n\nYour body is learning to stabilise energy rather than spike and crash. This is progress, even if it feels subtle.`,
    evening: `Day 4 usually ends with a calmer evening.\n\nIf your cravings feel a little less intense tonight or you feel slightly more settled after dinner, that is a good sign.\n\nKeep your evening slow and uninterrupted where you can. These small consistent choices will make the next few days feel even easier.\n\nDay 4 is complete.`,
  },
  5: {
    morning: `Morning.\n\nDay 5 often feels a little harder. Your body is regulating and this is usually where the wobble shows up - lower energy, stronger cravings or a softer mood.\n\nThis is expected. Nothing is wrong.\n\nToday is a rest day. Keep things simple and slow.`,
    afternoon: `Checking in.\n\nIf you feel tired or more craving-driven today, that is normal for Day 5. Your system is adjusting and this dip is part of the process.\n\nYour Week One Progress Session is ready in your portal. Watch it today - it will make the rest of the challenge feel much clearer.`,
    evening: `Your Week One Progress Session is available in your portal if you have not watched it yet.\n\nIt is 30 minutes and breaks down exactly what your body has been doing this week.\n\nKeep your evening calm and steady tonight.\n\nDay 5 is complete. You are doing well.`,
  },
  6: {
    morning: `Morning.\n\nDay 6 often feels a little lighter. Your body is settling and you might notice small improvements in mood, energy or hunger this morning.\n\nLet them be small. You do not need to push or chase anything today. Your body responds best to consistency, not pressure.`,
    afternoon: `Checking in.\n\nIf you feel steadier today but still get a small afternoon dip, that is normal. Your system is balancing itself and these waves are part of the process.\n\nStay consistent with your meals and keep things simple for the rest of the day.`,
    evening: `Day 6 usually ends with a calmer evening.\n\nIf you notice you are a little less bloated or your cravings are slightly easier tonight, that is a good sign. Your system is responding to your routine.\n\nKeep your evening quiet and steady.\n\nDay 6 is complete. You are doing well.`,
  },
  7: {
    morning: `Morning.\n\nDay 7 often feels clearer. Your body has settled more than it has all week and you may notice steadier energy or a lighter feeling through your morning.\n\nYou have already done a full week of work. Just stay steady with the basics.\n\nThe Body Decode Check-In is now unlocked in your portal. Complete it today.`,
    afternoon: `Checking in.\n\nIf you feel a softer dip this afternoon or feel a little reflective about the week, that is normal for Day 7.\n\nYou have done a full week of consistent work. Your system is calmer, your cravings should be easier and your energy waves usually feel more predictable today.`,
    evening: `You have reached the end of week one.\n\nTake a quiet moment tonight to notice anything that feels different, even if the changes are small.\n\nClearer hunger. Fewer afternoon crashes. Less bloating. More predictable moods.\n\nThese are all signs your system is responding. You have done well this week.`,
  },
  8: {
    morning: `Morning.\n\nDay 8 often feels different. Your body has had a full week to settle and you may notice clearer mornings or steadier energy today.\n\nLet this be a quiet win, not something you need to push. The goal for this week is calm consistency, not intensity.`,
    afternoon: `Checking in.\n\nIf today feels a little smoother or your cravings are lighter, that is expected on Day 8. Your system is more regulated and your afternoon dip should feel softer and more predictable.\n\nStay steady with your meals and avoid making big changes just because you feel better.`,
    evening: `Your body usually feels calmer by Day 8.\n\nIf you notice that your evening feels less reactive or your hunger feels more controlled, that is a sign your rhythm is settling.\n\nKeep your evening quiet and steady.\n\nDay 8 is complete. You are doing well.`,
  },
  9: {
    morning: `Morning.\n\nYour body is usually clearer by Day 9 and you might notice a lighter feeling through your morning or a steadier mood.\n\nLet that feel good without turning it into pressure. You do not need to push harder today. Consistency is what carries you through week two.`,
    afternoon: `Checking in.\n\nIf you feel clearer today or notice fewer cravings, that is normal for Day 9. Your system is more regulated and your energy usually feels more predictable this week.\n\nStay steady and avoid overthinking your choices. The goal is ease, not control.`,
    evening: `Tonight often feels calmer.\n\nYour body has settled into a clearer rhythm and your hunger and mood should feel more predictable now.\n\nTake the evening slowly and keep things simple.\n\nDay 9 is complete. You are doing well.`,
  },
  10: {
    morning: `Morning.\n\nDay 10 often feels clearer and more stable. Your energy might rise a little earlier today and your hunger patterns may feel more predictable.\n\nLet this be a quiet win. Your body responds best when you stay calm and consistent. Keep your morning simple.`,
    afternoon: `Checking in.\n\nIf you feel clearer this afternoon or notice your cravings are much lower, that is normal for Day 10. Your system is regulated and your body is responding to the rhythm you have built.\n\nAvoid tightening control or trying to speed things up. Progress happens faster when you stay steady.`,
    evening: `Tonight often feels calmer and more predictable.\n\nIf you notice that your mood or hunger is steadier, that is a sign your body is adjusting well.\n\nKeep your evening routine quiet and consistent.\n\nDay 10 is complete. You are doing well.`,
  },
  11: {
    morning: `Morning.\n\nDay 11 often feels steady and clear. You may notice lighter mornings, calmer hunger or a smoother mood today.\n\nYour system is more regulated now and it is normal to feel a little more grounded as you start your day. Consistency is carrying you, not perfection.`,
    afternoon: `Checking in.\n\nIf today feels calmer or more predictable, that is expected for Day 11. Your body has settled into the rhythm you have built and your energy usually feels steadier this week.\n\nAvoid rushing ahead or trying to tighten control. Your progress comes from staying steady.`,
    evening: `Day 11 usually ends with a quieter mind.\n\nIf your mood feels more stable or your hunger feels easier to manage tonight, take note of it. These are signs of a calmer system and stronger rhythm.\n\nKeep your evening simple and slow.\n\nDay 11 is complete. You are doing well.`,
  },
  12: {
    morning: `Morning.\n\nDay 12 often feels clearer and more grounded. Your body has had time to settle and you may notice lighter mornings or a calmer mood today.\n\nLet this be a quiet moment of progress, not something you need to push. Your rhythm is doing the work for you.`,
    afternoon: `Checking in.\n\nIf you feel clearer today or notice your cravings are softer, that is normal for Day 12. Your system is regulated and your body is responding well to the consistency you have built.\n\nStay steady and avoid rushing toward the end of the challenge.`,
    evening: `Tonight might feel calmer or more reflective.\n\nYou have moved through most of the challenge and your body is showing the results of your consistency.\n\nTake a quiet moment to acknowledge the work you have done. Keep your evening simple and slow.\n\nDay 12 is complete. You are doing well.`,
  },
  13: {
    morning: `Morning.\n\nDay 13 often feels lighter and clearer. Your body has had almost two full weeks to settle and you may notice a stronger sense of rhythm this morning.\n\nLet today be simple. The goal is to stay steady and let your body carry you through the final stretch.`,
    afternoon: `Checking in.\n\nIf you feel more reflective today or notice a mix of pride and uncertainty, that is normal for Day 13. Your body is regulated and your system is calmer, so these thoughts naturally rise to the surface.\n\nStay steady with your meals and keep your day simple.`,
    evening: `Your evening might feel softer or more emotional tonight.\n\nThis is normal. You have made real progress and your body is settling into a healthier rhythm.\n\nKeep your night calm and simple. A steady evening will help you move into the final day with clarity.\n\nDay 13 is complete. You are doing well.`,
  },
  14: {
    morning: `Morning.\n\nDay 14 often feels lighter and clearer. Your body has had time to settle and you may notice calm energy or a steadier mood this morning.\n\nLet it be a quiet win. You have moved through two full weeks of consistency and your body is showing you what happens when you give it time and space.`,
    afternoon: `Checking in.\n\nIf today feels a mix of calm, pride and a little uncertainty, that is normal for Day 14. Your system has shifted and it is expected to feel reflective as you come to the end of the challenge.\n\nYou have done something meaningful for your body over these past two weeks.`,
    evening: `Take a moment tonight to notice how you feel.\n\nYour body is clearer. Your rhythm is steadier. Your cravings are softer. Your energy is more predictable.\n\nThese are all signs that your system has responded to your consistency.\n\nDay 14 is complete. You have done well.\n\nCheck your portal and email - your next step is waiting.`,
  },
}

const SMS_TRANSITION: Record<15 | 16 | 17, string> = {
  15: `Good morning.\n\nDay 15 is your transition day. You completed the 14-Day Body Decode and today your body starts adjusting without the same daily structure.\n\nStay close to the rhythm you have built and keep things simple. Your next step is ready in your portal.`,
  16: `Checking in.\n\nHow are you feeling without the full challenge structure?\n\nWhat feels easiest to keep in place - meals, water, sleep, or your general rhythm?\n\nThe 6-Week Body Recode Blueprint is where this reset becomes a result. Reply NEXT if you want the details.`,
  17: `One last check in.\n\nYou finished the 14-Day Body Decode Challenge. That is not nothing.\n\nThe next phase - the 6-Week Blueprint - takes everything you started and builds on it with progressive training, signal-guided nutrition, and weekly accountability.\n\nHead to your portal to see the full next step.`,
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
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject: `Day 5 - Your Week One Progress Session is ready`,
        html: challengeEmailShell(`
${emailEyebrow('Day 5 · Week One Progress')}
${emailHeading('Your Week One session is ready.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('You have made it to Day 5. That puts you ahead of most people who started.')}
${emailBody('Your Week One Progress Session is now available to watch. It is a 30-minute session I recorded specifically for this point in the challenge.')}
${emailFeaturedCard(
  emailNumberedList([
    'What your body has actually been doing this week',
    'How to decode the signals you have been feeling — energy, digestion, puffiness, mood',
    'Why rhythm matters more than restriction',
    'What Week 2 is building toward',
    'The next step after the challenge for those who want to go deeper',
  ]),
  { eyebrow: 'In this session' },
)}
${emailBody('I also share the personal story behind how I built this system. Watch it today while you are in the middle of the reset — it will make Week 2 feel much clearer.', { bottom: 28 })}
${emailCta({ href: sessionVideoUrl, label: 'Watch the session (30 min)' })}
${emailUrlFallback(sessionVideoUrl, 'Or find this in your portal under the Live Session section')}
`),
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

      // Day 14 reveal gate (locked 2026-05-30): if the participant
      // completed the Check-In during the Challenge, this email is their
      // Result Reveal moment AND the Blueprint ascension push, combined.
      // If they did not complete the Check-In, send the plain ascension
      // email (no result content to reveal).
      const completedCheckIn = Boolean(enrollment.quiz_completed_at && enrollment.quiz_result)
      const patternSlug = completedCheckIn
        ? legacyLetterToSlug(enrollment.quiz_result as string)
        : null
      const progressScore = completedCheckIn && enrollment.quiz_answers
        ? Object.entries(enrollment.quiz_answers as Record<string, string>)
            .filter(([key, val]) => !key.startsWith('sq') && val === 'better')
            .length
        : 0

      const subject = completedCheckIn
        ? `${firstName}, your Day 14 result + what's next`
        : `${firstName}, you finished the 14 days.`

      const resultRevealBlock = completedCheckIn && patternSlug
        ? buildResultRevealBlock(patternSlug, progressScore)
        : ''

      const introBody = completedCheckIn
        ? `${emailBody('You finished the 14 days. Here is what your body has been doing, the pattern your biology has settled into, and what comes next.')}`
        : `${emailBody('You finished the challenge. That is not nothing.')}${emailBody('Most people who start something like this quit before Day 5. You made it to Day 14. That means your body has had 14 consecutive days of structured rhythm. Consistent training, real food, better sleep, predictable timing.')}${emailFeaturedCard(emailNumberedList(['Reduced the daily puffiness and inflammation','Stabilised your energy across the day','Calmed the afternoon cravings','Improved your sleep quality','Given your digestion a cleaner baseline']), { eyebrow: 'What that should have done' })}`

      const bridgeBody = completedCheckIn
        ? `${emailBody('This is your baseline now. The question is: what do you build on top of it?')}${emailBody('Your pattern (above) is the answer. The next dose is correction. The 6-Week Body Rewire Blueprint takes the pattern you have just had read and runs six weeks of focused, pattern-specific corrective work. Training calibrated. Nutrition timed. Weekly coaching written for your pattern.', { bottom: 24 })}`
        : `${emailBody('This is your baseline now. The question is: what do you build on top of it?')}${emailBody('The 6-Week Body Rewire Blueprint takes everything you have started and runs six weeks of focused, pattern-specific corrective work. Training calibrated. Nutrition timed. Weekly coaching written for your pattern.', { bottom: 24 })}`

      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject,
        html: challengeEmailShell(`
${emailEyebrow(completedCheckIn ? 'Day 14 · Challenge complete + Result reveal' : 'Day 14 · Challenge Complete')}
${emailHeading(completedCheckIn ? `Your Body Decode result, ${firstName}.` : `14 days done, ${firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${introBody}
${resultRevealBlock}
${bridgeBody}
${emailStatusCard({
  eyebrow: 'Next step',
  headline: '6-Week Body Rewire Blueprint',
  body: 'Six weeks of pattern-specific corrective work. $97 one-time. Your pattern carries through from the Challenge into Week 1.',
})}
${emailCta({ href: 'https://bodyrecode.au/blueprint?source=challenge_day14_ascension', label: 'Start the 6-Week Blueprint · $97' })}
${emailUrlFallback('https://bodyrecode.au/blueprint?source=challenge_day14_ascension', 'Or paste this link into your browser')}
${emailBody('Or just reply to this email and I will personally help you figure out the right next step.', { size: 14, bottom: 0 })}
`),
      })

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

    for (let day = 1; day <= 14; day++) {
      const msgs = SMS_MESSAGES[day]

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

      // Morning message
      await step.run(`sms-day${day}-morning`, async () => {
        let msg = msgs.morning
        if (day === 1) msg += `\n\nYour portal: ${portalUrl}`
        if (day === 7) msg += `\n\nPortal: ${portalUrl}`
        await sendSms({ to: formattedPhone, message: msg })
      })

      // Wait ~7h then afternoon message
      await step.sleep(`sms-day${day}-afternoon-wait`, '7h')
      await step.run(`sms-day${day}-afternoon`, async () => {
        let msg = msgs.afternoon
        if (day === 5) msg += `\n\nPortal: ${portalUrl}`
        await sendSms({ to: formattedPhone, message: msg })
      })

      // Wait ~5h then evening message
      await step.sleep(`sms-day${day}-evening-wait`, '5h')
      await step.run(`sms-day${day}-evening`, async () => {
        await sendSms({ to: formattedPhone, message: msgs.evening })
      })

      // Wait ~12h to start next day's morning message (total 24h cycle)
      if (day < 14) {
        await step.sleep(`sms-day${day}-next-day-wait`, '12h')
      }
    }

    // Transition days 15-17 (one message per day, 24h apart)
    for (const day of [15, 16, 17] as const) {
      await step.sleep(`sms-transition-day${day}-wait`, day === 15 ? '12h' : '24h')
      await step.run(`sms-transition-day${day}`, async () => {
        let msg = SMS_TRANSITION[day]
        if (day === 15 || day === 17) msg += `\n\nPortal: ${portalUrl}`
        await sendSms({ to: formattedPhone, message: msg })
      })
    }

    // Suppress unused variable warning
    void firstName
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
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
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
          await resend.emails.send({
            from: 'Kade at Body Recode <kade@bodyrecode.au>',
            to: email,
            subject: `Week ${completedWeek} check-in is due`,
            html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
        <tr><td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
          <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;" />
        </td></tr>
        <tr><td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#999999;">
          <p style="margin:0 0 18px;font-size:15px;color:#999999;">Hi ${firstName},</p>
          <p style="margin:0 0 18px;font-size:15px;color:#999999;">Week ${completedWeek} is complete. Week ${week} is now live in your portal.</p>
          <p style="margin:0 0 18px;font-size:15px;color:#999999;">Before you move into the new week, take 2 minutes to submit your Week ${completedWeek} check-in. It tracks the 8 biological markers that show whether the programme is working - energy, sleep, recovery, cravings, and more.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
            <tr><td><a href="${portalUrl}" style="display:inline-block;padding:14px 28px;background:#1B6DFC;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Submit Week ${completedWeek} Check-In</a></td></tr>
          </table>
          ${darkEmailSignature()}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
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
          await resend.emails.send({
            from: 'Kade at Body Recode <kade@bodyrecode.au>',
            to: email,
            subject: `Reminder: Week ${completedWeek} check-in not yet submitted`,
            html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
        <tr><td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
          <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;" />
        </td></tr>
        <tr><td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#999999;">
          <p style="margin:0 0 18px;font-size:15px;color:#999999;">Hi ${firstName},</p>
          <p style="margin:0 0 18px;font-size:15px;color:#999999;">Your Week ${completedWeek} check-in is still outstanding. It takes 2 minutes and gives you a clear read on what the programme is doing to your biology.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
            <tr><td><a href="${portalUrl}" style="display:inline-block;padding:14px 28px;background:#1B6DFC;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Submit Check-In Now</a></td></tr>
          </table>
          ${darkEmailSignature()}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
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
