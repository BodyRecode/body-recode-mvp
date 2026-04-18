'use client'

import { useState, useEffect } from 'react'

type Category = 'flows' | 'coaching' | 'business' | 'content' | 'challenge'

const SECTIONS = [
  { id: 'operator-flow',         title: 'Operator Flow',         colour: 'violet' as const, category: 'flows' as Category },
  { id: 'operator-flow-founder', title: 'Founder Operator Flow', colour: 'violet' as const, category: 'flows' as Category },
  { id: 'lead-pipeline',    title: '1. Lead Pipeline',       colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'zoom-1',           title: '2. Zoom Companion',      colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'coaching-entry',   title: '3. Coaching Entry',      colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'post-conversion',  title: '6. Post-Conversion',     colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'deliberate-start', title: '7. Deliberate Start',    colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'client-portal',    title: '8. Client Portal',       colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'client-onboarding',title: '9. Client Onboarding',   colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'cffs',             title: '10. CFFS',               colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'weekly-checkins',  title: '11. Weekly Check-Ins',   colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'coaching-package', title: '12. Coaching Package',   colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'clients-dashboard',title: '13. Clients Dashboard',  colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'automated-status', title: '14. Automated Status',   colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'email-sequences',  title: '15. Email Sequences',    colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'communications',   title: '16. Communications',     colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'assets',           title: '16b. Assets',            colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'admin-actions',    title: '17. Admin Actions',      colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'founding-client',  title: '18. Founding Client',    colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'stripe-payments',  title: '19. Stripe Payments',    colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'training-program', title: '20. Training Program',   colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'macro-arc',        title: '21. Macro Training Arc', colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'nutrition-plan',   title: '22. Nutrition Plan',     colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'business-engine',  title: 'Business Engine',        colour: 'amber' as const, category: 'business' as Category },
  { id: 'be-crm',           title: '23. CRM & Pipeline',     colour: 'amber' as const, category: 'business' as Category },
  { id: 'be-bookings',      title: '24. Bookings',           colour: 'amber' as const, category: 'business' as Category },
  { id: 'be-automations',   title: '25. Automations',        colour: 'amber' as const, category: 'business' as Category },
  { id: 'be-campaigns',     title: '26. Campaigns',          colour: 'amber' as const, category: 'business' as Category },
  { id: 'be-funnels',       title: '27. Funnels',            colour: 'amber' as const, category: 'business' as Category },
  { id: 'be-inbox',         title: '28. Inbox',              colour: 'amber' as const, category: 'business' as Category },
  { id: 'be-payments',      title: '29. Payments',           colour: 'amber' as const, category: 'business' as Category },
  { id: 'be-analytics',     title: '30. Analytics',          colour: 'amber' as const, category: 'business' as Category },
  { id: 'be-sources',       title: '31. Lead Sources',       colour: 'amber' as const, category: 'business' as Category },
  { id: 'be-ads',           title: '32. Ads',                colour: 'amber' as const, category: 'business' as Category },
  { id: 'be-content-engine',title: '33. Content Engine',     colour: 'amber' as const, category: 'content' as Category },
  { id: 'be-strategy',      title: '34. Strategy Hub',       colour: 'amber' as const, category: 'content' as Category },
  { id: 'be-social-profiles',title: '35. Social Profiles',   colour: 'amber' as const, category: 'content' as Category },
  { id: 'be-website',       title: '36. Website Analytics',  colour: 'amber' as const, category: 'content' as Category },

  { id: 'ch-overview',      title: 'Challenge Overview',     colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-landing',       title: 'Landing Page',           colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-enrollment',    title: 'Enrollment Flow',        colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-portal',        title: 'Participant Portal',     colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-forms',         title: 'PAR-Q and Health Dec',   colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-resources',     title: 'Training and Nutrition', colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-quiz',          title: 'Mini Hormone Quiz',      colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-automation',    title: 'Automation Sequence',    colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-sms',           title: 'SMS Coaching Sequence',  colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-database',      title: 'Database and Supabase',  colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-prelaunch',     title: 'Pre-Launch Checklist',   colour: 'teal' as const, category: 'challenge' as Category },
]

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'flows',     label: 'Flows' },
  { id: 'coaching',  label: 'Coaching' },
  { id: 'business',  label: 'Business' },
  { id: 'content',   label: 'Content' },
  { id: 'challenge', label: 'Challenge' },
]

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<string>('operator-flow')
  const [activeTab, setActiveTab] = useState<Category>('flows')

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
    <div className="max-w-6xl relative">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 z-50 w-9 h-9 flex items-center justify-center bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-full text-stone-400 hover:text-white transition-colors shadow-lg"
        aria-label="Back to top"
      >
        ↑
      </button>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Dashboard Guide</h1>
        <p className="text-stone-400 text-sm">How the Body Recode Performance Coaching system works — and why each part is structured the way it is.</p>
        {/* Category tabs */}
        <div className="flex gap-2 mt-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveTab(cat.id)
                const first = SECTIONS.find(s => s.category === cat.id)
                if (first) scrollTo(first.id)
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                activeTab === cat.id
                  ? 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                  : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-8 items-start">

        {/* Sidebar */}
        <nav className="w-48 shrink-0 sticky top-8 self-start overflow-y-auto max-h-[calc(100vh-8rem)]">
          <ul className="space-y-0.5">
            {SECTIONS.filter(s => s.category === activeTab).map(({ id, title, colour }) => {
              const isActive = activeSection === id
              const activeColour = colour === 'violet' ? 'text-violet-400' : colour === 'amber' ? 'text-amber-400' : 'text-teal-400'
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
                  <ChecklistItem text="Lead completes the Body State Scorecard at performance.bodyrecode.au" />
                  <ChecklistItem text="Lead is automatically created in the CRM — no action needed" />
                  <ChecklistItem text="You receive a scorecard submission notification email immediately" />
                  <ChecklistItem text="Lead is offered the $37 Body Decode Report post-scorecard" />
                  <ChecklistItem text="Follow-up email sequence begins automatically" />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Phase 2 — Zoom</p>
                <div className="space-y-2">
                  <ChecklistItem text="Lead books Zoom via bodyrecode.au/book — or book manually from Business → Bookings" />
                  <ChecklistItem text="Open the Zoom Companion from the lead detail page before the call" />
                  <ChecklistItem text="First half: run through Opening Frame, Scorecard Reflection, Context Exploration, Pattern Interpretation (stages 1-4)" />
                  <ChecklistItem text="Second half: run through Hot Spot Framing, Emotional Acknowledgement, Pricing, and Decision (stages 5-8)" />
                  <ChecklistItem text="Select the decision path at Stage 8 (A — Declined, B — Needs Time, C — Proceeding)" />
                  <ChecklistItem text="Path C only: select the pricing pathway (Full Rate, Founding Client, or Online)" />
                  <ChecklistItem text="Founding Client only: click Send Case Study Agreement before sending the commencement fee link" />
                  <ChecklistItem text="Mark Call Complete in the companion notes panel" />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Phase 3 — Coaching Entry</p>
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
                  <ChecklistItem text="For face-to-face clients: go to the client profile and click Set up → next to the Face-to-Face Session card, then click + Add slot to set each recurring weekly day and time (e.g. Mon 7:00 am, Wed 7:00 am, Thu 7:00 am). Each slot is saved independently. This unlocks the Sessions page in the client portal." />
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
            <p>Three paths lead to a Founder Client conversion. Follow the track that matches how the person entered.</p>

            <div className="space-y-6 mt-2">

              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Track D — Direct Entry (Bypassed Funnel)</p>
                <p className="text-sm text-stone-400 mb-3">Client signed directly without going through the scorecard or Zoom calls. They were created manually and an intake link was sent to them.</p>
                <div className="space-y-2">
                  <ChecklistItem text="Open the client profile" />
                  <ChecklistItem text="In the Founding Client Program card, click Mark as Founding Client — this sets Manual Override as the entry type" />
                  <ChecklistItem text="Confirm when prompted — the card will update immediately to show the program as Active" />
                  <ChecklistItem text="Click Send Info Package — this emails the client a full breakdown of what the Founder Client Program is, what participation involves, the fee structure, and the two consent tiers. Replaces the explanation that normally happens in the second half of the Zoom call." />
                  <ChecklistItem text="Click Send Case Study Agreement — the client receives a signing link via email. They select their consent tier and sign online. Once signed, their consent tier appears on the profile and the button shows Agreement Signed." />
                  <ChecklistItem text="Decrement the Positions Available counter on the Dashboard homepage" />
                  <ChecklistItem text="Set the Coaching Package to the correct Founding Client tier" />
                  <ChecklistItem text="Send the subscription link to the client — or use Schedule Send to queue it for a specific date" />
                  <ChecklistItem text="Wait for Subscription Active badge, then set the Coaching Start Date" />
                </div>
              </div>

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
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Track B — Zoom Conversion (Price Objection)</p>
                <p className="text-sm text-stone-400 mb-3">Lead is already in the pipeline. They book the Zoom call, and object to the full rate at Stage 7.</p>
                <div className="space-y-2">
                  <ChecklistItem text="Run the Zoom through all 8 stages" />
                  <ChecklistItem text="At Stage 7, lead objects to price — use the Objection-Triggered script in the Zoom companion" />
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
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Track C — Zoom Conversion (Manual Override)</p>
                <p className="text-sm text-stone-400 mb-3">Lead is a strong fit and you proactively offer the program before any price objection. Use the qualification checklist in the Zoom companion before this track — all four criteria must be met.</p>
                <div className="space-y-2">
                  <ChecklistItem text="Confirm all four qualification criteria are met before making the offer (check the Manual Override tab in the Zoom companion)" />
                  <ChecklistItem text="Run the Zoom as normal — introduce the offer at Stage 7 before presenting full-rate pricing" />
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
            <p>Every potential client enters the system as a <strong>lead</strong>. Leads are created manually or automatically when someone completes the Body State Scorecard at performance.bodyrecode.au.</p>
            <p>On the lead detail page, the <strong>Contact</strong> section has an <strong>Edit</strong> link that lets you update the lead&apos;s name, email, and phone number directly from the dashboard without going to Supabase.</p>
            <p>Leads move through statuses as they progress:</p>
            <StatusList items={[
              { label: 'New Check-In', desc: 'Quiz submitted, report not yet sent.' },
              { label: 'Report Sent', desc: 'Performance report scheduled and sent to the lead.' },
              { label: 'Cold - No Booking', desc: 'Report sent but no Zoom booked after follow-ups.' },
              { label: 'Zoom Booked', desc: 'Consultation booked.' },
              { label: 'Zoom Completed', desc: 'Consultation done — decision made.' },
              { label: 'Closed - No Show', desc: 'Lead did not attend. Re-engagement sequence available.' },
              { label: 'Closed - Declined', desc: 'Lead decided not to proceed.' },
              { label: 'Commencement Fee Paid', desc: 'Payment received. Client profile created automatically.' },
              { label: 'Active - Deliberate Start', desc: 'In the 3-7 day window before coaching begins.' },
              { label: 'Active Coaching', desc: 'Coaching underway.' },
            ]} />
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Body State Scorecard on Lead Detail</p>
            <p>When a lead completes the Body State Scorecard (on performance.bodyrecode.au), their score and state are recorded as a <strong>scorecard_completed</strong> event on their lead record. On the lead detail page, a <strong>Body State Scorecard</strong> card appears below the contact info showing:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-1">
              <li>Their total score (e.g. 7 / 15)</li>
              <li>Their body state (Depleted / Transitioning / Ready) as a colour-coded badge</li>
              <li>A one-line description of what that state means</li>
              <li>The date the scorecard was completed</li>
            </ul>
            <p className="mt-2">This card only appears if the lead has a scorecard_completed event. Legacy leads who entered before the scorecard was the lead magnet will not show this card.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Scorecard Lead Creation</p>
            <p>When someone completes the Body State Scorecard on performance.bodyrecode.au, a lead is <strong>automatically created</strong> in the CRM — no manual entry required. Their name, email, score, body state, and section scores are all captured. You receive a branded notification email immediately on every scorecard submission.</p>
            <p className="mt-2">Leads created this way are tagged with <code className="bg-stone-800 px-1 rounded text-teal-300 text-xs">source_detail: scorecard</code>. This is now the primary lead entry path.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Post-Scorecard CTAs</p>
            <p>After completing the scorecard, leads are shown two options on the result page:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm mt-1">
              <li><strong>Book a free call</strong> — links to bodyrecode.au/book. Primary CTA. A 30-minute Zoom to review their results and map out what needs to change first.</li>
              <li><strong>Get my Body Decode Report — $37</strong> — upsell below the primary CTA. A personalised web-based analysis of their body state, section scores, and what to stop and start doing. Purchased via Stripe and delivered automatically by email as a unique link at app.bodyrecode.au/report/[token].</li>
            </ol>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-1">
              <li>Personalised to their exact body state (Depleted / Transitioning / Ready)</li>
              <li>Section-by-section breakdown with interpretations for each score level</li>
              <li>Stop doing / start doing lists specific to their state</li>
              <li>Book a call CTA at the bottom</li>
              <li>PDF download via print</li>
            </ul>
            <p className="mt-2">Report purchases are recorded as <code className="bg-stone-800 px-1 rounded text-teal-300 text-xs">scorecard_reports</code> rows in the database. No manual handling required — Stripe webhook creates the report and sends the email automatically.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Self-Guided Program (Downsell)</p>
            <p>Any lead with scorecard data will show a <strong>Self-Guided Program</strong> section on their detail page. This shows whether they have purchased the $97 program and lets you manually send the offer or copy the checkout link.</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-1">
              <li><strong>Send Offer Email</strong> — creates a Stripe checkout session and sends a branded offer email immediately. Use this if you want to send the offer outside of the automated flow.</li>
              <li><strong>Copy Link</strong> — copies the Stripe checkout URL to clipboard without sending an email.</li>
              <li>If the lead has already purchased, a <strong>Program purchased</strong> badge shows instead of the buttons.</li>
            </ul>
            <p className="mt-2">The offer is automatically sent when you click <strong>Send declined follow-up</strong> on the Zoom companion — no manual trigger needed for the standard flow.</p>
            <p className="mt-2">After purchase, the lead receives a unique program URL at app.bodyrecode.au/program/[token]. The program is tailored to their body state (Depleted / Transitioning / Ready) and includes a full 12-week training and nutrition protocol. To preview what a client sees, go to <strong>Dashboard → Preview → Program</strong>.</p>

            <Training title="Why statuses matter">
              <p>The pipeline exists to tell you exactly where every lead is at a glance — and where the system is getting stuck. If you have 12 leads sitting at Report Sent with no Zoom booked, that is a data point, not a coincidence. It means the report landed but didn&apos;t create enough pull to book the call.</p>
              <p className="mt-2">Cold - No Booking is not a failure status. It means the timing wasn&apos;t right when the sequence ran. These leads still have their data on file — they&apos;re candidates for the re-engagement blast when you&apos;re ready to run it.</p>
              <p className="mt-2">Closed - Declined and Closed - No Show are both recoverable. They go into the re-engagement pool. Don&apos;t treat them as dead.</p>
            </Training>
          </Section>

          {/* Section 2 */}
          <Section id="zoom-1" title="2. Zoom - Call Companion" colour="teal">
            <p>Open the <strong>Call Companion</strong> from the lead detail page before the Zoom call. It opens in a new tab so you can run it alongside the call.</p>
            <p>The companion has 8 stages split across two halves:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
              <li><strong>Opening Frame</strong> — Set context, explain the purpose of the call.</li>
              <li><strong>Scorecard Reflection</strong> — Walk through the lead&apos;s scorecard results and body state.</li>
              <li><strong>Context Exploration</strong> — Explore SLS, RPS, and RILS signal areas using structured prompts.</li>
              <li><strong>Pattern Interpretation</strong> — Name the dominant pattern using signal-specific language.</li>
              <li><strong>Hot Spot Framing</strong> — Name the specific point where effort and response stopped aligning.</li>
              <li><strong>Emotional Acknowledgement</strong> — Normalise confusion and confidence erosion.</li>
              <li><strong>Pricing</strong> — Present the coaching structure and packages as information, not persuasion.</li>
              <li><strong>Decision</strong> — Identify the path and close cleanly.</li>
            </ol>
            <p>The first four stages are the consultation half. The last four are the pricing and decision half. The companion nav shows &quot;First Half&quot; and &quot;Second Half&quot; labels to keep you oriented.</p>
            <p>The notes panel on the right contains two persistent actions available at any stage:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Mark Call Complete</strong> — updates lead status to Zoom Completed. Available at any stage.</li>
              <li><strong>Readiness Check</strong> — A (ready), B (hesitant), C (not right fit). Use it to anchor your read before Stage 8.</li>
            </ul>
            <p>After the call, switch to <strong>Post-Call</strong> view, paste the Zoom transcript, and generate an AI summary. Click <strong>Save to lead notes</strong> to persist it to the lead record — it won&apos;t survive a page refresh otherwise.</p>
            <p>At the bottom of the companion, <strong>Send declined follow-up</strong> fires two things simultaneously: the 3-email re-engagement sequence and the $97 self-guided program offer email. Both are automatic — no further action required.</p>
            <Note>Scripts and prompts are personalised to each lead&apos;s signal levels (SLS, RPS, RILS). Stage 3 prompts are grouped by category (Training, Recovery, Consistency, Pressure) with sub-questions indented below each.</Note>
            <p>The companion tabs change based on which half you are in. In the first half: Prompts, Signals, Language. In the second half: Prompts, Objection-Triggered, Manual Override, Online, Signals.</p>
            <p className="mt-1">At Stage 8, three decision path buttons appear in the notes panel:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Path A — Declined</strong> — Updates lead status to Closed Declined.</li>
              <li><strong>Path B — Needs Time</strong> — Updates lead status to Zoom Completed.</li>
              <li><strong>Path C — Proceeding</strong> — A pathway selector appears. Choose from Full Rate, Founding Client (Objection Triggered), Founding Client (Manual Override), or Online. For Founding Client pathways a <strong>Send Case Study Agreement</strong> button appears — click it to email the signing link to the lead. The commencement fee is sent only after the agreement is signed.</li>
            </ul>
            <Training title="What the Zoom call is for">
              <p><strong>The first half is not a sales call.</strong> There is nothing to sell yet. The only job in the first half is to make the lead feel correctly understood and to build the interpretation that their scorecard and report are based on something real, not generic.</p>
              <p className="mt-2">If a lead doesn&apos;t trust the scorecard, price becomes the only thing they can evaluate. If they do trust it, they are evaluating whether this is the right intervention — which is a completely different conversation.</p>
              <p className="mt-2">The signal exploration in Stage 3 gives you the language for the Hot Spot Framing in Stage 5. The hot spot you name should come directly from what surfaced in the context exploration. Keep your notes panel updated — those notes are what you&apos;ll reference when you pivot to pricing.</p>
            </Training>

            <Training title="The pricing half">
              <p><strong>Stage 5 — Hot Spot Framing.</strong> This is the bridge between &quot;I understand my situation&quot; and &quot;I understand why I need help with it.&quot; Name the specific thing that surfaced in the first half. This is not a generic pitch — it should sound like you were listening. If you named it right, they&apos;ll feel seen. That feeling is what makes pricing land differently. Do not move to pricing until this is done.</p>
              <p className="mt-2"><strong>Stage 7 — Pricing.</strong> Lead with in-person 2x ($299/week). Present it as information, not a pitch. After you say the number: pause. Let it land. Do not fill the silence. The silence is not awkward — it is the lead processing.</p>
              <p className="mt-2"><strong>Stage 8 — Decision.</strong> Three possible paths. Know which one you&apos;re in before you respond. Path A closes cleanly — don&apos;t re-pitch. Path B diagnoses what&apos;s sitting with them and sets a specific follow-up date. Path C selects the pathway and sends the agreement if Founding Client.</p>
            </Training>

            <Note>Lead with in-person 2x ($299/week). Only introduce online ($149/week) if the lead objects to the price. The 3x in-person package ($409/week) is not presented on the Zoom — it is coach-assessed and offered during weekly check-ins once coaching is underway. Founding client rates: 2x $149.50/week, 3x $204.50/week, online $74.50/week.</Note>
          </Section>

          {/* Section 3 */}
          <Section id="coaching-entry" title="3. Coaching Entry" colour="teal">
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
              <li>Sessions — for face-to-face clients only (see below)</li>
              <li>Weekly check-in (Form A or B, window-gated)</li>
              <li>Weekly training check-in — if they have an active program</li>
              <li>Weekly nutrition check-in — if they have an active nutrition plan</li>
              <li>View your program — full session-by-session program view</li>
              <li>View your nutrition plan — full meal-by-meal plan view</li>
              <li>Active Coaching Client Guide link</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Sessions (Face-to-Face Clients)</p>
            <p>Face-to-face clients see a <strong>Sessions</strong> section in their portal home that links to <strong>/portal/[token]/sessions</strong>. This page shows:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-1">
              <li>All their fixed weekly slots (e.g. Mondays · 7:00 am · 60 min, Wednesdays · 7:00 am · 60 min)</li>
              <li>Upcoming session occurrences across all slots — with a <strong>Confirmed</strong> badge if the session has been confirmed, or <strong>Scheduled</strong> for regular upcoming occurrences</li>
              <li>A reschedule section — shows available face-to-face slots for the next 21 days. The client selects a time and confirms the booking. You and the client both receive a branded confirmation email.</li>
            </ul>
            <p className="mt-2">To set up a client&apos;s fixed sessions, go to their client profile and click <strong>Set up →</strong> next to the Face-to-Face Session card. Click <strong>+ Add slot</strong> for each recurring day — pick the day, time, and duration. Slots appear as a list and can be removed individually with the ✕ button.</p>
            <p className="mt-2">To book an individual session from the dashboard, go to the Face-to-Face Sessions page and use the <strong>Book a session</strong> form in the Booked Sessions panel. Pick the date, time, and duration — this creates a <code className="bg-stone-800 px-1 rounded text-teal-300 text-xs">client_sessions</code> record. The session then shows as <strong>Confirmed</strong> in the client portal once the client confirms attendance via the reminder email.</p>
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
            <p>Once a package is selected, three options appear: <strong>Send to Client</strong> (sends immediately), <strong>Copy Link</strong> (copies to clipboard), and <strong>Schedule Send</strong>. The link includes the client&apos;s ID so the system can identify them when they pay. When the client completes payment, the <strong>Subscription Active</strong> badge appears automatically on the client profile.</p>
            <p className="font-semibold text-white mt-4">Scheduling a delayed send</p>
            <p>If you want to queue the subscription link now but have it land in the client&apos;s inbox on a specific date, click <strong>Schedule Send</strong>, pick a date, and confirm. The system will send it automatically at 8am Brisbane time on that day. A yellow <em>Scheduled for [date]</em> badge appears on the profile — click Cancel next to it to remove the scheduled send before it fires. Once sent, the badge is replaced with the sent date.</p>
            <p>To upgrade a client from 2x to 3x:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
              <li>Cancel the existing $299/week subscription in Stripe.</li>
              <li>Select <strong>In-Person 3x</strong> on the client profile.</li>
              <li>Copy and send the $409/week subscription link to the client.</li>
              <li>Update to 3x once they have subscribed.</li>
            </ol>
            <Note>The 3x package is coach-assessed. Only offer it during weekly check-ins once you have enough data to confirm the client can sustain three sessions per week.</Note>
            <p className="font-semibold text-white mt-4">Upgrade Companion</p>
            <p>When a 2x client reaches Week 8 and is consistently progressing, a teal <strong>Upgrade Companion</strong> link appears in the Coaching Package card on their profile. This opens a 5-stage conversation guide that walks through how to raise and present the upgrade in a session. The client dashboard also surfaces an <strong>Upgrade</strong> badge next to eligible clients and shows a teal banner at the top of the clients list.</p>
            <p>The upgrade companion covers: performance check (is the client actually ready?), making the case using their data, presenting the $299 to $409 price difference, handling objections, and closing with a clear yes/defer/no outcome.</p>
            <Training title="Why 3x is not offered on the Zoom">
              <p>On the Zoom call, you have a report, one conversation, and whatever they told you about themselves. That is not enough data to know whether a client can sustain three sessions per week on top of their life. Offering 3x too early sets up a client for a load they cannot maintain - and when they struggle with it, they attribute the problem to the program rather than the prescription.</p>
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
              <li><strong>Upgrade badge</strong> — Teal badge shown on any 2x client at Week 8+. Indicates they are eligible for the upgrade conversation. A banner also appears at the top of the clients list when one or more clients are eligible.</li>
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
              <FlowRow trigger="Lead books via Calendly" from="Report Sent (or earlier)" to="Zoom Booked" auto />
              <FlowRow trigger="Commencement fee paid via Stripe" from="Any" to="Commencement Fee Paid" auto />
            </div>
            <p className="mt-2">These transitions are manual — they require your input after the call or conversation:</p>
            <div className="space-y-2">
              <FlowRow trigger="Decision at Zoom (Path B or C)" from="Zoom Booked" to="Zoom Completed" auto={false} />
              <FlowRow trigger="Lead declines at Zoom (Path A)" from="Zoom Booked" to="Closed - Declined" auto={false} />
              <FlowRow trigger="Lead did not attend Zoom" from="Zoom Booked" to="Closed - No Show" auto={false} />
              <FlowRow trigger="Report sent but no booking after follow-ups" from="Report Sent" to="Cold - No Booking" auto={false} />
            </div>
            <Training title="What requires your attention vs what runs itself">
              <p>The automations handle the objective triggers — payment, quiz submission, Calendly booking. You handle the human judgements — whether the Zoom is complete, which path the Zoom conversation ended on, whether a lead genuinely went cold or just needs more time.</p>
              <p className="mt-2">The manual transitions are not admin tasks. They are your interpretive decisions about where a lead is in the process. Keeping them accurate keeps the pipeline data trustworthy. If statuses drift, you lose visibility into where the real friction is.</p>
            </Training>
          </Section>

          <Section id="email-sequences" title="15. Email Sequences and Automation" colour="teal">
            <p>The following outbound email sequences run automatically. All emails send from <strong>kade@bodyrecode.au</strong> via Resend. All automated emails use a <strong>dark card template</strong> — black outer background, #111111 inner card, Body Recode logo header, Kade signature with photo at the bottom.</p>

            <p className="font-semibold text-white mt-4">Scorecard Submission Notification (to you)</p>
            <p>Sent to kade@bodyrecode.au <strong>every time</strong> someone completes the Body State Scorecard. Shows the lead&apos;s name, email, score, and body state. No action required — the lead is already created in the CRM automatically.</p>

            <p className="font-semibold text-white mt-4">Body Decode Report Delivery (to lead)</p>
            <p>Sent automatically when a lead purchases the $37 Body Decode Report via Stripe. Contains a unique link to their personalised report at app.bodyrecode.au/report/[token]. Triggered by the Stripe webhook — no manual handling required.</p>

            <p className="font-semibold text-white mt-2">Performance Report + Follow-Up Sequence</p>
            <p>Triggered when a lead completes the Body State Scorecard. The report is scheduled to send the following morning at 9am Brisbane time.</p>
            <div className="space-y-1">
              <SeqRow day="Next morning 9am" label="Performance report email" />
              <SeqRow day="Day 2" label="Follow-up 1 — Re: Your check-in report" />
              <SeqRow day="Day 5" label="Follow-up 2 — When the effort doesn't match the result" />
              <SeqRow day="Day 9" label="Follow-up 3 — Last one from me, [name]" />
            </div>
            <p className="mt-2">The follow-up sequence is <strong>automatically cancelled</strong> the moment the lead books a Zoom. If you need to cancel it manually, use the Cancel Sequence button on the lead detail page.</p>

            <p className="font-semibold text-white mt-4">Re-engagement Blast (Admin Action)</p>
            <p>A one-time admin action available on the dashboard homepage. Sends the re-engagement email plus a fresh follow-up sequence to all leads who have scorecard data on file. Any previously scheduled follow-ups are cancelled before the new sequence is sent.</p>
            <p>Leads with statuses <strong>Commencement Fee Paid</strong>, <strong>Closed - Declined</strong>, or <strong>Closed - No Show</strong> do not receive new follow-ups.</p>

            <p className="font-semibold text-white mt-4">No-Show Re-engagement Sequence</p>
            <p>Triggered manually from the lead detail page when a lead is marked Closed - No Show.</p>
            <div className="space-y-1">
              <SeqRow day="Next morning 9am" label="Missed you yesterday — door left open" />
              <SeqRow day="Day 5" label="Gentle follow-up — patterns worth talking through" />
              <SeqRow day="Day 12" label="Final invitation — leaving the door open" />
            </div>

            <p className="font-semibold text-white mt-4">Zoom Declined Follow-up Sequence</p>
            <p>Triggered automatically when you click <strong>Send declined follow-up</strong> on the Zoom companion page. Fires a 3-email re-engagement sequence alongside the self-guided program offer (see below).</p>
            <div className="space-y-1">
              <SeqRow day="Next morning 9am" label="Good speaking yesterday — timing understood, door open" />
              <SeqRow day="Day 5" label="Still here if the timing changes" />
              <SeqRow day="Day 12" label="Last one from me" />
            </div>

            <p className="font-semibold text-white mt-4">Self-Guided Program Offer (Downsell)</p>
            <p>Fires automatically alongside the Zoom declined sequence. Sends a branded offer email with a Stripe checkout link for the $97 12-week self-guided program tailored to the lead&apos;s body state. No manual action required — the offer is created and sent the moment decline is triggered.</p>

            <p className="font-semibold text-white mt-4">Self-Guided Program Delivery</p>
            <p>Triggered automatically by the Stripe webhook when a lead purchases the $97 program. Sends a branded delivery email with a unique, token-gated link to their program page at app.bodyrecode.au/program/[token]. You also receive a notification email with a link to the lead profile.</p>

            <p className="font-semibold text-white mt-4">Program Buyer Nurture Sequence</p>
            <p>Scheduled automatically at the moment of program purchase. Three emails spaced across the 12-week program to nurture buyers back toward a coaching conversation. All emails land on a call booking — no pricing or product is mentioned.</p>
            <div className="space-y-1">
              <SeqRow day="Week 4 (Day 28)" label="Four weeks in — Phase 1 check-in, soft coaching mention" />
              <SeqRow day="Week 8 (Day 56)" label="The compounding point — coaching makes the biggest difference here" />
              <SeqRow day="Week 12 (Day 84)" label="End of the program — what comes next?" />
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

            <p className="font-semibold text-white mt-4">Face-to-Face Session Booked (to client + to you)</p>
            <p>Sent when a client books a reschedule slot from their portal Sessions page. The client receives a branded confirmation with date, time, and duration. You receive a notification showing who booked and when.</p>

            <p className="font-semibold text-white mt-4">Coaching Start Reminder</p>
            <p>Sent automatically the day before a client&apos;s coaching start date. Triggered by a Vercel cron job that runs daily.</p>

            <p className="font-semibold text-white mt-4">Founding Client Case Study Agreement</p>
            <p>Sent manually from the Zoom companion when a Founding Client pathway is selected at Stage 8. Click <strong>Send Case Study Agreement</strong> — the system creates the agreement record, generates a unique signing token, and emails the lead a link to review and sign online. The agreement must be signed before the commencement fee is sent.</p>

            <Training title="The logic behind the follow-up timing">
              <p>Day 2, Day 5, Day 9. Not daily. Not weekly. The gaps are intentional. Day 2 is when the report is still fresh. Day 5 is when most people have filed it away but haven&apos;t fully forgotten it. Day 9 is the last reach — the tone shifts to a genuine close. Running them too close together feels like pressure. Too far apart and the thread is lost.</p>
              <p className="mt-2">The sequence cancels automatically on booking because the goal of the sequence is a Zoom. Once that happens, the follow-ups would be noise. They don&apos;t just stop — they are actively cancelled so nothing goes out while the lead is already in the pipeline.</p>
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

          <Section id="assets" title="16b. Assets" colour="teal">
            <p>The <strong>Assets</strong> page (nav bar) is a central library of everything that goes out to leads and clients. Use it to review any asset before or after it is sent.</p>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">What is listed</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Self-Guided Programs</strong> — Depleted, Transitioning, and Ready. Click any to see the full 12-week program exactly as the client sees it at app.bodyrecode.au/program/[token].</li>
              <li><strong>Downsell Emails</strong> — Per state: the offer email (sent on Zoom decline) and the delivery email (sent after Stripe purchase). Both shown as rendered previews.</li>
              <li><strong>Client-Facing Pages</strong> — Scorecard, booking page, orientation guide, coaching guide. All open in a new tab.</li>
            </ul>
            <Note>Program preview pages use a placeholder name. The real program page is token-gated and personalised to the lead. To see a live example, find a lead who has purchased and click their program token on the lead detail page.</Note>
          </Section>

          <Section id="admin-actions" title="17. Admin Actions" colour="teal">
            <p>The following actions are available on the <strong>Dashboard Homepage</strong>.</p>

            <p className="font-semibold text-white mt-2">Positions Available</p>
            <p>The <strong>Positions Available</strong> card shows the current number of Founder Client Program spots shown on performance.bodyrecode.au/founder. Use the + and - buttons to adjust the count. The page updates within 60 seconds. Decrement this when you accept an applicant, not when they apply.</p>

            <p className="font-semibold text-white mt-2">Admin Actions panel</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Send preview email</strong> — Sends a sample re-engagement report email to kade@bodyrecode.au. Use this to preview formatting and layout before running the blast.</li>
              <li><strong>Resend reports to all leads</strong> — Triggers the re-engagement blast. Cancels all existing follow-up sequences and sends a fresh re-engagement email plus a new 3-email follow-up sequence to every lead with scorecard data. Requires confirmation before firing.</li>
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
              <li><strong>Online ad application</strong> — The primary path for online clients. The landing page at performance.bodyrecode.au/founder directs applicants through the Body State Scorecard as step one of the application. Applications come in tagged as source: Founder Program in the leads list. Review the scorecard results and set the application status on the lead detail page.</li>
              <li><strong>Objection-triggered on Zoom</strong> — The full rate offer is made first. If the lead objects to price, the Founding Client offer is introduced as the second offer. Use the Objection-Triggered tab in the Zoom companion.</li>
              <li><strong>Manual override on Zoom</strong> — For a high-suitability lead, you may proactively offer the program before any objection arises. Use the Manual Override tab. All four criteria on the checklist must be true before using it.</li>
            </ul>

            <p className="font-semibold text-white mt-2">Managing online applications</p>
            <p>Applications from the landing page arrive in your leads list with a teal <strong>Founder</strong> badge. Use the <strong>Founder Program</strong> filter at the top of the leads list to view them in isolation.</p>
            <p className="mt-2">On each founder lead&apos;s detail page, a <strong>Founder Client Application</strong> section appears at the top. Review their scorecard results below it and update the application status using the status button:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-1">
              <li><strong>Under Review</strong> — Default state. Application received, not yet assessed.</li>
              <li><strong>Accepted</strong> — Position offered. Proceed to booking and coaching entry.</li>
              <li><strong>Declined</strong> — Not a fit for this cohort.</li>
              <li><strong>Waitlisted</strong> — Suitable but no positions available right now.</li>
            </ul>
            <p className="mt-2">When you accept an applicant, decrement the positions counter on the Dashboard Homepage using the Positions Available control. The landing page updates within 60 seconds.</p>

            <Training title="Objection-triggered vs manual override — know the difference">
              <p><strong>Objection-triggered</strong> is the standard Zoom pathway. Full rate goes first, always. If the lead objects to price, you handle the objection first, and if they still need something to move, the Founding Client program becomes the second offer. The script walks you through the steps — use it.</p>
              <p className="mt-2"><strong>Manual override</strong> is not for when you want to help someone who cannot afford the full rate. That is a misuse of the program and a misuse of a position. Manual override is for a lead where the case study potential is genuinely high. All four criteria on the checklist must be true before you use it.</p>
            </Training>

            <p className="font-semibold text-white mt-2">Agreement before commencement</p>
            <p>The Founding Client Case Study Agreement must be signed before the commencement fee is sent. This is non-negotiable. The sequence is:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
              <li>Lead accepts the Founding Client offer (at the Zoom call, or via the online application path).</li>
              <li>Select Path C and the Founding Client pathway in the Zoom decision panel, or proceed from the lead detail page for online applicants.</li>
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
              <li><strong>In-Person 3x — $409/week</strong> — Static link. Coach-assessed upgrade, offered during weekly check-ins not on the Zoom.</li>
              <li><strong>Online — $149/week</strong> — Static link. Fallback if lead objects to in-person pricing.</li>
            </ul>
            <p>Payment links for the weekly subscription are available in the Zoom companion Stage 8 Decision panel.</p>
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
              { label: 'Zoom Booked', desc: 'Zoom call scheduled' },
              { label: 'Zoom Completed', desc: 'Zoom done — decision made' },
              { label: 'Commencement Fee Paid', desc: 'Payment received — awaiting subscription' },
              { label: 'Active Client', desc: 'Converted — now in coaching dashboard' },
            ]} />

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Contact Detail</p>
            <p>Click any lead card to open the contact detail page. From here you can:</p>
            <ul className="space-y-1.5 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Edit contact details</strong> — click Edit contact details to update name, email, and phone in-place</li>
              <li><strong>Move pipeline stage</strong> — use the stage mover to advance or move back through the 8 stages</li>
              <li><strong>Edit notes</strong> — freeform notes field, auto-saves on blur</li>
              <li><strong>Quick links</strong> — jump to Performance Report, Zoom Companion, or the converted client profile (if applicable)</li>
              <li><strong>Coaching Tools</strong> — opens the lead detail page in the main coaching dashboard</li>
            </ul>

            <Note>Pipeline stages update automatically when a booking is made or a Stripe payment completes. You can also move them manually using the stage mover on the contact detail page.</Note>
          </Section>

          <Section id="be-bookings" title="24. Bookings" colour="amber">
            <p>The booking system replaces Calendly entirely. All Zoom calls are booked through <strong>bodyrecode.au/book</strong> — a public page showing available slots. When a lead books, a Zoom meeting is created automatically and a calendar invite (.ics) is emailed to both the lead and you.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Availability</p>
            <p>Manage your Zoom availability at <strong>Business → Availability</strong>. You can add or remove day-of-week rules, set start/end times, slot duration, and buffer gaps. Toggle a rule active or paused without deleting it. Changes take effect immediately — the public booking page at bodyrecode.au/book shows slots for the next 14 days.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Blocked Times</p>
            <p>If something comes up in your diary, use <strong>Business → Availability → Block out time</strong> to block a specific date and time range. Blocked times are excluded from the public booking page so leads cannot book those slots. Add an optional reason for your own reference. The calendar feed sync is one-way — personal diary events don&apos;t automatically block platform slots, so manually add a block here when needed.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">What Happens on Zoom Booking</p>
            <ul className="space-y-1.5 list-disc list-inside text-stone-300 text-sm">
              <li>Zoom meeting created automatically — join link emailed to both parties via branded dark email</li>
              <li>Lead record created or updated in CRM</li>
              <li>Pipeline stage moves to Zoom Booked</li>
              <li>Automation trigger fires — any workflows on booking_created will run</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Face-to-Face Session Booking (from Client Portal)</p>
            <p>Face-to-face clients can reschedule a session directly from their portal. When they book a slot, a <code className="bg-stone-800 px-1 rounded text-teal-300 text-xs">client_sessions</code> record is created with <code className="bg-stone-800 px-1 rounded text-teal-300 text-xs">status = scheduled</code>, and a branded confirmation email goes to both the client and you. Booked slots are blocked and won&apos;t appear for other clients.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Session Reminder Emails</p>
            <p>Every day at 8:00 am Brisbane time, a cron job scans for sessions scheduled in the next 20–28 hours that haven&apos;t had a reminder sent yet. The client receives a branded email with a <strong>Confirm attendance →</strong> button. Clicking that link marks the session as confirmed (<code className="bg-stone-800 px-1 rounded text-teal-300 text-xs">confirmed_at</code> is set) and notifies you by email. The session then shows a <strong>Confirmed</strong> badge in the portal and on the dashboard client profile. If the session is already confirmed, the link shows a friendly &quot;already confirmed&quot; message instead.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Calendar Auto-Sync (Mac Calendar)</p>
            <p>All scheduled bookings sync automatically to your Mac Calendar via a <strong>webcal subscription</strong>. The feed URL is:</p>
            <p className="mt-1 font-mono text-xs text-teal-300 bg-stone-900 rounded-lg px-4 py-2">webcal://bodyrecode.au/api/calendar/feed?key=CALENDAR_FEED_KEY</p>
            <p className="mt-2">To subscribe: open Calendar on your Mac → File → New Calendar Subscription → paste the webcal:// URL → set auto-refresh to Every 15 Minutes. The calendar updates automatically as bookings are made or changed. No manual export needed.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Manual Bookings</p>
            <p>You can also create bookings from <strong>Business → Bookings → New Booking</strong>. Select the contact, type (Zoom, Other), date/time, and duration. Zoom is created automatically and an email is sent to you (not the lead — use Inbox to send them the link if needed).</p>

            <Note>The Zoom booking page is fully public — share the link bodyrecode.au/book anywhere. It shows available times for the next 14 days. After booking, the lead is redirected to performance.bodyrecode.au.</Note>
          </Section>

          <Section id="be-automations" title="25. Automations" colour="amber">
            <p>Automations run sequences automatically when something happens. There are two types: <strong>System Automations</strong> (pre-built, always active, cannot be edited) and <strong>Custom Workflows</strong> (user-built via the workflow editor).</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">System Automations</p>
            <p>These run without any configuration. They are always active. Click any entry to see the full email sequence, copy, and timing.</p>
            <StatusList items={[
              { label: 'Scorecard Follow-up Sequence', desc: '4-email sequence triggered when someone completes the Body State Scorecard' },
              { label: 'Performance Report Follow-up', desc: '3-email sequence sent after a performance report is delivered to a lead' },
              { label: 'Zoom Booking Confirmation', desc: 'Confirmation + .ics sent to lead on booking, 2-hour reminder, 30-minute reminder, plus coach notification to kade@bodyrecode.au (4 emails total)' },
              { label: 'No-show Re-engagement', desc: '3-email sequence for leads who missed their scheduled Zoom call' },
              { label: 'Zoom Declined Follow-up', desc: '3-email re-engagement sequence sent when a lead declines after the Zoom call' },
              { label: 'Self-Guided Program Offer', desc: '$97 program offer email sent automatically alongside the Zoom declined sequence' },
              { label: 'Program Buyer Nurture', desc: '3-email sequence (Week 4, 8, 12) to bring program buyers back into coaching' },
            ]} />

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Custom Workflows</p>
            <p>Automations let you build sequences that run automatically when something happens — a lead books, a payment comes through, a tag is added. Each automation is a workflow with a trigger and a series of steps.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Triggers</p>
            <StatusList items={[
              { label: 'lead_created', desc: 'A new lead enters the system for the first time' },
              { label: 'booking_created', desc: 'Any booking is made (filter by type: zoom)' },
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

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Scorecard Follow-up Sequence</p>
            <p>A pre-built 2-email follow-up sequence fires automatically when someone completes the Body State Scorecard. It is seeded via <strong>Business → Automations → Reseed Scorecard Sequence</strong>. The sequence uses trigger <code className="bg-stone-800 px-1 rounded text-teal-300 text-xs">form_submitted</code> with <code className="bg-stone-800 px-1 rounded text-teal-300 text-xs">{`{ form: 'scorecard' }`}</code>.</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-2">
              <li><strong>Email 1 (immediate)</strong> — Surfaces their score and body state, invites them to book a free call at bodyrecode.au/book</li>
              <li><strong>Email 2 (3 days later)</strong> — Follow-up nudge, links back to the booking page</li>
            </ul>
            <p className="mt-2">Emails support scorecard-specific template variables:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-1">
              <li><code className="bg-stone-800 px-1 rounded text-teal-300 text-xs">{`{{scorecard_score}}`}</code> — e.g. 7</li>
              <li><code className="bg-stone-800 px-1 rounded text-teal-300 text-xs">{`{{scorecard_state}}`}</code> — e.g. Transitioning</li>
              <li><code className="bg-stone-800 px-1 rounded text-teal-300 text-xs">{`{{first_name}}`}</code> — lead&apos;s first name</li>
            </ul>
            <p className="mt-2">To update the email copy: edit the steps in <strong>Business → Automations</strong>, then hit <strong>Reseed</strong> to rewrite the sequence. Reseeding deletes and recreates the workflow steps — it does not affect in-progress sequences already running for existing leads.</p>
            <Note>Wait steps are handled by Inngest — a background job service. A "wait 3 days" step will actually wait 3 days, even across server restarts. Execution history is logged per contact under each workflow run.</Note>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Zoom Booking Confirmation Emails</p>
            <p>These are system-level emails that fire automatically every time a Zoom is booked - no configuration required. They fire from the same booking endpoint the moment a slot is confirmed.</p>
            <StatusList items={[
              { label: 'Confirmation Email', desc: 'Branded dark card with date, time (AEST), Zoom join link, and .ics calendar attachment - sent to the lead immediately on booking' },
              { label: '2-Hour Reminder', desc: 'Scheduled email to the lead with Zoom join link, fires 2 hours before the call start time' },
              { label: '30-Minute Reminder', desc: 'Final reminder to the lead with Zoom join link, fires 30 minutes before the call' },
              { label: 'Coach Notification', desc: "Sent to kade@bodyrecode.au immediately on booking with the lead's name, email, date/time, Zoom link, and a link to their CRM record" },
            ]} />
            <p className="mt-2">All booking emails use the approved dark card template: black outer, #111111 inner card, Body Recode logo, and the coach signature with photo.</p>
            <Note>No setup needed - these emails are always active for every booking made via bodyrecode.au/book or the manual booking tool in Business → Bookings.</Note>
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
              { label: 'Coaching Commencement Fee', desc: '$240 — one-time. Send to every lead who agrees to proceed at the Zoom call.' },
              { label: 'Online Coaching', desc: '$149/week recurring' },
              { label: 'In-Person 2x', desc: '$299/week recurring — lead with this on the Zoom' },
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
              { label: 'Bookings', desc: 'Total bookings, split by type (Zoom, Other)' },
            ]} />

            <Note>All metrics read directly from your live data. The analytics page refreshes on each load — there is no caching delay.</Note>
          </Section>

          <Section id="be-sources" title="31. Lead Sources" colour="amber">
            <p>The Lead Sources page (<strong>Dashboard → Lead Sources</strong>) gives you source-tracked URLs for every channel. Paste any URL into a QR code generator or link in bio tool and every lead that comes through it is automatically tagged with the correct source in the CRM.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">QR Code URLs</p>
            <p>For physical print materials. Each URL passes a source tag through to the lead record on submission.</p>
            <StatusList items={[
              { label: 'Floor Banner', desc: 'bodyrecode.au/not-a-sign-up?source=qr_floor_banner — routes to the Body State Scorecard' },
              { label: 'Window Decal', desc: 'bodyrecode.au/not-a-sign-up?source=qr_window' },
              { label: 'Business Card', desc: 'bodyrecode.au/not-a-sign-up?source=qr_card' },
              { label: 'Flyer', desc: 'bodyrecode.au/not-a-sign-up?source=qr_flyer — routes to the Body State Scorecard' },
            ]} />

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Scorecard URLs</p>
            <p>Use these for Instagram bio and scorecard-specific posts. These link directly to the Body State Scorecard with source tracking — use these as your primary Instagram link in bio.</p>
            <StatusList items={[
              { label: 'Instagram', desc: 'bodyrecode.au/scorecard?source=instagram' },
              { label: 'Website', desc: 'bodyrecode.au/scorecard?source=website' },
              { label: 'Facebook', desc: 'bodyrecode.au/scorecard?source=facebook' },
            ]} />

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Digital Channel URLs</p>
            <p>For the Performance Check-In quiz — use these if sending traffic directly to the longer check-in rather than the scorecard.</p>
            <StatusList items={[
              { label: 'Instagram', desc: 'bodyrecode.au/performance-check-in-quiz?source=instagram' },
              { label: 'Website', desc: 'bodyrecode.au/performance-check-in-quiz?source=website' },
              { label: 'Facebook', desc: 'bodyrecode.au/performance-check-in-quiz?source=facebook' },
              { label: 'Google', desc: 'bodyrecode.au/performance-check-in-quiz?source=google' },
            ]} />

            <Note>The source breakdown at the bottom of the page shows how many leads came from each channel. Use this to evaluate which entry points are producing leads before running ads.</Note>
          </Section>

          <Section id="be-ads" title="32. Ads" colour="amber">
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

          <Section id="be-content-engine" title="33. Content Engine" colour="amber">
            <p>The Content Engine generates batches of platform-ready ad copy and reel scripts using a modular hook, message, and CTA library. Everything is generated using Claude AI with the Body Recode brand voice and positioning enforced automatically.</p>
            <p>Navigate to <strong>Business → Content Engine</strong> to access it. The engine has six tabs: Hooks, Messages, CTAs, Generate, Outputs, and Card Library.</p>

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
            <p>The Generate tab has two modes:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-2">
              <li><strong>Selective Generate</strong> — Choose specific hooks, messages, CTAs, and one platform. One variant is produced per combination. Use for targeted campaigns or testing specific angles.</li>
              <li><strong>Generate Everything</strong> — One click. Selects every hook, message, and CTA and runs all 5 platforms sequentially. Shows a live progress bar. Use this to build the full content library in a single session.</li>
            </ul>
            <p className="mt-3 text-xs font-semibold text-stone-400">The maths</p>
            <div className="mt-2 bg-stone-800/60 rounded-lg p-4 text-xs text-stone-300 font-mono leading-relaxed">
              50 hooks × 5 messages × 3 CTAs = 750 outputs (single platform)<br/>
              50 hooks × 5 messages × 3 CTAs × 5 platforms = 3,750 outputs (Generate All)
            </div>
            <p className="mt-3">From each output you can also produce:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-1">
              <li><strong>Graphic</strong> — 1080×1080 PNG (16 card styles across 4 categories — see Card Styles below). Download and post as a static Instagram or Facebook post.</li>
              <li><strong>Carousel</strong> — 5–7 slides auto-generated by Claude, each rendered as a PNG, downloaded as a ZIP. Upload directly to Instagram as a carousel.</li>
              <li><strong>Reel</strong> — AI avatar video in your voice and likeness (see AI Reel Generation below).</li>
            </ul>
            <p className="mt-2">Platforms:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>Meta Ad</strong> — Primary text, 125 characters max, punchy.</li>
              <li><strong>Instagram Caption</strong> — Conversational, 150–200 characters, hook in first line.</li>
              <li><strong>TikTok Script</strong> — Spoken word, 30–45 seconds, casual and direct.</li>
              <li><strong>Email Snippet</strong> — Subject line and 2–3 sentence opener.</li>
              <li><strong>Landing Page</strong> — Headline and subheadline pair.</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Outputs</p>
            <p>All generated content is saved to the Outputs tab as drafts. Each output shows the platform, hook category, and the full content text. From each output you can:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-2">
              <li><strong>Copy to clipboard</strong> — paste directly into any platform or ad manager.</li>
              <li><strong>Create Graphic</strong> — choose from 16 card styles (see Card Styles below). Preview and download as 1080×1080 PNG.</li>
              <li><strong>Create Carousel</strong> — Claude breaks the content into 5–7 slides. Preview all slides, download as ZIP.</li>
              <li><strong>Generate Reel</strong> — sends to ElevenLabs (your voice) then HeyGen (your avatar). Download MP4 when ready.</li>
              <li><strong>Update status</strong> — Draft → Approved → Deployed → Winning → Removed.</li>
            </ul>
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

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Full Reel Production Flow</p>
            <p>The HeyGen output is a talking head — your avatar speaking the script. For a fully edited reel with b-roll, captions, and music, a post-production step is required. AI cannot reliably generate contextually accurate b-roll matching your brand, clients, and locations. The solution is a hybrid model.</p>

            <p className="mt-3 text-xs font-semibold text-stone-400">Step 1 — Build a B-Roll Library (one-time)</p>
            <p className="mt-1">Film 1 hour of raw footage on your iPhone. No speaking required. This library is reused across every reel you ever produce.</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-2">
              <li><strong>You (no speaking)</strong> — walking, training, at desk, reviewing data</li>
              <li><strong>Coaching context</strong> — client sessions (with permission), gym equipment, measurement setup</li>
              <li><strong>Brisbane / lifestyle</strong> — outdoor locations, morning routine, city backgrounds</li>
            </ul>
            <p className="mt-2">Store all clips in a shared folder. Your editor pulls from this library for every reel.</p>

            <p className="mt-3 text-xs font-semibold text-stone-400">Step 2 — Generate Talking Head (Content Engine)</p>
            <p className="mt-1">Content Engine generates script → ElevenLabs converts to your voice → HeyGen renders your AI avatar → download MP4.</p>

            <p className="mt-3 text-xs font-semibold text-stone-400">Step 3 — Post-Production</p>
            <p className="mt-1">Choose based on volume and quality required:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-2">
              <li><strong>Captions.ai (~$20/mo)</strong> — Upload the HeyGen MP4. Auto-adds animated captions, b-roll suggestions, background music. Best for high-volume organic reels. 5 minutes per reel.</li>
              <li><strong>CapCut (free)</strong> — Manual assembly. Cut in b-roll from your library, add captions and music. 15–20 minutes per reel. Good quality control.</li>
              <li><strong>Upwork editor ($15–50/reel)</strong> — Send HeyGen MP4 + b-roll library link + the script text as a brief. 24–48hr turnaround. Best for paid ad creatives and hero content.</li>
            </ul>

            <p className="mt-3 text-xs font-semibold text-stone-400">Step 4 — Post</p>
            <p className="mt-1">Upload the finished MP4 manually to Instagram Reels, TikTok, or Meta Ads Manager. Use the copy from the Content Engine output as the caption.</p>

            <p className="mt-3 text-xs font-semibold text-stone-400">Complete Pipeline</p>
            <div className="mt-2 bg-stone-800/60 rounded-lg p-4 text-xs text-stone-300 font-mono leading-relaxed">
              Content Engine → script<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;↓<br/>
              ElevenLabs → Kade&apos;s voice (audio)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;↓<br/>
              HeyGen → AI avatar talking head (MP4)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;↓<br/>
              Captions.ai / CapCut / Editor → b-roll + captions + music<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;↓<br/>
              Finished reel (9:16, 30–60 sec)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;↓<br/>
              Post → Instagram Reels / TikTok / Meta Ads
            </div>

            <Note>The Generate function uses Claude Sonnet with the Body Recode brand voice baked into the prompt — no hype language, no long dashes, no exclamation marks, calm authority. You do not need to prompt-engineer the output. Review and approve before deploying.</Note>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Card Library Tab</p>
            <p>The Card Library tab shows all 16 pre-made card templates as a preview grid. Click <strong>Download PNG</strong> on any card to save it as a 1080×1080 PNG ready to post. On mobile, open the dashboard in your browser, go to Business → Content Engine → Card Library, and download directly to your camera roll.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Card Styles</p>
            <p>The graphic API generates 1080×1080 PNG cards. All styles use the brand dark background (<code className="text-teal-400 text-xs bg-stone-800 px-1 py-0.5 rounded">#0c0a09</code>) except the Founder card which uses deep teal. A full visual reference with example images is saved at <code className="text-teal-400 text-xs bg-stone-800 px-1 py-0.5 rounded">Dropbox/01_BODY_RECODE/07_MARKETING/04_CONTENT_LIBRARY/card-designs/card-designs-reference.html</code>.</p>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mt-3 mb-1">Text Cards</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>logo-only</strong> — Centred teal logo on dark background. Brand arrival post.</li>
              <li><strong>statement</strong> — Teal accent bar, large headline, sub-copy. Standard authority post.</li>
              <li><strong>question</strong> — Same layout as statement, question framing. Pattern recognition posts.</li>
              <li><strong>insight</strong> — Teal top bar, label, headline, body copy. Scorecard PDF aesthetic.</li>
            </ul>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mt-3 mb-1">Body State Cards</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>body-state</strong> — Left coloured border card. Use <code className="text-teal-400 text-xs bg-stone-800 px-1 py-0.5 rounded">accent=red</code> (Depleted), <code className="text-teal-400 text-xs bg-stone-800 px-1 py-0.5 rounded">accent=amber</code> (Transitioning), <code className="text-teal-400 text-xs bg-stone-800 px-1 py-0.5 rounded">accent=teal</code> (Ready).</li>
            </ul>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mt-3 mb-1">Photo Cards (uses kade.jpg)</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>photo-split</strong> — Photo left half, text right half with gradient fade.</li>
              <li><strong>photo-quote</strong> — Big headline top, photo inset bottom right.</li>
              <li><strong>photo-top</strong> — Photo pinned top, dark text panel below.</li>
              <li><strong>photo-right</strong> — Text left, full-height photo right with gradient fade.</li>
            </ul>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mt-3 mb-1">Carousel Cards</p>
            <p className="text-stone-400 text-xs mb-1">All carousel cards share a left teal border stripe for visual consistency when swiped.</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>carousel-hook</strong> — Slide 1. Big hook headline, optional sub-copy, Swipe indicator.</li>
              <li><strong>carousel-slide</strong> — Interior numbered slides. Use <code className="text-teal-400 text-xs bg-stone-800 px-1 py-0.5 rounded">n=2</code>, <code className="text-teal-400 text-xs bg-stone-800 px-1 py-0.5 rounded">n=3</code> etc. for each slide number.</li>
              <li><strong>carousel-cta</strong> — Final slide. Teal pill CTA driving to scorecard or check-in. Use <code className="text-teal-400 text-xs bg-stone-800 px-1 py-0.5 rounded">label=</code> to override CTA button text.</li>
            </ul>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mt-3 mb-1">Conversion Cards</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm">
              <li><strong>scorecard-cta</strong> — Sunday diagnostic post. Shows all 3 body states condensed with colour-coded strips, teal pill CTA, "Free · 2 min · Link in bio".</li>
              <li><strong>founder</strong> — Deep teal background. "Founding Client Program · 20 spots only" badge, trade framing, application language. For founder offer posts only.</li>
            </ul>
          </Section>

          <Section id="be-strategy" title="34. Strategy Hub" colour="amber">
            <p>The Strategy Hub is the central reference for the Body Recode marketing and acquisition strategy. Navigate to <strong>Business → Strategy</strong> to access it.</p>
            <p className="mt-2">It has 8 tabs:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-1">
              <li><strong>Overview</strong> — Mission, funnel flow (Content → Scorecard → Check-In → Consultation → Client), primary platform, posting frequency, ad budget, two parallel objectives (ongoing acquisition + Founding Client Program), and platforms to ignore for now.</li>
              <li><strong>Positioning</strong> — Target audience (primary: women 35–50, secondary: men 35–55), the core problem solved, tone of voice principles, the 5 topics you own, what every post must make people feel, messaging framework (Insight → Signal → Shift → Solution → Momentum), the 3 public-facing body states, and the Never Say/Do list.</li>
              <li><strong>Content System</strong> — Weekly posting cadence (Mon authority / Wed pattern recognition / Fri coach perspective / Sun diagnostic), detailed post ideas and format guidance for each type, and content production guide with effort ratings and tools.</li>
              <li><strong>Pre-Launch</strong> — The 5 pre-launch posts (Brand Arrival, Who You Are, The Problem, Three Body States, Scorecard CTA) with graphic specs, full captions, and posting order. Post these before any ads or founder offer goes live.</li>
              <li><strong>Paid Ads</strong> — Ad strategy, budget, targeting, and 3 full reel scripts (angle, hook, duration, full spoken script) ready to film.</li>
              <li><strong>Founder Program</strong> — Full strategy for filling the 20 Founding Client Program spots, content angles, application language, and the trade framing (never "discount").</li>
              <li><strong>Launch Timeline</strong> — Phase-by-phase launch plan from pre-launch through to scale.</li>
              <li><strong>Content Calendar</strong> — Monthly calendar for scheduling posts. Click any day to see scheduled posts or add a new one. Colour-coded by content type (authority, pattern, coach, diagnostic, founder, ad, pre-launch) and by campaign phase (pre-launch, founder, ads, optimise, scale).</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Content Calendar</p>
            <p>The calendar shows the current month by default. Navigate months with the arrow buttons. Click any day to select it and see what is scheduled. To add a post:</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-1">
              <li>Click a day then click <strong>Add Post</strong>, or click <strong>+ Add Post</strong> at the top of the calendar.</li>
              <li>Fill in date, content type, campaign phase, title, and optional notes.</li>
              <li>Click <strong>Save</strong>. The post appears as a colour-coded dot on the calendar.</li>
              <li>Click any post dot to view or edit it. Use the pencil icon to edit or the trash icon to delete.</li>
            </ul>
            <Note>Calendar posts are saved to Supabase and persist across page refreshes and devices. Changes take effect immediately.</Note>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">The 5 Topics You Own</p>
            <p>Every piece of content maps to one of these five topics. Nothing outside these.</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-1">
              <li><strong>Body State</strong> — Depleted / Transitioning / Ready and why state determines everything.</li>
              <li><strong>Why Effort Isn&apos;t Working</strong> — The training harder / eating less trap.</li>
              <li><strong>Cortisol and Fat Storage</strong> — Stress belt, protection mode, why the body resists.</li>
              <li><strong>Prescription Without Interpretation</strong> — The fundamental flaw in mainstream fitness.</li>
              <li><strong>The Intelligent Approach</strong> — What reading the body first actually looks like.</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Body State Terminology</p>
            <p><strong>Public-facing (Scorecard + social content):</strong> Depleted / Transitioning / Ready. Use these in all Instagram content and the Body State Scorecard.</p>
            <p className="mt-1"><strong>CFFS classification (coaching system only):</strong> Remediation / Optimisation / Post-Optimisation. These are revealed after the full CFFS assessment — not used in pre-CFFS content or social media.</p>
            <Note>Never conflate the two terminologies. The gap between them is intentional — the scorecard gives a signal, the CFFS gives the real classification. That distinction protects the value of the paid coaching system.</Note>
          </Section>

          <Section id="be-social-profiles" title="35. Social Profiles" colour="amber">
            <p>The canonical spec for every Body Recode social profile. Copy each field directly into Instagram.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Instagram — Field by Field</p>
            <div className="space-y-3">

              <div className="bg-stone-800 border border-stone-700 rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-stone-700"><span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Name</span></div>
                <div className="px-4 py-3 font-mono text-sm text-white select-all">Body Recode</div>
              </div>

              <div className="bg-stone-800 border border-stone-700 rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-stone-700"><span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Username</span></div>
                <div className="px-4 py-3 font-mono text-sm text-white select-all">@body_recode_</div>
              </div>

              <div className="bg-stone-800 border border-stone-700 rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-stone-700"><span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Bio — Line 1</span></div>
                <div className="px-4 py-3 font-mono text-sm text-white select-all">Performance coaching for people whose bodies stopped responding.</div>
              </div>

              <div className="bg-stone-800 border border-stone-700 rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-stone-700"><span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Bio — Line 2</span></div>
                <div className="px-4 py-3 font-mono text-sm text-white select-all">Body state interpretation. Training. Nutrition.</div>
              </div>

              <div className="bg-stone-800 border border-stone-700 rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-stone-700"><span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Bio — Line 3</span></div>
                <div className="px-4 py-3 font-mono text-sm text-white select-all">↓ Find out which state you&apos;re in (2 min)</div>
              </div>

              <div className="bg-stone-800 border border-stone-700 rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-stone-700"><span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Link in Bio</span></div>
                <div className="px-4 py-3 font-mono text-sm text-teal-400 select-all">bodyrecode.au/scorecard?source=instagram</div>
              </div>

              <div className="bg-stone-800 border border-stone-700 rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-stone-700"><span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Account Type</span></div>
                <div className="px-4 py-3 text-sm text-white">Creator or Business — not Personal</div>
              </div>

            </div>
            <Note>No emojis except the arrow on line 3. No hashtags. No location. One link, one destination. Do not use Linktree or any link-in-bio tool.</Note>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Tracked Source URLs</p>
            <div className="space-y-2">
              {[
                { source: 'Instagram bio', url: 'bodyrecode.au/scorecard?source=instagram' },
                { source: 'Instagram story', url: 'bodyrecode.au/scorecard?source=instagram_story' },
                { source: 'QR floor banner', url: 'bodyrecode.au/scorecard?source=qr_floor_banner' },
                { source: 'QR flyer', url: 'bodyrecode.au/scorecard?source=qr_flyer' },
              ].map(row => (
                <div key={row.source} className="flex items-center gap-3 bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5">
                  <span className="text-stone-400 text-sm w-36 shrink-0">{row.source}</span>
                  <span className="text-teal-400 font-mono text-xs">{row.url}</span>
                </div>
              ))}
            </div>
            <Note>All URLs redirect to performance.bodyrecode.au/scorecard with source preserved. Every lead that comes in is tagged by source automatically in the CRM.</Note>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Highlight Covers</p>
            <p>Set up highlight covers before outreach begins — even if empty. An account with covers looks established.</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-1">
              <li><strong>About</strong> — What Body Recode is and who it&apos;s for</li>
              <li><strong>Body State</strong> — Depleted / Transitioning / Ready explainer content</li>
              <li><strong>Results</strong> — Client outcomes (add as they come in)</li>
              <li><strong>Scorecard</strong> — How the scorecard works, CTA to take it</li>
              <li><strong>Program</strong> — What coaching looks like in practice</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Content Pillars</p>
            <p>Every post maps to one of five topics. Nothing outside these.</p>
            <ul className="space-y-1 list-disc list-inside text-stone-300 text-sm mt-1">
              <li><strong>Body State</strong> — Depleted / Transitioning / Ready and why state determines everything</li>
              <li><strong>Why effort isn&apos;t working</strong> — The training harder / eating less trap</li>
              <li><strong>Cortisol and fat storage</strong> — Stress, protection mode, why the body resists</li>
              <li><strong>Prescription without interpretation</strong> — The fundamental flaw in mainstream fitness</li>
              <li><strong>The intelligent approach</strong> — What reading the body first actually looks like</li>
            </ul>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Posting Cadence</p>
            <div className="space-y-1">
              {[
                { day: 'Monday', type: 'Authority', desc: 'Insight, mechanism, clinical education' },
                { day: 'Wednesday', type: 'Pattern recognition', desc: '"If you\'re doing X and getting Y"' },
                { day: 'Friday', type: 'Coach perspective', desc: 'Observation, case principle, direct take' },
                { day: 'Sunday', type: 'Diagnostic', desc: 'Body state content, scorecard CTA' },
              ].map(row => (
                <div key={row.day} className="flex items-center gap-3 bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5">
                  <span className="text-stone-400 text-sm w-24 shrink-0">{row.day}</span>
                  <span className="text-white text-sm font-medium w-40 shrink-0">{row.type}</span>
                  <span className="text-stone-400 text-sm">{row.desc}</span>
                </div>
              ))}
            </div>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Launch Sequence</p>
            <ol className="space-y-1.5 list-decimal list-inside text-stone-300 text-sm">
              <li>Profile complete and aligned to this spec</li>
              <li>Warm outreach — 20–30 personal messages to existing contacts</li>
              <li>Daily engagement — 20–30 min per day in target hashtags</li>
              <li>Reach 50 followers before posting any founder content</li>
              <li>5 pre-launch posts in order</li>
              <li>Founder program series (7 posts, 2–3 days apart)</li>
              <li>Regular 4x/week cadence begins</li>
            </ol>
            <Note>Full cold start strategy and post copy are in the Marketing folder: 07_MARKETING/03_ORGANIC_INSTAGRAM/</Note>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Terminology Rule</p>
            <p>Public content and the scorecard use: <strong className="text-white">Depleted / Transitioning / Ready</strong></p>
            <p className="mt-1">The CFFS coaching system uses: <strong className="text-white">Remediation / Optimisation / Post-Optimisation</strong></p>
            <Note>Never use the CFFS classification terms in public content. The gap is intentional — the scorecard gives a signal, the CFFS gives the real classification. That distinction protects the value of the paid system.</Note>
          </Section>

          <Section id="be-website" title="36. Website Analytics" colour="amber">
            <p>Found at <strong>Business → Website</strong>. Shows traffic data from performance.bodyrecode.au pulled directly from Vercel Analytics. The page header links directly to the live site.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Stats</p>
            <StatusList items={[
              { label: 'Visitors', desc: 'Unique devices that landed on the site in the selected period — tracked by Vercel Analytics' },
              { label: 'Page Views', desc: 'Total pages loaded across all visits in the period' },
              { label: 'Scorecard Submissions', desc: 'Pulled from the leads database for the same time window. Shows visitor-to-submission conversion rate if both are non-zero' },
              { label: 'Bounce Rate', desc: 'Percentage of sessions where the visitor left without navigating to a second page' },
            ]} />

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Daily Chart</p>
            <p>Bar chart showing page views per day across the selected range. Today is highlighted in teal. Hover any bar to see exact views and unique visitors for that day. Use this to correlate traffic spikes with posts - you will see immediately which content drove people to the site.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Time Range</p>
            <p>Switch between 7, 30, and 90 day views using the buttons at the top right. All four stats and the daily chart update to match the selected window.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Live Pages</p>
            <p>Quick links to open any page on performance.bodyrecode.au directly from the dashboard - Homepage, How It Works, Online Coaching, Brisbane, Body State Scorecard, Founder Program.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Data Accuracy Note</p>
            <p>Vercel Analytics was enabled in April 2026 - no historical traffic data exists before that date. In the early weeks, visitor counts are low and conversion rate will appear inflated or misleading because scorecard submissions (from the leads DB) span a longer window than visitor data. A warning banner appears automatically while visitor data is sparse. Numbers will stabilise and become meaningful once 4-6 weeks of tracking data has accumulated.</p>

            <Note>Analytics data is sourced from the Vercel API using the VERCEL_API_TOKEN, VERCEL_PERFORMANCE_PROJECT_ID, and VERCEL_TEAM_ID environment variables. If the page shows an error, check those vars are set in Vercel → Project Settings → Environment Variables.</Note>
          </Section>

          {/* ── CHALLENGE SECTIONS ── */}

          <Section id="ch-overview" title="Challenge Overview" colour="teal">
            <p>The 14-Day Body Decode Challenge is a standalone consumer product that runs entirely independently of the Performance Coaching platform. Participants sign up at <strong>bodyrecode.au/challenge</strong>, receive a personal portal link, and move through a 14-day structured reset with daily coaching, training, nutrition, and automated SMS support.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Model</p>
            <p>Evergreen and self-paced. Every participant starts on their own Day 1 at the point of enrollment. All timing is relative to their enrollment date - not a fixed cohort calendar. There are no live sessions, no join windows, and no group structure. Everything is automated.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Purpose in the funnel</p>
            <p>The challenge sits at the top of the Body Recode funnel. It is a free-entry product designed to demonstrate the method, build biological understanding, and ascend participants toward the 6-Week Body Recode Blueprint. The Day 14 email and SMS transition sequence drives this ascension.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Key URLs</p>
            <StatusList items={[
              { label: 'Landing page', desc: 'bodyrecode.au/challenge — signup form, what you get, about the challenge' },
              { label: 'Participant portal', desc: 'bodyrecode.au/challenge/[token] — unique per participant, accessed via their personal link' },
              { label: 'Training page', desc: 'bodyrecode.au/challenge/[token]/training — 3 session plans with full exercise detail' },
              { label: 'Nutrition page', desc: 'bodyrecode.au/challenge/[token]/nutrition — HABNS guide, meal builder, shopping list' },
              { label: 'Privacy Policy', desc: 'bodyrecode.au/privacy' },
              { label: 'Terms', desc: 'bodyrecode.au/terms' },
            ]} />
          </Section>

          <Section id="ch-landing" title="Landing Page" colour="teal">
            <p>Found at <strong>bodyrecode.au/challenge</strong>. Built as a light-theme page (white background, teal accents) — separate from the dark portal experience. The landing page is the public-facing entry point for the challenge.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Sections on the page</p>
            <StatusList items={[
              { label: 'Hero', desc: 'Headline, subheading, and primary CTA button that jumps to the signup form' },
              { label: 'What you get', desc: '7 items including training plan, nutrition guide, morning/evening sequences, Day 5 progress session, Mini Hormone Quiz, and daily SMS coaching' },
              { label: 'How it works', desc: '3-step process: sign up, follow the structure, understand your biology' },
              { label: 'Mid-CTA', desc: 'Mint gradient section with secondary signup prompt' },
              { label: 'Signup form', desc: 'First name, email, and phone (all required). Submits to the enrollment API.' },
              { label: 'Footer', desc: 'Copyright, Privacy Policy, Terms, and contact links' },
            ]} />

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Signup form behaviour</p>
            <p>On submission the form calls <strong>POST /api/challenge/enroll</strong>. If successful, the form is replaced with a success message confirming enrollment and telling the participant to check their email and phone. The portal link is emailed immediately via the welcome email.</p>

            <Note>The landing page links to /privacy and /terms. Both pages are built and live. They are light-theme pages matching the landing page aesthetic.</Note>
          </Section>

          <Section id="ch-enrollment" title="Enrollment Flow" colour="teal">
            <p>Enrollment is handled by <strong>POST /api/challenge/enroll</strong>. It runs the following steps in order:</p>

            <div className="space-y-3 mt-2">
              <ChecklistItem text="Find or create a lead in the leads table using the email address. If the lead exists, update their phone number." />
              <ChecklistItem text="Fire the lead_created automation trigger for new leads only." />
              <ChecklistItem text="Check for an existing active challenge enrollment for this lead. If one exists, return the existing token — no duplicate enrollment." />
              <ChecklistItem text="Create a new challenge_enrollments row with status active, current_day 1, and enrolled_at set to now." />
              <ChecklistItem text="Log a challenge_enrolled event in lead_events." />
              <ChecklistItem text="Fire the form_submitted automation trigger with form: challenge_signup." />
              <ChecklistItem text="Send the challenge/enrolled Inngest event, which triggers the email sequence and SMS sequence in parallel." />
            </div>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Duplicate enrollment handling</p>
            <p>If someone signs up again with the same email, they receive their existing token back. The portal link in the welcome email will take them back to their current enrollment. No new enrollment is created.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Token</p>
            <p>Each enrollment has a UUID token generated by Supabase (default value on the column). This token is the participant's permanent unique identifier for their challenge. It never changes and never expires. The portal URL is <strong>bodyrecode.au/challenge/[token]</strong>.</p>
          </Section>

          <Section id="ch-portal" title="Participant Portal" colour="teal">
            <p>Found at <strong>bodyrecode.au/challenge/[token]</strong>. Dark theme matching the Body Recode brand. The portal is the participant's home for the full 14 days. It is a server-rendered Next.js page that fetches the enrollment from Supabase on every load.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">What the portal shows</p>
            <StatusList items={[
              { label: 'Day counter', desc: 'Calculated from enrolled_at — shows which day the participant is on (1-14), capped at 14' },
              { label: 'Progress bar', desc: 'Visual percentage of the challenge completed' },
              { label: 'Today note', desc: 'Day-specific focus and coaching note — 14 unique entries, one per day' },
              { label: 'PAR-Q and Health Dec forms', desc: 'Shown until both are complete. Training and nutrition are locked behind form completion.' },
              { label: 'Cleared for training banner', desc: 'Shown once both forms are complete. Training and nutrition cards unlock.' },
              { label: 'Resources', desc: 'Training Plan, Nutrition Guide, Morning Reset Sequence, Evening Rhythm Sequence' },
              { label: 'Week One Progress Session', desc: 'Unlocks on Day 5. Video session embedded via NEXT_PUBLIC_CHALLENGE_SESSION_VIDEO_URL env var.' },
              { label: 'Mini Hormone Quiz', desc: 'Unlocks on Day 7. Saved result shown on return visits.' },
              { label: 'Day 14 CTA', desc: 'Shown from Day 14 onward. Links to the 6-Week Blueprint at bodyrecode.au.' },
            ]} />

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Day calculation</p>
            <p>Day is calculated server-side on every page load as <code className="text-teal-400 text-xs bg-stone-800 px-1 py-0.5 rounded">Math.floor((now - enrolledAt) / 86400000) + 1</code>, clamped between 1 and 14. Day 1 is the day of enrollment. Day 2 starts 24 hours after enrollment.</p>

            <Note>The portal does not require a login. Anyone with the token URL can access the portal. Tokens are UUID format (32 hex characters) — they are not guessable by brute force.</Note>
          </Section>

          <Section id="ch-forms" title="PAR-Q and Health Declaration" colour="teal">
            <p>Both forms are required before the participant can access the training plan and nutrition guide. They appear at the top of the portal on Day 1 and persist until complete. Once complete, they never appear again.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">PAR-Q</p>
            <p>7 standard physical activity readiness questions. All answers must be NO to proceed. If any answer is YES, a medical clearance message is shown directing the participant to consult a doctor and contact kade@bodyrecode.au before training. The form cannot be submitted with a YES answer.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Health Declaration</p>
            <p>5 tick-box declarations: over 18, not pregnant or post-partum, not medical advice, personal responsibility, consult a doctor if symptoms arise. All 5 must be checked to submit.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">How completions are saved</p>
            <p>Both forms call <strong>POST /api/challenge/forms</strong> with the token and form type. The API saves a timestamp to <code className="text-teal-400 text-xs bg-stone-800 px-1 py-0.5 rounded">parq_completed_at</code> or <code className="text-teal-400 text-xs bg-stone-800 px-1 py-0.5 rounded">health_dec_completed_at</code> on the enrollment. PAR-Q answers are also saved as JSON to <code className="text-teal-400 text-xs bg-stone-800 px-1 py-0.5 rounded">parq_responses</code>.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">UX flow</p>
            <p>PAR-Q loads first. On completion it auto-advances to the Health Declaration tab. On Health Dec completion the forms section is replaced by a green cleared confirmation banner. Training and Nutrition resource cards unlock immediately without a page reload.</p>

            <Note>Required Supabase columns: parq_completed_at (timestamptz), parq_responses (jsonb), health_dec_completed_at (timestamptz) on challenge_enrollments.</Note>
          </Section>

          <Section id="ch-resources" title="Training and Nutrition Pages" colour="teal">
            <p>Both pages are dark-theme, token-gated, and accessible only from the participant portal. They verify the enrollment token against Supabase on every load — if the token is invalid or the enrollment is inactive, the page returns 404.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Training Plan — /challenge/[token]/training</p>
            <StatusList items={[
              { label: 'How to approach this', desc: 'RIR explanation, tempo guidance, rest periods, walking on rest days' },
              { label: 'Warm-up sequence', desc: '6-step warm-up to run before every session' },
              { label: 'Weekly schedule', desc: 'Week 1 (4 sessions: Days 2, 4, 6, 7) and Week 2 (3 sessions: Days 9, 11, 13)' },
              { label: 'Session A', desc: 'Foundation Strength — 5 exercises with sets, RIR, and coaching cue for each' },
              { label: 'Session B', desc: 'Conditioning Focus — 4 strength exercises + conditioning finisher' },
              { label: 'Session C', desc: 'Volume and Density — 4 exercises + core circuit' },
              { label: 'RIR explainer', desc: 'Defines 1, 2, and 3 RIR so participants understand the effort scale' },
            ]} />

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Nutrition Guide — /challenge/[token]/nutrition</p>
            <StatusList items={[
              { label: 'HABNS system', desc: 'Hybrid Animal-Based Nutrition System overview and principles' },
              { label: 'What to eat', desc: 'Protein, fat, fruit, and vegetable categories with examples' },
              { label: 'What to remove', desc: '8 food categories to avoid for the 14 days' },
              { label: 'Carbohydrate strategy', desc: 'Rest day vs training day carb timing, post-training carb options' },
              { label: 'Daily rhythm', desc: 'Full training day meal timeline from waking to evening' },
              { label: 'Meal builder', desc: '4-step meal construction framework' },
              { label: 'Example meals', desc: 'Breakfast, rest day lunch/dinner, and post-training meal options' },
              { label: 'Hydration and electrolytes', desc: 'Daily targets and why salt matters' },
              { label: 'Supplements', desc: 'Electrolytes, whey, FocusFuel, creatine, magnesium with timing' },
              { label: 'Shopping list', desc: '6 categories covering everything needed for 14 days' },
            ]} />
          </Section>

          <Section id="ch-quiz" title="Mini Hormone Quiz" colour="teal">
            <p>Unlocks in the portal on Day 7. A 5-question quiz that identifies the participant's dominant hormone pattern and gives them a personalised result with next steps. Results are saved to Supabase and a result email is sent automatically.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">The four patterns</p>
            <StatusList items={[
              { label: 'Cortisol-Dominant', desc: 'Chronic stress driver — inflammation, fluid retention, abdominal fat. Colour: red.' },
              { label: 'Rhythm-Disrupted', desc: 'Reversed cortisol curve — wired at night, slow in the morning. Colour: amber.' },
              { label: 'Insulin-Sensitivity', desc: 'Blood sugar instability — afternoon crashes, cravings, poor training response. Colour: purple.' },
              { label: 'Adaptation-Stalled', desc: 'Plateau state — body has adapted and stopped responding. Colour: teal.' },
            ]} />

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">On submission</p>
            <p>The result is calculated client-side by counting dominant answer letters (a/b/c/d). The result key, all answers, and a timestamp are saved to Supabase via <strong>POST /api/challenge/quiz</strong>. A result email is sent to the participant with their pattern name, description, 4 personalised next steps, and a CTA to the Body State Scorecard.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Return visits</p>
            <p>The portal server page fetches <code className="text-teal-400 text-xs bg-stone-800 px-1 py-0.5 rounded">quiz_result</code> from Supabase and passes it to the client. If a result exists, it is shown immediately — the quiz form never appears again.</p>

            <Note>Required Supabase columns: quiz_completed_at (timestamptz), quiz_result (text), quiz_answers (jsonb) on challenge_enrollments.</Note>
          </Section>

          <Section id="ch-automation" title="Automation Sequence" colour="teal">
            <p>Handled by two Inngest functions that both listen to the <strong>challenge/enrolled</strong> event. They run in parallel and independently of each other. Both are registered in <strong>src/app/api/inngest/route.ts</strong>.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">challengeSequenceFunction — email sequence</p>
            <div className="space-y-2 mt-1">
              <ChecklistItem text="Step 1 (immediate): Welcome email to participant — confirms enrollment, lists what is in the portal, includes their personal portal link. Subject: You're in, [name]. Day 1 starts now." />
              <ChecklistItem text="Step 2 (immediate): Coach notification email to kade@bodyrecode.au — participant name, email, phone, enrollment time (AEST), and a View their portal button." />
              <ChecklistItem text="Step 3 (Day 5, 4-day sleep): Week One Progress Session email — announces the session is ready, links to CHALLENGE_SESSION_VIDEO_URL env var. Checks enrollment is still active before sending." />
              <ChecklistItem text="Step 4 (Day 14, 9-day sleep after Day 5): Ascension email — acknowledges completion, lists what should have shifted, pitches the 6-Week Blueprint. Marks enrollment status as completed in Supabase." />
            </div>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Environment variables required</p>
            <StatusList items={[
              { label: 'RESEND_API_KEY', desc: 'Used for all email sends. Set in Vercel environment variables.' },
              { label: 'CHALLENGE_SESSION_VIDEO_URL', desc: 'Server-side URL for the Day 5 email link. Set after recording the session.' },
              { label: 'NEXT_PUBLIC_CHALLENGE_SESSION_VIDEO_URL', desc: 'Client-side URL shown in the portal Week One Progress Session card.' },
            ]} />

            <Note>All emails use the dark branded template — black outer (#0c0a09), dark card (#111110), logo, and the darkEmailSignature with photo. Sent from kade@bodyrecode.au via Resend.</Note>
          </Section>

          <Section id="ch-sms" title="SMS Coaching Sequence" colour="teal">
            <p>Handled by <strong>challengeSmsFunction</strong> in Inngest. Fires on the <strong>challenge/enrolled</strong> event in parallel with the email sequence. Sends 3 SMS messages per day for 14 days plus a 3-day transition sequence (Days 15-17). All messages are sent via Twilio.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Timing structure</p>
            <StatusList items={[
              { label: 'Initial wait', desc: '1 hour after enrollment before the first message — gives participant time to check their email first' },
              { label: 'Morning message', desc: 'First message of each day' },
              { label: '7-hour gap', desc: 'Between morning and afternoon messages' },
              { label: 'Afternoon message', desc: 'Second message — check-in, pattern observation' },
              { label: '5-hour gap', desc: 'Between afternoon and evening messages' },
              { label: 'Evening message', desc: 'Third message — wind-down, close the day' },
              { label: '12-hour gap', desc: 'Overnight gap before next day morning message' },
            ]} />

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Special days</p>
            <StatusList items={[
              { label: 'Day 1 morning', desc: 'Includes the portal link so the participant can bookmark it' },
              { label: 'Day 5', desc: 'Rest day. Afternoon message references the Week One Progress Session in their portal. Evening message reminds them if not watched.' },
              { label: 'Day 7 morning', desc: 'Includes the Mini Hormone Quiz unlock — "The Mini Hormone Quiz is now unlocked in your portal. Complete it today."' },
              { label: 'Day 14 evening', desc: 'Closing message — directs to portal and email for next step.' },
            ]} />

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Transition sequence (Days 15-17)</p>
            <p>After Day 14 the function sends 3 more single daily messages. Day 16 includes the Blueprint CTA: "Reply NEXT if you want the details." The sequence ends after Day 17.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Environment variables required</p>
            <StatusList items={[
              { label: 'TWILIO_ACCOUNT_SID', desc: 'Twilio account identifier' },
              { label: 'TWILIO_AUTH_TOKEN', desc: 'Twilio authentication token' },
              { label: 'TWILIO_FROM_NUMBER', desc: 'The Twilio phone number SMS is sent from' },
            ]} />

            <Note>Phone numbers are formatted via the formatPhone utility before sending. If no phone is provided at enrollment, the SMS function exits immediately with no messages sent.</Note>
          </Section>

          <Section id="ch-database" title="Database and Supabase" colour="teal">
            <p>The challenge uses two Supabase tables: <strong>leads</strong> (existing) and <strong>challenge_enrollments</strong> (challenge-specific).</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">challenge_enrollments columns</p>
            <StatusList items={[
              { label: 'id', desc: 'UUID primary key' },
              { label: 'lead_id', desc: 'Foreign key to leads table' },
              { label: 'token', desc: 'UUID — the participant portal identifier. Used in all portal URLs.' },
              { label: 'status', desc: "active | completed. Set to active on enrollment, updated to completed by the Day 14 Inngest step." },
              { label: 'current_day', desc: 'Stored but not used for day calculation — day is computed from enrolled_at on every page load' },
              { label: 'enrolled_at', desc: 'Timestamp of enrollment — used to calculate current day' },
              { label: 'parq_completed_at', desc: 'Timestamp when PAR-Q form was submitted (nullable)' },
              { label: 'parq_responses', desc: 'JSON object of all 7 PAR-Q answers (nullable)' },
              { label: 'health_dec_completed_at', desc: 'Timestamp when Health Declaration was submitted (nullable)' },
              { label: 'quiz_completed_at', desc: 'Timestamp when Mini Hormone Quiz was submitted (nullable)' },
              { label: 'quiz_result', desc: 'Pattern key: a (cortisol), b (rhythm), c (insulin), d (adaptation) (nullable)' },
              { label: 'quiz_answers', desc: 'JSON object of all 5 quiz answers (nullable)' },
            ]} />

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Required SQL migrations</p>
            <p>If setting up from scratch or adding to an existing challenge_enrollments table, run the following in the Supabase SQL editor:</p>
            <pre className="text-xs bg-stone-800 text-teal-300 rounded-lg p-4 mt-2 overflow-x-auto whitespace-pre-wrap">{`ALTER TABLE challenge_enrollments
  ADD COLUMN IF NOT EXISTS parq_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS parq_responses jsonb,
  ADD COLUMN IF NOT EXISTS health_dec_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS quiz_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS quiz_result text,
  ADD COLUMN IF NOT EXISTS quiz_answers jsonb;`}</pre>
          </Section>

          <Section id="ch-prelaunch" title="Pre-Launch Checklist" colour="teal">
            <p>Everything that needs to be in place before the challenge is open to the public.</p>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Recording</p>
            <div className="space-y-2">
              <ChecklistItem text="Record the Day 5 Week One Progress Session (30 minutes). Script is saved at 06_Platform_Build/01_Pages/day5-session-script.md in Dropbox." />
              <ChecklistItem text="Upload the recording to a hosting platform (Vimeo or YouTube unlisted recommended)." />
            </div>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Environment Variables (Vercel)</p>
            <div className="space-y-2">
              <ChecklistItem text="Set CHALLENGE_SESSION_VIDEO_URL — the direct video URL for the Day 5 email link." />
              <ChecklistItem text="Set NEXT_PUBLIC_CHALLENGE_SESSION_VIDEO_URL — the same URL for the portal Watch the session button." />
              <ChecklistItem text="Confirm RESEND_API_KEY is set and the kade@bodyrecode.au sending domain is verified." />
              <ChecklistItem text="Confirm TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER are set." />
              <ChecklistItem text="Confirm INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY are set for production Inngest." />
            </div>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">Supabase</p>
            <div className="space-y-2">
              <ChecklistItem text="Run the SQL migration to add parq_completed_at, parq_responses, health_dec_completed_at, quiz_completed_at, quiz_result, quiz_answers columns to challenge_enrollments." />
              <ChecklistItem text="Confirm challenge_enrollments table exists with token column defaulting to gen_random_uuid()." />
            </div>

            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mt-4 mb-2">End-to-end test</p>
            <div className="space-y-2">
              <ChecklistItem text="Complete the signup form at bodyrecode.au/challenge with a real name, email, and phone." />
              <ChecklistItem text="Confirm welcome email arrives with correct portal link." />
              <ChecklistItem text="Confirm coach notification email arrives at kade@bodyrecode.au with name, email, phone, and time." />
              <ChecklistItem text="Open the portal link and confirm PAR-Q and Health Dec forms appear." />
              <ChecklistItem text="Complete both forms and confirm training and nutrition unlock." />
              <ChecklistItem text="Backdate enrollment in Supabase to Day 5 and confirm the Week One Progress Session card appears." />
              <ChecklistItem text="Backdate to Day 7 and confirm the Mini Hormone Quiz unlocks." />
              <ChecklistItem text="Complete the quiz and confirm the result email arrives." />
              <ChecklistItem text="Backdate to Day 14 and confirm the ascension CTA appears in the portal." />
              <ChecklistItem text="Confirm SMS messages are sending via Twilio (check Twilio logs)." />
            </div>

            <Note>To backdate enrollment for testing: UPDATE challenge_enrollments SET enrolled_at = NOW() - INTERVAL '7 days' WHERE token = '[your-token]';</Note>
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
