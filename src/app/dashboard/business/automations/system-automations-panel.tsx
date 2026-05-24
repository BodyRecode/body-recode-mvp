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
  // Auth + standard portal sends
  {
    id: 'sign-in-code',
    name: 'Sign-in Code (OTP)',
    description: '6-digit one-time code emailed when a client requests sign-in to /portal/login. 10-minute expiry. Sign-in URL printed as plain text under the code so corporate Defender Safe Links can\'t lock the client out.',
    trigger: 'Client requests sign-in on portal login page',
    steps: 1,
  },
  // Reading published (auto on coach publish)
  {
    id: 'foundational-reading-published',
    name: 'Foundational Reading Published',
    description: 'Client-facing notification that their Foundational Reading (translation of the CFFS) is live in the portal.',
    trigger: 'Coach publishes the Foundational Reading from the CFFS',
    steps: 1,
  },
  {
    id: 'program-reading-published',
    name: 'Program Reading Published',
    description: 'Client-facing notification that a new training block is live in the portal, with the Program Reading at the top.',
    trigger: 'Coach publishes a Program Reading for a new training block',
    steps: 1,
  },
  {
    id: 'nutrition-reading-published',
    name: 'Nutrition Reading Published',
    description: 'Client-facing notification that a new nutrition plan is live in the portal, with the Nutrition Reading at the top.',
    trigger: 'Coach publishes a Nutrition Reading for a new nutrition plan',
    steps: 1,
  },
  // Cron-driven client emails
  {
    id: 'checkin-window-open',
    name: 'Weekly Check-in Window Open',
    description: 'Friday 6pm AEST cron. Email + SMS to all clients with an active program. Window closes Sunday 6pm.',
    trigger: 'Vercel cron weekly',
    steps: 1,
  },
  {
    id: 'checkin-window-closing',
    name: 'Weekly Check-in Window Closing',
    description: 'Sunday 5:30pm AEST cron. Email + SMS only to clients who haven\'t submitted yet. 1-hour final reminder.',
    trigger: 'Vercel cron weekly',
    steps: 1,
  },
  {
    id: 'checkin-confirmation',
    name: 'Weekly Check-in Confirmation',
    description: 'Sent automatically when a client submits a check-in form. Confirmation to client + notification to coach.',
    trigger: 'Client submits weekly check-in form',
    steps: 2,
  },
  {
    id: 'session-reminder',
    name: 'Session Reminder (day before)',
    description: 'Daily cron. Sent to clients who have a confirmed face-to-face session tomorrow.',
    trigger: 'Vercel cron daily',
    steps: 1,
  },
  {
    id: 'coaching-start-reminder',
    name: 'Coaching Start Reminder',
    description: 'Daily cron. Sent to a client whose coaching_started_at is tomorrow.',
    trigger: 'Vercel cron daily',
    steps: 1,
  },
  {
    id: 'onboarding-reminders',
    name: 'Onboarding Reminders (3/7/14 day)',
    description: 'Daily cron. Fires for each stalled onboarding task (agreement, health declaration, medical clearance, intake, baseline) at 3, 7, and 14 days. The 14-day mark is the last automated reminder. Intake reminders pause while medical clearance is outstanding; clearance reminders fire instead and stop once the client uploads the signed form.',
    trigger: 'Vercel cron daily',
    steps: 1,
  },
  {
    id: 'block-end-notifications',
    name: 'Block-end Notifications',
    description: 'Coach notification when a training block reaches its final week — flags that block-end check-in is due.',
    trigger: 'Vercel cron daily',
    steps: 1,
  },
  {
    id: 'medical-clearance-required',
    name: 'Medical Clearance Required',
    description: 'Conditional auto-fire. When a client\'s health declaration flags cardio symptoms or pregnancy/postpartum, an email goes out with the Medical Clearance card link.',
    trigger: 'Client submits health declaration with concerning answers',
    steps: 1,
  },
  {
    id: 'send-scheduled-subscriptions',
    name: 'Send Scheduled Subscriptions',
    description: 'Cron auto-send of a previously scheduled subscription link. Coach can pre-schedule a send date on the client profile; this cron picks them up when the date passes. Each link is a single-use Stripe Checkout Session, expires within 24 hours, cannot be re-completed.',
    trigger: 'Vercel cron daily',
    steps: 1,
  },
  {
    id: 'duplicate-subscription-guard',
    name: 'Duplicate Subscription Guard',
    description: 'Webhook safety net. If a client completes the subscription Payment Link a second time while already having an active subscription, auto-cancels the new Stripe sub before further charges land and emails Kade. Added 2026-05-22 after the Samantha triple-charge incident.',
    trigger: 'Stripe checkout.session.completed for an already-active client',
    steps: 1,
  },
  {
    id: 'lead-quality-weekly-report',
    name: 'Lead Quality Weekly Report',
    description: 'Scheduled remote Claude agent (runs on Anthropic infra, not Vercel cron) curls /api/admin/lead-quality-stats?email=true every Monday 9am Brisbane. Endpoint computes new leads by tier (green/yellow/red), all-time show + close rate per tier, and red-flagged vs clean comparison. Emails Kade a branded report with a verdict on whether the Hormozi red flag hypothesis is holding. Routine: trig_01UmzsNPJguEMZ3zTufciRZJ. Added 2026-04-29 when the qualifier questions launched on the scorecard.',
    trigger: 'Remote agent cron — Mondays 9am Brisbane (0 23 * * 0 UTC)',
    steps: 1,
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
  {
    id: 'send-intake',
    name: 'Send Foundational Intake Email',
    description: 'Manually email a client the link to their 208-question foundational intake.',
    trigger: 'Click "Send intake email" on the Intake row of the client profile',
    steps: 1,
  },
  {
    id: 'send-portal-orientation',
    name: 'Send Portal Orientation',
    description: 'Manually email a client the portal orientation walkthrough (3 mockups + plain-text URL).',
    trigger: 'Click "Send portal orientation" on the client profile',
    steps: 1,
  },
  {
    id: 'approve-clearance',
    name: 'Approve Medical Clearance',
    description: 'Marks the client\'s medical clearance as received and notifies them by email that onboarding is now fully unlocked.',
    trigger: 'Click "Approve clearance" on the client profile',
    steps: 1,
  },
  {
    id: 'supplementary-intake-email',
    name: 'Supplementary Intake Nudge (one-off extra)',
    description: 'The canonical "one-off extra" — emails the client the supplementary intake link on top of the system\'s default portal-only delivery. BCCs the coach so they have a copy in their inbox.',
    trigger: 'Click "Email link" on the Updates → Supplementary intake row, OR run scripts/send-supplementary-intake-email.mjs',
    steps: 1,
  },
  {
    id: 'weekly-checkin-feedback',
    name: 'Weekly Check-In Coach Feedback',
    description: 'Saves a 3-field response (Interpretation, optional Reframe, This week hold this) on a weekly check-in and emails the client. Click Generate response to have Claude draft all three fields from the check-in + synthesis + prior check-ins + active program (you review and approve before anything sends). Feedback also appears under the check-in in their portal. BCCs the coach. Re-saving overwrites the prior response and re-sends.',
    trigger: 'Click "Save and email client" on /dashboard/clients/[id]/checkins/[week]/[form]',
    steps: 1,
  },
  {
    id: 'inbox-reply',
    name: 'Inbox Reply (free-text)',
    description: 'Manually compose a custom email to a lead from the inbox view. Reply-To is set to kade@replies.bodyrecode.au so threading works.',
    trigger: 'Type a message in the lead inbox view, click Send',
    steps: 1,
  },
]

