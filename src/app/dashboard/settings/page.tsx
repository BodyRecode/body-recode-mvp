import Link from 'next/link'
import { PageHeader } from '@/components/dashboard/ui'
import { isCoachEmail } from '@/lib/coach-auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Settings' }

export default async function SettingsIndex() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')
  const isKade = isCoachEmail(user.email) && user.email === 'kade.dunstone@gmail.com'

  const SETTINGS = [
    {
      href: '/dashboard/settings/tenant',
      title: 'Tenant configuration',
      description: 'Your brand shell, coach identity, product wrapping, custom domains, and Stripe Connect. Applies to how the platform renders when a client interacts with your surfaces.',
    },
    {
      href: '/dashboard/settings/platform-buildout',
      title: 'Platform buildout',
      description: 'End-to-end SaaS / white-label build plan. Every phase, every step, current status. Source of truth for where the powered platform stands.',
    },
    isKade && {
      href: '/dashboard/settings/tenants',
      title: 'Tenant registry (admin)',
      description: 'All coaches on the platform + their tenant_config rows. Admin-only.',
    },
    isKade && {
      href: '/dashboard/settings/partner-billing',
      title: 'Partner billing (admin)',
      description: 'Kade\'s billing of Founding Ten partners. Setup fee + locked monthly subscription + per-active-client counts. Read here monthly to invoice via Stripe dashboard.',
    },
  ].filter(Boolean) as Array<{ href: string; title: string; description: string }>

  return (
    <div className="max-w-[900px]">
      <PageHeader
        eyebrow="Dashboard"
        title="Settings"
        subtitle="Configure how the platform renders for your tenant + track the SaaS / white-label buildout."
      />

      <div className="grid grid-cols-1 gap-4">
        {SETTINGS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block bg-white border border-stone-200 rounded-2xl p-5 hover:border-blue-300 transition-colors"
          >
            <h2 className="text-[16px] font-bold text-stone-900 mb-2">{s.title}</h2>
            <p className="text-[13px] text-stone-600 leading-relaxed">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
