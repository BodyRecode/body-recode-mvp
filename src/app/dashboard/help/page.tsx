'use client'

import { useState, useEffect } from 'react'

const SECTIONS = [
  { id: 'operator-flow', title: 'Operator Flow', colour: 'violet' as const },
  { id: 'operator-flow-founder', title: 'Founder Operator Flow', colour: 'violet' as const },
  { id: 'lead-pipeline', title: '1. Lead Pipeline', colour: 'teal' as const },
  { id: 'zoom-1', title: '2. Zoom 1 Companion', colour: 'teal' as const },
  { id: 'orientation', title: '3. Orientation', colour: 'teal' as const },
  { id: 'zoom-2', title: '4. Zoom 2 Companion', colour: 'teal' as const },
  { id: 'coaching-entry', title: '5. Coaching Entry', colour: 'teal' as const },
  { id: 'post-conversion', title: '6. Post-Conversion', colour: 'teal' as const },
  { id: 'deliberate-start', title: '7. Deliberate Start', colour: 'teal' as const },
  { id: 'client-portal', title: '8. Client Portal', colour: 'teal' as const },
  { id: 'client-onboarding', title: '9. Client Onboarding', colour: 'teal' as const },
  { id: 'cffs', title: '10. CFFS', colour: 'teal' as const },
  { id: 'weekly-checkins', title: '11. Weekly Check-Ins', colour: 'teal' as const },
  { id: 'coaching-package', title: '12. Coaching Package', colour: 'teal' as const },
  { id: 'clients-dashboard', title: '13. Clients Dashboard', colour: 'teal' as const },
  { id: 'automated-status', title: '14. Automated Status', colour: 'teal' as const },
  { id: 'email-sequences', title: '15. Email Sequences', colour: 'teal' as const },
  { id: 'communications', title: '16. Communications', colour: 'teal' as const },
  { id: 'admin-actions', title: '17. Admin Actions', colour: 'teal' as const },
  { id: 'founding-client', title: '18. Founding Client', colour: 'teal' as const },
  { id: 'stripe-payments', title: '19. Stripe Payments', colour: 'teal' as const },
  { id: 'training-program', title: '20. Training Program', colour: 'teal' as const },
  { id: 'macro-arc', title: '21. Macro Training Arc', colour: 'teal' as const },
  { id: 'nutrition-plan', title: '22. Nutrition Plan', colour: 'teal' as const },
  { id: 'business-engine', title: 'Business Engine', colour: 'amber' as const },
  { id: 'be-crm', title: '23. CRM & Pipeline', colour: 'amber' as const },
  { id: 'be-bookings', title: '24. Bookings', colour: 'amber' as const },
  { id: 'be-automations', title: '25. Automations', colour: 'amber' as const },
  { id: 'be-campaigns', title: '26. Campaigns', colour: 'amber' as const },
  { id: 'be-funnels', title: '27. Funnels', colour: 'amber' as const },
  { id: 'be-inbox', title: '28. Inbox', colour: 'amber' as const },
  { id: 'be-payments', title: '29. Payments', colour: 'amber' as const },
  { id: 'be-analytics', title: '30. Analytics', colour: 'amber' as const },
  { id: 'be-ads', title: '31. Ads', colour: 'amber' as const },
  { id: 'be-content-engine', title: '32. Content Engine', colour: 'amber' as const },
]

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<string>('operator-flow')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    )

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Dashboard Guide</h1>
        <p className="text-stone-400 text-sm">How the Body Recode Performance Coaching system works — and why each part is structured the way it is.</p>
      </div>

      <div className="flex gap-8 items-start">

        {/* Sidebar */}
        <nav className="w-48 shrink-0 sticky top-8 self-start overflow-y-auto max-h-[calc(100vh-8rem)]">
          <ul className="space-y-0.5">
            {SECTIONS.map(({ id, title, colour }) => {
              const isActive = activeSection === id
              const activeColour = colour === 'violet' ? 'text-violet-400' : 'text-teal-400'
              return (
                <li key={id}>
                  <button
                    onClick={() => scrollTo(id)}
                    className={`w-full text-left text-xs px-3 py-1.5 rounded-lg transition-colors leading-snug ${
                      isActive
                        ? `${activeColour} bg-stone-800 font-semibold`
                        : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
                    }`}
                  >
                    {title}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* Operator Checklist */}
          <Section id="operator-flow" title="Operator Flow — Lead to Active Client" colour="violet">
            <p>Use this as your step-by-step reference for every lead. Every step in order, nothing skipped.</p>

            <div className="space-y-6 mt-2">

              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Phase 1 — Lead Arrives</p>
                <div className="space-y-2">
                  <ChecklistItem text="Lead submits the Performance Check-In quiz" />
                  <ChecklistItem text="Performance report is scheduled automatically — no action needed" />
                  <ChecklistItem text="Lead status moves to Report Sent" />
                  <ChecklistItem text="Follow-up email sequence begins automatically" />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Phase 2 — Zoom 1</p>
                <div className="space-y-2">
                  <ChecklistItem text="Lead books Zoom 1 via bodyrecode.au/book — or book manually from Business → Bookings" />
                  <ChecklistItem text="Open the Call Companion from the lead detail page before the call" />
                  <ChecklistItem text="Run the call through all 5 stages" />
                  <ChecklistItem text="Book Zoom 2 before ending the call — use the Book Zoom 2 field in the companion notes panel" />
                  <ChecklistItem text="Mark Zoom 1 Complete in the companion notes panel" />
                  <ChecklistItem text="Send the Orientation Guide from the lead detail page immediately after the call" />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Phase 3 — Zoom 2</p>
                <div className="space-y-2">
                  <ChecklistItem text="Confirm the lead has read the Orientation Guide before the call" />
                  <ChecklistItem text="Open the Zoom 2 Companion from the lead detail page before the call" />
                  <ChecklistItem text="Run the call through all 5 stages" />
                  <ChecklistItem text="Select the decision path at Stage 5 (A — Declined, B — Needs Time, C — Proceeding)" />
                  <ChecklistItem text="Path C only: select the pricing pathway (Full Rate, Founding Client, or Online)" />
                  <ChecklistItem text="Founding Client only: click Send Case Study Agreement before sending the commencement fee link" />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Phase 4 — Coaching Entry</p>
                <div className="space-y-2">
                  <ChecklistItem text="From the lead detail page, click Send to Client under Coaching Entry — this emails the $240 commencement fee link directly" />
                  <ChecklistItem text="Wait for the payment notification email to confirm payment received" />
                  <ChecklistItem text="Client profile, welcome email, and intake link are all created automatically — no action needed" />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Phase 5 — Client Setup</p>
                <div className="space-y-2">
                  <ChecklistItem text="Send the client their portal link — use the Send to Client button on the client profile, or copy it manually. The client signs in with their email address (magic link — no password)." />
                  <ChecklistItem text="Client completes all 4 onboarding steps via the portal: Coaching Agreement → Health Declaration → Foundational Intake → Baseline Documentation" />
                  <ChecklistItem text="You receive a notification email at each step as the client completes it" />
                  <ChecklistItem text="If medical clearance is required (flagged on health declaration), the portal shows an additional Medical Clearance step before intake unlocks" />
                  <ChecklistItem text="CFFS generates automatically once intake is submitted — review it on the client profile" />
                  <ChecklistItem text="Set the Coaching Package on the client profile (online, 2x, or 3x) and copy the subscription link" />
                  <ChecklistItem text="Send the subscription link to the client" />
                  <ChecklistItem text="Wait for the Subscription Active badge to appear on the client profile" />
                  <ChecklistItem text="Set the Coaching Start Date (3-7 days out) — do not set it before the subscription is active" />
                  <ChecklistItem text="Client receives a reminder email automatically the day before coaching begins" />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Phase 6 — Training Program</p>
                <div className="space-y-2">
                  <ChecklistItem text="Create a Macro Plan on the client profile — set the plan name and macro objective before generating any programs" />
                  <ChecklistItem text="Add the planned block sequence to the macro plan (phases, goals, durations, arcs)" />
                  <ChecklistItem text="Click Generate program → on the first block, or click Generate Program on the client profile" />
                  <ChecklistItem text="Review the Prescription Suggestion — read the reasoning for each field and correct any fields based on your direct assessment" />
                  <ChecklistItem text="Confirm equipment access, then click Approve & Generate Program (takes 30–60 seconds)" />
                  <ChecklistItem text="Review the full draft on the Training Program page — check sessions, blocks, exercises, and progression strategy" />
                  <ChecklistItem text="Click Approve Program to promote the draft to active" />
                  <ChecklistItem text="Each week, the client submits their training review via the portal — you see the results as a read-only feed on the Training Program page (direction, signal, adherence, notes). No data entry required on your side." />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Phase 7 — Nutrition Plan</p>
                <div className="space-y-2">
                  <ChecklistItem text="Click Generate Plan in the Nutrition Plan section on the client profile" />
                  <ChecklistItem text="Review the Prescription Suggestion — entry state, protein anchor, carb demand level, and reasoning. Edit any fields based on your assessment." />
                  <ChecklistItem text="Click Approve & Generate Plan (or Fill in manually instead if preferred)" />
                  <ChecklistItem text="Review the full draft on the Nutrition Plan page — meal structure, macros, training day adjustments, execution rules, and progression notes" />
                  <ChecklistItem text="Click Approve Plan to promote the draft to active" />
                  <ChecklistItem text="Each week, the client submits their nutrition review via the portal — you see the results as a read-only feed on the Nutrition Plan page. No form to fill in on your side." />
                </div>
              </div>

            </div>
          </Section>

          {/* Founder Operator Flow */}
          <Section id="operator-flow-founder" title="Founder Operator Flow" colour="violet">
            <p>Two paths lead to a Founder Client conversion. Follow the track that matches how the person entered.</p>

            <div className="space-y-6 mt-2">

              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Track A — Online Application</p>
                <p className="text-sm text-stone-400 mb-3">Person finds the landing page, reads the offer, and applies directly. No Zoom calls are required before entry.</p>
                <div className="space-y-2">
                  <ChecklistItem text="Applicant visits performance.bodyrecode.au/founder and clicks Apply" />
                  <ChecklistItem text="They complete the Performance Check-In quiz (source is tagged as Founder Program automatically)" />
                  <ChecklistItem text="A lead is created in the dashboard — check the Leads page, filter by Founder Program to find them" />
                  <ChecklistItem text="Open the lead detail page — the Founder Client Application section appears at the top" />
                  <ChecklistItem text="Review their check-in answers to assess fit" />
                  <ChecklistItem text="Set the application status: Under Review (default), Accepted, Declined, or Waitlisted" />
                  <ChecklistItem text="If accepted: send them a personal message to confirm and arrange a brief onboarding call if needed" />
                  <ChecklistItem text="Decrement the Positions Available counter on the Dashboard homepage — do this when you accept, not when they apply" />
                  <ChecklistItem text="From the lead detail page, send the Case Study Agreement link — it must be signed before the commencement fee is sent" />
                  <ChecklistItem text="Once signed, send the commencement fee link ($240) from Coaching Entry" />
                  <ChecklistItem text="Client profile, welcome email, and intake link are created automatically on payment — no action needed" />
                  <ChecklistItem text="Send the client their portal link via the Send to Client button on the client profile" />
                  <ChecklistItem text="Client completes onboarding: Coaching Agreement, Health Declaration, Foundational Intake, Baseline Documentation" />
                  <ChecklistItem text="CFFS generates automatically once intake is submitted — review it on the client profile" />
                  <ChecklistItem text="Set the Coaching Package to Online (Founding Client) — $74.50/week" />
                  <ChecklistItem text="Send the subscription link to the client" />
                  <ChecklistItem text="Wait for Subscription Active badge, then set the Coaching Start Date (3–7 days out)" />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Track B — Zoom 2 Conversion (Price Objection)</p>
                <p className="text-sm text-stone-400 mb-3">Lead is already in the pipeline. They complete Zoom 1, receive the Orientation Guide, attend Zoom 2, and object to the full rate at Stage 5.</p>
                <div className="space-y-2">
                  <ChecklistItem text="Run Zoom 2 as normal through all 5 stages" />
                  <ChecklistItem text="At Stage 5, lead objects to price — use the Objection-Triggered script in the Zoom 2 companion" />
                  <ChecklistItem text="Step 1: reflect the objection back. Step 2: reframe the investment. Step 3: introduce the Founding Client program if they still need it." />
                  <ChecklistItem text="If they accept: select Path C and choose Founding Client (Objection-Triggered) in the decision panel" />
                  <ChecklistItem text="Click Send Case Study Agreement — agreement must be signed before the commencement fee is sent" />
                  <ChecklistItem text="Decrement the Positions Available counter on the Dashboard homepage" />
                  <ChecklistItem text="Once signed, send the commencement fee link ($240) from Coaching Entry" />
                  <ChecklistItem text="Client profile, welcome email, and intake link are created automatically on payment — no action needed" />
                  <ChecklistItem text="Send the client their portal link via the Send to Client button on the client profile" />
                  <ChecklistItem text="Client completes onboarding: Coaching Agreement, Health Declaration, Foundational Intake, Baseline Documentation" />
                  <ChecklistItem text="CFFS generates automatically once intake is submitted — review it on the client profile" />
                  <ChecklistItem text="Set the Coaching Package to the correct Founding Client tier (Online, 2x, or 3x)" />
                  <ChecklistItem text="Send the subscription link to the client" />
                  <ChecklistItem text="Wait for Subscription Active badge, then set the Coaching Start Date (3–7 days out)" />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Track C — Zoom 2 Conversion (Manual Override)</p>
                <p className="text-sm text-stone-400 mb-3">Lead is a strong fit and you proactively offer the program before any price objection. Use the qualification checklist in the Zoom 2 companion before this track — all four criteria must be met.</p>
                <div className="space-y-2">
                  <ChecklistItem text="Confirm all four qualification criteria are met before making the offer (check the Manual Override tab in the Zoom 2 companion)" />
                  <ChecklistItem text="Run Zoom 2 as normal — introduce the offer at Stage 5 before presenting full-rate pricing" />
                  <ChecklistItem text="If they accept: select Path C and choose Founding Client (Manual Override) in the decision panel" />
                  <ChecklistItem text="Click Send Case Study Agreement — must be signed before the commencement fee is sent" />
                  <ChecklistItem text="Decrement the Positions Available counter on the Dashboard homepage" />
                  <ChecklistItem text="Once signed, send the commencement fee link ($240) from Coaching Entry" />
                  <ChecklistItem text="Follow the same steps as Track B from coaching entry onward" />
                </div>
              </div>

            </div>
          </Section>

          {/* Section 1 */}
          <Section id="lead-pipeline" title="1. Lead Pipeline" colour="teal">
            <p>Every potential client enters the system as a <strong>lead</strong>. Leads are created manually or automatically when someone submits the performance check-in quiz.</p>
            <p>On the lead detail page, the <strong>Contact</strong> section has an <strong>Edit</strong> link that lets you update the lead&apos;s name, email, and phone number directly from the dashboard without going to Supabase.</p>
            <p>Leads move through statuses as they progress:</p>
            <StatusList items={[
              { label: 'New Check-In', desc: 'Quiz submitted, report not yet sent.' },
              { label: 'Report Sent', desc: 'Performance report scheduled and sent to the lead.' },
              { label: 'Cold - No Booking', desc: 'Report sent but no Zoom 1 booked after follow-ups.' },
              { label: 'Zoom 1 Booked', desc: 'First consultation booked.' },
              { label: 'Zoom 1 Completed', desc: 'First consultation done.' },
              { label: 'Closed - No Show', desc: 'Lead did not attend. Re-engagement sequence available.' },
              { label: 'Zoom 2 Booked', desc: 'Orientation review and pricing call booked.' },
              { label: 'Zoom 2 Completed', desc: 'Pricing conversation completed.' },
              { label: 'Closed - Declined', desc: 'Lead decided not to proceed.' },
              { label: 'Commencement Fee Paid', desc: 'Payment received. Client profile created automatically.' },
              { label: 'Active - Deliberate Start', desc: 'In the 3-7 day window before coaching begins.' },
              { label: 'Active Coaching', desc: 'Coaching underway.' },
            ]} />
            <Training title="Why statuses matter">
              <p>The pipeline exists to tell you exactly where every lead is at a glance — and where the system is getting stuck. If you have 12 leads sitting at Report Sent with no Zoom 1 booked, that is a data point, not a coincidence. It means the report landed but didn&apos;t create enough pull to book the call.</p>
              <p className="mt-2">Cold - No Booking is not a failure status. It means the timing wasn&apos;t right when the sequence ran. These leads still have their data on file — they&apos;re candidates for the re-engagement blast when you&apos;re ready to run it.</p>
              <p className="mt-2">Closed - Declined and Closed - No Show are both recoverable. They go into the re-engagement pool. Don&apos;t treat them as dead.</p>
            </Training>
          </Section>

          {/* Section 2 */}
          <Section id="zoom-1" title="2. Zoom 1 - Call Companion" colour="teal">
            <p>Open the <strong>Call Companion</strong> from the lead detail page before or during Zoom 1. It opens in a new tab so you can run it alongside the Zoom call.</p>
            <p>The companion has 5 stages:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
              <li><strong>Opening</strong> — Set context, explain the purpose of the call.</li>
              <li><strong>Check-In Review</strong> — Walk through the lead&apos;s quiz responses.</li>
              <li><strong>Signal Exploration</strong> — Explore SLS, RPS, and RILS signal areas using structured prompts.</li>
              <li><strong>Pattern Interpretation</strong> — Name the dominant pattern using signal-specific language.</li>
              <li><strong>Close</strong> — Confirm the report, next steps, and Zoom 2 booking.</li>
            </ol>
            <p>The notes panel on the right contains three persistent actions available at any stage:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Book Zoom 2</strong> — enter the date and confirm directly from the companion. Updates the lead record and status to Zoom 2 Booked without leaving the call.</li>
              <li><strong>Mark Zoom 1 Complete</strong> — updates lead status. Available at any stage, not just Stage 5.</li>
              <li><strong>Readiness Check</strong> — A (ready), B (hesitant), C (not right fit). Use it to anchor your read before Stage 5.</li>
            </ul>
            <p>After the call, switch to <strong>Post-Call</strong> view, paste the Zoom transcript, and generate an AI summary. Click <strong>Save to lead notes</strong> to persist it to the lead record — it won&apos;t survive a page refresh otherwise.</p>
            <Note>Scripts and prompts are personalised to each lead&apos;s signal levels (SLS, RPS, RILS). Stage 3 prompts are grouped by category (Training, Recovery, Consistency, Pressure) with sub-questions indented below each.</Note>
            <Training title="What Zoom 1 is actually for">
              <p><strong>Zoom 1 is not a sales call.</strong> There is nothing to sell yet. The only job in this call is to make the lead feel correctly understood and to build the interpretation that the report is based on something real, not generic.</p>
              <p className="mt-2">The reason this matters for Zoom 2 is simple: if a lead doesn&apos;t trust the report, price becomes the only thing they can evaluate. If they do trust the report, they are evaluating whether this is the right intervention — which is a completely different conversation.</p>
              <p className="mt-2">The signal exploration in Stage 3 gives you the language for Stage 3 of Zoom 2. The hot spot you name in Zoom 2 should come directly from what surfaced in Zoom 1. Keep your notes panel updated — those notes are what you&apos;ll reference two calls later.</p>
              <p className="mt-2">The Close in Stage 5 has one goal: get Zoom 2 booked before the call ends. The orientation guide you send after Zoom 1 is not a follow-up — it&apos;s a warm handoff that does cognitive work for you before Zoom 2 even happens.</p>
            </Training>
          </Section>

          {/* Section 3 */}
          <Section id="orientation" title="3. Orientation" colour="teal">
            <p>After Zoom 1, send the <strong>Orientation Guide</strong> from the lead detail page. This emails the lead a branded link to the orientation page at <strong>app.bodyrecode.au/orientation</strong> — no PDF attachment.</p>
            <p>The guide covers what Body Recode Performance Coaching is, what to expect, and how to prepare for Zoom 2. The lead should read it before the second call.</p>
            <p>Once sent, the section shows the date it was sent. Click <strong>View Guide</strong> to preview the page as the client sees it.</p>
            <Training title="Why this step exists between the two calls">
              <p>Most coaches go straight from a discovery call to a pricing call. The gap between Zoom 1 and Zoom 2 is intentional — it is not dead time.</p>
              <p className="mt-2">The orientation guide does cognitive work that you cannot do live. It explains the framework, sets expectations, and begins the mental shift from &quot;I&apos;m thinking about this&quot; to &quot;I understand what I&apos;m walking into.&quot; A lead who arrives at Zoom 2 having read the guide is in a completely different state than one who hasn&apos;t.</p>
              <p className="mt-2">If a lead comes into Zoom 2 not understanding what the program actually is, the pricing conversation becomes a negotiation about cost rather than a decision about fit. The guide removes that friction before it can happen.</p>
              <p className="mt-2">Send it the same day as Zoom 1 while the conversation is fresh in their mind.</p>
            </Training>
          </Section>

          {/* Section 4 */}
          <Section id="zoom-2" title="4. Zoom 2 - Call Companion" colour="teal">
            <p>Open the <strong>Call Companion</strong> from the lead detail page before Zoom 2. It opens in a new tab at <strong>/companion/[id]/zoom-2</strong> — outside the dashboard so it runs full screen during the call.</p>
            <p>The companion has 5 stages:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
              <li><strong>Report Review</strong> — Ensure the lead has read and understood the report correctly.</li>
              <li><strong>Emotional Acknowledgement</strong> — Normalise confusion and confidence erosion.</li>
              <li><strong>Hot Spot Framing</strong> — Name the specific point from Zoom 1 where effort and response stopped aligning.</li>
              <li><strong>Pricing</strong> — Present the coaching structure and packages as information, not persuasion.</li>
              <li><strong>Decision</strong> — Identify the path and close cleanly.</li>
            </ol>

            <Training title="The sales logic behind each stage">
              <p><strong>Stage 1 — Report Review.</strong> Don&apos;t assume they read it, or that they understood it correctly. A lead who misread the report will evaluate everything that follows against the wrong mental model. You&apos;re checking comprehension, not quizzing them. If they interpreted something incorrectly, correct it now — before pricing. The transition out of Stage 1 is: &quot;Good — that&apos;s exactly what I needed to know. Let&apos;s keep going.&quot;</p>
              <p className="mt-2"><strong>Stage 2 — Emotional Acknowledgement.</strong> Before pricing lands, the lead needs to feel heard. Confusion and confidence erosion are common in people who have been trying and not getting results. If you skip this stage, the lead feels like you ran through a report and jumped straight to selling. This stage doesn&apos;t need to be long — but it must be done. The transition is: &quot;Good — I want to come back to something specific you mentioned earlier.&quot;</p>
              <p className="mt-2"><strong>Stage 3 — Hot Spot Framing.</strong> This is the bridge between &quot;I understand my situation&quot; and &quot;I understand why I need help with it.&quot; Name the specific thing from Zoom 1. This is not a generic pitch — it should sound like you were listening. If you named it right, they&apos;ll feel seen. That feeling is what makes pricing land differently. Do not move to pricing until this is done.</p>
              <p className="mt-2"><strong>Stage 4 — Pricing.</strong> Lead with in-person 2x ($299/week). Present it as information, not a pitch. You&apos;re telling them what the structure looks like — not trying to convince them. After you say the number: pause. Let it land. Do not fill the silence. The silence is not awkward — it is the lead processing. The moment you start talking to fill it, you&apos;ve signalled that you&apos;re nervous about the price, and they will take their cue from you.</p>
              <p className="mt-2"><strong>Stage 5 — Decision.</strong> Three possible paths. Know which one you&apos;re in before you respond.</p>
            </Training>

            <p className="mt-1">The companion has five tabs:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Script &amp; Prompts</strong> — Full verbatim script and stage-by-stage prompts for the call.</li>
              <li><strong>Objection-Triggered</strong> — Three-step script for making the Founding Client offer after a price objection. Step 1: handle the objection. Step 2: introduce the program. Step 3: walk them through the details if they want to know more — covers minimum commitment, what gets documented, consent tiers, and the signing sequence.</li>
              <li><strong>Manual Override</strong> — Script for proactively offering the Founding Client program to a high-suitability lead before any objection arises. Includes a four-point qualification checklist — all four must be true before using this tab.</li>
              <li><strong>Online Coaching</strong> — Fallback script if the lead objects to in-person pricing and online is appropriate.</li>
              <li><strong>Signal Reference</strong> — Quick view of the lead&apos;s SLS, RPS, and RILS levels mid-call.</li>
            </ul>

            <Training title="When to use each tab">
              <p><strong>Objection-Triggered.</strong> The script in this tab exists so you don&apos;t have to improvise a price objection response live. Improvising usually ends in one of two places: you discount, or you retreat. The script holds the position. The first move is always to repeat the objection back — so the lead knows you heard them, and so you both agree on what you&apos;re actually responding to. Then you reframe the investment. Then, if they still need it, introduce the Founding Client program as the second offer.</p>
              <p className="mt-2"><strong>Manual Override.</strong> This tab is not a convenience tool for leads who can&apos;t afford the full rate. It is for a specific type of lead where the data capture value is genuinely high and the case study potential is strong. The four-point checklist exists because the program has limited positions — using them on the wrong person closes the door on the right one. Read the checklist carefully before using it.</p>
              <p className="mt-2"><strong>Online Coaching.</strong> Online is a real product, not a consolation offer. If a lead&apos;s situation genuinely calls for it, present it that way. Don&apos;t frame it as second-best.</p>
              <p className="mt-2"><strong>Signal Reference.</strong> Use this if you need a quick reminder of the lead&apos;s signal levels mid-call without switching away from the companion.</p>
            </Training>

            <p className="mt-1">At Stage 5, three decision path buttons appear in the notes panel:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Path A — Declined</strong> — Updates lead status to Closed Declined.</li>
              <li><strong>Path B — Needs Time</strong> — Updates lead status to Zoom 2 Completed.</li>
              <li><strong>Path C — Proceeding</strong> — A pathway selector appears. Choose from Full Rate, Founding Client (Objection Triggered), Founding Client (Manual Override), or Online. For Founding Client pathways a <strong>Send Case Study Agreement</strong> button appears — click it to email the signing link to the lead. The commencement fee is sent only after the agreement is signed.</li>
            </ul>

            <Training title="How to handle each decision path">
              <p><strong>Path A — Declined.</strong> Clean close. Do not re-pitch. Say what the script says — the report still stands, they now have a clearer read on what&apos;s going on, the door is open if anything changes. Do not undersell yourself or your time to keep them interested. A clean exit is better than a desperate one.</p>
              <p className="mt-2"><strong>Path B — Needs Time.</strong> The most important thing here is diagnosing what&apos;s actually sitting with them. &quot;I need to think about it&quot; is not a decision — it&apos;s a pause with a reason behind it. The script asks directly: is it the investment, whether this is the right fit, or something else? Each answer takes you to a different response. And you set a specific follow-up date before the call ends. &quot;I&apos;ll check back in with you&quot; is not a follow-up. A date is a follow-up.</p>
              <p className="mt-2"><strong>Path C — Proceeding.</strong> Select the correct pathway before clicking anything. The pathway you select determines what gets recorded on the lead&apos;s profile and what the Founding Client section on their client profile will show. For Founding Client pathways, send the agreement before the commencement fee. This is the order. Do not deviate from it.</p>
            </Training>

            <Note>Lead with in-person 2x ($299/week). Only introduce online ($149/week) if the lead objects to the price. The 3x in-person package ($409/week) is not presented at Zoom 2 — it is coach-assessed and offered during weekly check-ins once coaching is underway. Founding client rates: 2x $149.50/week, 3x $204.50/week, online $74.50/week.</Note>
          </Section>

          {/* Section 5 */}
          <Section id="coaching-entry" title="5. Coaching Entry" colour="teal">
            <p>From the lead detail page, the Coaching Entry section has two options:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Send to Client</strong> — generates a unique Stripe checkout link and emails it directly to the lead in a branded email. One click.</li>
              <li><strong>Copy Link</strong> — generates the link and copies it to your clipboard for manual sending.</li>
            </ul>
            <p>When the client pays:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
              <li>You receive an email notification immediately confirming the payment.</li>
              <li>Their client profile is created automatically.</li>
              <li>Their welcome email and intake link are sent to them immediately.</li>
              <li>The lead status updates to <strong>Commencement Fee Paid</strong>.</li>
            </ol>
            <p>The lead detail page will then show a <strong>View client profile</strong> link.</p>
            <Note>A manual Convert to Client button is also available as a fallback if needed.</Note>
            <Training title="Why the commencement fee exists">
              <p>The $240 commencement fee is not a deposit. It is a commitment signal. It separates people who are interested from people who are ready. Someone who pays the commencement fee has moved from considering the program to entering it. That psychological shift matters — it changes how they engage with everything that follows.</p>
              <p className="mt-2">The automation triggered by this payment (profile creation, welcome email, intake link) removes the most failure-prone handover in the entire process. Manual client creation is where admin errors happen. Tying it to the payment makes it impossible to miss.</p>
            </Training>
          </Section>

          {/* Section 6 */}
          <Section id="post-conversion" title="6. Post-Conversion Sequence" colour="teal">
            <p>Once the commencement fee is paid, the following happens automatically and in order:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
              <li>Client profile created in the Clients dashboard.</li>
              <li>Welcome email sent to the client with their intake link.</li>
              <li>Client completes the foundational intake (208 questions, 15-20 min).</li>
              <li>CFFS generated automatically and appears on the client profile.</li>
            </ol>
            <p>Your manual steps after conversion:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
              <li>Set the <strong>Coaching Package</strong> (online, 2x, or 3x) on the client profile and copy the subscription link to send to the client.</li>
              <li>When the client pays, the Coaching Package section shows a <strong>Subscription Active</strong> badge automatically.</li>
              <li>Once both payments are confirmed, set the <strong>Coaching Start Date</strong> (3-7 days out).</li>
              <li>Client receives a reminder email the day before coaching begins.</li>
            </ol>
            <Note>Coaching does not start until both the commencement fee and the weekly subscription payment are received. Wait for the Subscription Active badge before setting the start date.</Note>
            <Training title="Why this sequence is ordered this way">
              <p>The commencement fee comes first, then the subscription. The commencement fee creates the client. The subscription funds ongoing coaching. Starting coaching before the subscription is active means you are working without confirmation that payment is in place. The Subscription Active badge is your signal that it is safe to set the start date.</p>
              <p className="mt-2">The intake link goes out immediately after payment — not 24 hours later. Momentum is highest right after the payment decision. If you delay the intake, you delay the CFFS, which delays the start date, which delays coaching. The automation handles the immediate send so no action is required on your end.</p>
            </Training>
          </Section>

          <Section id="deliberate-start" title="7. Deliberate Start Window" colour="teal">
            <p>After conversion, set the <strong>Coaching Start Date</strong> on the client profile. This is the date coaching officially begins — typically 3-7 days after the commencement fee is paid.</p>
            <p>Until the start date:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li>The client dashboard shows a <strong>Starts in Xd</strong> badge.</li>
              <li>The client gets a reminder email the day before coaching begins.</li>
            </ul>
            <p>The start date is also used to calculate the client&apos;s week number for check-ins and CFWS generation.</p>
            <Training title="Why not start immediately">
              <p>The 3-7 day window is not admin lag. It is intentional. The client needs psychological preparation time — a moment between deciding to do something and actually doing it. Starting immediately after payment can feel reactive. Starting after a deliberate lead-in period signals that this is a structured process, not an impulse.</p>
              <p className="mt-2">The window also gives the client time to complete their intake before coaching begins. The CFFS informs your first week of coaching. If the intake isn&apos;t done yet, don&apos;t set the start date.</p>
            </Training>
          </Section>

          {/* Section 7 */}
          <Section id="client-portal" title="8. Client Portal" colour="teal">
            <p>Every client has a personal portal at <strong>app.bodyrecode.au/portal/[token]</strong>. This is their single entry point for all onboarding steps, weekly check-ins, and reviewing their program and nutrition plan.</p>
            <p>Send the portal link from the client profile using <strong>Send to Client</strong> (emails the client directly) or <strong>Copy Portal Link</strong> (copies to clipboard for manual sending).</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-2 mb-1">Sign-in</p>
            <p>The portal is protected by email-based authentication. When a client visits their portal link, they are directed to <strong>/portal/login</strong> where they enter their email address and receive a magic sign-in link. Clicking that link signs them in automatically and lands them on their portal. No password required. A <strong>Sign out</strong> button appears in the portal header at all times.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-2 mb-1">What the portal shows</p>
            <p>The portal shows the client exactly where they are in the process — completed steps are ticked, locked steps are greyed out. Once onboarding is complete, the portal transitions to show:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li>Weekly check-in (Form A or B, window-gated)</li>
              <li>Weekly training check-in — if they have an active program</li>
              <li>Weekly nutrition check-in — if they have an active nutrition plan</li>
              <li>View your program — full session-by-session program view</li>
              <li>View your nutrition plan — full meal-by-meal plan view</li>
              <li>Active Coaching Client Guide link</li>
            </ul>
            <p>Every portal page shows a sticky header with the Body Recode logo and sign-out button, and a fixed footer with a WhatsApp link to message you directly.</p>
            <Training title="Why one portal instead of multiple links">
              <p>Previous builds sent separate links for intake, baseline, and check-ins. Each link was another thing to track and another point of failure. A single portal link eliminates that. The client bookmarks it once and uses it throughout the entire coaching relationship — onboarding, check-ins, resources. Everything is in one place, in the right order, with the right steps unlocked at the right time.</p>
            </Training>
          </Section>

          <Section id="client-onboarding" title="9. Client Onboarding" colour="teal">
            <p>Onboarding happens entirely through the client portal. The steps unlock in sequence — each step must be completed before the next is available:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
              <li><strong>Coaching Agreement</strong> — reviewed and e-signed in the portal. You receive a notification when signed.</li>
              <li><strong>Health Declaration</strong> — health and readiness screening. You receive a notification when submitted. If medical clearance is flagged, a Medical Clearance step is automatically inserted before intake unlocks.</li>
              <li><strong>Medical Clearance</strong> (if required) — client downloads a form from the portal, takes it to their GP, and uploads the completed form. You review it and mark clearance received on the client profile, which unlocks the intake.</li>
              <li><strong>Foundational Intake</strong> — 208-question intake covering all signal domains. You receive a notification when submitted. CFFS generates automatically.</li>
              <li><strong>Baseline Documentation</strong> — bodyweight, waist, hips, chest, and three progress photos (front, side, back). You receive a notification when submitted.</li>
            </ol>
            <p>You receive a notification email at every step as the client completes it. All submitted documents (agreement, health declaration, intake, baseline) are viewable and printable from the client profile.</p>
            <Note>If the CFFS fails to generate after intake submission, use the Regenerate button on the client profile.</Note>
            <Training title="What the intake is building">
              <p>The 208-question intake is not a form. It is the raw material for the CFFS — a structured read of the client&apos;s current body state across all signal domains. The questions exist because body response patterns don&apos;t reveal themselves in a short intake. Depth matters.</p>
              <p className="mt-2">The baseline measurements taken here are the reference point for everything that follows. Week 1 data only becomes meaningful because of what was captured here. Encourage the client to be accurate rather than aspirational with their numbers.</p>
            </Training>
          </Section>

          {/* Section 8 */}
          <Section id="cffs" title="10. CFFS — Coach-Facing Foundational Synthesis" colour="teal">
            <p>The CFFS is generated automatically from the foundational intake. It is a structured interpretation of the client&apos;s current body state across 8 signal domains, labelled <strong>Foundational Synthesis — CFFS</strong> on the client profile.</p>
            <p>It includes:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li>Body State Classification (Remediation, Optimisation, Post-Optimisation)</li>
              <li>Resolution State</li>
              <li>Exposure Readiness across 4 dimensions (Capacity, Schedule, Regulation, Behaviour)</li>
              <li>Client Context Summary</li>
              <li>Primary Patterns and Signals</li>
              <li>Capacity Constraints and Guardrails</li>
              <li>Risk Flags and Watch Items</li>
              <li>Tensions and Trade-Offs</li>
              <li>Explicit Non-Directives</li>
              <li>Closing Interpretive Notes</li>
            </ul>
            <p>Click <strong>Download PDF</strong> on the client profile to open the full formatted CFFS report in a new tab — printable as a PDF.</p>
            <Note>The CFFS is a coaching reference document, not a diagnostic tool. It does not prescribe training changes.</Note>
            <Training title="How to use the CFFS">
              <p>The CFFS is not a report to file away. It is the interpretive framework for your first weeks of coaching. Before you prescribe anything — load, frequency, nutrition adjustments — read the CFFS. The Capacity Constraints and Guardrails section in particular tells you what not to do before it tells you what to do.</p>
              <p className="mt-2">The Body State Classification (Remediation, Optimisation, Post-Optimisation) should orient your entire early coaching approach. A client in Remediation is not ready for the same intervention as one in Optimisation. The CFFS makes that distinction clearly — your programming should reflect it.</p>
              <p className="mt-2">Risk Flags and Watch Items are not optional reading. If something is flagged, it means the intake data produced a pattern that requires attention. These should inform how you frame weekly check-in prompts and what you&apos;re watching for in the CFWS.</p>
            </Training>
          </Section>

          {/* Section 9 */}
          <Section id="weekly-checkins" title="11. Weekly Check-Ins and CFWS" colour="teal">
            <p>Each week, clients complete one check-in form during the Friday 6pm to Sunday 6:30pm Brisbane window. Forms alternate each week:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Form A</strong> (odd system weeks) — Training, load, and recovery questions.</li>
              <li><strong>Form B</strong> (even system weeks) — Regulation, lifestyle, and context questions.</li>
            </ul>
            <p>Every Friday at 6pm Brisbane time, clients receive an automated email notifying them that the window is open. The email links directly to their <strong>client portal at /portal/[token]</strong>.</p>
            <p>Inside the portal, the <strong>This week</strong> section shows:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li>The active form for this week with a Start link — or a ticked state if already submitted.</li>
              <li>Window closed state with the next open time if outside the Friday-Sunday window.</li>
            </ul>
            <p>Clicking Start takes the client to the check-in form at <strong>/portal/[token]/checkin</strong>.</p>
            <p>When both Form A and Form B have been submitted for the week:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
              <li>The client receives a confirmation email.</li>
              <li>You receive a notification email with a link to the client profile.</li>
              <li>The <strong>CFWS</strong> (Coach-Facing Weekly Synthesis) generates automatically and appears on the client profile under <strong>Weekly Synthesis — CFWS</strong>.</li>
            </ol>
            <p>The CFWS includes Exposure Readiness across 4 dimensions, plus 7 interpretive sections. Click <strong>Download PDF</strong> on the client profile to open the full formatted CFWS report — printable as a PDF.</p>
            <p>The client profile also shows the last several check-in submissions under Recent Submissions.</p>
            <Note>Use the Regenerate button to manually trigger a new CFWS if needed — for example if only one form was submitted and you want to generate from the latest available pair.</Note>
            <Training title="Why this structure exists">
              <p><strong>Alternating forms.</strong> Form A captures load, training, and recovery. Form B captures regulation, lifestyle, and context. Together they produce a complete picture of the week. Running both every week would be 20+ minutes per check-in. Alternating them halves the client burden while keeping the data complete over a two-week cycle. The CFWS is always generated using the most recent Form A and Form B — even if they weren&apos;t from the same week.</p>
              <p className="mt-2"><strong>The Friday-Sunday window.</strong> Friday 6pm is not arbitrary. It gives the client the full week to have happened before they reflect on it. Sunday 6:30pm closes it before Monday, so you have the CFWS ready before the new week begins. Read the CFWS before Monday if you can — it will orient your coaching decisions for the week ahead.</p>
              <p className="mt-2"><strong>Everything through the portal.</strong> The check-in notification links to the portal, not a standalone form. The client uses the same URL they used for onboarding. Over time it becomes the single place they associate with their coaching relationship — not a different link each week.</p>
            </Training>
          </Section>

          {/* Section 10 */}
          <Section id="coaching-package" title="12. Coaching Package and Upgrades" colour="teal">
            <p>On the client profile, set the client&apos;s <strong>Coaching Package</strong> to record which plan they are on:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Online — $149/week</strong></li>
              <li><strong>In-Person 2x — $299/week</strong></li>
              <li><strong>In-Person 3x — $409/week</strong></li>
            </ul>
            <p>Once a package is selected, a <strong>Copy Subscription Link</strong> button appears. The link includes the client&apos;s ID so the system can identify them when they pay. When the client completes payment, the <strong>Subscription Active</strong> badge appears automatically on the client profile.</p>
            <p>To upgrade a client from 2x to 3x:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
              <li>Cancel the existing $299/week subscription in Stripe.</li>
              <li>Select <strong>In-Person 3x</strong> on the client profile.</li>
              <li>Copy and send the $409/week subscription link to the client.</li>
              <li>Update to 3x once they have subscribed.</li>
            </ol>
            <Note>The 3x package is coach-assessed. Only offer it during weekly check-ins once you have enough data to confirm the client can sustain three sessions per week.</Note>
            <Training title="Why 3x is not offered at Zoom 2">
              <p>At Zoom 2, you have a report, one consultation, and whatever they told you about themselves. That is not enough data to know whether a client can sustain three sessions per week on top of their life. Offering 3x too early sets up a client for a load they can&apos;t maintain — and when they struggle with it, they attribute the problem to the program rather than the prescription.</p>
              <p className="mt-2">The 3x upgrade should come from the CFWS data. Several weeks of check-ins will show you whether a client&apos;s recovery, regulation, and schedule can support a third session. When the data says yes, you make the offer from a position of evidence. The client will feel the difference between being sold a bigger package at the start and being assessed for one after you&apos;ve watched them closely for weeks.</p>
            </Training>
          </Section>

          <Section id="clients-dashboard" title="13. Clients Dashboard" colour="teal">
            <p>The clients dashboard shows a live overview of all active clients. For each client in active coaching, the row displays:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Week number</strong> — Current coaching week based on their start date.</li>
              <li><strong>A / B check-in status</strong> — Teal if submitted this week, grey if not yet submitted.</li>
              <li><strong>CFWS readiness dots</strong> — Four coloured dots (Capacity, Schedule, Regulation, Behaviour) from the latest weekly synthesis. Green = ready, Amber = caution, Red = flag.</li>
              <li><strong>Body state badge</strong> — From the latest CFFS.</li>
            </ul>
            <p>Clients in the Deliberate Start Window show a <strong>Starts in Xd</strong> amber badge instead.</p>
            <Training title="How to read the clients dashboard">
              <p>The dashboard is designed to tell you who needs attention this week without clicking into every profile. The readiness dots are your triage layer. If a client has any amber or red dots, open their profile before their session.</p>
              <p className="mt-2">A grey A or B check-in badge mid-week is normal — the window may still be open. A grey badge on Monday means they didn&apos;t submit. That is worth a check-in message, not just a note.</p>
              <p className="mt-2">Week number matters more than it looks. A client in week 2 is in a completely different phase than a client in week 14. The early weeks are about establishing baseline patterns. Overloading someone in week 2 because their CFWS looks good is still overloading them in week 2.</p>
            </Training>
          </Section>

          <Section id="automated-status" title="14. Automated Status Flow" colour="teal">
            <p>Lead statuses update automatically at these trigger points. You do not need to change them manually.</p>
            <div className="space-y-2">
              <FlowRow trigger="Check-in quiz submitted" from="—" to="New Check-In" auto />
              <FlowRow trigger="Report scheduled and sent" from="New Check-In" to="Report Sent" auto />
              <FlowRow trigger="Lead books via Calendly" from="Report Sent (or earlier)" to="Zoom 1 Booked" auto />
              <FlowRow trigger="Lead books via Calendly again" from="Zoom 1 Completed" to="Zoom 2 Booked" auto />
              <FlowRow trigger="Commencement fee paid via Stripe" from="Any" to="Commencement Fee Paid" auto />
            </div>
            <p className="mt-2">These transitions are manual — they require your input after the call or conversation:</p>
            <div className="space-y-2">
              <FlowRow trigger="You mark after Zoom 1 call ends" from="Zoom 1 Booked" to="Zoom 1 Completed" auto={false} />
              <FlowRow trigger="Decision at Zoom 2 (Path B or C)" from="Zoom 2 Booked" to="Zoom 2 Completed" auto={false} />
              <FlowRow trigger="Lead declines at Zoom 2 (Path A)" from="Zoom 2 Booked" to="Closed - Declined" auto={false} />
              <FlowRow trigger="Lead did not attend Zoom 1" from="Zoom 1 Booked" to="Closed - No Show" auto={false} />
              <FlowRow trigger="Report sent but no booking after follow-ups" from="Report Sent" to="Cold - No Booking" auto={false} />
            </div>
            <Training title="What requires your attention vs what runs itself">
              <p>The automations handle the objective triggers — payment, quiz submission, Calendly booking. You handle the human judgements — whether a Zoom 1 is complete, which path a Zoom 2 conversation ended on, whether a lead genuinely went cold or just needs more time.</p>
              <p className="mt-2">The manual transitions are not admin tasks. They are your interpretive decisions about where a lead is in the process. Keeping them accurate keeps the pipeline data trustworthy. If statuses drift, you lose visibility into where the real friction is.</p>
            </Training>
          </Section>

          <Section id="email-sequences" title="15. Email Sequences and Automation" colour="teal">
            <p>The following outbound email sequences run automatically. All emails send from <strong>kade@bodyrecode.au</strong> via Resend.</p>

            <p className="font-semibold text-white mt-2">Performance Report + Follow-Up Sequence</p>
            <p>Triggered when a lead submits the check-in quiz. The report is scheduled to send the following morning at 9am Brisbane time.</p>
            <div className="space-y-1">
              <SeqRow day="Next morning 9am" label="Performance report email" />
              <SeqRow day="Day 2" label="Follow-up 1 — Re: Your check-in report" />
              <SeqRow day="Day 5" label="Follow-up 2 — When the effort doesn't match the result" />
              <SeqRow day="Day 9" label="Follow-up 3 — Last one from me, [name]" />
            </div>
            <p className="mt-2">The follow-up sequence is <strong>automatically cancelled</strong> the moment the lead books a Zoom via Calendly. If you need to cancel it manually, use the Cancel Sequence button on the lead detail page.</p>

            <p className="font-semibold text-white mt-4">Re-engagement Blast (Admin Action)</p>
            <p>A one-time admin action available on the dashboard homepage. Sends the re-engagement email plus a fresh follow-up sequence to all leads who have check-in answers on file. Any previously scheduled follow-ups are cancelled before the new sequence is sent.</p>
            <p>Leads with statuses <strong>Commencement Fee Paid</strong>, <strong>Closed - Declined</strong>, or <strong>Closed - No Show</strong> do not receive new follow-ups.</p>

            <p className="font-semibold text-white mt-4">Orientation Guide</p>
            <p>Sent manually from the lead detail page after Zoom 1. Emails the lead a branded link to the orientation page. The date it was sent is shown on the lead page.</p>

            <p className="font-semibold text-white mt-4">No-Show Re-engagement Sequence</p>
            <p>Triggered manually from the lead detail page when a lead is marked Closed - No Show.</p>
            <div className="space-y-1">
              <SeqRow day="Day 1" label="Calm acknowledgement, door left open" />
              <SeqRow day="Day 4" label="Gentle follow-up" />
              <SeqRow day="Day 10" label="Final invitation to rebook" />
            </div>

            <p className="font-semibold text-white mt-4">Welcome Email (Post-Conversion)</p>
            <p>Sent automatically when the commencement fee is paid. Contains the client&apos;s portal link. Triggered by the Stripe webhook.</p>

            <p className="font-semibold text-white mt-4">Client Onboarding Notifications (to you)</p>
            <p>You receive a notification email each time a client completes a step in their portal:</p>
            <div className="space-y-1">
              <SeqRow day="Step 1" label="Coaching Agreement signed — with client name and portal link" />
              <SeqRow day="Step 2" label="Health Declaration submitted — flags if medical clearance is required" />
              <SeqRow day="Step 3" label="Foundational Intake submitted — with portal link" />
              <SeqRow day="Step 4" label="Baseline Documentation submitted — with portal link" />
            </div>

            <p className="font-semibold text-white mt-4">Weekly Check-In Window Open</p>
            <p>Sent automatically every Friday at 6pm Brisbane time to all active clients. Links to their portal at /portal/[token]. Triggered by a Vercel cron job.</p>

            <p className="font-semibold text-white mt-4">Weekly Check-In Confirmation (to client)</p>
            <p>Sent automatically when a client submits a check-in form. Dark-themed branded email confirming receipt.</p>

            <p className="font-semibold text-white mt-4">Weekly Check-In Notification (to you)</p>
            <p>Sent automatically when a client submits a check-in form. Includes the form type and a link to the client profile.</p>

            <p className="font-semibold text-white mt-4">Coaching Start Reminder</p>
            <p>Sent automatically the day before a client&apos;s coaching start date. Triggered by a Vercel cron job that runs daily.</p>

            <p className="font-semibold text-white mt-4">Founding Client Case Study Agreement</p>
            <p>Sent manually from the Zoom 2 companion when a Founding Client pathway is selected at Stage 5. Click <strong>Send Case Study Agreement</strong> — the system creates the agreement record, generates a unique signing token, and emails the lead a link to review and sign online. The agreement must be signed before the commencement fee is sent.</p>

            <Training title="The logic behind the follow-up timing">
              <p>Day 2, Day 5, Day 9. Not daily. Not weekly. The gaps are intentional. Day 2 is when the report is still fresh. Day 5 is when most people have filed it away but haven&apos;t fully forgotten it. Day 9 is the last reach — the tone shifts to a genuine close. Running them too close together feels like pressure. Too far apart and the thread is lost.</p>
              <p className="mt-2">The sequence cancels automatically on booking because the goal of the sequence is a Zoom 1. Once that happens, the follow-ups would be noise. They don&apos;t just stop — they are actively cancelled so nothing goes out while the lead is already in the pipeline.</p>
            </Training>
          </Section>

          <Section id="communications" title="16. Communications Timeline" colour="teal">
            <p>Every lead detail page has a <strong>Communications</strong> panel. It shows a reverse-chronological timeline of all outbound emails logged for that lead.</p>
            <p>Events logged automatically:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li>Performance report scheduled</li>
              <li>Follow-up emails scheduled (Day 2, 5, 9) with subject lines</li>
              <li>Re-engagement blast sent</li>
              <li>Orientation guide sent</li>
              <li>Zoom booking confirmed (via Calendly)</li>
              <li>No-show sequence emails scheduled</li>
            </ul>
            <p>Each entry shows the event type, subject line, and exact Brisbane timestamp. The timeline is live — it updates as emails go out.</p>
            <Note>Historical leads (those who submitted before this feature was built) will not have events in the timeline. All new activity is logged going forward.</Note>
          </Section>

          <Section id="admin-actions" title="17. Admin Actions" colour="teal">
            <p>The following actions are available on the <strong>Dashboard Homepage</strong>.</p>

            <p className="font-semibold text-white mt-2">Positions Available</p>
            <p>The <strong>Positions Available</strong> card shows the current number of Founder Client Program spots shown on performance.bodyrecode.au/founder. Use the + and - buttons to adjust the count. The page updates within 60 seconds. Decrement this when you accept an applicant, not when they apply.</p>

            <p className="font-semibold text-white mt-2">Admin Actions panel</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Send preview email</strong> — Sends a sample re-engagement report email to kade@bodyrecode.au. Use this to preview formatting and layout before running the blast.</li>
              <li><strong>Resend reports to all leads</strong> — Triggers the re-engagement blast. Cancels all existing follow-up sequences and sends a fresh re-engagement email plus a new 3-email follow-up sequence to every lead with check-in data. Requires confirmation before firing.</li>
            </ul>
            <Note>The blast is protected by an admin secret and requires confirmation. It will not fire accidentally.</Note>
          </Section>

          <Section id="founding-client" title="18. Founding Client Program" colour="teal">
            <p>The Founding Client Program is a limited, selective participation model. 20 positions are available for online clients. The fee is reduced by 50% in exchange for the client&apos;s documented participation in a structured case study process.</p>
            <p>This is a structured trade, not a discount. The client provides participation of commercial and developmental value to the system. The adjusted fee reflects that exchange.</p>

            <Training title="Why framing matters here">
              <p>The language matters. Calling it a discount frames it as you giving something up. Calling it a trade frames it as an exchange — and it is an exchange. The client gets a reduced fee. You get documented case study data, which has real commercial value for the system&apos;s long-term development.</p>
              <p className="mt-2">Presenting it as a trade also screens out the wrong leads. Someone who responds well to the framing understands the nature of the program. Someone who immediately treats it as a price negotiation tool is likely the wrong fit for it. The positions are finite — use them with intent.</p>
            </Training>

            <p className="font-semibold text-white mt-2">Three entry paths</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Online ad application</strong> — The primary path for online clients. The landing page at performance.bodyrecode.au/founder directs applicants through the Performance Check-In as step one of the application. Applications come in tagged as source: Founder Program in the leads list. Review the check-in answers and set the application status on the lead detail page.</li>
              <li><strong>Objection-triggered at Zoom 2</strong> — The full rate offer is made first. If the lead objects to price, the Founding Client offer is introduced as the second offer. Use the Objection-Triggered tab in the Zoom 2 companion.</li>
              <li><strong>Manual override at Zoom 2</strong> — For a high-suitability lead, you may proactively offer the program before any objection arises. Use the Manual Override tab. All four criteria on the checklist must be true before using it.</li>
            </ul>

            <p className="font-semibold text-white mt-2">Managing online applications</p>
            <p>Applications from the landing page arrive in your leads list with a teal <strong>Founder</strong> badge. Use the <strong>Founder Program</strong> filter at the top of the leads list to view them in isolation.</p>
            <p className="mt-2">On each founder lead&apos;s detail page, a <strong>Founder Client Application</strong> section appears at the top. Review their check-in answers below it and update the application status using the status button:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-1">
              <li><strong>Under Review</strong> — Default state. Application received, not yet assessed.</li>
              <li><strong>Accepted</strong> — Position offered. Proceed to booking and coaching entry.</li>
              <li><strong>Declined</strong> — Not a fit for this cohort.</li>
              <li><strong>Waitlisted</strong> — Suitable but no positions available right now.</li>
            </ul>
            <p className="mt-2">When you accept an applicant, decrement the positions counter on the Dashboard Homepage using the Positions Available control. The landing page updates within 60 seconds.</p>

            <Training title="Objection-triggered vs manual override — know the difference">
              <p><strong>Objection-triggered</strong> is the standard Zoom 2 pathway. Full rate goes first, always. If the lead objects to price, you handle the objection first, and if they still need something to move, the Founding Client program becomes the second offer. The script walks you through the steps — use it.</p>
              <p className="mt-2"><strong>Manual override</strong> is not for when you want to help someone who cannot afford the full rate. That is a misuse of the program and a misuse of a position. Manual override is for a lead where the case study potential is genuinely high. All four criteria on the checklist must be true before you use it.</p>
            </Training>

            <p className="font-semibold text-white mt-2">Agreement before commencement</p>
            <p>The Founding Client Case Study Agreement must be signed before the commencement fee is sent. This is non-negotiable. The sequence is:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
              <li>Lead accepts the Founding Client offer (at Zoom 2, or via the online application path).</li>
              <li>Select Path C and the Founding Client pathway in the Zoom 2 decision panel, or proceed from the lead detail page for online applicants.</li>
              <li>Click <strong>Send Case Study Agreement</strong> — this creates the agreement record and emails the signing link to the lead.</li>
              <li>Lead reviews and signs the agreement online, selecting their consent tier.</li>
              <li>Once signed, generate and send the commencement fee from the lead detail page.</li>
            </ol>

            <p className="font-semibold text-white mt-2">Consent tiers</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Tier 1 — Anonymised</strong> — Case study may be published with identity removed.</li>
              <li><strong>Tier 2 — Named</strong> — Case study may be published with identity, subject to client review of identifying material.</li>
            </ul>

            <Training title="Why consent tiers exist">
              <p>The consent tier is selected by the client at signing — not decided by you. Tier 2 gives you more flexibility to publish and use the case study publicly. Tier 1 still produces valuable documented data, but you cannot attach a name or identifying details to it.</p>
              <p className="mt-2">The tier selection is captured at signing and shown permanently on the client&apos;s profile. It determines what you can do with the case study when the time comes. Do not assume — check the profile.</p>
            </Training>

            <p className="font-semibold text-white mt-2">Founding Client badge and section on client profile</p>
            <p>Once the agreement is signed and the client converts, their profile shows a <strong>Founding Client</strong> badge in the header and a dedicated section with entry type, consent tier, program start date, and 12-week threshold date.</p>
            <p>At the bottom of that section is an <strong>Update status</strong> link. Click it to reveal four status buttons — Active, 12 Weeks Complete, Extended, Withdrawn. The current status is highlighted. Click any other to update it immediately.</p>

            <p className="font-semibold text-white mt-2">Founding client rates</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li>Online — $74.50/week (standard $149)</li>
              <li>In-Person 2x — $149.50/week (standard $299)</li>
              <li>In-Person 3x — $204.50/week (standard $409)</li>
            </ul>

            <Note>Minimum participation is 12 weeks. Status states: Active, 12 Weeks Complete, Extended, Withdrawn. Status is managed manually as the case study progresses.</Note>
          </Section>

          <Section id="stripe-payments" title="19. Stripe Payments" colour="teal">
            <p>Three payment links are used in the coaching entry process:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Commencement Fee — $240</strong> — Generated uniquely per lead. Triggers automatic client creation when paid.</li>
              <li><strong>In-Person 2x — $299/week</strong> — Static link. Standard entry package. Send after commencement fee is confirmed.</li>
              <li><strong>In-Person 3x — $409/week</strong> — Static link. Coach-assessed upgrade, offered during weekly check-ins not at Zoom 2.</li>
              <li><strong>Online — $149/week</strong> — Static link. Fallback if lead objects to in-person pricing.</li>
            </ul>
            <p>Payment links for the weekly subscription are available in the Zoom 2 companion Stage 5 Decision panel.</p>
            <Note>Always send the commencement fee first. Coaching does not start until both the commencement fee and the first weekly subscription payment are received.</Note>
          </Section>

          {/* Training Program — PTS */}
          <Section id="training-program" title="20. Training Program — PTS (Performance Training System)" colour="teal">
            <p>The Training Program section lives on each client profile. It uses the Body Recode™ PTS doctrine and Claude AI to generate structured training programs from your client&apos;s CFFS, intake, and training history. Programs follow the full 9-stage generation pipeline and all doctrine constraints are enforced automatically.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">The Generation Flow</p>
            <ul className="space-y-1.5 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Step 1 — Prescription Suggestion.</strong> Click Generate Program on the client profile. The system reads the client&apos;s CFFS, intake, injury context, and training history and produces a suggested prescription — block name, phase, goal, frequency, training age, movement competency, duration — with the reasoning behind every field. You review and edit before anything is generated.</li>
              <li><strong>Step 2 — Approve &amp; Generate.</strong> Confirm equipment access, adjust any fields if needed, then click Approve &amp; Generate Program. Claude Sonnet generates the full program (30–60 seconds). It is saved as a draft.</li>
              <li><strong>Step 3 — Draft Review.</strong> The full draft renders on the Training Program page with Discard and Approve Program buttons. Review the program — sessions, blocks, exercises, weekly structure, progression strategy — before promoting it.</li>
              <li><strong>Step 4 — Approve Program.</strong> Click Approve Program to promote the draft to active. The draft replaces any previously active program. Previous programs are retained as archived history.</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Program Structure</p>
            <ul className="space-y-1.5 list-disc list-inside text-stone-300 text-sm">
              <li><strong>01 Weekly Structure</strong> — Explains the program design logic: why each skeleton was chosen, what patterns are in each session, and what constraints were applied (injury, readiness flags, RPE ceilings, eligibility level).</li>
              <li><strong>02 Progression Strategy</strong> — Week-by-week progression instructions. Permission-based only — each week&apos;s progression is conditional on the client tolerating the previous week cleanly.</li>
              <li><strong>Sessions</strong> — Each session has a Movement Preparation entry (non-slot, always first), then blocks A through D. Each exercise shows sets × reps, RPE, rest, and coaching notes.</li>
            </ul>

            <Note>Programs follow doctrine exactly — one PTS phase only, no cross-phase blending, exercise selection from the approved library only, skeleton structure fixed, fatigue adjustments on execution variables only.</Note>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Step 5 — Weekly Review (Client Portal)</p>
            <p>The weekly training review is submitted by the client through their portal. The client reports whether they completed their sessions, how training felt (one or more signals), the overall direction, and optional notes. You see the answers as a question/answer feed on the Training Program page.</p>
            <p className="mt-2"><strong>How training felt signals:</strong> Feeling stronger / Struggling with sessions / No change / Recovering poorly / Ticking along. Clients can select multiple.</p>
            <p className="mt-2"><strong>Direction labels — what they mean and what to do:</strong></p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-1">
              <li><strong className="text-green-400">Making progress</strong> — sessions are going well, client is adapting. No action needed. Continue the current program.</li>
              <li><strong className="text-amber-400">Staying steady</strong> — no notable change, client is maintaining. Monitor for a week or two before acting. Consider whether progression variables can be nudged.</li>
              <li><strong className="text-red-400">Struggling</strong> — client is finding sessions hard, energy low, or performance dropping. Action required. A red banner will appear on the Training Program page. Review the check-in notes, write coach feedback for the client, and consider adjusting the program or generating a new block. When you regenerate, the AI will see this history and prescribe accordingly.</li>
            </ul>
            <p className="mt-2"><strong>Coach notes:</strong> After reviewing, click <strong>+ Add feedback for client</strong> under any review entry to write a note. This note appears on the client&apos;s portal home page under &quot;From your coach&quot;. Only the most recent note with content is shown to the client.</p>

            <Training title="How to read the prescription suggestion">
              <p>The suggestion is not a recommendation to accept blindly. It is the system&apos;s read of the client&apos;s current state based on available data. Read each reasoning note — if your coaching judgement disagrees with the reasoning, edit the field. The system explains its logic so you can interrogate it, not so you can skip the thinking.</p>
              <p className="mt-2">Movement competency in particular requires your direct assessment. The system defaults conservatively when no data is available — correct it if you know the client&apos;s actual movement capacity from in-person sessions.</p>
            </Training>
          </Section>

          <Section id="macro-arc" title="21. Macro Training Arc" colour="teal">
            <p>The Macro Plan sits above individual program blocks. It lets you plan the full training arc for a client — a sequenced series of meso blocks that govern where the client is going over months, not just the next 4 weeks.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">How It Works</p>
            <ul className="space-y-1.5 list-disc list-inside text-stone-300 text-sm">
              <li>Access it via <strong>Macro Plan</strong> on the client profile Training Program section.</li>
              <li>Create a plan with a name and macro objective (e.g. &quot;Build capacity foundation → strength expression over 6 months&quot;).</li>
              <li>Add meso blocks in sequence. Each block has a progression phase, training goal, duration, execution arc (Short/Mid/Long), phase category (Layer A), and phase objective (Layer D).</li>
              <li>Click <strong>Generate program →</strong> on any block to go to the prescription suggestion page — the system pre-fills the prescription from the plan block and passes the full arc context (previous block completed, next block planned, macro objective) to Claude during generation.</li>
              <li>Block status updates automatically: Planned → In Progress (when generation begins) → Complete (when the program weekly review marks &quot;New block required&quot;) → Skipped. When a block is marked complete, the next planned block advances to In Progress automatically.</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">The Three Time Horizons</p>
            <ul className="space-y-1.5 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Macro</strong> — The plan itself. Long-term direction (months). Governs which stress profiles are allowable and the overall arc direction.</li>
              <li><strong>Meso</strong> — Each block in the plan. 4–8 weeks. Sets stress emphasis, density, and deload timing for that window.</li>
              <li><strong>Micro</strong> — The sessions within each block. Weekly/session expression responsive to current conditions. What the program page shows.</li>
            </ul>

            <Note>The macro plan gives Claude context it cannot derive from a single block in isolation — it knows where the client has been and where they are going. This produces more accurate phase transitions, better execution arc decisions, and appropriate intensity sequencing across blocks.</Note>
          </Section>

          <Section id="nutrition-plan" title="22. Nutrition Plan — HABNS" colour="teal">
            <p>The Nutrition Plan engine generates a doctrine-compliant daily nutrition prescription under the Hybrid Animal-Based Nutrition System (HABNS) — the 5th pillar of the Body Recode system. Plans follow a two-stage pipeline: draft → active. The same approval flow as the training program.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Step 1 — Prescription Suggestion</p>
            <p>From a client profile, click <strong>Generate Plan</strong> in the Nutrition Plan section. This opens the prescription suggestion page. Claude (Haiku) reads the CFFS, intake data, and any previous nutrition plans to recommend a starting prescription. Each field shows a reason. You can edit any field before proceeding.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Step 2 — Plan Generation</p>
            <p>Click <strong>Approve &amp; Generate Plan</strong> to send the prescription to Claude (Sonnet). The engine applies all six sequential build layers from doctrine: structure → protein anchor → carb demand → distribution → day variation → food selection. The result is saved as a draft. If you prefer to fill in the prescription manually, use the <strong>Fill in manually instead</strong> link at the bottom of the suggestion page.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Step 3 — Draft Review</p>
            <p>The generated plan appears on the client&apos;s Nutrition Plan page under a <strong>Draft — Pending Approval</strong> banner. Review the full output: entry state summary, meal structure (per-meal macros and foods), training day adjustments, execution rules, what not to change, and progression notes. Use <strong>Discard Draft</strong> to delete it or <strong>Approve Plan</strong> to promote it to active.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Step 4 — Weekly Review (Client Portal)</p>
            <p>The weekly nutrition review is submitted by the client through their portal. The client reports adherence, what they noticed (one or more signals), the overall direction, and optional notes. You see the answers as a question/answer feed on the Nutrition Plan page.</p>
            <p className="mt-2"><strong>What they noticed signals:</strong> Under-fuelled / Over-fuelled / Recovery issues / Hard to stick to / Feeling good. Clients can select multiple.</p>
            <p className="mt-2"><strong>Direction labels — what they mean and what to do:</strong></p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-1">
              <li><strong className="text-green-400">Making progress</strong> — client feels on track, plan is working. No action needed. Continue the current plan.</li>
              <li><strong className="text-amber-400">Staying steady</strong> — no notable change. Monitor for a week or two. Consider whether macros need a small adjustment.</li>
              <li><strong className="text-red-400">Struggling</strong> — client is not coping with the plan (hard to follow, under-fuelled, recovery issues). Action required. A red banner will appear on the Nutrition Plan page. Review the check-in notes, write coach feedback, and consider adjusting or regenerating the plan. The AI will factor this history into the new prescription.</li>
            </ul>
            <p className="mt-2"><strong>Coach notes:</strong> Click <strong>+ Add feedback for client</strong> under any review entry to write a note back to the client. This appears on their portal home page under &quot;From your coach&quot;.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Key Concepts</p>
            <ul className="space-y-1.5 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Entry State</strong> — The control variable that locks modulation permission. Four states: Stabilisation, Training Support, High Output Support, Recovery Reset.</li>
              <li><strong>Modulation Permission</strong> — Prohibited (Stabilisation/Recovery Reset), Restricted (Training Support), Permitted (High Output Support). The engine cannot override this boundary.</li>
              <li><strong>Protein Anchor</strong> — Fixed daily protein target distributed evenly across meals. Non-variable by design.</li>
              <li><strong>Carb Demand Level</strong> — Must respect the entry state ceiling. Stabilisation/Recovery Reset → Low only. Training Support → up to Moderate. High Output → up to High.</li>
            </ul>

            <Note>The weekly review is client-submitted. The client sees a Nutrition Check-In card in their portal whenever they have an active plan. You see results only — no data entry required on the coach side.</Note>
          </Section>

          {/* ── BUSINESS ENGINE ─────────────────────────────── */}

          <Section id="business-engine" title="Business Engine — Overview" colour="amber">
            <p>The Business Engine is the operating layer that runs the business side of Body Recode — everything from lead capture to bookings, payments, automations, campaigns, and analytics. It lives under <strong>Business</strong> in the main nav and replaces all external tools (Calendly, GHL, etc).</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Modules</p>
            <div className="grid gap-1.5">
              {[
                { label: 'CRM', desc: 'Kanban pipeline board — track every lead through the 8-stage conversion pipeline' },
                { label: 'Bookings', desc: 'Full booking system replacing Calendly — auto-creates Zoom, sends .ics to both parties' },
                { label: 'Automations', desc: 'Visual workflow builder — trigger sequences on any event with real wait steps' },
                { label: 'Campaigns', desc: 'Email/SMS broadcast builder — send to filtered contact lists with personalisation' },
                { label: 'Funnels', desc: 'Public lead capture pages at bodyrecode.au/f/[slug] — leads flow straight into CRM' },
                { label: 'Inbox', desc: 'One email thread per lead — full event history + compose directly from the platform' },
                { label: 'Payments', desc: 'Manual + Stripe-recorded payments. Product catalogue. Revenue stats.' },
                { label: 'Analytics', desc: 'Live business metrics — revenue, leads, conversion rate, show-up rate, pipeline breakdown' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3 bg-stone-800/50 rounded-lg px-3 py-2">
                  <span className="text-amber-400 font-semibold text-xs shrink-0 mt-0.5 w-24">{item.label}</span>
                  <span className="text-stone-400 text-xs">{item.desc}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section id="be-crm" title="23. CRM & Pipeline" colour="amber">
            <p>The CRM is a Kanban board showing every lead as a card in one of 8 pipeline stages. It is the single source of truth for all pre-client contacts.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Pipeline Stages</p>
            <StatusList items={[
              { label: 'New Lead', desc: 'Just entered — not yet contacted or reported' },
              { label: 'Report Sent', desc: 'Performance report has been sent' },
              { label: 'Zoom 1 Booked', desc: 'First call scheduled' },
              { label: 'Zoom 1 Completed', desc: 'First call done — orientation sent' },
              { label: 'Zoom 2 Booked', desc: 'Second call scheduled' },
              { label: 'Zoom 2 Completed', desc: 'Second call done — decision made' },
              { label: 'Commencement Fee Paid', desc: 'Payment received — awaiting subscription' },
              { label: 'Active Client', desc: 'Converted — now in coaching dashboard' },
            ]} />

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Contact Detail</p>
            <p>Click any lead card to open the contact detail page. From here you can:</p>
            <ul className="space-y-1.5 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Edit contact details</strong> — click Edit contact details to update name, email, and phone in-place</li>
              <li><strong>Move pipeline stage</strong> — use the stage mover to advance or move back through the 8 stages</li>
              <li><strong>Edit notes</strong> — freeform notes field, auto-saves on blur</li>
              <li><strong>Quick links</strong> — jump to Performance Report, Zoom 1 Companion, Zoom 2 Companion, or the converted client profile (if applicable)</li>
              <li><strong>Coaching Tools</strong> — opens the lead detail page in the main coaching dashboard</li>
            </ul>

            <Note>Pipeline stages update automatically when a booking is made or a Stripe payment completes. You can also move them manually using the stage mover on the contact detail page.</Note>
          </Section>

          <Section id="be-bookings" title="24. Bookings" colour="amber">
            <p>The booking system replaces Calendly entirely. All Zoom calls are booked through <strong>bodyrecode.au/book</strong> — a public page showing available slots. When a lead books, a Zoom meeting is created automatically and a calendar invite (.ics) is emailed to both the lead and you.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Availability</p>
            <p>Monday to Thursday, 4:30pm – 7:30pm Brisbane. 30-minute slots with 15-minute gaps between them. Slots are generated automatically — no manual setup each week.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">What Happens on Booking</p>
            <ul className="space-y-1.5 list-disc list-inside text-stone-300 text-sm">
              <li>Zoom meeting created automatically — join link emailed to both parties</li>
              <li>.ics calendar file attached — opens in Apple Calendar on click</li>
              <li>Lead record created or updated in CRM</li>
              <li>Pipeline stage moves to Zoom 1 Booked (or Zoom 2 Booked for returning leads)</li>
              <li>Automation trigger fires — any workflows on booking_created will run</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Manual Bookings</p>
            <p>You can also create bookings from <strong>Business → Bookings → New Booking</strong>. Select the contact, type (Zoom 1, Zoom 2, Other), date/time, and duration. Zoom is created automatically and an email is sent to you (not the lead — use Inbox to send them the link if needed).</p>

            <Note>The booking page is fully public — share the link bodyrecode.au/book anywhere. It shows 7 days of upcoming availability at any time.</Note>
          </Section>

          <Section id="be-automations" title="25. Automations" colour="amber">
            <p>Automations let you build sequences that run automatically when something happens — a lead books, a payment comes through, a tag is added. Each automation is a workflow with a trigger and a series of steps.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Triggers</p>
            <StatusList items={[
              { label: 'lead_created', desc: 'A new lead enters the system for the first time' },
              { label: 'booking_created', desc: 'Any booking is made (filter by type: zoom1 or zoom2)' },
              { label: 'payment_completed', desc: 'A payment is recorded as paid' },
              { label: 'pipeline_stage_changed', desc: 'A lead moves to a specific stage' },
              { label: 'tag_added', desc: 'A tag is applied to a lead' },
              { label: 'form_submitted', desc: 'A funnel form is submitted' },
            ]} />

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Step Types</p>
            <StatusList items={[
              { label: 'Send Email', desc: 'Email to the contact — supports {{first_name}}, {{contact_email}}, {{contact_phone}}' },
              { label: 'Notify Coach', desc: 'Email to kade@bodyrecode.au with a custom message' },
              { label: 'Wait', desc: 'Pause the sequence — set minutes, hours, or days. Held durably in the cloud.' },
              { label: 'Add Tag', desc: 'Apply a tag to the lead' },
              { label: 'Remove Tag', desc: 'Remove a tag from the lead' },
              { label: 'Move Stage', desc: 'Move the lead to a specific pipeline stage' },
            ]} />

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Building a Workflow</p>
            <ul className="space-y-1.5 list-disc list-inside text-stone-300 text-sm">
              <li>Go to <strong>Business → Automations → New Workflow</strong></li>
              <li>Select a trigger and configure any trigger filters (e.g. only fire on zoom1 bookings)</li>
              <li>Add steps — drag to reorder</li>
              <li>Toggle the workflow active when ready</li>
            </ul>

            <Note>Wait steps are handled by Inngest — a background job service. A "wait 3 days" step will actually wait 3 days, even across server restarts. Execution history is logged per contact under each workflow run.</Note>
          </Section>

          <Section id="be-campaigns" title="26. Campaigns" colour="amber">
            <p>Campaigns let you send a one-time email or SMS broadcast to a filtered list of contacts. Unlike automations (which are triggered per contact), a campaign goes out to everyone in the selected audience at once.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Creating a Campaign</p>
            <ul className="space-y-1.5 list-disc list-inside text-stone-300 text-sm">
              <li>Go to <strong>Business → Campaigns → New Campaign</strong></li>
              <li>Set a name, type (Email, SMS, Social), and subject line (email only)</li>
              <li>Write the body — use <code className="bg-stone-800 px-1 rounded text-teal-300 text-xs">{`{{first_name}}`}</code> to personalise</li>
              <li>Choose your audience: All Leads, All Clients, a specific Pipeline Stage, or a Tag</li>
              <li>Save as draft, send now, or schedule for a specific date and time</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Sending</p>
            <p>Once sent, the campaign status changes to <strong>Sent</strong> and the recipient count is recorded. Sent campaigns are locked — they cannot be edited.</p>

            <Note>Campaigns send via Resend (email). SMS campaigns are not yet active — the field is there for when Twilio is integrated.</Note>
          </Section>

          <Section id="be-funnels" title="27. Funnels" colour="amber">
            <p>Funnels are public lead capture pages hosted at <strong>bodyrecode.au/f/[slug]</strong>. Anyone who submits the form is automatically created as a lead in your CRM. Share the link anywhere — social, ads, email.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Creating a Funnel</p>
            <ul className="space-y-1.5 list-disc list-inside text-stone-300 text-sm">
              <li>Go to <strong>Business → Funnels → New Funnel</strong></li>
              <li>Set a name — the URL slug is generated automatically (you can edit it)</li>
              <li>Write the page: headline, subheadline, body copy, CTA button label</li>
              <li>Choose what happens after submit: redirect to the booking page (/book) or show a thank-you message</li>
              <li>Toggle it live when ready</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">What Happens on Submit</p>
            <ul className="space-y-1.5 list-disc list-inside text-stone-300 text-sm">
              <li>Lead is created in CRM (or updated if already exists)</li>
              <li>Source is recorded as &apos;funnel&apos;</li>
              <li>Automation triggers fire: lead_created + form_submitted</li>
              <li>Lead is redirected to /book or shown the thank-you screen</li>
            </ul>

            <Note>Toggle a funnel off at any time to disable the public page without deleting it.</Note>
          </Section>

          <Section id="be-inbox" title="28. Inbox" colour="amber">
            <p>The Inbox is a two-way email system — one conversation thread per contact. Every email you send and every reply you receive shows in the same chronological thread.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">What Shows in the Thread</p>
            <p>Every lead event is logged to the thread automatically:</p>
            <ul className="space-y-1.5 list-disc list-inside text-stone-300 text-sm">
              <li>Emails you sent — shown in teal</li>
              <li>Replies from the lead — shown in blue as &quot;Reply received&quot;</li>
              <li>Zoom bookings</li>
              <li>Automations and sequences (orientation, follow-ups, re-engagement)</li>
              <li>Check-ins submitted</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Sending an Email</p>
            <p>Open a contact from the inbox list, type a subject and message in the compose box at the bottom, and click Send. The email goes via Resend with a reply-to of kade@replies.bodyrecode.au and is logged back into the thread immediately.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Receiving Replies</p>
            <p>When a lead replies to any email from you, their reply routes to replies.bodyrecode.au via Postmark. The platform matches the sender email to their lead record and logs it as a &quot;Reply received&quot; event in their thread. Refresh the thread page to see new replies.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Inbox List</p>
            <p>Contacts are sorted by most recent activity — whoever you last interacted with appears at the top. The preview shows the last event or email subject and the event count.</p>

            <Note>Replies are matched by the sender&apos;s email address. If a lead replies from a different address than what&apos;s on their record, the reply will not appear in their thread.</Note>
          </Section>

          <Section id="be-payments" title="29. Payments" colour="amber">
            <p>The Payments module records all revenue — both automatic (Stripe webhooks) and manual entries. It also holds your product catalogue and generates Stripe Payment Links on demand.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Payment Links</p>
            <p>Each product has a <strong>Get Link</strong> button. Click it once and Stripe generates a permanent payment link for that product — it then flips to <strong>Copy Link</strong>. Paste it anywhere: email, SMS, DM. The link never expires.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Products</p>
            <StatusList items={[
              { label: 'Coaching Commencement Fee', desc: '$240 — one-time. Send to every lead who agrees to proceed at Zoom 2.' },
              { label: 'Online Coaching', desc: '$149/week recurring' },
              { label: 'In-Person 2x', desc: '$299/week recurring — lead with this at Zoom 2' },
              { label: 'In-Person 3x', desc: '$409/week recurring — coach-assessed only, offer during check-ins' },
              { label: 'Online Coaching (Founding Client)', desc: '$74.50/week — half rate for case study clients' },
              { label: 'In-Person 2x (Founding Client)', desc: '$149.50/week' },
              { label: 'In-Person 3x (Founding Client)', desc: '$204.50/week' },
            ]} />

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Automatic Recording</p>
            <p>Stripe payments are recorded automatically via webhooks — commencement fee, weekly subscription payments, failures, and cancellations. You do not need to log them manually.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Manual Payments</p>
            <p>Use <strong>Record Payment</strong> to log cash, bank transfer, or any payment that didn&apos;t come through Stripe.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Failed Payments</p>
            <p>When a subscription payment fails, the payment is recorded with a <strong>Failed</strong> status and you receive a notification email. Follow up with the client directly — Stripe will retry automatically.</p>
          </Section>

          <Section id="be-analytics" title="30. Analytics" colour="amber">
            <p>The Analytics page shows live business metrics — no manual data entry required. Everything is calculated from your live CRM, bookings, and payment data.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Metrics</p>
            <StatusList items={[
              { label: 'Revenue', desc: 'Total revenue from all paid payments in the selected period' },
              { label: 'Leads', desc: 'Total leads created' },
              { label: 'Conversion Rate', desc: 'Leads who reached Active Client stage ÷ total leads' },
              { label: 'Show-up Rate', desc: 'Zoom calls that were completed ÷ calls that were booked' },
              { label: 'Pipeline', desc: 'Bar breakdown of how many leads are in each stage right now' },
              { label: 'Lead Sources', desc: 'Where leads came from — direct booking, funnel, or other source' },
              { label: 'Bookings', desc: 'Total bookings, split by type (Zoom 1, Zoom 2, Other)' },
            ]} />

            <Note>All metrics read directly from your live data. The analytics page refreshes on each load — there is no caching delay.</Note>
          </Section>

          <Section id="be-ads" title="31. Ads" colour="amber">
            <p>The Ads module tracks paid advertising performance — spend, leads generated, and cost-per-lead (CPL) — across Meta and Google campaigns. All data is entered manually.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Adding a Campaign</p>
            <ul className="space-y-1.5 list-disc list-inside text-stone-300 text-sm">
              <li>Click <strong>Add Campaign</strong></li>
              <li>Select the platform (Meta or Google)</li>
              <li>Enter the campaign name, spend (AUD), leads generated, and date range</li>
              <li>CPL is calculated automatically as you type</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Summary Row</p>
            <p>At the top of the page, totals across all campaigns are shown: total spend, total leads, and average CPL. Use this to compare Meta vs Google performance over time.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Editing</p>
            <p>Click the pencil icon on any campaign to edit it inline. Update spend or lead count as final numbers come in from your ad manager dashboard.</p>

            <Note>Automatic sync with Meta Ads and Google Ads APIs is planned once ad accounts are active. For now, pull the numbers from your ad manager and enter them here.</Note>
          </Section>

          <Section id="be-content-engine" title="32. Content Engine" colour="amber">
            <p>The Content Engine generates batches of platform-ready ad copy and reel scripts using a modular hook, message, and CTA library. Everything is generated using Claude AI with the Body Recode brand voice and positioning enforced automatically.</p>
            <p>Navigate to <strong>Business → Content Engine</strong> to access it. The engine has five tabs: Hooks, Messages, CTAs, Generate, and Outputs.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Hooks</p>
            <p>A hook is the opening line of a piece of content. It is the first thing the audience reads or hears. Hooks are categorised by awareness level:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Problem Aware</strong> — The audience knows they have the problem but not the solution.</li>
              <li><strong>Solution Aware</strong> — The audience knows solutions exist but not which one.</li>
              <li><strong>Unaware</strong> — The audience does not yet know they have the problem.</li>
              <li><strong>Contrarian</strong> — Challenges a widely-held belief in the space.</li>
              <li><strong>Curiosity</strong> — Opens a pattern interrupt or unexpected question.</li>
              <li><strong>Authority</strong> — Leads with credibility, data, or a specific claim.</li>
            </ul>
            <p className="mt-2">Add hooks via the inline form. Each hook can be assigned a performance score (Unscored, Losing, Neutral, Winning) after deployment based on real-world results.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Messages</p>
            <p>A message is the body of the content — the point being made between the hook and the CTA. Message types:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Education</strong> — Explains a concept or mechanism.</li>
              <li><strong>Myth-busting</strong> — Addresses and corrects a common misconception.</li>
              <li><strong>Story</strong> — A narrative, personal or client-based.</li>
              <li><strong>System Explanation</strong> — Explains the Body Recode methodology or process.</li>
              <li><strong>Authority</strong> — Demonstrates expertise, specificity, or results.</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">CTAs</p>
            <p>A CTA is the desired action at the end of the content. Add CTAs as plain text. Examples: &ldquo;Take the free check-in&rdquo;, &ldquo;Apply for a Founder position&rdquo;, &ldquo;Link in bio&rdquo;.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Generate</p>
            <p>The Generate tab produces content variants by combining selected hooks, messages, and CTAs. Select one or more from each library, choose a platform, and click Generate. One variant is produced per combination — three hooks times two messages times one CTA produces six outputs.</p>
            <p className="mt-2">Platforms:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Meta Ad</strong> — Primary text, 125 characters max, punchy.</li>
              <li><strong>Instagram Caption</strong> — Conversational, 150-200 characters, hook in first line.</li>
              <li><strong>TikTok Script</strong> — Spoken word, 30-45 seconds, casual and direct.</li>
              <li><strong>Email Snippet</strong> — Subject line and 2-3 sentence opener.</li>
              <li><strong>Landing Page</strong> — Headline and subheadline pair.</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Outputs</p>
            <p>All generated content is saved to the Outputs tab as drafts. Each output shows the platform, the hook, message, and CTA it was generated from, and the full content text. Outputs can be copied to clipboard, edited, or have their status updated.</p>
            <p className="mt-2">Output statuses:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Draft</strong> — Generated, not yet reviewed.</li>
              <li><strong>Approved</strong> — Reviewed and cleared for deployment.</li>
              <li><strong>Deployed</strong> — Live in a campaign or published.</li>
              <li><strong>Winning</strong> — Confirmed strong performer based on results.</li>
              <li><strong>Removed</strong> — Pulled from use.</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">AI Reel Generation</p>
            <p>Any output can be turned into an AI-generated video reel using your cloned voice and AI avatar — no camera, no editing required. Click <strong>Generate Reel</strong> on any output in the Outputs tab.</p>
            <p className="mt-2">The pipeline:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-2">
              <li>The script (editable before submitting) is sent to <strong>ElevenLabs</strong>, which generates audio in your cloned voice.</li>
              <li>The audio is uploaded to secure storage and passed to <strong>HeyGen</strong>, which renders a vertical 1080×1920 MP4 with your AI avatar lip-synced to the audio.</li>
              <li>The output row shows <strong>Rendering reel...</strong> while processing (typically 2–5 minutes).</li>
              <li>When complete, a <strong>Download</strong> link appears. Click it to save the MP4.</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Posting the Reel</p>
            <p>Once downloaded, post the MP4 manually to your chosen platform:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-2">
              <li><strong>Instagram Reels</strong> — Upload via Instagram app or Meta Business Suite. Add caption from the Outputs tab (copy to clipboard).</li>
              <li><strong>TikTok</strong> — Upload via TikTok app or TikTok Studio. Paste the script text as the caption or description.</li>
              <li><strong>Meta Ads</strong> — Upload the MP4 as a video ad in Meta Ads Manager.</li>
            </ul>
            <p className="mt-2">Direct one-click publishing from inside the platform is planned once Meta and TikTok API access is approved. For now, download and post — the creation bottleneck is solved, manual upload takes 30 seconds.</p>

            <p className="mt-4">Reel generation requires four environment variables: <code className="text-teal-400 text-xs bg-stone-800 px-1 py-0.5 rounded">ELEVENLABS_API_KEY</code>, <code className="text-teal-400 text-xs bg-stone-800 px-1 py-0.5 rounded">ELEVENLABS_VOICE_ID</code>, <code className="text-teal-400 text-xs bg-stone-800 px-1 py-0.5 rounded">HEYGEN_API_KEY</code>, and <code className="text-teal-400 text-xs bg-stone-800 px-1 py-0.5 rounded">HEYGEN_AVATAR_ID</code>. If any are missing the button will return an error.</p>

            <Note>The Generate function uses Claude Sonnet with the Body Recode brand voice baked into the prompt — no hype language, no long dashes, no exclamation marks, calm authority. You do not need to prompt-engineer the output. Review and approve before deploying.</Note>
          </Section>

        </div>
      </div>
    </div>
  )
}

function Section({ id, title, colour, children }: { id: string; title: string; colour: 'teal' | 'amber' | 'violet'; children: React.ReactNode }) {
  const headerBg = colour === 'amber' ? 'bg-amber-400/5' : colour === 'violet' ? 'bg-violet-400/5' : ''
  const titleColour = colour === 'amber' ? 'text-amber-400' : colour === 'violet' ? 'text-violet-400' : 'text-teal-400'
  return (
    <div id={id} className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden scroll-mt-8">
      <div className={`px-6 py-4 border-b border-stone-800 ${headerBg}`}>
        <h2 className={`text-sm font-bold uppercase tracking-wider ${titleColour}`}>{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-3 text-stone-300 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  )
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-4 h-4 rounded border border-stone-600 shrink-0 mt-0.5" />
      <p className="text-stone-300 text-sm leading-relaxed">{text}</p>
    </div>
  )
}

function Training({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-violet-950/30 border border-violet-400/20 rounded-lg px-4 py-3 space-y-1">
      <p className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-2">{title}</p>
      <div className="text-xs text-stone-300 leading-relaxed space-y-1">
        {children}
      </div>
    </div>
  )
}

function StatusList({ items }: { items: { label: string; desc: string }[] }) {
  return (
    <div className="grid gap-1.5">
      {items.map(item => (
        <div key={item.label} className="flex items-start gap-3 bg-stone-800/50 rounded-lg px-3 py-2">
          <span className="text-teal-400 font-semibold text-xs shrink-0 mt-0.5">{item.label}</span>
          <span className="text-stone-400 text-xs">{item.desc}</span>
        </div>
      ))}
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-xs text-stone-400 leading-relaxed">
      <span className="font-bold text-stone-300">Note: </span>{children}
    </div>
  )
}

function FlowRow({ trigger, from, to, auto }: { trigger: string; from: string; to: string; auto: boolean }) {
  return (
    <div className="flex items-start gap-3 bg-stone-800/50 rounded-lg px-3 py-2.5">
      <span className={`text-xs font-bold shrink-0 mt-0.5 w-16 ${auto ? 'text-teal-400' : 'text-amber-400'}`}>
        {auto ? 'AUTO' : 'MANUAL'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-stone-300">{trigger}</p>
        {from !== '—' && (
          <p className="text-xs text-stone-500 mt-0.5">
            <span className="text-stone-400">{from}</span>
            <span className="mx-1.5">→</span>
            <span className="text-white font-medium">{to}</span>
          </p>
        )}
      </div>
    </div>
  )
}

function SeqRow({ day, label }: { day: string; label: string }) {
  return (
    <div className="flex items-start gap-3 bg-stone-800/40 rounded-lg px-3 py-2">
      <span className="text-xs font-semibold text-teal-400 shrink-0 w-20">{day}</span>
      <span className="text-xs text-stone-300">{label}</span>
    </div>
  )
}
