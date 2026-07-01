import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'
import { logLeadEvent } from '@/lib/log-lead-event'
import { fromCoach } from '@/lib/email-shell'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const { data: lead } = await supabase.from('leads').select('name, email').eq('id', id).single()
  if (!lead?.email) return NextResponse.json({ error: 'Lead has no email' }, { status: 400 })

  const firstName = lead.name.split(' ')[0]
  const bookingLink = 'https://bodyrecode.au/book'

  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'Email not configured' }, { status: 500 })

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: fromCoach(),
    to: lead.email,
    subject: `${firstName}, lock in your strategy call`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="light only"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
            <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;"/>
          </td>
        </tr>
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <p style="margin:0 0 18px;font-size:15px;color:#999999;line-height:1.75;">Hi ${firstName},</p>
            <p style="margin:0 0 18px;font-size:15px;color:#999999;line-height:1.75;">Pick a time and we will go through your scorecard, identify the specific reason your body has stopped responding, and map out what to do first.</p>
            <p style="margin:0 0 24px;font-size:15px;color:#999999;line-height:1.75;">Free. No pitch. Confirmation comes through straight away.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td><a href="${bookingLink}" style="display:inline-block;padding:14px 28px;background:#1B6DFC;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Lock in a time</a></td>
              </tr>
            </table>
            <p style="margin:0 0 24px;font-size:13px;color:#999999;">Or copy this link: ${bookingLink}</p>
            ${darkEmailSignature()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  })

  await logLeadEvent({
    leadId: id,
    type: 'email_sent',
    subject: 'Booking link sent',
    notes: 'Booking link email sent manually from lead profile.',
    sentAt: new Date(),
  })

  return NextResponse.json({ success: true })
}