function AutomationRow({ a, href }: { a: typeof AUTOMATIC_AUTOMATIONS[0]; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 bg-stone-100 border border-stone-200 rounded-xl p-4 hover:border-stone-300 transition-colors group"
    >
      <div className="p-2 bg-blue-50 rounded-lg shrink-0">
        <Zap size={14} className="text-blue-500" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1A1A1A]">{a.name}</p>
        <p className="text-xs text-stone-500 mt-0.5">{a.description}</p>
        <p className="text-xs text-stone-400 mt-1">{a.trigger} · {a.steps} emails</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="flex items-center gap-1 text-xs font-medium text-blue-500">
          <Zap size={10} />
          Active
        </span>
        <ChevronRight size={14} className="text-stone-400 group-hover:text-stone-600 transition-colors" />
      </div>
    </Link>
  )
}

function ManualRow({ a, href }: { a: typeof MANUAL_AUTOMATIONS[0]; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 bg-stone-100 border border-stone-200 rounded-xl p-4 hover:border-stone-300 transition-colors group"
    >
      <div className="p-2 bg-amber-50 rounded-lg shrink-0">
        <Hand size={14} className="text-amber-700" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1A1A1A]">{a.name}</p>
        <p className="text-xs text-stone-500 mt-0.5">{a.description}</p>
        <p className="text-xs text-stone-400 mt-1">{a.trigger} · {a.steps} emails</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="flex items-center gap-1 text-xs font-medium text-amber-700">
          <Hand size={10} />
          Manual
        </span>
        <ChevronRight size={14} className="text-stone-400 group-hover:text-stone-600 transition-colors" />
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
        <p className="text-xs text-stone-400 mb-3">These fire when you explicitly trigger them from the lead page. Use them when a judgement call is needed.</p>
        <div className="space-y-2">
          {MANUAL_AUTOMATIONS.map((a) => (
            <ManualRow key={a.id} a={a} href={`/dashboard/business/automations/system/${a.id}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
