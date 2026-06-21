import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDefaultCoachId } from '@/lib/default-coach'
import { logLeadEvent } from '@/lib/log-lead-event'
import { darkEmailSignature } from '@/lib/email-signature'
import { appUrl } from '@/lib/app-url'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, email, phone, preferredTime, note } = body

  if (!name || !email || !preferredTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const cleanEmail = email.trim().toLowerCase()
  const cleanName = name.trim()
  const cleanPhone = phone?.trim() || null
  const cleanPreferredTime = preferredTime.trim()
  const cleanNote = note?.trim() || null

  const admin = createAdminClient()

  // Find or create lead
  let lead
  const { data: existingLead } = await admin
    .from('leads')
    .select('*')
    .ilike('email', cleanEmail)
    .maybeSingle()

  if (existingLead) {
    lead = existingLead
  } else {
    const coachId = await getDefaultCoachId(admin)
    const { data: newLead, error: leadError } = await admin
      .from('leads')
      .insert({
        coach_id: coachId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        source: 'direct',
        status: 'new_check_in',
      })
      .select()
      .single()

    if (leadError || !newLead) {
      return NextResponse.json({ error: 'Failed to record request' }, { status: 500 })
    }
    lead = newLead
  }

  const eventNotes = cleanNote
    ? `Preferred time: ${cleanPreferredTime}\n\nNote: ${cleanNote}`
    : `Preferred time: ${cleanPreferredTime}`

  await logLeadEvent({
    leadId: lead.id,
    type: 'custom_time_requested',
    notes: eventNotes,
    sentAt: new Date(),
  })

  // Notify coach
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const leadUrl = `${appUrl()}/dashboard/leads/${lead.id}`
    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      replyTo: cleanEmail,
      subject: `Custom time request — ${cleanName}`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="light only"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
            <img src="https://bodyrecode.au/logo-black.png" width="110" alt="Body Recode" style="display:block;"/>
          </td>
        </tr>
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:32px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#1A1A1A;">Custom time request — ${cleanName}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#6B6B6B;">${cleanEmail}${cleanPhone ? ' · ' + cleanPhone : ''}</p>
            <p style="margin:0 0 24px;font-size:13px;color:#666666;">None of the published slots worked. They suggested a time below — confirm by replying to this email or follow up directly.</p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;width:100%;">
              <tr>
                <td style="padding:14px 20px;background:#1a1a1a;border-radius:10px;border:1px solid #222;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#999999;letter-spacing:0.08em;text-transform:uppercase;">Preferred time</p>
                  <p style="margin:0;font-size:15px;color:#1A1A1A;white-space:pre-wrap;">${cleanPreferredTime}</p>
                </td>
              </tr>
            </table>
            ${cleanNote ? `<table cellpadding="0" cellspacing="0" style="margin-bottom:24px;width:100%;">
              <tr>
                <td style="padding:14px 20px;background:#1a1a1a;border-radius:10px;border:1px solid #222;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#999999;letter-spacing:0.08em;text-transform:uppercase;">Note</p>
                  <p style="margin:0;font-size:15px;color:#1A1A1A;white-space:pre-wrap;">${cleanNote}</p>
                </td>
              </tr>
            </table>` : ''}
            <a href="${leadUrl}" style="display:inline-block;padding:12px 20px;border:1px solid #333;color:#6B6B6B;font-size:13px;text-decoration:none;border-radius:8px;">View Lead →</a>
            ${darkEmailSignature()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    })

    // Confirmation to lead
    const firstName = cleanName.split(' ')[0]
    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: cleanEmail,
      subject: `Got your time request, ${firstName}`,
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
            <p style="margin:0 0 18px;font-size:15px;color:#999999;line-height:1.75;">Got your request. I'll get back to you within 24 hours to either confirm the time or suggest the closest slot that works.</p>
            <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;">
              <tr>
                <td style="padding:14px 20px;background:#1a1a1a;border-radius:10px;border:1px solid #222;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#999999;letter-spacing:0.08em;text-transform:uppercase;">You requested</p>
                  <p style="margin:0;font-size:15px;color:#1A1A1A;white-space:pre-wrap;">${cleanPreferredTime}</p>
                </td>
              </tr>
            </table>
            ${darkEmailSignature()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    })
  }

  return NextResponse.json({ success: true })
}
