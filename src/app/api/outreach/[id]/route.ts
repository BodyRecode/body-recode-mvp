/**
 * Edit a drafted outreach touch, then re-render the branded email.
 *
 * Coach edits the subject and/or the plain body paragraphs in the approval
 * queue; this saves them and rebuilds body_html through the same shell the
 * draft used, so the approved send always matches what Kade sees.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assembleTouchHtml } from '@/lib/booking-agent/assemble-email'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const newSubject = typeof body.subject === 'string' ? body.subject.trim() : undefined
  const newBodyText = typeof body.body_text === 'string' ? body.body_text : undefined

  if (newSubject === undefined && newBodyText === undefined) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: touch } = await admin
    .from('outreach_touches')
    .select('id, lead_id, status, subject, body_text, booking_url, meta')
    .eq('id', id)
    .maybeSingle()

  if (!touch) return NextResponse.json({ error: 'Touch not found' }, { status: 404 })
  if (touch.status === 'sent' || touch.status === 'skipped') {
    return NextResponse.json({ error: `Cannot edit a ${touch.status} touch` }, { status: 409 })
  }

  const { data: lead } = await admin.from('leads').select('name').eq('id', touch.lead_id).maybeSingle()
  const firstName = (lead?.name || '').split(' ')[0] || 'there'

  const subject = newSubject ?? touch.subject ?? ''
  const bodyText = newBodyText ?? touch.body_text ?? ''
  const paragraphs = bodyText.split(/\n\s*\n/).map((p: string) => p.trim()).filter(Boolean)

  const meta = (touch.meta ?? {}) as { slots?: string[]; previewText?: string; ctaLabel?: string }
  const html = assembleTouchHtml({
    firstName,
    paragraphs,
    ctaLabel: meta.ctaLabel || 'Book your free call',
    ctaUrl: touch.booking_url || '',
    previewText: meta.previewText,
    slots: meta.slots,
  })

  await admin
    .from('outreach_touches')
    .update({ subject, body_text: bodyText, body_html: html, edited: true, updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
