import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .update({ medical_clearance_received_at: new Date().toISOString() })
    .eq('id', id)
    .select('name, email, onboarding_token')
    .single()

  // Notify client by email
  if (client?.email && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const firstName = client.name?.split(' ')[0] ?? 'there'
    const portalUrl = `https://app.bodyrecode.au/portal/${client.onboarding_token}`

    await resend.emails.send({
      from: 'Kade at Body Recode <kade@bodyrecode.au>',
      to: client.email,
      subject: 'Medical clearance approved — you\'re good to go',
      html: `
        <p>Hi ${firstName},</p>
        <p>Your medical clearance has been reviewed and approved.</p>
        <p>Your onboarding is now fully unlocked — you can complete your Foundational Intake and Baseline Documentation through your portal.</p>
        <p><a href="${portalUrl}" style="display:inline-block;background:#2dd4bf;color:#000;font-weight:700;padding:12px 24px;border-radius:12px;text-decoration:none;margin-top:8px;">Go to my portal →</a></p>
        <p style="margin-top:24px;color:#78716c;font-size:14px;">Kade<br>Body Recode™</p>
      `,
    }).catch(err => console.error('Clearance approval email error:', err))
  }

  return NextResponse.json({ success: true })
}
