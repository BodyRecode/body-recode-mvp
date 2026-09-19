import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoach } from '@/lib/api-auth'
import { buildCoachInviteEmail } from '@/lib/coach-invite-email'
import { fromCoach, COACH_BCC } from '@/lib/email-shell'
import { appUrl } from '@/lib/app-url'
import { coach as coachConfig } from '@/config/tenant'

/**
 * Coach invitations.
 *
 * POST   create one and email it
 * GET    list them, newest first
 * DELETE revoke one that has not been accepted
 *
 * WHY (19 September 2026): the only way to add a coach was for Kade to sign in,
 * open the provisioning form and type somebody else's password. That is fine
 * for two people and impossible for a pilot of ten to twenty, and it means no
 * coach ever sets their own credentials.
 *
 * An invitation creates nothing. It is a permission to create an account, it
 * expires, and it is spent the moment it is used. The account itself is made on
 * the acceptance route, by the person who received it.
 */

const EXPIRES_IN_DAYS = 14

export async function POST(req: NextRequest) {
  const gate = await requireCoach()
  if (!gate.ok) return gate.response

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  const fullName = String(body.fullName ?? '').trim()
  const businessName = String(body.businessName ?? '').trim()
  const note = body.note ? String(body.note).trim() : null
  const productTier = String(body.productTier ?? 'interpret').trim()

  if (!email || !email.includes('@')) return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
  if (!fullName) return NextResponse.json({ error: 'Their name is required' }, { status: 400 })
  if (!businessName) return NextResponse.json({ error: 'Their business name is required' }, { status: 400 })
  if (!['interpret', 'coach', 'owner'].includes(productTier)) {
    return NextResponse.json({ error: 'Unknown product tier' }, { status: 400 })
  }

  const admin = createAdminClient()

  // One live invitation per email. Re-inviting someone replaces the old link
  // rather than leaving two valid ones, because two working links to the same
  // account is a support problem nobody can debug later.
  const { data: existing } = await admin
    .from('coach_invitations')
    .select('id, status')
    .eq('email', email)
    .eq('status', 'pending')
  if (existing && existing.length > 0) {
    await admin
      .from('coach_invitations')
      .update({ status: 'revoked', revoked_at: new Date().toISOString() })
      .in('id', existing.map(r => r.id))
  }

  const token = randomBytes(24).toString('base64url')
  const expiresAt = new Date(Date.now() + EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: invitation, error } = await admin
    .from('coach_invitations')
    .insert({
      email,
      full_name: fullName,
      business_name: businessName,
      product_tier: productTier,
      token,
      note,
      invited_by: gate.userId,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error || !invitation) {
    console.error('[coach-invitations] create failed:', error?.message)
    return NextResponse.json({ error: 'Could not create the invitation' }, { status: 500 })
  }

  const acceptUrl = `${appUrl()}/coach-invite/${token}`
  const { subject, html } = buildCoachInviteEmail({
    fullName,
    businessName,
    acceptUrl,
    invitedByName: coachConfig().fullName,
    expiresInDays: EXPIRES_IN_DAYS,
  })

  // The invitation row is the record. If the email fails the row still stands
  // and the link still works, so it can be resent or read out over the phone
  // rather than the whole thing having to be done again.
  let emailed = true
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: sendError } = await resend.emails.send({
      from: fromCoach(),
      to: email,
      bcc: COACH_BCC,
      subject,
      html,
    })
    if (sendError) {
      emailed = false
      console.error('[coach-invitations] email failed:', sendError)
    }
  } catch (err) {
    emailed = false
    console.error('[coach-invitations] email threw:', err)
  }

  return NextResponse.json({ ok: true, emailed, invitation: { id: invitation.id, email, acceptUrl, expiresAt } })
}

export async function GET() {
  const gate = await requireCoach()
  if (!gate.ok) return gate.response

  const admin = createAdminClient()
  const { data } = await admin
    .from('coach_invitations')
    .select('id, email, full_name, business_name, product_tier, status, note, expires_at, accepted_at, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  // An invitation past its date is expired whatever the column says, so the
  // list never shows a dead link as pending.
  const now = Date.now()
  const rows = (data ?? []).map(r => ({
    ...r,
    status: r.status === 'pending' && new Date(r.expires_at as string).getTime() < now ? 'expired' : r.status,
  }))
  return NextResponse.json({ invitations: rows })
}

export async function DELETE(req: NextRequest) {
  const gate = await requireCoach()
  if (!gate.ok) return gate.response

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('coach_invitations')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) return NextResponse.json({ error: 'Could not revoke it' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
