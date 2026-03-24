import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ORIENTATION_PDF_URL = 'https://klotlednmxhywimztozm.supabase.co/storage/v1/object/public/assets/Performance%20Coaching%20Orientation.pdf'

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

  // Fetch the PDF from Supabase storage
  const pdfRes = await fetch(ORIENTATION_PDF_URL)
  if (!pdfRes.ok) return NextResponse.json({ error: 'Could not load orientation PDF' }, { status: 500 })
  const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer())

  const resend = new Resend(process.env.RESEND_API_KEY)

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin: 0; padding: 0; background: #0a0a0a; font-family: Georgia, serif; }
  .wrapper { max-width: 600px; margin: 0 auto; padding: 48px 32px; }
  .logo { font-size: 11px; letter-spacing: 0.2em; color: #555; text-transform: uppercase; margin-bottom: 48px; }
  p { font-size: 15px; color: #aaa; line-height: 1.9; margin: 0 0 20px; }
  .footer { margin-top: 48px; font-size: 12px; color: #444; letter-spacing: 0.05em; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="logo">Body Recode&trade; &middot; Performance Coaching</div>

  <p>Hi ${firstName},</p>

  <p>I've attached the Body Recode Performance Coaching Orientation Guide for you to read through before we connect again.</p>

  <p>There's nothing to complete, decide, or action. Just read it at your own pace when you're ready. It covers how the coaching process works, what the relationship looks like, and what to expect from the structure.</p>

  <p>Take your time with it. Orientation exists to create clarity, not momentum.</p>

  <p>If anything stands out or you have questions before we speak, feel free to reply to this email.</p>

  <p>Kade</p>

  <div class="footer">Body Recode&trade; &middot; Performance Coaching &middot; Brisbane</div>
</div>
</body>
</html>
`

  await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: lead.email,
    subject: `${firstName}, your Body Recode Orientation Guide`,
    html,
    attachments: [
      {
        filename: 'Body Recode Performance Coaching Orientation.pdf',
        content: pdfBuffer,
      },
    ],
  })

  const admin = createAdminClient()
  await admin
    .from('leads')
    .update({ orientation_sent_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ sent: true })
}
