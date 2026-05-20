import Anthropic from '@anthropic-ai/sdk'
import { SLS_BLOCKS, RPS_BLOCKS, RILS_BLOCKS, FIXED_SECTIONS, selectBlocks } from './report-blocks'
import { darkEmailSignature } from './email-signature'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

interface ReportNarrative {
  bandTitle: string
  patternSnapshot: string
  whatThisIncludes: string
}

async function generateNarrative(
  signalPattern: string,
  slsLevel: number,
  rpsLevel: number,
  rilsLevel: number
): Promise<ReportNarrative> {
  const prompt = `You are assembling a member-facing Body Recode™ Performance Check-In Report.

The member's result profile:
- Overall Signal Pattern: ${signalPattern} (internal label — do not use this word in output)
- Stress and Load State: Level ${slsLevel} (1=balanced, 2=moderate cumulative, 3=elevated cumulative)
- Recovery Predictability: Level ${rpsLevel} (1=stable, 2=variable, 3=reduced)
- Regulation and Identity Load: Level ${rilsLevel} (1=low, 2=moderate, 3=elevated)

Generate exactly three things:

1. BAND_TITLE: A neutral, descriptive 4-7 word title that reflects the dominant pattern across load, recovery, and consistency. Must be non-hierarchical, non-judgmental, and not imply urgency or rank. Do not use words like "poor", "good", "optimal", "remediation", "high-performance".

2. PATTERN_SNAPSHOT: 2-3 short paragraphs describing the pattern that emerged. Must be:
- Present-focused and conditional (use "may", "suggests", "appears")
- Descriptive only — no recommendations, no prescriptions
- Non-diagnostic
- Written as if reflecting a pattern back to the person with curiosity

3. WHAT_THIS_INCLUDES: 4-6 bullet points describing common experiences people in this pattern report. Must be:
- Normalising and non-pathological
- Situational (things the person may recognise)
- No medical or clinical language
- Start each bullet with a lowercase phrase

Output ONLY in this exact format, no other text:
BAND_TITLE: [title here]
PATTERN_SNAPSHOT: [paragraphs here, separated by double newline]
WHAT_THIS_INCLUDES: [bullet 1]|[bullet 2]|[bullet 3]|[bullet 4]|[bullet 5]`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  const bandTitleMatch = text.match(/BAND_TITLE:\s*(.+)/)
  const patternSnapshotMatch = text.match(/PATTERN_SNAPSHOT:\s*([\s\S]+?)(?=WHAT_THIS_INCLUDES:)/)
  const whatThisIncludesMatch = text.match(/WHAT_THIS_INCLUDES:\s*([\s\S]+)$/)

  return {
    bandTitle: bandTitleMatch?.[1]?.trim() ?? 'Current Pattern Overview',
    patternSnapshot: patternSnapshotMatch?.[1]?.trim() ?? '',
    whatThisIncludes: whatThisIncludesMatch?.[1]?.trim() ?? '',
  }
}

function nl2p(text: string): string {
  return text
    .split('\n\n')
    .map(p => `<p style="margin:0 0 16px;font-size:15px;color:#c4c0bb;line-height:1.75;">${p.trim()}</p>`)
    .join('')
}

function blockText(text: string): string {
  return text
    .split('\n\n')
    .map(p => `<p style="margin:0 0 12px;font-size:14px;color:#6B6B6B;line-height:1.7;">${p.trim()}</p>`)
    .join('')
}

function bullets(raw: string): string {
  const items = raw.split('|').map(b => b.trim()).filter(Boolean)
  return `<ul style="margin:0;padding:0 0 0 20px;">${items.map(b => `<li style="font-size:14px;color:#6B6B6B;line-height:1.7;margin-bottom:8px;">${b}</li>`).join('')}</ul>`
}

function section(heading: string, content: string): string {
  return `
    <tr>
      <td style="padding:0 0 32px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1B6DFC;">${heading}</p>
        ${content}
      </td>
    </tr>`
}

function signalBlock(heading: string, title: string, content: string): string {
  return `
    <tr>
      <td style="padding:0 0 24px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#999999;">${heading}</p>
        <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#3A3A3A;">${title}</p>
        ${blockText(content)}
      </td>
    </tr>`
}

