import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import { coach } from "@/config/tenant";

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
  'dormant-lead-reactivation': {
    id: 'dormant-lead-reactivation',
    name: 'Dormant Lead Reactivation',
    description: 'Three touches over ten days for leads who did a scorecard, gave you their details, and were never sent anything. Then it stops. You trigger it from the button at the top of the Automations page, not automatically.',
    trigger: 'You trigger it (Automations page)',
    triggerDetail: 'Not automatic. On the Automations page there is a card at the top: click "See who gets it" to preview every recipient and every exclusion with its reason, then send from inside that dialog. Anyone who replies and gets moved off "new check-in", converts, or is marked inactive drops out of the remaining touches automatically. Existing clients, internal and test records, and anyone with no body state are excluded before it starts.',
    steps: [
      {
        day: 'Immediately',
        subject: 'Your Body Recode read, {firstName}',
        paragraphs: [
          'Their scorecard read written out in full: body state, score, and their pattern if one was named, each in the approved lead-facing language.',
          'Deliberately has NO button. The only call to action is a line asking them to reply, because a reply is a lower bar than a booking and it starts a conversation instead of a funnel step.',
          'Opens by owning it: "You did the Readiness Scorecard a while back and I never walked you through what it meant. That is on me, so here it is properly."',
        ],
        cta: 'Reply to this email (no button)',
      },
      {
        day: 'Day 4',
        subject: 'SMS: did that sound right?',
        paragraphs: [
          '"Hey {firstName}, Kade from Body Recode. Sent your read through the other day. Did the {pattern} bit sound right to you or not really? Genuinely curious either way."',
          'One question, answerable in three words, asking for nothing. Only goes to leads with SMS consent, so roughly a third of the list. Sends at 7am Brisbane.',
        ],
        cta: 'A reply, not a click',
      },
      {
        day: 'Day 10',
        subject: '{firstName}, the next step for your read',
        paragraphs: [
          'The step that matches their state, as a self-serve link. Depleted who have not done the Challenge get it free. Depleted who have, plus everyone Transitioning, get the $97 Blueprint. Ready leads get the $49 Membership.',
          'Ends by saying that if it is not the right time that is genuinely fine, and it will leave them be. Then the sequence stops.',
        ],
        cta: 'Take a look →',
      },
    ],
  },
  'scorecard-followup': {
    id: 'scorecard-followup',
    name: 'Scorecard Follow-up Sequence',
    description: '5-email sequence over 13 days. Fat-loss-explicit voice. Emails 1-2 push the $37 Body Decode Report; emails 3-4 push the free strategy call; email 5 names both options based on state.',
    trigger: 'Scorecard completed',
    triggerDetail: 'Fires automatically when a lead submits the Readiness Scorecard on performance.bodyrecode.au/scorecard. Each email is personalised to the lead\'s score, body state, and first name.',
    steps: [
      {
        day: 'Immediately',
        subject: 'Why your body has stopped responding, {firstName}',
        paragraphs: [
          'Hi {firstName},',
          'You just took the scorecard. Result: {score}/15. Body state: {state}.',
          'That number is the starting point, not the answer. It tells you which of three states your body is currently in. It does not tell you why fat loss has stalled, what specifically is making things worse, or what to fix first.',
          'The Body Decode Report does. $37. Delivered in 5 minutes. Yours to keep.',
        ],
        cta: 'Get your report →',
      },
      {
        day: 'Day 2',
        subject: 'What your {state} result actually means',
        paragraphs: [
          'Hi {firstName},',
          'Most people in your situation think they need to train harder or eat less. That is usually the wrong call.',
          'When a body has stopped responding to effort, the issue is rarely the effort itself. It is the prescription. Pushing harder against a body that is already resisting is what got it stuck in the first place.',
          'The Body Decode Report walks through what {state} actually means for your training, nutrition, recovery, and most importantly, why fat loss has stalled.',
        ],
        cta: 'Get your report →',
      },
      {
        day: 'Day 4',
        subject: 'Re: your scorecard',
        paragraphs: [
          'Hi {firstName},',
          'Following up on your scorecard.',
          'The most common thing I hear after someone takes it: "That finally explains why nothing has been working."',
          '30 minutes. Free. No pitch. We go through your scorecard together, identify the specific bottleneck, and map out what to do first.',
        ],
        cta: 'Book a call →',
      },
      {
        day: 'Day 8',
        subject: 'The prescription problem',
        paragraphs: [
          'Hi {firstName},',
          'Most coaching programs give everyone the same plan. Your body state does not factor in at all.',
          'Your scorecard came back as {state}. That is a specific biological pattern. A program built for a Ready state will make a Depleted state worse. That is not a motivation problem. It is a prescription problem.',
          'The fastest way to address it is the call. 30 minutes, free, no pitch.',
        ],
        cta: 'Book a call →',
      },
      {
        day: 'Day 13',
        subject: 'Last one from me, {firstName}',
        paragraphs: [
          'Hi {firstName},',
          'Last email from me on this. Two doors based on your {state} score:',
          '1. Body Decode Report ($37). Written breakdown of your result and the order to fix it.',
          '2. Free 30-minute call. Best if you would rather talk it through first.',
          'No follow-up after this.',
        ],
        cta: 'Pick a door →',
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
    triggerDetail: 'Manually triggered from the lead detail page when a lead misses their Zoom call',
    steps: [
      {
        day: 'Next morning (9am Brisbane)',
        subject: '{firstName} - missed you yesterday',
        paragraphs: [
          'Hi {firstName},',
          'Looks like we missed each other yesterday. No problem at all - these things happen.',
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
    name: 'Zoom Declined Follow-up',
    description: '3-email sequence sent when a lead declines to proceed after the Zoom call',
    trigger: 'Declined after Zoom',
    triggerDetail: 'Manually triggered from the Zoom companion page using the "Send declined follow-up" button',
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

  'downsell-offer': {
    id: 'downsell-offer',
    name: 'Self-Guided Program Offer',
    description: '$97 self-guided program offer sent automatically when a lead declines after the Zoom call',
    trigger: 'Declined after Zoom',
    triggerDetail: 'Fires automatically alongside the Zoom Declined Follow-up sequence - no manual action required',
    steps: [
      {
        day: 'Immediately on decline',
        subject: 'Your {state} State Program - $97',
        paragraphs: [
          'Hi {firstName},',
          'Your scorecard came back as {state} State. That tells me specifically how your body is handling stress and recovery right now, and what it can actually respond to.',
          'I have built a 12-week program specifically for {state} State. Not a generic plan. Every decision in it - the training volume, intensity, rest periods, and nutrition - is designed around where you are right now.',
          'It is $97. One-time. Yours to keep.',
        ],
        cta: 'Get the Program - $97',
      },
    ],
  },

  'zoom1-confirmation': {
    id: 'zoom1-confirmation',
    name: 'Zoom Booking Confirmation',
    description: 'Branded confirmation email with Zoom link and .ics calendar invite sent to the lead, plus 2-hour and 30-minute reminders, plus a coach notification. Single Zoom funnel (Zoom 1 / Zoom 2 split deprecated 2026-04-29).',
    trigger: 'Zoom booked',
    triggerDetail: 'Fires automatically whenever a lead books a Zoom call via bodyrecode.au/book or a manual booking is created in Business → Bookings.',
    steps: [
      {
        day: 'Immediately to lead',
        subject: 'Your strategy call is locked in: {date}',
        paragraphs: [
          'Hi {firstName},',
          'You are locked in. Here is what we will cover.',
          'We go through your scorecard together, identify the specific reason your body has stopped responding, and map out what to do first. Free. No pitch.',
          '[Date card: {date} · {time} Brisbane · 30 min · Join Zoom button]',
          'Open the attached file to add this to your calendar.',
        ],
        cta: 'Join Zoom ↗',
      },
      {
        day: '2 hours before, to lead (scheduled)',
        subject: 'Your strategy call starts in 2 hours',
        paragraphs: [
          'Hi {firstName},',
          'Your strategy call with Kade starts in 2 hours.',
          '[Date card: {date} · {time} Brisbane · 30 min · Join Zoom button]',
        ],
        cta: 'Join Zoom ↗',
      },
      {
        day: '30 minutes before, to lead (scheduled)',
        subject: 'Your strategy call starts in 30 minutes',
        paragraphs: [
          'Hi {firstName},',
          'Your strategy call with Kade starts in 30 minutes.',
          '[Date card: {date} · {time} Brisbane · 30 min · Join Zoom button]',
        ],
        cta: 'Join Zoom ↗',
      },
      {
        day: `Immediately to coach (${coach().email})`,
        subject: 'Zoom booked: {name}',
        paragraphs: [
          'Zoom booked: {name}',
          '{email}',
          '[Date & Time card: {date} · {time} Brisbane]',
          '[Join Zoom button + View Lead button]',
        ],
        cta: 'Join Zoom ↗  /  View Lead →',
      },
    ],
  },

  'program-buyer-nurture': {
    id: 'program-buyer-nurture',
    name: 'Program Buyer Nurture',
    description: '3-email sequence to bring self-guided program buyers back into coaching',
    trigger: 'Self-guided program purchased',
    triggerDetail: 'Fires automatically via Stripe webhook when a lead purchases the $97 self-guided program',
    steps: [
      {
        day: 'Week 4 (Day 28, 9am Brisbane)',
        subject: 'Four weeks in, {firstName}',
        paragraphs: [
          'Hi {firstName},',
          'By now you\'ve worked through Phase 1 of your program.',
          'Check in with yourself - how training is feeling, energy levels, recovery. If things are moving in the right direction, that\'s the program doing its job.',
          'If you want to go further - with someone reading what your body is doing and adjusting the approach in real time - that\'s what the call is for. 30 minutes. No obligation.',
        ],
        cta: 'Book a call →',
      },
      {
        day: 'Week 8 (Day 56, 9am Brisbane)',
        subject: 'The compounding point, {firstName}',
        paragraphs: [
          'Hi {firstName},',
          'Week 8 is where it gets interesting. Phase 2 loads the foundation you built in Phase 1.',
          'This is also when coaching makes the biggest difference. Your body is different now from where it was at the start. The approach should reflect that - not just follow a fixed plan.',
          'If you want that level of input on what you\'re doing, the call is 30 minutes.',
        ],
        cta: 'Book a call →',
      },
      {
        day: 'Week 12 (Day 84, 9am Brisbane)',
        subject: 'End of the program, {firstName}',
        paragraphs: [
          'Hi {firstName},',
          'You are at the end of 12 weeks. Most people do not finish. That matters.',
          'The question now is what it told you, and what comes next. Your body state shifts as your capacity builds. The next phase looks different from where you started, and it should be built around that.',
          'If you want to work out what that next phase looks like with proper support, book a call. 30 minutes. No obligation. Just a straight conversation about where you are and where you could go.',
        ],
        cta: 'Book a call →',
      },
    ],
  },

  // ─── Lead-stage manual triggers ─────────────────────────────────

  'send-booking-link': {
    id: 'send-booking-link',
    name: 'Send Booking Link',
    description: 'Manually email a lead the strategy-call booking link.',
    trigger: 'Coach clicks "Send booking link" on the lead detail page',
    triggerDetail: 'Use when a lead has not yet booked but you want to nudge them. Sends a single email with the bodyrecode.au/book link.',
    steps: [
      {
        day: 'Immediately on click',
        subject: '{firstName}, lock in your strategy call',
        paragraphs: [
          'Hi {firstName},',
          'Pick a time and we will go through your scorecard, identify the specific reason your body has stopped responding, and map out what to do first.',
          'Free. No pitch. Confirmation comes through straight away.',
        ],
        cta: 'Lock in a time →',
      },
    ],
  },

  'send-commencement-fee': {
    id: 'send-commencement-fee',
    name: 'Send Foundational Read Link',
    description: 'Manually email a lead the $297 Stripe checkout link to commence coaching.',
    trigger: 'Click "Send to Client" under Coaching Entry on the lead detail page, OR Path C in the Zoom companion',
    triggerDetail: 'Auto-triggered when Path C - Proceeding is selected in the Zoom companion. Can also be sent manually from the lead profile if needed.',
    steps: [
      {
        day: 'Immediately on click',
        subject: '{firstName}, your $297 Foundational Read link',
        paragraphs: [
          'Hi {firstName},',
          'Here is the $297 Foundational Read link to get started. This covers the full read I do on your body before coaching begins, so the program you start on is built around your actual state, not a template.',
          'Once payment is in, your portal access, intake, and the first foundational steps unlock automatically.',
        ],
        cta: 'Pay for your Foundational Read →',
      },
    ],
  },

  // ─── Client onboarding manual triggers ─────────────────────────

  'send-portal-email': {
    id: 'send-portal-email',
    name: 'Send Portal Email',
    description: 'Manually email a client their onboarding portal link.',
    trigger: 'Click "Send to Client" on the client profile after the Foundational Read is paid',
    triggerDetail: 'Magic-link sign-in (no password). Email previews the four onboarding steps the client will work through in their portal.',
    steps: [
      {
        day: 'Immediately on click',
        subject: '{firstName}, your portal is ready',
        paragraphs: [
          'Hi {firstName},',
          'Your portal is open. Four steps to complete before we start coaching: Coaching Agreement, Health Declaration, Foundational Intake (230 questions across 8 areas), and Baseline Documentation.',
          'Once your intake is in, your CFFS generates automatically. That is the read I work from to write your program. No template. Built around what your body is actually doing.',
        ],
        cta: 'Open my portal →',
      },
    ],
  },

  'send-subscription': {
    id: 'send-subscription',
    name: 'Send Subscription Link',
    description: 'Manually email a client their weekly subscription Stripe link.',
    trigger: 'Click "Send subscription" on the client profile, after CFFS has been reviewed and the coaching package is set',
    triggerDetail: 'Last step before coaching starts. Stripe link is package-specific (online, 2x in-person, or 3x in-person) and the price reflects launch rate if it is currently active.',
    steps: [
      {
        day: 'Immediately on click',
        subject: '{firstName}, lock in your weekly subscription',
        paragraphs: [
          'Hi {firstName},',
          'Your CFFS is in. Your program is being built around it. The last step before we start coaching is locking in your weekly subscription.',
          'Once payment is active, we lock in your sessions and set your start date. Usually three to seven days out.',
        ],
        cta: 'Set up subscription →',
      },
    ],
  },

  // ─── Client onboarding auto-fires ───────────────────────────────

  'intake-submitted': {
    id: 'intake-submitted',
    name: 'Foundational Intake Submitted',
    description: 'Coach notification when a client completes their 230-question intake.',
    trigger: 'Client submits Foundational Intake via portal',
    triggerDetail: 'Sends a coach notification email AND triggers automatic CFFS generation in the background via Claude. CFFS appears on the client profile a few seconds after submission.',
    steps: [
      {
        day: 'Immediately on submit',
        subject: '{name} submitted their intake',
        paragraphs: [
          '{name} has completed and submitted their foundational intake. CFFS generation is underway.',
          'Open the client profile to review the CFFS once it lands.',
        ],
        cta: 'Open client profile →',
      },
    ],
  },

  'baseline-submitted': {
    id: 'baseline-submitted',
    name: 'Baseline Documentation Submitted',
    description: 'Coach notification when a client uploads their baseline measurements + photos.',
    trigger: 'Client submits Baseline via portal',
    triggerDetail: 'Final onboarding step. Baseline data + photos are stored on the client record for week-over-week comparison.',
    steps: [
      {
        day: 'Immediately on submit',
        subject: '{name} submitted their baseline',
        paragraphs: [
          '{name} has submitted their baseline measurements and photos.',
          'Open the client profile to review.',
        ],
        cta: 'Open client profile →',
      },
    ],
  },

  'health-declaration-submitted': {
    id: 'health-declaration-submitted',
    name: 'Health Declaration Submitted',
    description: 'Coach notification when a client submits their health declaration.',
    trigger: 'Client submits Health Declaration via portal',
    triggerDetail: 'If the client flags conditions that require medical clearance, the email includes a "Medical clearance required" warning and the Foundational Intake stays locked until clearance is approved.',
    steps: [
      {
        day: 'Immediately on submit',
        subject: '{name} submitted their health declaration',
        paragraphs: [
          '{name} has submitted their health declaration.',
          'If medical clearance is required, the email flags this and intake stays locked until you review and approve it.',
        ],
        cta: 'Open client profile →',
      },
    ],
  },

  'clearance-uploaded': {
    id: 'clearance-uploaded',
    name: 'Medical Clearance Uploaded',
    description: 'Coach notification when a client uploads their medical clearance form.',
    trigger: 'Client uploads clearance file via portal',
    triggerDetail: 'Email includes a signed link to the uploaded file (private bucket, link expires in 7 days). Clearance must be approved manually before intake unlocks.',
    steps: [
      {
        day: 'Immediately on upload',
        subject: 'Medical clearance uploaded: {name}',
        paragraphs: [
          '{name} has uploaded their completed medical clearance form.',
          'Review and approve it in the dashboard.',
        ],
        cta: 'Open in dashboard →',
      },
    ],
  },

  'clearance-approved': {
    id: 'clearance-approved',
    name: 'Medical Clearance Approved',
    description: 'Email to client when coach approves their medical clearance. Unlocks Foundational Intake and Baseline.',
    trigger: 'Coach clicks Approve on the medical clearance review page',
    triggerDetail: 'Sets medical_clearance_received_at on the client record and emails the client to let them know onboarding is now fully unlocked.',
    steps: [
      {
        day: 'Immediately on approval',
        subject: '{firstName}, medical clearance approved',
        paragraphs: [
          'Hi {firstName},',
          'Your medical clearance has been reviewed and approved. Onboarding is now fully unlocked. The Foundational Intake and Baseline Documentation are open in your portal.',
          'Take your time with the intake. The more accurate it is, the better the read I get.',
        ],
        cta: 'Go to my portal →',
      },
    ],
  },

  // ─── Weekly + session automations ──────────────────────────────

  'weekly-checkin-submitted': {
    id: 'weekly-checkin-submitted',
    name: 'Weekly Check-In Submitted',
    description: 'Coach notification + client confirmation when a weekly check-in form is submitted.',
    trigger: 'Client submits Form A or Form B via portal',
    triggerDetail: 'Each week the client submits two forms. Form A covers training, load, recovery. Form B covers regulation, lifestyle, context. When both are in for a given week, CFWS generation is triggered.',
    steps: [
      {
        day: 'Immediately to coach',
        subject: '{name}, Week N check-in submitted',
        paragraphs: [
          'Form A or Form B has been submitted. A CFWS will generate once both are in for the week.',
        ],
        cta: 'View client profile →',
      },
      {
        day: 'Immediately to client',
        subject: 'Week N check-in received',
        paragraphs: [
          'Hi {firstName},',
          'Your Week N check-in has been received. I will review it and it will inform your coaching this week.',
        ],
        cta: '',
      },
    ],
  },

  'session-confirmed': {
    id: 'session-confirmed',
    name: 'Session Confirmed via Portal',
    description: 'Coach notification when a client confirms their face-to-face session via the one-click portal link.',
    trigger: 'Client clicks "Confirm session" link in their portal email',
    triggerDetail: 'Public confirm-session URL. Marks the session as confirmed and sends a coach notification with the session details.',
    steps: [
      {
        day: 'Immediately on click',
        subject: '{name} confirmed their session: {date}',
        paragraphs: [
          '{name} confirmed their attendance for the face-to-face session.',
          'Date, time, and location appear in the email.',
        ],
        cta: '',
      },
    ],
  },

  'session-booked-portal': {
    id: 'session-booked-portal',
    name: 'Session Booked via Portal',
    description: 'Client confirmation + coach notification when a client books a face-to-face session through their portal.',
    trigger: 'Client books a session via portal Sessions page',
    triggerDetail: 'Sends a confirmation to the client (with session details) and a notification to the coach. Used for face-to-face slot rescheduling.',
    steps: [
      {
        day: 'Immediately to client',
        subject: 'Session booked: {date} at {time}',
        paragraphs: [
          'Hey {firstName}, your session has been booked.',
          'Date, time, location, duration in the email. Changes can be made via the portal Sessions page.',
        ],
        cta: '',
      },
      {
        day: 'Immediately to coach',
        subject: '{name} booked a session: {date} at {time}',
        paragraphs: [
          '{name} has booked a face-to-face session via portal.',
          'Session details in the email.',
        ],
        cta: '',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#98A0AD', marginBottom: '32px' }}>
        <Link href="/dashboard/business/automations" style={{ color: '#98A0AD', textDecoration: 'none' }} className="hover:text-[#141821] transition-colors">
          Automations
        </Link>
        <span>/</span>
        <span style={{ color: '#3A3A3A' }}>{automation.name}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ width: '28px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '20px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#141821', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              {automation.name}
            </h1>
            <p style={{ fontSize: '14px', color: '#666D7A', lineHeight: 1.6 }}>{automation.description}</p>
          </div>
          <span style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
            color: '#1B6DFC', background: 'rgba(27,109,252,0.08)',
            border: '1px solid rgba(27,109,252,0.25)',
            padding: '5px 12px', borderRadius: '999px',
          }}>
            <Zap size={10} />
            Always active
          </span>
        </div>
      </div>

      {/* Trigger */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: '12px', padding: '20px 24px', marginBottom: '32px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#98A0AD', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Trigger</p>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#141821', marginBottom: '4px' }}>{automation.trigger}</p>
        <p style={{ fontSize: '13px', color: '#666D7A', lineHeight: 1.6 }}>{automation.triggerDetail}</p>
      </div>

      {/* Steps */}
      <p style={{ fontSize: '10px', fontWeight: 700, color: '#98A0AD', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
        Email Sequence - {automation.steps.length} emails
      </p>

      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: '19px', top: '40px', bottom: '40px', width: '1px', background: '#E8EAEE' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {automation.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '16px' }}>
              {/* Step number */}
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                background: '#FFFFFF', border: '1px solid #E8EAEE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', zIndex: 1,
              }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#98A0AD' }}>{i + 1}</span>
              </div>

              {/* Card */}
              <div style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: '12px', overflow: 'hidden', marginBottom: '4px' }}>

                {/* Step header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px solid #E8EAEE', background: '#F8F8F8' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1B6DFC' }}>{step.day}</span>
                  <span style={{ fontSize: '11px', color: '#98A0AD', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Email</span>
                </div>

                {/* Subject */}
                <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid #E8EAEE' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#98A0AD', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Subject</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#141821' }}>{step.subject}</p>
                </div>

                {/* Body */}
                <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid #E8EAEE' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#98A0AD', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Body</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {step.paragraphs.map((para, j) => (
                      <p key={j} style={{ fontSize: '13px', color: '#666D7A', lineHeight: 1.75 }}>{para}</p>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div style={{ padding: '14px 18px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#98A0AD', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>CTA</p>
                  <span style={{
                    display: 'inline-block', padding: '8px 16px',
                    background: '#1B6DFC', color: '#141821',
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
