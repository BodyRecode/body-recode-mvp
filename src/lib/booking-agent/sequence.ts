/**
 * Booking Agent — sequence definition (the "brain's" cadence).
 *
 * Adapts Brian Mark's "0 to $100K/month" outreach idea into the Body Recode
 * system: for any lead who has not booked a call yet, work them toward a
 * booked strategy call through a short series of branded touches, then STOP
 * and hand to Kade the moment a call is booked.
 *
 * This file only describes WHAT the touches are and WHEN they fire. The copy
 * is written per-lead by the LLM (write-touch.ts) and assembled into a branded
 * email (assemble-email.ts). Under Option A, every touch is DRAFTED for Kade's
 * approval — nothing sends automatically.
 *
 * Two channels share this same sequence shape: 'email' (built now) and
 * 'ig_dm' (inbound Instagram DMs — pending Meta messaging permission). The
 * IG door reuses the same intents with shorter, chat-style copy.
 */

export type OutreachChannel = 'email' | 'ig_dm'

export interface TouchDef {
  /** Stable identifier stored on the outreach_touches row. */
  key: string
  /** 1-based position in the sequence (for display + ordering). */
  index: number
  /** Inngest sleep duration BEFORE this touch, measured from the previous
   *  touch (or from enrolment for the first touch). e.g. '1d', '3d'. */
  delay: string
  /** Short human label for the approval queue, e.g. "Intro". */
  label: string
  /** What this touch is trying to do — fed to the LLM as the brief. */
  intent: string
  /** Button label on the branded email CTA. */
  ctaLabel: string
  /** When true, the draft embeds real open slots from the availability engine
   *  (Vicki-style specific time offer) instead of a generic booking link. */
  offerSlots?: boolean
}

/**
 * The scorecard → booking email sequence.
 *
 * Cadence is deliberately restrained (four touches over ~12 days) so a warm
 * scorecard lead is followed up properly without the inbox fatigue of a hard
 * daily push. Every touch points at the same outcome: book a free strategy
 * call. Tune counts/timing here once we have real reply data.
 */
export const EMAIL_SEQUENCE: TouchDef[] = [
  {
    key: 'touch_1_intro',
    index: 1,
    delay: '1d',
    label: 'Intro',
    intent:
      "Reflect their scorecard result back in one or two lines, name the real (physiological, not willpower) reason their body has stalled, and invite them to a free 30-minute strategy call to walk through it. Warm, specific, no pitch.",
    ctaLabel: 'Book your free call',
  },
  {
    key: 'touch_2_insight',
    index: 2,
    delay: '3d',
    label: 'Insight',
    intent:
      "Give them ONE concrete, useful insight tied to their specific body state and fat-storage pattern — something they can act on today — then a soft reminder that the call is where we map the rest. Lead with value, not urgency.",
    ctaLabel: 'Grab a time to talk',
  },
  {
    key: 'touch_3_slots',
    index: 3,
    delay: '3d',
    label: 'Offer slots',
    intent:
      "Make it effortless to say yes: tell them you've held some times open this week and to reply (or tap) to lock one in. Reference that it's a 30-minute Zoom, free, no pitch. Mirror the tone of the Vicki time-offer email.",
    ctaLabel: 'Pick a time',
    offerSlots: true,
  },
  {
    key: 'touch_4_lastcall',
    index: 4,
    delay: '5d',
    label: 'Last call',
    intent:
      "Short and low-pressure. This is the last nudge in the sequence — let them know you won't keep chasing, the door stays open, and the call is there whenever the timing is right. One line, one link.",
    ctaLabel: 'Book whenever you are ready',
  },
]

/**
 * Lead statuses at which the agent should STOP working a lead — they've moved
 * past the "nurture toward a call" stage (booked, converted, or further down
 * the funnel). Anything NOT in this set is still fair game for outreach.
 */
export const STOP_STATUSES = new Set<string>([
  'zoom_1_booked',
  'zoom_1_completed',
  'zoom_2_booked',
  'zoom_2_completed',
  'commencement_fee_paid',
  'active_coaching',
])

/** Booking-agent lifecycle state stored on leads.booking_agent_state. */
export type BookingAgentState = 'active' | 'paused' | 'done' | null
