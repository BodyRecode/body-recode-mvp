import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { appUrl } from '@/lib/app-url'

const CATEGORIES = new Set([
  'portal_experience',
  'coaching_experience',
  'feature_request',
  'bug',
  'other',
])

const CATEGORY_LABELS: Record<string, string> = {
  portal_experience: 'Portal experience',
  coaching_experience: 'Coaching experience',
  feature_request: 'Feature request',
  bug: 'Bug',
  other: 'Other',
}

const MAX_LEN = 2000

export async function POST(request: NextRequest) {
  // Auth on the user-bound client so only the logged-in client (or coach) can
  // submit. The submit then routes through the admin client for the insert +
  // notify to bypass RLS the same way every other portal action does.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { client_id, category, body } = await request.json()
  if (!client_id || typeof client_id !== 'string') {
    return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })
  }
  if (!CATEGORIES.has(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }
  if (typeof body !== 'string' || body.trim().length < 4) {
    return NextResponse.json({ error: 'Tell us a little more (4+ characters).' }, { status: 400 })
  }
  if (body.length > MAX_LEN) {
    return NextResponse.json({ error: `Trim to ${MAX_LEN} characters.` }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify the logged-in user matches the client whose feedback is being
  // submitted. Prevents cross-client submission via a forged client_id.
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token')
    .eq('id', client_id)
    .maybeSingle()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }
  if ((user.email ?? '').toLowerCase() !== (client.email ?? '').toLowerCase()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const cleaned = body.trim().replace(/—/g, ', ')

  const { error: insertErr } = await admin.from('client_feedback').insert({
    client_id,
    category,
    body: cleaned,
  })
  if (insertErr) {
    console.error('client_feedback insert failed:', insertErr)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }

  // Notify the coach. Failure does not block the client confirmation; the row
  // is in the DB and Kade can see it in the dashboard once the inbox view ships.
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const baseUrl = appUrl()
    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `${client.name} sent feedback: ${CATEGORY_LABELS[category]}`,
      html: buildCoachNotificationEmail({
        eyebrow: `Feedback - ${CATEGORY_LABELS[category]}`,
        heading: `${client.name} sent feedback`,
        body: [
          `${client.name} submitted feedback under the <strong>${CATEGORY_LABELS[category]}</strong> category from the portal.`,
          escapeHtml(cleaned).replace(/\n/g, '<br/>'),
        ],
        ctaLabel: 'Open client profile',
        ctaUrl: `${baseUrl}/dashboard/clients/${client.id}`,
        footnote: 'Reply directly to the client at the address on file if a response is needed.',
      }),
    })
  } catch (e) {
    console.error('Feedback notification email failed:', e)
  }

  return NextResponse.json({ success: true })
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
