/**
 * Weekly Pulse email — the CEO Dashboard's notification + pre-read.
 *
 * Sent by /api/cron/weekly-scorecard-pulse every Monday 7am Brisbane TO
 * kade@bodyrecode.au. It is the trigger for the weekly review ritual: it
 * carries the week already read (what changed, what flipped red, the biggest
 * movers) so the live review with Claude is about DECIDING, not discovering.
 *
 * Built on the light Body Recode email shell (darkEmailShell is light despite
 * the legacy name). Internal report, so no coach BCC and no URL-fallback noise.
 */

import {
  darkEmailShell, emailLogo, emailEyebrow, emailHeading, emailDivider,
  emailBody, emailCta, emailNumberedList,
  EMAIL_BLUE, EMAIL_GRAPHITE, EMAIL_MUTED, EMAIL_BODY, EMAIL_HAIRLINE,
} from '@/lib/email-shell'
import { darkEmailSignature } from '@/lib/email-signature'
import {
  formatValue, formatDelta,
  type ScorecardData, type WeeklyPulse, type PulseLine, type Status, type EngineKey,
} from '@/lib/scorecard'

const STATUS_COLOR: Record<Status, string> = { green: EMAIL_BLUE, yellow: '#B7791F', red: '#DC2626' }
const STATUS_LABEL: Record<Status, string> = { green: 'ON TRACK', yellow: 'WATCH', red: 'OFF TRACK' }
const ENGINE_LABEL: Record<EngineKey, string> = { growth: 'Growth Engine', fulfilment: 'Fulfilment Engine', cash: 'Cash' }
const ENGINE_ORDER: EngineKey[] = ['growth', 'fulfilment', 'cash']

function metricRow(l: PulseLine): string {
  const colour = STATUS_COLOR[l.status]
  const delta = formatDelta(l.current, l.prior, l.unit)
  return `
<tr>
  <td style="padding:9px 0;border-bottom:1px solid ${EMAIL_HAIRLINE};font-size:14px;color:${EMAIL_GRAPHITE};">${l.label}</td>
  <td align="right" style="padding:9px 0 9px 10px;border-bottom:1px solid ${EMAIL_HAIRLINE};font-size:14px;font-weight:700;color:${EMAIL_GRAPHITE};white-space:nowrap;font-variant-numeric:tabular-nums;">${formatValue(l.current, l.unit)}</td>
  <td align="right" style="padding:9px 0 9px 10px;border-bottom:1px solid ${EMAIL_HAIRLINE};font-size:12px;color:${EMAIL_MUTED};white-space:nowrap;">${delta}</td>
  <td align="right" style="padding:9px 0 9px 12px;border-bottom:1px solid ${EMAIL_HAIRLINE};font-size:10px;font-weight:700;letter-spacing:0.06em;color:${colour};white-space:nowrap;">${STATUS_LABEL[l.status]}</td>
</tr>`
}

function engineBlock(engine: EngineKey, lines: PulseLine[]): string {
  const rows = lines.filter(l => l.engine === engine)
  if (!rows.length) return ''
  return `
<p style="margin:22px 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${EMAIL_BLUE};">${ENGINE_LABEL[engine]}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
<tr>
  <td style="padding:0 0 6px;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:${EMAIL_MUTED};">Metric</td>
  <td align="right" style="padding:0 0 6px 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:${EMAIL_MUTED};">Last wk</td>
  <td align="right" style="padding:0 0 6px 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:${EMAIL_MUTED};">vs prev</td>
  <td align="right" style="padding:0 0 6px 12px;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:${EMAIL_MUTED};">Status</td>
</tr>
${rows.map(metricRow).join('')}
</table>`
}

function attentionCard(pulse: WeeklyPulse): string {
  // The "what needs you" block at the top: red metrics + anything that worsened.
  const reds = pulse.lines.filter(l => l.status === 'red')
  const focus = reds.length ? reds : pulse.worsened
  if (!focus.length) {
    return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F3F7FF;border:1px solid rgba(27,109,252,0.25);border-radius:14px;margin:6px 0 8px;">
  <tr><td style="padding:18px 20px;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${EMAIL_BLUE};">All clear</p>
    <p style="margin:0;font-size:15px;font-weight:700;color:${EMAIL_GRAPHITE};">Nothing off track. Hold the line — don't optimise what's working.</p>
  </td></tr>
</table>`
  }
  const items = focus.map(l => {
    const colour = STATUS_COLOR[l.status]
    return `<p style="margin:0 0 6px;font-size:14px;color:${EMAIL_BODY};"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colour};margin-right:8px;"></span><strong style="color:${EMAIL_GRAPHITE};">${l.label}</strong> — ${formatValue(l.current, l.unit)} (${formatDelta(l.current, l.prior, l.unit)}) <span style="color:${colour};font-weight:700;font-size:11px;letter-spacing:0.04em;">${STATUS_LABEL[l.status]}</span></p>`
  }).join('')
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FDF3F3;border:1px solid rgba(220,38,38,0.25);border-radius:14px;margin:6px 0 8px;">
  <tr><td style="padding:18px 20px;">
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#DC2626;">Needs you this week (${focus.length})</p>
    ${items}
  </td></tr>
</table>`
}

export function buildWeeklyPulseEmail(
  data: ScorecardData,
  pulse: WeeklyPulse,
  opts: { dashboardUrl: string; runAt: string },
): { subject: string; html: string; headline: string } {
  const headline = pulse.redCount === 0
    ? 'All on track — hold the line'
    : `${pulse.redCount} metric${pulse.redCount === 1 ? '' : 's'} off track`

  const subject = pulse.redCount === 0
    ? `Weekly Pulse — all on track (${pulse.weekLabel})`
    : `Weekly Pulse — ${pulse.redCount} to fix (${pulse.weekLabel})`

  const improvedNote = pulse.improved.length
    ? emailBody(`Improved: ${pulse.improved.map(l => l.label).join(', ')}.`, { size: 13, color: EMAIL_MUTED, bottom: 4 })
    : ''

  const inner = `
${emailLogo(150)}
${emailEyebrow('Weekly Pulse · Company Scorecard')}
${emailHeading(headline)}
${emailDivider()}
${emailBody(`Week of ${pulse.weekLabel}. Generated ${opts.runAt} Brisbane.`, { size: 14, color: EMAIL_MUTED, bottom: 16 })}
${attentionCard(pulse)}
${improvedNote}
${ENGINE_ORDER.map(e => engineBlock(e, pulse.lines)).join('')}
<div style="height:26px;"></div>
${emailCta({ href: opts.dashboardUrl, label: 'Open the scorecard' })}
<div style="height:26px;"></div>
<p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${EMAIL_BLUE};">Your 15-minute review</p>
${emailNumberedList([
  'Open the scorecard and read the status column (scores the week that just closed).',
  'For every red or amber, write the ONE move that turns it toward green this week.',
  'Drop those moves into Today\'s Focus so they\'re in front of you all week.',
  'Leave the greens alone. One red week is noise — act on trends, pivot the plan only monthly.',
])}
${darkEmailSignature()}
`

  void EMAIL_BODY
  return { subject, html: darkEmailShell(inner, { previewText: headline }), headline }
}
