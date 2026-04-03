import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

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
  let recipients: Array<{ name: string; email: string }> = []

  if (campaign.type === 'email') {
    if (filter.type === 'all_clients') {
      const { data } = await admin
        .from('clients')
        .select('name, email')
        .eq('coach_id', user.id)
        .not('email', 'is', null)
      recipients = data ?? []
    } else if (filter.type === 'all_leads') {
      const { data } = await admin
        .from('leads')
        .select('name, email')
        .eq('coach_id', user.id)
        .not('email', 'is', null)
      recipients = data ?? []
    } else if (filter.type === 'pipeline_stage' && filter.value) {
      const { data } = await admin
        .from('leads')
        .select('name, email')
        .eq('coach_id', user.id)
        .eq('status', filter.value)
        .not('email', 'is', null)
      recipients = data ?? []
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
          .select('leads(name, email)')
          .eq('tag_id', tag.id)
        recipients = (taggedLeads ?? [])
          .map((r: any) => r.leads)
          .filter((l: any) => l?.email) as Array<{ name: string; email: string }>
      }
    } else {
      // Default: all leads
      const { data } = await admin
        .from('leads')
        .select('name, email')
        .eq('coach_id', user.id)
        .not('email', 'is', null)
      recipients = data ?? []
    }
  }

  // Send emails
  let sentCount = 0
  if (campaign.type === 'email' && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)

    for (const recipient of recipients) {
      try {
        const firstName = recipient.name?.split(' ')[0] ?? 'there'
        const personalised = (campaign.content ?? '').replace(/\{\{first_name\}\}/g, firstName)

        await resend.emails.send({
          from: 'Kade at Body Recode <kade@bodyrecode.au>',
          to: recipient.email,
          subject: campaign.subject ?? campaign.name,
          html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:48px 32px;">
  <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;margin-bottom:40px;"/>
  <div style="font-size:15px;color:#aaa;line-height:1.9;">
    ${personalised.replace(/\n/g, '<br/>')}
  </div>
</div>
</body></html>`,
        })
        sentCount++
      } catch (err) {
        console.error(`Failed to send to ${recipient.email}:`, err)
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
