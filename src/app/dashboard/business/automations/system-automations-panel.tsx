'use client'

import { Zap, ChevronRight, Hand } from 'lucide-react'
import Link from 'next/link'
import { brand, coach } from "@/config/tenant";

const AUTOMATIC_AUTOMATIONS = [
  // Lead-stage automations
  {
    id: 'scorecard-followup',
    name: 'Scorecard Follow-up Sequence',
    description: '5-email sequence triggered when someone completes the Body State Scorecard. Buyer-language voice, alternates between $37 report and free strategy call. (One canonical workflow; a legacy em-dash duplicate was removed 2026-06-24 to stop double-sends.)',
    trigger: 'Scorecard completed',
    steps: 5,
  },
  {
    id: 'inbound-reply-forward',
    name: 'Inbound Reply Forward + Alert',
    description: `When anyone replies to an app-sent email (reply-to routes to replies.bodyrecode.au → Postmark inbound webhook), the full reply is forwarded to ${coach().email} with Reply-To set to the original sender, so Kade reads and answers it straight from his normal inbox - no dashboard trip needed. Known leads/clients also thread into Business → Inbox as a "Reply received" event; replies from unknown senders (which were previously logged-and-discarded) are now rescued to the inbox too, flagged as not-a-saved-contact. A window-gated SMS heads-up (Mon-Sat 08:30-20:00 AEST, to Kade's number) fires alongside so a reply is never missed. Forward + SMS are best-effort and never block the webhook.`,
    trigger: 'Inbound email reply (Postmark webhook)',
    steps: 3,
  },
  {
    id: 'support-ticket-notify',
    name: 'Support Ticket - New + Status Change',
    description: `Coach files a ticket in the Support drawer (bottom-left pill on any /dashboard page) → row lands in support_tickets and a branded email fires to ${coach().email} (accent = red for urgent, amber for bug, Signal Blue otherwise). Includes the page URL they were on when they filed. When Kade updates a ticket's status in /dashboard/support/{id} with the notify checkbox ticked, the filer gets an email with the status + any note verbatim, BCC'd to Kade. Both sends skip when the filer IS Kade (no self-email noise during testing).`,
    trigger: 'POST /api/support/tickets (new), PATCH /api/support/tickets/[id] (status change)',
    steps: 2,
  },
  // ─── Funnel B product portal sequences (fire once each product is launched via NEXT_PUBLIC_*_LIVE) ───
  {
    id: 'challenge-email-sequence',
    name: 'Challenge Email Sequence',
    description: 'Milestone emails across the free 14-Day Body Decode Challenge: welcome (sent synchronously on enrol), Day 5 Week One Progress Session unlock, and the Day 14 reveal. The Day 14 send branches - Body Decode Report if the Check-In was completed, plain ascension if not. Note there is no Day 7 email in this function; the Check-In is prompted by the separate Check-In Prompt sequence below.',
    trigger: 'challenge/enrolled Inngest event',
    steps: 3,
  },
  {
    id: 'challenge-checkin-prompt',
    name: 'Challenge Body Decode Check-In Prompt',
    description: 'Two emails that chase the Body Decode Check-In: one on Day 7 when it unlocks, one on Day 11 for anyone who still has not done it. Both link straight to the form. Auto-stops as soon as the Check-In is submitted or the enrolment goes inactive. Added 2026-08-03 because the Check-In gates the entire Day 14 pattern reveal but was previously asked for only by two SMS on Day 7 - completion sat at 7% against 75% for the Day 0 intake, so 17 of 18 finishers got the no-result fallback instead of the Body Decode Report.',
    trigger: 'challenge/enrolled Inngest event',
    steps: 2,
  },
  {
    id: 'challenge-intake-reminder',
    name: 'Challenge Day 0 Scorecard Reminder',
    description: 'Chases enrollers who have not completed the Day 0 Body Decode Intake (the in-portal scorecard). Two nudges - email + a matching SMS - at ~24h then ~72h after enrolment, both realigned to 7am AEST. The SMS routes through sendLeadSms so it is consent-gated (opted-in only, STOP-respecting, frequency-capped, logged to sms_logs); enrollers without SMS opt-in still get the email. Auto-stops the moment the intake is completed or the enrolment goes inactive, so completers are never chased. Closes the ~40% Day 0 scorecard leak for enrollers who arrived direct on /challenge.',
    trigger: 'challenge/enrolled Inngest event',
    steps: 2,
  },
  {
    id: 'challenge-sms-sequence',
    name: 'Challenge SMS Sequence',
    description: 'SMS nudges alongside the Challenge portal (daily nudge + milestone reminders). Consent + frequency capped. Dormant until the Challenge goes live.',
    trigger: 'challenge/enrolled Inngest event',
    steps: 2,
  },
  {
    id: 'blueprint-email-sequence',
    name: 'Blueprint Email Sequence',
    description: 'Onboarding + phase emails for the 6-Week Body Rewire Blueprint. Branded shell. Dormant until the Blueprint goes live.',
    trigger: 'blueprint/enrolled Inngest event',
    steps: 2,
  },
  {
    id: 'blueprint-week-advance',
    name: 'Blueprint Week Advance',
    description: 'Weekly block-progression emails through the Blueprint (one per week, Weeks 1-6), each with a check-in prompt + a 2-day reminder if the check-in is still outstanding. The reminder is also mirrored as a consent-gated SMS (opt-in only, STOP-respecting, capped 1/24h + 3/7d). Dormant until the Blueprint goes live.',
    trigger: 'blueprint/enrolled Inngest event (weekly step)',
    steps: 6,
  },
  {
    id: 'membership-week-advance',
    name: 'Membership Week Advance',
    description: 'Block-progression emails through the Membership (a new block every 6 weeks, Block A onward), each with a check-in prompt + a 2-day reminder if the check-in is still outstanding. The reminder is also mirrored as a consent-gated SMS (opt-in only, STOP-respecting, capped 1/24h + 3/7d). Dormant until the Membership goes live.',
    trigger: 'membership/enrolled Inngest event (recurring)',
    steps: 1,
  },
  {
    id: 'extension-week-advance',
    name: 'Extension Week Advance',
    description: 'Weekly "check-in due" nudge for extension blocks. Dormant until live.',
    trigger: 'extension/enrolled Inngest event (weekly step)',
    steps: 1,
  },
  {
    id: 'speed-to-lead-sms',
    name: 'Speed-to-Lead SMS',
    description: 'Contact-within-60s SMS on scorecard completion, challenge enrolment, waitlist join, report purchase, and Zoom no-show. Consent-checked, frequency-capped (1 per 24h + 3 per 7d), AEST window-aware. STOP triggers hard opt-out. Full audit log in sms_logs. Dashboard at /dashboard/sms.',
    trigger: 'scorecard/completed, challenge/enrolled, waitlist/joined, purchase/report, or booking/scheduled Inngest event',
    steps: 1,
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
    description: 'Coach notification when a client completes their 221-question intake. Also triggers automatic CFFS generation in the background.',
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
  {
    id: 'blood-panel-uploaded',
    name: 'Blood Test Results Uploaded',
    description: 'Coach notification when a client uploads blood test results from the Health Markers section of their portal. The file is read automatically and the markers are transcribed against the lab\'s own reference ranges. Nothing influences the plan until the coach reviews and clicks Approve for plan.',
    trigger: 'Client uploads blood test results via portal',
    steps: 1,
  },
  // Weekly + session automations
  {
    id: 'weekly-checkin-submitted',
    name: 'Weekly Check-In Submitted',
    description: 'Coach notification + client confirmation when a weekly check-in (Form A or Form B) is submitted. Triggers CFWS generation when both forms for the week are in. The check-in now also carries the training + nutrition review blocks (folded in 2026-07-23), so on submit it files the same program_reviews / nutrition_reviews rows and updates each plan direction.',
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
  // Plan published to client (manual, coach-gated). Reading-published auto-emails
  // scrapped 2026-06-09 — only plan publishes notify the client now.
  //
  // 2026-08-01: readings no longer PUBLISH on generation either. All three
  // (Foundational, Program, Nutrition) used to go live in the client portal the
  // instant they were generated, so nobody saw them before the client did. They
  // are now drafts until a coach publishes, and publishing runs a lint that
  // refuses on a blocking finding (unsourced life reference, a claim that
  // contradicts the live nutrition plan). See src/lib/reading-lint.ts.
  //
  // 2026-08-01: every client-facing scheduled job now filters on
  // clients.ended_at is null, so an offboarded client receives nothing. This is
  // the gate, NOT clients.active, which does not stop contact.
  {
    id: 'nutrition-plan-published-to-client',
    name: 'Nutrition Plan Published to Client',
    description: 'Client-facing notification that a new nutrition plan is live in the portal. Coach clicks Notify Client on the active plan view.',
    trigger: 'Coach clicks Notify Client on the active nutrition plan view (gated on plan is_active + Nutrition Reading published)',
    steps: 1,
  },
  {
    id: 'training-plan-published-to-client',
    name: 'Training Plan Published to Client',
    description: 'Client-facing notification that a new training block is live in the portal. Coach clicks Notify Client on the active program view.',
    trigger: 'Coach clicks Notify Client on the active program view (gated on program status=active + Program Reading published)',
    steps: 1,
  },
  {
    id: 'trajectory-reading-published-to-client',
    name: 'Block-End Trajectory Reading Published to Client',
    description: 'Client-facing notification that a block-end trajectory reading is in the portal. Mirror of the Program / Nutrition Notify Client pattern. Restored 2026-06-22 after 2026-06-09 scrap proved confusing — block-end readings are their own reflection moment and deserve their own coach-gated notification.',
    trigger: 'Coach clicks Notify Client on the trajectory reading panel (gated on trajectory_reading_published_at present)',
    steps: 1,
  },
  {
    id: 'weekly-checkin-draft-preview',
    name: 'Weekly Check-In Draft Preview (Coach)',
    description: 'Coach-only preview email of an auto-generated weekly check-in response, sent the moment the Inngest worker drafts it. Allows Kade to review, edit, send now, or skip from his inbox before the 4h scheduled-send fires.',
    trigger: 'Auto-response Inngest worker drafts a feedback row (between draft generation and 4h sleep)',
    steps: 1,
  },
  {
    id: 'weekly-checkin-auto-rescue',
    name: 'Weekly Check-In Auto-Response Rescue',
    description: 'Every 4h: re-fires the weekly-checkin/submitted Inngest event for any check-in that the auto-response pipeline never touched (auto_response_attempted_at IS NULL AND no feedback row AND submitted >6h ago AND client opted in). Safety net for transient Inngest delivery failures. Built 2026-06-14 after Ruby-Cate Week 6 silently dropped.',
    trigger: 'Vercel cron every 4h (0 */4 * * *)',
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
    id: 'program-log-nudge',
    name: 'Log-Your-Session Nudge',
    description: 'Daily 8:30pm Brisbane cron. If today is a client\'s prescribed training day and they haven\'t logged (or started) that session yet, sends one SMS with a link to the log screen. One-way sender, no reply CTA. Phone-gated (matches the check-in crons), with a built-in cap of 1 nudge/day and 3/7 days so it never nags. Skips clients who already logged, aren\'t training today, or have no active program.',
    trigger: 'Vercel cron daily (8:30pm AEST)',
    steps: 1,
  },
  {
    id: 'weekly-scorecard-pulse',
    name: 'Weekly Pulse (CEO Scorecard)',
    description: 'Monday 7am Brisbane cron. Freezes the week\'s scorecard into scorecard_snapshots, then emails Kade the CEO Dashboard already read: what flipped red, biggest movers vs last week, full metric table, and the 15-minute review steps. Internal report — to kade@ only, no client send.',
    trigger: 'Vercel cron weekly (Mon 7am AEST)',
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
    id: 'greg-session-reminder',
    name: 'In-Person Session Reminder (30 min before) — Greg',
    description: 'Standing SMS 30 minutes before Greg\'s fixed weekly in-person sessions with Kade (Mon 2pm, Wed 2pm, Fri 9am Brisbane). Fires at Mon/Wed 1:30pm and Fri 8:30am via two Vercel crons on one path. Each text is written fresh by Claude (Haiku) so it never repeats and can nod to what Greg is training that day (pulled safely from his active program — goal, block, today\'s focus; never weights or numbers), guided by an "about Greg" profile Kade can set in the route. If generation fails it falls back to a fixed coach-approved line, so a text always goes out. One-way "BodyRecode" sender, no reply CTA. Phone fetched fresh at runtime by client id, with a 25-minute dedup guard so a double fire never texts twice. Unlike the day-before Session Reminder (email, driven by client_sessions rows), this is a per-client standing schedule driven off the clock — Greg has no session rows.',
    trigger: 'Vercel cron (Mon/Wed 1:30pm + Fri 8:30am Brisbane)',
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
    id: 'subscription-started-notify',
    name: 'Subscription Started — Coach Notify',
    description: 'Emails Kade once per client when they complete the subscription checkout link and the first weekly payment clears. Closes the silent-success gap where subscription_active would flip to true without telling the coach — Kade had no signal that a Send Subscription link he sent was actioned. Includes package + price, first invoice amount, client email, and a deep link to the client #payments section. Recurring renewals stay silent by design.',
    trigger: 'Stripe checkout.session.completed (subscription mode, first start)',
    steps: 1,
  },
  {
    id: 'payment-failed-notify',
    name: 'Payment Failed — Coach Notify',
    description: 'Emails Kade on any failed subscription invoice — first checkout card decline AND renewal card decline. Rebuilt 2026-06-23 from a minimal version that only resolved client_id from invoice line metadata (which Stripe does NOT propagate to renewal invoices, so renewal failures slipped through silently). Now uses the same fallback chain as the success handler: line metadata → client_subscriptions → clients.stripe_customer_id. Email includes amount, attempt count, next retry date or "stopped retrying", and a direct client link so Kade can pause / message / collect.',
    trigger: 'Stripe invoice.payment_failed',
    steps: 1,
  },
  {
    id: 'lead-quality-weekly-report',
    name: 'Lead Quality Weekly Report',
    description: 'Scheduled remote Claude agent (runs on Anthropic infra, not Vercel cron) curls /api/admin/lead-quality-stats?email=true every Monday 9am Brisbane. Endpoint computes new leads by tier (green/yellow/red), all-time show + close rate per tier, and red-flagged vs clean comparison. Emails Kade a branded report with a verdict on whether the Hormozi red flag hypothesis is holding. Routine: trig_01UmzsNPJguEMZ3zTufciRZJ. Added 2026-04-29 when the qualifier questions launched on the scorecard.',
    trigger: 'Remote agent cron — Mondays 9am Brisbane (0 23 * * 0 UTC)',
    steps: 1,
  },
  {
    id: 'july27-gate-reminder',
    name: 'July 27 Gate Decision Reminder (one-shot)',
    description: 'macOS launchd plist au.bodyrecode.july27-gate.plist fires once at 8am on 27 July 2026. Runs ~/Dropbox/01_BODY_RECODE/07_ADS/july27_gate_reminder.py — sends a branded HTML email to kade@bodyrecode.au with the 7-step Option D Phase 2 action checklist: scale to $75/day ABO, unpause Perimenopausal + Slipping HP ad sets, stand up Blueprint retargeting, confirm Blueprint page live, shift Sunday promo rotation, lock Hook01 structure for Peri/HP briefing. One-shot — remove plist after it fires.',
    trigger: 'macOS launchd — 8am 27 July 2026 (one-shot)',
    steps: 1,
  },
  {
    id: 'meta-ads-weekly-report',
    name: 'Meta Ads Weekly Report',
    description: 'macOS launchd plist fires every Friday 9am Brisbane, running ~/Dropbox/01_BODY_RECODE/07_ADS/generate_report.py. Script reads the latest Meta Ads Manager .numbers or .csv export from the RAW_DATA folder, parses ad-set metrics (spend / reach / clicks / landing page views / CTR / CPC / CPM / Results / CPL), saves a Markdown copy to ANALYSIS/, and emails Kade a branded HTML report via Gmail SMTP (kade.dunstone@gmail.com → kade@bodyrecode.au). Campaign tracked: BR-FunnelB-Leads-2026Q3 (Option D Stage Gate strategy). NOT a Vercel or Inngest automation — runs entirely on Kade\'s MacBook via macOS Keychain for credentials.',
    trigger: 'macOS launchd — Fridays 9am Brisbane',
    steps: 1,
  },
  {
    id: 'digital-asset-instant-pdf',
    name: 'Digital Asset — Instant PDF Delivery',
    description: 'Phase A fulfilment branch. Stripe webhook receives checkout.session.completed for a digital_asset_purchase with fulfilment_kind=\'instant_pdf\' (Field Guides + Protocol Packs). Synchronously signs a 24h Supabase Storage URL, sends the branded delivery email, marks the purchase fulfilled with output_ref = signed URL. Lives at src/app/api/webhooks/stripe/route.ts::fulfilInstantPdf.',
    trigger: 'Stripe checkout.session.completed (instant_pdf)',
    steps: 1,
  },
  {
    id: 'digital-asset-instant-engine',
    name: 'Digital Asset — AI Deep-Dive (Instant Engine)',
    description: 'Phase C.9 fulfilment branch shipped 2026-06-08, extended 2026-06-10. Stripe webhook receives checkout.session.completed for a bolt_on_ai product (fulfilment_kind=\'instant_engine\'). Single-shot deep-dives: webhook sends the synchronous \"generating\" email and fires Inngest event digital_asset/engine_call → digitalAssetEngineFulfilmentFunction runs the matching engine (engine_call=\'trajectory\'|\'member_question\'|\'member_custom_block\'|\'cffs\'|\'fat_map\'|\'health_markers\'), stores output in digital_asset_purchases.raw.engine_output, renders the deep-dive page to PDF via puppeteer, uploads to library-assets/deep-dives/{purchase_id}.pdf, marks fulfilled, sends the \"ready\" email. Live single-shot engines: \'trajectory\' (coaching-client-only), \'member_question\' (open to any Member, pre-purchase question via Stripe session.metadata.question), \'member_custom_block\' (open to any Member, pre-purchase constraints via Stripe session.metadata.constraints). \'cffs\'|\'fat_map\'|\'health_markers\' throw until implemented.',
    trigger: 'Stripe checkout.session.completed (instant_engine, single-shot) → Inngest digital_asset/engine_call',
    steps: 3,
  },
  {
    id: 'weekly-pattern-report-sequence',
    name: 'Weekly Pattern Report — 4-Delivery Sequence',
    description: 'Phase C.9 sequence variant shipped 2026-06-10. When a Member buys the Weekly Pattern Report bolt-on (engine_call=\'weekly_pattern_report\'), the webhook fires Inngest event digital_asset/weekly_pattern_purchased instead of the single-shot one. weeklyPatternReportSequenceFunction picks it up, runs a 4-iteration loop with step.sleep(\'7d\') between deliveries (Inngest holds long sleeps natively). Each delivery creates a CHILD digital_asset_purchases row (stripe_session_id \'wpr_{parent_id}_{week_n}\' for idempotency) that links back to the parent in raw.parent_purchase_id with raw.delivery_number set; the child then flows through the EXISTING fulfilInstantEngine orchestrator using the same path as one-shot deep-dives. After delivery 4 the parent row is marked status=\'completed\'. Each delivery PDF + email is independent and stored under its own purchase id.',
    trigger: 'Stripe checkout.session.completed (Weekly Pattern Report) → Inngest digital_asset/weekly_pattern_purchased',
    steps: 9,
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
    description: 'Manually email a client the link to their 221-question foundational intake.',
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
    name: 'Weekly Check-In Coach Feedback (email-approve gate)',
    description: 'Saves a 3-field response (Interpretation, optional Reframe, This week hold this) on a weekly check-in and emails the client. 2026-06-15 change: nothing reaches the client until the coach approves. When clients.auto_checkin_response_enabled is true (default), the auto-response Inngest worker generates a draft 30 seconds after submission and emails the coach an [Approve] preview containing the client\'s full check-in answers + the drafted response + an Approve & Send button. Coach clicks the button → response goes to the client and BCCs the coach. Coach can also Send now / Edit / Skip from the dashboard /dashboard/clients/[id]/checkins/[week]/[form]. There is no silent auto-send. Feedback appears under the check-in in their portal. Re-saving overwrites the prior response and re-sends.',
    trigger: 'Manual: click "Save and email client" on /dashboard/clients/[id]/checkins/[week]/[form]. Or: click Approve & Send in the [Approve] preview email.',
    steps: 1,
  },
  {
    id: 'weekly-checkin-auto-response',
    name: 'Weekly Check-In Auto-Response Pipeline',
    description: '2026-06-15: silent 4h auto-send removed. Now the worker fires an Inngest event "weekly-checkin/submitted" on submission, waits 30s, checks per-client opt-out + skip flag + existing-feedback gate, generates the 3-field draft via Claude Haiku 4.5 with the CFFS-anchored rubric, inserts a weekly_checkin_feedback row (mints an approval_token at insert), then emails the coach an [Approve] preview with the client\'s full check-in answers + drafted response + Approve & Send button. The button hits /api/coach/approve-checkin-response?token=… which delivers the branded email to the client + BCCs the coach + stamps email_sent_at + coach_approved_at + logs to client_communications. Worker exits after the preview email — no sleep, no auto-send. On generation failure (3 retries hit jargon leaks etc.), stamps weekly_checkins.auto_response_failure_reason and exits. Per-client opt-out: clients.auto_checkin_response_enabled (default true).',
    trigger: 'Client submits a weekly check-in (Form A or B). Worker pipeline runs over ~30 seconds total; client receives the response only after coach approves.',
    steps: 5,
  },
  {
    id: 'draft-client-reply',
    name: 'Draft a Reply (AI, coach-approved)',
    description: 'Manual only, never automatic. "Draft a reply" on a client card in /dashboard/messages calls the drafting model with that client\'s own artefacts (Foundational Reading, program, nutrition plan, recent check-ins, intake, medications) plus the conversation and the anchor on their latest question. Returns text ONLY into the coach\'s reply box - writes nothing to client_messages and sends nothing to the client. The coach edits, sends via the normal reply path, or discards. Hard-bounded by scope of practice: forbidden from interpreting symptoms, commenting on medication, discussing test results, saying anything is "probably fine", or inventing prescription; anything clinical must route to the client\'s GP without a partial answer. Returns "NEEDS_COACH: <reason>" instead of a draft when it cannot answer safely from context. See src/lib/reply-draft-prompt.ts.',
    trigger: 'Click "Draft a reply" on a client card in /dashboard/messages',
    steps: 1,
  },
  {
    id: 'coach-message-reply',
    name: 'Coach Message Reply (client portal thread)',
    description: 'Email only. Clients are NOT sent an SMS for portal messages (removed 2026-07-29): the email already carries the preview and the portal link, so a text was a second interruption saying the same thing on a sender they cannot reply to. Reply to a client from /dashboard/messages. Writes the reply into client_messages as sender="coach" so it appears in the client\'s portal thread, then emails them the reply in full (BCC Kade) with a CTA back to /portal/{token}/message. The email quotes their most recent unanswered message for context, so they can read the answer without logging in. Sending also stamps responded_at + read_at on every outstanding message in that thread, clearing it from the "Awaiting reply" queue on the inbox and the Today dashboard. Logs to client_communications as kind "coach_message_reply". The email is best-effort: the reply is saved and visible in the portal even if Resend fails.',
    trigger: 'Type a reply on /dashboard/messages, click "Send reply"',
    steps: 1,
  },
  {
    id: 'inbox-reply',
    name: 'Inbox Reply (free-text)',
    description: `Manually compose a custom email to a lead from the inbox view. Reply-To is set to ${brand().replyToEmail} so threading works.`,
    trigger: 'Type a message in the lead inbox view, click Send',
    steps: 1,
  },
  {
    id: 'collective-eoi-emails',
    name: 'Collective EOI · Applicant Confirmation + Coach Notify (+ ready-tier SMS)',
    description: 'Fires immediately on any new expression of interest via POST /api/collective/submit (after the multi-step Fit Scorecard at bodyrecode.au/collective/apply). Three sends: (1) Collective-branded applicant confirmation to the coach who applied (BCC Kade) - warm-professional acknowledgment, 3-5 business day timeline, three-outcome "what happens next" card, does NOT reveal the internal fit tier; (2) Kade coach-notification from fromBrand() with prominent tier badge, dimension chips (method / audience / modality / readiness · green/amber/red), full applicant details table, mailto reply CTA; (3) ONLY IF tier === "ready": speed-to-lead SMS to Kade\'s whatsAppNumber during Mon-Sat 08:30-20:00 AEST (outside window = skip, no queue) with copy "BR Collective · Ready-tier application from {firstName}. Full details + reply CTA in your inbox." Both emails use the distinct Collective sub-brand (warm-charcoal + editorial "The Collective" wordmark). All three sends have independent try/catch - one failure never blocks the others, and the application row is already saved before any fire.',
    trigger: 'POST /api/collective/submit (silent-fail non-blocking)',
    steps: 3,
  },
  {
    id: 'product-waitlist-welcome-pair',
    name: 'Product-Waitlist Welcome + Coach-Notify Pair',
    description: 'Fires immediately on any NEW join to product_waitlist for challenge / blueprint / membership. Two emails: (1) branded welcome to the joiner (BCC Kade), state-matched copy per project_bodystate_stage_recommendation_mapping — Challenge (Depleted → doors open Mon 13 Jul), Blueprint (Transitioning → 6-week pattern-corrective work, opens Mon 20 Jul, $97 one-time), Membership (Ready → long-arc infrastructure, opens Mon 10 Aug, $49/week). Blueprint + Membership emails include a soft optional-Challenge card ("recommendation, not a gate") mirroring the scorecard result page. (2) Coach-notification to Kade only with lead details (email, phone, gender, body state, source, SMS opt-in). Skips re-clicks of the same (email, product) pair.',
    trigger: 'POST /api/product-waitlist (new row only, silent-fail non-blocking)',
    steps: 2,
  },
  // Terminal-triggered broadcast scripts (single-event launch comms)
  {
    id: 'launch-day-waitlist-email',
    name: 'Launch-Day Waitlist Email (terminal script)',
    description: 'Single-event broadcast on Mon 13 Jul 2026 7am AEST: every product_waitlist row gets a doors-open email, segmented by product. Includes AF Newstead founding-partner block (toggleable). Stamps notified_at to prevent double-send. Coach runs npx tsx scripts/launch-day-waitlist-email.ts (preview default, --live to broadcast).',
    trigger: 'Terminal script run on launch day: `npx tsx scripts/launch-day-waitlist-email.ts --live`',
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
