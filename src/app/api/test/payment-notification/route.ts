import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'Body Recode <kade@bodyrecode.au>',
    to: 'kade@bodyrecode.au',
    subject: `[PREVIEW] Payment received — John Smith`,
    html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0a0a0a;color:#aaa;">
  <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style="display:block;margin-bottom:32px;" />
  <p style="font-size:20px;font-weight:700;color:#fff;margin:0 0 8px;">John Smith just paid.</p>
  <p style="font-size:15px;color:#aaa;margin:0 0 24px;">Commencement fee confirmed. Welcome email and intake link have been sent to john@example.com.</p>
  <a href="#" style="display:inline-block;padding:12px 24px;background:#10E1C2;color:#000;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">View lead</a>
</div>`,
  })

  return NextResponse.json({ sent: true })
}
