import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { appUrl } from '@/lib/app-url'
import { fromBrand } from '@/lib/email-shell'

export async function POST(req: NextRequest) {
  const { clientId, fullName } = await req.json()
  if (!clientId || !fullName) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('clients')
    .update({
      agreement_accepted_at: new Date().toISOString(),
      agreement_accepted_name: fullName,
    })
    .eq('id', clientId)

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 })

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const baseUrl = appUrl()
    await resend.emails.send({
      from: fromBrand(),
      to: 'kade@bodyrecode.au',
      subject: `${fullName} signed their coaching agreement`,
      html: buildCoachNotificationEmail({
        eyebrow: 'Coaching Agreement',
        heading: `${fullName} signed their coaching agreement`,
        body: `${fullName} has reviewed and electronically accepted the Body Recode coaching agreement. Their next portal task (Health Declaration) is now unlocked.`,
        ctaLabel: 'Open client profile',
        ctaUrl: `${baseUrl}/dashboard/clients/${clientId}`,
      }),
    })
  } catch (e) {
    console.error('Notification email failed:', e)
  }

  return NextResponse.json({ success: true })
}
