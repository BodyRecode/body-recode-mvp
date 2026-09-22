import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { productTierForScope } from '@/lib/coach-tier'
import { requireCoachScope } from '@/lib/coach-scope'
import { PageHeader, PageBody, SectionHead } from '@/components/dashboard/ui'
import { BRAND } from '@/lib/brand-tokens'
import AccountActions from './account-actions'

export const metadata = { title: 'Settings' }
export const dynamic = 'force-dynamic'

/**
 * Settings, for a coach on the interpretation product.
 *
 * 22 September 2026. What was here was four links, and a pilot coach could see
 * all four: tenant configuration (white-label, not their product), THE BUILD
 * BOARD, and two buildout histories. The descriptions alone named the read,
 * the coaching engine, Strenn and the Performance Coaching roadmap.
 *
 * THE LINKS WERE TIER-GATED AND THAT WAS NOT ENOUGH. Clicking them bounced, so
 * nothing leaked in the sense of data. What leaked was the ROADMAP, in the
 * titles and descriptions, on a page every pilot coach can open. An
 * `isKade` check hid three admin items below and missed the four above it,
 * which is the trouble with hiding things one at a time.
 *
 * So the page shows the owner's items only at owner tier, and for everybody
 * else it is what Settings should be: THEIR OWN ACCOUNT. That is a short page,
 * and it being short is correct rather than a gap: the pilot has no branding,
 * no payments, no domain and no prescription to tune.
 */
export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const scope = await requireCoachScope()
  const tier = await productTierForScope(admin, scope)
  const isOwner = tier === 'owner'
  const isKade = isCoachEmail(user.email) && user.email === 'kade.dunstone@gmail.com'

  // The invitation writes these when a coach accepts. A coach created any
  // other way (a script, a hand-made account) has neither, so the business
  // falls back to the tenant row, which is written either way.
  const meta = (user.user_metadata ?? {}) as { fullName?: string; businessName?: string }
  const { data: tenantRow } = await admin
    .from('tenant_config').select('name').eq('coach_id', user.id).maybeSingle()
  const name = meta.fullName || 'Not set'
  const business = meta.businessName || (tenantRow?.name as string | undefined) || 'Not set'

  const ownerLinks = [
    { href: '/dashboard/settings/tenant', title: 'Tenant configuration', description: 'Brand shell, coach identity, product wrapping, custom domains and Stripe Connect.' },
    { href: '/dashboard/build', title: 'Build', description: 'The single build order. What is done and what happens next, in sequence.' },
    { href: '/dashboard/settings/platform-buildout', title: 'Body Recode buildout (history)', description: 'Phase by phase, with commit history.' },
    { href: '/dashboard/settings/coaching-buildout', title: 'Performance Coaching buildout (history)', description: 'The coaching engine and the parked plumbing, with history.' },
    ...(isKade ? [
      { href: '/dashboard/settings/tenants', title: 'Tenant registry (admin)', description: 'Every tenant on the platform.' },
      { href: '/dashboard/settings/partner-billing', title: 'Partner billing (admin)', description: 'What each partner owes and has paid.' },
      { href: '/dashboard/settings/tenants-health', title: 'Tenants health (admin)', description: 'Whether each tenant is configured and working.' },
    ] : []),
  ]

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div className="py-4 border-b" style={{ borderColor: BRAND.darkLineSoft }}>
      <div className="text-[11px] font-bold uppercase" style={{ letterSpacing: '0.17em', color: BRAND.darkInkFaint }}>{label}</div>
      <div className="text-[16px] font-semibold tracking-[-0.02em] mt-1.5" style={{ color: BRAND.darkInk }}>{value}</div>
    </div>
  )

  return (
    <PageBody>
      <PageHeader
        eyebrow="Settings"
        title="Your account"
        subtitle={isOwner
          ? 'Your sign-in details, plus the platform pages that are yours.'
          : 'Your sign-in details. There is nothing else to configure: the pilot runs on Body Recode, so there is no branding, no payments and no domain to wire.'}
      />

      <SectionHead title="You" />
      <Field label="Name" value={name} />
      <Field label="Business" value={business} />
      <Field label="Signs in with" value={user.email ?? '—'} />

      <div className="py-5 border-b" style={{ borderColor: BRAND.darkLineSoft }}>
        <div className="text-[11px] font-bold uppercase mb-2" style={{ letterSpacing: '0.17em', color: BRAND.darkInkFaint }}>Password</div>
        <AccountActions email={user.email ?? ''} />
      </div>

      <div className="py-5 border-b" style={{ borderColor: BRAND.darkLineSoft }}>
        <div className="text-[11px] font-bold uppercase mb-2" style={{ letterSpacing: '0.17em', color: BRAND.darkInkFaint }}>Your agreement</div>
        <Link href="/dashboard/agreement" className="text-[13.5px] underline" style={{ color: BRAND.darkInkMuted }}>
          Read the agreement you accepted
        </Link>
      </div>

      {isOwner && (
        <>
          <SectionHead title="Platform" count={ownerLinks.length} />
          {ownerLinks.map(l => (
            <Link key={l.href} href={l.href}
              className="block py-4 border-b hover:bg-[#12151B] transition-colors px-2 -mx-2"
              style={{ borderColor: BRAND.darkLineSoft }}>
              <div className="text-[16px] font-semibold tracking-[-0.02em]" style={{ color: BRAND.darkInk }}>{l.title}</div>
              <p className="text-[13.5px] leading-[1.55] mt-1 max-w-[620px]" style={{ color: BRAND.darkInkMuted }}>{l.description}</p>
            </Link>
          ))}
        </>
      )}
    </PageBody>
  )
}
