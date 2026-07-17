import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDefaultCoachId } from '@/lib/default-coach'
import { logLeadEvent } from '@/lib/log-lead-event'
import { darkEmailSignature } from '@/lib/email-signature'
import { appUrl } from '@/lib/app-url'
import {
  fromCoach,
  fromBrand,
  darkEmailShell,
  emailLogo,
  emailEyebrow,
  emailHeading,
  emailBody,
  emailFeaturedCard,
  emailCta,
  emailUrlFallback,
  EMAIL_GRAPHITE,
  EMAIL_MUTED,
  EMAIL_FF,
} from '@/lib/email-shell'
import { coach, brand } from '@/config/tenant'

/** Graphite value line for a featured card (e.g. the requested time). Preserves line breaks. */
function prefTimeValue(value: string): string {
  return `<p style="margin:0;font-size:16px;color:${EMAIL_GRAPHITE};line-height:1.6;white-space:pre-wrap;font-family:${EMAIL_FF};">${value}</p>`
}

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
      from: fromBrand(),
      to: coach().email,
      replyTo: cleanEmail,
      subject: `Custom time request — ${cleanName}`,
      html: darkEmailShell(
        `${emailLogo(130)}
${emailEyebrow('New booking request')}
${emailHeading(`Custom time request — ${cleanName}`, { size: 26 })}
${emailBody(`${cleanEmail}${cleanPhone ? ' · ' + cleanPhone : ''}`, { color: EMAIL_MUTED, size: 14, bottom: 10 })}
${emailBody('They want to book a call and suggested the times below — reply to this email to confirm and book them in.', { size: 15, bottom: 22 })}
${emailFeaturedCard(prefTimeValue(cleanPreferredTime), { eyebrow: 'Preferred time' })}
${cleanNote ? emailFeaturedCard(prefTimeValue(cleanNote), { eyebrow: 'Note' }) : ''}
${emailCta({ href: leadUrl, label: 'View lead →' })}
${darkEmailSignature()}`,
        { previewText: `${cleanName} suggested: ${cleanPreferredTime}` },
      ),
    })

    // Confirmation to lead
    const firstName = cleanName.split(' ')[0]
    await resend.emails.send({
      from: fromCoach(),
      to: cleanEmail,
      subject: `Got your time request, ${firstName}`,
      html: (() => {
        const prepUrl = `${brand().marketingDomain}/book/prep/${lead.id}`
        return darkEmailShell(
          `${emailLogo(150)}
${emailEyebrow('Booking request received')}
${emailHeading(`Thanks, ${firstName}`)}
${emailBody("Got your request. I'll get back to you within 24 hours to either confirm the time or suggest the closest slot that works.")}
${emailFeaturedCard(prefTimeValue(cleanPreferredTime), { eyebrow: 'You requested' })}
${emailBody('One thing before we talk: please take 3-4 minutes to fill this in. It means I walk into our call already understanding where you\'re at, so we can go straight to what matters.')}
${emailCta({ href: prepUrl, label: 'Complete this before our call →' })}
${emailUrlFallback(prepUrl)}
${darkEmailSignature()}`,
          { previewText: "Got your request — I'll confirm within 24 hours." },
        )
      })(),
    })
  }

  return NextResponse.json({ success: true })
}
