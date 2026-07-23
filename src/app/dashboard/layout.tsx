import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import DashboardNav from './nav'
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
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <header
        className="sticky top-0 z-50 border-b border-[#E5E5E5] backdrop-blur-xl print:hidden"
        style={{ background: 'rgba(255, 255, 255, 0.85)' }}
      >
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-9 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#1B6DFC] text-[#FFFFFF] font-bold text-[13px] tracking-tight"
                style={{ fontFamily: "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
              >
                {brandInitials}
              </span>
              <span className="text-[16px] font-semibold text-[#1A1A1A] tracking-tight">{tenantBrand.name}</span>
            </Link>
            <DashboardNav />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <CommandKHint />
            <span
              className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-[#6B6B6B] px-2.5 py-1 rounded-full border border-[#E5E5E5] bg-[#F8F8F8]"
              style={{ fontFamily: "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B6DFC] shadow-[0_0_6px_#1B6DFC]" />
              live
            </span>
            <span className="hidden lg:inline text-[#999999] text-[11px] tracking-wide">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-[1280px] mx-auto px-6 py-10 print:max-w-none print:mx-0 print:p-0">
        {children}
      </main>
      <CommandPalette />
      <GlobalCopilotBubble />
      <SupportLauncher />
    </div>
  )
}
