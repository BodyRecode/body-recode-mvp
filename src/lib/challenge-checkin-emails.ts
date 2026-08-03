// Shared email builders for the Body Decode Check-In flow.
// Two emails:
//   1. Day 7 Progress email — sent when participant submits on Day 7-13.
//      Contains progress score + per-marker breakdown + brief
//      interpretation + universal Week 2 guidance + Day 14 teaser.
//      NO pattern reveal. Pattern is held for Day 14.
//   2. Day 14 Body Decode Report email — sent at Day 14 by Inngest (if
//      Check-In was completed), OR sent immediately by the API route
//      when a late-taker submits on/after Day 14. Contains progress
//      recap + pattern card + pattern-specific actions + Blueprint
//      ascension push.
// Both consumed by:
//   - src/app/api/challenge/quiz/route.ts
//   - src/lib/inngest-functions.ts (Body Decode Report only)
//
// Keep the email visual treatment in lock-step with the in-portal
// Day7InPortalView and CheckInResult components in body-decode-check-in.tsx.

import { darkEmailSignature } from './email-signature'
import { CHECKIN_PATTERNS } from './checkin-patterns'
import { DAY_14_ASCENSION_POSTER } from './video-urls'
import { PROGRESS_MARKERS, MARKER_RATING_META, type MarkerRating } from './checkin-markers'
import { logoUrl, brand } from '@/config/tenant'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailFeaturedCard, emailNumberedList, emailStatusCard,
} from './email-shell'

// Outer shell shared with the Day 5 unlock + Day 14 fallback builders below.
// The Day 7 + Day 14 Report builders earlier in this file use their own
// inline `emailShell` because they were written before the helpers landed.
function challengeArcShell(body: string): string {
  return darkEmailShell(`
${emailLogo()}
${body}
${darkEmailSignature()}
`)
}

