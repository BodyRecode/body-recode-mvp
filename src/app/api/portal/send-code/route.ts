import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

const CODE_TTL_MINUTES = 10

function generateCode(): string {
  // 6-digit, no leading-zero ambiguity (always pad to 6)
  return Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0')
}

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const cleanEmail = email.trim().toLowerCase()
  const code = generateCode()
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString()

  const admin = createAdminClient()

  // Invalidate any existing unused codes for this email so only the latest works
  await admin
    .from('portal_login_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('email', cleanEmail)
    .is('used_at', null)

  // Insert the new code
  const { error: insertError } = await admin
    .from('portal_login_codes')
    .insert({ email: cleanEmail, code, expires_at: expiresAt })

  if (insertError) {
    console.error('Failed to store portal login code:', insertError)
    return NextResponse.json({ error: 'Failed to send code' }, { status: 500 })
  }

  // Send via Resend — fully branded, no clickable auth link for any mail
  // scanner to pre-fetch.
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'Body Recode <kade@bodyrecode.au>',
    to: cleanEmail,
    subject: 'Your Body Recode sign-in code',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:48px 32px;">
    <div style="margin-bottom:40px;">
      <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;"/>
    </div>
    <p style="font-size:15px;color:#aaa;line-height:1.9;margin:0 0 24px;">Sign in to your Body Recode coaching portal. Enter the code below on the sign-in page.</p>
    <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:32px;text-align:center;margin:0 0 24px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#57534e;letter-spacing:0.08em;text-transform:uppercase;">Your sign-in code</p>
      <p style="margin:0;font-size:36px;font-weight:700;color:#10E1C2;letter-spacing:0.4em;font-family:monospace;">${code}</p>
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#a8a29e;line-height:1.5;">This code expires in ${CODE_TTL_MINUTES} minutes. If you didn't request this, you can safely ignore it.</p>
    <table cellpadding="0" cellspacing="0" style="margin-top:32px;padding-top:24px;border-top:1px solid #1e1e1e;">
      <tr>
        <td style="padding-right:16px;vertical-align:middle;">
          <img src="https://bodyrecode.au/kade.jpg" width="48" height="48" style="border-radius:50%;display:block;object-fit:cover;object-position:top;" alt="Kade Dunstone"/>
        </td>
        <td style="vertical-align:middle;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#ffffff;">Kade Dunstone</p>
          <p style="margin:2px 0 0;font-size:13px;color:#a8a29e;">Performance Coach · Body Recode</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`,
  })

  return NextResponse.json({ sent: true })
}