export async function buildReportEmail(
  firstName: string,
  answers: Record<string, number>,
  signalPattern: string,
  bookingLink: string
): Promise<string> {
  const { slsLevel, rpsLevel, rilsLevel } = selectBlocks(answers)
  const rawNarrative = await generateNarrative(signalPattern, slsLevel, rpsLevel, rilsLevel)
  const narrative = {
    bandTitle: rawNarrative.bandTitle.replace(/\s*—\s*/g, ', '),
    patternSnapshot: rawNarrative.patternSnapshot.replace(/\s*—\s*/g, ', '),
    whatThisIncludes: rawNarrative.whatThisIncludes.replace(/\s*—\s*/g, ', '),
  }

  const sls = SLS_BLOCKS[slsLevel]
  const rps = RPS_BLOCKS[rpsLevel]
  const rils = RILS_BLOCKS[rilsLevel]

  const bookingSection = bookingLink
    ? `<tr><td style="padding:0 0 40px;">
        <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#ffffff;line-height:1.4;">Your pattern has a reason.</p>
        <p style="margin:0 0 24px;font-size:14px;color:#999999;line-height:1.7;">The report shows what's showing up. A 30-minute conversation is where we work out why, and what it means for how you should actually be training and eating right now.</p>
        <a href="${bookingLink}" style="display:inline-block;padding:14px 28px;background:#1B6DFC;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.03em;">Explore this with Kade →</a>
        <p style="margin:12px 0 0;font-size:13px;color:#999999;">No obligation. Just clarity on what your body is actually doing.</p>
      </td></tr>`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
</head>
<body style="margin:0;padding:0;background-color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" bgcolor="#FFFFFF">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:580px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:32px 40px 28px;border-bottom:1px solid #E5E5E5;">
              <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;" />
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Initial Performance Check-In Report</p>
              <p style="margin:6px 0 0;font-size:13px;color:#999999;">Prepared for ${firstName}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0">

                ${bookingSection}

                ${section('Opening Frame', nl2p(FIXED_SECTIONS.openingFrame))}

                <tr><td style="padding:0 0 32px;"><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E5E5E5;"><tr><td height="1" bgcolor="#E5E5E5"></td></tr></table></td></tr>

                ${section('How to Read This Report', nl2p(FIXED_SECTIONS.howToRead))}

                <tr><td style="padding:0 0 32px;"><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E5E5E5;"><tr><td height="1" bgcolor="#E5E5E5"></td></tr></table></td></tr>

                <!-- Pattern Snapshot -->
                <tr>
                  <td style="padding:0 0 32px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1B6DFC;">Pattern Snapshot</p>
                    <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#ffffff;">${narrative.bandTitle}</p>
                    ${nl2p(narrative.patternSnapshot)}
                  </td>
                </tr>

                <!-- What This Pattern Often Includes -->
                <tr>
                  <td style="padding:0 0 32px;">
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1B6DFC;">What This Pattern Often Includes</p>
                    <p style="margin:0 0 12px;font-size:14px;color:#6B6B6B;line-height:1.7;">People in this pattern commonly report:</p>
                    ${bullets(narrative.whatThisIncludes)}
                  </td>
                </tr>

                <tr><td style="padding:0 0 32px;"><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E5E5E5;"><tr><td height="1" bgcolor="#E5E5E5"></td></tr></table></td></tr>

                <!-- Signal Blocks -->
                <tr>
                  <td style="padding:0 0 24px;">
                    <p style="margin:0 0 20px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1B6DFC;">Load, Recovery, and Consistency Signals</p>
                  </td>
                </tr>

                ${signalBlock('Stress and Load Signals', sls.title, sls.text)}
                ${signalBlock('Recovery Predictability Signals', rps.title, rps.text)}
                ${signalBlock('Regulation and Identity Load Signals', rils.title, rils.text)}

                <tr><td style="padding:0 0 32px;"><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E5E5E5;"><tr><td height="1" bgcolor="#E5E5E5"></td></tr></table></td></tr>

                ${section('Stability Note', nl2p(FIXED_SECTIONS.stabilityNote))}
                ${section('Agency Reminder', nl2p(FIXED_SECTIONS.agencyReminder))}

                <tr><td style="padding:0 0 32px;"><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E5E5E5;"><tr><td height="1" bgcolor="#E5E5E5"></td></tr></table></td></tr>

                <!-- Exploring Further -->
                <tr>
                  <td style="padding:0 0 32px;">
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1B6DFC;">Exploring This Further</p>
                    ${nl2p(FIXED_SECTIONS.exploringFurther)}
                  </td>
                </tr>

                ${bookingSection}

                <tr><td style="padding:0 0 32px;"><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E5E5E5;"><tr><td height="1" bgcolor="#E5E5E5"></td></tr></table></td></tr>

                <!-- Structural Clarification -->
                <tr>
                  <td style="padding:0 0 40px;">
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#999999;">Structural Clarification</p>
                    ${blockText(FIXED_SECTIONS.structuralClarification)}
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#0d0d0d" style="background-color:#0d0d0d;padding:20px 40px;border-top:1px solid #E5E5E5;">
              <p style="margin:0 0 8px;font-size:12px;color:#999999;line-height:1.6;">
                To make sure you receive future emails from Body Recode™, add <strong style="color:#999999;">kade@bodyrecode.au</strong> to your contacts.
              </p>
              <p style="margin:0;font-size:12px;color:#444444;line-height:1.6;">
                Body Recode™ · Anytime Fitness Newstead, Brisbane<br/>
                <a href="mailto:info@bodyrecode.au" style="color:#1B6DFC;text-decoration:none;">info@bodyrecode.au</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// Calculate scheduled send time: next morning 9am Brisbane (UTC+10, no DST)
export function nextMorning9amBrisbane(): Date {
  const BRISBANE_OFFSET_MS = 10 * 60 * 60 * 1000
  const nowBrisbane = Date.now() + BRISBANE_OFFSET_MS
  const brisbaneMidnight = new Date(nowBrisbane)
  brisbaneMidnight.setUTCHours(0, 0, 0, 0)
  const tomorrow9amBrisbane = brisbaneMidnight.getTime() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000
  return new Date(tomorrow9amBrisbane - BRISBANE_OFFSET_MS)
}

// Calculate N days after a base date at 9am Brisbane
export function daysAfter9amBrisbane(base: Date, days: number): Date {
  const BRISBANE_OFFSET_MS = 10 * 60 * 60 * 1000
  const baseBrisbane = base.getTime() + BRISBANE_OFFSET_MS
  const baseMidnight = new Date(baseBrisbane)
  baseMidnight.setUTCHours(0, 0, 0, 0)
  const target9am = baseMidnight.getTime() + days * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000
  return new Date(target9am - BRISBANE_OFFSET_MS)
}

function followUpEmail(firstName: string, body: string, ctaText: string, bookingLink: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
</head>
<body style="margin:0;padding:0;background-color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" bgcolor="#FFFFFF">
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
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;">
              ${body}
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr><td><a href="${bookingLink}" style="display:inline-block;padding:14px 28px;background:#1B6DFC;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.03em;">${ctaText}</a></td></tr>
              </table>
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function p(text: string): string {
  return `<p style="margin:0 0 18px;font-size:15px;color:#999999;line-height:1.75;">${text}</p>`
}

export function buildFollowUpEmails(firstName: string, bookingLink: string): {
  email1: { subject: string; html: string }
  email2: { subject: string; html: string }
  email3: { subject: string; html: string }
} {
  const email1 = {
    subject: `Re: Your check-in report`,
    html: followUpEmail(
      firstName,
      [
        p(`Hi ${firstName},`),
        p(`Most people who fill out that check-in have been at this for a while. Putting in the effort, doing the right things on paper, but something's not quite adding up.`),
        p(`If that sounds familiar, your report is worth a proper read. It's not a generic summary. It reflects what's actually showing up in your body right now, based on what you told us.`),
        p(`The next step is a 30-minute conversation where we work out what's driving it and what to actually do about it.`),
        p(`No pitch. Just clarity.`),
      ].join(''),
      'Book a call with Kade →',
      bookingLink
    ),
  }

  const email2 = {
    subject: `When the effort doesn't match the result`,
    html: followUpEmail(
      firstName,
      [
        p(`Hi ${firstName},`),
        p(`There's a specific kind of frustration that comes from doing everything you think you should be doing and still not seeing it reflected back at you.`),
        p(`It's not laziness. It's not a lack of discipline. It's usually a mismatch between what your body actually needs right now and what you're giving it.`),
        p(`That's exactly what your check-in results point to. And it's exactly what a conversation with me is designed to untangle.`),
        p(`30 minutes. No obligation. Just a straight answer on what's going on and where to go from here.`),
      ].join(''),
      'Book a call with Kade →',
      bookingLink
    ),
  }

  const email3 = {
    subject: `Last one from me, ${firstName}`,
    html: followUpEmail(
      firstName,
      [
        p(`Hi ${firstName},`),
        p(`I won't keep showing up in your inbox after this.`),
        p(`But I'll say one thing before I go quiet. The people who get the most out of that first conversation are usually the ones who've been quietly wondering about this stuff for a while. Not new to training. Not giving up. Just stuck in a way they can't quite explain.`),
        p(`If that's you, the call is worth 30 minutes of your time.`),
      ].join(''),
      'Book a call when you\'re ready →',
      bookingLink
    ),
  }

  return { email1, email2, email3 }
}

export function buildNoShowEmails(firstName: string, bookingLink: string): {
  email1: { subject: string; html: string }
  email2: { subject: string; html: string }
  email3: { subject: string; html: string }
} {
  const email1 = {
    subject: `${firstName}, missed you yesterday`,
    html: followUpEmail(
      firstName,
      [
        p(`Hi ${firstName},`),
        p(`Looks like we missed each other yesterday. No problem at all. These things happen.`),
        p(`Your scorecard read does not change because of one missed call. When you are ready, the conversation is still available. It is a 30-minute call to go through what showed up, identify the specific reason your body has stopped responding, and work out what to do first.`),
        p(`No pressure. Just lock in a time when it suits.`),
      ].join(''),
      'Rebook a time →',
      bookingLink
    ),
  }

  const email2 = {
    subject: `${firstName}, still here when you are ready`,
    html: followUpEmail(
      firstName,
      [
        p(`Hi ${firstName},`),
        p(`Quiet follow-up from me.`),
        p(`Your scorecard picked up patterns worth talking through. The kind of clarity that gets you unstuck does not come from reading a result alone. It comes from a conversation that connects what your body is showing to what to actually do about it.`),
        p(`If timing was not right last time, happy to find something that works better. 30 minutes. No obligation on the other side of it.`),
      ].join(''),
      'Find a time that works →',
      bookingLink
    ),
  }

  const email3 = {
    subject: `Leaving the door open, ${firstName}`,
    html: followUpEmail(
      firstName,
      [
        p(`Hi ${firstName},`),
        p(`Last message from me on this.`),
        p(`Your scorecard read is still on file. The conversation is still available whenever it feels right, whether that is now or down the track.`),
        p(`No follow-up after this. Just wanted you to know the door stays open.`),
      ].join(''),
      "Book when you're ready →",
      bookingLink
    ),
  }

  return { email1, email2, email3 }
}

export function buildReportFollowUpEmails(firstName: string, bodyState: string, bookingLink: string): {
  email1: { subject: string; html: string }
  email2: { subject: string; html: string }
  email3: { subject: string; html: string }
} {
  const email1 = {
    subject: `${firstName}, the report is the starting point`,
    html: followUpEmail(
      firstName,
      [
        p(`Hi ${firstName},`),
        p(`You have the report now. It tells you what your body is doing, why fat loss has stalled, and what the biological pattern looks like from the outside.`),
        p(`Reading it is the first step. The second is knowing what to actually do about it. In order. At the right intensity. For where your body actually is right now.`),
        p(`That is what the call is for. 30 minutes. We go through your ${bodyState} result together and map out exactly what needs to change first.`),
        p(`No obligation. Just a focused conversation.`),
      ].join(''),
      'Book a call with Kade →',
      bookingLink
    ),
  }

  const email2 = {
    subject: `One thing the report cannot show you, ${firstName}`,
    html: followUpEmail(
      firstName,
      [
        p(`Hi ${firstName},`),
        p(`One thing the report cannot show you is sequence.`),
        p(`${bodyState} results have a specific order of operations. There are things that need to happen before other things will work. Skip the order and effort goes in without the result coming back. That is the trap most people in your position fall into.`),
        p(`The sequencing is what I build the call around. What to address first, what to park for now, and how to structure the next 4 to 6 weeks around your actual state.`),
        p(`If you have not booked yet, the link is below.`),
      ].join(''),
      'Book a call →',
      bookingLink
    ),
  }

  const email3 = {
    subject: `Last one from me, ${firstName}`,
    html: followUpEmail(
      firstName,
      [
        p(`Hi ${firstName},`),
        p(`Last message from me on this.`),
        p(`The report is yours. The call is still available whenever it makes sense. No follow-up after this.`),
        p(`Just wanted you to know the door stays open.`),
      ].join(''),
      "Book when you're ready →",
      bookingLink
    ),
  }

  return { email1, email2, email3 }
}

export function buildZoom1DeclinedEmails(firstName: string, bookingLink: string): {
  email1: { subject: string; html: string }
  email2: { subject: string; html: string }
  email3: { subject: string; html: string }
} {
  const email1 = {
    subject: `Good speaking yesterday, ${firstName}`,
    html: followUpEmail(
      firstName,
      [
        p(`Hi ${firstName},`),
        p(`Good speaking with you yesterday. Appreciate you taking the time.`),
        p(`Completely understood that the timing is not right. These things only work when the timing is right for you, not when it fits someone else's schedule.`),
        p(`What we talked through does not expire. The pattern we identified is still there. The reason your body has stopped responding is still there. The conversation is still available the moment it makes sense to pick it back up.`),
      ].join(''),
      "Book a time when you're ready →",
      bookingLink
    ),
  }

  const email2 = {
    subject: `${firstName}, still here if the timing changes`,
    html: followUpEmail(
      firstName,
      [
        p(`Hi ${firstName},`),
        p(`Quiet follow-up from me.`),
        p(`No pitch. The door stays open. The pattern we surfaced in your scorecard and on the call does not change because the timing was off. Sometimes the right moment to act on something is a few weeks after the conversation, not during it.`),
        p(`If anything has shifted and you would like to talk it through properly, I am here.`),
      ].join(''),
      'Book a call →',
      bookingLink
    ),
  }

  const email3 = {
    subject: `Last one from me, ${firstName}`,
    html: followUpEmail(
      firstName,
      [
        p(`Hi ${firstName},`),
        p(`Last message from me on this.`),
        p(`The conversation is still available whenever it makes sense. Whether that is soon or down the track. No follow-up after this.`),
        p(`Just wanted you to know the door stays open.`),
      ].join(''),
      "Book when you're ready →",
      bookingLink
    ),
  }

  return { email1, email2, email3 }
}

export function buildProgramBuyerEmails(firstName: string, bookingLink: string): {
  email1: { subject: string; html: string }
  email2: { subject: string; html: string }
  email3: { subject: string; html: string }
} {
  const email1 = {
    subject: `Four weeks in, ${firstName}`,
    html: followUpEmail(
      firstName,
      [
        p(`Hi ${firstName},`),
        p(`By now you've worked through Phase 1 of your program.`),
        p(`Check in with yourself - how training is feeling, energy levels, recovery. If things are moving in the right direction, that's the program doing its job.`),
        p(`If you want to go further - with someone reading what your body is doing and adjusting the approach in real time - that's what the call is for. 30 minutes. No obligation.`),
      ].join(''),
      'Book a call →',
      bookingLink
    ),
  }

  const email2 = {
    subject: `The compounding point, ${firstName}`,
    html: followUpEmail(
      firstName,
      [
        p(`Hi ${firstName},`),
        p(`Week 8 is where it gets interesting. Phase 2 loads the foundation you built in Phase 1.`),
        p(`This is also when coaching makes the biggest difference. Your body is different now from where it was at the start. The approach should reflect that - not just follow a fixed plan.`),
        p(`If you want that level of input on what you're doing, the call is 30 minutes.`),
      ].join(''),
      'Book a call →',
      bookingLink
    ),
  }

  const email3 = {
    subject: `End of the program, ${firstName}`,
    html: followUpEmail(
      firstName,
      [
        p(`Hi ${firstName},`),
        p(`You're at the end of 12 weeks. Most people don't finish. That matters.`),
        p(`The question now is what it told you, and what comes next. Your body state shifts as your capacity builds. The next phase looks different from where you started - and it should be built around that.`),
        p(`If you want to work out what that next phase looks like with proper support, book a call. 30 minutes. No obligation. Just a straight conversation about where you are and where you could go.`),
      ].join(''),
      "Book a call →",
      bookingLink
    ),
  }

  return { email1, email2, email3 }
}
