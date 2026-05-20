import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { appUrl } from '@/lib/app-url'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { clientId, friendName, friendEmail, note } = await req.json()
  if (!clientId || !friendName || !friendEmail) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email')
    .eq('id', clientId)
    .maybeSingle()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if ((user.email ?? '').toLowerCase() !== (client.email ?? '').toLowerCase()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const baseUrl = appUrl()
    const cleanNote = typeof note === 'string' ? note.trim().replace(/—/g, ', ') : null
    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const escapedNote = cleanNote ? escape(cleanNote).replace(/\n/g, '<br/>') : null

    try {
      await resend.emails.send({
        from: 'Body Recode <kade@bodyrecode.au>',
        to: 'kade@bodyrecode.au',
        replyTo: client.email ?? undefined,
        subject: `Referral from ${client.name}: ${friendName}`,
        html: buildCoachNotificationEmail({
          eyebrow: 'Referral',
          heading: `${client.name} has referred ${escape(friendName)}`,
          body: [
            `<strong style="color:#fff;">${escape(friendName)}</strong>`,
            `<a href="mailto:${escape(friendEmail)}" style="color:#1B6DFC;">${escape(friendEmail)}</a>`,
            ...(escapedNote ? [`<div style="background:#FFFFFF;border:1px solid #E5E5E5;border-radius:12px;padding:16px;margin:16px 0;color:#E5E5E5;font-size:14px;line-height:1.7;"><strong style="color:#fff;">Note from ${escape(client.name)}:</strong><br/>${escapedNote}</div>`] : []),
          ],
          ctaLabel: 'Open client profile',
          ctaUrl: `${baseUrl}/dashboard/clients/${clientId}`,
        }),
      })
    } catch (e) {
      console.error('Referral notification failed:', e)
    }
  }

  return NextResponse.json({ success: true })
}
