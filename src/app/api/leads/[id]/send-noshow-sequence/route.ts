import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildNoShowEmails, nextMorning9amBrisbane, daysAfter9amBrisbane } from '@/lib/generate-report'

const BOOKING_LINK = 'https://calendly.com/bodyrecode'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: lead } = await supabase
    .from('leads')
    .select('id, name, email')
    .eq('id', id)
    .maybeSingle()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (!lead.email) return NextResponse.json({ error: 'No email address for this lead' }, { status: 400 })

  const firstName = lead.name.split(' ')[0]
  const { email1, email2, email3 } = buildNoShowEmails(firstName, BOOKING_LINK)

  const resend = new Resend(process.env.RESEND_API_KEY)

  const email1At = nextMorning9amBrisbane()
  const email2At = daysAfter9amBrisbane(email1At, 4)
  const email3At = daysAfter9amBrisbane(email1At, 10)

  const [r1, r2, r3] = await Promise.all([
    resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: lead.email,
      subject: email1.subject,
      html: email1.html,
      scheduledAt: email1At.toISOString(),
    }),
    resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: lead.email,
      subject: email2.subject,
      html: email2.html,
      scheduledAt: email2At.toISOString(),
    }),
    resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: lead.email,
      subject: email3.subject,
      html: email3.html,
      scheduledAt: email3At.toISOString(),
    }),
  ])

  const emailIds = [r1.data?.id, r2.data?.id, r3.data?.id].filter(Boolean) as string[]

  const admin = createAdminClient()
  await admin
    .from('leads')
    .update({ followup_email_ids: emailIds })
    .eq('id', id)

  return NextResponse.json({ sent: true, count: emailIds.length })
}
