import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildZoom1DeclinedEmails, nextMorning9amBrisbane, daysAfter9amBrisbane } from '@/lib/generate-report'
import { logLeadEvent } from '@/lib/log-lead-event'
import { sendDownsellOffer } from '@/lib/send-downsell-offer'
import { fromCoach } from '@/lib/email-shell'
import { brand } from "@/config/tenant";

const BOOKING_LINK = `${brand().marketingDomain}/book`

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const admin = createAdminClient()

  const { data: lead } = await admin
    .from('leads')
    .select('id, name, email')
    .eq('id', id)
    .maybeSingle()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (!lead.email) return NextResponse.json({ error: 'No email address for this lead' }, { status: 400 })

  const firstName = lead.name.split(' ')[0]
  const { email1, email2, email3 } = buildZoom1DeclinedEmails(firstName, BOOKING_LINK)

  const resend = new Resend(process.env.RESEND_API_KEY)

  const email1At = nextMorning9amBrisbane()
  const email2At = daysAfter9amBrisbane(email1At, 5)
  const email3At = daysAfter9amBrisbane(email1At, 12)

  const [r1, r2, r3] = await Promise.all([
    resend.emails.send({
      from: fromCoach(),
      to: lead.email,
      subject: email1.subject,
      html: email1.html,
      scheduledAt: email1At.toISOString(),
    }),
    resend.emails.send({
      from: fromCoach(),
      to: lead.email,
      subject: email2.subject,
      html: email2.html,
      scheduledAt: email2At.toISOString(),
    }),
    resend.emails.send({
      from: fromCoach(),
      to: lead.email,
      subject: email3.subject,
      html: email3.html,
      scheduledAt: email3At.toISOString(),
    }),
  ])

  const emailIds = [r1.data?.id, r2.data?.id, r3.data?.id].filter(Boolean) as string[]

  await admin
    .from('leads')
    .update({ followup_email_ids: emailIds, status: 'cold_no_booking' })
    .eq('id', id)

  const schedules = [
    { id: r1.data?.id, subject: email1.subject, sentAt: email1At },
    { id: r2.data?.id, subject: email2.subject, sentAt: email2At },
    { id: r3.data?.id, subject: email3.subject, sentAt: email3At },
  ]
  for (const e of schedules) {
    if (e.id) {
      await logLeadEvent({
        leadId: id,
        type: 'followup_scheduled',
        subject: e.subject,
        resendEmailId: e.id,
        sentAt: e.sentAt,
      })
    }
  }

  // Auto-send downsell offer
  await sendDownsellOffer(id, lead, admin)

  return NextResponse.json({ sent: true, count: emailIds.length })
}
