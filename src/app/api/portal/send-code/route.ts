import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { logClientCommunication } from '@/lib/client-communications'
import { darkEmailShell, emailUrlFallback } from '@/lib/email-shell'

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

  // Send via Resend. Fully branded, no clickable auth link for any mail
  // scanner to pre-fetch.
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const subject = 'Your Body Recode sign-in code'

  await resend.emails.send({
    from: 'Body Recode <kade@bodyrecode.au>',
    to: cleanEmail,
    subject,
    html: darkEmailShell(`
      <div style="margin-bottom:40px;">
        <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;border:0;"/>
      </div>
      <p style="font-size:15px;color:#4A4A4A;line-height:1.9;margin:0 0 24px;">Sign in to your Body Recode coaching portal. Enter the code below on the sign-in page.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#1a1a1a" style="background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;margin:0 0 24px;">
        <tr>
          <td bgcolor="#1a1a1a" align="center" style="background-color:#1a1a1a;padding:32px;border-radius:12px;">
            <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#6B6B6B;letter-spacing:0.08em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Your sign-in code</p>
            <p style="margin:0;font-size:36px;font-weight:700;color:#1B6DFC;letter-spacing:0.4em;font-family:'Courier New',Consolas,monospace;">${code}</p>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:13px;color:#6B6B6B;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">This code expires in ${CODE_TTL_MINUTES} minutes. If you didn't request this, you can safely ignore it.</p>
      ${emailUrlFallback('https://app.bodyrecode.au/portal/login', 'Sign-in page')}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;margin-top:32px;border-top:1px solid #1e1e1e;width:100%;">
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:24px 16px 0 0;vertical-align:middle;width:64px;">
            <img src="https://bodyrecode.au/kade.jpg" width="48" height="48" style="border-radius:50%;display:block;object-fit:cover;object-position:top;border:0;" alt="Kade Dunstone"/>
          </td>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding-top:24px;vertical-align:middle;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#1A1A1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Kade Dunstone</p>
            <p style="margin:2px 0 0;font-size:13px;color:#6B6B6B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Performance Coach · Body Recode</p>
          </td>
        </tr>
      </table>
`, { previewText: `Your Body Recode sign-in code: ${code}` }),
  })

  // Best-effort: link this code email to the matching client (if any).
  const { data: clientRow } = await admin
    .from('clients')
    .select('id')
    .ilike('email', cleanEmail)
    .maybeSingle()

  if (clientRow?.id) {
    await logClientCommunication(admin, {
      clientId: clientRow.id,
      kind: 'portal_login_code',
      subject,
      toAddress: cleanEmail,
      meta: { trigger: 'self-serve', expires_in_minutes: CODE_TTL_MINUTES },
    })
  }

  return NextResponse.json({ sent: true })
}
