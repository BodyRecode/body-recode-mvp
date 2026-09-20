import { redirect } from 'next/navigation'
import { requireCoachScope } from '@/lib/coach-scope'
import { headers } from 'next/headers'
import LogoutButton from '@/components/LogoutButton'
import DashboardShell from './shell'
import CommandPalette from './command-palette'
import CommandKHint from './command-k-hint'
import GlobalCopilotBubble from '@/components/global-copilot-bubble'
import SupportLauncher from '@/components/support/support-launcher'
import { brand, productTier } from '@/config/tenant'
import { canAccess, tierForPath } from '@/lib/product-tier'
import { getNavBadges } from '@/lib/dashboard-badges'
import { agreementGateActive, hasAcceptedCurrent } from '@/lib/coach-agreement'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // A signed-in person is not the same as a coach. Until 17 Sep 2026 this
  // checked only that somebody was signed in, so any account could open the
  // dashboard. requireCoachScope sends anyone who is not a coach to the login
  // page, and hands back which clients this coach may see.
  const scope = await requireCoachScope()
  const user = { id: scope.coachId, email: scope.email }

  // Product tier gate. Every dashboard page renders through this layout, so one
  // check here covers all of them — including any page added later, which fails
  // closed until somebody classifies it.
  //
  // Hiding items in the nav is NOT this. That is presentation; someone can type
  // a URL. This is the enforcement, and the nav filter below merely stops the
  // tenant being shown doors that will not open.
  //
  // The pathname comes from middleware via x-pathname: a server component
  // cannot read it directly.
  const pathname = (await headers()).get('x-pathname') ?? '/dashboard'
  // The tier belongs to the PERSON signed in, not to the domain they signed in
  // on. Reading it from the tenant resolved by host handed every coach on
  // Kade's domain Kade's own tier, which is owner. See src/lib/coach-tier.ts.
  const { productTierForCoach } = await import('@/lib/coach-tier')
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const tier = await productTierForCoach(createAdminClient(), scope.coachId)
  if (!canAccess(tier, pathname)) {
    console.warn(
      `[tier] ${user.email} (tier=${tier}) blocked from ${pathname}, which needs ${tierForPath(pathname)}`
    )
    redirect('/dashboard/today')
  }

  // The agreement gate. A coach who has not accepted the agreement currently in
  // force sees the agreement and nothing else, the same way a client cannot get
  // past their own agreement in the portal.
  //
  // Switched OFF while the agreement is a draft, because recording somebody's
  // acceptance of terms no lawyer has read would be worse than having none. One
  // line in coach-agreement.ts turns it on, and it then covers every page here,
  // including any added later.
  if (agreementGateActive() && !pathname.startsWith('/dashboard/agreement')) {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const accepted = await hasAcceptedCurrent(createAdminClient(), scope.coachId)
    if (!accepted) redirect('/dashboard/agreement')
  }

  const badges = await getNavBadges()
  const tenantBrand = brand()
  const brandInitials = tenantBrand.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || tenantBrand.name.slice(0, 2).toUpperCase()

  return (
    <>
      <DashboardShell
        brandName={tenantBrand.name}
        brandInitials={brandInitials}
        userEmail={user.email}
        hint={<CommandKHint />}
        logout={<LogoutButton />}
        badges={badges}
        tier={tier}
      >
        {children}
      </DashboardShell>
      <CommandPalette />
      <GlobalCopilotBubble brandName={tenantBrand.name} />
      <SupportLauncher />
    </>
  )
}
