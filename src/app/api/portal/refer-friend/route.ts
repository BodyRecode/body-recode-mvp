import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'

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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.bodyrecode.au'
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
            `<a href="mailto:${escape(friendEmail)}" style="color:#14b8a6;">${escape(friendEmail)}</a>`,
            ...(escapedNote ? [`<div style="background:#0c0a09;border:1px solid #1c1917;border-radius:12px;padding:16px;margin:16px 0;color:#e7e5e4;font-size:14px;line-height:1.7;"><strong style="color:#fff;">Note from ${escape(client.name)}:</strong><br/>${escapedNote}</div>`] : []),
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
