import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isCoachEmail } from '@/lib/coach-auth'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { appUrl } from '@/lib/app-url'
import { fromBrand } from '@/lib/email-shell'
import { coach } from '@/config/tenant'
import { CATEGORY_LABELS, isValidCategory, escapeHtml } from '@/lib/support-tickets'

const MAX_SUBJECT = 120
const MAX_BODY = 4000

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const payload = await request.json().catch(() => ({}))
  const category = typeof payload.category === 'string' ? payload.category : ''
  const subject = typeof payload.subject === 'string' ? payload.subject.trim() : ''
  const body = typeof payload.body === 'string' ? payload.body.trim() : ''
  const pageUrl = typeof payload.page_url === 'string' ? payload.page_url.slice(0, 500) : null

  if (!isValidCategory(category)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  if (subject.length < 3 || subject.length > MAX_SUBJECT) {
    return NextResponse.json({ error: `Subject 3-${MAX_SUBJECT} characters` }, { status: 400 })
  }
  if (body.length < 4 || body.length > MAX_BODY) {
    return NextResponse.json({ error: `Detail 4-${MAX_BODY} characters` }, { status: 400 })
  }

  const cleanSubject = subject.replace(/—/g, ', ')
  const cleanBody = body.replace(/—/g, ', ')

  const admin = createAdminClient()
  const { data: ticket, error } = await admin.from('support_tickets').insert({
    coach_id: user.id,
    category,
    subject: cleanSubject,
    body: cleanBody,
    page_url: pageUrl,
  }).select('id').single()

  if (error || !ticket) {
    console.error('support_tickets insert failed:', error)
    return NextResponse.json({ error: 'Failed to save ticket' }, { status: 500 })
  }

  // Notify Kade only when the ticket is filed by someone other than him.
  // Kade filing his own ticket already sees it in /dashboard/support and
  // does not need self-email noise. Silent failure is OK — the row is safe.
  if (!isCoachEmail(user.email)) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]
      const accent = category === 'urgent' ? 'red' : category === 'bug' ? 'amber' : 'teal'
      await resend.emails.send({
        from: fromBrand(),
        to: coach().email,
        subject: `[Support - ${label}] ${cleanSubject}`,
        html: buildCoachNotificationEmail({
          eyebrow: `Support - ${label}`,
          heading: `${user.email ?? 'A coach'} filed a support ticket`,
          body: [
            `<strong>${escapeHtml(cleanSubject)}</strong>`,
            escapeHtml(cleanBody).replace(/\n/g, '<br/>'),
          ],
          details: [
            `Category: ${label}`,
            `Filed by: ${escapeHtml(user.email ?? 'unknown')}`,
            pageUrl ? `On page: ${escapeHtml(pageUrl)}` : 'On page: (not captured)',
          ],
          ctaLabel: 'Open ticket',
          ctaUrl: `${appUrl()}/dashboard/support/${ticket.id}`,
          accent,
        }),
      })
    } catch (e) {
      console.error('Support ticket notify failed:', e)
    }
  }

  return NextResponse.json({ ok: true, id: ticket.id })
}

// List the caller's own tickets. Kade separately fetches all tickets from the
// admin inbox page (server component, admin client) — this route is coach-scoped.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('support_tickets')
    .select('id, category, subject, status, status_note, page_url, created_at, updated_at, resolved_at')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('support_tickets list failed:', error)
    return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 })
  }
  return NextResponse.json({ tickets: data ?? [] })
}
