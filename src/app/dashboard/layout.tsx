import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import DashboardShell from './shell'
import CommandPalette from './command-palette'
import CommandKHint from './command-k-hint'
import GlobalCopilotBubble from '@/components/global-copilot-bubble'
import SupportLauncher from '@/components/support/support-launcher'
import { brand } from '@/config/tenant'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

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
      >
        {children}
      </DashboardShell>
      <CommandPalette />
      <GlobalCopilotBubble brandName={tenantBrand.name} />
      <SupportLauncher />
    </>
  )
}
