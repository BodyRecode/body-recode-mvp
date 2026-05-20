'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users,
  MessageSquare,
  Calendar,
  CreditCard,
  Zap,
  Layers,
  Megaphone,
  BarChart2,
  TrendingUp,
  LayoutDashboard,
  Clapperboard,
  Compass,
  FlaskConical,
  User,
  BrainCircuit,
  Hexagon,
} from 'lucide-react'

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  exact?: boolean
}

type NavSection = {
  label: string
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Hub', href: '/dashboard/business', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Contacts',
    items: [
      { label: 'CRM', href: '/dashboard/business/crm', icon: Users },
      { label: 'Inbox', href: '/dashboard/business/inbox', icon: MessageSquare },
    ],
  },
  {
    label: 'Convert',
    items: [
      { label: 'Bookings', href: '/dashboard/business/bookings', icon: Calendar },
      { label: 'Payments', href: '/dashboard/business/payments', icon: CreditCard },
    ],
  },
  {
    label: 'Grow',
    items: [
      { label: 'Funnels', href: '/dashboard/business/funnels', icon: Layers },
      { label: 'Campaigns', href: '/dashboard/business/campaigns', icon: Megaphone },
      { label: 'Content', href: '/dashboard/business/content', icon: Clapperboard },
      { label: 'Automations', href: '/dashboard/business/automations', icon: Zap },
      { label: 'Ads', href: '/dashboard/business/ads', icon: TrendingUp },
    ],
  },
  {
    label: 'Strategy',
    items: [
      { label: 'Strategy', href: '/dashboard/business/strategy', icon: Compass },
    ],
  },
  {
    label: 'Brands',
    items: [
      { label: 'Personal Brand', href: '/dashboard/business/personal-brand', icon: User },
      { label: 'AI Co-Founder',  href: '/dashboard/business/ai-cofounder',   icon: BrainCircuit },
      { label: 'Studio of Ten',  href: '/dashboard/business/studio-of-ten',  icon: Hexagon },
    ],
  },
  {
    label: 'Analyse',
    items: [
      { label: 'Analytics', href: '/dashboard/business/analytics', icon: BarChart2 },
    ],
  },
  {
    label: 'System Development',
    items: [
      { label: 'Peer Review', href: '/dashboard/business/peer-review', icon: FlaskConical },
    ],
  },
]

export default function BusinessSidebar() {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-52 shrink-0 border-r border-stone-200 bg-stone-50 overflow-y-auto">
      <div className="px-3 py-5 space-y-6">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href, item.exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-500 font-medium'
                        : 'text-stone-600 hover:text-[#1A1A1A] hover:bg-stone-200'
                    }`}
                  >
                    <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
