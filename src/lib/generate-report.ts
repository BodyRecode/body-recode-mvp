import Anthropic from '@anthropic-ai/sdk'
import { SLS_BLOCKS, RPS_BLOCKS, RILS_BLOCKS, FIXED_SECTIONS, selectBlocks } from './report-blocks'

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
    .map(p => `<p style="margin:0 0 12px;font-size:14px;color:#a8a29e;line-height:1.7;">${p.trim()}</p>`)
    .join('')
}

function bullets(raw: string): string {
  const items = raw.split('|').map(b => b.trim()).filter(Boolean)
  return `<ul style="margin:0;padding:0 0 0 20px;">${items.map(b => `<li style="font-size:14px;color:#a8a29e;line-height:1.7;margin-bottom:8px;">${b}</li>`).join('')}</ul>`
}

function section(heading: string, content: string): string {
  return `
    <tr>
      <td style="padding:0 0 32px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#10E1C2;">${heading}</p>
        ${content}
      </td>
    </tr>`
}

function signalBlock(heading: string, title: string, content: string): string {
  return `
    <tr>
      <td style="padding:0 0 24px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#555555;">${heading}</p>
        <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#d4cfc9;">${title}</p>
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
  const narrative = await generateNarrative(signalPattern, slsLevel, rpsLevel, rilsLevel)

  const sls = SLS_BLOCKS[slsLevel]
  const rps = RPS_BLOCKS[rpsLevel]
  const rils = RILS_BLOCKS[rilsLevel]

  const bookingSection = bookingLink
    ? `<tr><td style="padding:0 0 40px;">
        <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#ffffff;line-height:1.4;">Your pattern has a reason.</p>
        <p style="margin:0 0 24px;font-size:14px;color:#888888;line-height:1.7;">The report shows what's showing up. A 30-minute conversation is where we work out why — and what it means for how you should actually be training and eating right now.</p>
        <a href="${bookingLink}" style="display:inline-block;padding:14px 28px;background:#10E1C2;color:#0a0a0a;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.03em;">Explore this with Kade →</a>
        <p style="margin:12px 0 0;font-size:13px;color:#555555;">No obligation. Just clarity on what your body is actually doing.</p>
      </td></tr>`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" bgcolor="#0a0a0a">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0a0a0a" style="background-color:#0a0a0a;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111111" style="max-width:580px;background-color:#111111;border-radius:16px;border:1px solid #222222;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td bgcolor="#111111" style="background-color:#111111;padding:32px 40px 28px;border-bottom:1px solid #1e1e1e;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#10E1C2;">Body Recode™</p>
              <p style="margin:0 0 16px;font-size:13px;color:#555555;letter-spacing:0.05em;">Performance Coaching · Brisbane</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Initial Performance Check-In Report</p>
              <p style="margin:6px 0 0;font-size:13px;color:#555555;">Prepared for ${firstName}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td bgcolor="#111111" style="background-color:#111111;padding:36px 40px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0">

                ${section('Opening Frame', nl2p(FIXED_SECTIONS.openingFrame))}

                <tr><td style="padding:0 0 32px;"><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1e1e1e;"><tr><td height="1" bgcolor="#1e1e1e"></td></tr></table></td></tr>

                ${section('How to Read This Report', nl2p(FIXED_SECTIONS.howToRead))}

                <tr><td style="padding:0 0 32px;"><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1e1e1e;"><tr><td height="1" bgcolor="#1e1e1e"></td></tr></table></td></tr>

                <!-- Pattern Snapshot -->
                <tr>
                  <td style="padding:0 0 32px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#10E1C2;">Pattern Snapshot</p>
                    <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#ffffff;">${narrative.bandTitle}</p>
                    ${nl2p(narrative.patternSnapshot)}
                  </td>
                </tr>

                <!-- What This Pattern Often Includes -->
                <tr>
                  <td style="padding:0 0 32px;">
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#10E1C2;">What This Pattern Often Includes</p>
                    <p style="margin:0 0 12px;font-size:14px;color:#a8a29e;line-height:1.7;">People in this pattern commonly report:</p>
                    ${bullets(narrative.whatThisIncludes)}
                  </td>
                </tr>

                <tr><td style="padding:0 0 32px;"><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1e1e1e;"><tr><td height="1" bgcolor="#1e1e1e"></td></tr></table></td></tr>

                <!-- Signal Blocks -->
                <tr>
                  <td style="padding:0 0 24px;">
                    <p style="margin:0 0 20px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#10E1C2;">Load, Recovery, and Consistency Signals</p>
                  </td>
                </tr>

                ${signalBlock('Stress and Load Signals', sls.title, sls.text)}
                ${signalBlock('Recovery Predictability Signals', rps.title, rps.text)}
                ${signalBlock('Regulation and Identity Load Signals', rils.title, rils.text)}

                <tr><td style="padding:0 0 32px;"><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1e1e1e;"><tr><td height="1" bgcolor="#1e1e1e"></td></tr></table></td></tr>

                ${section('Stability Note', nl2p(FIXED_SECTIONS.stabilityNote))}
                ${section('Agency Reminder', nl2p(FIXED_SECTIONS.agencyReminder))}

                <tr><td style="padding:0 0 32px;"><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1e1e1e;"><tr><td height="1" bgcolor="#1e1e1e"></td></tr></table></td></tr>

                <!-- Exploring Further -->
                <tr>
                  <td style="padding:0 0 32px;">
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#10E1C2;">Exploring This Further</p>
                    ${nl2p(FIXED_SECTIONS.exploringFurther)}
                  </td>
                </tr>

                ${bookingSection}

                <tr><td style="padding:0 0 32px;"><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1e1e1e;"><tr><td height="1" bgcolor="#1e1e1e"></td></tr></table></td></tr>

                <!-- Structural Clarification -->
                <tr>
                  <td style="padding:0 0 40px;">
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#555555;">Structural Clarification</p>
                    ${blockText(FIXED_SECTIONS.structuralClarification)}
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#0d0d0d" style="background-color:#0d0d0d;padding:20px 40px;border-top:1px solid #1e1e1e;">
              <p style="margin:0 0 8px;font-size:12px;color:#555555;line-height:1.6;">
                To make sure you receive future emails from Body Recode™, add <strong style="color:#888888;">kade@send.bodyrecode.au</strong> to your contacts.
              </p>
              <p style="margin:0;font-size:12px;color:#444444;line-height:1.6;">
                Body Recode™ · Anytime Fitness Newstead, Brisbane<br/>
                <a href="mailto:info@bodyrecode.au" style="color:#10E1C2;text-decoration:none;">info@bodyrecode.au</a>
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
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" bgcolor="#0a0a0a">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0a0a0a" style="background-color:#0a0a0a;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111111" style="max-width:520px;background-color:#111111;border-radius:16px;border:1px solid #222222;overflow:hidden;">
          <tr>
            <td bgcolor="#111111" style="background-color:#111111;padding:28px 40px;border-bottom:1px solid #1e1e1e;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#10E1C2;">Body Recode™</p>
            </td>
          </tr>
          <tr>
            <td bgcolor="#111111" style="background-color:#111111;padding:36px 40px 40px;">
              ${body}
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr><td><a href="${bookingLink}" style="display:inline-block;padding:14px 28px;background:#10E1C2;color:#0a0a0a;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.03em;">${ctaText}</a></td></tr>
              </table>
              <p style="margin:0;font-size:13px;color:#444444;line-height:1.6;">
                Kade<br/>Body Recode™ · Anytime Fitness Newstead, Brisbane<br/>
                <a href="mailto:info@bodyrecode.au" style="color:#10E1C2;text-decoration:none;">info@bodyrecode.au</a>
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

function p(text: string): string {
  return `<p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">${text}</p>`
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
        p(`Your performance check-in report went out a couple of days ago — not sure if it landed where it should or got buried.`),
        p(`If you had a chance to read it, you'll have seen a pattern summary describing what's currently showing up across your load, recovery, and consistency.`),
        p(`What the report doesn't cover is what to actually do about it. That's the conversation — 30 minutes, no pitch, just a clear read on what your body is doing and what it means for how you should be training right now.`),
      ].join(''),
      'Book a call with Kade →',
      bookingLink
    ),
  }

  const email2 = {
    subject: `What most people miss in their report`,
    html: followUpEmail(
      firstName,
      [
        p(`Hi ${firstName},`),
        p(`Most people read a performance report like yours and recognise themselves in it. Then they go back to doing exactly what they've always done.`),
        p(`The report maps the surface. It shows what's showing up. What it doesn't do is tell you what's driving it — or what to do differently because of it.`),
        p(`Your pattern has direct implications for how hard you should be training right now, how much recovery you actually need, and why certain approaches may have stalled in the past. That's not guesswork — it's what the signals point to.`),
        p(`30 minutes to work through it properly. No obligation beyond that.`),
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
        p(`I'm not going to keep following up after this.`),
        p(`If the timing isn't right — that's completely fine. The booking link doesn't expire and you're welcome to use it whenever it makes sense.`),
        p(`But if you've been sitting on this and wondering whether it's worth the conversation — that's usually the answer.`),
      ].join(''),
      'Book a call when you\'re ready →',
      bookingLink
    ),
  }

  return { email1, email2, email3 }
}
