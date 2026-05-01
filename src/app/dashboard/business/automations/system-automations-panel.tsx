'use client'

import { Zap, ChevronRight, Hand } from 'lucide-react'
import Link from 'next/link'

const AUTOMATIC_AUTOMATIONS = [
  // Lead-stage automations
  {
    id: 'scorecard-followup',
    name: 'Scorecard Follow-up Sequence',
    description: '5-email sequence triggered when someone completes the Body State Scorecard. Buyer-language voice, alternates between $37 report and free strategy call.',
    trigger: 'Scorecard completed',
    steps: 5,
  },
  {
    id: 'report-followup',
    name: 'Body Decode Report Follow-up',
    description: '3-email sequence sent after a $37 Body Decode Report is purchased. Cancels the scorecard sequence and replaces it.',
    trigger: 'Report purchased via Stripe',
    steps: 3,
  },
  {
    id: 'zoom1-confirmation',
    name: 'Zoom Booking Confirmation',
    description: 'Confirmation + 2-hour and 30-minute reminder emails to the lead, plus a coach notification. Single Zoom funnel (Zoom 1/2 split deprecated).',
    trigger: 'Zoom booked via bodyrecode.au/book or coach action',
    steps: 4,
  },
  {
    id: 'downsell-offer',
    name: 'Self-Guided Program Offer',
    description: '$97 self-guided program offer (state-tailored). Auto-fires alongside the Zoom Declined sequence.',
    trigger: 'Lead declines after Zoom call',
    steps: 1,
  },
  {
    id: 'program-buyer-nurture',
    name: 'Program Buyer Nurture',
    description: '3-email sequence to bring self-guided program buyers back into coaching.',
    trigger: 'Self-guided program purchased',
    steps: 3,
  },
  // Client onboarding (post $240 commencement)
  {
    id: 'intake-submitted',
    name: 'Foundational Intake Submitted',
    description: 'Coach notification when a client completes their 208-question intake. Also triggers automatic CFFS generation in the background.',
    trigger: 'Client submits Foundational Intake via portal',
    steps: 1,
  },
  {
    id: 'baseline-submitted',
    name: 'Baseline Documentation Submitted',
    description: 'Coach notification when a client uploads their baseline measurements + photos.',
    trigger: 'Client submits Baseline via portal',
    steps: 1,
  },
  {
    id: 'health-declaration-submitted',
    name: 'Health Declaration Submitted',
    description: 'Coach notification when health declaration is submitted. Flags if medical clearance is required before intake unlocks.',
    trigger: 'Client submits Health Declaration via portal',
    steps: 1,
  },
  {
    id: 'clearance-uploaded',
    name: 'Medical Clearance Uploaded',
    description: 'Coach notification when a client uploads their medical clearance form. Includes a signed link for review (7-day expiry).',
    trigger: 'Client uploads clearance file via portal',
    steps: 1,
  },
  {
    id: 'clearance-approved',
    name: 'Medical Clearance Approved',
    description: 'Email to client when coach approves their medical clearance. Unlocks Foundational Intake and Baseline in their portal.',
    trigger: 'Coach approves clearance from dashboard',
    steps: 1,
  },
  // Weekly + session automations
  {
    id: 'weekly-checkin-submitted',
    name: 'Weekly Check-In Submitted',
    description: 'Coach notification + client confirmation when a weekly check-in (Form A or Form B) is submitted. Triggers CFWS generation when both forms for the week are in.',
    trigger: 'Client submits weekly check-in via portal',
    steps: 2,
  },
  {
    id: 'session-confirmed',
    name: 'Session Confirmed via Portal',
    description: 'Coach notification when a client confirms their face-to-face session via the one-click portal link.',
    trigger: 'Client clicks "Confirm session" link in their portal email',
    steps: 1,
  },
  {
    id: 'session-booked-portal',
    name: 'Session Booked via Portal',
    description: 'Client confirmation + coach notification when a client books a face-to-face session through their portal.',
    trigger: 'Client books a session via portal Sessions page',
    steps: 2,
  },
]

const MANUAL_AUTOMATIONS = [
  // Lead-stage manual triggers
  {
    id: 'send-booking-link',
    name: 'Send Booking Link',
    description: 'Manually email a lead the strategy-call booking link. Use when a lead has not booked yet and you want to nudge them.',
    trigger: 'Click "Send booking link" on the lead detail page',
    steps: 1,
  },
  {
    id: 'send-orientation',
    name: 'Send Orientation Guide',
    description: 'Manually send the pre-call orientation guide so the lead knows how the coaching process works before the Zoom.',
    trigger: 'Click "Send orientation" on the lead detail page',
    steps: 1,
  },
  {
    id: 'no-show',
    name: 'No-show Re-engagement',
    description: '3-email re-engagement sequence for leads who missed their scheduled Zoom call.',
    trigger: 'Mark lead as Closed - No Show, then click trigger',
    steps: 3,
  },
  {
    id: 'zoom1-declined',
    name: 'Zoom Declined Follow-up',
    description: '3-email follow-up when a lead declines to proceed after their Zoom call. Auto-fires the $97 Self-Guided Program Offer alongside.',
    trigger: 'Mark lead as Closed - Declined, then click trigger',
    steps: 3,
  },
  {
    id: 'send-commencement-fee',
    name: 'Send Commencement Fee Link',
    description: 'Manually email a lead the $240 Stripe checkout link to start coaching. Auto-triggered on Path C in the Zoom companion, but can also be sent manually.',
    trigger: 'Click "Send to Client" under Coaching Entry, or Path C in Zoom companion',
    steps: 1,
  },
  // Client onboarding manual triggers
  {
    id: 'send-portal-email',
    name: 'Send Portal Email',
    description: 'Manually email a client their onboarding portal link. Magic-link sign-in. Lists the four onboarding steps (Coaching Agreement, Health Declaration, Foundational Intake, Baseline Documentation).',
    trigger: 'Click "Send to Client" on the client profile',
    steps: 1,
  },
  {
    id: 'send-subscription',
    name: 'Send Subscription Link',
    description: 'Manually email a client their weekly subscription Stripe link. Sent after CFFS is reviewed and the coaching package is set on the client profile.',
    trigger: 'Click "Send subscription" on the client profile',
    steps: 1,
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