function emailShell(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
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
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#4A4A4A;">
              ${body}
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`
}

function progressScoreCard(progressScore: number): string {
  const progressPercent = Math.round((progressScore / 8) * 100)
  return `
<div style="background:#FFFFFF;border:1px solid #E5E5E5;border-left:3px solid #1B6DFC;border-radius:14px;padding:24px 26px;margin:0 0 16px;">
  <p style="font-size:11px;font-weight:700;color:#1056D6;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 16px;">
    Your 7-Day Progress
  </p>
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
    <tr>
      <td style="vertical-align:baseline;padding:0;">
        <span style="font-size:52px;font-weight:900;color:#1B6DFC;letter-spacing:-0.04em;line-height:1;">${progressScore}</span>
      </td>
      <td style="vertical-align:baseline;padding:0 0 0 14px;">
        <span style="font-size:15px;font-weight:600;color:#4A4A4A;">of 8 markers<br/>improving</span>
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
  <p style="font-size:14px;color:#4A4A4A;margin:0;line-height:1.65;">
    ${progressScore >= 6
      ? 'Most of your markers are improving. Your system has responded well to the first week of structure. The markers that have not shifted yet usually follow as the rhythm carries forward.'
      : progressScore >= 4
      ? 'A solid first week. Some markers are clearly shifting, others are still settling. That mix is exactly what Day 7 looks like for most participants.'
      : 'Your body is still finding its baseline. That happens for some people. The shifts often appear later in Week 2 once the system has had more time with the new structure.'}
  </p>
</div>
`
}

function markerBreakdownCard(markerRatings: Record<string, string>): string {
  return `
<div style="background:#FFFFFF;border:1px solid #E5E5E5;border-radius:14px;padding:24px 26px;margin:0 0 16px;">
  <p style="font-size:11px;font-weight:700;color:#1056D6;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 16px;">
    Marker-by-marker
  </p>
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    ${PROGRESS_MARKERS.map((m, i) => {
      const ratingKey = ((markerRatings[m.id] ?? 'same') as MarkerRating)
      const meta = MARKER_RATING_META[ratingKey]
      const borderBottom = i < PROGRESS_MARKERS.length - 1 ? '1px solid #F0F0F0' : 'none'
      return `
        <tr>
          <td style="padding:12px 14px 12px 0;border-bottom:${borderBottom};vertical-align:middle;">
            <p style="font-size:14px;font-weight:700;color:#1A1A1A;margin:0 0 2px;">${m.label}</p>
            <p style="font-size:12px;color:#6B6B6B;margin:0;line-height:1.5;">${m.sub}</p>
          </td>
          <td style="padding:12px 0;border-bottom:${borderBottom};text-align:right;vertical-align:middle;white-space:nowrap;">
            <span style="display:inline-block;font-size:11px;font-weight:700;color:${meta.color};background:${meta.background};border:1px solid ${meta.border};padding:5px 11px;border-radius:99px;letter-spacing:0.04em;">
              ${meta.label}
            </span>
          </td>
        </tr>`
    }).join('')}
  </table>
</div>
`
}

function weekTwoGuidanceCard(): string {
  const principles = [
    'Protect sleep above all else. Most of the biological work this Challenge is doing happens overnight. Cortisol resets, hormones recalibrate, inflammation lowers.',
    'Keep training intensity moderate. The reset only works if the system feels safe. Hard sessions spike cortisol and slow the regulation.',
    'Eat breakfast within 60 minutes of waking. This anchors the cortisol curve and sets the rhythm for the rest of the day.',
    'Walk after your evening meal. 15-20 minutes is enough. It lowers post-meal blood sugar and supports the overnight insulin recovery.',
  ]
  return `
<div style="background:#FFFFFF;border:1px solid #E5E5E5;border-radius:14px;padding:24px 26px;margin:0 0 16px;">
  <p style="font-size:11px;font-weight:700;color:#1B6DFC;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 16px;">
    What to focus on in Week 2
  </p>
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    ${principles.map((principle, i) => `
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:28px;">
          <span style="font-size:11px;font-weight:800;color:#1B6DFC;font-family:monospace;">${String(i + 1).padStart(2, '0')}</span>
        </td>
        <td style="padding:8px 0;font-size:14px;color:#4A4A4A;line-height:1.7;">${principle}</td>
      </tr>
    `).join('')}
  </table>
</div>
`
}

function day14TeaserCard(): string {
  return `
<div style="background:#1A1A1A;border:1px solid rgba(27,109,252,0.3);border-radius:14px;padding:24px 26px;margin:0 0 24px;">
  <p style="font-size:11px;font-weight:700;color:#B5CFFC;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 12px;">
    On Day 14
  </p>
  <p style="font-size:20px;font-weight:800;color:#FFFFFF;letter-spacing:-0.02em;margin:0 0 12px;line-height:1.25;">
    Your full Body Decode Report.
  </p>
  <p style="font-size:14px;color:#B5CFFC;margin:0;line-height:1.7;">
    On Day 14 you receive the full read. Which of four patterns your body is currently working through, why fat loss has stalled in your specific case, and the three pattern-specific actions for what comes next. Stay consistent until then. The reveal is the reward for the work you put in across the full 14 days.
  </p>
</div>
`
}

function patternHeroCard(patternSlug: string): string {
  const p = CHECKIN_PATTERNS[patternSlug]
  if (!p) return ''
  return `
<div style="background:#1A1A1A;border:1px solid ${p.color}40;border-left:4px solid ${p.color};border-radius:16px;padding:32px 28px;margin:0 0 16px;">
  <p style="font-size:11px;font-weight:700;color:${p.color};letter-spacing:0.18em;text-transform:uppercase;margin:0 0 14px;">
    Your Biological Pattern
  </p>
  <p style="font-size:32px;font-weight:900;color:#FFFFFF;margin:0 0 18px;letter-spacing:-0.025em;line-height:1.1;">
    ${p.label}
  </p>
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;"><tr><td style="width:40px;height:3px;background:${p.color};border-radius:2px;line-height:0;">&nbsp;</td></tr></table>
  <p style="font-size:15px;color:#D5D5D5;line-height:1.75;margin:0;">
    ${p.desc}
  </p>
</div>
`
}

function patternMeansCard(patternSlug: string): string {
  const p = CHECKIN_PATTERNS[patternSlug]
  if (!p) return ''
  return `
<div style="background:#FFFFFF;border:1px solid #E5E5E5;border-radius:14px;padding:24px 26px;margin:0 0 16px;">
  <p style="font-size:11px;font-weight:700;color:${p.color};letter-spacing:0.14em;text-transform:uppercase;margin:0 0 14px;">
    What this pattern means
  </p>
  ${p.whatItMeans.map((para, i) => `
    <p style="font-size:14px;color:#4A4A4A;line-height:1.75;margin:${i === 0 ? '0' : '14px 0 0'};">
      ${para}
    </p>
  `).join('')}
</div>
`
}

function patternShowsCard(patternSlug: string): string {
  const p = CHECKIN_PATTERNS[patternSlug]
  if (!p) return ''
  return `
<div style="background:#FFFFFF;border:1px solid #E5E5E5;border-radius:14px;padding:24px 26px;margin:0 0 16px;">
  <p style="font-size:11px;font-weight:700;color:${p.color};letter-spacing:0.14em;text-transform:uppercase;margin:0 0 14px;">
    Where this shows up
  </p>
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    ${p.whereItShows.map(item => `
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:18px;">
          <span style="display:inline-block;width:6px;height:6px;background:${p.color};border-radius:99px;margin-top:9px;"></span>
        </td>
        <td style="padding:8px 0;font-size:14px;color:#4A4A4A;line-height:1.65;">${item}</td>
      </tr>
    `).join('')}
  </table>
</div>
`
}

function patternIsNotCard(patternSlug: string): string {
  const p = CHECKIN_PATTERNS[patternSlug]
  if (!p) return ''
  return `
<div style="background:#F7F7F5;border:1px solid #E5E5E5;border-radius:14px;padding:24px 26px;margin:0 0 16px;">
  <p style="font-size:11px;font-weight:700;color:#6B6B6B;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 8px;">
    What this is NOT
  </p>
  <p style="font-size:13px;color:#6B6B6B;line-height:1.6;margin:0 0 14px;font-style:italic;">
    Read these. The way this pattern is usually framed is part of the reason it stays unsolved.
  </p>
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    ${p.whatItIsNot.map(item => `
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:24px;">
          <span style="font-size:14px;font-weight:800;color:#6B6B6B;">×</span>
        </td>
        <td style="padding:8px 0;font-size:14px;color:#4A4A4A;line-height:1.65;">${item}</td>
      </tr>
    `).join('')}
  </table>
</div>
`
}

function patternActionsCard(patternSlug: string): string {
  const p = CHECKIN_PATTERNS[patternSlug]
  if (!p) return ''
  return `
<div style="background:#FFFFFF;border:1px solid #E5E5E5;border-radius:14px;padding:24px;margin:0 0 24px;">
  <p style="font-size:11px;font-weight:700;color:#1B6DFC;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 16px;">
    Your three pattern-specific actions
  </p>
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    ${p.actions.map((action, i) => `
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:28px;">
          <span style="font-size:11px;font-weight:800;color:${p.color};font-family:monospace;">${String(i + 1).padStart(2, '0')}</span>
        </td>
        <td style="padding:8px 0;font-size:14px;color:#4A4A4A;line-height:1.65;">${action}</td>
      </tr>
    `).join('')}
  </table>
</div>
`
}

// Day 14 ascension reel - 9:16 vertical, sells the Blueprint at Challenge end.
// Email clients cannot play inline video, so this is a clickable poster. It
// opens /watch/ascension, NOT the raw storage file: a Supabase URL in the
// address bar reads as an untrusted link to a lead and exposes backend infra,
// and a bare mp4 strands the viewer with no next step. The watch page keeps
// the offer directly under the video.
function ascensionReelCard(): string {
  const href = `${brand().marketingDomain}/watch/ascension?source=challenge_day14_report`
  return `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;">
  <tr>
    <td align="center">
      <a href="${href}" style="text-decoration:none;display:block;">
        <table cellpadding="0" cellspacing="0" border="0" width="260" style="width:260px;">
          <tr>
            <td style="border-radius:16px 16px 0 0;overflow:hidden;line-height:0;font-size:0;">
              <img src="${DAY_14_ASCENSION_POSTER}" width="260" alt="What comes after the 14 days" style="display:block;width:260px;height:auto;border:0;border-radius:16px 16px 0 0;" />
            </td>
          </tr>
          <tr>
            <td style="background:#1B6DFC;border-radius:0 0 16px 16px;padding:13px 16px;text-align:center;">
              <span style="font-size:13px;font-weight:700;color:#FFFFFF;">&#9654;&nbsp;&nbsp;Watch: what comes next</span>
            </td>
          </tr>
        </table>
      </a>
    </td>
  </tr>
</table>
`
}

function blueprintCtaCard(): string {
  return `
<div style="background:#1A1A1A;border:1px solid rgba(27,109,252,0.3);border-radius:14px;padding:28px 26px;margin:0 0 24px;">
  <p style="font-size:11px;font-weight:700;color:#B5CFFC;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 14px;">
    What comes next
  </p>
  <p style="font-size:20px;font-weight:800;color:#FFFFFF;letter-spacing:-0.02em;margin:0 0 14px;line-height:1.25;">
    The 6-Week Body Rewire Blueprint.
  </p>
  <p style="font-size:14px;color:#D5D5D5;line-height:1.75;margin:0 0 18px;">
    You have read your pattern. The next dose is correction. The Blueprint takes the pattern you have just had read and runs six weeks of focused, pattern-specific corrective work. Training calibrated. Nutrition timed. Weekly coaching written for your pattern.
  </p>
  <a href="${brand().marketingDomain}/blueprint?source=challenge_day14_report" style="display:inline-block;padding:14px 24px;border-radius:10px;background:#1B6DFC;color:#FFFFFF;font-size:14px;font-weight:800;text-decoration:none;">
    Start the 6-Week Blueprint · $97
  </a>
</div>
`
}

// ─── Day 7 Progress Email ───────────────────────────────────────────────
// Sent on Check-In submission when currentDay is between 7 and 13.
// No pattern reveal. Progress feedback + Week 2 orientation + Day 14 teaser.
export function buildDay7ProgressEmail({
  firstName,
  progressScore,
  markerRatings,
}: {
  firstName: string
  progressScore: number
  markerRatings: Record<string, string>
}): { subject: string; html: string } {
  const subject = `Your Day 7 progress is in, ${firstName}`
  const html = emailShell(`
    <p style="font-size:11px;font-weight:700;color:#1B6DFC;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 14px;">
      Day 7 · Body Decode Check-In
    </p>
    <p style="color:#1A1A1A;font-size:34px;font-weight:900;letter-spacing:-0.035em;line-height:1.1;margin:0 0 14px;">
      Your Day 7 <span style="color:#1B6DFC;">progress is in.</span>
    </p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;"><tr><td style="width:48px;height:3px;background:#1B6DFC;border-radius:2px;line-height:0;">&nbsp;</td></tr></table>
    <p style="color:#4A4A4A;font-size:15px;line-height:1.7;margin:0;">Hi ${firstName},</p>
    <p style="color:#4A4A4A;font-size:15px;line-height:1.7;margin:8px 0 24px;">
      You finished the Check-In. Below is what your body has done across the first seven days, what those signals mean, and what to focus on through Week 2. Your full Body Decode Report arrives on Day 14.
    </p>
    ${progressScoreCard(progressScore)}
    ${markerBreakdownCard(markerRatings)}
    ${weekTwoGuidanceCard()}
    ${day14TeaserCard()}
    <p style="color:#4A4A4A;font-size:14px;line-height:1.7;margin:0;">Keep going. The shifts compound when the rhythm holds.</p>
  `)
  return { subject, html }
}

// ─── Day 14 Body Decode Report Email ────────────────────────────────────
// Sent on Day 14 by Inngest if Check-In was completed, OR sent immediately
// by the API route when a late-taker submits on/after Day 14.
// Pattern-focused: hero + what this pattern means + where this shows up +
// what this is NOT (anti-shame misreads) + three pattern actions +
// Blueprint ascension push. Progress recap intentionally OMITTED; the
// participant already saw it in the Day 7 Progress email. A single bridge
// callback line at the top references the Day 7 score.
export function buildDay14BodyDecodeReportEmail({
  firstName,
  patternSlug,
  progressScore,
}: {
  firstName: string
  patternSlug: string
  progressScore: number
}): { subject: string; html: string } {
  const subject = `${firstName}, your Body Decode Report is ready`
  const html = emailShell(`
    <p style="font-size:11px;font-weight:700;color:#1B6DFC;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 14px;">
      Day 14 · Body Decode Report
    </p>
    <p style="color:#1A1A1A;font-size:34px;font-weight:900;letter-spacing:-0.035em;line-height:1.1;margin:0 0 14px;">
      Your Body Decode <span style="color:#1B6DFC;">Report.</span>
    </p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;"><tr><td style="width:48px;height:3px;background:#1B6DFC;border-radius:2px;line-height:0;">&nbsp;</td></tr></table>
    <p style="color:#4A4A4A;font-size:15px;line-height:1.7;margin:0;">Hi ${firstName},</p>
    <p style="color:#4A4A4A;font-size:15px;line-height:1.7;margin:8px 0 8px;">
      You finished the 14 days. On Day 7 you logged ${progressScore} of 8 markers improving. That signal is what made this reading possible.
    </p>
    <p style="color:#4A4A4A;font-size:15px;line-height:1.7;margin:0 0 22px;">
      Below is the read itself. The pattern your biology has settled into, what it actually means, where it shows up, what it is commonly mistaken for, the three actions specific to it, and what to do next.
    </p>
    ${patternHeroCard(patternSlug)}
    ${patternMeansCard(patternSlug)}
    ${patternShowsCard(patternSlug)}
    ${patternIsNotCard(patternSlug)}
    ${patternActionsCard(patternSlug)}
    <p style="color:#4A4A4A;font-size:15px;line-height:1.7;margin:0 0 20px;">
      This is your baseline now. The question is what you build on top of it.
    </p>
    ${ascensionReelCard()}
    ${blueprintCtaCard()}
    <p style="color:#4A4A4A;font-size:14px;line-height:1.7;margin:0;">Or just reply to this email and I will personally help you figure out the right next step.</p>
  `)
  return { subject, html }
}

// ─── Day 5 Week One Progress Session Unlock Email ────────────────────────
// Sent at Day 5 by Inngest when the Week One Progress Session video unlocks.
// Single HeyGen render walking participants through what their
// body has done across the first five days. Framing locked v6.1
// (2026-06-04). sessionVideoUrl points at the hosted .mp4 (or the portal
// page if no env var is set).
export function buildDay5UnlockEmail({
  firstName,
  portalUrl,
  sessionVideoUrl,
}: {
  firstName: string
  portalUrl: string
  sessionVideoUrl: string
}): { subject: string; html: string } {
  const subject = `Day 5 - Your Week One Progress Session is ready`
  const html = challengeArcShell(`
${emailEyebrow('Day 5 · Week One Progress')}
${emailHeading('Your Week One session is ready.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('You have made it to Day 5. That puts you ahead of most people who started.')}
${emailBody('Your Week One Progress Session is now available to watch. I recorded it specifically for this point in the challenge.')}
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
${emailCta({ href: sessionVideoUrl, label: 'Watch the session' })}
${emailUrlFallback(sessionVideoUrl, 'Or find this in your portal under the Live Session section')}
`)
  return { subject, html }
}

// ─── Day 0 Intake (Scorecard) Reminder Email ─────────────────────────────
// Sent by Inngest when a Challenge enroller has NOT completed the Day 0
// Body Decode Intake (the in-portal scorecard) after ~24h (first nudge) and
// again after ~72h (second, firmer nudge). Auto-stops the moment the intake
// is done or the enrollment is no longer active.
//
// Why this exists: the scorecard is the first thing inside the portal, and
// enrollers who land directly on /challenge (bypassing the public
// scorecard-first routing) only get one welcome email pointing at it. If
// they do not complete it in that first sitting, nothing chases them back
// until Day 5 - by which point the challenge assumes they are already
// state-typed. ~40% of enrollers were leaking here. This closes the gap.
export function buildDayZeroIntakeReminderEmail({
  firstName,
  portalUrl,
  second = false,
}: {
  firstName: string
  portalUrl: string
  second?: boolean
}): { subject: string; html: string } {
  const subject = second
    ? `${firstName}, your Challenge is on hold until you do this`
    : `${firstName}, one 2-minute step before your Challenge begins`
  const html = challengeArcShell(`
${emailEyebrow('Day 0 · Your starting read')}
${emailHeading(second ? 'Your Challenge is waiting on one step.' : 'Before Day 1, read your starting point.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${second
  ? emailBody('You signed up for the 14-Day Body Decode Challenge, but you have not done your starting read yet. Until you do, your Challenge stays on hold - the whole point is that the 14 days are built around the state your body is actually in, and right now I cannot see it.')
  : emailBody('Welcome again. There is one quick step waiting inside your portal before your 14 days begin: a 2-minute read that tells you which state your body is in right now.')}
${emailBody('It is five short questions. No prep, no numbers to look up. At the end you get your body state and the pattern driving it - and your Challenge unlocks, calibrated to that read.', { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Do your 2-minute read' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
${emailBody('It is the difference between 14 generic days and 14 days built for your body. Takes less time than reading this email.', { size: 14, bottom: 12 })}
${second ? emailBody('If something got in the way, just reply and tell me - I read every one.', { size: 13, color: '#6B6B6B', bottom: 0 }) : ''}
`)
  return { subject, html }
}

// ─── Day 14 Plain Ascension Fallback Email ───────────────────────────────
// Sent at Day 14 by Inngest when the participant did NOT complete the
// Body Decode Check-In. No result to reveal — acknowledgement of the 14
// days finished + Blueprint ascension push. Participants who DID complete
// the Check-In get buildDay14BodyDecodeReportEmail instead (above).
export function buildDay14FallbackEmail({
  firstName,
  enrollmentToken,
}: {
  firstName: string
  enrollmentToken?: string
}): { subject: string; html: string } {
  const subject = `${firstName}, you finished the 14 days.`
  const blueprintUrl = `${brand().marketingDomain}/blueprint?source=challenge_day14_ascension`
  const churnFeedbackLine = enrollmentToken
    ? `${emailBody(`If something got in the way of completing the Check-In, <a href="${brand().marketingDomain}/feedback/challenge-churn/${enrollmentToken}" style="color:#1B6DFC;text-decoration:underline;">tell me what (30 seconds)</a> - the most valuable thing for the next person is hearing what tripped you up.`, { size: 13, color: '#6B6B6B', bottom: 0 })}`
    : ''
  const html = challengeArcShell(`
${emailEyebrow('Day 14 · Challenge Complete')}
${emailHeading(`14 days done, ${firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('You finished the challenge. That is not nothing.')}
${emailBody('Most people who start something like this quit before Day 5. You made it to Day 14. That means your body has had 14 consecutive days of structured rhythm. Consistent training, real food, better sleep, predictable timing.')}
${emailFeaturedCard(emailNumberedList(['Reduced the daily puffiness and inflammation','Stabilised your energy across the day','Calmed the afternoon cravings','Improved your sleep quality','Given your digestion a cleaner baseline']), { eyebrow: 'What that should have done' })}
${emailBody('This is your baseline now. The question is: what do you build on top of it?')}
${emailBody('The 6-Week Body Rewire Blueprint takes everything you have started and runs six weeks of focused, pattern-specific corrective work. Training calibrated. Nutrition timed. Weekly coaching written for your pattern.', { bottom: 24 })}
${emailStatusCard({
  eyebrow: 'Next step',
  headline: '6-Week Body Rewire Blueprint',
  body: 'Six weeks of pattern-specific corrective work. $97 one-time. Your pattern carries through from the Challenge into Week 1.',
})}
${emailCta({ href: blueprintUrl, label: 'Start the 6-Week Blueprint · $97' })}
${emailUrlFallback(blueprintUrl, 'Or paste this link into your browser')}
${emailBody('Or just reply to this email and I will personally help you figure out the right next step.', { size: 14, bottom: 12 })}
${churnFeedbackLine}
`)
  return { subject, html }
}

// ─── Day 7 Check-In prompt + Day 11 reminder ────────────────────────────
// Added 2026-08-03. Before these existed, the Check-In was asked for ONLY by
// two SMS on Day 7. Neither email in the 14-day arc mentioned it. Completion
// sat at 2/28 (7%) against 21/28 (75%) for the Day 0 intake, and because the
// Check-In gates the pattern reveal, 17 of 18 finishers got the no-result
// fallback at Day 14 instead of the Body Decode Report.
//
// Both link STRAIGHT to /check-in, not the Day 7 content page. Both quote
// "five to ten minutes" to match the form itself; the old SMS claim of three
// minutes undersold it and broke the promise on arrival.

export function buildDay7CheckInPromptEmail({
  firstName,
  token,
}: {
  firstName: string
  token: string
}): { subject: string; html: string } {
  const subject = `${firstName}, your Body Decode Check-In is open`
  const checkInUrl = `${brand().marketingDomain}/challenge/${token}/check-in`
  const html = challengeArcShell(`
${emailEyebrow('Day 7 · Body Decode Check-In')}
${emailHeading('One week in. Time to read what changed.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('You have given your body seven consecutive days of structured rhythm. Training, food, sleep, timing. That is long enough for real signals to show up.')}
${emailBody('The Body Decode Check-In reads those signals. You rate eight biological markers against how they felt on Day 1, then answer two questions about where your body holds and how it responds. Five to ten minutes.')}
${emailFeaturedCard(emailNumberedList([
  'Your 7-day progress read, straight away, showing which markers have moved',
  'Your Week 2 focus, so the second half is not a repeat of the first',
  'Your full Body Decode Report on Day 14, naming which of the four patterns your body is working through',
]), { eyebrow: 'What it gives you' })}
${emailBody('This is the part that makes the rest of the Challenge mean something. Without it, Day 14 is just a date. With it, Day 14 is a read on why your body has been behaving the way it has.', { bottom: 24 })}
${emailCta({ href: checkInUrl, label: 'Take the Check-In' })}
${emailUrlFallback(checkInUrl, 'Or paste this link into your browser')}
${emailBody('Rate the markers honestly. There is no right answer and it is not a test. It only works if it reflects what is actually happening.', { size: 14, color: '#6B6B6B', bottom: 0 })}
`)
  return { subject, html }
}

export function buildCheckInReminderEmail({
  firstName,
  token,
  daysLeft,
}: {
  firstName: string
  token: string
  daysLeft: number
}): { subject: string; html: string } {
  const subject = `${firstName}, your Day 14 read needs this first`
  const checkInUrl = `${brand().marketingDomain}/challenge/${token}/check-in`
  const dayWord = daysLeft === 1 ? 'day' : 'days'
  const html = challengeArcShell(`
${emailEyebrow('Body Decode Check-In · still open')}
${emailHeading('Your Report is built from this.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(`You have not done the Body Decode Check-In yet, and there ${daysLeft === 1 ? 'is' : 'are'} ${daysLeft} ${dayWord} left before Day 14.`)}
${emailBody('Worth being straight with you about what that means. The Body Decode Report on Day 14 is generated from your Check-In answers. No Check-In, no pattern, no Report. You would finish the fourteen days and get a well done, which is not why you started.')}
${emailStatusCard({
  eyebrow: 'What you are missing',
  headline: 'The pattern your body is working through',
  body: 'Which of the four patterns is driving what you have been fighting, where it shows up, what it is commonly mistaken for, and the three actions specific to it.',
})}
${emailBody('It takes five to ten minutes and you can do it on your phone. Eight markers rated against Day 1, then two questions.', { bottom: 24 })}
${emailCta({ href: checkInUrl, label: 'Take the Check-In' })}
${emailUrlFallback(checkInUrl, 'Or paste this link into your browser')}
${emailBody('If something is genuinely in the way, reply and tell me. I would rather know than have you finish with nothing to show for the fortnight.', { size: 14, bottom: 0 })}
`)
  return { subject, html }
}

// Day 21 (= 7 days after Day 14) feedback / NPS email. Lighter ask than the
// in-portal Day 14 capture - by Day 21 the experience has had time to settle,
// and we ask "would you recommend" with permission flow attached.
export function buildDay21FeedbackEmail({
  firstName,
  enrollmentToken,
}: {
  firstName: string
  enrollmentToken: string
}): { subject: string; html: string } {
  const subject = `${firstName}, one quick read on how the 14 days landed`
  const feedbackUrl = `${brand().marketingDomain}/feedback/day21/${enrollmentToken}`
  const html = challengeArcShell(`
${emailEyebrow('Day 21 · Feedback')}
${emailHeading(`How did the 14 days actually land?`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('You finished the 14-Day Body Decode last week. A week is enough time to feel whether the read landed in your body, not just in your head.')}
${emailBody('One ask. Two questions. Takes 30 seconds.', { bottom: 16 })}
${emailFeaturedCard(`
  <p style="margin:0 0 8px;font-size:15px;color:#1A1A1A;font-weight:700;">1. Would you recommend this to someone like you?</p>
  <p style="margin:0 0 16px;font-size:13px;color:#5C5C5C;line-height:1.55;">0 = definitely not. 10 = absolutely.</p>
  <p style="margin:0 0 8px;font-size:15px;color:#1A1A1A;font-weight:700;">2. Optional: in a sentence, what's the one thing you'd tell them?</p>
  <p style="margin:0;font-size:13px;color:#5C5C5C;line-height:1.55;">If you say something we could share publicly, we will email you separately to ask permission first.</p>
`, { eyebrow: 'Two questions' })}
${emailCta({ href: feedbackUrl, label: 'Give 30-second feedback' })}
${emailUrlFallback(feedbackUrl, 'Or paste this into your browser')}
${emailBody('Your feedback shapes whether the read works for someone tomorrow. That is the only reason for the ask.', { size: 13, bottom: 0 })}
`)
  return { subject, html }
}
