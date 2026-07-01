import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { appUrl } from '@/lib/app-url'
import { fromBrand } from '@/lib/email-shell'
import { coach } from '@/config/tenant'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { clientId, body, portalToken } = await req.json()
  if (!clientId || typeof body !== 'string' || !body.trim()) {
    return NextResponse.json({ error: 'Missing message' }, { status: 400 })
  }
  if (body.length > 5000) {
    return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify user owns this client record before writing
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email')
    .eq('id', clientId)
    .maybeSingle()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if ((user.email ?? '').toLowerCase() !== (client.email ?? '').toLowerCase()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Strip em dashes per content rule (this lands in Kade's email + Supabase)
  const cleaned = body.trim().replace(/—/g, ', ')

  const { error: insertErr } = await admin
    .from('client_messages')
    .insert({ client_id: clientId, body: cleaned })

  if (insertErr) {
    console.error('Failed to log client message:', insertErr)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }

  // Notify Kade
  if (process.env.RESEND_API_KEY) {
    const baseUrl = appUrl()
    const resend = new Resend(process.env.RESEND_API_KEY)
    const escapedBody = cleaned
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>')
    try {
      await resend.emails.send({
        from: fromBrand(),
        to: coach().email,
        replyTo: client.email ?? undefined,
        subject: `Message from ${client.name}`,
        html: buildCoachNotificationEmail({
          eyebrow: 'Client Message',
          heading: `${client.name} sent you a message`,
          body: [
            `<em style="color:#999999;">Sent via the client portal. Reply directly to this email and the client will receive your response.</em>`,
            `<div style="background:#FFFFFF;border:1px solid #E5E5E5;border-radius:12px;padding:16px;margin:16px 0;color:#E5E5E5;font-size:14px;line-height:1.7;">${escapedBody}</div>`,
          ],
          ctaLabel: 'Open client profile',
          ctaUrl: `${baseUrl}/dashboard/clients/${clientId}`,
        }),
      })
    } catch (e) {
      console.error('Notification email failed:', e)
      // Don't fail the request - the message is logged in Supabase regardless
    }
  }

  return NextResponse.json({ success: true })
}
