'use client'

import { useState } from 'react'
import {
  Zap,
  Check,
  ExternalLink,
} from 'lucide-react'
import { PageHeader, Card, SectionLabel, Btn, MONO_FONT } from '@/components/dashboard/ui'

const publicLinks = [
  { label: 'Booking page',         url: '/book',                 desc: 'Public Zoom booking' },
  { label: 'Readiness Scorecard', url: '/scorecard',            desc: 'Lead magnet - body state quiz' },
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
        title="Business Hub"
        subtitle="Quick actions + public links. Sub-pages live in the Business dropdown."
      />

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

      <Card padding="md">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[#1A1A1A] mb-1">Scorecard Follow-up Automation</p>
            <p className="text-[12px] text-[#6B6B6B] leading-relaxed max-w-xl">
              A 4-email sequence that fires when someone completes the Readiness Scorecard. Directs leads to book a free call or get the $37 Body Decode Report.
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
