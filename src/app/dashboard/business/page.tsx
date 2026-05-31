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
  ArrowUpRight,
  Mail,
} from 'lucide-react'
import { PageHeader, Card, SectionLabel, Btn, MONO_FONT } from '@/components/dashboard/ui'

const modules = [
  { label: 'CRM',          description: 'Pipeline, contacts, opportunities',         href: '/dashboard/business/crm',          icon: Users },
  { label: 'Waitlist',     description: 'Product launch waitlist signups',            href: '/dashboard/business/waitlist',     icon: Mail },
  { label: 'Inbox',        description: 'Email threads per lead',                    href: '/dashboard/business/inbox',        icon: MessageSquare },
  { label: 'Bookings',     description: 'Zoom 1, Zoom 2, calendar',                  href: '/dashboard/business/bookings',     icon: Calendar },
  { label: 'Availability', description: 'Set days and times leads can book',         href: '/dashboard/business/availability', icon: Clock },
  { label: 'Payments',     description: 'Products, invoices, subscriptions',         href: '/dashboard/business/payments',     icon: CreditCard },
  { label: 'Funnels',      description: 'Landing pages, lead capture',               href: '/dashboard/business/funnels',      icon: Layers },
  { label: 'Campaigns',    description: 'Email and SMS broadcasts',                  href: '/dashboard/business/campaigns',    icon: Megaphone },
  { label: 'Content',      description: 'Generate copy, graphics, reels',            href: '/dashboard/business/content',      icon: Clapperboard },
  { label: 'Automations',  description: 'Trigger sequences and workflows',           href: '/dashboard/business/automations',  icon: Zap },
  { label: 'Ads',          description: 'Meta + Google performance tracking',        href: '/dashboard/business/ads',          icon: TrendingUp },
  { label: 'Analytics',    description: 'Revenue, leads, conversions',               href: '/dashboard/business/analytics',    icon: BarChart2 },
  { label: 'Website',      description: 'Traffic, conversions, page performance',    href: '/dashboard/business/website',      icon: ExternalLink },
]

const publicLinks = [
  { label: 'Booking page',         url: '/book',                 desc: 'Public Zoom booking' },
  { label: 'Body State Scorecard', url: '/scorecard',            desc: 'Lead magnet - body state quiz' },
  { label: 'Performance Check-In', url: '/performance-check-in', desc: 'Free 3-min check-in' },
]

export default function BusinessHubPage() {
  const [seedingAutomation, setSeedingAutomation] = useState(false)
  const [automationSeeded, setAutomationSeeded] = useState(false)

  async function seedScorecardAutomation() {
    setSeedingAutomation(true)
    const res = await fetch('/api/admin/resync-scorecard-workflow', { method: 'POST' })
    if (res.ok) setAutomationSeeded(true)
    setSeedingAutomation(false)
  }

  async function resyncScorecardAutomation() {
    setSeedingAutomation(true)
    setAutomationSeeded(false)
    const res = await fetch('/api/admin/resync-scorecard-workflow', { method: 'POST' })
    setSeedingAutomation(false)
    if (res.ok) setAutomationSeeded(true)
  }

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Business Engine"
        title="Business"
        subtitle="The operating layer that feeds leads into the coaching system."
      />

      {/* Modules grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {modules.map(mod => {
          const Icon = mod.icon
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className="group bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-5 hover:border-[#D4D4D4] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#FFFFFF] border border-[#E5E5E5] flex items-center justify-center">
                  <Icon size={15} className="text-[#1B6DFC]" strokeWidth={1.8} />
                </div>
                <ArrowUpRight size={14} className="text-[#999999] group-hover:text-[#1B6DFC] transition-colors" />
              </div>
              <p className="text-[14px] font-semibold text-[#1A1A1A] group-hover:text-[#1B6DFC] transition-colors mb-1">
                {mod.label}
              </p>
              <p className="text-[12px] text-[#999999] leading-relaxed">{mod.description}</p>
            </Link>
          )
        })}
      </div>

      {/* Public links */}
      <Card className="mb-4" padding="md">
        <SectionLabel>Public Links</SectionLabel>
        <div className="divide-y divide-[#E5E5E5]">
          {publicLinks.map(link => (
            <div key={link.url} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-[14px] text-[#1A1A1A] font-medium">{link.label}</p>
                <p className="text-[12px] text-[#999999] mt-0.5">{link.desc}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className="text-[11px] text-[#999999] hidden sm:inline"
                  style={{ fontFamily: MONO_FONT }}
                >
                  bodyrecode.au{link.url}
                </span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-[#999999] hover:text-[#1B6DFC] transition-colors"
                  aria-label={`Open ${link.label}`}
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Scorecard automation setup */}
      <Card padding="md">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[#1A1A1A] mb-1">Scorecard Follow-up Automation</p>
            <p className="text-[12px] text-[#6B6B6B] leading-relaxed max-w-xl">
              A 4-email sequence that fires when someone completes the Body State Scorecard. Directs leads to book a free call or get the $37 Body Decode Report.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {automationSeeded && (
              <span className="inline-flex items-center gap-1.5 text-[#1B6DFC] text-[11px] font-semibold">
                <Check size={12} /> Synced
              </span>
            )}
            <Btn
              variant="primary"
              size="sm"
              icon={Zap}
              onClick={automationSeeded ? resyncScorecardAutomation : seedScorecardAutomation}
              disabled={seedingAutomation}
            >
              {seedingAutomation ? 'Syncing...' : automationSeeded ? 'Re-sync' : 'Set Up'}
            </Btn>
          </div>
        </div>
      </Card>
    </div>
  )
}
