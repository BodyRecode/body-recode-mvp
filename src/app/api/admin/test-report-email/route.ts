import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'

export async function POST(request: NextRequest) {
  const { secret, body_state } = await request.json()
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const stateMap: Record<string, { score: number; section_scores: Record<string, number> }> = {
    'Depleted State':     { score: 6,  section_scores: { '01': 1, '02': 1, '03': 1, '04': 2, '05': 1 } },
    'Transitioning State':{ score: 10, section_scores: { '01': 2, '02': 2, '03': 1, '04': 2, '05': 3 } },
    'Ready State':        { score: 14, section_scores: { '01': 3, '02': 3, '03': 3, '04': 3, '05': 2 } },
  }

  const state = stateMap[body_state] ?? stateMap['Depleted State']
  const admin = createAdminClient()

  const { data: report } = await admin
    .from('scorecard_reports')
    .insert({
      name: 'Kade Dunstone',
      email: 'kade@bodyrecode.au',
      score: state.score,
      body_state: body_state ?? 'Depleted State',
      section_scores: state.section_scores,
    })
    .select('token')
    .single()

  if (!report) {
    return NextResponse.json({ error: 'Failed to create report record' }, { status: 500 })
  }

  const reportUrl = `https://app.bodyrecode.au/report/${report.token}`
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: 'kade@bodyrecode.au',
    subject: `Your Body Decode Report is ready`,
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
              <p style="margin:0 0 18px;font-size:15px;color:#999999;line-height:1.75;">Hi Kade,</p>
              <p style="margin:0 0 18px;font-size:15px;color:#999999;line-height:1.75;">Your Body Decode Report is ready. It breaks down what your scorecard results mean, what your body state tells us, what is working against you right now, and what to focus on first.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr><td><a href="${reportUrl}" style="display:inline-block;padding:14px 28px;background:#1B6DFC;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.03em;">View My Report</a></td></tr>
              </table>
              <p style="margin:0 0 18px;font-size:13px;color:#999999;line-height:1.75;">Or copy this link: ${reportUrl}</p>
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`,
  })

  return NextResponse.json({ sent: true, reportUrl })
}
