import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'
import { logLeadEvent } from '@/lib/log-lead-event'

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
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: lead.email,
    subject: 'Book your Zoom call with Kade',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:520px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
        <tr>
          <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;border-bottom:1px solid #1c1917;">
            <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;"/>
          </td>
        </tr>
        <tr>
          <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <p style="margin:0 0 18px;font-size:15px;color:#888888;line-height:1.75;">Hi ${firstName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#888888;line-height:1.75;">Use the link below to pick a time for your Zoom call. It takes 30 seconds and you will get a confirmation straight away.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td><a href="${bookingLink}" style="display:inline-block;padding:14px 28px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Book your Zoom call</a></td>
              </tr>
            </table>
            <p style="margin:0 0 24px;font-size:13px;color:#555555;">Or copy this link: ${bookingLink}</p>
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
