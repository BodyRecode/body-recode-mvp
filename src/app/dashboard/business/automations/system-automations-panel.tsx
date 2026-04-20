'use client'

import { Zap, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const SYSTEM_AUTOMATIONS = [
  {
    id: 'scorecard-followup',
    name: 'Scorecard Follow-up Sequence',
    description: '9-step sequence triggered when someone completes the Body State Scorecard',
    trigger: 'Scorecard completed',
    steps: 9,
  },
  {
    id: 'report-followup',
    name: 'Performance Report Follow-up',
    description: '3-email sequence sent after a performance report is delivered to a lead',
    trigger: 'Report sent',
    steps: 3,
  },
  {
    id: 'zoom1-confirmation',
    name: 'Zoom 1 Booking Confirmation',
    description: 'Confirmation + 2-hour and 30-minute reminder emails to the lead, plus a coach notification on booking',
    trigger: 'Zoom 1 booked',
    steps: 4,
  },
  {
    id: 'zoom2-confirmation',
    name: 'Zoom 2 Booking Confirmation',
    description: 'Confirmation + 2-hour and 30-minute reminder emails to the lead, plus a coach notification on booking',
    trigger: 'Zoom 2 booked',
    steps: 4,
  },
  {
    id: 'no-show',
    name: 'No-show Re-engagement',
    description: '3-email sequence for leads who missed their scheduled Zoom call',
    trigger: 'Zoom no-show marked',
    steps: 3,
  },
  {
    id: 'zoom1-declined',
    name: 'Zoom 1 Declined Follow-up',
    description: '3-email sequence sent when a lead declines to proceed after Zoom 1',
    trigger: 'Declined after Zoom 1',
    steps: 3,
  },
  {
    id: 'downsell-offer',
    name: 'Self-Guided Program Offer',
    description: '$97 self-guided program offer sent automatically on Zoom 1 decline',
    trigger: 'Declined after Zoom 1',
    steps: 1,
  },
  {
    id: 'program-buyer-nurture',
    name: 'Program Buyer Nurture',
    description: '3-email sequence to bring self-guided program buyers back into coaching',
    trigger: 'Self-guided program purchased',
    steps: 3,
  },
]

export default function SystemAutomationsPanel() {
  return (
    <div className="mb-8">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">System Automations</p>
      <div className="space-y-2">
        {SYSTEM_AUTOMATIONS.map((a) => (
          <Link
            key={a.id}
            href={`/dashboard/business/automations/system/${a.id}`}
            className="flex items-center gap-4 bg-stone-900 border border-stone-800 rounded-xl p-4 hover:border-stone-700 transition-colors group"
          >
            <div className="p-2 bg-teal-500/10 rounded-lg shrink-0">
              <Zap size={14} className="text-teal-400" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{a.name}</p>
              <p className="text-xs text-stone-500 mt-0.5">{a.description}</p>
              <p className="text-xs text-stone-600 mt-1">{a.trigger} · {a.steps} emails</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1 text-xs font-medium text-teal-400">
                <Zap size={10} />
                Active
              </span>
              <ChevronRight size={14} className="text-stone-600 group-hover:text-stone-400 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
