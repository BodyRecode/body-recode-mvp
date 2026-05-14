import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { buildReportEmail } from '@/lib/generate-report'
import { darkEmailSignature } from '@/lib/email-signature'
import { buildPortalOrientationEmail } from '@/lib/portal-orientation-email'
import { appUrl } from '@/lib/app-url'

const SAMPLE_ANSWERS: Record<string, number> = {
  effort_vs_result: 2,
  consistency: 2,
  training_response: 1,
  recovery_predictability: 2,
  planning_vs_reality: 1,
  week_variability: 2,
  body_signals: 1,
  external_load: 2,
  adjustments: 1,
  support: 2,
}

export async function POST(request: NextRequest) {
  const { type } = await request.json()
  const resend = new Resend(process.env.RESEND_API_KEY!)
  const bookingLink = process.env.BOOKING_LINK ?? ''

  if (type === 'report-preview') {
    const firstName = 'Kade'
    const signalPattern = 'Optimisation'

    const reportHtml = await buildReportEmail(firstName, SAMPLE_ANSWERS, signalPattern, bookingLink)

    const introHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
</head>
<body style="margin:0;padding:0;background-color:#0c0a09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" bgcolor="#0c0a09">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:580px;background-color:#111110;border-radius:16px 16px 0 0;border:1px solid #1c1917;border-bottom:none;overflow:hidden;">
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:32px 40px 28px;border-bottom:1px solid #1c1917;">
              <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;">
              <p style="margin:0 0 20px;font-size:15px;color:#888888;line-height:1.75;">Hey ${firstName},</p>
              <p style="margin:0 0 20px;font-size:15px;color:#888888;line-height:1.75;">You completed a performance check-in a little while back and I wanted to follow up.</p>
              <p style="margin:0 0 20px;font-size:15px;color:#888888;line-height:1.75;">There is a chance your original report landed in your junk or spam folder so I have included it again below.</p>
              <p style="margin:0 0 0;font-size:15px;color:#888888;line-height:1.75;">If you have any questions about what it means or want to talk through it, just reply to this email.</p>
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    const reportBody = reportHtml
      .replace(/^[\s\S]*?<body[^>]*>/i, '')
      .replace(/<\/body>[\s\S]*$/i, '')

    const combined = introHtml.replace('</body>\n</html>', '') +
      `<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:0 20px 48px;">
        <tr><td align="center">${reportBody}</td></tr>
      </table>
      </body></html>`

    const result = await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: 'Preview — Lead re-engagement report email',
      html: combined,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({ sent: true, id: result.data?.id })
  }

  if (type === 'portal-orientation') {
    // appUrl() already pins to the production domain (with safety checks
    // against the historical Vercel-preview-URL leak), so test sends
    // automatically reference production assets that render in real email
    // clients regardless of local env-var state.
    const { subject, html } = buildPortalOrientationEmail({
      firstName: 'Kade',
      portalUrl: `${appUrl()}/portal/test-token`,
    })
    const result = await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `[TEST] ${subject}`,
      html,
    })
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({ sent: true, id: result.data?.id })
  }

  return NextResponse.json({ sent: false, error: 'Unknown type' }, { status: 400 })
}
