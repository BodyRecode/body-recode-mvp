import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, is_founding_client')
    .eq('id', id)
    .maybeSingle()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if (!client.email) return NextResponse.json({ error: 'No email address for this client' }, { status: 400 })
  if (!client.is_founding_client) return NextResponse.json({ error: 'Client is not a Founding Client' }, { status: 400 })

  // Create agreement record linked directly to the client (no lead)
  const { data: agreement, error: agreementError } = await admin
    .from('founding_client_agreements')
    .insert({
      client_id: id,
      lead_id: null,
      status: 'pending',
    })
    .select('token')
    .single()

  if (agreementError || !agreement) {
    console.error('Agreement insert error:', agreementError)
    return NextResponse.json({ error: 'Could not create agreement record' }, { status: 500 })
  }

  const firstName = client.name.split(' ')[0]
  const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/founding-client-agreement/${agreement.token}`
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: client.email,
    subject: `${firstName}, your Founding Client Agreement`,
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin: 0; padding: 0; background: #0a0a0a; font-family: Georgia, serif; }
  .wrapper { max-width: 600px; margin: 0 auto; padding: 48px 32px; }
  .logo { display: block; margin-bottom: 40px; }
  p { font-size: 15px; color: #aaa; line-height: 1.9; margin: 0 0 20px; }
  .btn { display: inline-block; margin: 8px 0 24px; padding: 14px 28px; background: #10E1C2; color: #000; text-decoration: none; font-size: 13px; font-weight: bold; letter-spacing: 0.05em; border-radius: 8px; }
</style>
</head>
<body>
<div class="wrapper">
  <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" class="logo" />

  <p>Hi ${firstName},</p>

  <p>As discussed, I've prepared your Founding Client Case Study Agreement for review.</p>

  <p>Please read through the agreement carefully. It covers how your engagement is documented, how that documentation may be used, and your consent tier selection - whether your participation remains anonymised or may be identified externally.</p>

  <p>There's no pressure to sign immediately. Take the time you need to read it properly. If anything is unclear, reply to this email before signing.</p>

  <a href="${signingUrl}" class="btn">Review and Sign Agreement</a>

  <p>Once the agreement is signed, I'll send through your subscription link to activate your coaching.</p>

  ${darkEmailSignature()}
</div>
</body>
</html>`,
  })

  return NextResponse.json({ sent: true, token: agreement.token })
}
