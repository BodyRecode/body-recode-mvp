/**
 * Resend delivery webhook.
 *
 * WHY THIS EXISTS. `resend.emails.send()` resolves when Resend ACCEPTS the
 * message, not when it arrives. So every send in this platform has reported
 * success since the day it was written, including the ones that bounced. Two
 * clients have now been found out by asking them: Shelley Elley's portal email
 * in June, and Kimberly Hamilton's scorecard result on 16 Sep 2026, which went
 * to her Live.com junk folder.
 *
 * WHAT IT CAN AND CANNOT SEE. Bounced, complained and delayed are reportable
 * and land here. **Junk is not.** No provider tells a sender their mail was
 * filed as spam, so this will never explain a junking on its own. What it does
 * is remove the far worse case: mail that never arrived at all, silently.
 *
 * SIGNATURE. Resend signs with Svix headers. Verified here by hand rather than
 * adding the svix package for one route: HMAC-SHA256 over
 * `${svix-id}.${svix-timestamp}.${body}` with the base64 secret after `whsec_`,
 * compared in constant time, with a five-minute timestamp window against
 * replay. An unsigned or misconfigured request is refused, because a public
 * endpoint that writes to the database on trust is worse than no endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { fromBrand } from '@/lib/email-shell'
import { coach } from '@/config/tenant'
import { appUrl } from '@/lib/app-url'

/** Events worth a row. Opens and clicks are deliberately not stored: they are
 *  noisy, they are inflated by scanners, and nobody is going to act on them. */
const KEPT = new Set(['email.delivered', 'email.bounced', 'email.complained', 'email.delivery_delayed', 'email.failed'])

/** The ones that mean a person did not hear from us. */
const BAD = new Set(['email.bounced', 'email.complained', 'email.failed'])

const TOLERANCE_SECONDS = 5 * 60

/** Exported for scripts/test-resend-webhook.ts. */
export function verifySvixSignature(secret: string, id: string, timestamp: string, body: string, header: string): boolean {
  const seconds = Number(timestamp)
  if (!Number.isFinite(seconds)) return false
  if (Math.abs(Date.now() / 1000 - seconds) > TOLERANCE_SECONDS) return false

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const expected = crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64')
  // The header carries one or more space-separated `v1,<signature>` pairs, so
  // a rotating secret keeps working through the overlap.
  for (const part of header.split(' ')) {
    const [version, signature] = part.split(',')
    if (version !== 'v1' || !signature) continue
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true
  }
  return false
}

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error('[resend-webhook] RESEND_WEBHOOK_SECRET not set; refusing')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await request.text()
  const id = request.headers.get('svix-id') ?? ''
  const timestamp = request.headers.get('svix-timestamp') ?? ''
  const signature = request.headers.get('svix-signature') ?? ''
  if (!id || !timestamp || !signature || !verifySvixSignature(secret, id, timestamp, body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: { type?: string; created_at?: string; data?: Record<string, unknown> }
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const type = String(event.type ?? '')
  // 200 on everything we do not store, so Resend stops retrying it.
  if (!KEPT.has(type)) return NextResponse.json({ ok: true, ignored: type })

  const data = (event.data ?? {}) as Record<string, unknown>
  const to = Array.isArray(data.to) ? String(data.to[0] ?? '') : String(data.to ?? '')
  const admin = createAdminClient()

  // Put a name to the address where we can, so the coach reads "Kim" not an
  // address. Both lookups are best effort: a bounce from an address we no
  // longer hold is still worth recording.
  const address = to.toLowerCase()
  const [{ data: client }, { data: lead }] = await Promise.all([
    admin.from('clients').select('id').ilike('email', address).maybeSingle(),
    admin.from('leads').select('id').ilike('email', address).maybeSingle(),
  ])

  const bounce = (data.bounce ?? {}) as Record<string, unknown>
  const detail = [bounce.type, bounce.subType, bounce.message, data.reason]
    .filter(Boolean).map(String).join(' · ') || null

  const { error } = await admin.from('email_delivery_events').insert({
    resend_email_id: (data.email_id as string) ?? null,
    event_type: type.replace(/^email\./, ''),
    to_address: to || null,
    subject: (data.subject as string) ?? null,
    client_id: client?.id ?? null,
    lead_id: lead?.id ?? null,
    detail,
    payload: event as unknown as Record<string, unknown>,
    occurred_at: event.created_at ? new Date(event.created_at).toISOString() : new Date().toISOString(),
  })

  // A duplicate is Resend retrying a delivery it never got a 200 for. Not an
  // error, and it must still answer 200 or the retries never stop.
  if (error && !String(error.message).includes('duplicate key')) {
    console.error('[resend-webhook] insert failed:', error.message)
    return NextResponse.json({ error: 'Could not record event' }, { status: 500 })
  }

  if (BAD.has(type)) {
    console.error(`[resend-webhook] ${type} for ${to}${detail ? `: ${detail}` : ''}`)
    // Tell the coach now. A bounce found a week later is a client who has been
    // waiting a week. Delays are left out on purpose: most clear themselves,
    // and an alert that cries wolf gets filtered, which is how this started.
    if (process.env.RESEND_API_KEY) {
      const who = client?.id
        ? `${appUrl()}/dashboard/clients/${client.id}`
        : lead?.id ? `${appUrl()}/dashboard/leads/${lead.id}` : null
      const label = type === 'email.complained' ? 'reported as spam' : type === 'email.failed' ? 'failed to send' : 'bounced'
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: fromBrand(),
        to: coach().adminEmail ?? coach().email,
        subject: `[ALERT] Email ${label}: ${to}`,
        html: `<p>An email ${label} and did not reach them.</p>
<p><strong>To:</strong> ${to}<br/><strong>Subject:</strong> ${data.subject ?? 'unknown'}${detail ? `<br/><strong>Reason:</strong> ${detail}` : ''}</p>
${who ? `<p><a href="${who}">Open their record</a></p>` : '<p>No client or lead on file with that address.</p>'}
<p>${type === 'email.complained'
  ? 'A spam report means they marked it as junk. Do not email them again until you have spoken to them.'
  : 'Check the address is right. If it is, contact them another way.'}</p>`,
      }).catch(err => console.error('[resend-webhook] alert send failed:', err))
    }
  }

  return NextResponse.json({ ok: true })
}
