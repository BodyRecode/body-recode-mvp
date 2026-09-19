import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ProductTier } from '@/lib/product-tier'

/** The three tiers, listed here because product-tier.ts exports the type but no runtime list. Fail-closed: anything unrecognised becomes the lowest. */
const TIERS: ProductTier[] = ['interpret', 'coach', 'owner']

/**
 * Accepting a coach invitation: the invited person sets their own password and
 * their account is created.
 *
 * GET  ?token=...  what the invitation is for, so the page can greet them and
 *                  refuse early if the link is dead. Returns the name, the
 *                  business and nothing else: never the email address, never
 *                  the tier, because this route answers to anyone holding the
 *                  token and a wrong token should leak nothing.
 * POST             { token, password } creates the account.
 *
 * Deliberately NOT reusing /api/coach/signup: that route requires a signed-in
 * coach or the admin secret, which is exactly the by-hand step this replaces.
 * The invitation IS the authorisation here, and it is checked on every call.
 */

interface InvitationRow {
  id: string
  email: string
  full_name: string
  business_name: string
  product_tier: string
  status: string
  expires_at: string
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
}

/** One place for every reason a token is not usable, so the page and the POST agree. */
function invitationProblem(inv: InvitationRow | null): string | null {
  if (!inv) return 'This invitation link is not valid.'
  if (inv.status === 'accepted') return 'This invitation has already been used. Sign in instead, or ask for a new one.'
  if (inv.status === 'revoked') return 'This invitation was cancelled. Ask for a new one.'
  if (new Date(inv.expires_at).getTime() < Date.now()) return 'This invitation has expired. Ask for a new one.'
  if (inv.status !== 'pending') return 'This invitation is no longer valid.'
  return null
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('coach_invitations')
    .select('id, email, full_name, business_name, product_tier, status, expires_at')
    .eq('token', token)
    .maybeSingle()

  const problem = invitationProblem(data as InvitationRow | null)
  if (problem) return NextResponse.json({ ok: false, problem }, { status: 200 })

  const inv = data as InvitationRow
  return NextResponse.json({
    ok: true,
    fullName: inv.full_name,
    businessName: inv.business_name,
  })
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const token = String(body.token ?? '')
  const password = String(body.password ?? '')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  if (password.length < 10) {
    // Ten rather than the eight the old provisioning route allowed. This
    // account can read other people's health information.
    return NextResponse.json({ error: 'Choose a password of at least 10 characters.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('coach_invitations')
    .select('id, email, full_name, business_name, product_tier, status, expires_at')
    .eq('token', token)
    .maybeSingle()

  const problem = invitationProblem(data as InvitationRow | null)
  if (problem) return NextResponse.json({ error: problem }, { status: 400 })
  const inv = data as InvitationRow

  const tenantId = slugify(inv.business_name)
  if (!tenantId || tenantId === 'body-recode') {
    return NextResponse.json({ error: 'That business name cannot be used. Reply to the invitation and it will be fixed.' }, { status: 409 })
  }

  const { data: takenTenant } = await admin
    .from('tenant_config')
    .select('coach_id')
    .eq('licence->>tenantId', tenantId)
    .maybeSingle()
  if (takenTenant) {
    return NextResponse.json({ error: 'That business name is already set up on the platform. Reply to the invitation.' }, { status: 409 })
  }

  const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
    email: inv.email,
    password,
    email_confirm: true,
    user_metadata: { fullName: inv.full_name, businessName: inv.business_name, signup_source: 'coach_invitation' },
  })
  if (userErr || !userRes.user) {
    const already = userErr?.message?.includes('already registered')
    return NextResponse.json(
      { error: already ? 'There is already an account on this email address. Sign in instead.' : 'Could not create the account.' },
      { status: already ? 409 : 500 },
    )
  }
  const coachId = userRes.user.id
  const firstName = inv.full_name.split(/\s+/)[0]
  const tier = (TIERS.includes(inv.product_tier as ProductTier) ? inv.product_tier : 'interpret') as ProductTier

  const { error: tenantErr } = await admin.from('tenant_config').insert({
    coach_id: coachId,
    product_tier: tier,
    brand: {
      name: inv.business_name,
      nameWithMark: inv.business_name,
      tagline: 'Coaching platform',
      logoUrlLight: '/logo-black.png',
      logoUrlDark: '/logo-white.png',
      supportEmail: inv.email,
      replyToEmail: inv.email,
      fromEmail: inv.email,
      accentColor: '#1B6DFC',
    },
    coach: {
      firstName,
      fullName: inv.full_name,
      email: inv.email,
      adminEmail: inv.email,
      photoUrl: '',
      location: '',
      credentials: '',
      instagramHandle: '',
      personalInstagramHandle: '',
      whatsAppNumber: '',
    },
    licence: { tenantId, poweredBy: true, version: new Date().toISOString().slice(0, 10) },
    modality: { id: 'strength', label: 'Strength', doctrineMode: 'A' },
  })

  if (tenantErr) {
    // The account must not exist without its configuration, or the coach signs
    // in to a platform that cannot tell who they are.
    await admin.auth.admin.deleteUser(coachId).catch(() => {})
    console.error('[coach-invite-accept] tenant_config failed:', tenantErr.message)
    return NextResponse.json({ error: 'Could not finish setting up the account. Nothing was created; please try again.' }, { status: 500 })
  }

  // Spent. Marked only after everything else succeeded, so a failure halfway
  // leaves a link that still works rather than a person locked out.
  await admin
    .from('coach_invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString(), coach_id: coachId, tenant_id: tenantId })
    .eq('id', inv.id)

  return NextResponse.json({ ok: true, email: inv.email })
}
