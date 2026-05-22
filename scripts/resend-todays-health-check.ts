// Re-render the most recent daily health check run with the new template helpers
// and send it. Avoids triggering a fresh cron run (no smoke-test inserts).
// Usage: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/resend-todays-health-check.ts

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import {
  darkEmailShell,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailFeaturedCard, emailCallout, emailStatusCard,
  EMAIL_BLUE_DARK, EMAIL_BODY_SOFT, EMAIL_MUTED,
  EMAIL_HAIRLINE, EMAIL_FF,
} from '../src/lib/email-shell'
import { darkEmailSignature } from '../src/lib/email-signature'

type CheckStatus = 'ok' | 'fixed' | 'failed' | 'info'
type CheckResult = {
  name: string
  status: CheckStatus
  detail: string
  action?: string
  manualFix?: string
}

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: run, error } = await supabase
    .from('health_check_runs')
    .select('ran_at, status, failures_count, fixes_count, checks')
    .order('ran_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !run) {
    console.error('No recent run found:', error)
    process.exit(1)
  }

  const checks = (run.checks as CheckResult[]) ?? []
  const failures = checks.filter(c => c.status === 'failed')
  const fixes = checks.filter(c => c.status === 'fixed')
  const allGood = failures.length === 0

  // 17 checks total: 4 infra + 5 write + 6 data + 2 automation
  const infra = checks.slice(0, 4)
  const write = checks.slice(4, 9)
  const data = checks.slice(9, 15)
  const automation = checks.slice(15)

  const headline = allGood && fixes.length === 0
    ? 'All systems operational.'
    : fixes.length > 0 && failures.length === 0
      ? `${fixes.length} issue${fixes.length === 1 ? '' : 's'} auto-fixed.`
      : `${failures.length} issue${failures.length === 1 ? '' : 's'} need your attention.`

  const subject = `[PREVIEW] ${allGood && fixes.length === 0
    ? 'Body Recode - Daily Check: All good'
    : fixes.length > 0 && failures.length === 0
      ? `Body Recode - Daily Check: ${fixes.length} issue${fixes.length === 1 ? '' : 's'} auto-fixed`
      : `Body Recode - Daily Check: ${failures.length} issue${failures.length === 1 ? '' : 's'} need your attention`}`

  const runAt = new Date(run.ran_at as string).toLocaleString('en-AU', { timeZone: 'Australia/Brisbane', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', hour12: true })

  const statusPalette = (s: CheckStatus) => {
    if (s === 'ok')     return { tag: 'OK',     color: EMAIL_BLUE_DARK,  bg: 'rgba(27,109,252,0.10)' }
    if (s === 'fixed')  return { tag: 'FIXED',  color: '#B7791F',        bg: 'rgba(245,158,11,0.12)' }
    if (s === 'failed') return { tag: 'FAILED', color: '#DC2626',        bg: 'rgba(239,68,68,0.10)' }
    return                    { tag: 'INFO',   color: EMAIL_MUTED,      bg: 'rgba(107,107,107,0.08)' }
  }

  const renderRow = (c: CheckResult, isLast: boolean): string => {
    const p = statusPalette(c.status)
    const borderBottom = isLast ? 'none' : `1px solid ${EMAIL_HAIRLINE}`
    return `
            <tr>
              <td style="padding:14px 0;border-bottom:${borderBottom};font-family:${EMAIL_FF};">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td valign="top" width="76" style="padding:0 12px 0 0;">
                      <span style="display:inline-block;padding:3px 9px;background-color:${p.bg};color:${p.color};font-size:10px;font-weight:800;letter-spacing:0.08em;border-radius:99px;font-family:${EMAIL_FF};">${p.tag}</span>
                    </td>
                    <td valign="top">
                      <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#1A1A1A;line-height:1.4;font-family:${EMAIL_FF};">${c.name}</p>
                      <p style="margin:0;font-size:13px;color:${EMAIL_BODY_SOFT};line-height:1.55;font-family:${EMAIL_FF};">${c.detail}</p>
                      ${c.action ? `<p style="margin:6px 0 0;font-size:12px;color:#B7791F;line-height:1.55;font-family:${EMAIL_FF};">&#9889; ${c.action}</p>` : ''}
                      ${c.manualFix ? `<p style="margin:6px 0 0;font-size:12px;color:#DC2626;line-height:1.55;font-family:${EMAIL_FF};">Action needed: ${c.manualFix}</p>` : ''}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`
  }

  const renderSection = (label: string, items: CheckResult[]) =>
    emailFeaturedCard(
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${items.map((c, i) => renderRow(c, i === items.length - 1)).join('')}</table>`,
      { eyebrow: label },
    )

  const calloutBlock = failures.length > 0
    ? emailCallout({ eyebrow: 'Needs manual attention', value: `${failures.length}`, unit: `issue${failures.length === 1 ? '' : 's'} failing` })
    : fixes.length > 0
      ? emailCallout({ eyebrow: 'Auto-fixed', value: `${fixes.length}`, unit: `issue${fixes.length === 1 ? '' : 's'} resolved` })
      : ''

  const tailStatusCard = failures.length > 0
    ? emailStatusCard({ eyebrow: 'Manual action required', headline: 'Follow the steps under each failed check above.', body: 'These issues could not be fixed automatically. Each row lists the exact action you need to take.' })
    : fixes.length > 0
      ? emailStatusCard({ eyebrow: 'Auto-fixed', headline: 'No action needed from you.', body: 'Issues were detected and resolved automatically before they affected any client.' })
      : emailStatusCard({ eyebrow: 'All clear', headline: 'No issues found.', body: `${checks.length} checks ran, all passed. Next run tomorrow morning Brisbane time.` })

  const inner = `
${emailLogo()}
${emailEyebrow('Daily System Check')}
${emailHeading(headline)}
${emailDivider()}
${emailBody(`Run at ${runAt} Brisbane.`, { size: 14, color: EMAIL_MUTED, bottom: calloutBlock ? 22 : 18 })}
${calloutBlock}
${renderSection('Infrastructure', infra)}
${renderSection('Write smoke tests', write)}
${renderSection('Data integrity', data)}
${renderSection('Automation + pipeline', automation)}
${tailStatusCard}
${darkEmailSignature()}
`

  const resend = new Resend(process.env.RESEND_API_KEY!)
  const result = await resend.emails.send({
    from: 'Body Recode System <kade@bodyrecode.au>',
    to: 'kade@bodyrecode.au',
    subject,
    html: darkEmailShell(inner, { previewText: headline }),
  })

  console.log('Sent:', JSON.stringify(result, null, 2))
  console.log(`Source run: ${run.ran_at} | failures: ${failures.length} | fixes: ${fixes.length}`)
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
