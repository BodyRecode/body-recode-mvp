// Blueprint email builders.
//
// All Blueprint-side outbound emails compose from this file so the preview
// route at /dashboard/preview/blueprint-emails can render exactly what gets
// sent.
//
// Inventory:
//   - buildBlueprintPurchaseWelcomeEmail   — Stripe webhook, "Your 6-week programme is ready"
//   - buildBlueprintCoachNotificationEmail — Stripe webhook, coach-only "Blueprint purchased - {name}"
//   - buildBlueprintWeekEmail              — blueprintEmailSequenceFunction, Weeks 1-6 (pattern-aware)
//   - buildBlueprintWeek7FollowupEmail     — blueprintEmailSequenceFunction, "Six weeks done, {firstName}"
//   - buildBlueprintCheckinPromptEmail     — blueprintWeekAdvanceFunction, Week N check-in due
//   - buildBlueprintCheckinReminderEmail   — blueprintWeekAdvanceFunction, 2-day reminder
//
// All builders return {subject, html}. Outbound shell is darkEmailShell
// (which actually produces a LIGHT-themed email — see project_dark_email_shell_rename
// memory; rename queued for a future cleanup).

import { darkEmailSignature } from './email-signature'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailCta, emailFeaturedCard, emailNumberedList, emailStatusCard,
} from './email-shell'

export const BLUEPRINT_PATTERN_LABELS: Record<string, string> = {
  'stress-stored': 'Stress-Stored',
  'metabolic-drift': 'Insulin-Drift',
  'hormonal-shift': 'Estrogen-Shift',
  'system-overload': 'Androgen-Decline',
}

export const BLUEPRINT_PATTERN_COLOURS: Record<string, string> = {
  'stress-stored': '#DC2626',
  'metabolic-drift': '#B7791F',
  'hormonal-shift': '#8b5cf6',
  'system-overload': '#1B6DFC',
}

// PLACEHOLDER — swap the poster block for a real thumbnail image + hosted-video
// link once the video lands. Email clients cannot play inline video, so the real
// version is a clickable poster linking to the hosted video / portal.
function blueprintVideoPlaceholderCard(label: string, href: string): string {
  return `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;">
  <tr>
    <td align="center">
      <a href="${href}" style="text-decoration:none;display:block;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;">
          <tr>
            <td style="background:#1A1A1A;border:1px dashed rgba(27,109,252,0.5);border-radius:14px;height:290px;text-align:center;vertical-align:middle;">
              <div style="font-size:42px;line-height:1;color:#1B6DFC;margin:0 0 12px;">&#9654;</div>
              <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#B5CFFC;margin:0 0 6px;">Video placeholder</div>
              <div style="font-size:13px;color:#8FB4F5;padding:0 28px;line-height:1.5;">${label}</div>
            </td>
          </tr>
        </table>
      </a>
    </td>
  </tr>
</table>
`
}

function blueprintShell(body: string): string {
  return darkEmailShell(`
${emailLogo()}
${body}
${darkEmailSignature()}
`)
}

