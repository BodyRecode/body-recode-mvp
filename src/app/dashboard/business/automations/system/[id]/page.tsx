import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Zap } from 'lucide-react'

type EmailStep = {
  day: string
  subject: string
  body: string[]
  cta: string
}

type SystemAutomation = {
  id: string
  name: string
  description: string
  trigger: string
  triggerDetail: string
  steps: EmailStep[]
}

const AUTOMATIONS: Record<string, SystemAutomation> = {
  'scorecard-followup': {
    id: 'scorecard-followup',
    name: 'Scorecard Follow-up Sequence',
    description: '2-email sequence triggered when someone completes the Body State Scorecard',
    trigger: 'Scorecard completed',
    triggerDetail: 'Fires automatically when a lead submits the Body State Scorecard on bodyrecode.au/scorecard',
    steps: [
      {
        day: 'Immediately',
        subject: 'Your Body State Scorecard results',
        body: [
          'Sends the lead their scorecard result including body state, total score, and a breakdown of each section.',
          'Prompts them to book a free Zoom call to discuss their results.',
        ],
        cta: 'Book a free call →',
      },
      {
        day: 'Day 3 (9am Brisbane)',
        subject: 'Following up on your scorecard',
        body: [
          'A quiet follow-up referencing their body state result.',
          'Keeps the door open for a call without pressure.',
        ],
        cta: 'Book a call →',
      },
    ],
  },

  'report-followup': {
    id: 'report-followup',
    name: 'Performance Report Follow-up',
    description: '3-email sequence sent after a performance report is delivered to a lead',
    trigger: 'Report sent',
    triggerDetail: 'Manually triggered from the lead detail page after sending a performance report',
    steps: [
      {
        day: 'Next morning (9am Brisbane)',
        subject: 'Your Body Recode results are in',
        body: [
          'Delivers the report link and introduces what it covers.',
          'Invites the lead to book a call to walk through it together.',
        ],
        cta: 'View your results →',
      },
      {
        day: 'Day 5 (9am Brisbane)',
        subject: "It's not a lack of discipline",
        body: [
          'Reframes the lead\'s experience — not laziness, a mismatch between what their body needs and what they\'re giving it.',
          'References their check-in patterns as the reason to have a conversation.',
        ],
        cta: 'Book a call with Kade →',
      },
      {
        day: 'Day 12 (9am Brisbane)',
        subject: 'Last one from me',
        body: [
          'Final email — acknowledges the lead has been sitting on this.',
          'No follow-up after this. Call still available whenever ready.',
        ],
        cta: "Book a call when you're ready →",
      },
    ],
  },

  'no-show': {
    id: 'no-show',
    name: 'No-show Re-engagement',
    description: '3-email sequence for leads who missed their scheduled Zoom call',
    trigger: 'Zoom no-show marked',
    triggerDetail: 'Manually triggered from the lead detail page when a lead misses their Zoom 1 call',
    steps: [
      {
        day: 'Next morning (9am Brisbane)',
        subject: '{firstName} - missed you today',
        body: [
          'Warm acknowledgement — no blame, these things happen.',
          'Offers to rebook at a time that works.',
        ],
        cta: 'Rebook a time →',
      },
      {
        day: 'Day 5 (9am Brisbane)',
        subject: "Still here when you're ready, {firstName}",
        body: [
          'References specific patterns from the report that are worth a conversation.',
          'Reframes the call as a 30-minute conversation, no obligation.',
        ],
        cta: 'Find a time that works →',
      },
      {
        day: 'Day 12 (9am Brisbane)',
        subject: 'Leaving the door open, {firstName}',
        body: [
          'Final email. Report and conversation still available whenever right.',
          'No follow-up after this.',
        ],
        cta: "Book when you're ready →",
      },
    ],
  },

  'zoom1-declined': {
    id: 'zoom1-declined',
    name: 'Zoom 1 Declined Follow-up',
    description: '3-email sequence sent when a lead declines to proceed after Zoom 1',
    trigger: 'Declined after Zoom 1',
    triggerDetail: 'Manually triggered from the Zoom 1 companion page using the "Send declined follow-up" button',
    steps: [
      {
        day: 'Next morning (9am Brisbane)',
        subject: 'Good speaking yesterday, {firstName}',
        body: [
          'Warm close — appreciated the time, completely understood the timing isn\'t right.',
          'What was discussed doesn\'t expire. Conversation available whenever ready.',
        ],
        cta: "Book a time when you're ready →",
      },
      {
        day: 'Day 5 (9am Brisbane)',
        subject: 'Still here if the timing changes, {firstName}',
        body: [
          'No pitch. Door stays open.',
          'Scorecard patterns don\'t change. Sometimes the right time comes after the conversation, not during it.',
        ],
        cta: 'Book a call →',
      },
      {
        day: 'Day 12 (9am Brisbane)',
        subject: 'Last one from me, {firstName}',
        body: [
          'Last message. Conversation still available whenever it makes sense.',
          'No follow-up after this. Door stays open.',
        ],
        cta: "Book when you're ready →",
      },
    ],
  },
}

export default async function SystemAutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const automation = AUTOMATIONS[id]
  if (!automation) notFound()

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-stone-500 text-sm mb-6">
        <Link href="/dashboard/business/automations" className="hover:text-stone-300 transition-colors">
          Automations
        </Link>
        <span>/</span>
        <span className="text-stone-300">{automation.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="p-3 bg-teal-500/10 rounded-xl shrink-0">
          <Zap size={18} className="text-teal-400" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white mb-1">{automation.name}</h1>
          <p className="text-sm text-stone-400">{automation.description}</p>
        </div>
        <span className="ml-auto shrink-0 flex items-center gap-1.5 text-xs font-medium text-teal-400 bg-teal-500/10 px-3 py-1.5 rounded-full">
          <Zap size={10} />
          Always active
        </span>
      </div>

      {/* Trigger */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-4">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Trigger</p>
        <p className="text-sm font-medium text-white mb-1">{automation.trigger}</p>
        <p className="text-xs text-stone-500">{automation.triggerDetail}</p>
      </div>

      {/* Steps */}
      <div className="relative">
        <div className="absolute left-[19px] top-8 bottom-8 w-px bg-stone-800" />
        <div className="space-y-3">
          {automation.steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center shrink-0 z-10">
                <span className="text-xs font-bold text-stone-400">{i + 1}</span>
              </div>
              <div className="flex-1 bg-stone-900 border border-stone-800 rounded-xl p-5 mb-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-teal-400">{step.day}</span>
                  <span className="text-xs text-stone-600">Email</span>
                </div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Subject</p>
                <p className="text-sm font-medium text-white mb-3">{step.subject}</p>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Body</p>
                <ul className="space-y-1 mb-3">
                  {step.body.map((line, j) => (
                    <li key={j} className="flex gap-2 text-xs text-stone-400">
                      <span className="text-stone-600 shrink-0">·</span>
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">CTA</p>
                <p className="text-xs text-teal-400">{step.cta}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
