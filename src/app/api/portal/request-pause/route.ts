import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { clientId, reason } = await req.json()
  if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, phone, package, coaching_started_at')
    .eq('id', clientId)
    .maybeSingle()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if ((user.email ?? '').toLowerCase() !== (client.email ?? '').toLowerCase()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.bodyrecode.au'
    const cleanReason = typeof reason === 'string' ? reason.trim().replace(/—/g, ', ') : null
    const escapedReason = cleanReason
      ? cleanReason
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\n/g, '<br/>')
      : null

    try {
      await resend.emails.send({
        from: 'Body Recode <kade@bodyrecode.au>',
        to: 'kade@bodyrecode.au',
        replyTo: client.email ?? undefined,
        subject: `Pause request from ${client.name}`,
        html: buildCoachNotificationEmail({
          eyebrow: 'Pause Request',
          heading: `${client.name} has requested a pause`,
          body: [
            `<em style="color:#57534e;">Reply directly to this email to coordinate. The pause has not been auto-applied.</em>`,
            ...(escapedReason
              ? [`<div style="background:#0c0a09;border:1px solid #1c1917;border-radius:12px;padding:16px;margin:16px 0;color:#e7e5e4;font-size:14px;line-height:1.7;"><strong style="color:#fff;">Reason:</strong><br/>${escapedReason}</div>`]
              : ['<em>No reason provided.</em>']),
          ],
          ctaLabel: 'Open client profile',
          ctaUrl: `${baseUrl}/dashboard/clients/${clientId}`,
          accent: 'amber',
        }),
      })
    } catch (e) {
      console.error('Pause notification failed:', e)
    }
  }

  return NextResponse.json({ success: true })
}