export function buildBlueprintCheckinPromptEmail({
  firstName,
  completedWeek,
  newWeek,
  portalUrl,
}: {
  firstName: string
  completedWeek: number
  newWeek: number
  portalUrl: string
}): { subject: string; html: string } {
  const subject = `Week ${completedWeek} check-in is due`
  const html = blueprintShell(`
${emailEyebrow(`Week ${completedWeek} · Check-In Due`)}
${emailHeading(`Submit your Week ${completedWeek} check-in.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(`Week ${completedWeek} is complete. Week ${newWeek} is now live in your portal.`)}
${emailBody(`Before you move into the new week, take 2 minutes to submit your Week ${completedWeek} check-in. It tracks the 8 biological markers that show whether the programme is working — energy, sleep, recovery, cravings, and more.`, { bottom: 28 })}
${emailCta({ href: portalUrl, label: `Submit Week ${completedWeek} Check-In` })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
`)
  return { subject, html }
}

export function buildBlueprintCheckinReminderEmail({
  firstName,
  completedWeek,
  portalUrl,
}: {
  firstName: string
  completedWeek: number
  portalUrl: string
}): { subject: string; html: string } {
  const subject = `Reminder: Week ${completedWeek} check-in not yet submitted`
  const html = blueprintShell(`
${emailEyebrow(`Week ${completedWeek} · Reminder`)}
${emailHeading(`Week ${completedWeek} check-in still outstanding.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(`Your Week ${completedWeek} check-in is still outstanding. It takes 2 minutes and gives you a clear read on what the programme is doing to your biology.`, { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Submit Check-In Now' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
`)
  return { subject, html }
}

// ─── Stripe Webhook Emails ────────────────────────────────────────────────

export function buildBlueprintPurchaseWelcomeEmail({
  firstName,
  portalUrl,
  pattern,
}: {
  firstName: string
  portalUrl: string
  pattern: string | null
}): { subject: string; html: string } {
  const subject = `Your 6-Week Body Rewire Blueprint is ready`
  const patternDisplay = pattern ? BLUEPRINT_PATTERN_LABELS[pattern] ?? pattern : null

  const phaseLines = [
    '<strong style="color:#1A1A1A;">Phase 1 — Regulate</strong> (Weeks 1-2). Re-establish structure and biological rhythm.',
    '<strong style="color:#1A1A1A;">Phase 2 — Adapt</strong> (Weeks 3-4). Drive adaptation through progressive load.',
    '<strong style="color:#1A1A1A;">Phase 3 — Embed</strong> (Weeks 5-6). Lock in the new baseline before Stage 3.',
  ]
  const patternLine = patternDisplay
    ? `Your programme has been built around your <strong style="color:#1A1A1A;">${patternDisplay}</strong> pattern.`
    : 'Your first step is a short pattern assessment so the programme can be built around your biology.'

  const welcomeVideoBlock = patternDisplay
    ? emailBody(`A short welcome video, made for your ${patternDisplay} pattern, walks you through what the next six weeks is built to do.`) + blueprintVideoPlaceholderCard(`Your ${patternDisplay} welcome video drops here`, portalUrl)
    : ''

  const inner = `
${emailLogo()}
${emailEyebrow('Body Rewire Blueprint')}
${emailHeading('Your 6-week programme is ready.')}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody(patternLine)}
${welcomeVideoBlock}
${emailBody('The programme runs across three phases:')}
${emailFeaturedCard(emailNumberedList(phaseLines), { eyebrow: 'How the six weeks unfold' })}
${emailCta({ href: portalUrl, label: 'Open my Blueprint' })}
${emailUrlFallback(portalUrl, 'Bookmark this link — your portal for the full 6 weeks')}
${darkEmailSignature()}
`
  return {
    subject,
    html: darkEmailShell(inner, { previewText: `${firstName}, your Blueprint is ready.` }),
  }
}

export function buildBlueprintCoachNotificationEmail({
  name,
  email,
  pattern,
}: {
  name: string
  email: string
  pattern: string | null
}): { subject: string; html: string } {
  const subject = `Blueprint purchased - ${name}`
  const patternDisplay = pattern ? BLUEPRINT_PATTERN_LABELS[pattern] ?? pattern : null
  const inner = `
${emailLogo()}
${emailEyebrow('Blueprint Purchased')}
${emailHeading(`${name} bought the Blueprint.`)}
${emailDivider()}
${emailStatusCard({
  eyebrow: 'New enrollment',
  headline: `Email: ${email}`,
  body: `Pattern: ${patternDisplay ?? 'Pending assessment'}. Week-advance sequence has been fired via Inngest.`,
})}
${darkEmailSignature()}
`
  return {
    subject,
    html: darkEmailShell(inner, { previewText: `${name} bought the Blueprint.` }),
  }
}

// ─── Weekly Programme Emails (Weeks 1-6 + Week 7 Follow-up) ──────────────

// Pattern-callout shell: wraps the week-email body with a left-border
// pattern-specific callout block below the body content. Lifted from the
// inline blueprintEmailShell helper that previously lived in inngest-functions.ts.
function blueprintWeekShell(body: string, patternLabel: string, patternColour: string, patternCallout: string): string {
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

const BLUEPRINT_WEEK_EMAILS: Record<number, {
  subject: (firstName: string) => string
  body: (firstName: string, portalUrl: string) => string
  patternBlock: Record<string, string>
}> = {
  1: {
    subject: (n) => `Week 1 starts now, ${n}.`,
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
      'stress-stored':   'Your nervous system has been operating in a chronic protect-state. Week 1 lowers the demand on your system rather than increasing it. The biological adaptation here is downregulation, not progress in the traditional sense. Trust the structure.',
      'metabolic-drift': 'Your insulin sensitivity has drifted. Week 1 begins the process of rebuilding it through consistent meal timing rather than restriction. The training load is intentionally moderate — the metabolic work happens in the kitchen, not the gym, this week.',
      'hormonal-shift':  'Your reproductive hormone signalling has been compromised by under-fuelling, over-training, or both. Week 1 increases the inputs and reduces the output. Counter-intuitive but biologically necessary.',
      'system-overload': 'Your central nervous system has been operating beyond capacity. Week 1 is a deliberate pull on training intensity to give your CNS room to recover before progressive load returns in Week 3.',
    },
  },
  2: {
    subject: (n) => `Week 2, ${n}. Where the rhythm starts to land.`,
    body: (n, url) => `
${emailEyebrow('Week 2 · Regulate')}
${emailHeading('The rhythm is starting to take.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('This week is the second half of the Regulate phase. By now your system has had seven days of consistent inputs and the response should be beginning to show — even if subtly.')}
${emailBody('Sleep starts to feel more restorative. Energy stabilises through the day. Cravings calm. Recovery improves. These are not coincidences. They are markers that the hormonal environment is shifting in your favour.')}
${emailBody('Your second education lesson — Insulin and Blood Sugar Control — is now unlocked. The Adapt phase next week introduces progressive load, and understanding the role of insulin in fuelling and recovery makes the transition cleaner.', { bottom: 28 })}
${emailCta({ href: url, label: 'Open your portal' })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'The cortisol pattern correction takes 10-14 days of consistent inputs to show in your biology. You are inside that window now. The subtle shifts you may be noticing in sleep, mood, and energy are real signals.',
      'metabolic-drift': 'Insulin sensitivity responds quickly to consistent meal timing. Two weeks in, the post-meal sluggishness should be measurably better. If it is, the protocol is working. If not, check meal compliance before adjusting anything else.',
      'hormonal-shift':  'Hormonal shifts take longer to register than cortisol or insulin changes, but the trajectory is set in the first 2 weeks. The cycle-aware adjustments coming in Week 3 build on the baseline you have established.',
      'system-overload': 'Your nervous system needs the full Regulate phase before progressive load returns. Resist the urge to push training intensity this week even if you feel ready. The recovery debt has not been fully repaid yet.',
    },
  },
  3: {
    subject: (n) => `Week 3, ${n}. The Adapt phase begins.`,
    body: (n, url) => `
${emailEyebrow('Week 3 · Adapt')}
${emailHeading('Progressive load returns.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('You have completed the Regulate phase. Your system has the baseline. Week 3 begins the Adapt phase — where progressive load returns to training and the body is asked to respond to a higher demand.')}
${emailBody('Training intensity steps up. Volume increases moderately. Nutrition timing tightens. The point of this phase is not to push to failure but to give your body a clear signal that it needs to keep adapting.')}
${emailBody('Your third education lesson — Testosterone and Muscle Signal — is now unlocked. The biology of adaptation lives in this lesson and explains why this phase is designed the way it is.', { bottom: 28 })}
${emailCta({ href: url, label: 'Open your portal' })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'Now that your cortisol baseline has dropped, your body can actually use the progressive load. The volume increases this week are calibrated to be productive without re-elevating your stress response. Stick to the prescribed RIR.',
      'metabolic-drift': 'Improved insulin sensitivity means the body can now partition carbohydrate intake more effectively toward recovery and muscle. The Adapt phase nutrition tightens timing around training to take advantage of this.',
      'hormonal-shift':  'Adequate fuelling and consistent training intensity start to restore the hormonal balance that supports lean mass retention and energy. The Week 3 step-up is moderate by design — slow restoration is the protocol.',
      'system-overload': 'Your nervous system has recovered enough to accept progressive load again. Volume returns first, intensity second. The Week 3 increase is intentionally conservative — the bigger increases come in Weeks 4 and 5.',
    },
  },
  4: {
    subject: (n) => `Week 4, ${n}. Halfway. The work compounds.`,
    body: (n, url) => `
${emailEyebrow('Week 4 · Adapt')}
${emailHeading('Halfway through. The work compounds.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('You are halfway through the Blueprint. The work you have done so far has changed the underlying biological environment. The shifts you make this week and next compound on top of that base.')}
${emailBody('Week 4 is the second half of the Adapt phase. Training load increases again. The nutrition layer adds more precision. By the end of this week, your body should be functioning at a measurably different baseline to where it was at Day 1.')}
${emailBody('Your fourth education lesson — Thyroid and Metabolic Rate — is unlocked. Understanding why metabolism is not a fixed trait but a responsive system is central to building lasting results.', { bottom: 28 })}
${emailCta({ href: url, label: 'Open your portal' })}
${emailUrlFallback(url, 'Or paste this link into your browser')}
`,
    patternBlock: {
      'stress-stored':   'Halfway through the cortisol correction window. Your body should be showing more reliable signs of regulation — steadier sleep, calmer afternoon energy, fewer between-meal cravings. The visceral fat that was being protected starts to become available.',
      'metabolic-drift': 'Insulin sensitivity should be measurably better by now. The body is using fat more effectively between meals. Hunger should feel more predictable and less driven. This is the metabolic correction starting to land.',
      'hormonal-shift':  'Your hormonal baseline takes longer to shift than cortisol or insulin, but Week 4 is where the trajectory becomes clearer. The energy stability and improved sleep quality are upstream signals of the hormonal correction underway.',
      'system-overload': 'Your nervous system is now in a state where progressive load can be applied without recovery debt accumulating. The Week 4 volume and intensity increases are designed to build on this restored capacity.',
    },
  },
  5: {
    subject: (n) => `Week 5, ${n}. The peak intensity week.`,
    body: (n, url) => `
${emailEyebrow('Week 5 · Embed')}
${emailHeading('Peak intensity. Hold the structure.')}
${emailDivider()}
${emailBody(`Hi ${n},`)}
${emailBody('Week 5 is the peak intensity week of the Blueprint. Training demand is at its highest. Nutrition precision is at its tightest. The adaptations are now compounding hard.')}
${emailBody('This week is about holding the structure under pressure. The temptation when training gets harder is to slip on the inputs that support recovery — sleep, meal timing, supplementation. Resist that. The structure is what makes the intensity productive.')}
${emailBody('Your fifth education lesson — Sleep Hormones and Recovery — is unlocked. Sleep is the most underrated variable in this phase. The lesson explains exactly why.', { bottom: 28 })}
${emailCta({ href: url, label: 'Open your portal' })}
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
${blueprintVideoPlaceholderCard('Week 6 ascension video drops here', url)}
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

export function buildBlueprintWeekEmail({
  week,
  firstName,
  portalUrl,
  pattern,
}: {
  week: 1 | 2 | 3 | 4 | 5 | 6
  firstName: string
  portalUrl: string
  pattern: string
}): { subject: string; html: string } {
  const def = BLUEPRINT_WEEK_EMAILS[week]
  const resolvedPattern = BLUEPRINT_PATTERN_LABELS[pattern] ? pattern : 'stress-stored'
  const patternLabel = BLUEPRINT_PATTERN_LABELS[resolvedPattern]
  const patternColour = BLUEPRINT_PATTERN_COLOURS[resolvedPattern]
  const patternCallout = def.patternBlock[resolvedPattern] ?? def.patternBlock['stress-stored']
  return {
    subject: def.subject(firstName),
    html: blueprintWeekShell(def.body(firstName, portalUrl), patternLabel, patternColour, patternCallout),
  }
}

export function buildBlueprintWeek7FollowupEmail({
  firstName,
  portalUrl,
  pattern,
}: {
  firstName: string
  portalUrl: string
  pattern: string
}): { subject: string; html: string } {
  const subject = `${firstName}, you finished the Blueprint.`
  const resolvedPattern = BLUEPRINT_PATTERN_LABELS[pattern] ? pattern : 'stress-stored'
  const patternLabel = BLUEPRINT_PATTERN_LABELS[resolvedPattern]
  const patternColour = BLUEPRINT_PATTERN_COLOURS[resolvedPattern]
  const patternCallout = `You completed the ${patternLabel} pattern programme. The work you have done over six weeks has addressed the specific biological mechanism driving your pattern. Reply to this email if you want to discuss Stage 3.`
  const body = `
${emailEyebrow('Blueprint Complete')}
${emailHeading(`Six weeks done, ${firstName}.`)}
${emailDivider()}
${emailBody(`Hi ${firstName},`)}
${emailBody('You finished the 6-Week Body Rewire Blueprint. That is not a small thing.')}
${emailBody('Most people who start a structured programme abandon it before Week 3. You went all six weeks. That means your hormonal environment, your training capacity, your metabolic baseline — all of them are in a different place to where they were when you started.')}
${emailBody('Stage 3 is where this becomes a long-term result. Progressive challenge applied to a system that can now absorb it. If you want to talk through what the right next step looks like for your pattern, reply to this email and I will come back to you personally.', { bottom: 28 })}
${emailCta({ href: portalUrl, label: 'Open your portal' })}
${emailUrlFallback(portalUrl, 'Or paste this link into your browser')}
`
  return {
    subject,
    html: blueprintWeekShell(body, patternLabel, patternColour, patternCallout),
  }
}
