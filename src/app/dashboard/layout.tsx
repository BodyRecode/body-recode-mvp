import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <header className="border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard">
            <img src="https://bodyrecode.au/logo-teal.png" width="110" alt="Body Recode" style={{ display: 'block' }} />
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/dashboard" className="text-sm text-stone-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors">Home</Link>
            <Link href="/dashboard/leads" className="text-sm text-stone-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors">Leads</Link>
            <Link href="/dashboard/coaching" className="text-sm text-stone-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors">Coaching</Link>
            <Link href="/dashboard/sources" className="text-sm text-stone-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors">Sources</Link>
            <Link href="/dashboard/business" className="text-sm text-stone-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors">Business</Link>
            <Link href="/dashboard/help" className="text-sm text-stone-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors">Guide</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-stone-500 text-xs">{user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
