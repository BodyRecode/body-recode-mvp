import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoachOrAdminSecret } from '@/lib/api-auth'

/**
 * POST /api/coach/signup
 * Provisions a new coach:
 *   1. Creates auth.users row (email_confirm=true for now — no email verification flow yet)
 *   2. Inserts tenant_config row with sensible defaults from the signup payload
 *   3. Returns { tenantId, coachId, email }
 *
 * Payload:
 *   {
 *     email: string,
 *     password: string,
 *     fullName: string,
 *     businessName: string,
 *     tenantId?: string,        // optional slug; auto-derived from businessName if missing
 *     modality?: 'strength' | 'yoga'
 *   }
 *
 * Safety:
 *   - Requires a signed-in coach or ADMIN_SECRET (added 2026-08-06, Security
 *     Sweep Phase 1). This was an open endpoint, which meant anyone could mint
 *     an auth.users row and a tenant_config row on demand — free account
 *     creation against the same database that holds client health records.
 *     Collective Partners are onboarded by hand today, so nothing legitimate
 *     called this without Kade present.
 *   - Rejects if tenantId already exists in tenant_config
 *   - Rejects if email already registered (auth.admin.createUser will fail)
 *   - Uses service role admin client — signup is a controlled provisioning
 *     step, not user-triggered from an authenticated session
 */

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export async function POST(req: NextRequest) {
  const gate = await requireCoachOrAdminSecret(req)
  if (!gate.ok) return gate.response

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const email = (body.email as string | undefined)?.trim().toLowerCase()
  const password = body.password as string | undefined
  const fullName = (body.fullName as string | undefined)?.trim()
  const businessName = (body.businessName as string | undefined)?.trim()
  const requestedTenantId = (body.tenantId as string | undefined)?.trim()
  const modality = (body.modality as string | undefined) === 'yoga' ? 'yoga' : 'strength'

  if (!email || !password || !fullName || !businessName) {
    return NextResponse.json(
      { error: 'email, password, fullName, businessName all required' },
      { status: 400 }
    )
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'password must be at least 8 characters' }, { status: 400 })
  }

  const tenantId = requestedTenantId ? slugify(requestedTenantId) : slugify(businessName)
  if (!tenantId) {
    return NextResponse.json({ error: 'businessName must contain letters or numbers' }, { status: 400 })
  }
  if (tenantId === 'body-recode') {
    return NextResponse.json({ error: 'tenantId "body-recode" is reserved' }, { status: 409 })
  }

  const admin = createAdminClient()

  // Reject if tenantId already taken
  const { data: existingTenant } = await admin
    .from('tenant_config')
    .select('coach_id')
    .eq('licence->>tenantId', tenantId)
    .maybeSingle()
  if (existingTenant) {
    return NextResponse.json({ error: `tenantId "${tenantId}" already in use` }, { status: 409 })
  }

  // Create auth user
  const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { fullName, businessName, signup_source: 'coach_signup_v1' },
  })
  if (userErr || !userRes.user) {
    return NextResponse.json(
      { error: userErr?.message ?? 'failed to create user' },
      { status: userErr?.message?.includes('already registered') ? 409 : 500 }
    )
  }

  const coachId = userRes.user.id
  const firstName = fullName.split(/\s+/)[0]

  // Insert tenant_config row with sensible defaults
  const { error: insertErr } = await admin.from('tenant_config').insert({
    coach_id: coachId,
    brand: {
      name: businessName,
      nameWithMark: businessName,
      tagline: 'Coaching platform',
      logoUrlLight: '/logo-black.png',
      logoUrlDark: '/logo-white.png',
      apexDomain: `${tenantId}.example.com`,
      marketingDomain: `https://${tenantId}.example.com`,
      performanceDomain: `https://${tenantId}.example.com`,
      appDomain: `https://${tenantId}.example.com`,
      supportEmail: email,
      replyToEmail: email,
      fromEmail: email,
      accentColor: '#1B6DFC',
    },
    coach: {
      firstName,
      fullName,
      email,
      adminEmail: email,
      photoUrl: '',
      location: '',
      credentials: '',
      instagramHandle: '',
      personalInstagramHandle: '',
      whatsAppNumber: '',
    },
    products: {
      scorecardName: 'Readiness Scorecard',
      reportProductName: 'Body Decode Report',
      reportPrice: 37,
      challengeName: '14-Day Body Decode Challenge',
      challengePrice: 0,
      blueprintName: '6-Week Body Rewire Blueprint',
      blueprintPrice: 97,
      membershipName: `${businessName} Membership`,
      membershipPrice: 49,
      coachingPackage2xPrice: 297,
      coachingPackagePriceLabel: '$297 Foundational Read',
    },
    licence: {
      tenantId,
      poweredBy: true,
      version: new Date().toISOString().slice(0, 10),
    },
    modality: {
      id: modality,
      label: modality.charAt(0).toUpperCase() + modality.slice(1),
      doctrineMode: 'A',
    },
  })

  if (insertErr) {
    // Rollback auth user on tenant_config failure
    await admin.auth.admin.deleteUser(coachId).catch(() => {})
    return NextResponse.json({ error: `tenant_config insert failed: ${insertErr.message}` }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    tenantId,
    coachId,
    email,
    nextStep: 'Complete /dashboard/settings/tenant to configure your brand, then set NEXT_PUBLIC_TENANT_DB_ENABLED=true on your Vercel project.',
  })
}
