import Link from 'next/link'
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
} from 'lucide-react'

const modules = [
  {
    label: 'CRM',
    description: 'Pipeline, contacts, opportunities',
    href: '/dashboard/business/crm',
    icon: Users,
    status: 'ready',
  },
  {
    label: 'Inbox',
    description: 'SMS, email, social — one thread',
    href: '/dashboard/business/inbox',
    icon: MessageSquare,
    status: 'coming',
  },
  {
    label: 'Bookings',
    description: 'Zoom 1, Zoom 2, calendar',
    href: '/dashboard/business/bookings',
    icon: Calendar,
    status: 'coming',
  },
  {
    label: 'Payments',
    description: 'Products, invoices, subscriptions',
    href: '/dashboard/business/payments',
    icon: CreditCard,
    status: 'coming',
  },
  {
    label: 'Funnels',
    description: 'Landing pages, forms, capture',
    href: '/dashboard/business/funnels',
    icon: Layers,
    status: 'coming',
  },
  {
    label: 'Campaigns',
    description: 'Email and SMS broadcasts',
    href: '/dashboard/business/campaigns',
    icon: Megaphone,
    status: 'coming',
  },
  {
    label: 'Automations',
    description: 'Trigger → condition → action',
    href: '/dashboard/business/automations',
    icon: Zap,
    status: 'coming',
  },
  {
    label: 'Ads',
    description: 'Meta + Google performance tracking',
    href: '/dashboard/business/ads',
    icon: TrendingUp,
    status: 'coming',
  },
  {
    label: 'Analytics',
    description: 'Revenue, leads, conversions',
    href: '/dashboard/business/analytics',
    icon: BarChart2,
    status: 'coming',
  },
]

export default function BusinessHubPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold mb-1">Business Engine</h1>
        <p className="text-stone-400 text-sm">The operating layer that feeds leads into the coaching system.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {modules.map((mod) => {
          const Icon = mod.icon
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className="group bg-stone-900 border border-stone-800 rounded-xl p-5 hover:border-stone-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-stone-800 rounded-lg">
                  <Icon size={16} className="text-teal-400" strokeWidth={1.8} />
                </div>
                {mod.status === 'coming' && (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-stone-600 bg-stone-800 px-2 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors mb-0.5">
                {mod.label}
              </p>
              <p className="text-xs text-stone-500">{mod.description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
