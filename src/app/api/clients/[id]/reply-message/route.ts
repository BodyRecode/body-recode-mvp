import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { buildCoachReplyEmail } from '@/lib/coach-reply-email'
import { fromCoach, COACH_BCC } from '@/lib/email-shell'
import { portalUrl } from '@/lib/app-url'
import { smsNotifyClientOfCoachReply } from '@/lib/message-notifications'
import { messageReplyAddress } from '@/lib/message-reply-address'
import { coach } from '@/config/tenant'

/**
 * Coach replies to a client from the dashboard.
 *
 * Writes the reply into client_messages as sender='coach', marks any
 * outstanding client messages as read + responded, and emails the client with
 * the reply in full plus a link back to the portal thread.
 *
 * The email carries the reply body deliberately: the client should not have to
 * log in to read an answer. The portal is where the conversation lives; the
 * email is the nudge that brings them back to it.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { body } = await req.json().catch(() => ({}))
  if (!body || typeof body !== 'string' || !body.trim()) {
    return NextResponse.json({ error: 'Message is empty' }, { status: 400 })
  }
  if (body.length > 5000) {
    return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, phone, onboarding_token')
    .eq('id', clientId)
    .maybeSingle()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Em dashes are a house style rule and this lands in the client's inbox.
  const cleaned = body.trim().replace(/—/g, ', ')

  // The most recent unanswered client message, used to quote context in the
  // email, to close off the outstanding items in the coach inbox, and to
  // inherit the anchor so a reply about the nutrition plan stays filed under
  // the nutrition plan rather than becoming a loose general message.
  const { data: pending } = await admin
    .from('client_messages')
    .select('id, body, anchor_kind, anchor_id, anchor_label')
    .eq('client_id', clientId)
    .eq('sender', 'client')
    .is('responded_at', null)
    .order('created_at', { ascending: false })

  const answering = pending?.[0] ?? null
  const inheritedAnchor = answering?.anchor_kind
    ? {
        anchor_kind: answering.anchor_kind,
        anchor_id: answering.anchor_id ?? null,
        anchor_label: answering.anchor_label ?? null,
      }
    : {}

  const { data: inserted, error: insertErr } = await admin
    .from('client_messages')
    .insert({
      client_id: clientId,
      body: cleaned,
      sender: 'coach',
      sent_by: user.id,
      read_at: new Date().toISOString(), // a coach's own message is never unread to them
      ...inheritedAnchor,
    })
    .select('id, created_at')
    .maybeSingle()

  if (insertErr) {
    console.error('[reply-message] insert failed:', insertErr)
    return NextResponse.json({ error: 'Could not save reply' }, { status: 500 })
  }

  // Stamp the outstanding client messages as read and responded. This is an
  // audit trail of what was on screen when the coach answered — it is NOT what
  // drives the inbox queue. The queue keys off whether the client wrote last,
  // so a client who follows up reopens the conversation automatically and a
  // question cannot be silently closed by a reply that did not address it.
  const pendingIds = (pending ?? []).map(m => m.id)
  if (pendingIds.length > 0) {
    const now = new Date().toISOString()
    await admin
      .from('client_messages')
      .update({ responded_at: now, read_at: now })
      .in('id', pendingIds)
  }

  // Notify the client. Best-effort: the reply is saved either way, and it is
  // visible in their portal even if the email fails.
  let emailed = false
  if (process.env.RESEND_API_KEY && client.email && client.onboarding_token) {
    const threadUrl = `${portalUrl(client.onboarding_token)}/message`
    const { subject, html } = buildCoachReplyEmail({
      firstName: client.name?.split(' ')[0] ?? 'there',
      coachFirstName: coach().firstName,
      replyBody: cleaned,
      inReplyTo: answering?.body ?? null,
      threadUrl,
    })
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: fromCoach(),
        to: client.email,
        bcc: COACH_BCC,
        // Addressed reply-to: a client who answers from their inbox lands in
        // their portal thread instead of Kade's personal email.
        replyTo: messageReplyAddress(client.onboarding_token),
        subject,
        html,
      })
      emailed = true
    } catch (e) {
      console.error('[reply-message] notification email failed:', e)
    }
  }

  // Log the send so it threads into the client's Communications panel.
  if (emailed) {
    await admin.from('client_communications').insert({
      client_id: clientId,
      kind: 'coach_message_reply',
      channel: 'email',
      subject: `${coach().firstName} replied to your message`,
      to_address: client.email,
      sent_by: user.id,
      meta: { message_id: inserted?.id ?? null, answered: pendingIds.length },
    })
  }

  // Text the client that a reply is waiting. The email carries the answer;
  // this is the nudge, because an email is easy to miss and the point of
  // moving contact into the portal was that replies should feel immediate.
  // One-way sender, so the copy never invites a reply — the link is the action.
  let texted = false
  if (client.onboarding_token) {
    texted = await smsNotifyClientOfCoachReply({
      phone: client.phone ?? null,
      firstName: client.name?.split(' ')[0] ?? 'there',
      threadUrl: `${portalUrl(client.onboarding_token)}/message`,
      isReply: !!answering,
    })
    if (texted) {
      await admin.from('client_communications').insert({
        client_id: clientId,
        kind: 'coach_message_reply_sms',
        channel: 'sms',
        subject: answering
          ? `${coach().firstName} replied to your message`
          : `A message from ${coach().firstName}`,
        to_address: client.phone,
        sent_by: user.id,
        meta: { message_id: inserted?.id ?? null },
      })
    }
  }

  return NextResponse.json({ success: true, emailed, texted, answered: pendingIds.length })
}
