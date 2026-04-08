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
    description: '4-email sequence triggered when someone completes the Body State Scorecard',
    trigger: 'Scorecard completed',
    triggerDetail: 'Fires automatically when a lead submits the Body State Scorecard on bodyrecode.au/scorecard',
    steps: [
      {
        day: 'Immediately',
        subject: 'Your Body State result',
        paragraphs: [
          'Hi {firstName},',
          'Your scorecard result: {score}/15. Body state: {state}.',
          'That result tells you one specific thing: which state your body is currently in. That state determines what works. It also determines what makes things worse. Most people apply the same approach regardless of their state. That is why most people stay stuck.',
          'If you want to understand exactly what is driving your result and what needs to change first, book a free 30-minute call. We go through your scorecard together, identify the specific bottleneck, and map out the first steps.',
        ],
        cta: 'Book here →',
      },
      {
        day: 'Day 3',
        subject: 'Re: your Body State Scorecard',
        paragraphs: [
          'Hi {firstName},',
          'Following up on your scorecard.',
          'The most common thing I hear after someone takes it: "That finally explains why nothing has been working."',
          'Knowing your state is the first piece. The second is knowing exactly what to do about it. That is what the call is for. 30 minutes. Free. No pitch.',
          'If the timing is not right, no problem. The link will be there when you are ready.',
        ],
        cta: 'Book here →',
      },
      {
        day: 'Day 7',
        subject: 'What your {state} result actually means',
        paragraphs: [
          'Hi {firstName},',
          'Most coaching programs give everyone the same plan. Same training, same nutrition, same timeline. Your body state doesn\'t factor into it at all.',
          'Your scorecard came back as {state}. That is a specific biological pattern, not a label. It tells me how your body is handling load, how well it is recovering, and how much capacity it has to adapt right now.',
          'A program built for a Ready state will not work for a Depleted state. That is not a motivation problem. That is a prescription problem.',
          'That is exactly what the call addresses. Building the approach around your actual state, not a generic template.',
        ],
        cta: 'Book here →',
      },
      {
        day: 'Day 12',
        subject: 'Last one from me, {firstName}',
        paragraphs: [
          'Hi {firstName},',
          'Last email from me on this.',
          'Your scorecard result is still there whenever you want to act on it. The call is still available. No follow-up after this.',
          'Just wanted you to know the door stays open.',
        ],
        cta: 'Book here →',
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
    <div style={{ maxWidth: '680px', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#57534e', marginBottom: '32px' }}>
        <Link href="/dashboard/business/automations" style={{ color: '#57534e', textDecoration: 'none' }} className="hover:text-white transition-colors">
          Automations
        </Link>
        <span>/</span>
        <span style={{ color: '#d4cfc9' }}>{automation.name}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ width: '28px', height: '3px', background: '#14b8a6', borderRadius: '2px', marginBottom: '20px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              {automation.name}
            </h1>
            <p style={{ fontSize: '14px', color: '#a8a29e', lineHeight: 1.6 }}>{automation.description}</p>
          </div>
          <span style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
            color: '#14b8a6', background: 'rgba(20,184,166,0.08)',
            border: '1px solid rgba(20,184,166,0.25)',
            padding: '5px 12px', borderRadius: '999px',
          }}>
            <Zap size={10} />
            Always active
          </span>
        </div>
      </div>

      {/* Trigger */}
      <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: '12px', padding: '20px 24px', marginBottom: '32px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Trigger</p>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>{automation.trigger}</p>
        <p style={{ fontSize: '13px', color: '#78716c', lineHeight: 1.6 }}>{automation.triggerDetail}</p>
      </div>

      {/* Steps */}
      <p style={{ fontSize: '10px', fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
        Email Sequence - {automation.steps.length} emails
      </p>

      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: '19px', top: '40px', bottom: '40px', width: '1px', background: '#1c1917' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {automation.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '16px' }}>
              {/* Step number */}
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                background: '#111110', border: '1px solid #1c1917',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', zIndex: 1,
              }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#57534e' }}>{i + 1}</span>
              </div>

              {/* Card */}
              <div style={{ flex: 1, background: '#111110', border: '1px solid #1c1917', borderRadius: '12px', overflow: 'hidden', marginBottom: '4px' }}>

                {/* Step header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px solid #1c1917', background: '#0f0e0d' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#14b8a6' }}>{step.day}</span>
                  <span style={{ fontSize: '11px', color: '#57534e', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Email</span>
                </div>

                {/* Subject */}
                <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid #1c1917' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Subject</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>{step.subject}</p>
                </div>

                {/* Body */}
                <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid #1c1917' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Body</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {step.paragraphs.map((para, j) => (
                      <p key={j} style={{ fontSize: '13px', color: '#a8a29e', lineHeight: 1.75 }}>{para}</p>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div style={{ padding: '14px 18px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>CTA</p>
                  <span style={{
                    display: 'inline-block', padding: '8px 16px',
                    background: '#14b8a6', color: '#0c0a09',
                    fontSize: '12px', fontWeight: 700, borderRadius: '8px',
                  }}>
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
