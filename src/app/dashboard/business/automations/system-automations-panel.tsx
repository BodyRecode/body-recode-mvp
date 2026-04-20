'use client'

import { Zap, ChevronRight, Hand } from 'lucide-react'
import Link from 'next/link'

const AUTOMATIC_AUTOMATIONS = [
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
    description: '3-email sequence sent after a Body Decode Report is purchased',
    trigger: 'Report purchased',
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

const MANUAL_AUTOMATIONS = [
  {
    id: 'no-show',
    name: 'No-show Re-engagement',
    description: '3-email sequence for leads who missed their scheduled Zoom call',
    trigger: 'Mark lead as No-show, then click trigger on lead page',
    steps: 3,
  },
  {
    id: 'zoom1-declined',
    name: 'Zoom 1 Declined Follow-up',
    description: '3-email sequence sent when a lead declines to proceed after Zoom 1',
    trigger: 'Mark lead as Declined, then click trigger on lead page',
    steps: 3,
  },
]

function AutomationRow({ a, href }: { a: typeof AUTOMATIC_AUTOMATIONS[0]; href: string }) {
  return (
    <Link
      href={href}
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
  )
}

function ManualRow({ a, href }: { a: typeof MANUAL_AUTOMATIONS[0]; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 bg-stone-900 border border-stone-800 rounded-xl p-4 hover:border-stone-700 transition-colors group"
    >
      <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
        <Hand size={14} className="text-amber-400" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{a.name}</p>
        <p className="text-xs text-stone-500 mt-0.5">{a.description}</p>
        <p className="text-xs text-stone-600 mt-1">{a.trigger} · {a.steps} emails</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="flex items-center gap-1 text-xs font-medium text-amber-400">
          <Hand size={10} />
          Manual
        </span>
        <ChevronRight size={14} className="text-stone-600 group-hover:text-stone-400 transition-colors" />
      </div>
    </Link>
  )
}

export default function SystemAutomationsPanel() {
  return (
    <div className="mb-8 space-y-6">
      <div>
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">System Automations</p>
        <div className="space-y-2">
          {AUTOMATIC_AUTOMATIONS.map((a) => (
            <AutomationRow key={a.id} a={a} href={`/dashboard/business/automations/system/${a.id}`} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Manual Triggers</p>
        <p className="text-xs text-stone-600 mb-3">These fire when you explicitly trigger them from the lead page. Use them when a judgement call is needed.</p>
        <div className="space-y-2">
          {MANUAL_AUTOMATIONS.map((a) => (
            <ManualRow key={a.id} a={a} href={`/dashboard/business/automations/system/${a.id}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
