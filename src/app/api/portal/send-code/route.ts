import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { logClientCommunication } from '@/lib/client-communications'
import {
  darkEmailShell, emailUrlFallback,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  EMAIL_BLUE, EMAIL_BLUE_BG, EMAIL_BLUE_BORDER, EMAIL_BLUE_DARK,
  EMAIL_GRAPHITE, EMAIL_MUTED, EMAIL_FF, EMAIL_MONO,
} from '@/lib/email-shell'
import { darkEmailSignature } from '@/lib/email-signature'

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

  // Custom OTP code display — the code itself needs 36px / monospace /
  // letter-spaced / Signal Blue for instant readability, which is more
  // prominence than the generic emailCallout helper provides.
  const codeBlock = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${EMAIL_BLUE_BG}" style="background-color:${EMAIL_BLUE_BG};margin:0 0 24px;">
        <tr>
          <td bgcolor="${EMAIL_BLUE_BG}" align="center" style="background-color:${EMAIL_BLUE_BG};padding:28px 24px;border:1px solid ${EMAIL_BLUE_BORDER};border-radius:12px;">
            <p style="margin:0 0 10px;font-size:10px;font-weight:700;color:${EMAIL_BLUE_DARK};letter-spacing:0.12em;text-transform:uppercase;font-family:${EMAIL_FF};">Your sign-in code</p>
            <p style="margin:0;font-size:36px;font-weight:800;color:${EMAIL_GRAPHITE};letter-spacing:0.4em;font-family:${EMAIL_MONO};">${code}</p>
          </td>
        </tr>
      </table>`

  const inner = `
${emailLogo()}
${emailEyebrow('Portal Sign-in')}
${emailHeading('Enter this code to sign in.')}
${emailDivider()}
${emailBody('Enter the code below on the sign-in page to access your Body Recode coaching portal.')}
${codeBlock}
${emailBody(`This code expires in ${CODE_TTL_MINUTES} minutes. If you didn't request this, you can safely ignore it.`, { color: EMAIL_MUTED, size: 13, bottom: 16 })}
${emailUrlFallback('https://app.bodyrecode.au/portal/login', 'Sign-in page')}
${darkEmailSignature()}
`

  // Reference unused helper imports to keep the IDE quiet without polluting
  // the runtime — keeps the import line stable for future template edits.
  void EMAIL_BLUE

  await resend.emails.send({
    from: 'Body Recode <kade@bodyrecode.au>',
    to: cleanEmail,
    subject,
    html: darkEmailShell(inner, { previewText: `Your Body Recode sign-in code: ${code}` }),
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
