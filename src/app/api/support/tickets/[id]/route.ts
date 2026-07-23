import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isCoachEmail } from '@/lib/coach-auth'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { appUrl } from '@/lib/app-url'
import { fromBrand, COACH_BCC } from '@/lib/email-shell'
import { CATEGORY_LABELS, STATUS_LABELS, isValidStatus, escapeHtml, type SupportCategory } from '@/lib/support-tickets'

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail(user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const payload = await request.json().catch(() => ({}))
  const status = typeof payload.status === 'string' ? payload.status : ''
  const note = typeof payload.status_note === 'string' ? payload.status_note.trim() : ''
  const notify = payload.notify !== false

  if (!isValidStatus(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  if (note.length > 2000) return NextResponse.json({ error: 'Note too long (max 2000)' }, { status: 400 })

  const admin = createAdminClient()
  const patch: Record<string, unknown> = {
    status,
    status_note: note.length > 0 ? note.replace(/—/g, ', ') : null,
  }
  if (status === 'fixed' || status === 'wont-fix') patch.resolved_at = new Date().toISOString()
  else patch.resolved_at = null

  const { data: ticket, error } = await admin
    .from('support_tickets')
    .update(patch)
    .eq('id', id)
    .select('id, coach_id, category, subject, body, page_url, status, status_note')
    .single()

  if (error || !ticket) {
    console.error('support_tickets patch failed:', error)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }

  // Look up the filer's email so we can notify them.
  const { data: filer } = await admin.auth.admin.getUserById(ticket.coach_id as string)
  const filerEmail = filer?.user?.email ?? null

  if (notify && filerEmail && !isCoachEmail(filerEmail)) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const catLabel = CATEGORY_LABELS[ticket.category as SupportCategory]
      const statusLabel = STATUS_LABELS[status]
      const accent = status === 'fixed' ? 'teal' : status === 'wont-fix' ? 'amber' : 'teal'
      await resend.emails.send({
        from: fromBrand(),
        to: filerEmail,
        bcc: COACH_BCC,
        subject: `[Support] ${ticket.subject} - ${statusLabel}`,
        html: buildCoachNotificationEmail({
          eyebrow: `Support - ${statusLabel}`,
          heading: `Update on your ticket: ${ticket.subject}`,
          body: [
            `Kade set your <strong>${escapeHtml(catLabel)}</strong> ticket to <strong>${escapeHtml(statusLabel)}</strong>.`,
            ticket.status_note ? `<em>Note from Kade:</em><br/>${escapeHtml(ticket.status_note as string).replace(/\n/g, '<br/>')}` : 'No note attached.',
          ],
          ctaLabel: 'Open the Support tray',
          ctaUrl: `${appUrl()}/dashboard`,
          accent,
        }),
      })
    } catch (e) {
      console.error('Support ticket status-change notify failed:', e)
    }
  }

  return NextResponse.json({ ok: true })
}
