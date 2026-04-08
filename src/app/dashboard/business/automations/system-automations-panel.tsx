'use client'

import { useState } from 'react'
import { Zap, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SYSTEM_AUTOMATIONS = [
  {
    id: 'scorecard-followup',
    name: 'Scorecard Follow-up Sequence',
    description: '4-email sequence triggered when someone completes the Body State Scorecard',
    trigger: 'Scorecard completed',
    steps: 4,
    canReseed: true,
  },
  {
    id: 'report-followup',
    name: 'Performance Report Follow-up',
    description: '3-email sequence sent after a performance report is delivered to a lead',
    trigger: 'Report sent',
    steps: 3,
    canReseed: false,
  },
  {
    id: 'no-show',
    name: 'No-show Re-engagement',
    description: '3-email sequence for leads who missed their scheduled Zoom call',
    trigger: 'Zoom no-show marked',
    steps: 3,
    canReseed: false,
  },
  {
    id: 'zoom1-declined',
    name: 'Zoom 1 Declined Follow-up',
    description: '3-email sequence sent when a lead declines to proceed after Zoom 1',
    trigger: 'Declined after Zoom 1',
    steps: 3,
    canReseed: false,
  },
  {
    id: 'downsell-offer',
    name: 'Self-Guided Program Offer',
    description: '$97 self-guided program offer sent automatically on Zoom 1 decline',
    trigger: 'Declined after Zoom 1',
    steps: 1,
    canReseed: false,
  },
  {
    id: 'program-buyer-nurture',
    name: 'Program Buyer Nurture',
    description: '3-email sequence to bring self-guided program buyers back into coaching',
    trigger: 'Self-guided program purchased',
    steps: 3,
    canReseed: false,
  },
]

export default function SystemAutomationsPanel() {
  const router = useRouter()
  const [reseeding, setReseeding] = useState(false)
  const [reseeded, setReseeded] = useState(false)

  async function reseedScorecard() {
    setReseeding(true)
    const res = await fetch('/api/scorecard/seed-automation', { method: 'POST' })
    if (res.ok) {
      setReseeded(true)
      router.refresh()
    }
    setReseeding(false)
  }

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
              {a.canReseed && (
                <button
                  onClick={reseedScorecard}
                  disabled={reseeding}
                  className="bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  {reseeding ? 'Updating...' : reseeded ? 'Updated' : 'Reseed'}
                </button>
              )}
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
