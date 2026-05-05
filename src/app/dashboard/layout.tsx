import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import DashboardNav from './nav'
import CommandPalette from './command-palette'
import CommandKHint from './command-k-hint'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#0c0a09] text-white">
      <header
        className="sticky top-0 z-50 border-b border-[#1c1917] backdrop-blur-xl print:hidden"
        style={{ background: 'rgba(12, 10, 9, 0.78)' }}
      >
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-9 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#14b8a6] text-[#0c0a09] font-bold text-[13px] tracking-tight"
                style={{ fontFamily: "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
              >
                BR
              </span>
              <span className="text-[16px] font-semibold text-white tracking-tight">Body Recode</span>
            </Link>
            <DashboardNav />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <CommandKHint />
            <span
              className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-[#a8a29e] px-2.5 py-1 rounded-full border border-[#1c1917] bg-[#111110]"
              style={{ fontFamily: "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6] shadow-[0_0_6px_#14b8a6]" />
              live
            </span>
            <span className="hidden lg:inline text-[#57534e] text-[11px] tracking-wide">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-[1280px] mx-auto px-6 py-10 print:max-w-none print:mx-0 print:p-0">
        {children}
      </main>
      <CommandPalette />
    </div>
  )
}
