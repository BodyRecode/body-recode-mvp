import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { fromCoach, darkEmailShell } from '@/lib/email-shell'
import { sendSms, formatPhone } from '@/lib/twilio'
import { isCoachUser, forbidden } from '@/lib/api-auth'
import { logoUrl } from '@/config/tenant'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { id } = await params
  const body = await request.json()
  const scheduleAt: string | null = body.schedule_at || null

  // Load campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('be_campaigns')
    .select('*')
    .eq('id', id)
    .eq('coach_id', user.id)
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  if (campaign.status !== 'draft') {
    return NextResponse.json({ error: 'Only draft campaigns can be sent' }, { status: 400 })
  }

  // If scheduling for later, just update the campaign
  if (scheduleAt) {
    const { data: updated } = await supabase
      .from('be_campaigns')
      .update({ status: 'scheduled', scheduled_at: scheduleAt })
      .eq('id', id)
      .select()
      .single()
    return NextResponse.json(updated)
  }

  // Resolve recipients
  const admin = createAdminClient()
  const filter = campaign.recipient_filter as Record<string, string> ?? {}

  type Recipient = { name: string; email: string | null; phone: string | null }
  let recipients: Recipient[] = []

  const resolveRecipients = async (table: 'leads' | 'clients', extraFilter?: { column: string; value: string }) => {
    // coach_id may be null on legacy leads — use or() to catch both
    let query = admin.from(table).select('name, email, phone')
      .or(`coach_id.eq.${user.id},coach_id.is.null`)
    if (extraFilter) query = query.eq(extraFilter.column, extraFilter.value)
    const { data } = await query
    return (data ?? []) as Recipient[]
  }

  if (filter.type === 'all_clients') {
    recipients = await resolveRecipients('clients')
  } else if (filter.type === 'all_leads') {
    recipients = await resolveRecipients('leads')
  } else if (filter.type === 'pipeline_stage' && filter.value) {
    recipients = await resolveRecipients('leads', { column: 'status', value: filter.value })
  } else if (filter.type === 'tag' && filter.value) {
    const { data: tag } = await admin
      .from('be_tags')
      .select('id')
      .eq('name', filter.value)
      .eq('coach_id', user.id)
      .maybeSingle()
    if (tag) {
      const { data: taggedLeads } = await admin
        .from('be_lead_tags')
        .select('leads(name, email, phone)')
        .eq('tag_id', tag.id)
      recipients = (taggedLeads ?? [])
        .map((r: any) => r.leads)
        .filter(Boolean) as Recipient[]
    }
  } else {
    recipients = await resolveRecipients('leads')
  }

  let sentCount = 0

  // Send emails
  if (campaign.type === 'email' && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)

    for (const recipient of recipients) {
      if (!recipient.email) continue
      try {
        const firstName = recipient.name?.split(' ')[0] ?? 'there'
        const personalised = (campaign.content ?? '')
          .replace(/\{\{first_name\}\}/g, firstName)

        await resend.emails.send({
          from: fromCoach(),
          to: recipient.email,
          subject: campaign.subject ?? campaign.name,
          html: darkEmailShell(`
      <img src="${logoUrl()}" width="130" alt="Body Recode" style="display:block;margin-bottom:40px;border:0;"/>
      <div style="font-size:15px;color:#4A4A4A;line-height:1.9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        ${personalised.replace(/\n/g, '<br/>')}
      </div>
`, { previewText: campaign.subject ?? campaign.name }),
        })
        sentCount++
      } catch (err) {
        console.error(`Failed to send email to ${recipient.email}:`, err)
      }
    }
  }

  // Send SMS
  if (campaign.type === 'sms') {
    for (const recipient of recipients) {
      if (!recipient.phone) continue
      try {
        const firstName = recipient.name?.split(' ')[0] ?? 'there'
        const personalised = (campaign.content ?? '')
          .replace(/\{\{first_name\}\}/g, firstName)

        await sendSms({
          to: formatPhone(recipient.phone),
          message: personalised,
        })
        sentCount++
      } catch (err) {
        console.error(`Failed to send SMS to ${recipient.phone}:`, err)
      }
    }
  }

  // Mark sent
  const { data: updated } = await supabase
    .from('be_campaigns')
    .update({
      status: 'completed',
      sent_at: new Date().toISOString(),
      recipient_count: sentCount,
    })
    .eq('id', id)
    .select()
    .single()

  return NextResponse.json({ ...updated, sent_count: sentCount })
}
