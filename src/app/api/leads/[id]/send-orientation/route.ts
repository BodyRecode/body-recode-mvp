import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'
import { logLeadEvent } from '@/lib/log-lead-event'

const ORIENTATION_URL = 'https://app.bodyrecode.au/orientation'

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
  p { font-size: 15px; color: #aaa; line-height: 1.9; margin: 0 0 20px; }
  .btn { display: inline-block; margin: 8px 0 24px; padding: 14px 28px; background: #10E1C2; color: #000; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; letter-spacing: 0.02em; }
</style>
</head>
<body>
<div class="wrapper">
  <div style="margin-bottom: 48px;">
    <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
  </div>

  <p>Hi ${firstName},</p>

  <p>Before our next Zoom, I'd like you to read through the Body Recode Performance Coaching Orientation Guide.</p>

  <p>There's nothing to complete, decide, or action. Just read it at your own pace when you're ready. It covers how the coaching process works, what the relationship looks like, and what to expect from the structure.</p>

  <p>Take your time with it. Orientation exists to create clarity, not momentum.</p>

  <a href="${ORIENTATION_URL}" class="btn">Read the Orientation Guide</a>

  <p>If anything stands out or you have questions before we speak, feel free to reply to this email.</p>

  ${darkEmailSignature()}
</div>
</body>
</html>
`

  await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: lead.email,
    subject: `${firstName}, your Body Recode Orientation Guide`,
    html,
  })

  const admin = createAdminClient()
  await admin
    .from('leads')
    .update({ orientation_sent_at: new Date().toISOString() })
    .eq('id', id)

  await logLeadEvent({
    leadId: id,
    type: 'orientation_sent',
    subject: `${firstName}, your Body Recode Orientation Guide`,
  })

  return NextResponse.json({ sent: true })
}
