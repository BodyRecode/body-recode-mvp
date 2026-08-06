import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { fromBrand } from '@/lib/email-shell'
import { coach } from '@/config/tenant'
import { sendSms, formatPhone } from '@/lib/twilio'
import { isWithinCoachSmsWindow } from '@/lib/collective-ready-coach-sms'
import { appUrlFor } from '@/lib/app-url'
import { parseMessageReplyToken } from '@/lib/message-reply-address'
import { smsNotifyCoachOfClientMessage } from '@/lib/message-notifications'

// Handles inbound email webhooks from Postmark (MX for replies.bodyrecode.au
// points at Postmark inbound). Replies to app-sent client emails land here.
//
// Behaviour (updated 2026-07-21):
//  1. If the sender is a known lead/client, log an `email_received` event so it
//     threads into Business → Inbox (existing behaviour).
//  2. ALWAYS forward the full reply to Kade's real inbox (coach().email) with
//     Reply-To set to the sender, so he can read + reply directly without opening
//     the dashboard. This also rescues replies from UNKNOWN senders, which were
//     previously discarded silently.
//  3. ALSO fire a window-gated SMS heads-up to Kade so a reply is never missed.
//
// Forward + SMS are best-effort and never block the 200 back to Postmark.

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function forwardToKade(opts: {
  senderName: string
  senderEmail: string
  subject: string
  htmlBody: string | null
  textBody: string
  leadId: string | null
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[inbox/inbound] RESEND_API_KEY missing — cannot forward reply')
    return
  }
  const resend = new Resend(apiKey)

  const who = opts.senderName ? `${esc(opts.senderName)} &lt;${esc(opts.senderEmail)}&gt;` : esc(opts.senderEmail)
  const messageHtml = opts.htmlBody
    ? `<div style="border:1px solid #E5E5E5;border-radius:12px;padding:16px 18px;background:#FAFAF9;">${opts.htmlBody}</div>`
    : `<pre style="white-space:pre-wrap;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#1A1A1A;margin:0;border:1px solid #E5E5E5;border-radius:12px;padding:16px 18px;background:#FAFAF9;">${esc(opts.textBody || '(no message body)')}</pre>`

  const footer = opts.leadId
    ? `<p style="margin:18px 0 0;font-size:12px;color:#6B6B6B;">Logged in your dashboard: <a href="${appUrlFor(`/dashboard/business/inbox/${opts.leadId}`)}" style="color:#1B6DFC;text-decoration:none;">Business → Inbox</a>. Reply to this email to answer ${esc(opts.senderName || opts.senderEmail)} directly.</p>`
    : `<p style="margin:18px 0 0;font-size:12px;color:#B45309;">⚠️ Not a saved lead or client — this reply was NOT threaded in the dashboard, it only reached you here. Reply to this email to answer them directly.</p>`

  await resend.emails.send({
    from: fromBrand(),
    to: coach().email,
    replyTo: opts.senderEmail,
    subject: `📨 Reply from ${opts.senderName || opts.senderEmail} — ${opts.subject}`,
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1A1A1A;max-width:640px;">
<p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#1B6DFC;">Reply received</p>
<p style="margin:0 0 2px;font-size:16px;font-weight:700;">${who}</p>
<p style="margin:0 0 16px;font-size:13px;color:#6B6B6B;">re: ${esc(opts.subject)}</p>
${messageHtml}
${footer}
</div>`,
  })
}

async function smsNotifyKade(senderLabel: string) {
  if (!isWithinCoachSmsWindow()) return // outside window — the forwarded email covers it
  const rawPhone = coach().whatsAppNumber?.trim()
  if (!rawPhone) return
  try {
    await sendSms({
      to: formatPhone(rawPhone),
      message: `📨 ${senderLabel} just replied to your email. Check your inbox.`,
    })
  } catch (err) {
    console.error('[inbox/inbound] SMS notify failed:', err instanceof Error ? err.message : err)
  }
}

/**
 * Postmark authenticates its inbound webhook with HTTP Basic credentials
 * embedded in the webhook URL you configure in its dashboard:
 *
 *   https://user:pass@app.bodyrecode.au/api/inbox/inbound
 *
 * Added 2026-08-06 (Security Sweep Phase 1). Before this the endpoint accepted
 * any POST from anyone, and every accepted payload is forwarded verbatim to
 * Kade's real inbox with Reply-To set by the caller, plus an SMS. So it was a
 * free relay for sending Kade convincing spoofed mail from anyone he coaches,
 * and a way to run up Twilio spend.
 *
 * Fails OPEN when INBOUND_WEBHOOK_USER/PASSWORD are unset, so setting the env
 * vars and updating the Postmark URL can happen in either order without
 * dropping client replies on the floor. Set them and this closes.
 */
function inboundWebhookAuthorised(request: NextRequest): boolean {
  const user = process.env.INBOUND_WEBHOOK_USER
  const password = process.env.INBOUND_WEBHOOK_PASSWORD
  if (!user || !password) {
    console.warn('[inbox/inbound] INBOUND_WEBHOOK_USER/PASSWORD unset — accepting unverified webhook')
    return true
  }

  const header = request.headers.get('authorization') ?? ''
  if (!header.startsWith('Basic ')) return false

  let decoded: string
  try {
    decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
  } catch {
    return false
  }

  const expected = `${user}:${password}`
  if (decoded.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < decoded.length; i++) {
    diff |= decoded.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

export async function POST(request: NextRequest) {
  if (!inboundWebhookAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json()

  // Postmark format: From, Subject, TextBody, HtmlBody, FromFull.Email/.Name
  // Resend format: from, subject, text, html
  const from: string = body.From ?? body.from ?? ''
  const subject: string = body.Subject ?? body.subject ?? '(no subject)'
  const textBody: string = body.TextBody ?? body.text ?? ''
  const htmlBody: string | null = body.HtmlBody ?? body.html ?? null

  const senderEmail: string =
    body.FromFull?.Email ??
    (() => {
      const m = from.match(/<(.+?)>/)
      return m ? m[1] : from.trim()
    })()

  const senderName: string =
    body.FromFull?.Name ??
    (() => {
      const m = from.match(/^\s*"?([^"<]+?)"?\s*</)
      return m ? m[1].trim() : ''
    })()

  if (!senderEmail) {
    return NextResponse.json({ error: 'No sender email' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 0. Is this a reply to a coach message? Those are sent with an addressed
  //    reply-to (reply+<portal token>@...) so we can file the answer on the
  //    right thread instead of only forwarding it to Kade's inbox, which used
  //    to split the conversation across two places.
  const replyToken = parseMessageReplyToken(
    body.OriginalRecipient,
    body.To,
    body.ToFull?.map?.((t: { Email?: string }) => t.Email).join(','),
    body.Cc,
  )

  if (replyToken) {
    // Postmark's StrippedTextReply is the message minus the quoted chain, which
    // is what belongs in a thread. Fall back to the raw body if absent.
    const replyText: string = (body.StrippedTextReply ?? textBody ?? '').trim()
    const { data: replyClient } = await admin
      .from('clients')
      .select('id, name, email')
      .eq('onboarding_token', replyToken)
      .maybeSingle()

    // Only file it when the sender actually owns that thread. Anyone can guess
    // an address; they cannot also control the From on a matching mailbox.
    const senderOwnsThread =
      replyClient && (replyClient.email ?? '').toLowerCase() === senderEmail.toLowerCase()

    if (replyClient && senderOwnsThread && replyText) {
      const { error: fileErr } = await admin.from('client_messages').insert({
        client_id: replyClient.id,
        body: replyText.slice(0, 5000).replace(/—/g, ', '),
        sender: 'client',
      })
      if (fileErr) {
        console.error('[inbox/inbound] could not file email reply as message:', fileErr)
      } else {
        console.log(`[inbox/inbound] filed email reply into portal thread for ${replyClient.name}`)
        // Still tell Kade, same as any other portal message.
        await smsNotifyCoachOfClientMessage(replyClient.name ?? 'A client')
        try {
          await forwardToKade({ senderName, senderEmail, subject, htmlBody, textBody, leadId: null })
        } catch (err) {
          console.error('[inbox/inbound] forward failed:', err instanceof Error ? err.message : err)
        }
        return NextResponse.json({ ok: true, filed: 'client_message' })
      }
    } else if (replyClient && !senderOwnsThread) {
      console.warn(
        `[inbox/inbound] reply token for ${replyClient.name} came from ${senderEmail}, not their address. Not filing.`
      )
    }
    // Anything that falls through here drops to the normal path below, so a
    // reply is never silently lost.
  }

  // Find the lead by email — take most recently created if multiple match
  const { data: leads } = await admin
    .from('leads')
    .select('id, coach_id')
    .ilike('email', senderEmail)
    .order('created_at', { ascending: false })
    .limit(1)

  let leadId: string | null = leads?.[0]?.id ?? null

  if (!leadId) {
    // Try clients table too
    const { data: clients } = await admin
      .from('clients')
      .select('lead_id, coach_id')
      .ilike('email', senderEmail)
      .order('created_at', { ascending: false })
      .limit(1)
    leadId = clients?.[0]?.lead_id ?? null
  }

  // 1. Log the reply against the contact's timeline (known senders only).
  if (leadId) {
    await admin.from('lead_events').insert({
      lead_id: leadId,
      type: 'email_received',
      subject,
      notes: textBody,
      sent_at: new Date().toISOString(),
    })
  } else {
    console.log(`Inbound email from unknown sender: ${senderEmail} — forwarding to inbox only`)
  }

  // 2 + 3. Forward to Kade's inbox + SMS heads-up. Best-effort; never block the webhook.
  try {
    await forwardToKade({ senderName, senderEmail, subject, htmlBody, textBody, leadId })
  } catch (err) {
    console.error('[inbox/inbound] forward failed:', err instanceof Error ? err.message : err)
  }
  await smsNotifyKade(senderName || senderEmail)

  return NextResponse.json({ ok: true })
}
