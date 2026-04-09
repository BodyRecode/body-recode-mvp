'use client'

import Link from 'next/link'
import { useState } from 'react'
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
  Clapperboard,
  ExternalLink,
  Check,
  Clock,
} from 'lucide-react'

const modules = [
  {
    label: 'CRM',
    description: 'Pipeline, contacts, opportunities',
    href: '/dashboard/business/crm',
    icon: Users,
  },
  {
    label: 'Inbox',
    description: 'Email threads per lead',
    href: '/dashboard/business/inbox',
    icon: MessageSquare,
  },
  {
    label: 'Bookings',
    description: 'Zoom 1, Zoom 2, calendar',
    href: '/dashboard/business/bookings',
    icon: Calendar,
  },
  {
    label: 'Availability',
    description: 'Set days and times leads can book',
    href: '/dashboard/business/availability',
    icon: Clock,
  },
  {
    label: 'Payments',
    description: 'Products, invoices, subscriptions',
    href: '/dashboard/business/payments',
    icon: CreditCard,
  },
  {
    label: 'Funnels',
    description: 'Landing pages, lead capture',
    href: '/dashboard/business/funnels',
    icon: Layers,
  },
  {
    label: 'Campaigns',
    description: 'Email and SMS broadcasts',
    href: '/dashboard/business/campaigns',
    icon: Megaphone,
  },
  {
    label: 'Content',
    description: 'Generate copy, graphics, reels',
    href: '/dashboard/business/content',
    icon: Clapperboard,
  },
  {
    label: 'Automations',
    description: 'Trigger sequences and workflows',
    href: '/dashboard/business/automations',
    icon: Zap,
  },
  {
    label: 'Ads',
    description: 'Meta + Google performance tracking',
    href: '/dashboard/business/ads',
    icon: TrendingUp,
  },
  {
    label: 'Analytics',
    description: 'Revenue, leads, conversions',
    href: '/dashboard/business/analytics',
    icon: BarChart2,
  },
  {
    label: 'Website',
    description: 'Traffic, conversions, page performance',
    href: '/dashboard/business/website',
    icon: ExternalLink,
  },
]

const publicLinks = [
  { label: 'Booking page', url: '/book', desc: 'Public Zoom booking' },
  { label: 'Body State Scorecard', url: '/scorecard', desc: 'Lead magnet — body state quiz' },
  { label: 'Performance Check-In', url: '/performance-check-in', desc: 'Free 3-min check-in' },
]

export default function BusinessHubPage() {
  const [seedingAutomation, setSeedingAutomation] = useState(false)
  const [automationSeeded, setAutomationSeeded] = useState(false)

  async function seedScorecardAutomation() {
    setSeedingAutomation(true)
    const res = await fetch('/api/scorecard/seed-automation', { method: 'POST' })
    if (res.ok) setAutomationSeeded(true)
    setSeedingAutomation(false)
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Business Engine</h1>
        <p className="text-stone-400 text-sm">The operating layer that feeds leads into the coaching system.</p>
      </div>

      {/* Modules grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8">
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
              </div>
              <p className="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors mb-0.5">
                {mod.label}
              </p>
              <p className="text-xs text-stone-500">{mod.description}</p>
            </Link>
          )
        })}
      </div>

      {/* Public links */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-4">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">Public Links</p>
        <div className="space-y-2">
          {publicLinks.map(link => (
            <div key={link.url} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">{link.label}</p>
                <p className="text-xs text-stone-500">{link.desc}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-stone-600 font-mono">bodyrecode.au{link.url}</span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-stone-500 hover:text-teal-400 transition-colors"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scorecard automation setup */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white mb-1">Scorecard Follow-up Automation</p>
            <p className="text-xs text-stone-400 leading-relaxed">
              Automatically sends two follow-up emails when someone completes the Body State Scorecard — directing them to the Performance Check-In.
            </p>
          </div>
          {automationSeeded ? (
            <div className="flex items-center gap-1.5 text-teal-400 text-xs font-semibold shrink-0">
              <Check size={13} /> Created
            </div>
          ) : (
            <button
              onClick={seedScorecardAutomation}
              disabled={seedingAutomation}
              className="shrink-0 flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-stone-950 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <Zap size={12} />
              {seedingAutomation ? 'Creating...' : 'Set Up'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
