import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Zap } from 'lucide-react'

type EmailStep = {
  day: string
  subject: string
  paragraphs: string[]
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
        paragraphs: [
          'Hi {firstName},',
          'Sends the lead their scorecard result, body state, total score, and section breakdown.',
          '[Scorecard results card]',
          'Book a free Zoom call to go over these results together.',
        ],
        cta: 'Book a free call →',
      },
      {
        day: 'Day 3 (9am Brisbane)',
        subject: 'Following up on your scorecard',
        paragraphs: [
          'Hi {firstName},',
          'A quiet follow-up referencing their body state result and keeping the door open for a call without pressure.',
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
        subject: 'Re: Your check-in report',
        paragraphs: [
          'Hi {firstName},',
          'Most people who fill out that check-in have been at this for a while. Putting in the effort, doing the right things on paper, but something\'s not quite adding up.',
          'If that sounds familiar, your report is worth a proper read. It\'s not a generic summary. It reflects what\'s actually showing up in your body right now, based on what you told us.',
          'The next step is a 30-minute conversation where we work out what\'s driving it and what to actually do about it.',
          'No pitch. Just clarity.',
        ],
        cta: 'Book a call with Kade →',
      },
      {
        day: 'Day 5 (9am Brisbane)',
        subject: 'When the effort doesn\'t match the result',
        paragraphs: [
          'Hi {firstName},',
          'There\'s a specific kind of frustration that comes from doing everything you think you should be doing and still not seeing it reflected back at you.',
          'It\'s not laziness. It\'s not a lack of discipline. It\'s usually a mismatch between what your body actually needs right now and what you\'re giving it.',
          'That\'s exactly what your check-in results point to. And it\'s exactly what a conversation with me is designed to untangle.',
          '30 minutes. No obligation. Just a straight answer on what\'s going on and where to go from here.',
        ],
        cta: 'Book a call with Kade →',
      },
      {
        day: 'Day 12 (9am Brisbane)',
        subject: 'Last one from me, {firstName}',
        paragraphs: [
          'Hi {firstName},',
          'I won\'t keep showing up in your inbox after this.',
          'But I\'ll say one thing before I go quiet. The people who get the most out of that first conversation are usually the ones who\'ve been quietly wondering about this stuff for a while. Not new to training. Not giving up. Just stuck in a way they can\'t quite explain.',
          'If that\'s you, the call is worth 30 minutes of your time.',
        ],
        cta: 'Book a call when you\'re ready →',
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
        paragraphs: [
          'Hi {firstName},',
          'Looks like we missed each other today. No problem at all - these things happen.',
          'When you\'re ready, the conversation is still available. It\'s a 30-minute call to talk through what showed up in your report and work out whether there\'s something useful in it for you.',
          'No pressure. Just let me know when works.',
        ],
        cta: 'Rebook a time →',
      },
      {
        day: 'Day 5 (9am Brisbane)',
        subject: 'Still here when you\'re ready, {firstName}',
        paragraphs: [
          'Hi {firstName},',
          'Just a quiet follow-up from me.',
          'Your report picked up some patterns worth talking through - particularly around the load and recovery signals. That kind of clarity doesn\'t come from reading the report alone. It comes from a conversation.',
          'If timing wasn\'t right last time, happy to find something that works better. The conversation is 30 minutes and there\'s no obligation on the other side of it.',
        ],
        cta: 'Find a time that works →',
      },
      {
        day: 'Day 12 (9am Brisbane)',
        subject: 'Leaving the door open, {firstName}',
        paragraphs: [
          'Hi {firstName},',
          'Last message from me on this.',
          'The report is still there and the conversation is still available whenever it feels right - whether that\'s now or down the track.',
          'No follow-up after this. Just wanted you to know the door stays open.',
        ],
        cta: 'Book when you\'re ready →',
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
        paragraphs: [
          'Hi {firstName},',
          'Good speaking with you yesterday. I appreciate you taking the time.',
          'Completely understood that the timing isn\'t right. These things only work when they\'re right for you, not when they fit someone else\'s schedule.',
          'What we talked through doesn\'t expire. The patterns we identified are still there, and so is the conversation if you ever want to pick it up again.',
        ],
        cta: 'Book a time when you\'re ready →',
      },
      {
        day: 'Day 5 (9am Brisbane)',
        subject: 'Still here if the timing changes, {firstName}',
        paragraphs: [
          'Hi {firstName},',
          'Just a quiet follow-up from me.',
          'No pitch here. I just wanted to say the door stays open. What came up in your scorecard and our conversation doesn\'t change. Sometimes the right time to act on something comes a few weeks after the conversation, not during it.',
          'If anything has shifted and you\'d like to talk it through properly, I\'m here.',
        ],
        cta: 'Book a call →',
      },
      {
        day: 'Day 12 (9am Brisbane)',
        subject: 'Last one from me, {firstName}',
        paragraphs: [
          'Hi {firstName},',
          'Last message from me on this.',
          'The conversation is still available whenever it makes sense, whether that\'s soon or down the track. No follow-up after this.',
          'Just wanted you to know the door stays open.',
        ],
        cta: 'Book when you\'re ready →',
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
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-6">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Trigger</p>
        <p className="text-sm font-medium text-white mb-1">{automation.trigger}</p>
        <p className="text-xs text-stone-500">{automation.triggerDetail}</p>
      </div>

      {/* Steps */}
      <div className="relative">
        <div className="absolute left-[19px] top-8 bottom-8 w-px bg-stone-800" />
        <div className="space-y-4">
          {automation.steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center shrink-0 z-10">
                <span className="text-xs font-bold text-stone-400">{i + 1}</span>
              </div>
              <div className="flex-1 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden mb-1">
                {/* Step header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-stone-800 bg-stone-800/40">
                  <span className="text-xs font-medium text-teal-400">{step.day}</span>
                  <span className="text-xs text-stone-600">Email</span>
                </div>
                {/* Subject */}
                <div className="px-5 pt-4 pb-3 border-b border-stone-800/60">
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Subject</p>
                  <p className="text-sm font-medium text-white">{step.subject}</p>
                </div>
                {/* Body */}
                <div className="px-5 pt-4 pb-3 border-b border-stone-800/60">
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Body</p>
                  <div className="space-y-2.5">
                    {step.paragraphs.map((para, j) => (
                      <p key={j} className="text-sm text-stone-300 leading-relaxed">{para}</p>
                    ))}
                  </div>
                </div>
                {/* CTA */}
                <div className="px-5 py-3">
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">CTA</p>
                  <span className="inline-block text-xs font-semibold text-stone-950 bg-[#10E1C2] px-3 py-1.5 rounded-lg">
                    {step.cta}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
