'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/ui'
import { coach, brand } from "@/config/tenant";

type Category = 'flows' | 'coaching' | 'business' | 'content' | 'challenge' | 'blueprint' | 'membership'

const SECTIONS = [
  { id: 'operator-flow',         title: 'Operator Flow',         colour: 'violet' as const, category: 'flows' as Category },
  { id: 'brand-voice',           title: 'Brand Voice',           colour: 'violet' as const, category: 'flows' as Category },
  { id: 'coach-copilot',         title: 'Coach Co-Pilot',        colour: 'violet' as const, category: 'flows' as Category },
  { id: 'operator-console',      title: 'Operator Console',      colour: 'violet' as const, category: 'flows' as Category },
  { id: 'support',               title: 'Support Tickets',       colour: 'violet' as const, category: 'flows' as Category },
  { id: 'lead-pipeline',    title: '1. Lead Pipeline',       colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'zoom-1',           title: '2. Zoom Companion',      colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'coaching-entry',   title: '3. Coaching Entry',      colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'post-conversion',  title: '6. Post-Conversion',     colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'pre-start',        title: '7. Pre-Start Window',         colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'deliberate-start', title: '7b. Deliberate Start (IEEP)', colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'client-portal',    title: '8. Client Portal',       colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'client-onboarding',title: '9. Client Onboarding',   colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'cffs',                  title: '10. CFFS',                  colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'foundational-reading',  title: '10b. Foundational Reading', colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'medications-analysis',  title: '10c. Medications Analysis + Reading', colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'weekly-checkins',       title: '11. Weekly Check-Ins',      colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'signal-monitoring',     title: '11b. Signal Monitoring',    colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'recovery-regulation',   title: '11c. Recovery and Regulation', colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'rpe-creep',              title: '11d. RPE Creep Monitor',     colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'coaching-package', title: '12. Coaching Package',   colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'clients-dashboard',title: '13. Clients Dashboard',  colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'automated-status', title: '14. Automated Status',   colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'email-sequences',  title: '15. Email Sequences',    colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'communications',   title: '16. Communications',     colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'assets',           title: '16b. Assets',            colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'admin-actions',    title: '17. Admin Actions',      colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'system-health',    title: '17b. System Health',     colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'platform-buildout', title: '17e. Platform Buildout', colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'speed-to-lead-sms', title: '17f. Speed-to-Lead SMS', colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'partner-billing',  title: '17g. Partner Billing (SOT)', colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'doctrine-parameters', title: '17h. Doctrine Parameters (Mode A+)', colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'licensee-readiness', title: '17d. Licensee Readiness Audits', colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'onboarding-nudges',title: '17c. Onboarding Nudges', colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'stripe-payments',  title: '19. Stripe Payments',    colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'training-program', title: '20. Training Program',   colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'program-reading',  title: '20b. Program Reading',   colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'trajectory-reading', title: '20c. Block-End Trajectory Reading', colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'macro-arc',        title: '21. Macro Training Arc', colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'program-coach-guidance', title: '21b. Program Coach Guidance', colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'nutrition-coach-guidance', title: '21c. Nutrition Coach Guidance', colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'nutrition-plan',   title: '22. Nutrition Plan',     colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'nutrition-reading', title: '22b. Nutrition Reading', colour: 'teal' as const, category: 'coaching' as Category },
  { id: 'business-engine',  title: 'Business Engine',        colour: 'amber' as const, category: 'business' as Category },
  { id: 'ceo-dashboard',    title: 'CEO Dashboard - Scorecard', colour: 'amber' as const, category: 'business' as Category },
  { id: 'partner-room',     title: 'Partner Room',           colour: 'amber' as const, category: 'business' as Category },
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
  { id: 'be-reels',         title: '32b. Reels',             colour: 'amber' as const, category: 'content' as Category },
  { id: 'be-content-engine',title: '33. Content Engine',     colour: 'amber' as const, category: 'content' as Category },
  { id: 'be-strategy',      title: '34. Strategy Hub',       colour: 'amber' as const, category: 'content' as Category },
  { id: 'be-social-profiles',title: '35. Social Profiles',   colour: 'amber' as const, category: 'content' as Category },
  { id: 'be-website',       title: '36. Website Analytics',  colour: 'amber' as const, category: 'content' as Category },

  { id: 'ch-overview',      title: 'Challenge Overview',     colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-landing',       title: 'Landing Page',           colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-enrollment',    title: 'Enrollment Flow',        colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-portal',        title: 'Participant Portal',     colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-day-zero',      title: 'Day 0 Body Decode Intake', colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-forms',         title: 'PAR-Q and Health Dec',   colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-leaks',         title: 'Where the Challenge leaks', colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-resources',     title: 'Training and Nutrition', colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-quiz',          title: 'Body Decode Check-In',   colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-automation',    title: 'Automation Sequence',    colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-sms',           title: 'SMS Coaching Sequence',  colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-database',      title: 'Database and Supabase',  colour: 'teal' as const, category: 'challenge' as Category },
  { id: 'ch-prelaunch',     title: 'Pre-Launch Checklist',   colour: 'teal' as const, category: 'challenge' as Category },

  // Funnel Dashboard
  { id: 'funnel-dashboard',  title: 'Funnel Dashboard',      colour: 'teal' as const, category: 'flows' as Category },

  // Blueprint
  { id: 'bp-overview',      title: 'Blueprint Overview',     colour: 'teal' as const, category: 'blueprint' as Category },
  { id: 'bp-sales',         title: 'Sales Page',             colour: 'teal' as const, category: 'blueprint' as Category },
  { id: 'bp-purchase',      title: 'Purchase Flow',          colour: 'teal' as const, category: 'blueprint' as Category },
  { id: 'bp-portal',        title: 'Member Portal',          colour: 'teal' as const, category: 'blueprint' as Category },
  { id: 'bp-patterns',      title: 'Biological Patterns',    colour: 'teal' as const, category: 'blueprint' as Category },
  { id: 'bp-checkin',       title: 'Weekly Check-In',        colour: 'teal' as const, category: 'blueprint' as Category },
  { id: 'bp-automation',    title: 'Automation and Emails',  colour: 'teal' as const, category: 'blueprint' as Category },
  { id: 'bp-database',      title: 'Database',               colour: 'teal' as const, category: 'blueprint' as Category },

  // Membership
  { id: 'mb-overview',      title: 'Membership Overview',    colour: 'teal' as const, category: 'membership' as Category },
  { id: 'mb-sales',         title: 'Sales Page',             colour: 'teal' as const, category: 'membership' as Category },
  { id: 'mb-purchase',      title: 'Purchase Flow',          colour: 'teal' as const, category: 'membership' as Category },
  { id: 'mb-portal',        title: 'Member Portal',          colour: 'teal' as const, category: 'membership' as Category },
  { id: 'mb-blocks',        title: 'Block Structure',        colour: 'teal' as const, category: 'membership' as Category },
  { id: 'mb-checkin',       title: 'Check-In and Trends',    colour: 'teal' as const, category: 'membership' as Category },
  { id: 'mb-automation',    title: 'Automation',             colour: 'teal' as const, category: 'membership' as Category },
  { id: 'mb-database',      title: 'Database',               colour: 'teal' as const, category: 'membership' as Category },
  { id: 'mb-library',       title: 'Library and Field Guides', colour: 'teal' as const, category: 'membership' as Category },
  { id: 'mb-bolt-ons',      title: 'Bolt-on Store',          colour: 'teal' as const, category: 'membership' as Category },
]

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'flows',     label: 'Flows' },
  { id: 'coaching',  label: 'Coaching' },
  { id: 'business',  label: 'Business' },
  { id: 'content',   label: 'Content' },
  { id: 'challenge',   label: 'Challenge' },
  { id: 'blueprint',   label: 'Blueprint' },
  { id: 'membership',  label: 'Membership' },
]

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<string>('operator-flow')
  const [activeTab, setActiveTab] = useState<Category>('flows')
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
    <div className="max-w-[1100px] relative">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        className={`fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 pl-3.5 pr-4 h-11 rounded-full bg-[#1B6DFC] text-[#FFFFFF] text-[13px] font-semibold border border-[#1B6DFC] hover:bg-[#1560E0] transition-all shadow-[0_12px_32px_-8px_rgba(27,109,252,0.45),0_4px_12px_-4px_rgba(0,0,0,0.6)] ${
          showTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        <ArrowUp size={15} />
        <span>Top</span>
      </button>
      <PageHeader
        eyebrow="Reference"
        title="Dashboard Guide"
        subtitle="How the Body Recode Performance Coaching system works - and why each part is structured the way it is."
      />
      <div className="mb-6">
        {/* Category tabs */}
        <div className="flex gap-2">
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
                  ? 'bg-[#DDE9FD] text-[#1B6DFC] border-[#B5CFFC]'
                  : 'bg-[#EFF1F4] text-[#666D7A] border-[#E8EAEE] hover:text-[#141821]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-8 items-start">

        {/* Sidebar */}
        <nav className="w-48 shrink-0 sticky top-[104px] self-start overflow-y-auto max-h-[calc(100vh-8rem)]">
          <ul className="space-y-0.5">
            {SECTIONS.filter(s => s.category === activeTab).map(({ id, title, colour }) => {
              const isActive = activeSection === id
              const activeColour = colour === 'violet' ? 'text-violet-700' : colour === 'amber' ? 'text-[#A96A12]' : 'text-[#1B6DFC]'
              return (
                <li key={id}>
                  <button
                    onClick={() => scrollTo(id)}
                    className={`w-full text-left text-xs px-3 py-1.5 rounded-lg transition-colors leading-snug ${
                      isActive
                        ? `${activeColour} bg-[#EFF1F4] font-semibold`
                        : 'text-[#98A0AD] hover:text-[#43474F] hover:bg-[#EFF1F4]/50'
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
          <Section id="operator-flow" title="Operator Flow - Lead to Active Client" colour="violet">
            <p>Use this as your step-by-step reference for every lead. Every step in order, nothing skipped.</p>

            <div className="space-y-6 mt-2">

              <div>
                <p className="text-[12.5px] font-medium text-[#666D7A] mb-3">Phase 1 - Lead Arrives</p>
                <div className="space-y-2">
                  <ChecklistItem text="Lead completes the Readiness Scorecard at performance.bodyrecode.au" />
                  <ChecklistItem text="Lead is automatically created in the CRM - no action needed" />
                  <ChecklistItem text="You receive a scorecard submission notification email immediately" />
                  <ChecklistItem text="Lead is routed to their state-correct next step post-scorecard (the $37 Body Decode Report was retired 24 Aug 2026)" />
                  <ChecklistItem text="Follow-up email sequence begins automatically" />
                </div>
              </div>

              <div>
                <p className="text-[12.5px] font-medium text-[#666D7A] mb-3">Phase 2 - Zoom</p>
                <div className="space-y-2">
                  <ChecklistItem text="Lead books Zoom via bodyrecode.au/book - or book manually from Business → Bookings" />
                  <ChecklistItem text="Write the Pre-Call Read on the lead detail page - their pattern, what to listen for, lines to have ready" />
                  <ChecklistItem text="Open the Zoom Companion from the lead detail page before the call" />
                  <ChecklistItem text="First half: run through Opening Frame, Scorecard Reflection, Context Exploration, Pattern Interpretation (stages 1-4)" />
                  <ChecklistItem text="Second half: run through Hot Spot Framing, Emotional Acknowledgement, Pricing, and Decision (stages 5-8)" />
                  <ChecklistItem text="Select the decision path at Stage 8 (A - Declined, B - Needs Time, C - Proceeding)" />
                  <ChecklistItem text="Path C only: select the pricing pathway (Full Rate or Online)" />
                  <ChecklistItem text="Mark Call Complete in the companion notes panel" />
                </div>
              </div>

              <div>
                <p className="text-[12.5px] font-medium text-[#666D7A] mb-3">Phase 3 - Coaching Entry</p>
                <div className="space-y-2">
                  <ChecklistItem text="From the lead detail page, click Send to Client under Coaching Entry - this emails the $297 Foundational Read link directly" />
                  <ChecklistItem text="Wait for the payment notification email to confirm payment received" />
                  <ChecklistItem text="Client profile, welcome email, and intake link are all created automatically - no action needed" />
                </div>
              </div>

              <div>
                <p className="text-[12.5px] font-medium text-[#666D7A] mb-3">Phase 5 - Client Setup</p>
                <div className="space-y-2">
                  <ChecklistItem text="Send the client their portal link - use the Send to Client button on the client profile, or copy it manually. The client signs in with their email address (magic link - no password)." />
                  <ChecklistItem text="Client completes all 5 onboarding steps via the portal: Coaching Agreement → Health Declaration → Foundational Intake → Baseline Documentation → Blood Work" />
                  <ChecklistItem text="You receive a notification email at each step as the client completes it" />
                  <ChecklistItem text="Blood Work is the final step: the client either uploads recent results (Health Markers) or taps 'I'll get a panel done' (which surfaces their GP request list + the education guide). The 'arrange' path counts as done so it never blocks a client waiting on a GP appointment. Their onboarding dot shows 'Blood Work (arranging)' until results are uploaded. Scope of practice: their GP orders and interprets; you read results as one signal." />
                  <ChecklistItem text="If medical clearance is required (flagged on health declaration), the portal shows an additional Medical Clearance step before intake unlocks" />
                  <ChecklistItem text="CFFS generates automatically once intake is submitted - review it on the client profile" />
                  <ChecklistItem text="Set the Coaching Package on the client profile (online, 2x, or 3x) and copy the subscription link" />
                  <ChecklistItem text="Send the subscription link to the client" />
                  <ChecklistItem text="Wait for the Subscription Active badge to appear on the client profile" />
                  <ChecklistItem text="For face-to-face clients: go to the client profile and click Set up → next to the Face-to-Face Session card, then click + Add slot to set each recurring weekly day and time (e.g. Mon 7:00 am, Wed 7:00 am, Thu 7:00 am). Each slot is saved independently. This unlocks the Sessions page in the client portal." />
                  <ChecklistItem text="Set the Coaching Start Date (3-7 days out) - do not set it before the subscription is active" />
                  <ChecklistItem text="Client receives a reminder email automatically the day before coaching begins" />
                </div>
              </div>

              <div>
                <p className="text-[12.5px] font-medium text-[#666D7A] mb-3">Phase 6 - Training Program</p>
                <div className="space-y-2">
                  <ChecklistItem text="Create a Macro Plan on the client profile - set the plan name and macro objective before generating any programs" />
                  <ChecklistItem text="Add the planned block sequence to the macro plan (phases, goals, durations, arcs)" />
                  <ChecklistItem text="Click Generate program → on the first block, or click Generate Program on the client profile" />
                  <ChecklistItem text="Review the Prescription Suggestion - read the reasoning for each field and correct any fields based on your direct assessment" />
                  <ChecklistItem text="Confirm equipment access, then click Approve & Generate Program (takes 30–60 seconds)" />
                  <ChecklistItem text="Review the full draft on the Training Program page - check sessions, blocks, exercises, and progression strategy" />
                  <ChecklistItem text="Click Approve Program to promote the draft to active" />
                  <ChecklistItem text="Each week, the client's training review comes in as part of their single weekly check-in (folded in 2026-07-23, no longer a separate form) - you see the results as a read-only feed on the Training Program page (direction, signal, adherence, notes). No data entry required on your side." />
                </div>
              </div>

              <div>
                <p className="text-[12.5px] font-medium text-[#666D7A] mb-3">Phase 7 - Nutrition Plan</p>
                <div className="space-y-2">
                  <ChecklistItem text="Click Generate Plan in the Nutrition Plan section on the client profile" />
                  <ChecklistItem text="Review the Prescription Suggestion - entry state, protein anchor, carb demand level, and reasoning. Edit any fields based on your assessment." />
                  <ChecklistItem text="Click Approve & Generate Plan (or Fill in manually instead if preferred)" />
                  <ChecklistItem text="Review the full draft on the Nutrition Plan page - meal structure, macros, training day adjustments, execution rules, and progression notes" />
                  <ChecklistItem text="Click Approve Plan to promote the draft to active" />
                  <ChecklistItem text="Each week, the client's nutrition review comes in as part of their single weekly check-in (folded in 2026-07-23, no longer a separate form) - you see the results as a read-only feed on the Nutrition Plan page. No form to fill in on your side." />
                </div>
              </div>

            </div>
          </Section>

          <Section id="funnel-dashboard" title="Funnel Dashboard" colour="teal">
            <p>Found at <strong>/dashboard/funnel</strong>. A unified view of every participant across all three Body Recode stages - Challenge, Blueprint, and Membership. The purpose is to ensure no lead gets lost and no ascension opportunity is missed.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Summary cards</p>
            <p>Three stat cards at the top show total enrollment counts per stage, with ascension rates (e.g. how many challenge participants purchased Blueprint, how many Blueprint buyers joined membership).</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Attention flags</p>
            <p>An amber alert bar appears automatically when action is needed. Currently flags two conditions:</p>
            <div className="space-y-2 mt-2">
              <ChecklistItem text="Blueprint buyers at Week 6 who have not yet joined the membership - these are the highest-value outreach targets." />
              <ChecklistItem text="Active membership members with no check-in submitted - data gap that limits the monthly Loom review." />
            </div>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Tabs</p>
            <StatusList items={[
              { label: 'Challenge', desc: 'All enrollments with current day, quiz result, and whether they purchased Blueprint. Rows flagged red if they completed Day 14 without buying.' },
              { label: 'Blueprint', desc: 'All buyers with pattern, current week, last check-in week and average score, and membership status. Rows flagged red if at Week 6 without membership, or past Week 1 with no check-in.' },
              { label: 'Membership', desc: 'All members with pattern, current block and week, last check-in, average score, and active/cancelled status. Rows flagged red if active with no check-in submitted.' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Search</p>
            <p>Filter by name or email across any tab. Updates instantly as you type.</p>

            <Note>The Funnel Dashboard is read-only - it shows data but does not allow edits. To modify an enrollment, go directly to Supabase or the relevant portal.</Note>
          </Section>

          {/* Brand Voice - reference doc for anyone writing public-facing copy */}
          <Section id="brand-voice" title="Brand Voice - Layered Buyer Language" colour="violet">
            <p>Every piece of public-facing Body Recode copy follows the same layering rule, established 2026-04-30 after a two-week ad data review showed that system-builder language at the cold front door was producing 4% CTR but only 2% scorecard completion and 0% $37 conversion. The frame is right. The layering was wrong.</p>

            <p className="font-semibold text-[#141821] mt-3">The principle</p>
            <p>Lead with the buyer&apos;s lived experience in their own words. Body Recode vocabulary (Body State, CFFS, Fat Map, four profiles, four zones, Depleted/Transitioning/Ready) earns its place AFTER the prospect has crossed into the conversation. Fat loss is the explicit symptom at the cold layer, body responsiveness is the diagnostic frame at the engagement layer, the full system shows up at the conversion layer.</p>

            <p className="font-semibold text-[#141821] mt-4">By layer</p>
            <StatusList items={[
              { label: 'Cold layer (ads, IG bio, gym DMs, scorecard hero, popup, home hero, $37 result page)', desc: 'Fat loss as the symptom. "You\'re training. You\'re eating clean. The fat won\'t move." Zero brand vocabulary. The job here is to get them to lean in. The proven hook is "your body has stopped responding to effort" framed against the lived problem.' },
              { label: 'Engagement layer (scorecard email sequence, $37 report, IG content)', desc: 'Introduce one piece of the frame at a time. "Here\'s what your scorecard tells me. Body Recode language for this is [State]." Bridge their language to ours. Body state vocabulary OK once the felt picture is established.' },
              { label: 'Conversion layer (Zoom call script, pre-call brief, coaching offer, onboarding)', desc: 'Full Body Recode language earned. CFFS, four zones, four profiles, weekly CFWS, the continuous read-and-adjust cycle. By this point they\'ve felt the frame in motion.' },
            ]} />

            <p className="font-semibold text-[#141821] mt-4">Hard rules</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li><strong>No em dashes.</strong> AI writing signal. Use periods, commas, hyphens, or rewrite. Replace-all whenever you spot one.</li>
              <li><strong>Single Zoom funnel.</strong> No "Zoom 2", no "second conversation". The call covers diagnosis through pricing through decision in one block. Anything that contradicts this is stale and should be flagged.</li>
              <li><strong>No fitness clichés:</strong> grind, crush it, hustle, push through, no-pain-no-gain. The brand is intelligent, not punitive.</li>
              <li><strong>No shame or guilt framing.</strong> &quot;You&apos;re lazy / inconsistent / not trying hard enough&quot; is the opposite of the read.</li>
              <li><strong>Founding Client Program framing is retired</strong> (closed 2026-05-01). Do not reference &quot;Founding Client&quot;, &quot;first 20 clients&quot;, &quot;the Program&quot;, or trade/case-study language in any new copy. The half-rate offer itself is still available as the <strong>launch rate</strong>, used as a closing tool on Zoom calls only (not promoted publicly). Standard rates: $149/wk online, $299/wk 2x in-person, $409/wk 3x in-person, plus $297 Foundational Read. Launch rate (call-only): $74.50/wk online, $149.50/wk 2x, $204.50/wk 3x.</li>
            </ul>

            <p className="font-semibold text-[#141821] mt-4">Reference docs</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li><code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/2026-04-30_Buyer_Language_Rewrite.md</code> - full diagnostic, every before/after, IG bio variants</li>
              <li><code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/2026-05-01_Pre_Call_Brief_Template.md</code> - locked 13-section template for pre-call briefs</li>
              <li><code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/2026-05-01_May_Post_Revisions.json</code> - 22 revised IG post captions, all in the new voice</li>
            </ul>

            <Note>When you draft anything new (DM, email, post, ad creative, script), check it against these rules before publishing. The cold-layer rule is the most often violated - it&apos;s tempting to lead with brand vocabulary because it&apos;s sharp. Resist. Lead with what they&apos;re feeling first.</Note>
          </Section>

          <Section id="coach-copilot" title="Coach Co-Pilot - Doctrine Tutor" colour="violet">
            <p>The co-pilot is a doctrine-trained mentor you talk with. It rides on every dashboard page as a floating bubble (bottom-right, the concentric-ring &quot;Aperture&quot; glyph). It is coach-facing only and never talks to clients. Its job is to help you think, not to run the plan for you.</p>

            <Note>New: there is a full step-by-step course at <a href="/dashboard/copilot-guide" className="text-[#1056D6] underline">Guide → Co-Pilot</a> (<code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/dashboard/copilot-guide</code>) — one lesson per capability with worked examples, plus a downloadable branded handout. Point new coaches there.</Note>

            <Note><strong>Every time you open it, you start a fresh conversation (2026-08-17).</strong> It used to reload the whole history of everything you had ever asked about that client, which meant reopening dropped you into weeks of old chat — and that old chat was fed back to the co-pilot as context, so a question you asked last month could colour an answer today. Closing the panel now ends the conversation. Nothing is deleted (flagged exchanges still reach Co-Pilot Review), it just is not reloaded. The practical consequence: <em>if you have a draft proposal open and you close the panel, that proposal is gone</em> — finish what you are doing before you close it.</Note>

            <p className="font-semibold text-[#141821] mt-3">Where it works, and how it changes by page</p>
            <StatusList items={[
              { label: 'On a client profile', desc: 'It has read that client\'s file (their synthesis, readiness, active program and nutrition, medications, recent check-ins) and answers grounded in it, citing what it drew on.' },
              { label: 'On any other page', desc: 'No single client is loaded, but it now has a live read on your whole roster. The bubble shows a red badge with how many clients are awaiting you, and a one-tap "☀ Morning brief" narrates who needs attention today and why, in priority order. You can also just ask "who\'s drifting or hit a gate this week?", "who\'s due to progress?", or "state of my roster?" — it answers from the same ranking as the Today\'s Focus board. For a deep single-client question it points you to open that client\'s profile.' },
            ]} />

            <p className="font-semibold text-[#141821] mt-4">What you can ask it (read-only, it writes nothing)</p>
            <StatusList items={[
              { label: 'Explain / teach', desc: '"Why did the synthesis put her in Remediation?" "Walk me through his fat map." It teaches the reasoning in plain terms a newer coach can follow.' },
              { label: 'Pressure-test a decision', desc: '"Doctrine says hold. Talk me out of progressing him." This is the moat: it holds you to the one standard.' },
              { label: 'Review a generated plan', desc: '"Review his program against the doctrine." It reads the actual sessions and macros and flags what is off: intensity in a Restoration block, a gate breach, a calorie target hiding in the training plan, a meal count fighting appetite suppression. Says what is sound too.' },
              { label: 'Set up a generation', desc: '"What do I put in these fields to generate his program?" It recommends each field value plus a coach-guidance steer, grounded in that client. You still click Generate (you are the approver); then bring the draft back and ask it to review.' },
              { label: 'Draft coach guidance', desc: 'Ask it to write the short steer for the program or nutrition generator. It produces a paste-ready directive.' },
              { label: 'Draft a program or nutrition plan', desc: 'Tap "＋ Draft a program" or "＋ Draft nutrition" in the client\'s co-pilot panel. It proposes a full generation spec (for a program: phase, goal, frequency, etc.; for nutrition: entry state, protein anchor, carb demand, meals/day), each with a reason, using the same doctrine engine the Suggest flow uses. You review and edit the name, then tap Generate. It saves a DRAFT only. Nothing reaches the client until you publish it.' },
              { label: 'Refine a draft', desc: 'Tap "✎ Refine program" or "✎ Refine nutrition", then describe one change. As well as swaps and tweaks ("swap the squat for a hip thrust", "drop the bench to 3 sets"), it now handles structural changes: add/remove/reorder an exercise, add or drop a whole day ("add a fourth day", "drop Wednesday\'s carries"), and add/remove foods or meals ("drop to 3 meals"). It shows you exactly what will change (for nutrition it re-sums the macros) before anything happens; you tap Apply. Only the named part changes, it stays a draft until you publish, and it won\'t make a change that breaks the phase, a gate, an injury, the frequency ceiling, or the protein anchor.' },
              { label: 'Set your preferences', desc: 'Open the co-pilot on any non-client page, tap "What I can help with" then "⚙ Set your coaching preferences", and tell it how you like to work ("favour 4-day splits when gates allow", "keep first blocks to 3 sets", "prefer dairy-free swaps"). It keeps that in mind everywhere — but only as soft guidance; it never overrides a client\'s readiness gates, phase, or safety.' },
            ]} />

            <p className="font-semibold text-[#141821] mt-4">The feedback loop</p>
            <p>Every answer has a quiet thumbs-down. Use it when an answer is wrong or drifts from doctrine. Flagged exchanges land in <strong>Clients &rarr; Co-Pilot Review</strong> for you to review and mark reviewed. This is how doctrine drift gets caught before it spreads (essential once other Collective coaches rely on it).</p>

            <p className="font-semibold text-[#141821] mt-4">What it will NOT do</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li>It never changes a live plan on its own. It can draft a training program, but only a draft, and only when you tap Generate. Nutrition and edits still go through the generators / editors, and you approve and publish everything.</li>
              <li>It is not a general assistant. It is scoped to coaching, the doctrine, and the client in front of you (not marketing, content, or ops).</li>
              <li>It never invents facts. If the data is not in the file, it says so.</li>
            </ul>

            <Note>Treat it like a senior coach looking over your shoulder. The highest-value habit: after you generate any program or nutrition plan, open the co-pilot on that client and ask it to review the result against doctrine before you publish.</Note>
          </Section>

          <Section id="operator-console" title="Operator Console - Run the Business by Talking to It" colour="violet">
            <p>The console is a full page at <strong>Console</strong> in the sidebar (<code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/dashboard/console</code>). It is a conversation with your own business: ask it about your leads, your clients, what has actually been sent, and what is firing, and it goes and reads the live data before answering.</p>

            <Note><strong>This is not the co-pilot bubble, and the difference is deliberate.</strong> The bubble helps with the page you are already on and forgets when you close it. The console is where the work <em>is</em> the conversation — auditing a send, chasing down why leads stalled, staging a re-engagement — so its conversations are saved down the left-hand side and you can pick one back up days later.</Note>

            <p className="font-semibold text-[#141821] mt-3">What it can do</p>
            <StatusList items={[
              { label: 'Go and look', desc: 'Count and list leads, filter to the ones who never moved, read one lead\'s whole file, list clients by active / frozen / ended, and rank who needs you today using the same engine as the Today\'s Focus board.' },
              { label: 'Audit what happened', desc: '"What has actually been sent this week?" pulls every email and SMS with who got it and when. This is how you catch a workflow double-sending, or confirm something fired at all.' },
              { label: 'Check the automations', desc: 'Which workflows exist, which are switched on, how many times each ran in the last 30 days and how many failed. A workflow that is active but has run zero times is the thing you want to see.' },
              { label: 'Stage a send', desc: 'Ask it to re-engage the leads who never moved and it works out exactly who is eligible, who is excluded and why — then stops and shows you a card.' },
              { label: 'Set a follow-up', desc: 'Put a lead on your own follow-up list for a date, with a note. Also staged, also needs your click.' },
            ]} />

            <p className="font-semibold text-[#141821] mt-4">Nothing sends without you</p>
            <p>Every action stops at an <strong>approval card</strong>. The card leads with the numbers — how many would receive it, how many are excluded and for what reason — and there is a <strong>Show me exactly who</strong> link that lists them by name before you decide. Confirm sends it. Cancel does nothing at all.</p>
            <p>This is enforced in the software, not by asking the AI nicely: the part of the console the AI can reach contains no code that sends. The worst it can do is prepare something you then read and decline. An approval expires after <strong>30 minutes</strong>, because a list you read an hour ago may not describe who would get it now.</p>

            <p className="font-semibold text-[#141821] mt-4">Seeing its working</p>
            <p>Under each answer you get small grey chips — <em>Counted leads · 84</em>, <em>Audited recent sends · 12</em> — showing which lookups it ran and how many rows came back. If a lookup failed, the chip turns red. This is how you tell a real answer from a confident-sounding one: if the chips are missing, it did not check.</p>

            <p className="font-semibold text-[#141821] mt-4">What it will NOT do</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li>It cannot change the software. No code, no new pages, no settings it was not given a specific tool for. That line is what makes it safe to hand to a licensed coach.</li>
              <li>It cannot see another practice&apos;s data. Every lookup is filtered to your own clients and leads in the code, before the AI is involved.</li>
              <li>It cannot run raw database queries. Every lookup is a fixed, named question with fixed filters — deliberately less flexible, so that text arriving from outside can never be turned into a database read.</li>
              <li>It does not guess. If a lookup returns nothing it tells you nothing matched, rather than inventing a plausible number.</li>
            </ul>

            <Note>Every single lookup it runs is recorded — which tool, what arguments, how many rows, whether it worked. So &ldquo;why did this client get that email?&rdquo; has an answer months later. That record is also what a partner will need when one of their clients asks them the same question.</Note>
          </Section>

          <Section id="support" title="Support Tickets - Report an Issue" colour="violet">
            <p>Every dashboard page carries a floating <strong>Support</strong> pill in the bottom-left. Tap it when something is broken, unclear, or missing. It opens a drawer with two tabs.</p>

            <p className="font-semibold text-[#141821] mt-3">Tab 1: Report</p>
            <p>Pick a category, write a one-line subject, describe what happened. The page you are on when you file is captured automatically, so Kade sees the context without you having to name the URL.</p>
            <StatusList items={[
              { label: 'Bug', desc: 'Something is broken or behaving differently than expected.' },
              { label: 'Question', desc: 'You are not sure how a feature works or where to find something.' },
              { label: 'Feature request', desc: 'A change or addition that would help you get work done.' },
              { label: 'Something is wrong right now', desc: 'Urgent - blocks you from doing your job.' },
            ]} />

            <p className="font-semibold text-[#141821] mt-4">Tab 2: My tickets</p>
            <p>Your recent tickets with their current status. Every ticket carries one of four states:</p>
            <StatusList items={[
              { label: 'New', desc: 'Kade has not opened it yet.' },
              { label: 'Looking', desc: 'Kade is investigating.' },
              { label: 'Fixed', desc: 'Change is deployed. If Kade left a note, it is on the ticket.' },
              { label: "Won't fix", desc: 'Kade decided against action. Reason will be on the ticket.' },
            ]} />

            <p className="mt-3">When Kade updates a ticket, you get an email with the status and any note verbatim - and the ticket in the drawer updates the next time you open it. Kade sees every ticket in his own admin inbox at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/dashboard/support</code>.</p>

            <Note>Use this instead of email or DM for anything platform-related. It routes into the right place, keeps a trail, and gives you visibility on where the fix stands.</Note>
          </Section>

          {/* Section 1 */}
          <Section id="lead-pipeline" title="1. Lead Pipeline" colour="teal">
            <p>Every potential client enters the system as a <strong>lead</strong>. Leads are created manually or automatically when someone completes the Readiness Scorecard at performance.bodyrecode.au.</p>
            <p>On the lead detail page, the <strong>Contact</strong> section has an <strong>Edit</strong> link that lets you update the lead&apos;s name, email, and phone number directly from the dashboard without going to Supabase.</p>
            <p>Leads move through statuses as they progress:</p>
            <StatusList items={[
              { label: 'New Check-In', desc: 'Quiz submitted, report not yet sent.' },
              { label: 'Report Sent', desc: 'Performance report scheduled and sent to the lead.' },
              { label: 'Cold - No Booking', desc: 'Report sent but no Zoom booked after follow-ups.' },
              { label: 'Zoom Booked', desc: 'Consultation booked.' },
              { label: 'Zoom Completed', desc: 'Consultation done - decision made.' },
              { label: 'Closed - No Show', desc: 'Lead did not attend. Re-engagement sequence available.' },
              { label: 'Closed - Declined', desc: 'Lead decided not to proceed.' },
              { label: 'Foundational Read Paid', desc: 'Payment received. Client profile created automatically.' },
              { label: 'Active - Pre-Start', desc: 'In the 3-7 day window between Foundational Read paid and the coaching start date. Distinct from the Deliberate Start (IEEP) which is the locked 2-week phase after coaching has begun.' },
              { label: 'Active Coaching', desc: 'Coaching underway.' },
            ]} />
            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Readiness Scorecard on Lead Detail</p>
            <p>When a lead completes the Readiness Scorecard (on performance.bodyrecode.au), their score and state are recorded as a <strong>scorecard_completed</strong> event on their lead record. On the lead detail page, a <strong>Readiness Scorecard</strong> card appears below the contact info showing:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li>Their total score (e.g. 7 / 15)</li>
              <li>Their body state (Depleted / Transitioning / Ready) as a colour-coded badge</li>
              <li>A one-line description of what that state means</li>
              <li>The date the scorecard was completed</li>
            </ul>
            <p className="mt-2">This card only appears if the lead has a scorecard_completed event. Legacy leads who entered before the scorecard was the lead magnet will not show this card.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Scorecard Lead Creation</p>
            <p>When someone completes the Readiness Scorecard on performance.bodyrecode.au, a lead is <strong>automatically created</strong> in the CRM - no manual entry required. Their name, email, score, body state, and section scores are all captured. You receive a branded notification email immediately on every scorecard submission.</p>
            <p className="mt-2">Leads created this way are tagged with <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">source_detail: scorecard</code>. This is now the primary lead entry path.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Fat Map Zone Typing (from 2026-06-24)</p>
            <p>The scorecard now also asks <strong>mobile number, biological sex, age range, fat-storage location</strong>, and (for women) <strong>cycle status</strong> on the details step (mobile is required and stored on the lead so we collect it once). These type the lead into one of the four Fat Map zones - <strong>Stress-Stored</strong> (cortisol, either sex), <strong>Insulin-Drift</strong> (insulin, both, male-leaning), <strong>Estrogen-Shift</strong> (oestrogen, female only), <strong>Androgen-Decline</strong> (testosterone, male only). Sex is the hard gate: a female is never typed Androgen-Decline and a male is never Estrogen-Shift. The lead sees their zone on the free result screen (named when the read is confident, &quot;points toward X&quot; when provisional); the $37 report sells the why + the order to fix it.</p>
            <p className="mt-2">The zone is stored on the lead (<code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">scorecard_profile</code> + confidence) and shown on the <strong>coach notification email</strong> as a Fat Map Zone card alongside sex/age, so you arrive at the call already knowing the likely pattern instead of reconciling it from scratch. The same typing feeds the pre-call brief. Legacy leads (pre-2026-06-24, no sex/storage captured) fall back to the older score-pattern guess.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Lead Quality Filter (Red Flag Test)</p>
            <p>Two qualifier questions are asked between the email step and the result. Based on Hormozi&apos;s &quot;red flag test&quot; - a single mindset/behaviour question identified leads with half the show rate and half the close rate. Body Recode uses two:</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li><strong>Approach (behaviour):</strong> When training/nutrition stops producing results, what is your honest first response? <span className="text-[#98A0AD]">A/B = good fit. C (push harder) and D (frustrated, want program changed) = red flag - exactly the prescription-over-interpretation mindset BR is built to correct.</span></li>
              <li><strong>Investment readiness (qualification):</strong> If we identify what is blocking your progress, are you in a position to invest? <span className="text-[#98A0AD]">A (ready now) / B (1-3 months) = good. C (just exploring) / D (free only) = red flag - not a coaching buyer.</span></li>
            </ul>
            <p className="mt-2">Each lead is scored: <strong className="text-[#1B6DFC]">green</strong> (zero red flags), <strong className="text-[#A96A12]">yellow</strong> (one), <strong className="text-[#C82626]">red</strong> (both). Quality dot appears on the avatar in the leads list and a Lead Quality block appears on the lead detail page below the section breakdown. Red-flagged leads should not be pushed to a Zoom call unless they push for it themselves.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Post-Scorecard CTAs (state-based split)</p>
            <p>After completing the scorecard, the CTA shown on the result page <strong>depends on the lead&apos;s body state</strong>. This was changed 2026-04-30 to remove the $37/free-call cannibalisation that had been driving $37 conversion to zero. Each state now sees ONE primary path matched to where their body actually is:</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li><strong>Depleted (5-8):</strong> Free 30-minute call only. A PDF will not unstick a body in protection mode. CTA links to <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">bodyrecode.au/book?from=scorecard_depleted</code>.</li>
              <li><strong>Transitioning (9-11):</strong> the 6-Week Blueprint. Reassigned 24 Aug 2026 when the $37 report was retired; it matches the state routing, which already said Transitioning goes to the Blueprint.</li>
              <li><strong>Ready (12-15):</strong> the Membership. Same reassignment.</li>
            </ul>
            <p className="mt-2">The Body Decode Report itself: a personalised web-based analysis of their body state, section scores, and what to stop and start doing. Purchased via Stripe at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">$37 AUD</code> and delivered automatically by email as a unique link at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">app.bodyrecode.au/report/[token]</code>.</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li>Personalised to their exact body state (Depleted / Transitioning / Ready)</li>
              <li>Section-by-section breakdown with interpretations for each score level</li>
              <li>Stop doing / start doing lists specific to their state</li>
              <li>Book a call CTA at the bottom</li>
              <li>PDF download via print</li>
            </ul>
            <p className="mt-2">Report purchases are recorded as <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">scorecard_reports</code> rows in the database. No manual handling required - Stripe webhook creates the report and sends the email automatically.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Self-Guided Program (Downsell)</p>
            <p>Any lead with scorecard data will show a <strong>Self-Guided Program</strong> section on their detail page. This shows whether they have purchased the $97 program and lets you manually send the offer or copy the checkout link.</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li><strong>Send Offer Email</strong> - creates a Stripe checkout session and sends a branded offer email immediately. Use this if you want to send the offer outside of the automated flow.</li>
              <li><strong>Copy Link</strong> - copies the Stripe checkout URL to clipboard without sending an email.</li>
              <li>If the lead has already purchased, a <strong>Program purchased</strong> badge shows instead of the buttons.</li>
            </ul>
            <p className="mt-2">The offer is automatically sent when you click <strong>Send declined follow-up</strong> on the Zoom companion - no manual trigger needed for the standard flow.</p>
            <p className="mt-2">After purchase, the lead receives a unique program URL at app.bodyrecode.au/program/[token]. The program is tailored to their body state (Depleted / Transitioning / Ready) and includes a full 12-week training and nutrition protocol. To preview what a client sees, go to <strong>Dashboard → Preview → Program</strong>.</p>

            <Training title="Why statuses matter">
              <p>The pipeline exists to tell you exactly where every lead is at a glance - and where the system is getting stuck. If you have 12 leads sitting at Report Sent with no Zoom booked, that is a data point, not a coincidence. It means the report landed but didn&apos;t create enough pull to book the call.</p>
              <p className="mt-2">Cold - No Booking is not a failure status. It means the timing wasn&apos;t right when the sequence ran. These leads still have their data on file - they&apos;re candidates for the re-engagement blast when you&apos;re ready to run it.</p>
              <p className="mt-2">Closed - Declined and Closed - No Show are both recoverable. They go into the re-engagement pool. Don&apos;t treat them as dead.</p>
            </Training>
          </Section>

          {/* Section 2 */}
          <Section id="zoom-1" title="2. Zoom - Call Companion" colour="teal">
            <p>Open the <strong>Call Companion</strong> from the lead page before the Zoom. It opens in a new tab so you can run it alongside the call.</p>
            <p className="mt-2"><strong>Rebuilt 12 Aug 2026.</strong> Same five stages and the same scripts as before. What changed is the layout: it is now one continuous numbered scroll shaped like performance.bodyrecode.au/how-it-works, instead of tabs and modes you had to navigate mid-call.</p>
            <ol className="space-y-1.5 list-decimal list-inside text-[#43474F] text-sm mt-2">
              <li><strong>Recap</strong> - your recap script, built from their state and score, with the training context toggle. Set that first, stage 2 adapts to it.</li>
              <li><strong>Conversation and hot spot</strong> - the full question set across energy, sleep, stress load and training, then the hot spot block. If they completed the pre-call form, their answers sit here too so you are not asking what they already told you.</li>
              <li><strong>Tie the hot spot to how this works</strong> - the same five stages as performance.bodyrecode.au/how-it-works, in the same order: the Foundational Read and the eight areas it covers, the two ways the read places her (readiness, then pattern), what gets built and the portal it lives in, the weekly read loop, and the Progress Read at the end of each block. Each stage gives you an example of how to say it, then everything that stage actually involves listed underneath: all eight areas, all three readiness levels, all four patterns, all ten things in the portal. Their readiness and their pattern are highlighted for you on the stage 2 cards.</li>
              <li><strong>Offer and packages</strong> - what is included, all four packages with founding rates, the commencement fee and the founding client offer.</li>
              <li><strong>Outcome</strong> - Path A, B or C. <strong>All three now send something.</strong> Out sends the declined follow-up. Needs time sends a hold email immediately and puts them back on your Today list in three weeks. Proceeding hands over to onboarding.</li>
            </ol>
            <p className="mt-2">A call timer runs in the header. Notes and objection handling open as side drawers so you can reach them without losing your place.</p>
            <p className="mt-2"><strong>The companion is sex-gated (26 Aug 2026).</strong> Two of the four patterns are hard-gated by biology: a man cannot be typed Estrogen-Shift, a woman cannot be typed Androgen-Decline. Stage 3 now shows only the patterns that lead can actually have, and the audience word follows the lead in the room, so a male lead never hears &ldquo;most women are further into this than they think&rdquo;. The spoken causes list drops the one he cannot have too. A grey line at the top of stage 3 tells you which way it is gated. If the lead has no sex recorded, that line turns amber, nothing is hidden, and all four patterns show - ask before you name one. Most older leads are in that state, because the details step came later.</p>
            <p className="mt-2"><strong>Nothing starts hidden (26 Aug 2026).</strong> Every list on every stage is open when you land on it - the question sets, the scope flags, what is included in full, the objections, the lines to have ready. They are still collapsible, so you can shrink a section you have finished with, but you never have to tap to find out what is there. What you say leads each card and is labelled as an example, not a script to recite word for word.</p>
            <Note><strong>Your scripts live in one file.</strong> Every word of spoken copy is in <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">src/lib/companion-content.ts</code>. Edit that file, not the page. <strong>How it works was rebuilt 25 Aug 2026</strong> to mirror the live how-it-works page word for word, because the lead may have read it before the call. The old anatomical-zone card is gone; the read now places her two ways, readiness first, then pattern. <strong>What you say is not the page.</strong> The written detail is the page word for word, because she may have read it, but every spoken script says what the thing plainly is before it names it: you fill out a long questionnaire, I write you a document, that document is what I call your Foundational Read. The state and pattern cards carry the ordinary words to say out loud (&ldquo;run down&rdquo;, &ldquo;the blood sugar one&rdquo;) beside our name for them. The scripts also carry no pattern count, since four is true of the model but only three are available to a woman.</Note>
            

            <p className="font-semibold text-[#141821] mt-3">Pre-Call Read</p>
            <p>Above the Coaching Entry section on the lead detail page, the <strong>Pre-Call Read</strong> card holds the lead-specific brief for the upcoming call. Their pattern, what to listen for, lines to have ready. Click <strong>Add</strong> or <strong>Edit</strong> to write or update it. The brief persists per-lead and is independent of the companion notes.</p>
            <Note><strong>&ldquo;Needs time&rdquo; is a real path now (fixed 2026-08-17).</strong> Until then it recorded the outcome, set a follow-up three weeks out, and sent nothing — so the person who said <em>no</em> got a courteous email and the person who said <em>maybe</em> got silence. Dee Berry held her call on 13 Aug and the only things she received for the next three weeks were cold sequence emails asking her to book the call she had just had. Tapping <strong>Needs time</strong> now sends a hold email straight away: nothing expires, here is when I will check in, no pressure. There is a tickbox beside the outcome buttons to also send the <strong>$97 self-guided program</strong> — tick it only when money or commitment was the barrier, because offering a cheaper door to someone who was close to a yes talks them down a tier. They also appear under <strong>Still deciding</strong> on Today for the whole waiting period, not just when the date lands, so a warm lead going quiet is something you can see.</Note>

            <p>Briefs follow a locked 13-section template (Opening → Reading Scorecard Back → Building the Picture → Hot Spot → Pushback Handling → How This Gets You There → Offer → If That&apos;s a Lot → Yes/Path C closing → Path B → Path A → One Thing to Hold → Key Lines). The OPENING and READING-BACK sections lead with the prospect&apos;s lived experience (buyer language) before introducing body state vocabulary. The system-explanation section (How This Gets You There) is where CFFS / fat-storage zones / four profiles / CFWS earn their place. Template doc lives at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/2026-05-01_Pre_Call_Brief_Template.md</code>. Two reference briefs to mirror: Riley (Ready State, 13/15) and Samantha (Transitioning State, 9/15).</p>

            <p className="font-semibold text-[#141821] mt-3">Lead-specific Stage 1 (Recap)</p>
            <p>Stage 1 is fully populated with the lead&apos;s actual scorecard data - their score, body state, and per-section breakdown including the exact description text they selected (e.g. for Energy 1/3 they read &quot;Tired most of the day. Relying on caffeine. Crashes after lunch or training.&quot;). When you reference what they said, you&apos;re literally pointing at it on screen.</p>

            <p className="font-semibold text-[#141821] mt-3">Training context capture (Stage 1)</p>
            <p>Stage 1 has a 3-button toggle: <strong>Currently training</strong> · <strong>Returning to it</strong> · <strong>New to training</strong>. Pick what matches the lead. The selection persists across page refreshes and a badge shows in the top bar.</p>
            <p>The toggle adapts:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Stage 1 script</strong> - gets a one-line preface acknowledging where they&apos;re entering from (returners / new trainers).</li>
              <li><strong>Stage 2 prompts</strong> - the Training category swaps based on context. Active trainers get progress questions; returners get &quot;what made you stop&quot;; new trainers get &quot;what prompted this now&quot;.</li>
            </ul>
            <p>Stages 3 and 4 are identical regardless of training context.</p>

            <p className="font-semibold text-[#141821] mt-3">Hot spot definition</p>
            <p>The hot spot is the <strong>emotional</strong> reason they want to change. Specific, vulnerable, in their words. Not &quot;lose 5kg&quot; - the thing underneath that. Examples:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><em>&quot;I hate how my lower body looks in jeans.&quot;</em></li>
              <li><em>&quot;I avoid being in photos with my wife.&quot;</em></li>
              <li><em>&quot;I don&apos;t recognise myself in the mirror anymore.&quot;</em></li>
              <li><em>&quot;A friend made a comment last year and I haven&apos;t shaken it.&quot;</em></li>
            </ul>
            <p>Surface it in Stage 2 by building rapport with context questions first, then pushing to the emotional probe. Drop the exact words into your live notes so you can reference them in Stage 3 when you tie the system back to their thing.</p>

            <p className="font-semibold text-[#141821] mt-3">Coach Drawer</p>
            <p>The top bar has a <strong>Coach Drawer</strong> button. Open it any time during the call to access:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Objection Handling</strong> - Two-step script when a price objection holds.</li>
              <li><strong>Online</strong> - Pitch script and package details for the online option.</li>
              <li><strong>Language</strong> - Body-state-specific pattern and interpretation language.</li>
            </ul>
            <p>The drawer overlays the main view so you don&apos;t lose your place in the stage flow. Close it when you&apos;re done.</p>

            <p className="font-semibold text-[#141821] mt-3">Notes panel actions</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Live Notes</strong> - Type observations as the call unfolds. Click <strong>Save</strong> to persist.</li>
              <li><strong>Mark Call Complete</strong> - Updates lead status to Zoom Completed. Available at any stage.</li>
              <li><strong>Send declined follow-up</strong> - Fires the 3-email re-engagement sequence and the $97 downsell offer.</li>
            </ul>

            <p className="mt-3">In Stage 4, three decision path buttons appear in the right side panel:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Path A - Declined</strong> - Updates status to Closed Declined.</li>
              <li><strong>Path B - Needs Time</strong> - Updates status to Zoom Completed.</li>
              <li><strong>Path C - Proceeding</strong> - Pathway selector (Full Rate or Online), then the Foundational Read link can be sent immediately.</li>
            </ul>

            <Training title="What the Listen half is for">
              <p><strong>Stages 1 and 2 are not a sales call.</strong> The only job here is to make the lead feel correctly understood - that their scorecard reflects something real, and that you understand the actual emotional reason they want to change.</p>
              <p className="mt-2">If a lead doesn&apos;t trust the scorecard, price becomes the only thing they can evaluate. If they trust it and feel seen, they&apos;re evaluating whether this is the right intervention - a different conversation.</p>
              <p className="mt-2">The hot spot is the bridge. Without surfacing the emotional driver, Stage 3 (where you tie the system back to their thing) lands generic.</p>
            </Training>

            <Training title="What the Pitch half is for">
              <p><strong>Stage 3 - Tie hot spot to training.</strong> This is the heart of the conversion. Walk through the four system cards in order, but every card gets anchored back to what they told you in Stage 2. Card 2 is where you name their likely biological profile - read the description back and watch them recognise themselves.</p>
              <p className="mt-2"><strong>Stage 4 - Offer &amp; Packages.</strong> They&apos;ve seen what you do and how it gets to their thing. State what&apos;s included, then the price, highest first. Open on $225/week for 3x and say it is assessed, then land on $189/week for 2x, which is where clients start. Pause after stating it. The silence is not awkward, it is the lead processing.</p>
              <p className="mt-2"><strong>There is no launch rate to mention any more.</strong> It was retired on 26 Aug 2026 and the list prices came down instead, so there is nothing left to discount off. If a lead has heard about it from someone, say it closed and that the current rates are lower than the ones it was discounting.</p>
              <p className="mt-2"><strong>Decision.</strong> Three paths. Know which one you&apos;re in before you respond. Path A closes cleanly. Do not re-pitch.</p>
            </Training>

            <Note><strong>Repriced 26 Aug 2026.</strong> Read the sheet <strong>highest to lowest</strong>. Open on <strong>3x at $225/week and say it is assessed</strong>, so it sets the top without being the thing you are selling. That lands most people on <strong>2x at $189/week</strong>, which is where clients actually start, and <strong>1x + self-led at $139/week</strong> if two is a stretch. 3x is $225 because that is exactly what Greg already pays for 3x, and a new client should not pay more than your longest-standing one for the same thing. Online is $69/week and has to sit below in-person 1x because it has no sessions in it. 3x stays coach-assessed. <strong>The 50% launch rate is retired</strong> - the list prices came down instead, so there is nothing left to discount off. Anyone already on the launch rate keeps it.</Note>
          </Section>

          {/* Section 3 */}
          <Section id="coaching-entry" title="3. Coaching Entry" colour="teal">
            <p>From the lead detail page, the Coaching Entry section has two paths — fee-first (default) or convert-first (manual override):</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Path A — fee first (default, recommended)</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Send to Client</strong> - generates a unique Stripe checkout link and emails it directly to the lead in a branded email. One click.</li>
              <li><strong>Copy Link</strong> - generates the link and copies it to your clipboard for manual sending.</li>
            </ul>
            <p>When the client pays:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-[#43474F] text-sm">
              <li>You receive an email notification immediately confirming the payment.</li>
              <li>Their client profile is created automatically.</li>
              <li>Their welcome email and intake link are sent to them immediately.</li>
              <li>The lead status updates to <strong>Foundational Read Paid</strong>.</li>
            </ol>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Path B — convert first, bill later</p>
            <p>Click <strong>Convert to Client</strong>. A prompt asks <code>paid</code> or <code>later</code>:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><code>paid</code> - mark the fee as already paid (cash, transfer, etc). Status flips to Foundational Read Paid.</li>
              <li><code>later</code> - convert now and send the fee link any time. Status stays where it is. The lead page shows an amber <strong>Converted, fee outstanding</strong> callout, and the Send to Client / Copy Link buttons remain available so you can bill when ready. Once the client pays, the Stripe webhook flips status to Foundational Read Paid and sends the welcome email.</li>
            </ul>
            <p><strong>Either path automatically emails the client their portal access</strong> (subject: &quot;[Name], your portal is ready&quot;) so they can begin onboarding immediately - coaching agreement, health declaration, foundational intake, baseline documentation. Sent through <code>sendPortalAccessEmail</code> and logged to <code>client_communications</code>.</p>
            <p><strong>If that email fails to send, the conversion never fails silently:</strong> the convert screen shows a red &quot;Portal access email did NOT send&quot; warning with the reason, always surfaces the portal link so you can send it manually, and emails you an <code>[ALERT]</code> backup. This catches send-time failures (no email on file, provider rejection). A recipient-side junk/bounce after the provider accepts the message - the classic Outlook case - is a deliverability issue addressed by SPF/DKIM/DMARC, not by this alert.</p>
            <p>The lead detail page will then show a <strong>View client profile</strong> link.</p>
            <Note>Use Path B (convert + later) when you want a client onboarding immediately but the fee is being settled separately. The portal opens straight away so they can start the intake while you sort billing.</Note>
            <Training title="Why the Foundational Read exists">
              <p>The $297 Foundational Read is not a deposit. It is a commitment signal. It separates people who are interested from people who are ready. Someone who pays the Foundational Read has moved from considering the program to entering it. That psychological shift matters - it changes how they engage with everything that follows.</p>
              <p className="mt-2">The automation triggered by this payment (profile creation, welcome email, intake link) removes the most failure-prone handover in the entire process. Manual client creation is where admin errors happen. Tying it to the payment makes it impossible to miss.</p>
            </Training>
          </Section>

          {/* Section 6 */}
          <Section id="post-conversion" title="6. Post-Conversion Sequence" colour="teal">
            <p>Once the Foundational Read is paid, the following happens automatically and in order:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-[#43474F] text-sm">
              <li>Client profile created in the Clients dashboard.</li>
              <li>Welcome email sent to the client with their intake link.</li>
              <li>Client completes the foundational intake (230 questions, 30-60 min).</li>
              <li>CFFS generated automatically and appears on the client profile.</li>
            </ol>
            <p>Your manual steps after conversion:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-[#43474F] text-sm">
              <li>Set the <strong>Coaching Package</strong> (online, 2x, or 3x) on the client profile and copy the subscription link to send to the client.</li>
              <li>When the client pays, the Coaching Package section shows a <strong>Subscription Active</strong> badge automatically.</li>
              <li>Once both payments are confirmed, set the <strong>Coaching Start Date</strong> (3-7 days out).</li>
              <li>Client receives a reminder email the day before coaching begins.</li>
            </ol>
            <Note>Coaching does not start until both the Foundational Read and the weekly subscription payment are received. Wait for the Subscription Active badge before setting the start date.</Note>
            <Training title="Why this sequence is ordered this way">
              <p>The Foundational Read comes first, then the subscription. The Foundational Read creates the client. The subscription funds ongoing coaching. Starting coaching before the subscription is active means you are working without confirmation that payment is in place. The Subscription Active badge is your signal that it is safe to set the start date.</p>
              <p className="mt-2">The intake link goes out immediately after payment - not 24 hours later. Momentum is highest right after the payment decision. If you delay the intake, you delay the CFFS, which delays the start date, which delays coaching. The automation handles the immediate send so no action is required on your end.</p>
            </Training>
          </Section>

          <Section id="pre-start" title="7. Pre-Start Window" colour="teal">
            <p>After conversion, set the <strong>Coaching Start Date</strong> on the client profile. This is the date coaching officially begins - typically 3-7 days after the Foundational Read is paid.</p>
            <p>This 3-7 day gap is the Pre-Start Window. It is distinct from the doctrinal <strong>Deliberate Start (IEEP)</strong> which is the locked 2-week phase that begins once the program is generated. See section 7b.</p>
            <p>Until the start date:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>The client dashboard shows a <strong>Starts in Xd</strong> badge.</li>
              <li>The lead status is <strong>Active - Pre-Start</strong>.</li>
              <li>The client gets a reminder email the day before coaching begins.</li>
            </ul>
            <p>The start date is also used to calculate the client&apos;s week number for check-ins and CFWS generation.</p>
            <Training title="Why not start immediately">
              <p>The 3-7 day window is not admin lag. It is intentional. The client needs psychological preparation time - a moment between deciding to do something and actually doing it. Starting immediately after payment can feel reactive. Starting after a deliberate lead-in period signals that this is a structured process, not an impulse.</p>
              <p className="mt-2">The window also gives the client time to complete their intake before coaching begins. The CFFS informs your first week of coaching. If the intake isn&apos;t done yet, don&apos;t set the start date.</p>
            </Training>
          </Section>

          {/* Section 7b - the doctrinal Deliberate Start Window / IEEP */}
          <Section id="deliberate-start" title="7b. Deliberate Start Window (IEEP)" colour="teal">
            <p>The <strong>Deliberate Start Window</strong> is the operational name for the doctrinal <strong>Initial Execution &amp; Exposure Phase (IEEP)</strong>. It is a fixed two-week period that begins once the client&apos;s initial program has been generated and ends when weekly Performance Coaching cadence takes over.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Duration</p>
            <p>Locked at <strong>two weeks, non-negotiable per doctrine</strong>. The IEEP duration cannot be shortened or extended.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">What happens during the window</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>Client executes the initial program</li>
              <li>Coach observes informally</li>
              <li>Form A (Experience-Forward) completed at the end of week 1</li>
              <li>Form B (Pattern-Aware) completed at the end of week 2</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">What does NOT happen during the window</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>CFWS generation - even if both forms are submitted, no synthesis runs until IEEP completes</li>
              <li>PCEP evaluation</li>
              <li>Weekly execution gating</li>
              <li>Load optimisation or progression decisions</li>
              <li>Reassessment triggering</li>
            </ul>

            <p>Data collected during IEEP is used solely for accumulation and calibration. It feeds the first proper CFWS that runs once the window closes.</p>

            <Training title="Why two weeks, locked">
              <p>One week of execution data is not enough to detect patterns. Two weeks gives a Form A and a Form B pair which is the minimum for the CFWS engine to operate on. Less than that and we are reading noise. The lock prevents well-meaning shortcuts that would compromise the calibration.</p>
              <p className="mt-2">The IEEP also serves a behavioural function. The client gets to feel what the program demands without weekly coaching feedback layered on top. They build their own relationship with the work before we start interpreting it together.</p>
            </Training>

            <Note>The Pre-Start Window (section 7) is the 3-7 day gap before coaching begins. The Deliberate Start Window / IEEP is the 2-week phase after coaching begins. Two distinct things, sometimes conflated. Use the doctrinal name when speaking with clients.</Note>
          </Section>

          {/* Section 7 */}
          <Section id="client-portal" title="8. Client Portal" colour="teal">
            <p>Every client has a personal portal at <strong>app.bodyrecode.au/portal/[token]</strong>. This is their single entry point for all onboarding steps, weekly check-ins, and reviewing their program and nutrition plan.</p>
            <p><strong>What she sees when she opens it (rebuilt 27 Aug).</strong> The portal opens on <strong>one thing at full size</strong> - the single next action, resolved in order: an outstanding onboarding step, then her Progress Check if it is open, then this week&apos;s check-in if the window is live, then whatever she is waiting on. When nothing is waiting it says so by name (&ldquo;Nothing waiting on you, Cristobal&rdquo;) rather than going quiet, because a portal that only speaks when it wants something teaches people to feel behind every time they open it.</p>
            <p>Below that: anything <em>you</em> are saying to her keeps its own block - a reply, a new reading, a note on her training, the onboarding checklist. Then <strong>This week</strong>, her check-in state. Then <strong>Everything else</strong>: her program, nutrition plan, sequences, recovery, supplements, sessions, progress, health markers, check-in history, messages, resources and feedback, one line each. The rule is that a <strong>message</strong> gets room and a <strong>destination</strong> gets a line - eleven places she might browse to used to carry the same visual weight as the one thing being asked of her.</p>
            <p>Send the portal link from the client profile using <strong>Send to Client</strong> (emails the client directly) or <strong>Copy Portal Link</strong> (copies to clipboard for manual sending).</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-2 mb-1">Sign-in</p>
            <p>The portal is protected by email-based authentication. When a client visits their portal link, they are directed to <strong>/portal/login</strong> where they enter their email address and receive a <strong>6-digit sign-in code</strong> by email (valid 10 minutes). They type the code on the same page to sign in. No password required. A <strong>Sign out</strong> button appears in the portal header at all times.</p>
            <p>If a client says the code never arrives, it is almost always their email provider blocking or junk-foldering it (Outlook/Microsoft is the usual culprit) - the code is still generated, it just is not delivered. Use the <strong>Issue login code</strong> button in the client&apos;s <strong>Onboarding</strong> panel to mint a code (valid 30 minutes) and read it to them by phone/text. There is a <strong>Copy code</strong> button and a <strong>Copy ready-to-send message</strong> button. This bypasses email entirely. To diagnose the underlying delivery, check the Resend dashboard for that address and confirm SPF/DKIM/DMARC on bodyrecode.au.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-2 mb-1">What the portal shows</p>
            <p>The portal shows the client exactly where they are in the process - completed steps are ticked, locked steps are greyed out. Once onboarding is complete, the portal transitions to show:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>Sessions - for face-to-face clients only (see below)</li>
              <li>Your Reading - the published Foundational Reading appears here once you generate it (see section 10b)</li>
              <li>Weekly check-in (Form A or B, window-gated)</li>
              <li>Weekly training check-in - if they have an active program</li>
              <li>Weekly nutrition check-in - if they have an active nutrition plan</li>
              <li>View your program - full session-by-session program view</li>
              <li>View your nutrition plan - full meal-by-meal plan view, including a collapsible <strong>Food swaps</strong> card (added 2026-07-14) that surfaces the engine&apos;s approved, macro-matched substitutions to the client. Collapsed by default; carries a note that recent manual meal edits may not be reflected in the swap list.</li>
              <li>Active Coaching Client Guide link</li>
              <li>Share feedback - dedicated form at <strong>/portal/[token]/feedback</strong> (see below)</li>
              <li>Daily Sequences (added 2026-07-20) - Morning Reset + Evening Rhythm anchor practices at <strong>/portal/[token]/routine</strong>. Every client sees this once onboarding is complete. Canonical Body Recode defaults show for any client without a coach override; the coach edits at <strong>/dashboard/clients/[id]/routine</strong>. From 2026-07-21 the coach can hit <strong>Generate from client data</strong> on that page to draft a bespoke routine from the client&apos;s intake, body state, medications, and health flags (Haiku 4.5 with Sonnet fallback and safety validation - fire-and-poll UX so a slow LLM call never fails at the browser layer). Review the draft, tweak any step, publish.</li>
              <li>Recovery (added 2026-07-21) - situational recovery protocols at <strong>/portal/[token]/recovery</strong>. Tile only appears when the coach has assigned at least one active protocol. Twenty-protocol library across seven categories (heat, cold, contrast, compression, light, breathwork, systemic cycles) lives at <strong>/dashboard/clients/[id]/recovery</strong>. Coach tags what equipment the client has access to at home and at their gym; library filters to only what the client can actually do. Assign a protocol with an optional coach note - client sees dosing, steps, coach note, and a collapsible safety disclosure. This is separate from the RRS constraint governor (see 11c) - RRS clamps program/nutrition based on signals, Recovery Protocols is the coach-side prescription tool.</li>
              <li>Supplement Stack (added 2026-07-21) - coach-assigned substances at <strong>/portal/[token]/supplements</strong>. Tile only appears when at least one substance is assigned. Substance library lives in code (see <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">src/lib/supplement-substances-seed.ts</code>) with three tiers per substance (Essential / Enhanced / Elite). Coach assigns the substance at <strong>/dashboard/clients/[id]/supplements</strong>; client sees all three tiers and picks the one that fits their budget. 28 substances in the library as of 2026-08-17. Add a new substance by running the deep-research skill, saving the report to <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/</code>, and adding an entry to the seed lib. Only OTC / Listed complementary medicines - S4/S8 stays with Arete Protocol.</li>
              <li><strong>Sleep and circadian protocols added (2026-08-17).</strong> Second Deep Research batch, four more protocols, library now 34 and <strong>light</strong> goes from one entry to three, which was the thinnest shelf against the biggest marketing lane. <strong>Passive Body Heating</strong> (warm bath or shower): onset only, everything else null, contraindicated above a 24 degree bedroom because the mechanism needs a temperature gradient to dump heat into, and mechanism predicts HARM in women with night sweats so cool the bedroom before you warm the body. <strong>Morning Light Exposure</strong> and <strong>Evening Light Reduction</strong> are two separate entries because morning light is a stressor and evening reduction is the removal of one. <strong>Caffeine Timing and Load</strong>: dose first, timing second. Three things clients will ask about that all came back negative: blue-light-filtering lenses (Cochrane, 17 RCTs, probably no difference and not one trial measured melatonin), screen night-mode (167-person RCT found no difference between Night Shift on, off, and no phone at all), and evening amber glasses (nothing on any objective endpoint in the only properly blinded meta-analysis). The instruction that carries the effect is <em>make the house dim, not orange</em>. And 100mg of caffeine did nothing at 12, 8 or 4 hours before bed, so a client on one long black should be left alone.</li>
              <li><strong>Movement-based recovery added (2026-08-17).</strong> The library had heat, cold, contrast, compression, light, breathwork and systemic cycles, and nothing you do with your body. A new <strong>movement</strong> category adds four protocols, each built from its own Claude.ai Deep Research report in <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/recovery_research/</code>. 30 protocols total. The reports are deliberately sceptical and the entries follow them rather than the marketing, so expect the coach doctrine on each to tell you what NOT to claim: <strong>NSDR / Yoga Nidra</strong> does not raise HRV and does not beat a nap; <strong>Restorative Yoga</strong> lost a cortisol comparison to plain stretching in its best trial; <strong>Yin Yoga</strong> has zero human trials behind the fascia claim and is banned in four RRS states because end-range load with a discomfort component is sympathetic input; the <strong>Recovery Walk</strong> does not speed recovery and cannot raise HRV because HRV falls while you walk; and <strong>Evening Wind-Down Mobility</strong> is a behavioural anchor whose only properly-evidenced indication is nocturnal leg cramps in the over-55s. Two findings repeated across separate reports and are worth treating as settled: there is essentially no evidence for any of this in perimenopausal women, and exercise does not relieve vasomotor symptoms.</li>
              <li><strong>Build a plan, recovery (added 2026-08-17).</strong> At the top of <strong>/dashboard/clients/[id]/recovery</strong>, alongside the older RRS-state banner. The banner only appears when the client is in a recovery state; this panel works for every client and folds the state in as one input when there is one. It reads their foundational synthesis, intake domain scores, recent syntheses and check-ins, active program, medications and equipment access, then builds a plan from the protocols they can actually do. Four things are filtered out in code before the model sees the library: protocols needing equipment they lack, anything already assigned, anything the active recovery state contraindicates, and any sleep-breathing tool whose lower levels have not been tried (13D_16, never skip levels). The model never writes dosing. <strong>Approve plan</strong> assigns everything in one action; per-protocol Assign is still there for partial approval. Tag equipment access first or you will only get the no-equipment protocols.</li>
              <li><strong>Suggest a stack (added 2026-08-17).</strong> At the top of <strong>/dashboard/clients/[id]/supplements</strong>, the Suggested-for panel reads the client&apos;s whole file (foundational synthesis, medications plus the medication analysis, approved bloods, intake domain scores, active recovery state, nutrition plan, last three check-ins, what is already assigned or previously tried) and returns a ranked shortlist with a starting tier, a rationale grounded in that client&apos;s own signals, and a Watch line naming contraindications and medication interactions. It also shows what it considered and ruled out, so you can see the working. Runs on the clinical model. Suggests only: nothing is assigned until you click Assign, and each card expands to show the library&apos;s own contraindications, safety notes and the exact tier protocol so you verify before assigning. Sex-specific substances are filtered out in code before the model ever sees them. The model never states a dose, ever: doses come from the library at render time. The last set is saved and re-shown on page load, so opening the page costs nothing. <strong>Approve stack</strong> assigns everything in one action; per-substance Assign is still there if you only want part of it.</li>
              <li><strong>Today&apos;s Focus now nudges both libraries (added 2026-08-17).</strong> Two new actions. <em>In a recovery state with no protocols assigned</em> (amber) fires when RRS is holding a client&apos;s training back and nothing has been given to them to recover with, which is the exact gap the Layer 2 / Layer 3 boundary creates. <em>Steady, no recovery or supplement plan yet</em> (neutral) fires for a client four or more weeks in who has never had either built. Both libraries sat at zero assignments across every client for four weeks because nothing ever pointed at them.</li>
              <li><strong>Recovery states are swept daily (added 2026-08-17).</strong> A recovery state only re-evaluated when the client submitted a check-in, so a client who stopped checking in stayed in one forever. Amanda sat in Sleep Disruption for 56 days against a 14-day doctrine maximum; Ruby-Cate&apos;s state was still open weeks after she offboarded. A 6am cron now closes them. Offboarded clients close as <em>cancelled</em>. Anything past its doctrine maximum closes as <em>system review required</em>, never as resolved, because relief is not validation and the system has no evidence the exit criteria were met, and you get an email listing each one.</li>
              <li>Messages (two-way from 2026-07-28) - the conversation with you at <strong>/portal/[token]/message</strong>. Previously this was a one-way form: the client posted, you got a notification email, and you replied from your own inbox, so nothing ever came back into the portal. It was used zero times. Now both sides of the thread live on the same page. Unread replies raise a card at the top of the portal home and a badge on the Resources tile.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Coach ↔ Client Messages</p>
            <p>Your side lives at <strong>/dashboard/messages</strong> (Clients → Messages). It is a two-pane inbox: the conversation list on the left, the selected thread on the right. Anyone waiting on you sorts to the top of the list with a blue dot, and the page opens on them by default, since that is the reason to be here. Click a name to switch. Each conversation has its own URL (<code>?client=...</code>) so you can bookmark one or use the back button.</p>
            <p><strong>Read receipts.</strong> Each message you send carries its own state underneath the timestamp: <strong>Not read yet</strong> with a single tick, or <strong>Read 2h ago</strong> in Signal Blue with a double tick. Hover the blue one for the exact date and time.</p>
            <p>Be precise about what it means: the stamp is set when the client <em>opens their portal thread</em>, not when they read the words. Since the notification email now carries a preview rather than the full message, opening the thread is the only way to read it, so the two are close. But a client who reads the preview and never clicks through will show as unread even though they have the gist. Treat it as "have they engaged with this", not as proof they took it in.</p>
            <p><strong>Search</strong> at the top of the list matches client names and message text, and searching widens the list to every client, so it is also how you find someone you have never messaged. <strong>Message someone else</strong> at the bottom of the list opens a thread with any client who has never written to you, which is how you start a conversation rather than only answering one.</p>
            <p>A conversation is flagged <strong>Awaiting reply</strong> when the client wrote last, and shows how long they have been waiting rather than only when they last wrote. Those sort to the top longest-wait first. This keys off who spoke last rather than per-message bookkeeping, so answering one of three questions cannot silently close the other two, and a client following up automatically reopens the conversation.</p>
            <p>You are pinged two ways when a client writes: the notification email, and a window-gated SMS (Mon-Sat 08:30-20:00 AEST). The client is pinged the same two ways when you reply. Clients are capped at 10 messages an hour, which nobody with something real to say will ever hit.</p>
            <p>The reply box sits at the top of the thread and the conversation reads <strong>newest first</strong> beneath it, matching what the client sees. Because only one thread renders at a time it shows <strong>in full</strong>, with no truncation - there is no history the client can see that you cannot. <strong>Their view</strong> in the top right opens their portal thread in a new tab, which is worth a look before answering anything about what they are reading.</p>
            <p>Replying does three things at once: it writes into the client&apos;s portal thread, it emails them the reply in full (BCC you) with a link back to the portal, and it clears every outstanding message in that thread from your queue. The client does not need to log in to read your answer - the email carries it - but the portal is where the conversation lives so nothing gets stranded in an email chain.</p>
            <p>The count of clients waiting on a reply also shows as <strong>Awaiting reply</strong> on the Today dashboard, next to unseen feedback. It counts distinct clients rather than raw messages, so three questions from one person read as one conversation to answer.</p>
            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Draft a Reply (2026-07-28)</p>
            <p><strong>Draft a reply</strong> on any client card writes a first pass for you, grounded in that client&apos;s own artefacts: their Foundational Reading, program, nutrition plan, recent check-ins, intake and medications, plus the conversation so far and whatever page they were looking at when they asked. It lands in your reply box with a blue border and a &ldquo;Drafted for you&rdquo; strip. <strong>It writes nothing to their thread and sends nothing.</strong> Edit it, send it, or hit Discard.</p>
            <p>Editing the text clears the draft flag, so the blue strip is only ever telling you &ldquo;these are not your words yet.&rdquo;</p>
            <Note><strong>The scope-of-practice line is the point of this feature, not a footnote.</strong> The drafter is instructed that you are not a medical practitioner and must not interpret a symptom, comment on medication, discuss a test result, or tell a client something is &ldquo;probably fine&rdquo;. Anything clinical, however casually the client phrases it, must be acknowledged and routed to their GP without a half-answer first. It is also barred from inventing prescription: no new exercises, sets, macros or supplements. If a plan needs changing it says you will look at it, it does not make the change. When it cannot answer safely from the context it has, it returns &ldquo;Needs you personally&rdquo; with a reason instead of a draft.</Note>
            <p>Read every draft before sending. It is grounded in real data and corrects clients who misremember their own plan, but it is a first pass in your voice, not your judgement.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Anchored Messages (2026-07-28)</p>
            <p>A message can be attached to the artefact it is about. Client-facing pages for the <strong>Foundational Reading, training program, nutrition plan, supplement stack and recovery protocols</strong> each carry a quiet <strong>Ask about this</strong> row at the bottom. Tapping it opens the message thread with the topic pre-attached and a removable chip reading e.g. &ldquo;Block 2 - Rebuild&rdquo; or their body state.</p>
            <p>The topic is stamped onto the message and shows as a chip on both sides forever. In your inbox the chip is a link straight to the client&apos;s version of that page, so you can read what they were looking at before you answer. Your reply <strong>inherits the same topic</strong>, so an exchange about nutrition stays filed under nutrition instead of becoming a loose general message.</p>
            <p>The label is snapshotted at send time rather than looked up later - blocks get renamed and archived, and a question from March should still read correctly in September.</p>
            <Note>This is deliberately not a live chat. There is no typing indicator and no push notification. You <em>do</em> get a read receipt on your own messages (see below), but the client never sees one on theirs. That asymmetry is deliberate: a receipt is operationally useful to you, and to a client it would only turn every normal gap before a reply into looking ignored. Instead their newest message carries a delivery line, &ldquo;Sent. {coach().firstName} has been notified and will reply here&rdquo;, which answers the real worry (did that send) without creating an expectation about timing. It disappears once you reply, since the reply is its own proof. It is an async coaching thread - set the expectation with clients that you reply within your normal working rhythm. The Ask-about-this rows are styled as quiet hairline links rather than buttons for the same reason: the artefact is the point, and the question is the escape hatch when a line of it does not land.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Client Feedback Channel</p>
            <p>Every portal landing now has a <strong>Share feedback</strong> card under Resources. Clients submit free-text feedback under one of five categories: <code>portal_experience</code>, <code>coaching_experience</code>, <code>feature_request</code>, <code>bug</code>, <code>other</code>. Each submission writes to the <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">client_feedback</code> table and emails Kade a notification with the body inlined (so a reply can go straight from the email if needed).</p>
            <p>Every broadcast email sent to clients now ends with a <strong>Tell us what would help</strong> section linking to the same form. Pattern is canonical via <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">src/lib/broadcast-feedback-footer.ts</code> - drop it into any future broadcast HTML template so the feedback channel is always present.</p>
            <p>Coach-side inbox view is not yet UI-built; submissions live on the row. Reply via the notification email&apos;s reply-to (client email is on file). The <code>acknowledged_at</code> column is reserved for a future triage UI.</p>
            <p>Migration: <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">sql/2026-05-13_client_feedback.sql</code>.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Sessions (Face-to-Face Clients)</p>
            <p>Face-to-face clients see a <strong>Sessions</strong> section in their portal home that links to <strong>/portal/[token]/sessions</strong>. This page shows:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li>All their fixed weekly slots (e.g. Mondays · 7:00 am · 60 min, Wednesdays · 7:00 am · 60 min)</li>
              <li>Upcoming session occurrences across all slots - with a <strong>Confirmed</strong> badge if the session has been confirmed, or <strong>Scheduled</strong> for regular upcoming occurrences</li>
              <li>A reschedule section - shows available face-to-face slots for the next 21 days. The client selects a time and confirms the booking. You and the client both receive a branded confirmation email.</li>
            </ul>
            <p className="mt-2">To set up a client&apos;s fixed sessions, go to their client profile and click <strong>Set up →</strong> next to the Face-to-Face Session card. Click <strong>+ Add slot</strong> for each recurring day - pick the day, time, and duration. Slots appear as a list and can be removed individually with the ✕ button.</p>
            <p className="mt-2">To book an individual session from the dashboard, go to the Face-to-Face Sessions page and use the <strong>Book a session</strong> form in the Booked Sessions panel. Pick the date, time, and duration - this creates a <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">client_sessions</code> record. The session then shows as <strong>Confirmed</strong> in the client portal once the client confirms attendance via the reminder email.</p>
            <p>Every portal page shows a sticky header with the Body Recode logo and sign-out button, and a fixed footer reading <strong>&ldquo;Questions? Message {coach().firstName} →&rdquo;</strong> that opens their message thread. Changed 2026-07-28: that footer used to link to WhatsApp on every page, which meant the one always-visible &ldquo;how do I reach you&rdquo; affordance in the whole portal sent every client to the one channel the system cannot see. Client contact now stays on the record. Pre-portal pages (e.g. the baseline form) have no thread to send to, so those keep the WhatsApp fallback.</p>
            <Training title="Why one portal instead of multiple links">
              <p>Previous builds sent separate links for intake, baseline, and check-ins. Each link was another thing to track and another point of failure. A single portal link eliminates that. The client bookmarks it once and uses it throughout the entire coaching relationship - onboarding, check-ins, resources. Everything is in one place, in the right order, with the right steps unlocked at the right time.</p>
            </Training>
          </Section>

          <Section id="client-onboarding" title="9. Client Onboarding" colour="teal">
            <p>Onboarding happens entirely through the client portal. The steps unlock in sequence - each step must be completed before the next is available:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-[#43474F] text-sm">
              <li><strong>Coaching Agreement</strong> - reviewed and e-signed in the portal. You receive a notification when signed.</li>
              <li><strong>Health Declaration</strong> - health and readiness screening. You receive a notification when submitted. If medical clearance is flagged, a Medical Clearance step is automatically inserted before intake unlocks.</li>
              <li><strong>Medical Clearance</strong> (if required) - the moment the health declaration flags clearance, the client gets an auto-email (Kade voice, dark template) pointing them at the Medical Clearance card on their portal. They download a real PDF (server-rendered via puppeteer, pre-filled with their name), take it to their GP, and upload the completed form. You review it and mark clearance received on the client profile, which unlocks the intake.</li>
              <li><strong>Foundational Intake</strong> - 230-question intake covering all signal domains. You receive a notification when submitted.</li>
              <li><strong>Baseline Documentation</strong> - bodyweight, waist, hips, chest, and three progress photos (front, side, back). You receive a notification when submitted. Once both intake and baseline are in, you get a second &quot;completed onboarding - CFFS ready&quot; email and the Generate CFFS button becomes available on the client profile.</li>
            </ol>
            <p>You receive a notification email at every step as the client completes it. All submitted documents (agreement, health declaration, intake, baseline) are viewable and printable from the client profile.</p>
            <Note>CFFS is coach-triggered, not auto-generated. After both intake and baseline are submitted, click <strong>Generate CFFS</strong> on the client profile. Auto-generation was removed 2026-05-13 so coach can review intake responses before locking the read.</Note>
            <Training title="What the intake is building">
              <p>The 230-question intake is not a form. It is the raw material for the CFFS - a structured read of the client&apos;s current body state across all signal domains. The questions exist because body response patterns don&apos;t reveal themselves in a short intake. Depth matters.</p>
              <p className="mt-2">The baseline measurements taken here are the reference point for everything that follows. Week 1 data only becomes meaningful because of what was captured here. Encourage the client to be accurate rather than aspirational with their numbers.</p>
            </Training>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-6 mb-2">Updates section (post-onboarding follow-ups)</p>
            <p>The <strong>Updates</strong> section on the client profile (under the Intake row) is the container for any post-onboarding task the coach has queued for the client to complete on their portal. It only appears once the foundational intake is complete &mdash; there&apos;s nothing to &quot;update&quot; before the baseline is in. Each item below is its own named card so when more update types ship (delta intake, full re-intake, block-end auto-prompt &mdash; see <a href="https://github.com/BodyRecode/body-recode-mvp" className="text-[#1056D6]">project_deferred_reassessment_flows</a>) they slot in alongside without restructuring.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Updates &middot; Supplementary intake (backfilling new fields)</p>
            <p>When new fields are added to the foundational intake after a client has already submitted theirs (e.g. medications on 2026-05-11, dietary context on 2026-05-12, consumption detail &ndash; meals per day, fluids, caffeine, alcohol &ndash; on 2026-06-03), existing clients don&apos;t lose access to those fields. The supplementary intake card on the Updates section has three states:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Not sent yet</strong> &mdash; click <strong>Add follow-up to portal</strong> to create a pending supplementary <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">intake_invitations</code> row with <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">kind=&apos;supplementary&apos;</code>. The portal landing page detects this and surfaces a teal &quot;A quick follow-up from Kade&quot; card next time the client signs in.</li>
              <li><strong>Pending</strong> &mdash; once the card exists, two extra actions appear: <strong>Email link</strong> (sends the client a branded reminder via Resend with the Outlook-safe shell + plain-text URL fallback, logged as <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">supplementary_intake_invite</code> in client_communications) and <strong>Copy follow-up link</strong> (puts the <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/intake-supplement/&#123;token&#125;</code> URL on the clipboard for DM/SMS). The default is still portal-only; the email is the explicit escape hatch for clients who don&apos;t log in between weeks.</li>
              <li><strong>Complete</strong> &mdash; row collapses to the completion timestamp. No actions.</li>
            </ul>
            <p className="mt-3"><strong>What the client sees:</strong> a 9-question form at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/intake-supplement/&#123;token&#125;</code>. Medications + 8 dietary/consumption fields (restrictions, preferences, typical day, meals per day, fluids, caffeine, alcohol, eating environment). ~4 minutes.</p>
            <p><strong>What submit does:</strong> updates the most recent intake row with the dietary fields, writes medications to <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">clients.medications</code>, marks the invitation complete, sends Kade a coach notification email, and stops there. <strong>The CFFS is NOT auto-regenerated</strong> (changed 2026-06-21, mirrors the Medications + Dietary editors). The Foundational Synthesis panel on the client profile renders an amber &quot;Supplementary newer than CFFS&quot; banner with a Regenerate button when <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">intake_invitations.completed_at &gt; cffs.generated_at</code>; the section also auto-opens and the section header shows a &quot;Supplementary newer &mdash; regenerate&quot; attention pill. Coach reviews the new dietary + medication context, then clicks Regenerate when ready.</p>
            <p><strong>Idempotent:</strong> clicking <strong>Add follow-up to portal</strong> twice does not create duplicates. Same for the email send &mdash; refuses if no pending supplementary exists.</p>
          </Section>

          {/* Section 8 */}
          <Section id="cffs" title="10. CFFS - Coach-Facing Foundational Synthesis" colour="teal">
            <p>The CFFS is the structured interpretation of the client&apos;s current body state across 8 signal domains, labelled <strong>Foundational Synthesis - CFFS</strong> on the client profile.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">When is the CFFS generated</p>
            <p>As of 2026-05-13, the CFFS is <strong>coach-triggered</strong>, not auto-generated. The trigger sequence is:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>Client completes foundational intake. You receive an email confirming intake is in; <strong>no CFFS yet</strong>.</li>
              <li>Client submits baseline (measurements plus front, side, and back photos). You receive a second email: <em>&ldquo;{`{name}`} completed onboarding - CFFS ready for generation&rdquo;</em>.</li>
              <li>You open the client profile and click <strong>Generate CFFS</strong> on the Foundational Synthesis panel. The Fat Map reads the baseline photos as part of Spatial Patterning (see Visual Signal Integration below).</li>
            </ul>
            <p>Both submission orders are handled - if a client somehow submits baseline before intake (rare), the second email fires on intake submission instead. The helper <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">notifyOnboardingCompleteIfReady</code> is the single source of truth for the trigger.</p>
            <p><strong>Why coach-triggered:</strong> the CFFS is the interpretive seed. Every downstream artefact (Foundational Reading, Program Reading, Nutrition Reading, program generation, nutrition generation) reads from it. The coach being in the loop on its creation - reviewing the inputs first, optionally setting Coach Guidance, then generating - aligns with how every other reading on the platform works. CFFS was the lone auto-gen outlier; this commit closes that.</p>
            <p><strong>Existing CFFS, baseline re-capture:</strong> if a CFFS is already published and the client re-submits a baseline (e.g. with new photos), the notification adapts: <em>&ldquo;{`{name}`} submitted baseline - CFFS can be regenerated with the new photos&rdquo;</em>. Regeneration is optional and not automatic; you decide whether the new visual evidence is material enough to refresh the interpretation.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">What the CFFS contains</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
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
            <p>Click <strong>Download PDF</strong> on the CFFS card. This calls a server-side Puppeteer endpoint that renders the report headlessly and returns a binary PDF directly to your downloads folder. No print dialog, no Save vs Cancel confusion.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Visual Signal Integration (Fat Map sees the baseline photos)</p>
            <p>Since 2026-05-12, CFFS generation is <strong>multimodal</strong>. When the client&apos;s latest baseline submission carries the three photos (front, side, back), they are downloaded, base64-encoded, and attached as image content alongside the text prompt. Claude reads them per a strict doctrine block (VISUAL SIGNAL INTEGRATION in <code>src/lib/cffs-prompt.ts</code>): photos feed Spatial Patterning only, convergence with intake signals is still required, no aesthetic judgments, no broken-body framing, conservative language throughout. If photos are missing or any fetch fails, the route falls back to text-only and Claude is told to note the absence in the closing interpretive notes. The model in use (Claude Haiku 4.5) supports vision natively.</p>
            <p>Practical effect: a client whose photos show clear stress-belt expression with the matching intake signals (sustained stress, sleep disruption, regulatory load) gets a sharper Fat Map read than text alone could produce. The same downstream surfaces (Foundational Reading, Program Reading, Nutrition Reading, program generation, nutrition generation) all read from the CFFS, so the photo signal propagates through the whole interpretation stack without any vision wiring in those generators.</p>
            <p>If a client&apos;s baseline didn&apos;t include photos (older clients onboarded before the baseline form, or partial submissions), the CFFS still generates and explicitly notes that Spatial Patterning was inferred from intake alone. Send them a baseline re-capture if you want the visual layer added; the next CFFS regeneration will pick them up.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">How to tell which CFFS read the photos</p>
            <p>Each CFFS row that ran through the multimodal flow stores two extra fields, which surface on the coach panel:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Photo badge</strong> in the panel footer next to the Generated date. <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">Photos ✓ 3/3</code> in teal means the photos were attached at generation time. <code className="bg-[#EFF1F4] px-1 rounded text-[#666D7A] text-[12.5px]">Photos ✗ Not provided</code> in muted grey means no photos went into the prompt (older CFFS rows have no badge at all). Hovering shows the count.</li>
              <li><strong>Visual Signal Summary section</strong>, a dedicated teal-accented card that sits above the seven standard CFFS sections when populated. Claude writes 2-4 sentences naming plainly what the photos showed across the four Fat Map zones, where they converged with the intake, and where they diverged. This is the &ldquo;at a glance&rdquo; read of what the visual layer actually contributed - faster than scanning the full <code>primary_patterns_and_signals</code> and <code>closing_interpretive_notes</code> sections for photo references.</li>
            </ul>
            <p>Both surfaces are additive - older CFFS rows generated before 2026-05-13 simply hide them. New regenerations populate them automatically.</p>
            <p>Migration: <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">sql/2026-05-13_cffs_visual_signal_fields.sql</code>.</p>

            <p>The CFFS is paired with a client-facing version called the <strong>Foundational Reading</strong> (see next section). The two are generated from the same intake and stay consistent with each other. The CFFS is yours to interpret. The Foundational Reading is what the client sees.</p>
            <Note>The CFFS is a coaching reference document, not a diagnostic tool. It does not prescribe training changes.</Note>
            <Training title="How to use the CFFS">
              <p>The CFFS is not a report to file away. It is the interpretive framework for your first weeks of coaching. Before you prescribe anything - load, frequency, nutrition adjustments - read the CFFS. The Capacity Constraints and Guardrails section in particular tells you what not to do before it tells you what to do.</p>
              <p className="mt-2">The Body State Classification (Remediation, Optimisation, Post-Optimisation) should orient your entire early coaching approach. A client in Remediation is not ready for the same intervention as one in Optimisation. The CFFS makes that distinction clearly - your programming should reflect it.</p>
              <p className="mt-2">Risk Flags and Watch Items are not optional reading. If something is flagged, it means the intake data produced a pattern that requires attention. These should inform how you frame weekly check-in prompts and what you&apos;re watching for in the CFWS.</p>
            </Training>
          </Section>

          {/* Section 10b - client-facing version of the CFFS */}
          <Section id="foundational-reading" title="10b. Foundational Reading - Client Facing" colour="teal">
            <p>The Foundational Reading is the client-facing translation of the CFFS. It is generated from the same intake using a separate prompt, takes the CFFS as additional input so the two stay consistent, and is written in supportive but conservative language that the client can read in 90 seconds.</p>

            <p>It is structured around five sections, each with a distinct job:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-[#43474F] text-sm">
              <li><strong>Where you are right now</strong> - body state classification translated for the client and what it means physiologically.</li>
              <li><strong>What your body is telling us</strong> - the dominant patterns the engine surfaced, written so the client recognises themselves in it.</li>
              <li><strong>What we are focusing on first</strong> - the priorities. Reframes the coach-side constraints as forward-looking focus areas, not problems.</li>
              <li><strong>What we are not doing yet</strong> - the trust-builder. Direct about what we are deliberately NOT pursuing right now and why. Most coaches do not explain restraint, this section does.</li>
              <li><strong>A note from your coach</strong> - short closing in your voice. Acknowledges the work the client has put in by completing intake, and sets expectation for what comes next.</li>
            </ol>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-1">How to generate</p>
            <p>On the client profile, scroll to the <strong>Foundational Reading - Client Facing</strong> section directly under the CFFS. Click <strong>Generate &amp; Publish</strong>.</p>
            <p>That does two things:</p>
            <ol className="space-y-1 list-decimal list-inside text-[#43474F] text-sm">
              <li>Drafts the reading via Claude (~10 seconds).</li>
              <li>Auto-publishes it to the client portal at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/portal/[token]/foundational-reading</code>.</li>
            </ol>
            <p className="mt-2">Generating does <strong>not</strong> email the client. When you&apos;re ready to tell them it&apos;s live, click the <strong>Notify client</strong> button on the same panel (it appears once the reading is published). It sends a branded email from <strong>{coach().email}</strong> linking straight to their reading, and the pill flips to <strong>Notified</strong>. Use this for a brand-new client whose reading is their first deliverable; otherwise the client is also brought into the portal when you publish their first training or nutrition plan.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-1">Pills and state</p>
            <p>Two pills surface the reading state at a glance, sitting next to the section title:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Live in portal</strong> (teal dot) - the reading is currently visible to the client.</li>
              <li><strong>Notified</strong> (envelope icon) - the email has been sent. Hover to see when.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-1">Regenerate, Unpublish, Republish</p>
            <p><strong>Regenerate</strong> replaces the draft in place. The client portal updates silently with the new version. The client is not re-emailed (so successive revisions during prompt tuning never spam them). The Notified pill persists from the first send.</p>
            <p><strong>Unpublish</strong> takes the reading down from the portal without deleting it. The portal card disappears and the reading page returns a friendly &ldquo;not yet available&rdquo; message. Use if you regenerate and want a moment to review before re-exposing the new version.</p>
            <p><strong>Republish</strong> puts it back live. No new email is sent on republish either, since the client has already been notified once.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-1">Preview, PDF, Client view</p>
            <p>From the reading card header you have three quick links:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Preview</strong> - opens the cream/black formatted reading in a new tab so you can read it as the client will see it.</li>
              <li><strong>PDF</strong> - one-click download via the same Puppeteer endpoint as the CFFS report. Lands in Downloads, no print dialog.</li>
              <li><strong>Client view</strong> - opens the actual portal URL in a new tab so you can see the page exactly as the client lands on it (only shown when published).</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-1">In the client portal</p>
            <p>Once published, a <strong>Your Reading</strong> card appears at the top of the client&apos;s portal landing under their onboarding tasks. Tapping it loads the same cream/black premium layout. The client gets the same one-click <strong>Download PDF</strong> button at the top of the page so they can save it locally too.</p>

            <Training title="Why a separate client version">
              <p>The CFFS is written in coach language, conservative-clinical, full of terms like &ldquo;regulatory load&rdquo;, &ldquo;explicit non-directives&rdquo;, and &ldquo;risk flags&rdquo;. The same content shown to a client without translation reads as cold or alarming.</p>
              <p className="mt-2">The Foundational Reading translates that same interpretation into language that does three things at once: validates the client (they feel seen), explains the methodology (they understand why we are starting where we are), and builds trust (the &ldquo;what we are not doing yet&rdquo; section signals competence and restraint that no other coach is offering them).</p>
              <p className="mt-2">It is also a tangible deliverable post-onboarding. Most coaching pipelines have a long gap between intake and first session. Sending a polished interpretive reading in that window keeps the client engaged and reinforces that something serious is happening behind the scenes.</p>
            </Training>

            <Training title="Prompt safety rails">
              <p>The reading prompt inherits the CFFS doctrine: pattern-based interpretation, conservative under uncertainty, no prescriptions, no diagnostic labels, no causal claims. It also explicitly forbids motivational language, em dashes, and exclamation marks. The prompt is in <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">src/lib/client-reading-prompt.ts</code>.</p>
              <p className="mt-2">Generated content is run through an em-dash strip before being saved, as a belt-and-braces guarantee.</p>
            </Training>
          </Section>

          <Section id="medications-analysis" title="10c. Medications Analysis + Reading" colour="teal">
            <p>The <strong>Medications</strong> field on the client profile captures a free-text list of what a client is currently taking (Yaz, Doxycycline, Salbutamol inhaler, etc.). The Analysis + Reading feature turns that blob into two artefacts: a coach-facing structured per-medication breakdown, and a client-facing prose reading the client sees in their portal.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-1">Disclosure scope expanded 2026-06-04</p>
            <p>The intake medications question (Section H, first field) now explicitly invites disclosure of <strong>performance and recovery compounds</strong> alongside prescribed medications. The intake question and the supplementary intake field both ask in confidence and without judgement and list four categories: prescribed medications, chronic OTC use, performance and recovery peptides / SARMs / anabolic compounds / hormone modulators, and hormone-affecting supplements at therapeutic dose (DIM, ashwagandha cycles, melatonin, etc.). Framing is functional (&quot;anything affecting hormones, recovery, training response, or body composition&quot;), not moral.</p>
            <p>Why: structured PED tracking belongs to <a className="text-[#1B6DFC] underline" href="/dashboard/business">Arete Protocol</a>, not Body Recode. BR captures via the existing free-text <code className="bg-[#EFF1F4] px-1 rounded text-[#1B6DFC] text-[12.5px]">clients.medications</code> field for interpretive purposes only, so the CFFS reads the body accurately. The CFFS prompt now has explicit reading rules for this context: do not read body comp gains or recovery capacity as a clean training-stimulus signal when performance compounds are present; never moralise; never recommend cessation; do not name specific compound classes back to the client in any narrative field that propagates to client-facing readings.</p>
            <p>Existing clients onboarded before this expansion should be pushed a supplementary intake from their profile to capture this context if not already disclosed. Submitting saves the new context to the file but no longer auto-regenerates the CFFS (changed 2026-06-21); click Regenerate on the Foundational Synthesis panel when you&apos;ve reviewed the new disclosures.</p>


            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-1">Coach view: Medications Analysis</p>
            <p>On <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/dashboard/clients/[id]</code> directly below the Medications editor card. Click <strong>Generate analysis</strong> to draft. Claude (Haiku 4.5) reads the medications text + the latest CFFS + intake (DOB, gender, occupation, goal) + active program block + active nutrition plan, and returns a JSON structure with one row per medication. Each row shows:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Name</strong> — canonical, brand-with-generic when known (e.g. &quot;Yaz (ethinyl estradiol + drospirenone)&quot;).</li>
              <li><strong>Purpose</strong> — what it is, what it&apos;s prescribed for.</li>
              <li><strong>Client influence</strong> — observable day-to-day signals to watch for (energy, mood, appetite, GI, sleep, etc.).</li>
              <li><strong>Program influence</strong> — training implications, named with specific physiology (HR blunting, tendon load tolerance, glycaemic response, etc.).</li>
              <li><strong>Nutrition influence</strong> — appetite, GI, micronutrient depletion, food-drug interactions, hydration, dose-meal timing.</li>
              <li><strong>Recovery + regulation influence</strong> — sleep architecture, sympathetic load, HPA axis modulation, fluid/electrolyte shifts, hormonal context.</li>
            </ul>
            <p>Below the per-medication rows, a <strong>Combined picture</strong> paragraph names how multiple meds interact or compound for THIS client (anticholinergic burden, additive sedation, fluid retention compounding, etc.) and ends with the single most important coaching adjustment the medication picture implies. The analysis is coach-only, never shown to the client. Coach-facing technical vocabulary (beta-blocker, COX inhibition, SSRI) is allowed and expected.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-1">Client view: Medications Reading</p>
            <p>Once the analysis is generated, click <strong>Generate reading</strong> to draft the client-facing version. Same Claude call but with a different system prompt that translates every technical mechanism into observable signal language and forbids drug-class names, dose numbers, diagnostic labels, &quot;ask your doctor&quot; framings, and the full internal-jargon banned list (CFFS, spatial patterning, sympathetic dominance, mid-arc, etc.). Auto-retries up to 3 times if any banned term leaks through.</p>
            <p>The reading has four sections, FR/PR/NR voice:</p>
            <ol className="space-y-1 list-decimal list-inside text-[#43474F] text-sm">
              <li><strong>What you&apos;re taking</strong> — each medication named simply, what each is for.</li>
              <li><strong>Why it matters</strong> — how they shape the signals their body sends and what the coach reads differently because of them.</li>
              <li><strong>How we account for it</strong> — what their program and nutrition do to work WITH these medications. Specific, behavioural.</li>
              <li><strong>What to watch</strong> — signals to flag to the coach if they shift.</li>
            </ol>
            <p>The reading is a <strong>draft until you Publish</strong>. Click <strong>Publish to portal</strong> to expose it to the client at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/portal/[token]/medications-reading</code>; it also appears as a card next to the Foundational Reading on the portal landing. Click <strong>Unpublish</strong> to hide it again without deleting. No email is sent on publish — the client discovers the reading next time they open their portal.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-1">Staleness signals</p>
            <p>Both cards show a <strong>Rebuild recommended</strong> amber pill when:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>Coach analysis: <code>medications_updated_at &gt; medications_analyzed_at</code> (you edited the medications text after the analysis was generated).</li>
              <li>Client reading: either <code>medications_analyzed_at &gt; medications_reading_generated_at</code> (analysis is newer than reading) OR <code>medications_updated_at &gt; medications_reading_generated_at</code> (the underlying text changed).</li>
            </ul>
            <p>Click Regenerate on the stale card to refresh. The Publish state persists across regenerations (if it was published before, the new version is also live).</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-1">Empty state</p>
            <p>If the client has no medications recorded, the analysis returns immediately with an empty-meds JSON structure (no Claude call), and the reading is generated with a pre-canned &quot;nothing to account for right now&quot; copy. Saves a Claude credit.</p>
          </Section>

          {/* Section 9 */}
          <Section id="weekly-checkins" title="11. Weekly Check-Ins and CFWS" colour="teal">
            <p>Each week, clients complete one check-in form during the Friday 6pm to Sunday 6:30pm Brisbane window. Forms alternate each week:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Form A</strong> (odd system weeks) - Training, load, and recovery questions.</li>
              <li><strong>Form B</strong> (even system weeks) - Regulation, lifestyle, and context questions.</li>
            </ul>
            <p>Every Friday at 6pm Brisbane time, clients receive an automated email and SMS notifying them that the window is open (cron: <code>checkin-window-open</code>). The notification links directly to their <strong>client portal at /portal/[token]</strong>.</p>
            <p>On Sunday at 5:30pm Brisbane (1 hour before close), clients who haven&apos;t submitted yet receive a closing reminder email and SMS (cron: <code>checkin-window-closing</code>) so nobody misses the window by accident.</p>
            <Note>Both crons gate on <strong>active training program</strong>. Clients who have started coaching but don&apos;t yet have an approved program live (post-onboarding, pre-program-built window) are skipped — they receive no &quot;window open&quot; or &quot;window closing&quot; email or SMS. The portal-side check-in card is also hidden for them. Both cron responses return a <code>skippedNoProgram</code> count for audit.</Note>
            <p>Inside the portal, the <strong>This week</strong> section shows:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>The active form for this week with a Start link - or a ticked state if already submitted.</li>
              <li>Window closed state with the next open time if outside the Friday-Sunday window.</li>
            </ul>
            <p>Clicking Start takes the client to the check-in form at <strong>/portal/[token]/checkin</strong>.</p>
            <Note>One check-in, everything in it (updated 2026-07-23). The separate weekly training check-in and nutrition check-in have been folded into this single weekly check-in, so the client has <strong>one thing</strong> to complete each week. After the reflective questions, the form now asks a short Training block (did you train, how it felt, overall direction) and, when the client has an active nutrition plan, a short Nutrition block (did you follow the plan, what you noticed, overall direction). On submit these still file the same read-only training and nutrition review feeds on the Training Program and Nutrition Plan pages, and still update each plan&apos;s direction - nothing changed on your side. Because it&apos;s now one form, the training and nutrition answers are only collected during the Friday-Sunday window (they used to be submittable any day). The Training and Nutrition answers are deliberately kept out of the CFWS so its interpretation is unchanged.</Note>
            <p><strong>Counts in the sidebar.</strong> Check Ins, Messages and Feedback carry a blue number when something is waiting on you. Blue is a count of work; red is kept for something being wrong, so an unread message is never dressed up as an alarm. The counts recalculate on every page load, and if one cannot be worked out the badge just does not appear.</p>
            <p><strong>The review queue.</strong> Every check-in that comes in lands at <strong>Check Ins</strong> in the sidebar (<code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/dashboard/checkins</code>). It is the one place to work through them rather than opening clients one at a time.</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Week / Today / Yesterday</strong> across the top switches the window. Week is the last seven days and is the default.</li>
              <li>The ring is the share of that window you have answered. The two counts under it are what the percentage divided, so it can always be checked. <strong>The denominator is check-ins submitted, never client count</strong> - a client who had no check-in due cannot drag the number down.</li>
              <li>Rows with anything still waiting on you sort to the top. The rest stay newest-first.</li>
              <li>The chip on the right of a row is the way in. <strong>Review now</strong> (amber) means no response has been written. <strong>Draft ready</strong> means the auto-response has been generated and is sitting in the intervention window. <strong>Sent</strong> means the feedback email has gone. <strong>Skipped</strong> means you marked it as needing no response, which counts as answered.</li>
            </ul>
            <p>When both Form A and Form B have been submitted for the week:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-[#43474F] text-sm">
              <li>The client receives a confirmation email.</li>
              <li>You receive a notification email with a link to the client profile.</li>
              <li>The <strong>CFWS</strong> (Coach-Facing Weekly Synthesis) generates automatically and appears on the client profile under <strong>Weekly Synthesis - CFWS</strong>.</li>
            </ol>
            <p>The CFWS includes Exposure Readiness across 4 dimensions, plus 7 interpretive sections. Click <strong>Download PDF</strong> on the client profile to open the full formatted CFWS report - printable as a PDF.</p>
            <p>The client profile also shows the last several check-in submissions under Recent Submissions.</p>
            <Note>Use the Regenerate button to manually trigger a new CFWS if needed - for example if only one form was submitted and you want to generate from the latest available pair.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Alcohol signal in the check-in (added 2026-06-03)</p>
            <p>Both Form A and Form B now include a single bucketed question in the Recovery Signals section: <strong>Alcohol this week (standard drinks total)</strong>. Buckets: None, 1 to 3, 4 to 7, 8 to 14, 15+. One question, one tap. No free text, no follow-up.</p>
            <p>The weekly check-in coach-feedback generator reads this answer against the client&apos;s <code className="bg-[#EFF1F4] px-1 rounded text-[#1B6DFC] text-[12.5px]">intakes.alcohol_intake</code> baseline (Section H free text from intake) so the engine reads a 4 to 7 week against the client&apos;s normal pattern, not against zero. A drop for a daily drinker and a spike for a non-drinker are read differently. When the week diverges meaningfully from baseline AND the same check-in shows degraded sleep or recovery, the engine may name the link in plain words. When alcohol is at or below baseline, the generator stays silent on it. No moralising, no target numbers, no brand names.</p>
            <p>Alcohol is NOT an RSIB signal. The router still reads recovery_status / session_repeatability / sleep_consistency per 13D_13. Alcohol is a contextual recovery signal that surfaces through the coach response, the CFFS narrative (which already reads <code className="bg-[#EFF1F4] px-1 rounded text-[#1B6DFC] text-[12.5px]">alcohol_intake</code> from intake), and downstream Foundational / Program / Nutrition Readings via CFFS propagation.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Reopen check-in window (added 2026-05-27, smart-form added 2026-06-21)</p>
            <p>The standard window is global (Friday 6pm – Sunday 6:30pm Brisbane). When a client misses theirs and you want to let them complete it ad-hoc, open their profile, go to <strong>Weekly Synthesis</strong>, and click <strong>Reopen check-in (24h)</strong> in the header. This sets <code className="bg-[#EFF1F4] px-1 rounded text-[#1B6DFC] text-[12.5px]">clients.checkin_window_override_until</code> to 24 hours from now (server cap: 7 days). The portal page treats any future timestamp here as &quot;window open&quot; for THAT client only, regardless of the global schedule.</p>
            <p><strong>Smart form pick (2026-06-21).</strong> The Reopen API now also figures out which form the client should actually fill on catch-up. The global rotation alternates Form A / Form B every system week, so if a client misses a B weekend and you reopen on Monday (now in an A week), the default rotation would put them on A — meaning their last submission and their catch-up are both A, breaking the alternation the coach view relies on. The Reopen API compares their last submitted form to the current rotation: if they match, it stamps <code className="bg-[#EFF1F4] px-1 rounded text-[#1B6DFC] text-[12.5px]">clients.checkin_window_override_form</code> with the opposite form so the portal forces that on catch-up. If they differ (alternation is intact), no stamp — current rotation is correct. Cleared on the next Reopen call (re-computed) or on Close. Triggered by Amanda&apos;s W6 catch-up landing on A instead of the B she&apos;d missed.</p>
            <p>While the override is active, the section header shows a blue <strong>Window open until [time]</strong> pill with a Close button to clear it manually before expiry. Form type follows the standard alternation (whatever the system rotation says is current).</p>
            <p>Use sparingly. The Friday-Sunday rhythm is doctrinal — ad-hoc reopens are for genuine miss-recovery, not a substitute for the schedule.</p>
            <Training title="Why this structure exists">
              <p><strong>Alternating forms.</strong> Form A captures load, training, and recovery. Form B captures regulation, lifestyle, and context. Together they produce a complete picture of the week. Running both every week would be 20+ minutes per check-in. Alternating them halves the client burden while keeping the data complete over a two-week cycle. The CFWS is always generated using the most recent Form A and Form B - even if they weren&apos;t from the same week.</p>
              <p className="mt-2"><strong>The Friday-Sunday window.</strong> Friday 6pm is not arbitrary. It gives the client the full week to have happened before they reflect on it. Sunday 6:30pm closes it before Monday, so you have the CFWS ready before the new week begins. Read the CFWS before Monday if you can - it will orient your coaching decisions for the week ahead.</p>
              <p className="mt-2"><strong>Everything through the portal.</strong> The check-in notification links to the portal, not a standalone form. The client uses the same URL they used for onboarding. Over time it becomes the single place they associate with their coaching relationship - not a different link each week.</p>
            </Training>
          </Section>

          {/* Section 11b - Signal Monitoring v1.0 */}
          <Section id="signal-monitoring" title="11b. Signal Monitoring and Reassessment Triggers" colour="teal">
            <p>The system watches the four CFWS readiness signals (Capacity, Schedule, Regulation, Behaviour) week over week and surfaces flags when conditions defined in the <strong>Signal Monitoring and Reassessment Triggers v1.0</strong> doctrine are met. The doctrine itself is at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">~/Dropbox/01_BODY_RECODE/.../Performance_Coaching_Framework_Master_Folder_v1/Signal_Monitoring_and_Reassessment_Triggers_v1.0.md</code>.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Drift definitions</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Single-notch drop</strong>: a signal moves Green → Amber, or Amber → Red between consecutive CFWS. Advisory only, not regression.</li>
              <li><strong>Multi-notch drop</strong>: a signal moves Green → Red in one week. Regression trigger per doctrine §19.</li>
              <li><strong>Sustained instability</strong>: same signal at Amber or Red across two consecutive CFWS. Regression trigger when on Regulation, Capacity, or Behaviour.</li>
              <li><strong>Any Red in latest CFWS</strong>: active regression state. Coach review required.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">CFFS reassessment triggers</p>
            <p>A reassessment is recommended when ANY of the following fires.</p>
            <p className="text-[12.5px] text-[#666D7A] mt-3 mb-1"><strong>Signal-based triggers</strong> (suppressed when CFFS &lt; 21 days old, see Early-program suppression below):</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>The CFWS engine sets <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">reassessment_language_triggered: true</code></li>
              <li>A multi-notch drop occurs on any signal</li>
              <li>Two or more readiness signals are at Amber or Red simultaneously</li>
              <li>Sustained instability persists across two consecutive CFWS</li>
            </ul>
            <p className="text-[12.5px] text-[#666D7A] mt-3 mb-1"><strong>Time-based triggers</strong> (always fire regardless of CFFS age):</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>The active program block reaches its end (current week ≥ block_start_week + week_duration - 1)</li>
              <li>Time since the active CFFS exceeds 12 weeks (annual upper bound)</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Early-program signal-trigger suppression (added 2026-05-18)</p>
            <p>The four signal-based triggers above are suppressed until the active CFFS is at least <strong>21 days old</strong>. A reassessment on a freshly-generated CFFS would produce essentially the same read, since one or two weeks of CFWS signal isn&apos;t enough new evidence to invalidate it. The 21-day floor matches the &quot;three weeks of signal needed before re-interpreting&quot; principle. Time-based triggers (block end, 12-week cap) are NOT suppressed because they aren&apos;t signal-driven.</p>
            <p>Constant: <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">SIGNAL_BASED_TRIGGER_FLOOR_DAYS = 21</code> in <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">src/lib/readiness-monitor.ts</code>. Rationale captured in §3a of the doctrine doc.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">CFWS readiness rating discipline (tightened 2026-05-18)</p>
            <p>The CFWS prompt previously had no rating rubric and would over-call Amber on a single check-in answer (e.g. one &quot;more limited than usual&quot; flipped capacity from Green to Amber). Now the prompt receives the CFFS baseline (body state + the four exposure_readiness values + constraints + risk flags) as the anchor, and ratings reflect deviation FROM the baseline rather than a fresh interpretation of the week in isolation. Rules:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>A single Form A or Form B answer does NOT downgrade a signal on its own. Both forms must converge, OR the rolling window must confirm the same direction.</li>
              <li>Two-notch deviations from baseline in a single week (Green → Red) require an explicit safety event named by the client.</li>
              <li>When in doubt, hold the CFFS rating.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Reassessment is a temporal construct - it cannot apply at intake-time</p>
            <p>Every trigger above requires longitudinal data: multi-week CFWS patterns, completed program blocks, sustained instability across consecutive weeks, or the 12-week elapsed cap. None of these conditions can possibly exist at intake-time CFFS generation, because there is no trajectory yet to evaluate. There is only a single point in time.</p>
            <p className="mt-2">Therefore: <strong>an intake-derived CFFS will never have <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">reassessment_flagged: true</code></strong>. The CFFS prompt does not ask the LLM to set this field at generation; the server forces it to <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">false</code> on insert. The flag becomes settable only later, by the Signal Monitoring engine, when one of the trigger conditions actually fires against accumulated CFWS data.</p>
            <Note>Historical bug fixed 2026-05-09. Prior to the fix, the CFFS prompt asked the LLM to write <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">reassessment_flagged: true | false</code> at intake with no guidance, and the model defaulted to true on most "Remediation / Partially Resolved" classifications. Five clients carried stale flags as a result; all were cleared and the prompt + insert path are now defensive against the same drift.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Where it surfaces</p>
            <p><strong>On the Coaching dashboard list:</strong> three priority-ordered banners at the top — Active Regression (red), CFFS Reassessment Recommended (amber), Drift Advisories (neutral). Each client row shows a status pill if any condition fires.</p>
            <p><strong>On the client profile:</strong> a dedicated panel above the CFFS report shows the active drift conditions, the reassessment triggers, the recommended depth (lightweight / delta / full), and the current block status with weeks remaining. The Regenerate CFFS button is embedded in the panel when reassessment is recommended.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">The reassessment queue (added 2026-08-19)</p>
            <p>Before this, a fired trigger was rendered and nothing else happened, so acting on a regression depended on you opening that client&rsquo;s page that week. A trigger is now a <strong>record with a lifecycle</strong>: it stays <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">open</code> until you either send a Progress Check or dismiss it.</p>
            <p><strong>Dismissing requires a written reason.</strong> That is deliberate and enforced in the API, not just the UI. A dismissal with no reason is indistinguishable from nobody looking, which is the failure the queue exists to prevent.</p>
            <p><strong>Where it lives:</strong> a roster-level queue at the top of the Coaching dashboard (overdue first, then oldest first), and a per-client panel on the client profile. Anything open more than seven days is marked overdue and turns red.</p>
            <p><strong>Monday 7am digest:</strong> emails you everything open, split into Overdue and New. It sends <em>nothing</em> on a clean week, so silence means clean rather than broken. A trigger you have already been told about does not reappear the next week; it only returns once it passes seven days open.</p>
            <p><strong>Scheduled versus Signal:</strong> triggers are tagged by class. <em>Scheduled</em> (block end, twelve-week cap) is date arithmetic with no judgement in it. <em>Signal</em> (multi-notch drop, two-or-more amber/red, sustained instability) is where your judgement is actually required, because the system does over-call — the 21-day suppression rule exists because a six-day-old CFFS once threw four ambers.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Reassessment depth</p>
            <p>Per §5 of the doctrine, a reassessment can be one of three depths. The system recommends a depth based on the trigger but lets you override:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Lightweight</strong>: re-run CFFS engine against the original intake plus the recent CFWS history. No client effort. Default for block-end and single-notch drift.</li>
              <li><strong>Delta intake</strong>: a shortened ~30-question form covering domains likely to have changed. Default for multi-notch drops or two-or-more concurrent Amber/Red signals.</li>
              <li><strong>Full re-intake</strong>: client completes the full 230 questions again. Default for the 12-week cap, two-band body state changes, or Restoration phase exit.</li>
            </ul>
            <Note>The current Regenerate CFFS button performs the lightweight path (re-runs against existing intake). Delta intake and full re-intake flows are doctrine-defined but not yet implemented as separate UI flows. They will be added when the trigger conditions become common.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Block end and macro arc</p>
            <p>The current block always completes uninterrupted. At block end the system surfaces a "Block complete - reassessment review" prompt before the next block is generated. The next block is generated against the most recent CFFS, post-reassessment if performed.</p>
            <p>The macro arc (Accumulation → Intensification → Realization → Restoration) is treated as an <strong>expected path, not a locked schedule</strong>. If reassessment shows the body state has shifted, the next block honours the new state per doctrine §19, which may mean the originally-anticipated phase isn&apos;t selected.</p>

            <Training title="Why thresholds, not just AI judgement">
              <p>The CFWS prompt itself can produce reassessment language when it judges drift to be material. That is interpretive, not rule-based. The doctrine adds a second layer: explicit conditions the engine monitors against, which fire regardless of how the AI interpreted the week. This means a signal that the AI didn&apos;t flag still surfaces if it meets the doctrine criteria.</p>
              <p className="mt-2">The two layers complement each other. The AI catches things the rules don&apos;t (subtle pattern changes the thresholds would miss). The rules catch things the AI might gloss over (consistent slow drift across multiple weeks).</p>
            </Training>
          </Section>

          {/* Section 11c - Recovery and Regulation System */}
          <Section id="recovery-regulation" title="11c. Recovery and Regulation" colour="teal">
            <p>The Recovery and Regulation System is the platform&apos;s <strong>governance layer</strong> for when training and nutrition load must be constrained. It is not a prescription engine. It does not generate sleep targets, breathwork routines, or cold-exposure protocols. It defines the <strong>permission ceiling</strong> on training and nutrition while a recovery state is active.</p>
            <p className="mt-2 text-sm text-[#666D7A]"><strong>Recovery Protocols (added 2026-07-21) is the sibling system.</strong> RRS clamps program/nutrition based on signals (this page). Recovery Protocols is the Layer 3 coach-side prescription tool - see the coach page at <strong>/dashboard/clients/[id]/recovery</strong> to assign sauna, contrast, cold plunge, compression boots, red light, breathwork, deload weeks and more from a 20-protocol library filtered to what each client has equipment access for. Client sees active assignments only at <strong>/portal/[token]/recovery</strong>. RRS state can inform which protocols to assign (that&apos;s the future integration point); the two sit alongside each other but do not overlap.</p>
            <p className="mt-2">Doctrine source: <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">~/Dropbox/01_BODY_RECODE/.../12_Recovery_and_Regulation_System/</code> (Layer 2) and <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">.../13D_Recovery_and_Regulation_Playbooks/</code> (Layer 3 execution). The full canonical reference renders live at <a className="text-[#1B6DFC] underline" href="/dashboard/recovery-regulation">Recovery</a>.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">The 10 playbooks (priority order, single dominant)</p>
            <p>Per 13D_15, only one playbook governs a client at any moment. Higher-tier (lower number) overrides lower-tier:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>T1 NS Overload</strong> (13D_04) — sleep disruption &gt;3 nights + emotional/behavioural collapse → training removed 3–7 days, then 2–3 sessions/wk cap, ≤60% prior duration on reintro.</li>
              <li><strong>T2 Burnout Return</strong> (13D_10) — phased re-entry after confirmed burnout. Phase 1 minimal/no training, Phase 2 1–2 sessions/wk ≤60% load, Phase 3 gradual rebuild.</li>
              <li><strong>T2 Chronic Recovery Debt</strong> (13D_03) — recovery score ≤2 for 2+ consecutive weeks → load -20–40%, sessions -1–2/wk, 14–35 days.</li>
              <li><strong>T3 Sleep Disruption</strong> (13D_05) — 2–3 nights inconsistent → load -10–30%, session ≤75% duration, 5–14 days.</li>
              <li><strong>T3 Lifestyle Stress Dominant</strong> (13D_06) — CFWS Schedule + Capacity flagged with no training overload → load -10–25%, &quot;you do not reduce life stress, you adjust training to match it&quot;.</li>
              <li><strong>T4 Acute Fatigue</strong> (13D_02) — soreness &gt;72h or declining repeatability ≥3 sessions → load -10–25%, max 10 days handling.</li>
              <li><strong>T4 Overreaching</strong> (13D_07) — productive overreach with stable behaviour → minor temper, load -5–10%, maintain frequency.</li>
              <li><strong>T5 Post-Diet</strong> (13D_08) — 14–28 days metabolic and behavioural stabilisation after sustained deficit.</li>
              <li><strong>T5 Post-Competition</strong> (13D_09) — 21–42 days, &quot;the more extreme the peak, the stricter the exit must be&quot;.</li>
              <li><strong>T6 Supportive Only</strong> (13D_12) — baseline. PRS / SRM / CRS allowed when stable; CRS removed when any other playbook active.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">RSIB — the weekly signal capture (Phase 2)</p>
            <p>Per 13D_13, three questions submitted alongside the weekly check-in:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Recovery this week</strong>: 1 (not recovering) → 5 (fully recovered)</li>
              <li><strong>Sessions vs last week</strong>: easier / same / harder</li>
              <li><strong>Sleep consistency</strong>: consistent / inconsistent / severely inconsistent</li>
            </ul>
            <p>The router reads RSIB + CFWS Exposure Readiness (capacity, schedule, regulation, behaviour) each week and runs a 5-step decision tree per 13D_14: regulation check → chronic check → acute check → context check → conservative default.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Router modes (env-controlled)</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Disabled</strong> (<code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">RRS_ROUTER_ENABLED=false</code>): router does not run.</li>
              <li><strong>Observe-only</strong> (Phase 0 default — <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">RRS_OBSERVE_ONLY=true</code>): router evaluates and writes shadow audit rows to <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">recovery_adjustments</code>. No states activated. No programs constrained.</li>
              <li><strong>Live soft gate</strong> (<code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">RRS_OBSERVE_ONLY=false</code>): states activate. Constraints flagged on program/nutrition gen as override-able policy.</li>
              <li><strong>Live hard gate</strong> (<code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">RRS_HARD_ENFORCEMENT=true</code>): states activate. Constraints hard-block program changes that violate doctrine.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Doctrine guards encoded</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Trigger ≠ Authorisation</strong> (12E_02) — signals route, they don&apos;t auto-change programs</li>
              <li><strong>Single dominant playbook</strong> (13D_15) — DB partial unique index enforces this</li>
              <li><strong>Lock-in durations</strong> (13D_14) — no switch within minimum unless escalation tier rule fires</li>
              <li><strong>No relief-as-validation</strong> (12D_03) — exit needs multi-day stable markers, not a single good day</li>
              <li><strong>No tool substitution</strong> (13D_12) — supportive therapies cannot replace primary load reduction</li>
              <li><strong>No protocol prescription at Layer 2</strong> (12A) — engine emits constraint envelopes only</li>
              <li><strong>RRS override absolute</strong> (MSA Domain Boundaries) — when active, progression locked</li>
              <li><strong>Audit every transition</strong> (12E_04) — every router evaluation + state transition writes a <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">recovery_adjustments</code> row</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Where it surfaces</p>
            <p><strong>Recovery dashboard</strong> at <a className="text-[#1B6DFC] underline" href="/dashboard/recovery-regulation">/dashboard/recovery-regulation</a>: read-only doctrine reference page showing all 10 playbook manifests with their numeric constraints, exit criteria, escalation rules, and prohibitions. Layer 2 doctrine sourced live from Dropbox (Folder 12 + MSA RRS pillar).</p>
            <p>Per-client active state visualisation lands in Phase 4. Until then, audit rows in the <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">recovery_adjustments</code> table are the only output (visible via Supabase).</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Phase plan</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Phase 1 (DONE)</strong>: doctrine page + DB tables + router + state machine.</li>
              <li><strong>Phase 2 (DONE)</strong>: RSIB ingest from existing weekly check-in answers (the three questions per 13D_13 are already in Form A and Form B verbatim — no client-facing changes). Router evaluates after each CFWS lands. Per-client shadow log lives on the client profile, just below the readiness drift section. Backfill API at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">POST /api/recovery/backfill</code> derives RSIB from historical check-ins.</li>
              <li><strong>Phase 3 (CURRENT — soft-gate enforcement)</strong>: program generation and nutrition generation now read the active recovery state and apply the playbook&apos;s constraint envelope. Two layers: (a) the LLM is given a prompt section that tells it the active constraints, (b) post-LLM <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">clampProgramToRecoveryManifest</code> walks every exercise and enforces them as defence in depth. On the program-suggest page you&apos;ll see an amber <strong>Active recovery state</strong> banner with the constraints summary and a radio: <strong>Apply constraints</strong> (default, doctrinally correct) or <strong>Override with documented reason</strong> (writes a <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">constraint_overridden</code> audit row). Activation requires <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">RRS_OBSERVE_ONLY=false</code> in env — set in <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">.env.local</code> by default; production needs the flag flipped manually.</li>
              <li><strong>Phase 4</strong>: hard-gate enforcement (<code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">RRS_HARD_ENFORCEMENT=true</code>) — coach loses the override path entirely. Tier escalation alerts. Recovery state history view per client.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">What the recovery clamp actually does</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>RPE drop</strong>: derived from the playbook&apos;s load-reduction range. 10–25% load reduction → -1 RPE on every exercise. 30%+ → -2 RPE. Floors at RPE 3.</li>
              <li><strong>Session removal / cap</strong>: removes the LAST N sessions of the week (preserves earliest = priority work). Caps total weekly sessions if <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">sessionsPerWeekCap</code> set.</li>
              <li><strong>Conditioning blocks stripped</strong>: any block whose label matches conditioning / capacity / finisher / cardio is removed when <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">conditioningBlocked</code> is true (most playbooks).</li>
              <li><strong>Testing exercises stripped</strong>: 1RM/3RM/5RM, max attempts, PR attempts removed when <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">testingBlocked</code> is true.</li>
              <li><strong>Progression-locked banner</strong>: stamped onto <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">weekly_pattern_summary</code> for the duration of the state.</li>
              <li><strong>Nutrition</strong>: prompt-injection only (no post-LLM clamp). Tells the LLM no aggressive deficit, no fuel restriction, maintain protein floor, maintain carb support proportional to training.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Where to watch the router (Phase 2)</p>
            <p>Open any client profile. The <strong>Recovery Router</strong> panel sits between the readiness drift card and the &quot;What is a CFFS&quot; explainer. It shows: current router mode (observe-only / live), latest decision (which playbook would have activated and why), RSIB history for the last 8 weeks, and recent router runs with their triggers. If you&apos;re looking at a client who has not had any historical RSIB written yet, run the backfill API — it derives RSIB from every existing weekly_checkin response and re-evaluates the router per client.</p>

            <Note>The router does not fire on a clean week. RSIB recovery 3+ + sessions same/easier + sleep consistent → no state activates → program generation runs unchanged. The system is invisible until a real signal pattern emerges.</Note>

            <Training title="Why a governance layer, not a prescription engine">
              <p>Per Layer 2 doctrine: recovery is a biological capacity, not a behaviour. The system cannot create recovery by prescribing sleep targets or breathwork routines. What it CAN do is constrain training and nutrition execution when accumulated stress exceeds recovery capacity, so that the client&apos;s biology gets the chance to restore.</p>
              <p className="mt-2">The 13H_03 case snapshots make the cost of getting this wrong concrete: when Tani plateaus, the default reflex is &quot;tighten nutrition, push training harder&quot;. That&apos;s the failure pattern 13G_04 catalogues. With the recovery system in place, the misread gets caught — fatigue is named as fatigue, not lack of discipline.</p>
            </Training>
          </Section>

          {/* Section 11d - RPE Creep Monitor */}
          <Section id="rpe-creep" title="11d. RPE Creep Monitor" colour="teal">
            <p>The objective half of Signal Monitoring. The four CFWS readiness signals (Capacity, Schedule, Regulation, Behaviour) are subjective — clients name them once a week and physical reality lags those words by 1–2 weeks. <strong>RPE creep</strong> closes that gap by comparing what was <em>prescribed</em> on the program against what the client <em>actually logged</em> in the gym this week.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">How it works</p>
            <p>Whenever the readiness panel loads (Coaching dashboard or a client profile), the engine pulls every logged set for the current week of the active block and groups them by exercise. For each exercise with at least 2 logged RPE values, it computes the average logged RPE and compares it to the prescribed RPE on the program.</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm mt-2">
              <li><strong>Creep:</strong> avg logged RPE ≥ prescribed RPE + 1.0. (Client lifted it harder than asked.)</li>
              <li><strong>Severe creep:</strong> avg logged RPE ≥ prescribed RPE + 2.0, OR any single set logged at RPE ≥ 9.5 (effectively a 10).</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Severity tiers</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>0 creeping exercises:</strong> no signal. Silent.</li>
              <li><strong>1–2 creeping exercises:</strong> drift advisory. Yellow pill on the dashboard list; informational panel on the client profile.</li>
              <li><strong>3+ creeping exercises, OR any severe creep:</strong> regression-equivalent. Top-priority banner; fires a reassessment recommendation alongside the drift line.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">What you see</p>
            <p>On the <strong>Coaching dashboard list</strong>, RPE creep rolls into the existing Active Regression / Reassessment Recommended / Drift Advisory pills and tooltips — no new pill type. On a <strong>client profile</strong>, the readiness panel adds an <strong>RPE creep — week N</strong> subsection listing the top 6 creeping exercises with prescribed → avg-logged, the delta, and set count. Severe creep renders in red.</p>

            <Note>Silent when there is no data. If the client hasn&apos;t logged sets this block-week, or has only one logged set per exercise, RPE creep does not fire — too noisy. The signal only speaks when at least 2 logged sets exist for an exercise.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">What to do when it fires</p>
            <p>RPE creep is a prompt, not an auto-action. The signal tells you the prescribed load was too high <em>this week</em>. Three responses, in order of how soft to start:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-[#43474F] text-sm">
              <li><strong>Accept as noise</strong> if it was a one-off bad week (poor sleep, illness, life stress). The next CFWS will confirm.</li>
              <li><strong>Hold the block</strong> via Weekly Review → set direction to <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">hold</code>. Keeps the prescription, signals no further progression this week.</li>
              <li><strong>Regenerate with adjusted coach guidance</strong> — edit the macro arc&apos;s Coach Guidance to specify lower RPE or reduced volume, then Regenerate.</li>
            </ol>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">What it does NOT do</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li>Does not auto-clamp the next program generation. (That requires a separate doctrine addendum and is deferred.)</li>
              <li>Does not look across weeks yet — sustained creep across 2+ weeks is a queued future feature.</li>
              <li>Does not fire if the prescribed RPE was null (timed exercises, carries, runs — those have no RPE prescription).</li>
            </ul>

            <p className="text-[12.5px] text-[#98A0AD] mt-4">Doctrine: Signal Monitoring §10 (2026-05-11 addendum). Thresholds are named constants in <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">src/lib/rpe-creep-monitor.ts</code>; revise both in lockstep.</p>
          </Section>

          {/* Section 10 */}
          <Section id="coaching-package" title="12. Coaching Package and Upgrades" colour="teal">
            <p>On the client profile, set the client&apos;s <strong>Coaching Package</strong> to record which plan they are on:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>In-Person 1x + self-led - $139/week</strong> (lead with this)</li>
              <li><strong>In-Person 2x - $189/week</strong></li>
              <li><strong>In-Person 3x - $225/week</strong> (coach-assessed)</li>
              <li><strong>Online - $69/week</strong></li>
            </ul>
            <p>The Launch Rate (50% off) row is <strong>retired</strong>. It only appears now if the client you are looking at is already on one of those rates, so they can keep it. It cannot be assigned to anyone new.</p>
            <p className="font-semibold text-[#141821] mt-4">Non-billing (Contra / Comp)</p>
            <p>A third row holds <strong>Contra (trade)</strong> and <strong>No-charge / comp</strong>. Use these when the client is not on a paid weekly subscription — e.g. a contra deal where they provide work in exchange for the coaching seat, or a founding-friend comp. Clients on a non-billing package are skipped by the Payments tracker: no Stripe-customer flag, no subscription-overdue indicator, no entry on the dashboard overview Payments counter. The weekly Send / Copy / Schedule controls don&apos;t appear because there is no recurring Stripe link to send. Switch them back to a paid package if the arrangement changes.</p>
            <p className="mt-2"><strong>Foundational Read on non-billing clients:</strong> Even on a non-billing package, the $297 Foundational Read is optional per client. Open the client&apos;s Payments section — for clients on Contra / No-charge, you&apos;ll see a <em>Foundational Read (optional)</em> block with <strong>Send Foundational Read link</strong> and <strong>Copy link</strong>. Use this when you want the contra client to still pay the foundational read. Once paid, the section flips to &quot;Paid {`{date}`}&quot; and the Stripe payment is recorded against the client like any other Foundational Read.</p>
            <p>Once a paid package is selected, three options appear: <strong>Send to Client</strong> (sends immediately), <strong>Copy Link</strong> (copies to clipboard), and <strong>Schedule Send</strong>. The link includes the client&apos;s ID so the system can identify them when they pay. When the client completes payment, the <strong>Subscription Active</strong> badge appears automatically on the client profile.</p>
            <p className="font-semibold text-[#141821] mt-4">Scheduling a delayed send</p>
            <p>If you want to queue the subscription link now but have it land in the client&apos;s inbox on a specific date, click <strong>Schedule Send</strong>, pick a date, and confirm. The system will send it automatically at 8am Brisbane time on that day. A yellow <em>Scheduled for [date]</em> badge appears on the profile - click Cancel next to it to remove the scheduled send before it fires. Once sent, the badge is replaced with the sent date.</p>
            <p>To upgrade a client from 2x to 3x:</p>
            <ol className="space-y-1.5 list-decimal list-inside text-[#43474F] text-sm">
              <li>Cancel the existing $189/week subscription in Stripe.</li>
              <li>Select <strong>In-Person 3x</strong> on the client profile.</li>
              <li>Copy and send the $225/week subscription link to the client.</li>
              <li>Update to 3x once they have subscribed.</li>
            </ol>
            <Note>The 3x package is coach-assessed. Only offer it during weekly check-ins once you have enough data to confirm the client can sustain three sessions per week.</Note>
            <p className="font-semibold text-[#141821] mt-4">Upgrade Companion</p>
            <p>When a 2x client reaches Week 8 and is consistently progressing, a teal <strong>Upgrade Companion</strong> link appears in the Coaching Package card on their profile. This opens a 5-stage conversation guide that walks through how to raise and present the upgrade in a session. The client dashboard also surfaces an <strong>Upgrade</strong> badge next to eligible clients and shows a teal banner at the top of the clients list.</p>
            <p>The upgrade companion covers: performance check (is the client actually ready?), making the case using their data, presenting the $189 to $225 price difference, handling objections, and closing with a clear yes/defer/no outcome.</p>
            <Training title="Why 3x is not offered on the Zoom">
              <p>On the Zoom call, you have a report, one conversation, and whatever they told you about themselves. That is not enough data to know whether a client can sustain three sessions per week on top of their life. Offering 3x too early sets up a client for a load they cannot maintain - and when they struggle with it, they attribute the problem to the program rather than the prescription.</p>
              <p className="mt-2">The 3x upgrade should come from the CFWS data. Several weeks of check-ins will show you whether a client&apos;s recovery, regulation, and schedule can support a third session. When the data says yes, you make the offer from a position of evidence. The client will feel the difference between being sold a bigger package at the start and being assessed for one after you&apos;ve watched them closely for weeks.</p>
            </Training>
          </Section>

          <Section id="clients-dashboard" title="13. Clients Dashboard" colour="teal">
            <p><strong>The client list stays beside you.</strong> On a wide screen every client page shows a list of clients between the sidebar and the record, grouped into Active, Starting soon and Ended, with a filter at the top. Click a different name and only the record changes - the list keeps its place and whatever you typed in the filter. It is hidden on narrower screens, where a third column would leave the record too cramped to read.</p>
            <p>The clients dashboard shows a live overview of all active clients. For each client in active coaching, the row displays:</p>
            <p className="mt-3"><strong>Today&apos;s Focus</strong> (on the dashboard home) folds onboarding stage, readiness signals, overdue check-ins, and payment state into one priority-coded action per client. Money signals (Stripe subscription past_due / unpaid / canceled, or Foundational Read outstanding 7+ days into coaching) sit at the top in red - they preempt readiness flags because billing failures matter before coaching nuance does. Clicking the row deep-links to the payments section on the client profile.</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Week number</strong> - Current coaching week based on their start date.</li>
              <li><strong>A / B check-in status</strong> - Teal if submitted this week, grey if not yet submitted.</li>
              <li><strong>CFWS readiness dots</strong> - Four coloured dots (Capacity, Schedule, Regulation, Behaviour) from the latest weekly synthesis. Green = ready, Amber = caution, Red = flag.</li>
              <li><strong>Body state badge</strong> - From the latest CFFS.</li>
              <li><strong>Upgrade badge</strong> - Teal badge shown on any 2x client at Week 8+. Indicates they are eligible for the upgrade conversation. A banner also appears at the top of the clients list when one or more clients are eligible.</li>
            </ul>
            <p>Clients in the Pre-Start Window (before their coaching start date) show a <strong>Starts in Xd</strong> amber badge instead.</p>
            <Training title="How to read the clients dashboard">
              <p>The dashboard is designed to tell you who needs attention this week without clicking into every profile. The readiness dots are your triage layer. If a client has any amber or red dots, open their profile before their session.</p>
              <p className="mt-2">A grey A or B check-in badge mid-week is normal - the window may still be open. A grey badge on Monday means they didn&apos;t submit. That is worth a check-in message, not just a note.</p>
              <p className="mt-2">Week number matters more than it looks. A client in week 2 is in a completely different phase than a client in week 14. The early weeks are about establishing baseline patterns. Overloading someone in week 2 because their CFWS looks good is still overloading them in week 2.</p>
            </Training>
          </Section>

          <Section id="automated-status" title="14. Automated Status Flow" colour="teal">
            <p>Lead statuses update automatically at these trigger points. You do not need to change them manually.</p>
            <div className="space-y-2">
              <FlowRow trigger="Scorecard completed" from="-" to="New Check-In" auto />
              <FlowRow trigger="Body Decode Report purchased via Stripe" from="Any" to="Report Sent" auto />
              <FlowRow trigger="Lead books via bodyrecode.au/book" from="Any" to="Zoom Booked" auto />
              <FlowRow trigger="Foundational Read paid via Stripe" from="Any" to="Foundational Read Paid" auto />
            </div>
            <p className="mt-2">These transitions are manual - they require your input after the call or conversation:</p>
            <div className="space-y-2">
              <FlowRow trigger="Call completed - Path B or C" from="Zoom Booked" to="Zoom Completed" auto={false} />
              <FlowRow trigger="Lead declines after Zoom 1" from="Zoom Booked" to="Closed - Declined" auto={false} />
              <FlowRow trigger="Lead did not attend Zoom" from="Zoom Booked" to="Closed - No Show" auto={false} />
              <FlowRow trigger="Lead goes cold - no booking after follow-ups" from="Report Sent" to="Cold - No Booking" auto={false} />
            </div>
            <Training title="What requires your attention vs what runs itself">
              <p>The system handles the objective triggers - payment, scorecard submission, booking. You handle the human judgements - whether the Zoom went ahead, which path it ended on, whether a lead genuinely went cold or just needs more time.</p>
              <p className="mt-2">The manual transitions are not admin tasks. They are your interpretive decisions about where a lead is in the process. Keeping them accurate keeps the pipeline data trustworthy. If statuses drift, you lose visibility into where the real friction is.</p>
            </Training>
          </Section>

          <Section id="email-sequences" title="15. Email Sequences and Automation" colour="teal">
            <Note><strong>Single source of truth:</strong> the full inventory of every email the platform sends — 124 distinct subject lines across 34+ client-facing paths plus coach notifications, drip workflows, and one-off extras — lives at <code>~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/03_EMAIL_SYSTEM/EMAIL_INVENTORY.md</code> (with a <code>.docx</code> mirror generated by pandoc). When you ship a new email, update that doc + the dashboard automation entry + this section in the same commit (see <code>feedback_email_inventory_update</code>). Section 15 below is the narrative summary; the inventory doc is the authoritative list.</Note>
            <Note><strong>Social icon strip on every email (2026-07-08):</strong> every email that renders through <code>emailSignature()</code> or <code>darkEmailSignature()</code> now includes a 4-icon monochrome social strip (Instagram @body_recode_ · Facebook /bodyrecode.au · Instagram @kade_dunstone_ · LinkedIn /in/kadedunstone/) between the founder byline and the daily-rotating tagline strip. Inline-SVG data URIs — no external asset host, no images-blocked-by-Outlook risk. Public export <code>socialIconStrip()</code> from <code>src/lib/email-signature.ts</code>.</Note>
            <Note><strong>Inbound reply forwarding + SMS alert (2026-07-21).</strong> When anyone replies to an app-sent email, the reply routes to <code>replies.bodyrecode.au</code> (MX &rarr; Postmark) and hits <code>/api/inbox/inbound</code>. The full reply is now <strong>forwarded to your inbox</strong> ({coach().email}) with <strong>Reply-To set to the sender</strong>, so you read and answer it straight from Apple Mail without opening the dashboard. Known leads/clients still thread into <strong>Business &rarr; Inbox</strong> as a &ldquo;Reply received&rdquo; event; replies from people <em>not</em> in your system (e.g. Collective coaches) were previously logged-and-discarded and are now rescued to your inbox, flagged &ldquo;not a saved contact&rdquo;. A window-gated SMS heads-up (Mon-Sat 08:30-20:00 AEST) also pings you so a reply is never missed. Both are best-effort and never block the webhook. See <code>src/app/api/inbox/inbound/route.ts</code>.</Note>
            <Note><strong>Coach message reply (2026-07-28).</strong> Replying to a client from <strong>/dashboard/messages</strong> emails them <em>&ldquo;{coach().firstName} replied to your message&rdquo;</em> with your reply in full, their original question quoted above it for context, and a CTA back to the portal thread. BCCs you. Logs to <code>client_communications</code> as <code>coach_message_reply</code>. The email carries a <strong>preview only</strong> (about 220 characters) plus a CTA, changed 2026-07-28. It used to send the reply in full, which was wrong: the email has no reply-to pointing at the thread, so a client answering in their inbox lands in your personal email and splits the conversation in two. Coaching messages also carry health content, and an inbox is a weaker container than the portal. A coach-initiated message reads &ldquo;A message from {coach().firstName}&rdquo; rather than &ldquo;replied to your message&rdquo;. <strong>Replying to that email now works.</strong> Each one carries an addressed reply-to (<code>reply+&lt;portal token&gt;@replies.bodyrecode.au</code>), so a client who answers from their inbox has it filed into their portal thread as a normal message, quoted chain stripped. You still get the forward and your own SMS nudge. <strong>Clients are never sent an SMS for portal messages</strong> (removed 2026-07-29): the email already carries the preview and the link, so a text was a second interruption saying the same thing on a one-way sender they cannot reply to. A reply is only filed when the sender&apos;s address matches the client who owns that thread; anything else falls through to the old forward-to-inbox path, so nothing is ever lost. Built via <code>src/lib/coach-reply-email.ts</code>, sent from <code>src/app/api/clients/[id]/reply-message/route.ts</code>. Best-effort: if Resend fails, the reply is still saved and visible in their portal.</Note>
            <Note><strong>SMS is one-way (2026-07-21).</strong> All Body Recode texts send from the alphanumeric sender ID <strong>&ldquo;BodyRecode&rdquo;</strong> (Twilio Messaging Service, no phone number in the pool). Alphanumeric senders <strong>cannot receive replies</strong> - a recipient who tries to reply gets a failed send. So <strong>no SMS ever promises a reply</strong>; the check-in text points to its paired email instead (email replies work and now forward to your inbox). To make SMS two-way you&apos;d add a real AU number to the Messaging Service and point its inbound webhook at <code>/api/webhooks/twilio/inbound</code>. See <code>project_sms_one_way_sender</code>.</Note>
            <Note><strong>Progress Check invite (rewritten 2026-08-27).</strong> The block-end Progress Check now sends itself, triggered by <strong>the client&apos;s weekly check-in submission</strong> - the gate is &ldquo;she has reached the FINAL WEEK of her block AND her check-in is in&rdquo;, so the instant the second half becomes true, it goes. <strong>Revised 31 Aug 2026:</strong> this used to wait for the block&rsquo;s calendar end date, which broke the promise the portal was already making to her (&ldquo;finish the week and send your check-in, and your Progress Check opens next&rdquo;) and inherited every drifted activation date - Razia&rsquo;s Block 2 was activated eight days before Block 1 finished, so her dates never described what she actually did. Not the next morning, not on a schedule. It links to <strong>her portal</strong> rather than deep into the form; the Progress Check waits under <em>This week</em>. Two things about the copy matter: it says <strong>ten minutes, not five</strong>, and it names what to have ready before she starts - scales, a tape measure, somewhere for three photos. Measurements and photos are now <strong>required</strong>, and the old email promised five minutes and mentioned neither, which walked a client into a wall she could only escape by abandoning her answers. A daily backstop cron catches anything the live path misses and emails you when it fires, because the backstop catching one means the event missed it. Single implementation in <code>src/lib/progress-check-dispatch.ts</code>; see the automation entry under Business &rarr; Automations and the full record in EMAIL_INVENTORY.</Note>
            <p>The following outbound email sequences run automatically. All emails send from <strong>{coach().email}</strong> via Resend. All automated emails use the <strong>Body Recode light brand template</strong> - Pure White canvas, Graphite Black text, Signal Blue accents, Body Recode logo header, Kade signature with photo at the bottom.</p>
            <Note><strong>Drip sequences self-cancel on conversion.</strong> Before each step in any active workflow, the runner re-checks the lead state. If the lead has been converted to a client (<code>converted_to_client_id</code> set), deactivated, or marked <strong>Closed - Declined</strong>, the run is marked <strong>cancelled</strong> and remaining emails do not fire. So a lead with a 7-day drip running who converts on day 3 stops getting day 5 / day 7 emails automatically.</Note>
            <Note><strong>Outlook-safe shell (2026-05-13, palette flipped 2026-05-21).</strong> Every email goes through <code>darkEmailShell()</code> in <code>src/lib/email-shell.ts</code> - a nested-table layout with <code>bgcolor</code> attributes (not just CSS) so Outlook for Windows, M365, and outlook.com all render the canvas reliably. Function name is historical; the canvas is now Pure White / Graphite Black / Signal Blue. Without the shell, Outlook strips body background and text becomes invisible. Reported by Ruby-Cate (outlook.com) and Samantha (Mater M365) - both said the emails arrived blank.</Note>
            <Note><strong>Mobile dark-mode meta fix (2026-05-31).</strong> 17 hand-rolled email templates (the reading emails, weekly check-in feedback, portal orientation, downsell, the $37 report, several API-route inline emails) declared <code>{'<meta name="color-scheme" content="dark">'}</code> as a legacy holdover from the pre-2026-05-21 dark palette. On Gmail iOS/Android and Apple Mail this forced auto-inversion of the now-light email bodies, so they rendered dark on phone but correct on desktop. All 17 swept to <code>content="light only"</code> to match <code>darkEmailShell</code>. New emails composing through the shell are already safe; any new hand-rolled HTML must declare <code>content="light only"</code> + <code>supported-color-schemes" content="light"</code> from day one.</Note>
            <Note><strong>Plain-text URL fallback.</strong> Every email with a CTA button also renders the destination URL as plain text in a bordered monospace block via <code>emailUrlFallback()</code>. Microsoft 365 Defender Safe Links / ATP rewrites clickable <code>{'<a>'}</code> URLs in corporate inboxes, so the plain-text version gives the client something to copy-paste into a personal browser. Anywhere you add a new branded email, import both helpers from <code>@/lib/email-shell</code>.</Note>
            <Note><strong>Coach BCC on one-off extras only (2026-05-14).</strong> The <code>COACH_BCC</code> export from <code>@/lib/email-shell</code> is applied ONLY to ad-hoc / one-off "extra nudge" sends that aren't part of any standard automated flow. Right now that is exactly two paths: <code>/api/send-supplementary-intake-email</code> (the &ldquo;Email link&rdquo; button on the supplementary intake row) and <code>scripts/send-supplementary-intake-email.mjs</code>. Standard sends &mdash; welcome, intake invite, Foundational Read link, subscription link, sign-in code, weekly check-in window, session reminders, drip steps, etc. &mdash; do NOT BCC the coach. Rule of thumb: if the system would have sent it anyway as part of normal flow, no BCC. If you/script chose to send something extra on top, BCC.</Note>
            <Note><strong>Duplicate Subscription Guard (2026-05-22, hardened 2026-07-07).</strong> The Stripe webhook blocks a 2nd subscription per client. If a client completes a subscription checkout while their <code>subscription_active</code> flag is already true, the webhook now <strong>verifies against Stripe</strong> before treating it as a duplicate: it lists their live subs (active + trialing + past_due) across both the incoming checkout&apos;s customer_id and the client row&apos;s tracked <code>stripe_customer_id</code>, and only auto-cancels the new sub if at least one OTHER live sub actually exists. If Stripe shows zero live subs (i.e. the flag was stale), it logs a <code>[stale-flag-recovery]</code> warning, flips the flag to false, and lets the checkout proceed as a fresh subscription. Original bug (Samantha, 2026-05-22): three subscriptions in 14 days from the reusable Payment Link. Regression that triggered the 2026-07-07 hardening (Samantha again): her cancel_at_period_end sub naturally expired on 10 Jun but her flag never flipped to false — the natural-expiry deletion webhook was missed or didn&apos;t update the flag. 27 days later she completed a new $149.50 checkout, the guard read the stale flag and auto-cancelled her 7 seconds after charge. Post-hardening, that path resolves cleanly. See <code>src/app/api/webhooks/stripe/route.ts</code>.</Note>
            <Note><strong>Subscription Started + Payment Failed notifies (2026-06-23).</strong> Two webhook events now email you on coach-actionable payment moments. <strong>Subscription started</strong> fires once per client on first checkout completion (right after <code>subscription_active</code> flips to true) and tells you the package, weekly price, first invoice amount, and links to their <code>#payments</code> section &mdash; closes the silent-success gap where Send Subscription emails would land and you&apos;d have no signal the client actioned the link. <strong>Payment failed</strong> existed already but only resolved client_id from invoice line metadata, which Stripe doesn&apos;t propagate to renewal invoices &mdash; rebuilt to use the same fallback chain as the success handler (line metadata &rarr; <code>client_subscriptions</code> &rarr; <code>clients.stripe_customer_id</code>) so renewal-card-decline failures now surface. Email includes amount, attempt count, next retry date or &ldquo;stopped retrying&rdquo;, and a direct client link. Recurring weekly renewals stay silent by design &mdash; only first-start and any-failure emails. See <code>src/app/api/webhooks/stripe/route.ts</code>.</Note>
            <Note><strong>Per-Client Subscription Checkout Sessions (2026-05-22, defense-in-depth follow-up to the guard above).</strong> The Send Subscription Link sender (both the manual coach button and the daily cron) no longer emails the static <code>buy.stripe.com/&hellip;</code> Payment Link. Instead, each send calls <code>createSubscriptionCheckoutForClient()</code> in <code>src/lib/subscription-checkout.ts</code>, which creates a fresh single-use <code>{`stripe.checkout.sessions.create({ mode: 'subscription' })`}</code> tagged to the client. The URL is consumed on first completion and expires within 24 hours &mdash; so a client physically cannot accidentally re-trigger the subscription by re-clicking the email or refreshing the Stripe-hosted page. The webhook guard above stays in place as a safety net for any other route into the duplicate scenario.</Note>

            <Note><strong>Lead Quality Weekly Report (2026-05-14).</strong> A scheduled remote Claude agent runs every Monday at 9am Brisbane (cron <code>0 23 * * 0</code> UTC) and curls <code>/api/admin/lead-quality-stats?email=true</code>. The endpoint computes new leads this week (split by green/yellow/red tier), all-time show + close rate per tier, and red-flagged vs clean comparison, then sends you a branded email with a verdict on whether the Hormozi red flag hypothesis is holding. Used to validate whether the qualifier questions on the scorecard (approach + investment readiness) are filtering accurately. Routine: <code>trig_01UmzsNPJguEMZ3zTufciRZJ</code>. Coach notification on every scorecard now also includes a Lead Quality block showing tier, red-flag badge, and the raw A/B/C/D answers.</Note>
            <Note><strong>July 27 Gate Decision Reminder (2026-07-22, one-shot).</strong> A macOS launchd plist (<code>au.bodyrecode.july27-gate.plist</code>) fires once at <strong>8am on 27 July 2026</strong> and runs <code>~/Dropbox/01_BODY_RECODE/07_ADS/july27_gate_reminder.py</code>. Sends a branded HTML checklist email to <code>kade@bodyrecode.au</code> covering the 7 Option D Phase 2 actions: scale to $75/day ABO, unpause Perimenopausal + Slipping HP ad sets, stand up Blueprint retargeting, confirm Blueprint page, shift Sunday promo rotation to 2 Challenge : 1 Blueprint, and lock Hook01 creative structure for Peri/HP. Remove the plist after it fires.</Note>
            <Note><strong>Meta Ads Weekly Report (2026-07-22).</strong> A macOS launchd job fires every <strong>Friday at 9am Brisbane</strong> and runs <code>~/Dropbox/01_BODY_RECODE/07_ADS/generate_report.py</code>. The script reads the latest Meta Ads Manager export (<code>.numbers</code> or <code>.csv</code>) from the <code>RAW_DATA/</code> folder, computes per-ad-set metrics (spend, reach, clicks, landing page views, CTR, CPC, CPM, Results, CPL), and emails Kade a branded HTML report (from <code>kade.dunstone@gmail.com</code> → <code>kade@bodyrecode.au</code>) plus saves a Markdown copy to <code>ANALYSIS/</code>. Campaign tracked: BR-FunnelB-Leads-2026Q3 (Option D Stage Gate). Not a Vercel or Inngest automation — runs on Kade&apos;s MacBook; credentials stored in macOS Keychain under key <code>bodyrecode-ads-gmail</code>. To re-run manually: <code>python3 ~/Dropbox/01_BODY_RECODE/07_ADS/generate_report.py</code>.</Note>

            <Note><strong>Email unsubscribe (built 2026-07-28).</strong> Until this, the app had <em>no</em> email opt-out of any kind — no footer link, no page, no <code>List-Unsubscribe</code> header. The only route out was emailing Kade and having him switch the person off by hand in every table they appeared in (three separate tables for Nicolette Dunstone, with no guarantee a fourth wasn&apos;t missed). Now: one <code>email_suppressions</code> row per address is the single source of truth, and <code>sendMarketingEmail()</code> in <code>src/lib/marketing-email.ts</code> is the one way to send marketing email — it checks suppression, appends the footer, and sets <code>List-Unsubscribe</code> + <code>List-Unsubscribe-Post</code> so Gmail and Apple Mail show their native one-click button (a real deliverability signal, not just a legal box-tick). Tokens are HMAC-signed and carry the address, so nobody can unsubscribe an address they don&apos;t own and there&apos;s no token table to maintain. The page confirms on button press rather than on load, because corporate link scanners follow URLs in incoming mail and must not be able to opt someone out by previewing their inbox — that&apos;s also why the destructive action is POST-only. <strong>Wired into marketing paths only:</strong> the automation drip, Booking Agent touches, re-engagement. Deliberately NOT transactional (Zoom confirmations and reminders, sign-in codes, receipts, report delivery) or paid product delivery (Blueprint/Membership weekly) — withholding someone&apos;s booking confirmation because they left a drip would be worse than the problem. <strong>When you add a new marketing sequence, send it through <code>sendMarketingEmail()</code>, not Resend directly</strong>, or it will keep mailing people who opted out. SMS already had this properly: every message carries &ldquo;STOP to opt out&rdquo; and <code>/api/webhooks/twilio/inbound</code> handles the keywords.</Note>

            <Note><strong>Booking Agent drafted nothing for 10 days (found + fixed 2026-07-28).</strong> The approval queue at <code>/dashboard/business/outreach</code> had never held a single row. Leads were enrolling correctly and the Inngest runs were starting, but <code>outreach_touches</code> was created with RLS on and <strong>no table grants</strong> — so every draft insert from the admin client hit a permission error. The sequence would enrol a lead, sleep its 1-day delay, then die on &ldquo;draft insert failed&rdquo; and retry itself out. Nothing surfaced anywhere. <code>service_role</code> bypasses RLS but still needs the underlying table privilege — see <code>sql/outreach_touches.sql</code>. A sweep found five more tables with the same gap, all at zero rows: <code>artefact_version_archive</code>, <code>copilot_messages</code>, <code>recovery_protocol_assignments</code>, <code>recovery_protocol_suggestions_log</code>, <code>supplement_assignments</code>. All granted in <code>sql/service_role_grants_backfill.sql</code>. <strong>Rule: any new table gets an explicit <code>grant … to service_role</code> in its schema file, or every server-side write to it fails silently.</strong> Separately, the 19 Jul backfill script was documented to run with <code>.env.local</code>, whose <code>INNGEST_EVENT_KEY</code> is not valid for Inngest cloud — Evelina and Nicolette were flagged enrolled but no run was ever created for them. Always use <code>.env.local.prod</code> for scripts that fire Inngest events.</Note>

            <Note><strong>Duplicate scorecard sequence (found + fixed 2026-07-28).</strong> Two copies of the scorecard follow-up workflow were sitting in <code>be_workflows</code> — one named with an em-dash, one with a hyphen — both active, both listening on the same <code>form_submitted</code> / <code>scorecard</code> trigger. <code>fireTrigger()</code> enrols a lead into <strong>every</strong> active workflow matching a trigger, so from 13 Jul every scorecard lead ran both sequences and got near-duplicate emails one second apart on all five touches (e.g. &ldquo;Your Body State result&rdquo; + &ldquo;Why your body has stopped responding&rdquo;). Four leads were affected: Carmine Epis, Kim Stevenson, Brittany Vos, Nic McKirdy. The em-dash copy is now deactivated — the workflow runner re-checks <code>is_active</code> before every step, so the in-flight runs cancelled themselves at their next wake-up with nothing further sent. Root cause of the recurrence risk: <code>/api/scorecard/seed-automation</code> looked the workflow up with <code>maybeSingle()</code>, which errors and returns null once two rows match, so re-running it would have created a <em>third</em> copy. It now takes all matches, keeps the live one, and deactivates any extras. If you ever add a workflow by hand, check nothing else is already listening on the same trigger.</Note>

            <p className="font-semibold text-[#141821] mt-4">Scorecard Follow-up Sequence (automatic)</p>
            <p><strong>Rewritten 24 Aug 2026:</strong> four of the five sold the retired $37 report and one of them sold nothing else. All four now point at <strong>The Body Decode</strong> at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">bodyrecode.au/decode</code>. These emails live in the database, not in code, so they were edited in place rather than re-seeded. <strong>Never click Re-sync on this workflow</strong> — the live copy is newer than the code seed, so a re-sync replaces good copy with old copy.</p>
            <p>Fires when someone completes the Readiness Scorecard. <strong>5 emails over 13 days</strong>. Each email is personalised to the lead&apos;s score and body state using <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">{`{{scorecard_score}}`}</code>, <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">{`{{scorecard_state}}`}</code>, and <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">{`{{first_name}}`}</code>. Voice: leads with fat loss as the symptom (buyer language), introduces body state vocabulary as the diagnostic. Emails 1-2 push the $37 Body Decode Report; emails 3-4 push the free strategy call; email 5 names both options based on state.</p>
            <div className="space-y-1">
              <SeqRow day="Immediate" label="Email 1 - Your readiness result + book a call or get the report" />
              <SeqRow day="Day 2" label="Email 2 - What your body state result actually means" />
              <SeqRow day="Day 4" label="Email 3 - Following up on your scorecard" />
              <SeqRow day="Day 8" label="Email 4 - The prescription problem" />
              <SeqRow day="Day 13" label="Email 5 - Last one from me" />
            </div>

            <p className="font-semibold text-[#141821] mt-4">The Body Decode daily arc (automatic, new 24 Aug 2026)</p>
            <p>One email at 7am Brisbane and one SMS four hours later, for five days, each pointing at that day&apos;s lesson. Emails are short on purpose: the reading happens in the portal, and an email that repeats the lesson gives her a reason not to open it. <strong>Plus one nudge on day 1 only</strong>, which replaces that day&apos;s lesson for anyone who signed up and never answered the questions, because without a read the five lessons have nothing to explain. That is the highest-value send in the sequence.</p>
            <p><strong>It only fires for Body Decode signups.</strong> /challenge and /decode post to the same enrolment route and fire the same event, and six functions listen to it, so both sides now check a product flag. Without that, a Body Decode signup would have received the entire 14-day Challenge arc as well: fourteen SMS, the PAR-Q chasers and a Day 14 reveal for a product she is not in.</p>
            <p>Every send writes a lead event with its Resend id, so completion can actually be read. Re-anchors to 7am each day rather than adding 24 hours, which is what made the Challenge&apos;s morning nudges drift into the afternoon. Re-reads the enrolment before each send, so an inactive enrolment stops the sequence mid-flight.</p>

            <p className="font-semibold text-[#141821] mt-4">The Body Decode feedback capture (24 Aug 2026)</p>
            <p>Two capture points inside The Body Decode, and they measure different things. <strong>Accuracy</strong> is captured directly under her read the moment she first sees it, on a 1-5 scale: did the diagnosis actually land? <strong>Recommendation</strong> is captured at the end of day 5 on a 0-10 scale, after the Blueprint card rather than before it. Both land in <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/dashboard/feedback</code> under moments <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">decode_read</code> and <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">decode_day5</code>. Read the low accuracy scores first: a read that misses tells you more than one that lands, and a high completion rate on a read that does not sound like her is a worse result than a low one. Consent emails are not automatic, so nothing is ever published without you sending the request yourself. Pull the whole cohort with <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">npx tsx --env-file=.env.local scripts/decode-cohort.ts --since 2026-09-01</code>.</p>

            <p className="font-semibold text-[#141821] mt-4">Body Decode Report Delivery + Follow-up Sequence (RETIRED 24 Aug 2026)</p>
            <p><strong>The $37 Body Decode Report is no longer sold, so this can no longer fire on a new purchase.</strong> The Body Decode (Funnel B Stage 1) gives every signup the same five-part read free on day 5, so the paid version was selling something she was about to be handed. Selling is closed at all three entry points. <strong>Delivery is deliberately still live</strong> — anyone who already bought keeps their report at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">app.bodyrecode.au/report/[token]</code>, and a session already in flight still completes. One tail remains: the live scorecard follow-up emails still link <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/get-report</code> and must be edited in the workflow UI, never re-seeded, because the live copy is newer than the code seed. That URL redirects to the scorecard meanwhile.</p>
            <div className="space-y-1">
              <SeqRow day="Immediate" label="Report delivery - unique link to their report at app.bodyrecode.au/report/[token]" />
              <SeqRow day="Day 2" label="Your report is the starting point - call as the next step" />
              <SeqRow day="Day 5" label="One thing worth noting about [body state]" />
              <SeqRow day="Day 10" label="Last one from me" />
            </div>

            <p className="font-semibold text-[#141821] mt-4">Zoom 1 Booking Confirmation (automatic)</p>
            <p>Fires automatically when a lead books via bodyrecode.au/book. No action required.</p>
            <div className="space-y-1">
              <SeqRow day="Immediate" label="Confirmation email with date, time, Zoom join link, and .ics calendar attachment" />
              <SeqRow day="2 hours before" label="Reminder - Zoom call is in 2 hours" />
              <SeqRow day="30 min before" label="Reminder - Zoom call is in 30 minutes" />
              <SeqRow day="Immediate (to you)" label="Coach notification with lead name, email, date/time, and Zoom link" />
            </div>

            <p className="font-semibold text-[#141821] mt-4">Zoom Booking Confirmation (you book it from the dashboard)</p>
            <p>Fires when you create a booking at Business → Bookings. The Zoom meeting is created for you, so you never write a link by hand. Since 6 Aug 2026 the confirmation also carries the pre-call form link, but <strong>only</strong> when the booking is for a lead who has not already completed it. Nothing renders for clients, or for anyone who has already filled it in. The 2 hour and 30 minute reminders deliberately leave it out, because they are scheduled the moment you book and their wording is frozen then, so they would nag someone who has since done it.</p>
            <div className="space-y-1">
              <SeqRow day="Immediate (to you)" label="Booking confirmed - name, type, date/time, calendar file" />
              <SeqRow day="Immediate" label="Your Zoom call is confirmed - date, time, join link, calendar file, plus the pre-call form if outstanding" />
              <SeqRow day="2 hours before" label="Reminder - Zoom call is in 2 hours" />
              <SeqRow day="30 min before" label="Reminder - Zoom call is in 30 minutes" />
            </div>

            <p className="font-semibold text-[#141821] mt-4">Rescheduling or cancelling a booking</p>
            <p>On the bookings list, <strong>Update → Reschedule</strong> moves a booking. It shifts the Zoom meeting itself without changing the join link, so any invite already sent keeps working, cancels the reminders that were queued for the old time, queues new ones, and emails them a corrected confirmation. The calendar file uses the same event ID at a higher version number, so their diary updates the existing entry rather than adding a second one. <strong>Cancel</strong> pulls the reminders out of the queue and deletes the Zoom meeting, but deliberately sends them nothing. Telling someone their call is off is a message you write yourself.</p>
            <Note><strong>One limitation you need to know about.</strong> Pulling a queued reminder back requires a Resend Full Access API key. The key currently in use can only send, so a cancellation is rejected and the old reminders will still fire at the original time. When that happens the dashboard shows an amber warning saying so, rather than letting it pass silently. Swapping <code>RESEND_API_KEY</code> for a Full Access key removes the limitation.</Note>

            <p className="font-semibold text-[#141821] mt-4">Dormant Lead Reactivation (you trigger it)</p>
            <p>For the leads who did a scorecard, gave you their details, and were never sent anything. There were 84 of them when this was built, 61% of the whole database, and they need no ad spend to reach.</p>
            <div className="space-y-1 mt-2">
              <SeqRow day="Immediately" label="Their read, written out in full. No button, the only ask is a reply" />
              <SeqRow day="+4 days, 7am" label="SMS - did the pattern sound right to you or not really?" />
              <SeqRow day="+6 days after" label="The state-matched next step as a self-serve link, then it stops" />
            </div>
            <p className="mt-2">Every step re-reads the lead first and stops if they have moved off &quot;new check-in&quot;, converted, or been marked inactive. So the moment someone replies and you pick them up, they stop getting the rest.</p>
            <Note><strong>Run the dry run before you send.</strong> <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">GET /api/admin/dormant-reactivation</code> shows exactly who would receive what, and who is excluded and why, without sending anything. Sending needs a POST with <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">?confirm=1</code>. Of the original 84: 8 were internal or test records including both of your own addresses, 13 had no body state so there was no read to send them, and 3 were inactive. 60 were sendable.</Note>

            <p className="font-semibold text-[#141821] mt-4">SMS send timing</p>
            <p>Lead-facing SMS only goes out between <strong>7am and 6pm Brisbane</strong>. Outside that the send is skipped and reported rather than going anyway. Before 12 Aug 2026 there was no guard at all, so a scorecard completed at 7pm produced a 7pm text.</p>
            <p className="mt-2">The Challenge SMS cadence re-anchors to 7am <strong>every day</strong>. It used to anchor once on day one and then add fixed 24 hour sleeps, so any delay pushed the whole sequence later and never corrected, and morning nudges drifted into the afternoon by the back half of someone&apos;s fourteen days.</p>
            <Note><strong>The three afternoon messages are deliberate.</strong> Day 5 (Week One session), Day 7 (Check-In) and Day 14 (Report) each send a second SMS about eight hours after the morning one. They double up the three moments that matter most. Do not remove them as drift.</Note>

            <p className="font-semibold text-[#141821] mt-4">Duplicate workflow protection</p>
            <p>If two active workflows ever share the same trigger and conditions, only the <strong>oldest</strong> one runs. The newer is skipped and logged, so nobody gets double-sent, and Business &rarr; Automations shows an amber panel naming which is running and which is being skipped. Added 12 Aug 2026 after a second scorecard sequence was created on launch day and double-sent to eight leads for a month with nothing on screen saying so.</p>

            <p className="font-semibold text-[#141821] mt-4">Custom Time Request + Pre-Call Form Chase (automatic)</p>
            <p>Fires when a lead asks for a specific time at bodyrecode.au/book rather than taking an offered slot. The confirmation they receive carries the <strong>only</strong> link to the pre-call form anywhere in the product, so whether it landed matters. Both immediate emails now write to the lead timeline with their Resend IDs — before 6 Aug 2026 neither was logged and there was no way to tell. Each nudge re-reads the timeline and stops the moment the form is completed.</p>
            <div className="space-y-1">
              <SeqRow day="Immediate (to you)" label="Custom time request - their preferred times, Reply-To set to the lead so you answer from your inbox" />
              <SeqRow day="Immediate" label="Got your time request - confirmation, plus the pre-call form link" />
              <SeqRow day="+24h, 7am" label="One thing before our call - nudge 1, only if the form is still outstanding" />
              <SeqRow day="+72h, 7am" label="Still need this before we talk - nudge 2, firmer" />
            </div>

            <p className="font-semibold text-[#141821] mt-4">No-Show Re-engagement Sequence (manual trigger)</p>
            <p>Does not fire automatically. To trigger it: set the lead status to <strong>Closed - No Show</strong>, save, then click <strong>Start Re-engagement Sequence</strong> on the lead detail page. The button only appears when the status is Closed - No Show.</p>
            <div className="space-y-1">
              <SeqRow day="Next morning 9am" label="Missed you - door left open, rebook when ready" />
              <SeqRow day="Day 4" label="Still here - patterns from your report worth talking through" />
              <SeqRow day="Day 10" label="Final - leaving the door open, no follow-up after this" />
            </div>

            <p className="font-semibold text-[#141821] mt-4">Zoom 1 Declined Follow-up Sequence (manual trigger)</p>
            <p>Does not fire automatically. To trigger it: set the lead status to <strong>Closed - Declined</strong>, save, then click <strong>Start Declined Follow-up</strong> on the lead detail page. The $97 self-guided program offer fires automatically as part of this sequence - no second action needed.</p>
            <div className="space-y-1">
              <SeqRow day="Next morning 9am" label="Good speaking - timing understood, door stays open" />
              <SeqRow day="Day 5" label="Still here if the timing changes" />
              <SeqRow day="Day 12" label="Last one from me" />
            </div>

            <p className="font-semibold text-[#141821] mt-4">Self-Guided Program Offer (automatic on decline)</p>
            <p>Fires automatically as part of the Zoom 1 Declined sequence above. Sends a branded offer email with a Stripe checkout link for the $97 12-week self-guided program tailored to the lead&apos;s body state. No separate action required.</p>

            <p className="font-semibold text-[#141821] mt-4">Self-Guided Program Delivery (automatic)</p>
            <p>Triggered by the Stripe webhook when a lead purchases the $97 program. Sends a delivery email with a unique token-gated link to their program at app.bodyrecode.au/program/[token]. You also receive a notification with a link to the lead profile.</p>

            <p className="font-semibold text-[#141821] mt-4">Program Buyer Nurture Sequence (automatic)</p>
            <p>Scheduled automatically at the moment of program purchase. Three emails spaced across the 12-week program to nurture buyers back toward a coaching conversation.</p>
            <div className="space-y-1">
              <SeqRow day="Week 4 (Day 28)" label="Four weeks in - Phase 1 check-in, soft coaching mention" />
              <SeqRow day="Week 8 (Day 56)" label="The compounding point - coaching makes the biggest difference here" />
              <SeqRow day="Week 12 (Day 84)" label="End of the program - what comes next?" />
            </div>

            <p className="font-semibold text-[#141821] mt-4">Welcome Email (Post-Conversion)</p>
            <p>Sent automatically when the Foundational Read is paid. Contains the client&apos;s intake link and coaching guide link. Triggered by the Stripe webhook.</p>

            <p className="font-semibold text-[#141821] mt-4">Client Onboarding Notifications (to you)</p>
            <p>You receive a notification email each time a client completes a step in their portal:</p>
            <div className="space-y-1">
              <SeqRow day="Step 1" label="Coaching Agreement signed - with client name and portal link" />
              <SeqRow day="Step 2" label="Health Declaration submitted - flags if medical clearance is required (client also receives an auto-email pointing them at the Medical Clearance card on their portal)" />
              <SeqRow day="Step 3" label="Foundational Intake submitted - with portal link" />
              <SeqRow day="Step 4" label="Baseline Documentation submitted - with portal link" />
            </div>

            <p className="font-semibold text-[#141821] mt-4">Health Markers — Blood Test Upload (client self-serve, coach-gated)</p>
            <p>Clients can upload a copy of their blood test results (PDF or photo) at any time from the <strong>Health Markers</strong> card on their portal landing page (<code>/portal/[token]/bloods</code>), with optional lab name, collection date, and a note. On upload, the system reads the file with a multimodal Claude call and <strong>transcribes every marker against the lab&apos;s own printed reference range</strong>, flagging anything the lab marked out of range as &quot;worth raising with your GP&quot;. You receive a notification email (subject: <em>&quot;[name] uploaded blood test results&quot;</em>) telling you how many markers were read.</p>
            <p>Review and act on the panel from the <strong>Health Markers</strong> section on the client profile (<code>/dashboard/clients/[id]#bloods</code>). Each uploaded panel is a card with the transcribed markers table, any lab-flagged values routed to the GP, and a row of actions that mirror the Medications Analysis flow: <strong>View file</strong> (10-minute signed URL to the original), <strong>Re-read file</strong> (re-run the transcription if the auto-read missed), <strong>Generate analysis</strong> (coach-facing structured read — what the markers mean for programming, nutrition, recovery, how they converge with the CFFS), <strong>Generate reading</strong> (client-facing four-section prose), <strong>Publish reading</strong> (surfaces it on the client&apos;s portal under Health Markers), and <strong>Approve for plan</strong>.</p>
            <p><strong>Approve for plan is the gate.</strong> Nothing a client uploads touches their plan until you click Approve for plan. Only an approved panel&apos;s markers inject into the next CFFS regeneration (which then propagates to the Foundational Reading, program, and nutrition exactly like the baseline-photo signal does). The most recently approved panel wins. After approving, click <strong>Regenerate CFFS</strong> to fold the markers in.</p>
            <p><strong>Non-diagnostic boundary.</strong> The whole feature reads bloods as one more coaching signal, never as a diagnosis. The system never names a disease, never tells a client to start/stop/change a medication, and never reinterprets the lab&apos;s reference ranges. Markedly out-of-range values are accounted for in the coaching <em>and</em> routed to the client&apos;s GP in both the coach analysis and the client reading.</p>

            <p className="font-semibold text-[#141821] mt-4">Research Lens (coach-only thinking tool)</p>
            <p>On each blood panel card there is a collapsible <strong>Research Lens</strong> block. Where the client-facing pipeline above is deliberately conservative (each marker flagged against the lab&apos;s own range, anything notable routed to the GP), the Research Lens reasons <em>across</em> markers using the contextual lipid model: derived ratios (non-HDL, remnant cholesterol, TG:HDL, HOMA-IR, ApoB:ApoA1) and a small set of named patterns (metabolic / insulin-resistance, lean-mass hyper-responder triad, particle discordance, high Lp(a), inflammation, unexplained elevated LDL/ApoB). For each pattern it gives you an observation, what additional test would clarify it, and the question worth taking to a clinician.</p>
            <p><strong>This is your private thinking tool, not a client feature.</strong> It is coach-only, badged <em>coach only · exploratory · not shared · not in the plan</em>, computed on demand and stored nowhere, and it never touches the client&apos;s reading, the CFFS, or the plan. Every output is framed as pattern + question, never a verdict, and always points to a clinician for the medical side. Clinical interpretation of bloods is a doctor&apos;s job (and Arete&apos;s lane), not coaching&apos;s, so do not paste Lens output to a client or treat it as a finding. It exists to sharpen what you watch in the coaching and what you suggest the client raise with their GP. Thresholds are sensible defaults to confirm, not validated clinical cutoffs. Markers it can&apos;t map (free-text lab names) are listed as unmapped rather than guessed.</p>

            <p className="font-semibold text-[#141821] mt-4">Weekly Check-In Window Open</p>
            <p>Sent automatically every Friday at 6pm Brisbane time to all active clients. Links to their portal at /portal/[token]. Triggered by a Vercel cron job.</p>

            <p className="font-semibold text-[#141821] mt-4">Weekly Check-In Confirmation (to client)</p>
            <p>Sent automatically when a client submits a check-in form. Dark-themed branded email confirming receipt.</p>

            <p className="font-semibold text-[#141821] mt-4">Weekly Check-In Notification (to you)</p>
            <p>Sent automatically when a client submits a check-in form. Includes the form type and a link to the client profile.</p>

            <p className="font-semibold text-[#141821] mt-4">Weekly Check-In Coach Feedback (manual — you trigger it)</p>
            <p>Open any submitted check-in at <code>/dashboard/clients/[id]/checkins/[week]/[form]</code>. The Coach response card has three fields you ship to the client: <strong>Interpretation</strong> (required — your read of the signal), <strong>Reframe</strong> (optional — for when the client is misreading their own pattern, e.g. bloating mistaken for weight gain), and <strong>This week, hold this</strong> (required — one anchor for the week). Click <strong>Save and email client</strong> to ship the dark-template email and stamp the feedback under the check-in on the client portal. The email BCCs you. Save without sending keeps it as a draft. Re-saving overwrites the prior feedback and re-sends the email. Today&apos;s Focus surfaces a <strong>Respond to Week N Form X check-in</strong> action for every check-in that has no coach response — teal up to 2 days old, amber from day 3 — so feedback can&apos;t silently slip.</p>
            <p><strong>Default view is the Past response card</strong>, not the editor. After your first save, the page loads showing what was sent (the same three sections the client sees in their portal) plus an <strong>Edit response</strong> link in the top-right. Click Edit to revise; Save flips back to the Past response view automatically. New check-ins with no feedback yet default straight to edit mode.</p>
            <p>Mirrors the CFFS / Foundational Reading / Program Reading / Nutrition Reading flow: click <strong>Generate response</strong> at the top of the editor and Claude drafts all three fields from the check-in plus the synthesis, the four most recent prior check-ins, the active program block, the active nutrition plan, the last three responses the client was sent, and intake context (medications + dietary). The draft populates the textareas; nothing is saved or sent until you click <strong>Save and email client</strong>. You are the approval gate. The generator auto-retries up to 3 times if the draft leaks any internal terminology (CFFS, spatial patterning, mid-arc, etc.) — you only ever see the clean result.</p>
            <p><strong>Add details for the AI (added 2026-08-17).</strong> Under the Generate button there is a free-text box for anything you know that the check-in does not show, or what you want the response to land on. Whatever you type is passed to the generator as the highest-priority instruction in the prompt: every point you raise has to be visibly addressed in the output, and if you name a domain or a focus, that becomes the <strong>This week, hold this</strong> anchor, overriding the model&apos;s own domain pick. It does not override voice discipline, the banned-terms list, or the prescription-grounding rules — if your steer conflicts with a prescribed number, the plan number wins and your intent carries in the wording. The box saves to <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">weekly_checkins.coach_draft_notes</code>, so it is still there when you come back or regenerate.</p>
            <p><strong>The draft now knows what the client is already under (added 2026-08-17).</strong> Three systems the response used to be blind to now reach the prompt. If RRS has the client in an active recovery state, the draft is told in plain terms what that envelope removes (sessions capped, load reduced, conditioning blocked, deficit blocked) and the anchor is forbidden from asking for anything the envelope has taken away. Previously the response could tell a client to hold all three sessions while the system had their training clamped. Assigned recovery protocols and assigned supplements are also passed in: the draft may reference something the client can already see in their portal, but may not introduce a new protocol or supplement, name a dose, or change one. Adding to those lists is your call on the dedicated surfaces.</p>
            <p><strong>No clock times (added 2026-08-17).</strong> The generator is never given the client&apos;s prescribed meal or session times, so any time of day it writes is invented. Amanda W12 drafted &quot;8am, 12:30pm, 3:30pm, 7pm&quot; against a plan holding no times at all, which she would reasonably have read as her schedule. Clock times are now banned in the prompt and caught by a post-generation scan that triggers the same auto-retry as a meal-count mismatch. The draft says &quot;at your set times&quot; instead.</p>
            <p><strong>Training is now in the draft (fixed 2026-08-17).</strong> The generator used to render only the reflective Form A / Form B sections into the prompt. The Training and Nutrition review blocks that were folded into the check-in on 2026-07-23 were never passed to the model, so every draft was written blind to whether the client trained, how it felt, and what they wrote in the training notes box. Combined with a nutrition plan that carried meal counts, protein and calorie bands while the program carried only a block name, the result was an eating anchor almost every week. Caught on Cristobal W6, whose last four anchors were the same four-meal instruction while he was telling us he was starting half marathon training. Three fixes: the training and nutrition answers now reach the prompt, the program block now carries prescribed sessions per week, session days, the conditioning prescription, sessions actually logged and the effort-drift read, and the prompt has a domain-selection rule that makes training, recovery, capacity, nutrition and alcohol equally eligible with nutrition explicitly barred from being the default.</p>
            <p><strong>Generation rubric (tightened 2026-06-08).</strong> The system prompt now encodes four locked rules from <code>[[feedback_weekly_checkin_voice]]</code> plus a mandatory six-question self-audit before returning JSON. Specifically:</p>
            <ul className="space-y-1 list-disc list-inside text-[#d4cfc9] text-sm">
              <li><strong>Trajectory-arc opener.</strong> When 3+ prior check-ins exist, interpretation MUST open with the numeric trajectory of the most-moved signal (e.g. &quot;your recovery rating has moved 4, 3, 3, 4, 4&quot;). The arc is the headline.</li>
              <li><strong>Quote the client&apos;s own language.</strong> At least one of the client&apos;s free-text answers gets surfaced verbatim in double-quotes inside interpretation. Don&apos;t paraphrase a meaningful sentence into your own vocabulary.</li>
              <li><strong>Reframe cross-check.</strong> Before returning <code>reframe: null</code>, the model walks every positive-looking current signal (&quot;rarely hungry&quot;, &quot;sessions easier&quot;, &quot;no discomfort&quot;, &quot;feels manageable&quot;) against the CFFS risk_flags. If a positive surface signal could ALSO be evidence of a CFFS-named risk re-surfacing, that&apos;s the reframe. Steady-week null is still allowed; conservative-pessimism null is not. Two worked examples are baked into the prompt (Ruby-Cate &quot;rarely hungry&quot; vs meal-skipping, and the original &quot;clothes don&apos;t fit&quot; vs digestive variability case).</li>
              <li><strong>next_focus prescribes against a CFFS-named risk.</strong> Never against a structural strength. If a signal has been consistent across 3+ check-ins (sleep that&apos;s been steady for 5 weeks, etc.) it is FORBIDDEN as a next_focus target. The anchor is a concrete behavioral move (&quot;hold X at Y times per day&quot;), not a passive watch.</li>
              <li><strong>Eating anchors are grounded in the active nutrition plan (2026-06-21).</strong> When next_focus prescribes a meal count, protein anchor, or any prescribed metric, the number must match <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">nutrition_plans.meal_frequency</code> / <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">protein_anchor_g</code> exactly. Pre-2026-06-21 the generator had no nutrition-plan awareness and Ruby-Cate W6 and W7 both produced &quot;three meals&quot; anchors against a 4-meal plan. The generator now loads the active plan and the system prompt forbids inventing meal counts. If no plan is on file, eating anchors are off the table entirely; pick a different lever.</li>
              <li><strong>Whole-picture interpretation (2026-08-17).</strong> The check-in captures five domains: recovery and sleep, capacity and load, training, nutrition, alcohol. Interpretation has to read the week across the ones that moved and the ones that held. If training answers exist and training is not mentioned, the draft fails the self-audit and gets rewritten. Training, sport or event prep the program does not prescribe (extra runs, a race, a second training system) must be named as load, because it changes what recovery and appetite mean that week.</li>
              <li><strong>Domain selection for the anchor (2026-08-17).</strong> The model picks the domain before it writes the anchor, on evidence: weakest signal or most-exposed risk. Nutrition is explicitly barred from being the default just because it has the most numbers attached, and if the last two anchors were in the same domain and that domain is not still plainly the weakest, it has to prescribe somewhere else. Training anchors (hold the prescribed sessions, protect the one that usually gets dropped, cap added outside-the-program work) are legitimate and count as concrete.</li>
              <li><strong>Session counts are grounded like meal counts (2026-08-17).</strong> Any session count in any field must match <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">programs.training_frequency</code> or what the client actually logged this block week. A mismatch triggers the same auto-retry as a meal-count mismatch. Sets, reps, loads, RPE values and exercise names stay banned — the anchor can say &quot;hold all three sessions&quot;, never &quot;drop the squat to 3 sets of 8&quot;.</li>
            </ul>
            <p>The prompt closes with an eleven-question self-audit the model must walk before returning JSON. If any check fails, it redrafts that field. This is what gets first-draft quality close to what a coach would write themselves, so licensees can send the AI draft without a Kade-grade revision pass.</p>

            <p className="font-semibold text-[#141821] mt-4">Auto-Response Pipeline (2026-06-15 — explicit approval gate)</p>
            <p>The Generate-then-Save manual flow is one valid path. By default, the system runs the auto-draft pipeline on every check-in submission, but as of 2026-06-15 the client never hears back until Kade approves the send.</p>
            <ol className="space-y-1 list-decimal list-inside text-[#43474F] text-sm">
              <li>Client submits Form A or B → <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">submit-weekly-checkin</code> route fires the Inngest event <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">weekly-checkin/submitted</code> with the check-in id.</li>
              <li>Auto-response worker waits 30 seconds (settle delay), then gates on: <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">clients.auto_checkin_response_enabled</code> (default true; per-client opt-out on the profile), <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">coach_skipped_at</code> not set, no existing feedback row (coach didn&apos;t beat the worker). <strong>Every gate exit stamps <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">weekly_checkins.auto_response_attempted_at</code> + <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">auto_response_failure_reason</code></strong> so silent drops are visible in the DB.</li>
              <li>Worker calls the shared <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">generateFeedbackDraft</code> helper (same path the manual Generate button uses). On a clean draft, it inserts the feedback row with <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">auto_generated_at</code> and a random <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">approval_token</code> (column default <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">gen_random_uuid()</code>).</li>
              <li><strong>Worker emails Kade an [Approve] preview</strong> containing the client&apos;s full check-in answers (organised by section) + the three-field AI draft + an <strong>Approve &amp; Send</strong> button pointing at <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">/api/coach/approve-checkin-response?token=…</code>. Best-effort: preview-send failures are logged but never abort the worker (feedback row + token still in DB; dashboard remains the fallback).</li>
              <li><strong>Kade clicks Approve &amp; Send.</strong> The endpoint loads the feedback by token, checks it isn&apos;t already sent and the check-in isn&apos;t skipped, sends the branded email to the client, BCCs <strong>{coach().email}</strong>, stamps <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">email_sent_at</code> + <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">coach_approved_at</code>, and logs to client_communications with meta <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">approved_via: &quot;email_button&quot;</code>. Returns a small branded confirmation page in the browser. Idempotent: clicking the link twice returns &quot;Already sent at …&quot;.</li>
              <li>The dashboard <em>Send now</em> button on the response form does the same delivery via the existing manual route. <em>Edit or skip</em> in the email links to the same dashboard view.</li>
              <li>If the AI generation failed (3 retries hit jargon leaks or another error), no feedback row is created. <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">weekly_checkins.auto_response_failure_reason</code> is stamped with the error. The check-in surfaces in Today&apos;s Focus as &quot;needs response&quot; and the response form shows an amber banner so you write manually.</li>
            </ol>
            <p><strong>No silent auto-send.</strong> Removed 2026-06-15. The previous 4h sleep-then-send step was retired in favour of the email-inbox gate. If Kade never clicks Approve and never goes to the dashboard, nothing is sent. The feedback row sits indefinitely and Today&apos;s Focus continues to surface the check-in.</p>
            <p><strong>Per-client opt-out.</strong> Toggle on the client profile, inside the Weekly Synthesis section: <em>Auto check-in response</em>. Default ON. Flip OFF for any client where you want a fully manual touch. When off, the worker exits at the eligibility gate without generating anything.</p>

            <p><strong>Rescue cron (2026-06-14).</strong> <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">/api/cron/weekly-checkin-auto-rescue</code> runs every 4h (<code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">0 */4 * * *</code>). Re-fires the <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">weekly-checkin/submitted</code> Inngest event for any check-in submitted &gt;6h ago where the auto-response pipeline never touched it (<code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">auto_response_attempted_at IS NULL</code> AND no feedback row AND client opted in). Backstop for transient Inngest delivery failures and silent function drops.</p>
            <p><strong>EMAIL_INVENTORY note:</strong> the client-facing feedback email itself (template + body + signature) is unchanged. The [Approve] preview email TO Kade is new (2026-06-15); see the Weekly Check-in Coach Feedback Approval Preview entry. Same Resend send path, same COACH_BCC on the client send, same client_communications kind <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">weekly_checkin_feedback</code>; approval-button sends are flagged in meta with <code className="bg-[#F4F6F9] px-1 rounded text-[#1B6DFC] text-[12.5px]">approved_via: &quot;email_button&quot;</code> for audit.</p>
            <p><strong>Skip without responding (2026-05-18).</strong> When you genuinely don&apos;t need to write a response for a given check-in (older one you&apos;ve already discussed in person, or one that doesn&apos;t warrant the formal response), click <strong>Skip without responding</strong> in the editor footer. You&apos;ll be prompted for an optional internal note. Skipped check-ins show a grey <em>Skipped</em> pill on the Recent Submissions list and are treated as resolved by the action-required logic — they will not trip the Weekly Synthesis attention pill or Today&apos;s Focus. Unskip from the skipped view if you change your mind. Skip is internal-only — the client portal renders nothing different for a skipped check-in.</p>
            <p><strong>Only the latest check-in triggers the &quot;needs response&quot; flag (2026-05-18).</strong> Older un-responded check-ins do NOT auto-trigger the Weekly Synthesis attention pill or Today&apos;s Focus row. This avoids historical backlog burying the current week&apos;s work. If you want to clear an older one explicitly, use Skip. The Coach Response History rollup still lists every response you&apos;ve sent regardless of age.</p>
            <p><strong>Coach Response History rollup</strong> lives on the client profile at <code>/dashboard/clients/[id]</code>, inside the Weekly Synthesis section. Newest-first list of every response you&apos;ve sent that client, each one a card with Week/Form header + sent date pill + Open-check-in link, with each of the three sections collapsed to a one-line preview by default (click Open per section to expand). The Recent Submissions rows above it show a <strong>Response sent</strong> (teal) or <strong>Draft</strong> (amber) pill so you can scan at-a-glance which check-ins have responses.</p>
            <p><strong>Client profile sections are now collapsible.</strong> The seven major blocks on <code>/dashboard/clients/[id]</code> (Foundational Synthesis, Baseline, Medications, Weekly Synthesis, Training Program, Nutrition Plan, Payments) collapse to single header rows on load. Sections with work for you to do open by default with an amber attention-pill in the header (e.g. <em>FR not published</em>, <em>Unanswered check-in</em>, <em>Draft awaiting review</em>); the rest stay closed. Right-side action buttons (Copy link, Macro Plan, Generate, Regenerate) stay in the header even when collapsed, so you can trigger them without first opening the section. Page-load state is not persisted — action-required sections will keep auto-opening until handled.</p>

            <p className="font-semibold text-[#141821] mt-4">Face-to-Face Session Booked (to client + to you)</p>
            <p>Sent when a client books a reschedule slot from their portal Sessions page. The client receives a branded confirmation with date, time, and duration. You receive a notification showing who booked and when.</p>

            <p className="font-semibold text-[#141821] mt-4">Coaching Start Reminder</p>
            <p>Sent automatically the day before a client&apos;s coaching start date. Triggered by a Vercel cron job that runs daily.</p>
          </Section>

          <Section id="communications" title="16. Communications Timeline" colour="teal">
            <p className="font-semibold text-[#141821]">Lead detail page, rebuilt 12 Aug 2026</p>
            <p>The lead page used to be one long scroll of fifteen panels, most of which were relevant a handful of times a year, with the two things you actually use before a call sitting near the bottom. It is now a <strong>command bar plus tabs</strong>.</p>
            <p className="mt-2">The command bar is always visible: name, status, lead quality, their score, state and pattern, click-to-copy email and phone, where they came from, the next booked call, and a Join Zoom button. If their pre-call form mentions anything outside your scope, an amber panel names it right there.</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-2">
              <li><strong>Brief</strong> - the Zoom pre-call read, plus the in-person supplement if you are running it at the gym instead. Built <em>live</em> from what is on file right now, not the snapshot stored at scorecard submit. That snapshot was written before their pre-call form arrived, so it could miss the most important thing they told you.</li>
              <li><strong>Their words</strong> - the pre-call form verbatim, anything they typed into the scorecard, and their Day 7 Check-In answers. Nothing paraphrased.</li>
              <li><strong>Timeline</strong> - every logged event, newest first.</li>
              <li><strong>Scorecard</strong> - score, sections, pattern and confidence, plus their Challenge progress.</li>
              <li><strong>Actions</strong> - booking, coaching entry, sequences.</li>
              <li><strong>Admin</strong> - contact, lead management, notes, danger zone.</li>
            </ul>
            <Note><strong>Scope flags.</strong> The brief scans their own words for things that sit outside S&amp;ES scope: GLP-1 agonists, thyroid conditions and medication, PCOS, HRT, corticosteroids, sleep apnoea, glucose diagnoses, mood medication, pregnancy, disordered eating signals, and shift work. Each one comes with what to do about it. It is deliberately crude and it is a prompt to ask and refer, never a conclusion. A false positive costs you one question. A miss costs a scope breach.</Note>

            <p className="font-semibold text-[#141821] mt-4">Communications</p>
            <p>The <strong>Timeline</strong> tab shows a reverse-chronological view of all outbound emails and events logged for that lead.</p>
            <p>Events logged automatically:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>Performance report scheduled</li>
              <li>Follow-up emails scheduled (Day 2, 5, 9) with subject lines</li>
              <li>Re-engagement blast sent</li>
              <li>Orientation guide sent</li>
              <li>Zoom booking confirmed (via Calendly)</li>
              <li>No-show sequence emails scheduled</li>
            </ul>

            <p className="font-semibold text-[#141821] mt-4">Client detail page</p>
            <p>Every client profile now has its own <strong>Communications</strong> panel directly under the Coaching Package card. It logs every email or SMS sent to that client, with the kind of message, the subject, the channel (Email/SMS), the recipient, and a clickable link if one was included.</p>
            <p>Events logged automatically:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>Subscription link sent (manual <em>Send to Client</em> or scheduled cron send)</li>
              <li>Portal access email</li>
              <li>Intake invitation</li>
              <li>Portal sign-in code (when the client requests one)</li>
              <li>Medical clearance required (sent the moment the health declaration flags it)</li>
              <li>Medical clearance approved</li>
              <li>Coaching start reminder (day before)</li>
              <li>Onboarding nudges (3 / 7 / 14 day)</li>
              <li>Session reminders (24h before)</li>
              <li>Check-in window opened and closing alerts (email and SMS)</li>
            </ul>
            <p>Each entry shows the kind of message, subject line, and a relative Brisbane timestamp (hover for the exact time). The panel shows the latest 15 entries and updates the moment a send fires.</p>
            <Note>Historical sends from before this feature shipped are best-effort backfilled from existing per-event timestamps (subscription link, portal email). Everything sent from now on is logged exactly as it goes out. To extend the log to a new email type, call <code className="text-[#1B6DFC]">logClientCommunication()</code> from <code className="text-[#1B6DFC]">@/lib/client-communications</code> alongside the <code className="text-[#1B6DFC]">resend.emails.send()</code> call.</Note>
          </Section>

          <Section id="assets" title="16b. Assets" colour="teal">
            <p>The <strong>Assets</strong> page (sidebar) is a central library of everything that goes out to leads and clients. Use it to review any asset before or after it is sent.</p>
            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">What is listed</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Body Decode Reports ($37 deliverable)</strong>. Depleted, Transitioning, and Ready. The $37 report a lead receives after purchase, rendered with sample data so you can preview each state.</li>
              <li><strong>Self-Guided Programs ($97 deliverable)</strong>. Depleted, Transitioning, and Ready. Click any to see the full 12-week program exactly as the client sees it at app.bodyrecode.au/program/[token].</li>
              <li><strong>Downsell Emails</strong>. Per state: the offer email (sent on Zoom decline) and the delivery email (sent after Stripe purchase). Both shown as rendered previews.</li>
              <li><strong>Client-Facing Pages</strong>. Scorecard, booking page, orientation guide, coaching guide. All open in a new tab.</li>
            </ul>
            <Note>Program preview pages use a placeholder name. The real program page is token-gated and personalised to the lead. To see a live example, find a lead who has purchased and click their program token on the lead detail page.</Note>
          </Section>

          <Section id="offboarding" title="16c. Ending an Engagement" colour="teal">
            <p>When a client stops, open them, go to the <strong>Admin</strong> tab and click <strong>Offboard</strong>. Pick a reason, write what actually happened, confirm.</p>

            <p className="font-semibold text-[#141821] mt-3">Revoke access, retain records</p>
            <p>Those are two different things. Offboarding closes their portal, rotates their link so old bookmarks stop working, bans their login, stops every automated email and suppresses their address. <strong>It deletes nothing.</strong> Their plans, readings, photos, messages and full history stay in their profile and you can still open all of it. Records are kept for five years.</p>

            <Note><strong>Do not use the Active toggle for this.</strong> Setting a client inactive does not close their portal and does not stop the automated emails. Eleven of the twelve scheduled jobs ignored it entirely, so a client you had &ldquo;deactivated&rdquo; would keep getting check-in reminders. The Offboard button is the one that works, and it is gated on <code>ended_at</code>.</Note>

            <p className="font-semibold text-[#141821] mt-3">The notes field matters more than the reason</p>
            <p>The reason code lets you count. The note lets you learn. Write what they said and what you would do differently, because in six months the code alone will tell you nothing.</p>

            <p className="font-semibold text-[#141821] mt-3">Reinstating</p>
            <p>Deliberately not a button, because offboarding rotates their token and suppresses their email and an undo control would invite treating it as a soft toggle. Bringing someone back means clearing <code>ended_at</code>, unbanning their login and lifting the suppression. Their plans are untouched, so nothing needs rebuilding.</p>

            <p className="font-semibold text-[#141821] mt-3">Retention</p>
            <p>Five years from the end date, set automatically. Nothing is ever deleted by the system: expired records are listed for you to review. Worth confirming five is the right number with whoever does your compliance, since this system holds diagnoses, medications, blood panels and body photographs, and several Australian jurisdictions use seven years for adult health records.</p>
          </Section>

          <Section id="publishing-readings" title="16d. Publishing Readings to a Client" colour="teal">
            <p>Generating a reading no longer publishes it. The Foundational, Program and Nutrition readings are <strong>drafts until you publish them</strong>, which is a separate click on each panel.</p>

            <Note><strong>Why this changed (2026-08-01).</strong> All three used to go live in the client portal the instant they were generated, which meant the first person to read a client&apos;s Foundational Reading was the client. One published asserting &ldquo;everything going on with your family&rdquo; about a client who had never mentioned family. She ended her engagement over it.</Note>

            <p className="font-semibold text-[#141821] mt-3">The publish check</p>
            <p>Publishing runs an automatic check and <strong>refuses</strong> if it finds either of these:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>A life circumstance the client never mentioned.</strong> Family, partner, children, caring for someone, a bereavement, a new job. If it is in the reading and nowhere in their intake, CFFS or your guidance, it will not publish. If they did mention it, it passes.</li>
              <li><strong>A claim that contradicts their live nutrition plan.</strong> Text saying you are not restricting calories while the plan runs a real deficit.</li>
            </ul>
            <p className="mt-2">It also warns, without blocking, when a stated number of weeks does not match the calendar.</p>
            <p>When it refuses, it quotes the offending sentence so you can find it. Edit that section or regenerate, then publish.</p>

            <Note><strong>This is not a review.</strong> It catches sentences that assert something your data contradicts or never contained. It cannot tell you whether a reading is any good. A clean check means nothing was caught, not that it is right. Read it before you publish.</Note>
          </Section>

          <Section id="admin-actions" title="17. Admin Actions" colour="teal">
            <p>The following actions are available on the <strong>Dashboard Homepage</strong>.</p>

            <p className="font-semibold text-[#141821] mt-2">Admin Actions panel</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Send preview email</strong> - Sends a sample re-engagement report email to {coach().email}. Use this to preview formatting and layout before running the blast.</li>
              <li><strong>Resend reports to all leads</strong> - Triggers the re-engagement blast. Cancels all existing follow-up sequences and sends a fresh re-engagement email plus a new 3-email follow-up sequence to every lead with scorecard data. Requires confirmation before firing.</li>
            </ul>
            <Note>The blast is protected by an admin secret and requires confirmation. It will not fire accidentally.</Note>
          </Section>

          <Section id="system-health" title="17b. System Health Check" colour="teal">
            <p>The platform runs an automated health check every morning and sends a report to {coach().email}. Every run is also saved and viewable at <strong>Setup → System</strong> in the sidebar.</p>

            <p className="font-semibold text-[#141821] mt-4">What it checks</p>
            <p>The check runs 19 tests across four groups every day:</p>

            <p className="font-semibold text-[#141821] mt-3">1. Infrastructure</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Database</strong> - confirms Supabase is connected and readable.</li>
              <li><strong>Booking Slots</strong> - confirms active availability rules exist and real time slots are showing for the next 7 days.</li>
              <li><strong>Zoom</strong> - performs a live credential check with the Zoom API to confirm meeting links will generate on booking.</li>
              <li><strong>Email (Resend)</strong> - confirms the email API key is present. Delivery is confirmed by receipt of the email itself.</li>
            </ul>

            <p className="font-semibold text-[#141821] mt-3">2. Write Smoke Tests</p>
            <p>These are the most important checks. Each one actually inserts a test record into the database and immediately deletes it. This is the only way to catch schema mismatches, constraint violations, and permission failures that a read-only check cannot detect. The booking bug of April 2026 - where every booking silently failed at the database level - is the canonical example of what these catch.</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Booking Write</strong> - inserts and deletes a test booking record.</li>
              <li><strong>Lead Write</strong> - inserts and deletes a test lead record.</li>
              <li><strong>Intake Invitation Write</strong> - inserts and deletes a test intake invitation.</li>
              <li><strong>Baseline Write</strong> - inserts and deletes a test baseline record.</li>
              <li><strong>Weekly Check-In Write</strong> - inserts and deletes a test check-in record.</li>
            </ul>

            <p className="font-semibold text-[#141821] mt-3">3. Data Integrity</p>
            <p>These audit the live state of real records to catch silent data gaps affecting real clients and leads right now.</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Clients - Intake Invitation</strong> - finds any client with portal access but no intake invitation. Without one, the intake form card in their portal shows &quot;Your coach will send this link when ready&quot; indefinitely.</li>
              <li><strong>Active Clients - Programs</strong> - finds any active client with no training program.</li>
              <li><strong>Active Clients - Nutrition</strong> - finds any active client with no nutrition plan.</li>
              <li><strong>Leads - Stuck Bookings</strong> - finds leads marked as zoom_1_booked for 7+ days with no Zoom date set.</li>
              <li><strong>Intake - Pending 10+ Days</strong> - finds clients who have not completed their intake form after 10 days.</li>
              <li><strong>Active Clients - Check-Ins</strong> - finds active clients with no check-in submitted in the last 14 days.</li>
            </ul>

            <p className="font-semibold text-[#141821] mt-3">4. Automation + Pipeline</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Scorecard Automation</strong> - verifies the 9-step follow-up sequence is active and intact.</li>
              <li><strong>Content Publishing Pulse</strong> - finds any BR IG post whose <code>scheduled_publish_at</code> is 30+ minutes in the past with no <code>posted_at</code>. Catches missed posts caused by Inngest cron pausing, an unsynced function in Inngest cloud, a Meta token failure, or an image-fetch error. Added 2026-07-03 after a 3-day silent outage where <code>ig-publisher-cron</code> had been deployed but never resynced in Inngest cloud, and 4 scheduled posts silently didn&apos;t ship.</li>
              <li><strong>Inngest Registration</strong> - fetches <code>/api/inngest</code> and confirms both event and signing keys are present + the <code>function_count</code> matches the expected number (currently 12). Catches code-side registration drops. Cloud-side sync drift is caught by Content Publishing Pulse as the symptom. Bump <code>EXPECTED_INNGEST_FUNCTION_COUNT</code> in <code>src/app/api/cron/daily-health-check/route.ts</code> every time a new <code>inngest.createFunction</code> is added.</li>
              <li><strong>Funnel Activity (24h)</strong> - reports how many scorecards were completed in the last 24 hours. Informational only.</li>
              <li><strong>Instagram Accounts</strong> - asks Meta which Instagram handle each brand actually resolves to, and how long each token has left. Added 24 Aug 2026 after four days in which every Body Recode post published to @kade_dunstone_: setting up personal-brand publishing pointed the account ID at the personal account and dropped the Body Recode Page from the app&apos;s permissions on the same afternoon. Nothing could see it, because the Meta variables are marked Sensitive and cannot be read back by anyone, including from the Vercel dashboard. It fails if a brand resolves to the wrong handle, or if a token is within 14 days of expiry, because these last about 60 days and when one lapses BOTH accounts simply stop publishing, which looks exactly like a quiet week. To check by hand at any time, open <code>/api/ig/accounts</code> while signed in.</li>
            </ul>

            <p className="font-semibold text-[#141821] mt-4">What it fixes automatically vs what needs you</p>
            <p>Only the Scorecard Automation check can auto-fix. If the workflow is missing it recreates it. If it is deactivated it reactivates it. If the step count is wrong it resyncs the steps. The email subject will say &quot;auto-fixed&quot; when this happens - no action needed from you.</p>
            <p className="mt-2">Everything else requires manual action. Any failed check in the email will include the exact step to fix it.</p>

            <p className="font-semibold text-[#141821] mt-4">Viewing run history</p>
            <p>Go to <strong>Dashboard → System</strong>. Every run is listed in the left sidebar by date with a colour-coded dot - green for all clear, amber for auto-fixed, red for failures needing attention. Click any run to see the full report broken down by section.</p>

            <p className="font-semibold text-[#141821] mt-4">Downloading a run as a file</p>
            <p>Open any run in Dashboard → System and click <strong>Download .md</strong> in the top right of the report. This saves a markdown file named <code>body-recode-health-YYYY-MM-DD.md</code> to your machine. Move it to Dropbox → 01_BODY_RECODE → 06_SAAS_PLATFORM_BUILD → SYSTEM-HEALTH-CHECK to keep a permanent record.</p>

            <Note>The health check runs on Vercel&apos;s servers and cannot write directly to your local Dropbox. The download button in the dashboard is the bridge - one click saves the file locally.</Note>
          </Section>

          <Section id="platform-buildout" title="17e. Platform Buildout (SaaS / white-label)" colour="teal">
            <p>Manifest-driven dashboard at <strong>Dashboard → Settings → Platform Buildout</strong> that shows every phase (0-4) of the powered-platform build, every step, current status, commit refs, and gaps. One place to answer &quot;where are we?&quot; without hunting through Dropbox docs, git history, and memory files.</p>

            <p className="font-semibold text-[#141821] mt-4">What each phase covers</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Phase 0 · Decide &amp; verify</strong> — pricing lock, founding-partner agreement, doctrine mode A confirmation, verify unknowns.</li>
              <li><strong>Phase 1 · Pilot-ready (hand-gloved)</strong> — Melisa onboarding as pilot zero with targeted branding override before the full de-hardcode.</li>
              <li><strong>Phase 2 · Product-ready</strong> — tenant_config + resolver + settings UI + de-hardcode + custom domains + per-tenant Resend wiring.</li>
              <li><strong>Phase 3 · Billing</strong> — Stripe Connect for tenant-side (their clients pay them) + Kade&apos;s separate billing of partners.</li>
              <li><strong>Phase 4 · Scale &amp; doctrine mode B</strong> — yoga modality, per-tenant doctrine parameters, method injection for the later-stage wave.</li>
            </ul>

            <p className="font-semibold text-[#141821] mt-4">How to read it</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Overall progress bar</strong> at the top: shipped / non-deferred steps.</li>
              <li><strong>Next up</strong> callout: the highest-priority actionable step (first in-progress step, else first planned step with no blockers).</li>
              <li><strong>Phase gate</strong> callout: appears when a phase is complete but the next hasn&apos;t started — a moment to review before absorbing the next phase&apos;s cost.</li>
              <li><strong>Per-phase progress bars</strong>: shipped / non-deferred count and %.</li>
              <li><strong>Step rows</strong>: status badge (Shipped / In progress / Planned / Blocked / Deferred), effort sizing (S/M/L), commit SHAs as chips, expandable Surfaces list of touched files.</li>
            </ul>

            <p className="font-semibold text-[#141821] mt-4">The Today runbook hook</p>
            <p>Dashboard → Today surfaces a <strong>🏗 SaaS buildout</strong> section when there&apos;s a next-up step or a phase gate to close. It hides when there&apos;s nothing actionable so it stays out of the way.</p>

            <p className="font-semibold text-[#141821] mt-4">Source of truth &amp; discipline</p>
            <p>The buildout lives in <code>src/lib/saas-buildout-manifest.ts</code>. Every commit that ships or changes state on a SaaS/white-label step MUST update the corresponding manifest entry in the same commit — bump <code>status</code>, add the commit SHA to <code>commits</code>, stamp <code>shippedAt</code> if now shipped. See <code>feedback_ship_checklist</code> auto-memory (updated 2026-07-03) for the enforcement rule.</p>
            <p>Strategic scope doc: <code>~/Dropbox/03_BODY_RECODE_COLLECTIVE/00_PARTNER_PROGRAMME/POWERED_PLATFORM_BUILD_PLAN.md</code>. Deployment runbook: <code>PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.md</code>.</p>
          </Section>

          <Section id="speed-to-lead-sms" title="17f. Speed-to-Lead SMS" colour="teal">
            <p>Contact-within-60s SMS on scorecard completion + challenge enrolment. Shipped 2026-07-03 (Hormozi speed-to-lead pattern). Every send is opt-in-checked, frequency-capped, and audit-logged - Aussie Spam Act 2003 compliant end to end.</p>

            <p className="font-semibold text-[#141821] mt-4">What triggers a send</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Scorecard completed</strong> - when the frontend POSTs <code>sms_opt_in: true</code> and a phone. Fires <code>scorecard/completed</code> in Inngest, sends within 60s (subject to send-window rules).</li>
              <li><strong>Challenge enrolled</strong> - challenge form has an opt-in checkbox pre-ticked. Uncheck to opt out. Fires <code>challenge/enrolled</code> and follows the same Inngest path.</li>
              <li><strong>Product waitlist joined</strong> - pre-launch waitlist form (WaitlistCTA) has the same opt-in checkbox. Fires <code>waitlist/joined</code> with the product name. Applies to challenge / blueprint / membership / extension waitlist paths.</li>
              <li><strong>Report purchase</strong> - Stripe webhook on <code>scorecard_report</code> checkout success fires <code>purchase/report</code>. SMS sends within 30s (anytime except overnight 22:00-06:00 AEST which queues to 08:30). Sunday OK - peak intent.</li>
              <li><strong>No-show reminder</strong> - when a coach confirms a Zoom booking with a lead, fires <code>booking/scheduled</code>. Inngest sleeps until scheduled + 30 min, then checks the lead's status. Sends SMS only if lead is still <code>zoom_1_booked</code> (coach has not marked completed/no-show/advanced).</li>
            </ul>

            <p className="font-semibold text-[#141821] mt-4">Send-window rules (AEST)</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Scorecard:</strong> Mon-Fri 08:30-20:00 + Sat 08:30-18:00. No Sunday.</li>
              <li><strong>Challenge:</strong> Mon-Sat 08:30-20:00. No Sunday.</li>
              <li><strong>Purchase:</strong> Anytime except 22:00-06:00 (queued to 08:30 next day). Sunday OK - peak intent.</li>
              <li><strong>No-show:</strong> Mon-Sat 08:30-20:00. Queued outside window.</li>
              <li>Outside window → sleep-until next window opening via <code>step.sleepUntil</code>.</li>
            </ul>

            <p className="font-semibold text-[#141821] mt-4">Send guards (enforced in <code>sendLeadSms</code>)</p>
            <ol className="space-y-1 list-decimal list-inside text-[#43474F] text-sm">
              <li>Lead has phone (<code>phone_e164</code> preferred, <code>phone</code> fallback).</li>
              <li><code>sms_opted_out_at IS NULL</code> - hard stop otherwise.</li>
              <li><code>sms_opt_in_at IS NOT NULL</code> - no send without express opt-in.</li>
              <li>Max 1 outbound per lead per 24h.</li>
              <li>Max 3 outbound per lead per rolling 7 days.</li>
            </ol>

            <p className="font-semibold text-[#141821] mt-4">STOP / opt-out</p>
            <p>Twilio inbound webhook at <code>/api/webhooks/twilio/inbound</code>. Recognises STOP, STOPALL, UNSUBSCRIBE, CANCEL, QUIT, END, REVOKE (case + punctuation insensitive). Sets <code>leads.sms_opted_out_at</code> + logs inbound + returns Twilio auto-forwarded confirmation. Non-STOP replies email you at your admin address with a deep link to the matched lead.</p>

            <p className="font-semibold text-[#141821] mt-4">Dashboard</p>
            <p>Live at <strong>Dashboard → Marketing → SMS Pulse</strong> (<code>/dashboard/sms</code>). Shows sent 24h / delivered 24h / failed 24h / inbound 24h / sent 7d / opt-outs 7d / consented leads / cost 7d, plus a live log of the last 30 messages with status, trigger, timestamp, and lead links.</p>

            <p className="font-semibold text-[#141821] mt-4">Canonical docs</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><code>~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/SMS_INVENTORY.md</code> - every outbound template + trigger + window rule. Ship-checklist artefact.</li>
              <li><code>sql/2026-07-03_speed_to_lead_sms_schema.sql</code> - schema for the two new columns on <code>leads</code> + the <code>sms_logs</code> audit table.</li>
              <li><code>src/lib/sms-send-window.ts</code> - window rules per trigger.</li>
              <li><code>src/lib/speed-to-lead-sms.ts</code> - send + logging + STOP/reply persistence.</li>
              <li><code>src/lib/sms-templates.ts</code> - copy. Tenant-aware via <code>coach()</code> / <code>brand()</code>.</li>
            </ul>

            <p className="font-semibold text-[#141821] mt-4">Tenancy note (SOT)</p>
            <p>Templates and copy already read from <code>coach()</code> / <code>brand()</code> so SOT partners get their own voice without rewriting anything. Per-tenant Twilio Subaccount routing shipped 2026-07-05: <code>licence.twilioSubaccountSid</code> + <code>licence.twilioMessagingServiceSid</code> if set send through the tenant&apos;s subaccount + AU number; otherwise falls back to Kade&apos;s platform Twilio.</p>
          </Section>

          <Section id="partner-billing" title="17g. Partner Billing (Kade's billing of the Collective)" colour="teal">
            <p>Kade&apos;s billing of Collective Partners (as distinct from tenants billing their own clients via Stripe Connect). Three-line commercial model per Collective Partner Agreement §6:</p>
            <ol className="space-y-1 list-decimal list-inside text-[#43474F] text-sm">
              <li><strong>Setup fee</strong> - one-time at Foundational Read. Launch $2,500 / Studio $6,000 at the founding rate (locked half-price).</li>
              <li><strong>Platform subscription</strong> - locked at founding rate for life. Launch $400/mo / Studio $600/mo.</li>
              <li><strong>Per Active Client</strong> - $20 per active client per month, billed in arrears.</li>
            </ol>

            <p className="font-semibold text-[#141821] mt-4">Dashboard</p>
            <p>Live at <strong>Dashboard → Settings → Partner billing</strong>. Kade-only. Summary tiles (partner count, MRR, active clients last month, per-client revenue last month) + per-partner card showing tier, locked setup + subscription, active clients this month, 6-month history table, deep links to Stripe customer + subscription in Kade&apos;s Stripe account.</p>

            <p className="font-semibold text-[#141821] mt-4">Active Client counter</p>
            <p>Inngest cron <code>partner-active-client-counter</code> fires monthly on the 1st at 08:00 AEST. For every tenant with <code>licence.partnerBilling</code> set, computes the previous month&apos;s Active Client count per Agreement §1 definition (distinct clients with a training plan or nutrition plan updated in the month, OR a weekly check-in submitted in the month). Upserts to <code>partner_active_client_counts</code>. Kade reads the numbers to invoice via Stripe dashboard.</p>

            <p className="font-semibold text-[#141821] mt-4">Invoicing (v1 is manual)</p>
            <p>Auto-invoicing via Stripe API is a v2 build. For v1, when a partner signs, Kade manually creates the Stripe Customer + Subscription in his own Stripe, writes the IDs to <code>licence.partnerBilling.customerId</code> + <code>subscriptionId</code>. Setup fee is a one-time invoice at signing. Monthly per-client fee is invoiced in arrears using the number the cron computed.</p>

            <p className="font-semibold text-[#141821] mt-4">Canonical files</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><code>sql/2026-07-05_partner_billing_schema.sql</code> - table schema</li>
              <li><code>src/lib/partner-billing.ts</code> - helpers (compute + persist + fetch history)</li>
              <li><code>src/app/dashboard/settings/partner-billing/page.tsx</code> - admin page</li>
              <li>Auto-memory <code>project_founding_partner_offer</code> - locked commercial numbers</li>
            </ul>
          </Section>

          <Section id="doctrine-parameters" title="17h. Doctrine Parameters (Mode A+)" colour="teal">
            <p>Middle ground between running BR&apos;s doctrine unchanged (Mode A) and injecting a partner&apos;s own method (Mode B, reserved for later-stage). Partners can tune tone, add partner-specific banned phrases, substitute terminology, and append coaching-style guidance to platform generators.</p>

            <p className="font-semibold text-[#141821] mt-4">What can be tuned (six parameters, all optional)</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>voiceTone</strong> - single line appended to system prompts (e.g. &quot;warm and grounded&quot;).</li>
              <li><strong>bannedPhrases</strong> - partner-specific banned phrases, added to the platform-wide banned list. Post-generation audit fails if any leak.</li>
              <li><strong>terminologySubstitutions</strong> - post-generation rewrites (e.g. &quot;winding down =&gt; settling&quot;).</li>
              <li><strong>checkinCoachingGuidance</strong> - partner-specific coaching philosophy appended to weekly check-in feedback prompt.</li>
              <li><strong>programGenerationGuidance</strong> - appended to program generation prompt (frequency, structure, session emphasis).</li>
              <li><strong>nutritionGenerationGuidance</strong> - appended to nutrition plan generation prompt (food philosophy, cultural context).</li>
            </ul>

            <p className="font-semibold text-[#141821] mt-4">What can NOT be tuned</p>
            <p>Hard Safety Floors remain immutable per Collective Partner Agreement §7 and IP Licence Deed clause 4.1(h): RRS clamps, Fat Map training limits, injury contraindications, eligibility floors, minimum-calorie floors, platform-wide banned client-terms. The Mode A+ surface can only ADD guidance, never bypass safety.</p>

            <p className="font-semibold text-[#141821] mt-4">Editing</p>
            <p>Live at <strong>Dashboard → Settings → Tenant configuration → Doctrine parameters (Mode A+)</strong>. Each coach edits their own via the tenant-scoped form. Save posts to <code>/api/tenant/update</code> with <code>section: &apos;licence&apos;</code> and a <code>doctrineParameters</code> patch. Cache invalidates on save; generators read new values on their next call.</p>

            <p className="font-semibold text-[#141821] mt-4">Consumption (v1 surface, v2 wiring)</p>
            <p>v1 delivers the storage + editor. Generator consumption is incremental: each generator that reads a parameter imports the relevant accessor from <code>src/lib/doctrine-parameters.ts</code> (<code>partnerVoiceTone()</code>, <code>partnerBannedPhrases()</code>, <code>applyPartnerTerminology(text)</code>, etc.). As we refactor nutrition + program + check-in generators, they pick up the tenant&apos;s parameters automatically.</p>
          </Section>

          <Section id="licensee-readiness" title="17d. Licensee Readiness: Audits + Versioning + Validators" colour="teal">
            <p>Ruby-Cate&apos;s nutrition plan audit (2026-06-09) surfaced a class of error that&apos;s critical for licensing: AI-generated artefacts that look plausible but were produced under doctrine versions that no longer reflect the current rules. Her published Foundational Reading contained &quot;mid-arc compression&quot; and &quot;sympathetic dominance&quot;, her Nutrition Reading contained &quot;downregulating&quot; three times and &quot;wired-but-tired&quot;, and her substitution list claimed &quot;100g dry rice ↔ 150g raw potato — equal carb substitution&quot; (3x off). All banned in weekly-check-in feedback for a month, but never enforced on FR/PR/NR because each generator carried its own ad-hoc list.</p>
            <p>Five system changes shipped 2026-06-09 to close this gap:</p>

            <p className="font-semibold text-[#141821] mt-4">1. Shared banned-terms constant (item B)</p>
            <p>All client-facing generators now import the same regex list from <code>src/lib/banned-client-terms.ts</code>. The Foundational Reading, Program Reading, Nutrition Reading, and Trajectory Reading generators each run <code>findLeakedTerms</code> on their JSON output before persisting. If any banned term appears (CFFS, CFWS, mid-arc, spatial patterning, downregulate, sympathetic dominance, etc.), the API returns a 500 and the coach is prompted to Regenerate. Single source of truth means adding a new banned term in one place blocks it across every generator.</p>

            <p className="font-semibold text-[#141821] mt-4">2. Backfill audit dashboard (item A)</p>
            <p>New panel at <code>/dashboard/system-health/banned-terms-audit</code>. Scans every active client&apos;s published FR / PR / NR against the shared banned-terms list AND against the current doctrine version. Shows: leak rate (red &gt;30%, amber &gt;10%, green &le;10%) + per-client cards listing every leaked or stale artefact with the specific banned terms found + the publish date + a deep-link &quot;Open to regenerate&quot;. As of 2026-06-09, leak rate across active clients is 44% (8 of 18 published artefacts) — the dashboard makes the staleness visible so regenerates can be prioritised.</p>

            <p className="font-semibold text-[#141821] mt-4">3. Doctrine version stamps everywhere (item D)</p>
            <p>Every AI-generated artefact now stamps the doctrine version that produced it onto its DB row. New columns: <code>cffs.fr_doctrine_version</code>, <code>programs.pr_doctrine_version</code> / <code>tr_doctrine_version</code>, <code>nutrition_plans.doctrine_version</code> (pre-existing), <code>weekly_checkin_feedback.doctrine_version</code>, <code>clients.medications_*_doctrine_version</code>, <code>blood_panels.*_doctrine_version</code>. Constants single-source at <code>src/lib/doctrine-versions.ts</code> — bump when shipping a generator change. <code>isDoctrineStale(stored, key)</code> compares stored stamp to current. The audit dashboard shows BOTH leak status (amber) AND stale-doctrine status (blue) per artefact.</p>

            <p className="font-semibold text-[#141821] mt-4">4. Food reference table (item C)</p>
            <p>22 staple foods with per-gram macros at <code>src/lib/food-reference.ts</code>. Covers Tier 1 + Tier 2 of the nutrition prompt&apos;s allowed list (chicken breast/thigh, beef mince 5%/15%, sirloin, salmon, cod, mackerel, trout, tuna, eggs, white/sweet potato, white rice dry+cooked, sourdough, banana, berries, melon, honey, ghee, tallow, olive oil, butter, avocado oil). Helpers: <code>lookupFood(name)</code>, <code>validateSubstitutions(original, subs)</code>, <code>parseSubstitutionLine(line)</code>.</p>

            <p className="font-semibold text-[#141821] mt-4">5. Substitution-equivalence validator wired in (item E)</p>
            <p><code>validateNutritionPlan</code> now runs <code>validateSubstitutionOptions</code> against the food-reference table. Three new issue codes: <code>SUBSTITUTION_MACRO_DRIFT</code> (a labelled-equivalent swap drifts &gt;20% on a macro or &gt;15% on kcal), <code>SUBSTITUTION_UNPARSED</code> (line doesn&apos;t match the expected shape), <code>SUBSTITUTION_UNKNOWN_FOOD</code> (food outside the reference table). On a fresh nutrition generation, a swap-math failure feeds back into the existing one-shot retry loop the same way safety-floor failures do — model gets the specific drift named and tries again. Stops Ruby-Cate-style errors at generation time.</p>

            <p className="font-semibold text-[#141821] mt-4">6. Pre-publish audit pill on the client profile (item H)</p>
            <p>Every Foundational Reading / Program Reading / Nutrition Plan section header on the client profile now shows a green / amber / red pill: <strong>green</strong> = audit passes, <strong>amber</strong> = review (stale doctrine version or validator warnings), <strong>red</strong> = regenerate (banned terms leaked or blocking validator errors). Click the pill to expand and see the specific failures (which banned terms, which validator codes, which doctrine version mismatch). All checks happen server-side at page render so there&apos;s no client-side latency.</p>

            <p className="font-semibold text-[#141821] mt-4">7. Doctrine version coverage summary (item G)</p>
            <p>The audit dashboard at <code>/dashboard/system-health/banned-terms-audit</code> now opens with a &quot;Doctrine version coverage&quot; card per doctrine key (Foundational, Program, Nutrition). Shows current version + count on current + count stale. A bump of any constant in <code>src/lib/doctrine-versions.ts</code> renders all rows on the old version stale, and the count updates on next page load. Makes the bump impact visible without operational complexity.</p>

            <p className="font-semibold text-[#141821] mt-4">8. Versioned change log per client (item I)</p>
            <p>Every regenerate of FR / PR / NR snapshots the previous content into <code>artefact_version_archive</code> BEFORE the new version overwrites the live row. Schema applied 2026-06-09. Captures: artefact_type, source_row_id, doctrine_version it was generated under, full content as JSONB, generated_at, archived_at, archived_by (coach user id), archive_reason (optional). Best-effort archive (errors logged, never thrown) so a transient failure can&apos;t block a regenerate. Dashboard diff view is queued as a polish step; the data layer is queryable today.</p>

            <p className="font-semibold text-[#141821] mt-4">What&apos;s still queued</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>(F) Rule contradiction detector</strong> — machine-check execution rules against listed foods. Deferred per original strategy.</li>
              <li><strong>Diff UI on the change log</strong> — dashboard view to select two archived versions and see side-by-side. Schema is in place; UI is next polish step.</li>
            </ul>
          </Section>

          <Section id="onboarding-nudges" title="17c. Onboarding Nudges and Form Drafts" colour="teal">
            <p>Two systems work together to keep clients moving through onboarding without you having to chase them manually.</p>

            <p className="font-semibold text-[#141821] mt-4">Form drafts - clients can resume mid-form</p>
            <p>Every long form in the portal saves the client&apos;s answers to their browser as they go. If they close the tab or come back two days later, their progress is restored - they pick up where they left off, not from the start. This applies to:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>Foundational Intake (230 questions)</li>
              <li>Health Declaration (40+ fields)</li>
              <li>Baseline Documentation (measurements only - photos must be re-picked, browser security)</li>
              <li>Weekly Check-In (Form A and Form B independently)</li>
              <li>Training Review</li>
              <li>Nutrition Review</li>
            </ul>
            <p className="mt-2">Drafts auto-clear on successful submit. They&apos;re browser-local - same device works seamlessly, but if a client switches from phone to laptop they&apos;ll start fresh on the new device.</p>

            <p className="font-semibold text-[#141821] mt-4">Automated reminder emails</p>
            <p>A daily cron at 7am Brisbane checks every active client&apos;s onboarding tasks and sends a branded reminder email if a task has been outstanding for 3, 7, or 14 days. Each (task, threshold) pair fires once per client - no spam.</p>

            <p className="font-semibold text-[#141821] mt-3">Tasks tracked</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>Coaching Agreement</li>
              <li>Health Declaration</li>
              <li>Medical Clearance <em>(only when the health declaration flagged clearance as required, and only until the client uploads the signed form)</em></li>
              <li>Foundational Intake</li>
              <li>Baseline Documentation</li>
            </ul>

            <p className="font-semibold text-[#141821] mt-3">Reminder cadence</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Day 3</strong> - gentle nudge: &quot;pick up where you left off&quot;</li>
              <li><strong>Day 7</strong> - stronger: &quot;still pending - we need this to keep your coaching on track&quot;</li>
              <li><strong>Day 14</strong> - final: &quot;last automated reminder - let me know if you&apos;ve changed your mind&quot;</li>
            </ul>
            <p className="mt-2">&quot;Days since&quot; is counted from when the task became <em>available</em> (i.e., when the previous step was completed), not from when the client was created. So a client who finishes their agreement quickly but stalls on intake gets reminded based on time since the agreement was signed.</p>

            <p className="font-semibold text-[#141821] mt-3">Medical Clearance gating</p>
            <p>When a client&apos;s health declaration flags Medical Clearance as required, the cron behaves as follows:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Foundational Intake reminders are paused</strong> while clearance is outstanding. The portal blocks intake behind clearance, so nudging the client to finish intake would just frustrate them. Once you approve clearance, the 3/7/14 day intake countdown starts fresh from the approval timestamp.</li>
              <li><strong>Medical Clearance reminders fire instead.</strong> Same 3/7/14 cadence, counted from when the health declaration was submitted. The copy is tailored to clearance (it acknowledges they need a GP visit, not a few-minute portal task).</li>
              <li><strong>Clearance reminders stop the moment the client uploads the signed form.</strong> At that point the ball is in your court for approval, so further nudges to the client would be wrong.</li>
            </ul>

            <p className="font-semibold text-[#141821] mt-4">What you see vs what gets tracked</p>
            <p>Every reminder sent is recorded in <code>clients.onboarding_reminders_sent</code> as a JSON map of <code>task_threshold → timestamp</code>. To check if a client has been reminded, look at the client record in Supabase. The cron skips any client where the relevant reminder has already been logged.</p>

            <Note>If you want to re-send a reminder for testing, clear the relevant key from the client&apos;s <code>onboarding_reminders_sent</code> JSON in Supabase - the cron will pick them up on the next run.</Note>
          </Section>

          <Section id="stripe-payments" title="19. Stripe Payments" colour="teal">
            <p>Three payment links are used in the coaching entry process:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Foundational Read - $297</strong> - Generated uniquely per lead. Triggers automatic client creation when paid.</li>
              <li><strong>In-Person 1x + self-led - $139/week</strong> - Standard entry package. Send after the Foundational Read is confirmed.</li>
              <li><strong>In-Person 2x - $189/week</strong> - For someone who wants more contact.</li>
              <li><strong>In-Person 3x - $225/week</strong> - Coach-assessed upgrade, offered during weekly check-ins not on the Zoom.</li>
              <li><strong>Online - $69/week</strong> - No in-person sessions. Also the fallback if a lead objects to in-person pricing.</li>
            </ul>
            <p>All four were repriced on 26 Aug 2026 and new Stripe payment links were created the same day, against the same Stripe products as the old prices so your reporting stays continuous. The old links still exist and still charge the old amounts - do not send them. <strong>GST is off on everything</strong> (set 26 Aug 2026). It had been switched on for the online and 3x links and for one live subscription, which was an accident of setup rather than a decision. No GST was ever actually charged, but the flag would have started applying the moment a tax registration was added in Stripe. All 16 payment links and all 3 active subscriptions are now off. Revisit this if turnover crosses the $75k GST registration threshold.</p>
            <p>Payment links for the weekly subscription are available in the Zoom companion Stage 8 Decision panel.</p>
            <Note>Always send the Foundational Read first. Coaching does not start until both the Foundational Read and the first weekly subscription payment are received.</Note>
          </Section>

          {/* Training Program - PTS */}
          <Section id="training-program" title="20. Training Program - PTS (Performance Training System)" colour="teal">
            <p>The Training Program section lives on each client profile. It uses the Body Recode™ PTS doctrine and Claude AI to generate structured training programs from your client&apos;s CFFS, intake, and training history. Programs follow the full 9-stage generation pipeline and all doctrine constraints are enforced automatically.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Single entry point — programs always start from a macro-plan block</p>
            <p>Programs are generated from a meso block in the client&apos;s macro plan. There is one entry: <strong>Generate program →</strong> on the relevant block in the Macro Plan editor. Old &quot;Generate Program&quot; buttons on the main client page and program page are gone — they routed bypassing the macro plan and produced free-form prescriptions without arc context. Hitting <code>/program/suggest</code> directly without a <code>plan_block_id</code> now redirects to the macro plan as defence-in-depth.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">The Generation Flow</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Step 1 - Open the Macro Plan.</strong> Hit Generate program → on the meso block you want to build. The page reads the block&apos;s phase, goal, duration, and coach-set frequency as authoritative.</li>
              <li><strong>Step 2 - Prescription Suggestion.</strong> The system reads the client&apos;s CFFS, intake JSONB blobs (training_responses, sleep_responses, stress_responses, fat_map_responses), bodyweight from baseline, medications if set, injury context, and training history. It produces a suggested prescription - block name, phase, goal, frequency, training age, movement competency, duration - with reasoning. Review and edit before generating. Claude&apos;s frequency is overridden deterministically if the macro plan&apos;s training_frequency differs.</li>
              <li><strong>Step 3 - Approve &amp; Generate.</strong> Confirm equipment access, adjust any fields if needed, then click Approve &amp; Generate Program. Claude Haiku 4.5 generates the full program (~30 seconds). Saved as draft.</li>
              <li><strong>Step 4 - Draft Review.</strong> The full draft renders with Discard and Approve Program buttons. Review sessions, blocks, exercises, weekly structure, progression strategy.</li>
              <li><strong>Step 5 - Approve Program.</strong> Promote the draft to active. The draft replaces any previously active program. Previous programs are retained as archived history.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Training Age Modulation (CRITICAL)</p>
            <p>Restoration phase intent (recovery-protective, no PRs, no novel high-CNS lifts) is constant — but the THRESHOLD of &quot;sub-maximal&quot; scales with training age. Get this wrong and an advanced trainer will detrain inside 2 weeks AND quit.</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Beginner / developing:</strong> RPE ceiling 5–6, 6–9 sets/session, machines + supported only.</li>
              <li><strong>Intermediate:</strong> Restoration RPE 7, Accumulation 7–8, 9–12 sets/session, mixed machine/free-weight.</li>
              <li><strong>Advanced / proficient:</strong> Restoration RPE 7–8, Accumulation 8, 12–16 sets/session, free-weight emphasis. Below RPE 6 / 12 sets they detrain. The recovery-protective intent comes from skeleton + axial avoidance + no PRs, NOT from gutting load.</li>
            </ul>
            <p>If training age is ambiguous: the doctrine defaults UPWARD (cost of detraining is higher than cost of one heavier session).</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Medications Modulation</p>
            <p>The <strong>Medications</strong> card on the client profile (the field formerly called &quot;Hormonal Support&quot;) is now the canonical capture for ALL pharmacological context, not just hormonal-class drugs. When populated, the engine reads it for two distinct rule sets.</p>
            <p className="text-[12.5px] font-medium text-[#666D7A] mt-3 mb-1">Hormonal-class (enforced deterministically by the doctrine clamp)</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>TRT / exogenous testosterone:</strong> training-age tolerance treated as +1 step (intermediate → close to advanced thresholds).</li>
              <li><strong>Supraphysiological androgens:</strong> primary RPE ceiling 8 in any non-Restoration phase, 7–8 in Restoration; volume at upper bound; recovery debt accrues more slowly.</li>
              <li><strong>GLP-1 in deficit:</strong> protein anchor floor 2.0g/kg minimum (preserve LBM); training prescription does NOT scale up because energy availability is constrained.</li>
            </ul>
            <p className="text-[12.5px] font-medium text-[#666D7A] mt-3 mb-1">Non-hormonal categories (applied by the engine during generation, surfaced in weekly_pattern_summary)</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Beta-blockers</strong> (metoprolol, bisoprolol, propranolol, atenolol): HR signals blunted. RPE is the only reliable load gauge; conditioning anchors to pace, breath, perceived exertion.</li>
              <li><strong>SSRIs / SNRIs</strong> (sertraline, escitalopram, venlafaxine, duloxetine): affect signal in check-ins may be flat, HRV often suppressed. Trust performance and consistency over reported mood / HRV trends.</li>
              <li><strong>Stimulants</strong> (ADHD meds: methylphenidate, amphetamine derivatives): elevated baseline HR, fatigue masked. Apply slightly more conservative recovery margins; avoid the upper bound on subjective tolerance alone.</li>
              <li><strong>Chronic NSAIDs</strong> (daily ibuprofen, naproxen, diclofenac): blunt hypertrophic adaptation, may mask warning pain. Do not stack volume to compensate; prefer exposure-graded progression.</li>
              <li><strong>Anticoagulants</strong> (warfarin, apixaban, rivaroxaban, dabigatran): contact and impact avoided. Default to controlled machine and cable work; no ballistic, no plyometric.</li>
              <li><strong>Corticosteroids</strong> (oral / sustained prednisone, prednisolone, dexamethasone): connective tissue tolerance compromised. Reduce eccentric demand, prioritise tissue-tolerant patterns. Fluid retention may distort bodyweight readings.</li>
              <li><strong>Statins:</strong> small risk of myalgia. New muscle soreness inconsistent with prescribed work gets flagged rather than progressed through.</li>
              <li><strong>Combined contraceptives / HRT in females:</strong> cycle interpretation may be exogenous-driven; treat &quot;cycle phase&quot; signals in CFFS with caution.</li>
            </ul>
            <p>These modulators don&apos;t bypass readiness gates (Red regulation still requires Restoration intent). They calibrate the threshold inside the chosen phase. CFFS generation also reads the Medications field at intake time so pattern interpretation factors it in (e.g. a low resting HR on a beta-blocker is pharmacological, not parasympathetic tone). Coach edits to the field after intake also flow into program + nutrition regenerations via the staleness banner on the card.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Program Structure</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>01 Weekly Structure</strong> - Explains the program design logic: why each skeleton was chosen, what patterns are in each session, and what constraints were applied (injury, readiness flags, RPE ceilings, eligibility level).</li>
              <li><strong>02 Progression Strategy</strong> - Week-by-week progression instructions. Permission-based only - each week&apos;s progression is conditional on the client tolerating the previous week cleanly.</li>
              <li><strong>Sessions</strong> - Each session has a Movement Preparation entry (non-slot, always first), then blocks A through D. Each exercise shows sets × reps, RPE, rest, and coaching notes.</li>
            </ul>

            <Note>Programs follow doctrine exactly - one PTS phase only, no cross-phase blending, exercise selection from the approved library only, skeleton structure fixed, fatigue adjustments on execution variables only.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Step 5 - Weekly Review (Client Portal)</p>
            <p>The weekly training review is submitted by the client through their portal. The client reports whether they completed their sessions, how training felt (one or more signals), the overall direction, and optional notes. You see the answers as a question/answer feed on the Training Program page.</p>
            <p className="mt-2"><strong>How training felt signals:</strong> Feeling stronger / Struggling with sessions / No change / Recovering poorly / Ticking along. Clients can select multiple.</p>
            <p className="mt-2"><strong>Direction labels - what they mean and what to do:</strong></p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li><strong className="text-green-400">Making progress</strong> - sessions are going well, client is adapting. No action needed. Continue the current program.</li>
              <li><strong className="text-[#A96A12]">Staying steady</strong> - no notable change, client is maintaining. Monitor for a week or two before acting. Consider whether progression variables can be nudged.</li>
              <li><strong className="text-[#C82626]">Struggling</strong> - client is finding sessions hard, energy low, or performance dropping. Action required. A red banner will appear on the Training Program page. Review the check-in notes, write coach feedback for the client, and consider adjusting the program or generating a new block. When you regenerate, the AI will see this history and prescribe accordingly.</li>
            </ul>
            <p className="mt-2"><strong>Coach notes:</strong> After reviewing, click <strong>+ Add feedback for client</strong> under any review entry to write a note. This note appears on the client&apos;s portal home page under &quot;From your coach&quot;. Only the most recent note with content is shown to the client.</p>

            <Training title="How to read the prescription suggestion">
              <p>The suggestion is not a recommendation to accept blindly. It is the system&apos;s read of the client&apos;s current state based on available data. Read each reasoning note - if your coaching judgement disagrees with the reasoning, edit the field. The system explains its logic so you can interrogate it, not so you can skip the thinking.</p>
              <p className="mt-2">Movement competency in particular requires your direct assessment. The system defaults conservatively when no data is available - correct it if you know the client&apos;s actual movement capacity from in-person sessions.</p>
            </Training>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-6 mb-2">Programs Index (On the Floor View)</p>
            <p>Top nav <strong>Programs</strong> (or <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">⌘K → Programs</code>) opens the floor view: every active client&apos;s current training block in a single mobile-first card grid. One tap on a card opens that client&apos;s training program page.</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm mt-2">
              <li>Each card shows the client&apos;s package (face-to-face vs online), current block name, week number, progression phase, training goal, and current direction (On Track / Hold / Rebuild / Deload).</li>
              <li>Cards are sorted with face-to-face clients first - the ones most likely to be on the gym floor today.</li>
              <li>Filters: <strong>All</strong> · <strong>Face-to-Face</strong> · <strong>Online</strong> · <strong>No Program</strong> (active clients with no current block - tap to open their macro plan and build one).</li>
              <li>Search by name for instant filtering.</li>
              <li>Use this on your phone during in-person sessions instead of digging through Coaching → client → Training Program.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Deleting plans</p>
            <p>The training program page now has a <strong>Delete Active Program</strong> button next to the Macro Plan link, and the nutrition plan page has the same for the active nutrition plan. Each archived entry in the Previous Programs / Previous Plans list also has its own Delete. Deleting an active plan permanently removes it and its weekly reviews - use it when the plan was generated against incomplete inputs (e.g. before a baseline submission) and needs to be regenerated cleanly.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Workout logging (Phase A)</p>
            <p>Clients can now log what they actually lifted, set by set, live in the gym. The flow:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>Client opens <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/portal/&#123;token&#125;/program</code> and taps the new <strong>Log a session →</strong> button.</li>
              <li>The log index lists all of this week&apos;s prescribed sessions. Today&apos;s session (matching the day of week) is highlighted at the top with a teal CTA.</li>
              <li>Tapping <strong>Start logging</strong> opens the live UI: each prescribed exercise as a card, with set rows for weight × reps × RPE. Tap ✓ to commit each set. Saves are upserts — re-tapping updates the row in place.</li>
              <li>Per-exercise notes saved on blur. Substitution toggle: client picks a swap (&quot;did goblet squat instead of back squat&quot;) and a reason. The log captures both prescribed and actually-performed.</li>
              <li>Session-level notes textarea at the bottom. <strong>Mark session complete</strong> button finalises and routes back to the index.</li>
              <li><strong>Rest timer</strong> (added 2026-07-23): a bar fixed to the bottom of the logging screen. It auto-starts with the exercise&apos;s prescribed rest the moment the client taps ✓ to commit a set, or they can tap a preset (1:00 / 1:30 / 2:00 / 3:00). Counts down with a progress bar, ±15s, pause/resume and skip, and beeps + vibrates at zero. Purely on the client&apos;s device — nothing is stored.</li>
              <li><strong>Logging carrot</strong> (added 2026-07-23): mechanics that make logging pay the client back, so they keep doing it. (1) <strong>Last time</strong> — each exercise shows what they lifted last session (&quot;Last time: 60 × 8, 60 × 8 · yesterday&quot;) so they never have to remember their numbers. (2) <strong>Personal records</strong> — when a committed set beats their prior best on that lift (by estimated 1RM, so reps count), a quiet &quot;New best&quot; badge appears on the exercise. No PR on a first-ever log. (3) <strong>Momentum</strong> — the log index shows a block-completion bar (&quot;11 / 16 logged&quot;) and a &quot;3 weeks fully logged&quot; streak. All read-only and derived — no new tables, no points/levels, deliberately kept on-brand.</li>
              <li><strong>Log a session yourself</strong> (added 2026-07-23): you can now log a client&apos;s workout from <strong>their profile</strong> (the &quot;Log a session&quot; button under Block progress) — for when you train them in person. It opens the same logger the client uses (set entry, rest timer, &quot;last time&quot; numbers, personal-record badges), and because it writes to the same place, the session also shows up in the client&apos;s own portal. Uses your dashboard login, so no client link needed.</li>
              <li><strong>Evening log nudge</strong> (added 2026-07-23): a daily 8:30pm Brisbane cron. If today is the client&apos;s prescribed training day and they haven&apos;t logged (or started) that session, it sends one SMS with a link straight to the log screen. It only fires on their actual training days, skips anyone who already logged, and is capped at 1 nudge/day and 3 per 7 days so it never nags. SMS only (our one-way sender), no reply CTA. Visible in Business → Automations as &quot;Log-Your-Session Nudge&quot;.</li>
              <li><strong>In-person session reminder — Greg</strong> (added 2026-07-24): a standing SMS to Greg 30 minutes before each of his fixed weekly in-person sessions with Kade (Mon 2pm, Wed 2pm, Fri 9am Brisbane), so it texts at Mon/Wed 1:30pm and Fri 8:30am. Each text is written fresh by the AI so it never repeats and can nod to what Greg is actually training that day (pulled safely from his program — goal, block, today&apos;s focus; never weights or numbers), guided by an &quot;about Greg&quot; profile in the route that captures his personality and what motivates him. If the AI ever fails, it falls back to a fixed, approved line so a text always goes out. SMS only (our one-way sender), no reply CTA, with a 25-minute dedup guard so a double fire never texts twice. This is a per-client standing schedule wired to Greg specifically — separate from the day-before Session Reminder email, which is driven by booked session rows. Visible in Business → Automations as &quot;In-Person Session Reminder (30 min before) — Greg&quot;. To remind another client the same way, or to make it general for all face-to-face clients, ask and it can be extended.</li>
            </ul>
            <p className="mt-2">On your client profile page, the new <strong>Block progress</strong> card sits above the Recovery Router panel. It shows: week N of M, days until block end (with amber pill at ≤ 7 days), sessions completed this week / prescribed, in-progress count, total sessions logged this block, last logged time. <strong>Block ending in N days</strong> banners appear automatically as the block approaches its end.</p>

            <Note>Logged data is captured in three new tables: <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">session_completions</code> (one per session × week), <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">session_exercise_completions</code> (one per exercise, with prescribed-vs-actual + substitutions), <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">exercise_set_logs</code> (one per set). The prescription is snapshotted at session start so a mid-block program regeneration cannot retroactively change what was logged.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">What&apos;s coming in Phase B + C</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Phase B partial (DONE 2026-05-10)</strong>: block-end email notifications. Daily cron at 7:30am Brisbane scans all active programs and emails <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">{coach().email}</code> when (a) any client&apos;s block has 7 days remaining, or (b) any client&apos;s block hits day 0. Branded dark template. Idempotent — one email per (client × program × event), so re-runs of the cron never spam. New table <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">block_end_notifications_sent</code> enforces it.</li>
              <li><strong>Phase B remaining</strong>: load progression sparklines per exercise on the client profile, missed-session detection, top-of-coaching-list block-ending banner.</li>
              <li><strong>Phase C</strong>: auto-fill the Recovery Router&apos;s <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">session_repeatability</code> signal from logged data (compare last week&apos;s avg loads to this week&apos;s); surface &quot;missed &gt;2 sessions&quot; as a router signal.</li>
            </ul>
          
            <p className="text-[12.5px] font-medium text-[#666D7A] mt-6 mb-2">Set volume, and what to do when they also run (2026-08-30)</p>
            <p>Working sets per session are governed by phase and tier. Trunk and core work is excluded from the count.</p>
            <div className="overflow-x-auto mt-2">
              <table className="text-[12.5px] w-full">
                <thead><tr className="text-[#666D7A] text-left"><th className="font-medium pb-1">Phase (advanced tier)</th><th className="font-medium pb-1">Min</th><th className="font-medium pb-1">Target</th><th className="font-medium pb-1">Max</th></tr></thead>
                <tbody>
                  <tr className="border-t border-[#E8EAEE]"><td className="py-1">Restoration</td><td>12</td><td><strong>14</strong></td><td>16</td></tr>
                  <tr className="border-t border-[#E8EAEE]"><td className="py-1">Accumulation</td><td>14</td><td><strong>17</strong></td><td>20</td></tr>
                  <tr className="border-t border-[#E8EAEE]"><td className="py-1">Intensification</td><td>13</td><td><strong>16</strong></td><td>18</td></tr>
                  <tr className="border-t border-[#E8EAEE]"><td className="py-1">Realization</td><td>13</td><td><strong>16</strong></td><td>18</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3"><strong>The clamp aims at target, not min.</strong> Anything below target is pushed up to it, so the published minimum is not normally reachable. That is correct for a pure strength block and wrong for a client who is also doing endurance work: coming out of restoration at 14 sets, an accumulation block puts them at 17 in the same week their running volume climbs.</p>
            <p className="mt-2"><strong>Endurance sessions in their week</strong> is a slider on the prescription page, next to Training Frequency. Set it to the number of runs, rides or swims the client is actually doing. Above zero, the target drops to that phase and tier&apos;s own published minimum. It is not a new invented number: the doctrine already says 14 is acceptable for accumulation at advanced, and concurrent endurance is exactly the case it is acceptable for.</p>
            <Note><strong>It stops inflation, it does not force a reduction.</strong> The ceiling does not move, so anything you deliberately write between the floor and the ceiling still stands. What changes is that a lighter block is no longer silently pushed back up on regeneration. Recorded on the block in <code className="bg-[#EFF1F4] px-1 rounded text-[#1B6DFC] text-[12.5px]">concurrent_endurance_sessions</code>, so a block also stops being blind to the fact the client runs.</Note>

            <Note><strong>It also rebalances, not just reduces.</strong> Endurance work is a lower-body load, so a client running three times a week already has the most-trained legs they own, and the upper body is what actually detrains. With endurance declared, the generator is told to keep <strong>upper-body working sets at least equal to lower-body</strong> across the week, one primary lower-body movement per session is enough, and no conditioning finishers. The clamp backs it up by taking cuts from lower-body work first and putting added volume on upper-body first, and it writes a note if the block still comes out lower-biased. Parity rather than a percentage, because a percentage would be a number nobody could defend.</Note>

            <Note><strong>Two things the generator does not do.</strong> It never writes <strong>Conditioning</strong> - that is coach-set in the conditioning editor until the conditioning modality exists, so a block for a runner can come out silent on running. And it is never given race or event context, so the client note can claim a past race is &ldquo;behind you&rdquo; while ignoring the one they are training for. Check both before publishing.</Note>
          </Section>

          {/* Program Reading - client-facing translation of the active block */}
          <Section id="program-reading" title="20b. Program Reading - Client Facing" colour="teal">
            <p>The Program Reading is the client-facing translation of the active training block. It sits at the top of the client&apos;s program page so the &ldquo;why this block&rdquo; frames every session they open. It is the bridge from the Foundational Reading (state and patterns) to the prescription (sessions, sets, reps), written so the client understands what this block is for, what it will ask of their body, and how we will read it as it unfolds.</p>

            <p>It is generated by Claude Haiku 4.5 using the client&apos;s latest published Foundational Reading as the state context plus the active program row as the prescription context. The two readings read as one voice. The Foundational Reading sets the state; the Program Reading shows how the state shapes the block.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">How to publish a Program Reading</p>
            <p>On the client profile, open <strong>Training Program</strong>. The <strong>Program Reading - Client Facing</strong> panel sits directly above the active program body. Click <strong>Generate &amp; Publish</strong>. The reading:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>Reads the latest published Foundational Reading for voice and state context (required — the panel will refuse to generate without one).</li>
              <li>Reads the active program row for prescription context (block name, phase, goal, frequency, prescription rationale, weekly pattern summary, progression notes, sessions shape).</li>
              <li>Auto-publishes it to the top of <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/portal/[token]/program</code>.</li>
              <li>Sends a notification email to the client (first publish per program row only — regenerations never re-email, but a new program row from a new block naturally triggers one email).</li>
              <li>Also makes the cream-on-black premium-deliverable version available at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/portal/[token]/program/reading</code> via the &quot;View as document&quot; link on the portal card.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">The five sections</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>01 Why this block</strong> - Anchors the block in the body state from the Foundational Reading. What we are trying to shift this time, in the client&apos;s own language.</li>
              <li><strong>02 What this program is doing</strong> - Translates the design into outcomes. Capacity, tolerance, exposure, recovery, integration. Never sets or reps or exercise names.</li>
              <li><strong>03 How we will know it is working</strong> - Block-specific success signals. Felt signals (energy, sleep, mood, recovery, ease of movement) and observed signals (consistency, check-in patterns). Never weight or body composition.</li>
              <li><strong>04 What we are not doing yet</strong> - Program-level non-directives. Aggressive loading, conditioning, complexity, benchmarks, restriction. With downstream-consequence reassurance whenever fat loss is touched on.</li>
              <li><strong>05 A note from your coach</strong> - Short closing in Kade&apos;s voice. Where this block sits in the arc of their work.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Coach Guidance, edit, and re-publish</p>
            <p>Same affordances as the Foundational Reading panel:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Coach Guidance</strong> - Standing notes for the AI scoped to THIS block. Applied on every Generate / Regenerate. Each new program (new block) starts fresh; use this when the AI needs context the doctrine cannot derive (e.g. &quot;client came off a stressful 8-week work cycle, frame the deload framing strongly&quot;).</li>
              <li><strong>Inline editing</strong> - Click the pencil on any section to rewrite the text directly. Em dashes are stripped on save.</li>
              <li><strong>Regenerate</strong> - Replaces the live reading. The client is not re-emailed for the same program row. Inline edits are overwritten.</li>
              <li><strong>Unpublish / Republish</strong> - Hide the reading from the portal without deleting the text.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Doctrine guardrails</p>
            <p>Same content rules as the Foundational Reading: no sets / reps / loads / RPE / percentages, no specific exercise names, no calorie or macro targets, no diagnoses, no causal claims, no em dashes, no exclamation marks. The body is interpreted as coherent, never broken. Conservative resolution overrides optimistic interpretation. Whenever the &quot;not doing yet&quot; section touches on fat loss or weight, the AI must reassure the client that outcomes typically follow as a downstream consequence of building capacity first.</p>

            <Note>The Program Reading is per-block, not per-client. Each new program row gets its own reading. Generating a new block clears the prior reading state and creates a fresh canvas. The Foundational Reading is the constant; the Program Reading evolves with each block.</Note>
          </Section>

          {/* Block-end Trajectory Reading - client-facing read of the CFWS arc */}
          <Section id="trajectory-reading" title="20c. Block-End Trajectory Reading - Client Facing" colour="teal">
            <p>The Block-End Trajectory Reading is the client-facing read of the whole training block, written once the block has finished. Where the Foundational Reading is the client translation of the CFFS (a single snapshot) and the Program Reading frames the prescription, the Trajectory Reading is the client translation of the <strong>CFWS arc</strong>: it reads the SEQUENCE of weekly syntheses across the block and tells the client how their signal moved over time, not where it sits in any one week. It is the fifth reading and the first that reads time, not a moment.</p>

            <p>It sits below the Program Reading on the client&apos;s program page once published, and is also available as a standalone document. It exists so the client can step back from the week-to-week, see the shape of where they have been travelling, and trust that the work compounded even on the flat weeks.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">How to publish a Trajectory Reading</p>
            <p>On the client profile, open <strong>Training Program</strong>. The <strong>Block-End Trajectory Reading - Client Facing</strong> panel sits directly below the Program Reading panel. Unlike the Program Reading, it is <strong>coach-gated like the Foundational Reading</strong>: generating produces a DRAFT only, and a separate publish step surfaces it and emails the client.</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>The panel shows a <strong>block-status note</strong>. The reading is designed for block end; before then it shows the current week of the block (e.g. &ldquo;week 4 of 6&rdquo;). You can still generate an early draft from the weeks completed so far, with a confirm.</li>
              <li><strong>Generate draft</strong> reads every non-archived CFWS row in the block&apos;s week range (oldest first), plus the published Foundational Reading for voice. It writes a draft and does NOT publish or email.</li>
              <li>If there are no weekly syntheses (CFWS) in the block range, generation refuses with a clear message. Generate the weekly check-in syntheses first.</li>
              <li><strong>Publish &amp; notify</strong> surfaces the reading at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/portal/[token]/program</code> and, the first time this block is published, emails the client (&ldquo;your block-end reading is ready&rdquo;). Republishing never re-emails.</li>
              <li>The standalone document lives at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/portal/[token]/program/trajectory-reading</code> via the &quot;View as document&quot; link.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">The five sections</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>01 Where this block started</strong> - The starting line, drawn from the earliest weeks and the Foundational state. The anchor the arc is measured against.</li>
              <li><strong>02 How your signal moved</strong> - The heart of the reading. The direction of travel across the block: recovery, energy, regulation, capacity, consistency. Honest about the shape, including flat or mixed arcs.</li>
              <li><strong>03 What held steady</strong> - What persisted across the whole block. Constancy is signal too.</li>
              <li><strong>04 What this sets up next</strong> - Forward-looking and non-prescriptive. What the block has readied the body for. Consolidation, not escalation, when the arc warrants caution.</li>
              <li><strong>05 A note from your coach</strong> - Short closing in Kade&apos;s voice on the arc of their work.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Coach Guidance, edit, and re-publish</p>
            <p>Same affordances as the other reading panels: <strong>Coach Guidance</strong> (standing notes applied on every Generate / Regenerate, e.g. &ldquo;weeks 3-4 were disrupted by travel, frame the dip as expected&rdquo;), <strong>inline editing</strong> (pencil per section, em dashes stripped on save), <strong>Regenerate</strong> (re-reads the arc; if live it stays live and the client is not re-emailed), and <strong>Unpublish / Republish</strong>.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Doctrine guardrails</p>
            <p>Same content rules as the other readings, plus two specific to reading time: a single bad week is never the verdict (pattern-based interpretation over event-based), and <strong>the AI must not manufacture progress the weekly data does not support</strong> - conservative resolution means a genuinely flat or mixed arc is read honestly and supportively, never inflated. Weight and body composition are never the measure of the arc; the underlying signal is.</p>

            <Note>Per-block, like the Program Reading. Each program row gets its own trajectory reading once its block completes. Coach-gated end to end: nothing reaches the client until you publish.</Note>

            <Note><strong>Notify Client (restored 2026-06-22).</strong> Publish to portal and notification email are now two separate clicks, mirroring the Program / Nutrition Notify Client pattern. <strong>Publish</strong> surfaces the reading on the client portal; once published, a <strong>Notify Client</strong> button appears for the explicit send. Email stamps <code className="bg-[#EFF1F4] px-1 rounded text-[#1B6DFC] text-[12.5px]">programs.trajectory_reading_email_sent_at</code> and the button label flips to <strong>Notify Again</strong>. The earlier 2026-06-09 decision to drop the auto-email was kept in spirit (publish doesn&apos;t auto-fire), but block-end readings are their own reflection moment and need their own coach-gated notify path rather than waiting for the next program publish to be the client touchpoint.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-6 mb-2">Progress Read - re-scoring body state at block-end (2026-08-11)</p>
            <p>The <strong>Progress Read</strong> is the same Block-End Reading with one addition: it re-scores the client&apos;s body state (Depleted / Transitioning / Ready) <strong>then vs now</strong>. It answers the client&apos;s real question at block-end - &ldquo;have I actually moved?&rdquo; - the way Equinox re-runs a fitness assessment. The pattern (Stress-Stored, Insulin-Drift, etc.) is <strong>held</strong>; only the state moves. A re-read never re-diagnoses the pattern, it only nudges confidence in it.</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm mt-2">
              <li><strong>Send Progress Check.</strong> At block-end a <strong>Send Progress Check</strong> button appears above the reading panel. One click emails the client the re-assessment - 24 questions plus her measurements and three photos, roughly ten minutes (it is <em>not</em> the 230-question intake). <strong>Two timing gates apply:</strong> she must have reached the <strong>final week</strong> of her block (revised 31 Aug 2026 from &ldquo;the block must have ended&rdquo;), and this week&apos;s check-in must be in, so she never gets both asks at once. A blocked send explains why and offers &ldquo;Send it anyway&rdquo;. Logs <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">progress_check_invite</code>.</li>
              <li><strong>Client submits.</strong> You get a notification email with a link back to the program. Nothing publishes on its own.</li>
              <li><strong>Generate.</strong> Click Generate on the reading panel. It reads the block&apos;s weekly arc <em>and</em> the Progress Check answers, and produces the reading plus a <strong>State Re-Score</strong> card (previous state → new state, direction, a plain-language rationale, and a pattern-held note). Review and edit as normal.</li>
              <li><strong>Publish + Notify.</strong> Same two clicks as any reading. When a re-score is present the client&apos;s document is titled <strong>Progress Read</strong> and leads with a &ldquo;Where you are now&rdquo; section; without a Progress Check it stays the plain Block-End Reading.</li>
            </ul>
            <Note><strong>If a reading keeps refusing to generate.</strong> Readings are audited for internal terminology before they save, and the generator now redrafts up to three times on its own. If all three fail, the error names the phrase and says so, because a phrase that repeats is usually a <em>source</em> collision rather than a bad draft: something in the prompt is feeding the model a word the audit will not let it say back. That is exactly what happened on the first Progress Read ever attempted - the check asks &ldquo;I feel wired but tired&rdquo;, which is banned in client-facing readings, so every draft quoted it and was rejected. Questions like that now carry a separate prompt-safe phrasing: the client still reads the natural wording, the model never sees the banned term. <code className="bg-[#EFF1F4] px-1 rounded text-[#1B6DFC] text-[12.5px]">npx tsx scripts/audit-question-text.ts</code> checks all 285 questions and fails if a new one collides.</Note>

            <Note><strong>Coach-gated end to end.</strong> Sending the check, generating, and publishing are all deliberate clicks. The re-score is a draft until you publish it, so an odd self-report can never surface to the client unchecked.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-6 mb-2">Carrying the re-score into the next block (2026-08-30)</p>
            <p>The Progress Read writes its re-scored state to the <strong>programs</strong> row. The program generator reads <strong>body state from the CFFS</strong>. Those are two different places, so until now a re-score never reached the block it was collected to inform: you could re-score a client to Transitioning and the next block would still be built against the Depleted-era foundational read.</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm mt-2">
              <li>When a re-score exists that <strong>differs</strong> from the live CFFS, the <strong>prescription suggest page</strong> now shows it at the top, with the option to build the block on the re-scored state or ignore it and use the foundational read. Carrying it is the default, since the Progress Check was collected for exactly this.</li>
              <li><strong>The CFFS is never touched.</strong> Pattern stays held. Only a full 230-question re-intake with fresh photos may revise the foundational read, and a Progress Check is deliberately not that.</li>
              <li><strong>Readiness signals are not re-scored.</strong> Only the state moves. The four readiness flags still date from the CFFS, so the prompt labels them as historical and is told that where a readiness flag is more restrictive than the new state implies, <strong>the more restrictive constraint wins</strong>. The failure mode is deliberately conservative.</li>
              <li>What the block was actually built against is recorded on the program row in <code className="bg-[#EFF1F4] px-1 rounded text-[#1B6DFC] text-[12.5px]">body_state_at_generation</code>, with the override and your note beside it, so a block never silently loses the reason its level was set the way it was.</li>
            </ul>
            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Where the re-scored state shows up (2026-08-30)</p>
            <p>The foundational read is scored once and never changes - it is the permanent record of who the client was at intake, and it stays the anchor. It just stops being presented as <em>current</em> once a Progress Read has re-scored them.</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm mt-2">
              <li><strong>Coach surfaces</strong> - the state pill on the client record, the Body State Classification card, and the coaching list - show the re-scored state as soon as the Progress Read is <em>generated</em>, with a line naming the block it came from and what the foundational read said. A dot beside the pill in the list marks a re-scored client.</li>
              <li><strong>The client portal waits for you to publish.</strong> Until the Progress Read is published the portal still says the foundational state. The client should meet a new state inside a reading you have approved, not via a line quietly changing before you have said anything to them.</li>
              <li>The CFFS row is never written to. The foundational read and its published client reading are untouched.</li>
              <li>The CFFS report and Direction pages deliberately keep showing the foundational value - they <em>are</em> the foundational report.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Readiness moves too (2026-08-30)</p>
            <p>The foundational read scores the four readiness signals <strong>once, at intake, and they never move again</strong> - but readiness is genuinely re-scored <strong>every week</strong> in the weekly synthesis. Cristobal&apos;s intake said regulation Red; every weekly synthesis from week 3 to week 8 said Green. Because the program generator only ever read the foundational values, his next block would have been clamped to Stabilisation Only on a constraint the data cleared five weeks earlier.</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm mt-2">
              <li>A domain is carried <strong>only when the last three weekly syntheses agree unanimously</strong>. Unanimity is what stops one disrupted week from moving a clamp - Cristobal&apos;s schedule dipped to Amber the week he travelled, so schedule simply is not carried rather than flipping.</li>
              <li>The same rule runs <strong>in both directions</strong>. Three consecutive Reds tighten the clamp exactly as three consecutive Greens loosen it.</li>
              <li>The suggest page shows the whole table - each domain, its intake value, the weekly verdict, and whether it will carry or be held - before you opt in. Carrying is the default, since the weekly reading is the live one.</li>
              <li>Recorded on the block in <code className="bg-[#EFF1F4] px-1 rounded text-[#1B6DFC] text-[12.5px]">readiness_at_generation</code> along with the weeks that justified it.</li>
            </ul>
            <Note><strong>A rule that read as caution and was not.</strong> The first version of the state carry-forward told the generator that where a readiness flag was more restrictive than the re-scored state implied, the tighter constraint should win. That sounds safe. It is not: because readiness is re-scored weekly, it guaranteed a stale intake-era Red would beat months of Green and rebuild the very clamp the re-score was meant to lift. It did not fail safe, it failed stuck. The caveat now applies only to domains that genuinely were not re-scored.</Note>

            <Note><strong>Two vocabularies, one axis.</strong> The Progress Read speaks the client labels (Depleted / Transitioning / Ready); the CFFS and the program eligibility rules speak the internal ones (Remediation / Optimisation / Post-Optimisation). The carry-forward translates between them. An unrecognised state is rejected outright rather than passed into the prompt, because an unknown word there would silently derive the wrong eligibility level instead of failing.</Note>
          </Section>

          <Section id="macro-arc" title="21. Macro Training Arc" colour="teal">
            <p>The Macro Plan sits above individual program blocks. It lets you plan the full training arc for a client - a sequenced series of meso blocks that govern where the client is going over months, not just the next 4 weeks.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">How It Works</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li>Access it via <strong>Macro Plan</strong> on the client profile Training Program section.</li>
              <li>Create a plan with a name and macro objective (e.g. &quot;Build capacity foundation → strength expression over 6 months&quot;).</li>
              <li><strong>Suggest Arc</strong> generates a draft plan from the client&apos;s CFFS + intake context. Review on the suggest page - each block has phase, goal, duration, execution arc (Short/Mid/Long), phase category, phase objective, and <strong>sessions/week</strong>. Edit anything before saving.</li>
              <li>The suggest page button reads <strong>Save as Draft</strong> (not &quot;Approve Arc&quot;). Saving creates the draft on the plan page; approval is the second step.</li>
              <li>On the plan page the draft shows an amber <strong>Draft Arc - Pending Approval</strong> pill with <strong>Approve Arc</strong> + <strong>Discard Draft</strong> buttons. Approve to activate (auto-archives any prior active arc).</li>
              <li>Each block has a <strong>Sessions / Week</strong> field on the editor. Coach edits propagate end-to-end: the value lives in <code>plan_blocks.training_frequency</code> as a structured column, surfaces in suggest-prescription as an authoritative <strong>COACH-SET FREQUENCY</strong> line, and is deterministically applied to the prescription regardless of what the AI suggests.</li>
              <li>Click <strong>Generate program →</strong> on any block to go to the prescription suggestion page - the system pre-fills the prescription from the plan block and passes the full arc context (previous block completed, next block planned, macro objective) to Claude during generation.</li>
              <li>Block status updates automatically: Planned → In Progress (when generation begins) → Complete (when the program weekly review marks &quot;New block required&quot;) → Skipped. When a block is marked complete, the next planned block advances to In Progress automatically.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">The Three Time Horizons</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Macro</strong> - The plan itself. Long-term direction (months). Governs which stress profiles are allowable and the overall arc direction.</li>
              <li><strong>Meso</strong> - Each block in the plan. 4–8 weeks. Sets stress emphasis, density, and deload timing for that window.</li>
              <li><strong>Micro</strong> - The sessions within each block. Weekly/session expression responsive to current conditions. What the program page shows.</li>
            </ul>

            <Note>The macro plan gives Claude context it cannot derive from a single block in isolation - it knows where the client has been and where they are going. This produces more accurate phase transitions, better execution arc decisions, and appropriate intensity sequencing across blocks.</Note>
          </Section>

          <Section id="program-coach-guidance" title="21b. Program Coach Guidance" colour="teal">
            <p>Standing free-text steering for the program generator at the macro-arc level. Lives on the macro arc (the <code>training_plans</code> row), so it auto-applies to every Generate or Regenerate of every phase you produce within that arc. Solves the problem where the engine&apos;s doctrine-default conservatism produces a first-phase program that is technically correct but too soft for clients whose training-age signals the form alone can&apos;t carry.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">When to use it</p>
            <p>Open a draft program (after Generate Program in the macro arc flow). Above the draft program body you&apos;ll see the <strong>Coach Guidance (macro arc)</strong> card. Click <strong>Edit</strong>, write what the engine doesn&apos;t know from the form inputs alone, click <strong>Save guidance</strong>, then click <strong>Regenerate with guidance</strong> in the draft header. The current draft is replaced by a new one generated with your guidance applied.</p>

            <p>Common things to write:</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li>Training-age realities the form can&apos;t carry: <em>&quot;Training-age advanced (10+ years). Target RPE 8 on primaries from week 1.&quot;</em></li>
              <li>Exercise-selection bias: <em>&quot;No machine variations where a barbell or dumbbell version exists. Free-weight primaries only.&quot;</em></li>
              <li>Volume positioning: <em>&quot;Bias volume to the top of the prescribed range.&quot;</em></li>
              <li>Session density: <em>&quot;Supersets allowed on accessories. EMOMs welcome.&quot;</em></li>
              <li>Tone of the block: <em>&quot;He&apos;s coming out of a deload and wants to feel intensity again. Don&apos;t be cautious.&quot;</em></li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Drafting guidance with AI</p>
            <p>The Coach Guidance card has a <strong>Suggest with AI</strong> sub-panel. Pick an intent (push harder / pull back / maintain), tick the levers you want pulled (volume, intensity, complexity, density), optionally drop a one-line context note, then click <strong>Draft guidance</strong>. Claude pulls the client&apos;s latest non-archived CFFS automatically and writes a 3-6 paragraph guidance block using the exact phrases the program engine recognises (&quot;top of range&quot;, &quot;wants intensity&quot;, &quot;supersets allowed&quot;, &quot;free-weight only&quot;). The draft drops into the textarea — edit before saving, then Save and Regenerate as normal. Treat AI-drafted guidance as a starter; the value is in the edits you make, not the click. If the textarea already has unsaved content the panel will warn before overwriting.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">What it can and cannot do</p>
            <p>Coach guidance <strong>can</strong> override engine-default conservatism within doctrine: default RPE ceilings within the doctrine range, set/rep selection within the goal range, exercise complexity bias, session density, volume positioning within the prescribed range.</p>
            <p>Coach guidance <strong>cannot</strong> override doctrine safety floors: an active recovery state (RRS clamps), injury contraindications, Fat Map Method hard limits, Level 0/1/2 eligibility floors, the exercise library, or doctrine RPE caps for the assigned phase. If your guidance conflicts with one of these on a safety-relevant variable, doctrine wins and the engine notes the partial application in the weekly pattern summary.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Scope and persistence</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li>Lives on the macro arc. One guidance field per arc. Applies to every phase you generate from this arc.</li>
              <li>Persists across regenerations of the same phase, and across new phase generations (phase 2, 3, 4...).</li>
              <li>Edit it any time. The next Generate or Regenerate picks up the change.</li>
              <li>Only visible when the draft is linked to a macro arc. Programs generated outside the macro-arc flow do not have a guidance editor.</li>
            </ul>

            <Note>The Regenerate button is the existing generate route under the hood — it auto-replaces the current draft. There is no separate &quot;regenerate&quot; state. If you want a specific phase to read differently from the arc-wide guidance, edit the guidance temporarily, regenerate, then change it back. Per-phase override fields are not yet built; add a registry future-work line if you start needing them.</Note>
          </Section>

          <Section id="nutrition-coach-guidance" title="21c. Nutrition Coach Guidance" colour="teal">
            <p>Standing free-text steering for the HABNS nutrition generator. Lives on the <code>nutrition_plans</code> row, so it auto-applies to the next Generate / Regenerate for the client. Mirrors the program-side Coach Guidance (§21b) and replaces the &quot;you had to go back to the Generate form to change one line&quot; workflow that existed until 2026-06-22.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">When to use it</p>
            <p>Open the Nutrition Plan section of a client profile. Above the draft body (and above the active plan body) you&apos;ll see the <strong>Coach Guidance (nutrition plan)</strong> card. Click <strong>Edit</strong>, write what the engine doesn&apos;t know from the prescription inputs alone, click <strong>Save guidance</strong>, then click <strong>Regenerate with guidance</strong>. The draft is replaced by a new one generated with your guidance applied.</p>

            <p>Common things to write:</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li>Behavioural reality the intake can&apos;t carry: <em>&quot;Travelling for 4 weeks, no kitchen. Bias toward portable / restaurant-resolvable options.&quot;</em></li>
              <li>Meal architecture shaping: <em>&quot;Meal 4 designed as a no-cook 20g protein anchor (Greek yoghurt, eggs, protein shake). Bias mid-afternoon to land on the 3-4pm crash.&quot;</em></li>
              <li>Flexibility / rigidity tuning: <em>&quot;Wants more flexibility. Expand substitution_options across all categories; loosen execution_rules from must to aim for.&quot;</em></li>
              <li>Compression / restructure (within doctrine): <em>&quot;Client now compresses to two meals on workdays. Adjust meal_frequency where doctrine allows; appetite-suppression floor of 4 still wins.&quot;</em></li>
              <li>Cuisine / framework bias: <em>&quot;Halal + South Asian foundation. Sample foods should reflect this; no pork, no alcohol, dahls and roti welcome.&quot;</em></li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Drafting guidance with AI</p>
            <p>The card has a <strong>Suggest with AI</strong> sub-panel. Pick an intent (simplify execution / push the demand / add flexibility / restructure meals), tick the levers you want pulled (meal count, protein distribution, food friction, food variety, timing), optionally add a one-line context note, then click <strong>Draft guidance</strong>. Claude pulls the latest non-archived CFFS, the client&apos;s medications, and the dietary context (restrictions, preferences, typical day&apos;s eating, eating environment) automatically and writes a 3-6 paragraph guidance block using the exact phrases the nutrition engine recognises (&quot;travelling / no kitchen&quot;, &quot;compresses to two meals&quot;, &quot;wants more flexibility&quot;, &quot;small protein anchor&quot;, etc.). The draft drops into the textarea — edit before saving. Treat AI-drafted guidance as a starter; the value is in the edits you make.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">What it can and cannot do</p>
            <p>Coach guidance <strong>can</strong> override engine-default conservatism within HABNS doctrine: meal frequency selection within doctrine ranges, food selection bias within the dietary framework, substitution generosity, weekly_structure_notes rigidity, sample-foods culture / cuisine bias, what_not_to_change additions or removals where they reflect the client&apos;s stated reality.</p>
            <p>Coach guidance <strong>cannot</strong> override safety-relevant floors: appetite-suppression hard rules (meal_frequency ≥ 4 for stimulant / GLP-1 / SSRI / SNRI clients, per-meal protein caps), validator bodyweight-derived calorie and protein floors, dietary RESTRICTIONS or PREFERENCES from intake, RRS recovery-state constraint manifests, transitional override gating, HABNS first principles. If your guidance conflicts with one of these the engine surfaces &quot;Coach guidance partially applied: [variable] held at doctrine floor because [reason]&quot; in the rationale.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Scope and persistence</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li>Lives on the nutrition_plans row. Editable on both draft and active plan views.</li>
              <li>Persists across Regenerate; carries forward to the next plan generated for the client via inheritance unless explicitly overwritten on the Generate form.</li>
              <li>Edit any time. The next Generate or Regenerate picks up the change.</li>
            </ul>

            <Note>The Regenerate button on this section is wired to <code>/api/regenerate-nutrition</code>, which lifts the stored primary inputs (entry_state, body_state, pts_phase, protein anchor, carb_demand, meal_frequency, transitional override state) from the existing plan and forwards them to <code>/api/generate-nutrition</code>. The coach_guidance is read inside generate-nutrition automatically. If you need to change primary inputs (e.g. switch entry_state from stabilisation to training_support), go back to the Generate Plan form instead.</Note>
          </Section>

          <Section id="nutrition-plan" title="22. Nutrition Plan - HABNS" colour="teal">
            <p>The Nutrition Plan engine generates a doctrine-compliant daily nutrition prescription under the Hybrid Animal-Based Nutrition System (HABNS) - the 5th pillar of the Body Recode system. Plans follow a two-stage pipeline: draft → active. The same approval flow as the training program.</p>

            <Note><strong>Daily meal logging (2026-07-23).</strong> Clients can now log each prescribed meal per day as <strong>ate / swapped / skipped</strong>, plus a daily hunger + satisfaction read and an optional note — on-brand adherence + appetite signals, <strong>not</strong> calorie counting. Client entry: a &ldquo;Log today&apos;s meals&rdquo; tile in their portal Nutrition section (<code>/portal/[token]/my-plan/log</code>). You can also log on their behalf in person via the <strong>&ldquo;Log today&apos;s meals&rdquo;</strong> button on this Nutrition Plan page (<code>/dashboard/clients/[id]/nutrition/log</code>) — same tables, so it shows in their portal too. A <strong>7-day adherence rollup</strong> (ate / swapped / skipped + % on plan) shows at the top of this page. This is DAILY granularity that complements the WEEKLY nutrition review (which still owns the plan&apos;s direction). Each day snapshots the plan&apos;s meals at log time, so editing the plan later never rewrites history.</Note>

            <Note><strong>Food swaps are now client-visible (2026-07-14).</strong> The <strong>Food Substitutions</strong> block on this coach page is the same engine-generated swap list the client now sees, restyled, in a collapsible <strong>Food swaps</strong> card on their <code>/portal/[token]/my-plan</code> view. It gives the client permission to flex to macro-matched alternatives without messaging you. Caveat: swaps are generated with the plan and are <strong>not</strong> re-derived when you hand-edit a meal in the meal editor, so after a manual meal change the swap list can name a food no longer in the plan. The client card carries a note to this effect; regenerate the plan if you want the swaps to re-sync exactly.</Note>

            <Note><strong>Coach Guidance lever (2026-06-09).</strong> The Generate form now exposes a <strong>Coach Guidance</strong> textarea that mirrors <code>training_plans.coach_guidance</code>. Free-text standing context (travel block, mid-plan dietary change, post-illness framing, life-event constraints) read by the generator on every call. Bounded by HABNS doctrine and validator hard floors — it cannot override calorie floors, per-meal protein caps, appetite-suppression rules, or dietary restrictions/preferences. Persists on the plan; the route precedence is &ldquo;explicit body value wins, else carry forward from the most recent plan&rdquo;, so guidance survives every Regenerate until you replace it. Leave blank to keep the prior plan&apos;s guidance, pass a new value to overwrite. First use: Samantha&apos;s 4-week travel block. See <code>project_nutrition_coach_guidance</code>.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Step 1 - Prescription Suggestion</p>
            <p>From a client profile, click <strong>Generate Plan</strong> in the Nutrition Plan section. This opens the prescription suggestion page. Claude (Haiku 4.5) reads the CFFS, real intake JSONB blobs (nutrition_responses, sleep_responses, stress_responses, training_responses), the <strong>dietary context</strong> free-text answers from Section D (restrictions, preferences/framework, typical day&apos;s eating, meals per day, daily fluids, caffeine, alcohol, eating environment), <strong>bodyweight from the baseline submission</strong> (the canonical source — intake doesn&apos;t carry a flat bodyweight column), <strong>medications</strong> if the client profile card is populated, age (derived from <code>date_of_birth</code>), sex (from <code>gender</code>), and any previous nutrition plans. Each field shows a reason. You can edit any field before proceeding.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Dietary Context (HARD CONSTRAINTS for the engine)</p>
            <p>Section D of the intake captures eight free-text answers that the nutrition engine reads. The first two are hard constraints; the rest are the consumption baseline the engine designs FROM:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Dietary restrictions</strong> (allergies, intolerances, medical) — absolute hard constraint. The plan never includes a restricted food regardless of HABNS preference for animal-based foundation. If a restriction conflicts with the doctrine (e.g. egg allergy), the protein anchor is rebuilt around what the client CAN eat and the tension is surfaced in the rationale.</li>
              <li><strong>Dietary preferences / framework</strong> (vegan, vegetarian, halal, kosher, pescatarian, no pork, etc.) — also absolute. The plan respects the framework without arguing the client out of it. If vegetarian, no meat or fish; protein anchor built from eggs, dairy, high-bioavailability plant sources. If vegan, eggs and dairy out too.</li>
              <li><strong>Typical day&apos;s eating</strong> — the BASELINE the engine designs FROM, not against. Per Minimal Effective Intervention, the engine adjusts the existing pattern rather than imposing a new one. If the client eats 3 meals + snacks, the engine does not prescribe 2 meals without a specific physiological reason.</li>
              <li><strong>Meals per day</strong> — the client&apos;s current eating frequency (main meals + snacks). Gives the appetite-suppression meal-count rules (≥4 meals on stimulant / GLP-1 / SSRI-SNRI) a real baseline instead of an assumption.</li>
              <li><strong>Daily fluids</strong> — water and all other drinks, so caloric/sugary drinks enter the energy picture rather than being invisible to a food-only recall.</li>
              <li><strong>Daily caffeine</strong> — serves plus rough timing. Reads against sleep, appetite, and stimulant interactions.</li>
              <li><strong>Alcohol intake</strong> — what, how many standard drinks, days per week. Caloric load plus sleep/recovery impact; the engine designs realistically around it and does not moralise.</li>
              <li><strong>Eating environment</strong> (optional) — shapes adherence design. Frequent travel → plan must work on the road. Shared meals with a partner who eats differently → plan must work in that household. Surface choices in the rationale.</li>
            </ul>
            <p>If the dietary context block is missing on a regenerate (e.g. for an older client whose intake predated this capture), the engine notes the absence in the rationale and recommends the coach capture it before next regenerate.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Editing dietary context mid-coaching</p>
            <p>The client profile has a <strong>Dietary &amp; Consumption</strong> section (directly under Medications) with an inline editor for all eight Section D fields. Click <strong>Edit</strong>, change any field, <strong>Save</strong>. This writes straight to the client&apos;s most recent intake row and stamps <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">dietary_updated_at</code>, so if the active program or nutrition plan was generated before the edit, a <strong>staleness banner</strong> appears prompting you to regenerate. Like the Medications editor, saving does <strong>not</strong> auto-regenerate the CFFS — regenerate from the macro plan / nutrition page (and the CFFS if the change is material) when you&apos;re ready. The older client-driven path (supplementary intake) still exists and remains the right tool when you want the client to answer in their own words; as of 2026-06-21 supplementary submission also does NOT auto-regenerate the CFFS &mdash; the Foundational Synthesis panel surfaces an amber &quot;Supplementary newer than CFFS&quot; banner so the coach reviews + regenerates explicitly.</p>


            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Step 1b - Pre-flight Feasibility (added 2026-05-25)</p>
            <p>Before any LLM call, the suggest page runs a client-side feasibility check against the prescription form. If the combination is mathematically infeasible under the hard rules (e.g. stimulant client with anchor 165g + 4 meals — max achievable is 32 + 43 + 43 + 43 = 161g, so the anchor can&apos;t be hit), an amber banner appears with one-click fix buttons (<code>[Bump to 5 meals]</code> / <code>[Lower anchor to 161g]</code>). The Generate button is disabled until feasible. This eliminates the &quot;wasted 90s on a guaranteed-to-fail generation&quot; failure class.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Step 2 - Plan Generation</p>
            <p>Click <strong>Approve &amp; Generate Plan</strong>. Generation runs three Haiku attempts in parallel; the first one that passes validation wins. If all three fail, the engine escalates to Sonnet 5 with the least-bad Haiku output as a correction note. Wall-clock: typical client ~40s (Haiku passes), tight-constraint client ~110s (Sonnet escalation). The page shows a full-screen progress overlay with staged labels so the wait doesn&apos;t feel frozen. If you prefer to fill in the prescription manually, use the <strong>Fill in manually instead</strong> link at the bottom of the suggestion page.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Validator Hard Rules (added 2026-05-25, last updated 2026-05-26)</p>
            <p>The validator enforces a set of structural rules. Plans that violate any rule are auto-rejected and the engine retries once with the issue list as a correction note. If two retries fail, the coach sees a 422 with humanised issue messages. The rules:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Structured foods only</strong> — every food must be <code>{`{name, protein_g, carb_g, fat_g}`}</code>, never free-text strings. Macros recomputed server-side from foods; meal-level totals are server-derived.</li>
              <li><strong>Non-negative macros</strong> — no food can have a negative <code>protein_g</code>, <code>carb_g</code>, or <code>fat_g</code>. Caught the &quot;ghost food&quot; failure mode (Amanda&apos;s 2026-05-26 plan) where the LLM invented entries like &quot;10g butter (removed - accounting correction)&quot; with <code>F-10</code> to fudge totals down to a tight ceiling.</li>
              <li><strong>Protein anchor reconciliation</strong> — daily protein totals must match <code>protein_anchor_g</code> ±15-20g. Sum of meal protein.</li>
              <li><strong>Daily safety floors</strong> — carb floor scales with <code>carb_demand_level</code> (low: 0.8 g/kg, moderate: 1.5, high: 2.5). Fat floor 0.7 g/kg. Below these is &quot;dangerously under-fueled&quot;, not &quot;the prescription&quot;.</li>
              <li><strong>Calorie band derived from meals</strong> — <code>estimated_calorie_band</code> is computed from the sum of meal macros, not chosen aspirationally. The band is a REPORT of what the plan delivers.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Appetite-Suppression Hard Rules (added 2026-05-25)</p>
            <p>When <code>clients.medications</code> contains stimulants (Vyvanse, Adderall, Ritalin), GLP-1 agonists (Ozempic, Wegovy, Mounjaro, semaglutide, tirzepatide), or appetite-affecting serotonergics (Brintellix, Lexapro, Zoloft, Effexor, Cymbalta), the validator enforces three additional rules so the plan is physically executable:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>≥4 meals required</strong> — 3 large meals is rejected. A suppressed client cannot reliably finish 50g+ protein in one sitting.</li>
              <li><strong>≤43g protein per meal</strong> — empirically calibrated for natural portion sizes. Forces protein to spread across more meals.</li>
              <li><strong>≤35g protein in first meal (stimulant only)</strong> — peak Vyvanse / Adderall suppression is morning hours. Loading protein there guarantees the meal gets skipped.</li>
            </ul>
            <p>The suggest engine auto-bumps <code>meal_frequency</code> to the minimum that fits the math (e.g. 5 meals for a stimulant client with anchor 165g) so the coach doesn&apos;t have to remember.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Food Selection Doctrine (HABNS variety + Body Recode tier ban)</p>
            <p>Animal-based foods form the structural foundation. The Tier 1 carb pool is the COMPLETE set allowed: <strong>white rice (cooked), white potato (cooked), sweet potato (cooked), banana, mixed berries, honey</strong>. The variety directive (added 2026-05-26) prevents monotony — no single carb source appears in more than 2 of N meals; same for proteins. The PROHIBITED list (tightened 2026-05-26) explicitly bans <strong>bread, toast, sourdough, wraps, tortillas, sandwiches, pasta, noodles, couscous, crackers, breakfast cereals, croissants, bagels, plant-based milks</strong> — even when the client&apos;s typical-day intake mentions them. Seed oils are banned across all entry states.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Weight Conventions</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Meat / fish / eggs:</strong> RAW weight (e.g. &quot;120g beef mince (raw)&quot;)</li>
              <li><strong>Rice / potato:</strong> COOKED weight (e.g. &quot;250g white rice (cooked)&quot;) — clients weigh what&apos;s on the plate, not dry</li>
              <li><strong>Oats:</strong> DRY weight (Tier 3 conditional only)</li>
              <li><strong>Fruit:</strong> literal weight as eaten</li>
              <li><strong>Eggs:</strong> by count</li>
              <li><strong>Fats:</strong> by literal serving (15g olive oil etc.)</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Protein Anchor — Deterministic, Not LLM Math</p>
            <p>Protein anchor is computed in code from the client&apos;s baseline bodyweight, not by Claude. If Claude returns a value below <code>bodyweight × 1.4</code> (the floor), the route overrides with <code>bodyweight × multiplier</code>:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Stabilisation / Recovery Reset:</strong> 1.7g/kg</li>
              <li><strong>Training Support:</strong> 1.9g/kg</li>
              <li><strong>High Output Support:</strong> 2.0g/kg</li>
            </ul>
            <p>The reason field on the suggestion shows the override so it&apos;s auditable. Math through an LLM is unreliable — the floor enforces what the doctrine prescribes regardless of what Haiku produces.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Medications Modulation</p>
            <p>The <strong>Medications</strong> card on the client profile is read by the nutrition engine for both hormonal-class drugs (which directly modulate protein synthesis and carb support) and non-hormonal categories (which affect appetite, hydration, electrolyte balance, fluid retention, glycaemic response).</p>
            <p className="text-[12.5px] font-medium text-[#666D7A] mt-3 mb-1">Hormonal-class</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>TRT / exogenous testosterone:</strong> protein anchor sits at the upper bound of the prescribed range; recovery margin is wider.</li>
              <li><strong>Supraphysiological androgen support:</strong> protein anchor 2.0–2.2g/kg; carbs support training without unnecessary deficit.</li>
              <li><strong>GLP-1 in deficit:</strong> protein anchor floor 2.0g/kg minimum (preserve lean mass); the deficit is built in by the drug, so the engine does not stack additional aggressive deficit.</li>
              <li><strong>Other peptides / hormonal therapies:</strong> surfaced in rationale; modulation referenced where relevant.</li>
            </ul>
            <p className="text-[12.5px] font-medium text-[#666D7A] mt-3 mb-1">Non-hormonal categories (surfaced in rationale, do not change calorie / macro targets unless explicitly indicated)</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Beta-blockers / antihypertensives:</strong> hydration and electrolyte balance matter more; emphasis goes into the rationale and hydration habit.</li>
              <li><strong>SSRIs / SNRIs / many antidepressants:</strong> appetite and bodyweight may shift independent of intake. Adherence anchors to protein and meal-rhythm targets, not bodyweight drift, for the first 4-6 weeks of any new prescription.</li>
              <li><strong>Stimulants (ADHD meds):</strong> appetite suppressed during the day. Protein anchor floor must be met; the engine structures meals around the appetite window.</li>
              <li><strong>Chronic NSAIDs / corticosteroids:</strong> fluid retention can distort bodyweight readings; no calorie adjustments on a single weigh-in spike. Corticosteroids elevate protein needs further (catabolic effect) → push protein anchor to upper bound.</li>
              <li><strong>Metformin / antidiabetic meds:</strong> carb tolerance and glycaemic response pharmacologically altered. Conservative carb-timing if not already specified; surfaced in rationale.</li>
              <li><strong>Statins:</strong> no direct nutrition implication, flagged if the client reports muscle soreness.</li>
              <li><strong>Combined contraceptives / HRT in females:</strong> bodyweight cycling may be exogenous-driven; the engine does not chase apparent fluctuations.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Bridge Mode — Staged Ramp for Chronic Under-Eaters (added 2026-05-25)</p>
            <p>When a client cannot physically execute the bodyweight-derived calorie floor (chronic under-eating, severe appetite suppression, post-illness recovery), tick <strong>Transitional plan (bridge mode)</strong> on the suggest page. A justification (≥20 chars) is required and stored for audit. The bridge floor + ceiling are auto-suggested from the client&apos;s context (medications, baseline bodyweight, recent check-in language) — Claude drafts a clinical justification using actual check-in quotes; you edit if needed.</p>
            <p className="mt-2"><strong>The ramp</strong> — bridge plans default to a 2-week expiry, one stage per plan, +200 kcal per stage (= 100 kcal/week, the reverse-dieting safe pace). Step-up presets on regenerate: <code>[+200 kcal]</code>, <code>[+300 kcal]</code>, <code>[Remove override]</code>. The coach nutrition page shows the full ramp as a progress bar with current stage → next stage → target.</p>
            <p className="mt-2"><strong>Readiness signal</strong> — the bridge banner reads the latest 2 weekly check-ins for eating-consistency markers via <code>detectBridgeReadiness</code>. When positive markers fire (&quot;hitting protein&quot;, &quot;meal prep on track&quot;, &quot;appetite returning&quot;) AND no negatives (&quot;still struggling&quot;, &quot;skipping meals&quot;), the banner shows a green &quot;Ready to step up&quot; card with a regenerate link. Conservative — any negative marker keeps the bridge active.</p>
            <p className="mt-2"><strong>When the bridge expires</strong> — Today&apos;s Focus surfaces <code>active_bridge_expiring</code> within 7 days of expiry (amber), <code>active_bridge_expired</code> past expiry (red), <code>active_bridge_ready_step_up</code> when readiness fires regardless of timer. An always-visible &quot;Bridge Nd&quot; badge sits next to the client name in Today&apos;s Focus while a bridge is active.</p>
            <p className="mt-2"><strong>What the client sees</strong> — the portal /my-plan page shows a friendly framing card above the nutrition reading: &quot;You&apos;re at 1,700 kcal/day for the next 2 weeks. From there we&apos;ll step you up gradually (next stage: 1,900 kcal) until you reach your full target of ~2,200 kcal in about 6 weeks.&quot;</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Doctrine Versioning + Stale Hint (added 2026-05-26)</p>
            <p>Every plan is stamped with the current nutrition doctrine version at generation time (format <code>YYYY-MM-DD[.N]</code>). The coach plan view diffs this against the current value via <code>isDoctrineStale(plan.doctrine_version, &apos;nutrition_plan&apos;)</code> — when stale AND the plan has a non-null version, a soft [#F4F6F9] &quot;Doctrine update available&quot; card appears below the identity card with a regenerate CTA. Plans with null version (generated before the migration) are grandfathered and show nothing. <strong>Single source of truth: <code>src/lib/doctrine-versions.ts</code> (<code>DOCTRINE_VERSIONS.nutrition_plan</code>)</strong> — bump there when you ship a meaningful validator rule / threshold / prompt change. The legacy <code>NUTRITION_DOCTRINE_VERSION</code> in <code>nutrition-validation.ts</code> is now a re-export of the consolidated source (do not edit it directly; that was the cause of the 2026-06-22 staleness regression where freshly regenerated plans appeared stale immediately).</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Validator Telemetry Dashboard (added 2026-05-26)</p>
            <p>Every validation attempt (the 3 parallel Haiku + the Sonnet escalation if it fires) writes a row to <code>nutrition_validator_events</code>. The dashboard at <strong>/dashboard/system-health/nutrition-engine</strong> aggregates these:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>Headline numbers: % first-pass Haiku, % retry / Sonnet, % 422 to coach</li>
              <li>Per-rule fire-rate table — sortable, doctrine-version filterable</li>
              <li>Rules firing in &gt;25% of requests get a red row tint (calibrated &quot;needs tuning&quot; threshold)</li>
            </ul>
            <p>Use this to spot doctrine regressions (&quot;rule X started firing 60% the day after I shipped v.X&quot;) and to decide when to relax a rule that&apos;s too tight for real-world plans.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Step 3 - Draft Review</p>
            <p>The generated plan appears on the client&apos;s Nutrition Plan page under a <strong>Draft - Pending Approval</strong> banner. Review the full output: entry state summary, meal structure (per-meal macros and foods, including per-ingredient P/C/F/kcal breakdown), training day adjustments, execution rules, what not to change, and progression notes. Use <strong>Discard Draft</strong> to delete it or <strong>Approve Plan</strong> to promote it to active.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Client View Preview (added 2026-05-28)</p>
            <p>The <strong>Client view</strong> and <strong>Document</strong> buttons on the nutrition reading panel open a modal overlay rendering the client&apos;s portal page inside an iframe. You see exactly what the client sees, pixel-perfect, without leaving the coach dashboard. Close via Esc, backdrop click, or the X button. Coach scroll position and draft state are preserved across the round trip. Same pattern applies to the Foundational Reading and Program Reading panels.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Step 4 - Weekly Review (Client Portal)</p>
            <p>The weekly nutrition review is submitted by the client through their portal. The client reports adherence, what they noticed (one or more signals), the overall direction, and optional notes. You see the answers as a question/answer feed on the Nutrition Plan page.</p>
            <p className="mt-2"><strong>What they noticed signals:</strong> Under-fuelled / Over-fuelled / Recovery issues / Hard to stick to / Feeling good. Clients can select multiple.</p>
            <p className="mt-2"><strong>Direction labels - what they mean and what to do:</strong></p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li><strong className="text-green-400">Making progress</strong> - client feels on track, plan is working. No action needed. Continue the current plan.</li>
              <li><strong className="text-[#A96A12]">Staying steady</strong> - no notable change. Monitor for a week or two. Consider whether macros need a small adjustment.</li>
              <li><strong className="text-[#C82626]">Struggling</strong> - client is not coping with the plan (hard to follow, under-fuelled, recovery issues). Action required. A red banner will appear on the Nutrition Plan page. Review the check-in notes, write coach feedback, and consider adjusting or regenerating the plan. The AI will factor this history into the new prescription.</li>
            </ul>
            <p className="mt-2"><strong>Coach notes:</strong> Click <strong>+ Add feedback for client</strong> under any review entry to write a note back to the client. This appears on their portal home page under &quot;From your coach&quot;.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Key Concepts</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Entry State</strong> - The control variable that locks modulation permission. Four states: Stabilisation, Training Support, High Output Support, Recovery Reset.</li>
              <li><strong>Modulation Permission</strong> - Prohibited (Stabilisation/Recovery Reset), Restricted (Training Support), Permitted (High Output Support). The engine cannot override this boundary.</li>
              <li><strong>Protein Anchor</strong> - Fixed daily protein target distributed evenly across meals. Non-variable by design.</li>
              <li><strong>Carb Demand Level</strong> - Must respect the entry state ceiling. Stabilisation/Recovery Reset → Low only. Training Support → up to Moderate. High Output → up to High.</li>
            </ul>

            <Note>The weekly review is client-submitted. The client sees a Nutrition Check-In card in their portal whenever they have an active plan. You see results only - no data entry required on the coach side.</Note>
          </Section>

          {/* Nutrition Reading - client-facing translation of the active plan */}
          <Section id="nutrition-reading" title="22b. Nutrition Reading - Client Facing" colour="teal">
            <p>The Nutrition Reading is the client-facing translation of the active nutrition plan. It sits at the top of the client&apos;s nutrition plan page (the portal&apos;s /my-plan view) so the &ldquo;why this plan&rdquo; frames every meal they open. It is the bridge from the Foundational Reading (state and patterns) to the prescription (meals, macros, structure), written so the client understands what this plan is for, what it will ask of their body, and how we will read it as it unfolds.</p>

            <p>It is generated by Claude Haiku 4.5 using the client&apos;s latest published Foundational Reading as the state context plus the active nutrition_plans row as the prescription context. The three readings (Foundational, Program, Nutrition) read as one voice. The Foundational Reading sets the state; the Program Reading shows how the state shapes the block; the Nutrition Reading shows how the state shapes how we feed the body right now.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">How to publish a Nutrition Reading</p>
            <p>On the client profile, open <strong>Nutrition Plan</strong>. The <strong>Nutrition Reading - Client Facing</strong> panel sits directly above the active plan body. Click <strong>Generate &amp; Publish</strong>. The reading:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li>Reads the latest published Foundational Reading for voice and state context (required — the panel will refuse to generate without one).</li>
              <li>Reads the active nutrition plan row (entry state, PTS phase, carb demand, modulation level, active strategies, key priorities, structure / progression notes, entry state summary).</li>
              <li>Auto-publishes on first generation. <strong>No client email here.</strong> The notification is now a separate coach-gated step (see Notify Client below).</li>
              <li>Per-plan: each new nutrition plan row gets its own reading. Regenerating a plan creates a new row, which triggers a fresh reading.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Notify Client (2026-06-09)</p>
            <p>Reading-published auto-emails were scrapped 2026-06-09 across Foundational Reading, Program Reading, and Block-End Trajectory Reading. The Body Recode product position is now: <strong>only plan publishes notify the client</strong>. One Notify per training block, one Notify per nutrition plan — no more reading-publish noise. Readings still generate and live in the portal; they just don&apos;t email.</p>
            <p>Once the active nutrition plan has a published Nutrition Reading, a <strong>Notify Client</strong> button appears in the plan view header. Click to send the new-plan email to the client and stamp <code className="bg-[#EFF1F4] px-1 rounded text-[#1B6DFC] text-[12.5px]">nutrition_plans.published_to_client_at</code>. If the client was already notified for this plan, the button label switches to <strong>Notify Again</strong> with the prior send date shown — useful when a plan revision is significant enough to warrant a second nudge. The Training Program view carries a mirror button stamping <code className="bg-[#EFF1F4] px-1 rounded text-[#1B6DFC] text-[12.5px]">programs.published_to_client_at</code>.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Five sections</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>01 Why this plan</strong> - Anchors the plan in the body state from the Foundational Reading. What we are trying to support with food right now, in the client&apos;s own language.</li>
              <li><strong>02 What this nutrition is doing</strong> - Translates the design into outcomes: energy stability, recovery capacity, training tolerance, digestion settling. Never calories or macros.</li>
              <li><strong>03 How we will know it is working</strong> - Felt and observed signals (energy, sleep, hunger pattern, recovery, training feel, consistency). No weight or body composition criteria.</li>
              <li><strong>04 What we are not doing yet</strong> - Plan-level non-directives (no aggressive deficit, no restriction, no protocols). When fat loss is mentioned, must reframe as a downstream consequence.</li>
              <li><strong>05 A note from your coach</strong> - Short personal close in Kade&apos;s voice.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Coach Guidance and inline edits</p>
            <p>Same affordances as the Foundational Reading and Program Reading panels:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Coach Guidance</strong> is a standing notes textarea applied on every Generate / Regenerate of this plan&apos;s reading. Use it to steer framing for THIS plan (e.g. &quot;client has a long history of restrictive dieting, frame this strongly around fuel and stabilisation&quot;). Persists across regenerations; each new nutrition plan starts fresh.</li>
              <li><strong>Inline section edits</strong> via the pencil icon on each section — these are surface fixes only. Coach Guidance is the way to teach the model.</li>
              <li><strong>Unpublish / Republish</strong> toggle takes the reading down from the portal without deleting it. The client view falls back gracefully.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Content rules</p>
            <p>Same content rules as the Foundational Reading and Program Reading, adapted to nutrition: no calorie or macro numbers, no specific food names (food categories allowed), no meal timing prescriptions or fasting protocols, no diagnoses, no causal claims, no em dashes, no exclamation marks. The body is interpreted as coherent, never broken. Conservative resolution overrides optimistic interpretation. Whenever the &quot;not doing yet&quot; section touches on fat loss or weight, the AI must reassure the client that body composition changes typically follow as a downstream consequence of stabilising the underlying system first.</p>

            <Note>The Nutrition Reading is per-plan, not per-client. Each new nutrition_plans row gets its own reading. Regenerating a plan clears the prior reading state on the new row and creates a fresh canvas. The Foundational Reading is the constant; the Program Reading and Nutrition Reading evolve alongside each block and plan.</Note>
          </Section>

          {/* ── BUSINESS ENGINE ─────────────────────────────── */}

          <Section id="business-engine" title="Business Engine - Overview" colour="amber">
            <p>The Business Engine is the operating layer that runs the business side of Body Recode - everything from lead capture to bookings, payments, automations, campaigns, and analytics. It lives under <strong>Business</strong> in the main nav and replaces all external tools (Calendly, GHL, etc).</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Modules</p>
            <div className="grid gap-1.5">
              {[
                { label: 'CRM', desc: 'Kanban pipeline board - track every lead through the 8-stage conversion pipeline' },
                { label: 'Bookings', desc: 'Full booking system replacing Calendly - auto-creates Zoom, sends .ics to both parties' },
                { label: 'Automations', desc: 'Visual workflow builder - trigger sequences on any event with real wait steps' },
                { label: 'Campaigns', desc: 'Email/SMS broadcast builder - send to filtered contact lists with personalisation' },
                { label: 'Funnels', desc: 'Public lead capture pages at bodyrecode.au/f/[slug] - leads flow straight into CRM' },
                { label: 'Inbox', desc: 'One email thread per lead - full event history + compose directly from the platform' },
                { label: 'Payments', desc: 'Manual + Stripe-recorded payments. Product catalogue. Revenue stats.' },
                { label: 'Analytics', desc: 'Live business metrics - revenue, leads, conversion rate, show-up rate, pipeline breakdown' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3 bg-[#EFF1F4]/50 rounded-lg px-3 py-2">
                  <span className="text-[#A96A12] font-semibold text-[12.5px] shrink-0 mt-0.5 w-24">{item.label}</span>
                  <span className="text-[#666D7A] text-[12.5px]">{item.desc}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section id="ceo-dashboard" title="CEO Dashboard - Company Scorecard" colour="amber">
            <p>The CEO Dashboard lives at <strong>CEO Scorecard</strong> in the sidebar (Business group) (<strong>/dashboard/scorecard</strong>). It is the one-glance view of whether the business is winning this week. It is built on the rule from Ryan Deiss&apos;s Scalable Operating System: <strong>the scorecard mirrors your Value Engines</strong> - every metric maps to a stage in how Body Recode acquires customers (Growth Engine) or serves them (Fulfilment Engine), plus the cash view.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">What you see</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Four hero cards</strong> - MRR, Cash This Week, Active Clients, Check-In Rate. The numbers a CEO glances at first.</li>
              <li><strong>Growth Engine trend table</strong> - week over week (6 completed weeks + this week to date): New Leads, Decode/Digital Sales, Challenge Enrollments, Zoom Calls, Blueprint Sales, New Coaching Clients, Cash Collected. Each row is traffic-lit against its target on the <strong>last completed week</strong> (so a part-finished current week never shows a false red). This week&apos;s column is shown in grey as a pacing figure, not scored.</li>
              <li><strong>Fulfilment &amp; Cash snapshots</strong> - point-in-time cards (MRR, Active Coaching Clients, Active Members, Check-In Completion %, Payments Overdue) each showing Target / Actual / Status.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">How the status colours work</p>
            <StatusList items={[
              { label: 'On Track', desc: 'Blue - at or above target (or at/below, for "lower is better" metrics like Overdue)' },
              { label: 'Watch', desc: 'Amber - within ~20% of target but not there yet' },
              { label: 'Off Track', desc: 'Red - missing target with no buffer' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Setting your targets</p>
            <p>Targets are not edited in the UI (yet). They live in code at <strong>src/lib/scorecard.ts</strong> in the <strong>TARGETS</strong> object - one number per metric. Review them at the start of each quarter (Deiss&apos;s Quarterly Sprint cadence): edit the numbers, redeploy. The values shipped are draft placeholders, so the board will read red until you set real targets.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">The Weekly Pulse ritual</p>
            <p>The dashboard is run as a 15-minute weekly ritual (Deiss&apos;s &quot;Pulse&quot; meeting). Every <strong>Monday 7am Brisbane</strong> a cron freezes the week&apos;s numbers into <code>scorecard_snapshots</code> and emails Kade the <strong>Weekly Pulse</strong> - the scorecard already read: how many metrics are off track, a &quot;Needs you this week&quot; card, what improved, the full table with week-over-week deltas, and a link to the board. The email is both the reminder and the pre-read, so the review is about deciding, not discovering.</p>
            <p className="mt-2">Open the <strong>&quot;Run the weekly review&quot;</strong> panel at the top of the scorecard for the steps. In short: read the Status column (it scores the week that just closed), and for every red or amber write the ONE move that turns it toward green this week - then drop those into Today&apos;s Focus. Leave greens alone; one red week is noise, act on a 3-week trend, pivot the plan only monthly. Full SOP: <code>06_SAAS_PLATFORM_BUILD/2026-06-28_Weekly_Pulse_Operating_Manual.md</code>.</p>

            <Note>Everything is auto-pulled live from Supabase/Stripe - there is no manual data entry. (Deiss prescribes manual entry so a team &quot;owns its numbers&quot;; with a live system and a near-solo operator that is friction with no payoff, so we auto-pull.) Metrics read from the same tables the rest of the platform uses: leads, digital_asset_purchases, challenge/blueprint/membership enrollments, client_subscriptions, client_payment_plan, weekly_checkins. <strong>Off-platform revenue is counted too:</strong> manually-recorded payments (Business → Payments → Record payment) flow into Cash Collected, and active clients on a billing package with no Stripe subscription have their package value added to MRR - so direct-deposit clients (e.g. someone paying by weekly bank transfer) aren&apos;t invisible. Weekly snapshots are now persisted (the Monday Pulse cron) so the point-in-time metrics also get real week-over-week history. Roadmap: a shared bank-transaction ledger (Basiq → NAB) for the accounting build will make every dollar reconcile automatically; until then off-platform payments are logged via Record payment. Coming in v2: inline-editable targets and per-row sparklines.</Note>
          </Section>

          <Section id="be-crm" title="23. CRM & Pipeline" colour="amber">
            <p>The CRM is a Kanban board showing every lead as a card in one of 8 pipeline stages. It is the single source of truth for all pre-client contacts.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Pipeline Stages</p>
            <StatusList items={[
              { label: 'New Lead', desc: 'Just entered - not yet contacted or reported' },
              { label: 'Report Sent', desc: 'Performance report has been sent' },
              { label: 'Zoom Booked', desc: 'Zoom call scheduled' },
              { label: 'Zoom Completed', desc: 'Zoom done - decision made' },
              { label: 'Foundational Read Paid', desc: 'Payment received - awaiting subscription' },
              { label: 'Active Client', desc: 'Converted - now in coaching dashboard' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Contact Detail</p>
            <p>Click any lead card to open the contact detail page. From here you can:</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Edit contact details</strong> - click Edit contact details to update name, email, and phone in-place</li>
              <li><strong>Move pipeline stage</strong> - use the stage mover to advance or move back through the 8 stages</li>
              <li><strong>Edit notes</strong> - freeform notes field, auto-saves on blur</li>
              <li><strong>Quick links</strong> - jump to Performance Report, Zoom Companion, or the converted client profile (if applicable)</li>
              <li><strong>Coaching Tools</strong> - opens the lead detail page in the main coaching dashboard</li>
            </ul>

            <Note>Pipeline stages update automatically when a booking is made or a Stripe payment completes. You can also move them manually using the stage mover on the contact detail page.</Note>
          </Section>

          <Section id="be-bookings" title="24. Bookings" colour="amber">
            <p>The booking system replaces Calendly entirely. All Zoom calls are booked through <strong>bodyrecode.au/book</strong> - a public page showing available slots. When a lead books, a Zoom meeting is created automatically and a calendar invite (.ics) is emailed to both the lead and you.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Availability</p>
            <p>Manage your Zoom availability at <strong>Business → Availability</strong>. You can add or remove day-of-week rules, set start/end times, slot duration, and buffer gaps. Toggle a rule active or paused without deleting it. Changes take effect immediately - the public booking page at bodyrecode.au/book shows slots for the next 14 days.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Blocked Times</p>
            <p>If something comes up in your diary, use <strong>Business → Availability → Block out time</strong> to block a specific date and time range. Blocked times are excluded from the public booking page so leads cannot book those slots. Add an optional reason for your own reference. The calendar feed sync is one-way - personal diary events don&apos;t automatically block platform slots, so manually add a block here when needed.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">What Happens on Zoom Booking</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li>Zoom meeting created automatically - join link emailed to both parties via branded dark email</li>
              <li>Lead record created or updated in CRM</li>
              <li>Pipeline stage moves to Zoom Booked</li>
              <li>Automation trigger fires - any workflows on booking_created will run</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Face-to-Face Session Booking (from Client Portal)</p>
            <p>Face-to-face clients can reschedule a session directly from their portal. When they book a slot, a <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">client_sessions</code> record is created with <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">status = scheduled</code>, and a branded confirmation email goes to both the client and you. Booked slots are blocked and won&apos;t appear for other clients.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Session Reminder Emails</p>
            <p>Every day at 8:00 am Brisbane time, a cron job scans for sessions scheduled in the next 20–28 hours that haven&apos;t had a reminder sent yet. The client receives a branded email with a <strong>Confirm attendance →</strong> button. Clicking that link marks the session as confirmed (<code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">confirmed_at</code> is set) and notifies you by email. The session then shows a <strong>Confirmed</strong> badge in the portal and on the dashboard client profile. If the session is already confirmed, the link shows a friendly &quot;already confirmed&quot; message instead.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Calendar Auto-Sync (Mac Calendar)</p>
            <p>All scheduled bookings sync automatically to your Mac Calendar via a <strong>webcal subscription</strong>. The feed URL is:</p>
            <p className="mt-1 font-mono text-[12.5px] text-[#1056D6] bg-[#FFFFFF] rounded-lg px-4 py-2">webcal://bodyrecode.au/api/calendar/feed?key=CALENDAR_FEED_KEY</p>
            <p className="mt-2">To subscribe: open Calendar on your Mac → File → New Calendar Subscription → paste the webcal:// URL → set auto-refresh to Every 15 Minutes. The calendar updates automatically as bookings are made or changed. No manual export needed.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">IG Story Posting Reminders (Mac Calendar)</p>
            <p>Your ~3-a-day Body Recode IG story posting slots sync the same way, as a separate calendar (with a 5-minute alert on each, the caption, the graphic download link, and the link-sticker destination). The feed URL is:</p>
            <p className="mt-1 font-mono text-[12.5px] text-[#1056D6] bg-[#FFFFFF] rounded-lg px-4 py-2">webcal://bodyrecode.au/api/calendar/feed/stories?key=CALENDAR_FEED_KEY</p>
            <p className="mt-2">Use the <strong>same key</strong> as the bookings feed above (just change the path to <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/feed/stories</code>). Subscribe the same way (New Calendar Subscription → auto-refresh Every 15 Minutes). Once subscribed it is fully automatic - new stories, copy changes, and the weekly Blueprint beat all flow in with no manual import. <strong>One-time:</strong> if you previously imported a static story-reminders file, delete that calendar first so it does not double up with the live feed.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Manual Bookings</p>
            <p>You can also create bookings from <strong>Business → Bookings → New Booking</strong>. Select the contact, type (Zoom or Other), date/time, and duration. Zoom is created automatically. The lead/client receives a branded confirmation email with the Zoom link, .ics calendar invite, and scheduled 2-hour and 30-minute reminders. You also get a coach notification with the .ics attached. (The legacy Zoom 1 / Zoom 2 split was deprecated 2026-04-29 - the funnel is now single-call.)</p>

            <Note>The Zoom booking page is fully public - share the link bodyrecode.au/book anywhere. It shows available times for the next 14 days. After booking, the lead is redirected to performance.bodyrecode.au.</Note>
          </Section>

          <Section id="be-automations" title="25. Automations" colour="amber">
            <p>The Automations page (<strong>Business → Automations</strong>) has three sections: <strong>System Automations</strong> (fire without any action from you), <strong>Manual Triggers</strong> (fire when you explicitly trigger them from the lead page), and <strong>Custom Workflows</strong> (user-built sequences via the workflow editor).</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">System Automations</p>
            <p>These run automatically. You cannot break them by doing nothing - they are always active.</p>
            <StatusList items={[
              { label: 'Scorecard Follow-up Sequence', desc: '5-email sequence over 13 days. Fires when someone completes the Readiness Scorecard. Voice leads with fat loss / buyer language; body state vocabulary used as the diagnostic frame. Emails 1-2 drive the $37 report; emails 3-4 drive the free strategy call; email 5 names both options based on state.' },
              { label: 'Performance Report Follow-up (retired)', desc: 'RETIRED 24 Aug 2026. Cannot fire on a new purchase - the $37 Body Decode Report is no longer sold, because The Body Decode gives the same five-part read free on day 5. Delivery of already-purchased reports still works.' },
              { label: 'Zoom Booking Confirmation', desc: 'Confirmation + .ics, 2-hour reminder, 30-minute reminder, coach notification. Fires automatically when a lead books via bodyrecode.au/book. Single Zoom call covers diagnosis through pricing through decision (Zoom 1 / Zoom 2 split deprecated 2026-04-29).' },
              { label: 'Self-Guided Program Offer', desc: '$97 program offer email. Fires automatically as part of the Zoom 1 Declined sequence below - no second action needed.' },
              { label: 'Program Buyer Nurture', desc: '3-email sequence at Week 4, 8, and 12. Fires automatically when the $97 program is purchased via Stripe.' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Manual Triggers</p>
            <p>These require a judgement call from you. Set the lead status first, save, then the trigger button appears on the lead detail page.</p>
            <StatusList items={[
              { label: 'No-show Re-engagement', desc: 'Set status to Closed - No Show → save → click Start Re-engagement Sequence on the lead page. 3 emails: Day 1, Day 4, Day 10.' },
              { label: 'Zoom 1 Declined Follow-up', desc: 'Set status to Closed - Declined → save → click Start Declined Follow-up on the lead page. 3 emails: Day 1, Day 5, Day 12. The $97 downsell offer fires automatically alongside it.' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Custom Workflows</p>
            <p>Build your own sequences triggered by any event. The Scorecard Follow-up Sequence lives here as a custom workflow - it is listed under System Automations for reference but executed as a DB workflow via the Inngest background job engine.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Triggers</p>
            <StatusList items={[
              { label: 'lead_created', desc: 'A new lead enters the system for the first time' },
              { label: 'booking_created', desc: 'Any booking is made (filter by type: zoom)' },
              { label: 'payment_completed', desc: 'A payment is recorded as paid' },
              { label: 'pipeline_stage_changed', desc: 'A lead moves to a specific stage' },
              { label: 'tag_added', desc: 'A tag is applied to a lead' },
              { label: 'form_submitted', desc: 'A funnel form is submitted' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Step Types</p>
            <StatusList items={[
              { label: 'Send Email', desc: 'Email to the contact - supports {{first_name}}, {{contact_email}}, {{contact_phone}}' },
              { label: 'Notify Coach', desc: `Email to ${coach().email} with a custom message` },
              { label: 'Wait', desc: 'Pause the sequence - set minutes, hours, or days. Held durably in the cloud.' },
              { label: 'Add Tag', desc: 'Apply a tag to the lead' },
              { label: 'Remove Tag', desc: 'Remove a tag from the lead' },
              { label: 'Move Stage', desc: 'Move the lead to a specific pipeline stage' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Building a Workflow</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li>Go to <strong>Business → Automations → New Workflow</strong></li>
              <li>Select a trigger and configure any trigger filters (e.g. only fire on zoom1 bookings)</li>
              <li>Add steps - drag to reorder</li>
              <li>Toggle the workflow active when ready</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Scorecard Follow-up Sequence (Custom Workflow)</p>
            <p>The 9-step sequence lives as a custom workflow in the DB. It uses trigger <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">form_submitted</code> with <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">{`{ form: 'scorecard' }`}</code>. Emails are personalised using:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-2">
              <li><code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">{`{{scorecard_score}}`}</code> - e.g. 7</li>
              <li><code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">{`{{scorecard_state}}`}</code> - e.g. Transitioning State</li>
              <li><code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">{`{{first_name}}`}</code> - lead&apos;s first name</li>
            </ul>
            <p className="mt-2">The <strong>Re-sync</strong> button on the workflow row rewrites the steps with the latest copy. It does not affect sequences already running for existing leads.</p>
            <Note>Wait steps are handled by Inngest - a background job service. A "wait 3 days" step will actually wait 3 days, even across server restarts.</Note>
          </Section>

          <Section id="be-campaigns" title="26. Campaigns" colour="amber">
            <p>Campaigns let you send a one-time email or SMS broadcast to a filtered list of contacts. Unlike automations (which are triggered per contact), a campaign goes out to everyone in the selected audience at once.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Creating a Campaign</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li>Go to <strong>Business → Campaigns → New Campaign</strong></li>
              <li>Set a name, type (Email, SMS, Social), and subject line (email only)</li>
              <li>Write the body - use <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">{`{{first_name}}`}</code> to personalise</li>
              <li>Choose your audience: All Leads, All Clients, a specific Pipeline Stage, or a Tag</li>
              <li>Save as draft, send now, or schedule for a specific date and time</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Sending</p>
            <p>Once sent, the campaign status changes to <strong>Sent</strong> and the recipient count is recorded. Sent campaigns are locked - they cannot be edited.</p>

            <Note>Campaigns send via Resend (email). SMS campaigns are not yet active - the field is there for when Twilio is integrated.</Note>
          </Section>

          <Section id="be-funnels" title="27. Funnels" colour="amber">
            <p>Funnels are public lead capture pages hosted at <strong>bodyrecode.au/f/[slug]</strong>. Anyone who submits the form is automatically created as a lead in your CRM. Share the link anywhere - social, ads, email.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Creating a Funnel</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li>Go to <strong>Business → Funnels → New Funnel</strong></li>
              <li>Set a name - the URL slug is generated automatically (you can edit it)</li>
              <li>Write the page: headline, subheadline, body copy, CTA button label</li>
              <li>Choose what happens after submit: redirect to the booking page (/book) or show a thank-you message</li>
              <li>Toggle it live when ready</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">What Happens on Submit</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li>Lead is created in CRM (or updated if already exists)</li>
              <li>Source is recorded as &apos;funnel&apos;</li>
              <li>Automation triggers fire: lead_created + form_submitted</li>
              <li>Lead is redirected to /book or shown the thank-you screen</li>
            </ul>

            <Note>Toggle a funnel off at any time to disable the public page without deleting it.</Note>
          </Section>

          <Section id="be-inbox" title="28. Inbox" colour="amber">
            <p>The Inbox is a two-way email system - one conversation thread per contact. Every email you send and every reply you receive shows in the same chronological thread.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">What Shows in the Thread</p>
            <p>Every lead event is logged to the thread automatically:</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li>Emails you sent - shown in teal</li>
              <li>Replies from the lead - shown in blue as &quot;Reply received&quot;</li>
              <li>Zoom bookings</li>
              <li>Automations and sequences (follow-ups, re-engagement)</li>
              <li>Check-ins submitted</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Sending an Email</p>
            <p>Open a contact from the inbox list, type a subject and message in the compose box at the bottom, and click Send. The email goes via Resend with a reply-to of {brand().replyToEmail} and is logged back into the thread immediately.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Receiving Replies</p>
            <p>When a lead replies to any email from you, their reply routes to replies.bodyrecode.au via Postmark. The platform matches the sender email to their lead record and logs it as a &quot;Reply received&quot; event in their thread. Refresh the thread page to see new replies.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Inbox List</p>
            <p>Contacts are sorted by most recent activity - whoever you last interacted with appears at the top. The preview shows the last event or email subject and the event count.</p>

            <Note>Replies are matched by the sender&apos;s email address. If a lead replies from a different address than what&apos;s on their record, the reply will not appear in their thread.</Note>
          </Section>

          <Section id="be-payments" title="29. Payments" colour="amber">
            <p>The Payments module records all revenue - both automatic (Stripe webhooks) and manual entries. It also holds your product catalogue and generates Stripe Payment Links on demand.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Payment Links</p>
            <p>Each product has a <strong>Get Link</strong> button. Click it once and Stripe generates a permanent payment link for that product - it then flips to <strong>Copy Link</strong>. Paste it anywhere: email, SMS, DM. The link never expires.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Products</p>
            <StatusList items={[
              { label: 'Coaching Foundational Read', desc: '$297 - one-time. Send to every lead who agrees to proceed at the Zoom call.' },
              { label: 'In-Person 1x + self-led', desc: '$139/week recurring - lead with this on the Zoom' },
              { label: 'In-Person 2x', desc: '$189/week recurring' },
              { label: 'In-Person 3x', desc: '$225/week recurring - coach-assessed, offer during check-ins' },
              { label: 'Online Coaching', desc: '$69/week recurring' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Automatic Recording</p>
            <p>Stripe payments are recorded automatically via webhooks - Foundational Read, weekly subscription payments, failures, and cancellations. You do not need to log them manually.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Manual Payments</p>
            <p>Use <strong>Record Payment</strong> to log cash, bank transfer, or any payment that didn&apos;t come through Stripe.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Failed Payments</p>
            <p>When a subscription payment fails, the payment is recorded with a <strong>Failed</strong> status and you receive a notification email. Follow up with the client directly - Stripe will retry automatically.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Sub-pages</p>
            <p>Payments now has three tabs (sub-nav across the top):</p>
            <StatusList items={[
              { label: 'Overview', desc: 'The page above. Products, payment history, manual record, generate payment links.' },
              { label: 'Clients', desc: 'Every client one row — plan, Foundational Read status, live subscription status, next charge, last paid, lifetime PC value. Sorted with attention-needed rows on top.' },
              { label: 'Reconcile', desc: 'Run the Stripe backfill (matches Stripe customers to client records by email and hydrates the subscription cache), see clients with no Stripe link, and tag every product by stream (Performance Coaching / Body Recode / The Collective / Overhead).' },
            ]} />
          </Section>

          <Section id="payments-tracker" title="29b. Client Payment Tracker" colour="amber">
            <p>The Payments tracker answers two questions in one place: <strong>is every active client paying you what they should be</strong>, and <strong>is every recurring subscription correctly set up</strong>. It lives on top of the existing Stripe webhook plumbing — no new external software, no new monthly cost.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">First-time setup (run once)</p>
            <StatusList items={[
              { label: 'Run Supabase migration', desc: 'sql/2026-05-13_payments_tracker.sql. Done 2026-05-13. Adds clients.stripe_customer_id, be_products.category, plus client_subscriptions / payment_plans / client_payment_plan tables.' },
              { label: 'Run Stripe backfill', desc: 'Business → Payments → Reconcile → "Run Stripe backfill". Pages every Stripe customer, matches to your client records by email, populates stripe_customer_id, and hydrates the subscription cache. Safe to re-run. Takes ~30 seconds depending on volume.' },
              { label: 'Tag your products', desc: 'Same Reconcile page, "Product Categories" section. Drop each product into a stream: Performance Coaching (counts toward client LTV), Body Recode (report / Blueprint / Membership), The Collective, Overhead, Other.' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Per-client view</p>
            <p>On any client profile, scroll to the <strong>Payments</strong> section (also reachable via the sidebar). It shows:</p>
            <StatusList items={[
              { label: 'Plan', desc: 'Which payment plan they\'re assigned to (default: "Hormozi default" — $297 Foundational Read + weekly recurring). Foundational Read status: paid + date, or "not paid" with a manual mark button.' },
              { label: 'Subscription', desc: 'Live status from Stripe — Active / Past due / Canceled / etc. Amount, billing interval, next charge date. "Cancels at period end" badge if applicable.' },
              { label: 'Lifetime (PC)', desc: 'Sum of paid Performance Coaching payments for this client. Filtered by product category — Body Recode / The Collective / Overhead payments do not count.' },
              { label: 'Last 5 payments', desc: 'Recent history with product, amount, status, date.' },
              { label: 'Health flags', desc: 'Red callout box at the top if anything\'s wrong: Foundational Read not paid, no active subscription, subscription past due, no Stripe customer linked.' },
              { label: 'Refresh from Stripe', desc: 'On-demand button. Pulls live subscription state from Stripe and rewrites the cache. Use when you\'ve just changed something in Stripe and want the dashboard to reflect it immediately rather than waiting for a webhook.' },
              { label: 'Open in Stripe', desc: 'Direct link to the Stripe dashboard customer page if you need to manage the subscription itself.' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Cross-cut Client Status table</p>
            <p><strong>Business → Payments → Clients</strong>. One row per client, sorted with attention-needed rows on top: past_due first, then Foundational Read-paid-but-no-sub, then Foundational Read-not-paid, then healthy actives, then canceled. Four count cards at the top (Active / Past due / No active sub / No Foundational Read). Click any row to jump to that client’s Payments section.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">How the cache stays fresh</p>
            <p>Stripe is the source of truth. The cache (<code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">client_subscriptions</code> table) is maintained three ways:</p>
            <StatusList items={[
              { label: 'Webhook', desc: 'On customer.subscription.created/updated/deleted and invoice.payment_succeeded, the webhook calls syncSubscriptionFromStripe() and upserts the cache row. Real-time, no action needed.' },
              { label: 'On-demand refresh', desc: 'The "Refresh from Stripe" button on the per-client Payments section. Use it any time.' },
              { label: 'Periodic backfill', desc: 'Re-run the Stripe backfill from the Reconcile page whenever you suspect drift, after bulk changes in Stripe, or after onboarding new clients via methods the webhook doesn\'t cover.' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">When Foundational Read won’t auto-detect</p>
            <p>The tracker doesn’t yet auto-detect Foundational Reads (you can use the manual <strong>Mark Foundational Read paid</strong> button on any client without one). Auto-detection is queued for Phase 2 once we’ve seen enough real charges to write a reliable rule.</p>

            <p className="text-[12.5px] text-[#98A0AD] mt-4">Doctrine / spec: <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/2026-05-13_PAYMENTS_FOUNDATION.md</code>. Feature registry entry 26.</p>
          </Section>

          <Section id="be-analytics" title="30. Analytics" colour="amber">
            <p>The Analytics page shows live business metrics - no manual data entry required. Everything is calculated from your live CRM, bookings, and payment data.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Metrics</p>
            <StatusList items={[
              { label: 'Revenue', desc: 'Total revenue from all paid payments in the selected period' },
              { label: 'Leads', desc: 'Total leads created' },
              { label: 'Conversion Rate', desc: 'Leads who reached Active Client stage ÷ total leads' },
              { label: 'Show-up Rate', desc: 'Zoom calls that were completed ÷ calls that were booked' },
              { label: 'Pipeline', desc: 'Bar breakdown of how many leads are in each stage right now' },
              { label: 'Lead Sources', desc: 'Where leads came from - direct booking, funnel, or other source' },
              { label: 'Bookings', desc: 'Total bookings, split by type (Zoom, Other)' },
            ]} />

            <Note>All metrics read directly from your live data. The analytics page refreshes on each load - there is no caching delay.</Note>
          </Section>

          <Section id="be-sources" title="31. Lead Sources" colour="amber">
            <p>The Lead Sources page (<strong>Dashboard → Lead Sources</strong>) gives you source-tracked URLs for every channel. Paste any URL into a QR code generator or link in bio tool and every lead that comes through it is automatically tagged with the correct source in the CRM.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">QR Code URLs</p>
            <p>For physical print materials. Each URL passes a source tag through to the lead record on submission.</p>
            <StatusList items={[
              { label: 'Floor Banner', desc: 'bodyrecode.au/not-a-sign-up?source=qr_floor_banner - routes to the Readiness Scorecard' },
              { label: 'Window Decal', desc: 'bodyrecode.au/not-a-sign-up?source=qr_window' },
              { label: 'Business Card', desc: 'bodyrecode.au/not-a-sign-up?source=qr_card' },
              { label: 'Flyer', desc: 'bodyrecode.au/not-a-sign-up?source=qr_flyer - routes to the Readiness Scorecard' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Scorecard URLs</p>
            <p>Use these for Instagram bio, scorecard-specific posts, and DMs to gym members offering complementary first sessions. These link directly to the Readiness Scorecard with source tracking. Use these as the primary link in bio for any channel.</p>
            <StatusList items={[
              { label: 'Instagram', desc: 'performance.bodyrecode.au/scorecard?source=instagram' },
              { label: 'Website', desc: 'performance.bodyrecode.au/scorecard?source=website' },
              { label: 'Facebook', desc: 'performance.bodyrecode.au/scorecard?source=facebook' },
              { label: 'Gym DM (complementary first session)', desc: 'performance.bodyrecode.au/scorecard?source=gym_complementary - for the DM you send gym members who book a complementary session. Maps to source=gym_floor with source_detail=gym_complementary in the CRM for attribution.' },
            ]} />
            <Note>The leads.source column has a CHECK constraint that only accepts a fixed set of values (quiz, other, gym_floor, instagram, facebook, direct). Any unmapped <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">?source=</code> param falls through to <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">source=other</code> with the raw value preserved in source_detail. This was tightened 2026-04-30 after a gym_complementary submission failed. To add a new normalised source, edit <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">SOURCE_MAP</code> in <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">src/app/api/scorecard/submit/route.ts</code>.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Digital Channel URLs</p>
            <p>For the Performance Check-In quiz - use these if sending traffic directly to the longer check-in rather than the scorecard.</p>
            <StatusList items={[
              { label: 'Instagram', desc: 'bodyrecode.au/performance-check-in-quiz?source=instagram' },
              { label: 'Website', desc: 'bodyrecode.au/performance-check-in-quiz?source=website' },
              { label: 'Facebook', desc: 'bodyrecode.au/performance-check-in-quiz?source=facebook' },
              { label: 'Google', desc: 'bodyrecode.au/performance-check-in-quiz?source=google' },
            ]} />

            <Note>The source breakdown at the bottom of the page shows how many leads came from each channel. Use this to evaluate which entry points are producing leads before running ads.</Note>
          </Section>

          <Section id="partner-room" title="Partner Room - Private Investor / Partner Overview" colour="amber">
            <p>A private page you hand to a prospective investor or partner (e.g. someone weighing an investment) so they can look back over the Body Recode story anytime. It walks them through how Body Recode, Performance Coaching, the Collective and Arete fit together as one system - vision-level, no numbers.</p>
            <p className="mt-3"><strong>One room, one door per person.</strong> You mint a personal link per guest. The link itself is the key - no login, no password. It greets them by name, remembers their visits, and you can shut off one person&apos;s link without touching anyone else&apos;s.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">How to use it</p>
            <StatusList items={[
              { label: 'Add a guest', desc: 'Go to Business - Partner Room, type their name (company + a private note are optional), and hit Create link. The link copies to your clipboard automatically - paste it into a message to them.' },
              { label: 'Watch engagement', desc: 'Each guest row shows how many times they have opened their room and when they last did. Someone returning a few times before your next meeting is a strong signal.' },
              { label: 'Revoke or restore', desc: 'Hit Revoke to instantly close one person&apos;s link (they see a polite "no longer active" page). Restore re-opens it. Other guests are unaffected.' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">The one rule</p>
            <p>Keep it vision-level. A link like this can be forwarded, so treat it like a nice business card, not a vault. Anything sensitive - Arete&apos;s regulated detail, real revenue or pricing - stays in person, never behind the link.</p>
            <p className="mt-3 text-sm text-[#666D7A]">Guest link format: <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">app.bodyrecode.au/room/&#123;token&#125;</code>. Data lives in the <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">partner_rooms</code> table.</p>
          </Section>

          <Section id="be-ads" title="32. Ads" colour="amber">
            <p>Meta ads feed the top of the funnel. Clicks go to <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">performance.bodyrecode.au/scorecard</code> where the Meta Pixel (ID <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">972772552072010</code>) fires four events as the prospect moves through the funnel:</p>
            <StatusList items={[
              { label: 'PageView', desc: 'Fires on every page load across performance.bodyrecode.au. Mounted globally in app/layout.tsx via the MetaPixel component.' },
              { label: 'ViewContent', desc: 'Fires when the scorecard page mounts (content_name: scorecard_start). Marks the moment the lead starts engaging with the lead magnet.' },
              { label: 'Lead', desc: 'Fires on successful email submit at the end of the scorecard. content_name: scorecard_complete.' },
              { label: 'InitiateCheckout', desc: 'Fires when the prospect clicks the $37 Body Decode Report button on the result page. value: 37 AUD. content_name: body_decode_report.' },
            ]} />
            <p className="mt-3">The actual Purchase event still needs wiring on bodyrecode.au&apos;s Stripe success page (separate repo) and Schedule on /book confirmation. Until those are wired, conversion attribution stops at InitiateCheckout. All ad-data analysis lives in <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">~/Dropbox/01_BODY_RECODE/07_ADS</code>.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">File Structure</p>
            <p>All ads analysis lives at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">Dropbox/01_BODY_RECODE/07_ADS/</code></p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>New_Leads_Campaign/RAW_DATA/</strong> - drop Meta CSV or Numbers exports here, named with the date range</li>
              <li><strong>New_Leads_Campaign/ANALYSIS/WEEKLY_TRACKER.md</strong> - fill in metrics each week</li>
              <li><strong>New_Leads_Campaign/ANALYSIS/AD_SET_COMPARISON.md</strong> - cumulative ranking and scaling framework</li>
              <li><strong>New_Leads_Campaign/ANALYSIS/DECISIONS_LOG.md</strong> - log every observation and action taken</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Weekly Report - Every Friday</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li>Export data from Meta Ads Manager - Ad Sets tab - set date range - export CSV or Numbers</li>
              <li>Drop the file into <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">RAW_DATA/</code> before 9am Friday</li>
              <li>At 9am Friday, the automated report runs, saves to ANALYSIS/, and emails to {coach().email}</li>
              <li>Report includes: performance table, ranking, observations, scaling recommendation, fatigue warnings</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Active Campaign Setup</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Campaign:</strong> New Leads Campaign - objective: Leads</li>
              <li><strong>Ad sets:</strong> Silent Frustration, Diagnosis, Contrarian - all at $10/day, Australia, broad audience</li>
              <li><strong>Optimisation:</strong> Maximize number of conversions - Body Recode pixel (ID: 972772552072010) - Lead event</li>
              <li><strong>Ad account:</strong> 190093840320613 - under Body Recode Business Manager</li>
              <li><strong>Destination:</strong> <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">performance.bodyrecode.au/scorecard?source=facebook_ad_[adset]</code></li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Pixel</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li>Pixel ID: <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">972772552072010</code> - named Body Recode in Meta</li>
              <li>PageView fires on every page via layout.tsx</li>
              <li>Lead event fires in report-client.tsx when someone lands on their scorecard result</li>
              <li>To verify: Meta Events Manager - Body Recode dataset - Test Events tab - complete the scorecard and confirm Lead event appears</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Scaling Framework</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#43474F] text-sm">
              <li>Run all three ad sets for minimum 7 days before drawing conclusions</li>
              <li>Scale the winner by 20-30% budget increase every 5 days once CPL is confirmed</li>
              <li>Flag creative fatigue if frequency exceeds 2.5</li>
              <li>Lookalike audiences: build once the pixel has 50+ Lead events recorded</li>
            </ul>

            <Note>The automated Friday report reads from RAW_DATA, generates the analysis, and emails it. If no file is dropped before 9am the script will use the most recent file it finds - always drop a fresh export each week.</Note>
          </Section>

          <Section id="be-reels" title="32b. Reels (film, ingest, publish)" colour="amber">
            <p>Talking-head reels are filmed by Kade in the <strong>Captions</strong> app and published natively through the Content Calendar, the same as a feed post. Cold paid ads remain statics only - this is organic Instagram only.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">1. Film</p>
            <p>Batch five scripts in one sitting, roughly 30 minutes. Scripts live in <code>07_MARKETING/03_ORGANIC_INSTAGRAM/BR_REEL_SCRIPTS_WEEK1.md</code>. Vertical 9:16, one idea each, 80% of normal speaking pace, no music.</p>
            <p className="mt-2"><strong>Length: 50 to 70 seconds</strong>, not the 30 to 45 the earlier scripts targeted. That is a deliberate trade - a 35-second lecture holds nobody, while a 60-second read with a real number in the first five seconds holds to the end. Time yourself reading one aloud before trusting any runtime; the script doc has a pace table.</p>
            <p className="mt-2"><strong>Captions AI:</strong> auto-captions, teleprompter, filler trimming, reframing and eye-contact correction are all fine - that is still you, edited faster. <strong>Do not use the AI avatar for doctrine content</strong> and do not export watermarked.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">2. Check the take (reel doctor)</p>
            <p>Run <code>npx tsx scripts/reel-doctor.ts &quot;REELS/01_FILMED_RAW/mon_take*.mp4&quot; --day Mon</code>. It transcribes each take locally with whisper and reports what an editor would look for: portrait check, duration, loudness against Instagram&apos;s -14 LUFS target, words per minute, dead air at each end, every filler with a timecode, every pause over a second, how long the hook took and whether it got a beat after it. With <code>--day</code> it diffs the delivery against the written script and names the words that drifted. Multiple takes get ranked.</p>
            <p className="mt-2">Add <code>--fix</code> to clean up the keeper: trims the dead air, normalises loudness and forces exactly 1080x1920, writing a new file to <code>03_READY_TO_POST</code>. <strong>The original is never modified.</strong></p>
            <p className="mt-2 text-[12.5px] text-[#666D7A]"><strong>What it cannot do.</strong> It cannot hear tone or warmth, cannot see whether your eyes were in the lens, and cannot tell a confident take from a flat one. The ranking is mechanical - treat it as a shortlist that saves you scrubbing through eight takes, not a verdict. Captions still does eye-contact correction and burned captions better.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">3. Drop</p>
            <p>Move the finished file to <code>07_MARKETING/03_ORGANIC_INSTAGRAM/REELS/03_READY_TO_POST</code>. Moving a file between the four folders is the status signal - there is nothing separate to update.</p>
            <p className="mt-2">Name it <code>YYYY-MM-DD_REEL_ShortTitle_v1.mp4</code> using the <strong>publish</strong> date, not the filming date. The date is how the ingest finds which calendar slot the video belongs to; no date means no match, deliberately, because guessing the slot is worse than an error.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">4. Ingest</p>
            <p>Run <code>npx tsx scripts/ingest-reels.ts</code> (add <code>--dry</code> to validate without uploading). It checks the video is portrait, 3 to 90 seconds and within the bucket limit, uploads it to the public Supabase <code>videos</code> bucket, pulls a cover frame with ffmpeg, and attaches both to the calendar row - replacing the TO FILM placeholder.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">5. Publish or schedule</p>
            <p>Once ingested the reel behaves like any other calendar post: publish now, or set a scheduled time and Meta publishes it. The post publishes as a REEL (<code>media_type=REELS</code>) with the cover frame as its thumbnail, and is shared to the feed.</p>
            <p className="mt-2 text-[12.5px] text-[#666D7A]"><strong>Why it can take a few minutes.</strong> Meta transcodes video asynchronously, unlike images which are ready in seconds. The publisher waits up to five minutes for the container to report FINISHED before publishing. A reel that still has its TO FILM placeholder is refused outright, so a placeholder card can never reach the feed.</p>
          </Section>

          <Section id="be-content-engine" title="33. Content Engine" colour="amber">
            <p>The Content Engine generates batches of platform-ready ad copy and reel scripts using a modular hook, message, and CTA library. Everything is generated using Claude AI with the Body Recode brand voice and positioning enforced automatically.</p>
            <p>Navigate to <strong>Business → Content Engine</strong> to access it. The engine has six tabs: Hooks, Messages, CTAs, Generate, Outputs, and Card Library.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Hooks</p>
            <p>A hook is the opening line of a piece of content. It is the first thing the audience reads or hears. Hooks are categorised by awareness level:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Problem Aware</strong> - The audience knows they have the problem but not the solution.</li>
              <li><strong>Solution Aware</strong> - The audience knows solutions exist but not which one.</li>
              <li><strong>Unaware</strong> - The audience does not yet know they have the problem.</li>
              <li><strong>Contrarian</strong> - Challenges a widely-held belief in the space.</li>
              <li><strong>Curiosity</strong> - Opens a pattern interrupt or unexpected question.</li>
              <li><strong>Authority</strong> - Leads with credibility, data, or a specific claim.</li>
            </ul>
            <p className="mt-2">Add hooks via the inline form. Each hook can be assigned a performance score (Unscored, Losing, Neutral, Winning) after deployment based on real-world results.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Messages</p>
            <p>A message is the body of the content - the point being made between the hook and the CTA. Message types:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Education</strong> - Explains a concept or mechanism.</li>
              <li><strong>Myth-busting</strong> - Addresses and corrects a common misconception.</li>
              <li><strong>Story</strong> - A narrative, personal or client-based.</li>
              <li><strong>System Explanation</strong> - Explains the Body Recode methodology or process.</li>
              <li><strong>Authority</strong> - Demonstrates expertise, specificity, or results.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">CTAs</p>
            <p>A CTA is the desired action at the end of the content. Add CTAs as plain text. Examples: &ldquo;Take the free check-in&rdquo;, &ldquo;Book a Zoom call&rdquo;, &ldquo;Link in bio&rdquo;.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Generate</p>
            <p>The Generate tab has two modes:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-2">
              <li><strong>Selective Generate</strong> - Choose specific hooks, messages, CTAs, and one platform. One variant is produced per combination. Use for targeted campaigns or testing specific angles.</li>
              <li><strong>Generate Everything</strong> - One click. Selects every hook, message, and CTA and runs all 5 platforms sequentially. Shows a live progress bar. Use this to build the full content library in a single session.</li>
            </ul>
            <p className="mt-3 text-[12.5px] font-semibold text-[#666D7A]">The maths</p>
            <div className="mt-2 bg-[#EFF1F4]/60 rounded-lg p-4 text-[12.5px] text-[#43474F] font-mono leading-relaxed">
              50 hooks × 5 messages × 3 CTAs = 750 outputs (single platform)<br/>
              50 hooks × 5 messages × 3 CTAs × 5 platforms = 3,750 outputs (Generate All)
            </div>
            <p className="mt-3">From each output you can also produce:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li><strong>Graphic</strong> - 1080×1080 PNG (16 card styles across 4 categories - see Card Styles below). Download and post as a static Instagram or Facebook post.</li>
              <li><strong>Carousel</strong> - 5–7 slides auto-generated by Claude, each rendered as a PNG, downloaded as a ZIP. Upload directly to Instagram as a carousel.</li>
              <li><strong>Reel</strong> - AI avatar video in your voice and likeness (see AI Reel Generation below).</li>
            </ul>
            <p className="mt-2">Platforms:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Meta Ad</strong> - Primary text, 125 characters max, punchy.</li>
              <li><strong>Instagram Caption</strong> - Conversational, 150–200 characters, hook in first line.</li>
              <li><strong>TikTok Script</strong> - Spoken word, 30–45 seconds, casual and direct.</li>
              <li><strong>Email Snippet</strong> - Subject line and 2–3 sentence opener.</li>
              <li><strong>Landing Page</strong> - Headline and subheadline pair.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Outputs</p>
            <p>All generated content is saved to the Outputs tab as drafts. Each output shows the platform, hook category, and the full content text. From each output you can:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-2">
              <li><strong>Copy to clipboard</strong> - paste directly into any platform or ad manager.</li>
              <li><strong>Create Graphic</strong> - choose from 16 card styles (see Card Styles below). Preview and download as 1080×1080 PNG.</li>
              <li><strong>Create Carousel</strong> - Claude breaks the content into 5–7 slides. Preview all slides, download as ZIP.</li>
              <li><strong>Generate Reel</strong> - sends to ElevenLabs (your voice) then HeyGen (your avatar). Download MP4 when ready.</li>
              <li><strong>Update status</strong> - Draft → Approved → Deployed → Winning → Removed.</li>
            </ul>
            <p className="mt-2">Output statuses:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>Draft</strong> - Generated, not yet reviewed.</li>
              <li><strong>Approved</strong> - Reviewed and cleared for deployment.</li>
              <li><strong>Deployed</strong> - Live in a campaign or published.</li>
              <li><strong>Winning</strong> - Confirmed strong performer based on results.</li>
              <li><strong>Removed</strong> - Pulled from use.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">AI Reel Generation</p>
            <p>Any output can be turned into an AI-generated video reel using your cloned voice and AI avatar - no camera, no editing required. Click <strong>Generate Reel</strong> on any output in the Outputs tab.</p>
            <p className="mt-2">The pipeline:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-2">
              <li>The script (editable before submitting) is sent to <strong>ElevenLabs</strong>, which generates audio in your cloned voice.</li>
              <li>The audio is uploaded to secure storage and passed to <strong>HeyGen</strong>, which renders a vertical 1080×1920 MP4 with your AI avatar lip-synced to the audio.</li>
              <li>The output row shows <strong>Rendering reel...</strong> while processing (typically 2–5 minutes).</li>
              <li>When complete, a <strong>Download</strong> link appears. Click it to save the MP4.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Posting the Reel</p>
            <p>Once downloaded, post the MP4 manually to your chosen platform:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-2">
              <li><strong>Instagram Reels</strong> - Upload via Instagram app or Meta Business Suite. Add caption from the Outputs tab (copy to clipboard).</li>
              <li><strong>TikTok</strong> - Upload via TikTok app or TikTok Studio. Paste the script text as the caption or description.</li>
              <li><strong>Meta Ads</strong> - Upload the MP4 as a video ad in Meta Ads Manager.</li>
            </ul>
            <p className="mt-2">Direct one-click publishing from inside the platform is planned once Meta and TikTok API access is approved. For now, download and post - the creation bottleneck is solved, manual upload takes 30 seconds.</p>

            <p className="mt-4">Reel generation requires four environment variables: <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">ELEVENLABS_API_KEY</code>, <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">ELEVENLABS_VOICE_ID</code>, <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">HEYGEN_API_KEY</code>, and <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">HEYGEN_AVATAR_ID</code>. If any are missing the button will return an error.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Full Reel Production Flow</p>
            <p>The HeyGen output is a talking head - your avatar speaking the script. For a fully edited reel with b-roll, captions, and music, a post-production step is required. AI cannot reliably generate contextually accurate b-roll matching your brand, clients, and locations. The solution is a hybrid model.</p>

            <p className="mt-3 text-[12.5px] font-semibold text-[#666D7A]">Step 1 - Build a B-Roll Library (one-time)</p>
            <p className="mt-1">Film 1 hour of raw footage on your iPhone. No speaking required. This library is reused across every reel you ever produce.</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-2">
              <li><strong>You (no speaking)</strong> - walking, training, at desk, reviewing data</li>
              <li><strong>Coaching context</strong> - client sessions (with permission), gym equipment, measurement setup</li>
              <li><strong>Brisbane / lifestyle</strong> - outdoor locations, morning routine, city backgrounds</li>
            </ul>
            <p className="mt-2">Store all clips in a shared folder. Your editor pulls from this library for every reel.</p>

            <p className="mt-3 text-[12.5px] font-semibold text-[#666D7A]">Step 2 - Generate Talking Head (Content Engine)</p>
            <p className="mt-1">Content Engine generates script → ElevenLabs converts to your voice → HeyGen renders your AI avatar → download MP4.</p>

            <p className="mt-3 text-[12.5px] font-semibold text-[#666D7A]">Step 3 - Post-Production</p>
            <p className="mt-1">Choose based on volume and quality required:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-2">
              <li><strong>Captions.ai (~$20/mo)</strong> - Upload the HeyGen MP4. Auto-adds animated captions, b-roll suggestions, background music. Best for high-volume organic reels. 5 minutes per reel.</li>
              <li><strong>CapCut (free)</strong> - Manual assembly. Cut in b-roll from your library, add captions and music. 15–20 minutes per reel. Good quality control.</li>
              <li><strong>Upwork editor ($15–50/reel)</strong> - Send HeyGen MP4 + b-roll library link + the script text as a brief. 24–48hr turnaround. Best for paid ad creatives and hero content.</li>
            </ul>

            <p className="mt-3 text-[12.5px] font-semibold text-[#666D7A]">Step 4 - Post</p>
            <p className="mt-1">Upload the finished MP4 manually to Instagram Reels, TikTok, or Meta Ads Manager. Use the copy from the Content Engine output as the caption.</p>

            <p className="mt-3 text-[12.5px] font-semibold text-[#666D7A]">Complete Pipeline</p>
            <div className="mt-2 bg-[#EFF1F4]/60 rounded-lg p-4 text-[12.5px] text-[#43474F] font-mono leading-relaxed">
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

            <Note>The Generate function uses Claude Sonnet with the Body Recode brand voice baked into the prompt - no hype language, no long dashes, no exclamation marks, calm authority. You do not need to prompt-engineer the output. Review and approve before deploying.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Card Library Tab</p>
            <p>The Card Library tab shows all 16 pre-made card templates as a preview grid. Click <strong>Download PNG</strong> on any card to save it as a 1080×1080 PNG ready to post. On mobile, open the dashboard in your browser, go to Business → Content Engine → Card Library, and download directly to your camera roll.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Card Styles</p>
            <p>The graphic API generates 1080×1080 PNG cards. All styles use the brand dark background (<code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">#FFFFFF</code>). A full visual reference with example images is saved at <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">Dropbox/01_BODY_RECODE/07_MARKETING/04_CONTENT_LIBRARY/card-designs/card-designs-reference.html</code>.</p>
            <p className="text-[12.5px] font-semibold text-[#98A0AD] mt-3 mb-1">Text Cards</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>logo-only</strong> - Centred teal logo on dark background. Brand arrival post.</li>
              <li><strong>statement</strong> - Teal accent bar, large headline, sub-copy. Standard authority post.</li>
              <li><strong>question</strong> - Same layout as statement, question framing. Pattern recognition posts.</li>
              <li><strong>insight</strong> - Teal top bar, label, headline, body copy. Scorecard PDF aesthetic.</li>
            </ul>
            <p className="text-[12.5px] font-semibold text-[#98A0AD] mt-3 mb-1">Body State Cards</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>body-state</strong> - Left coloured border card. Use <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">accent=red</code> (Depleted), <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">accent=amber</code> (Transitioning), <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">accent=teal</code> (Ready).</li>
            </ul>
            <p className="text-[12.5px] font-semibold text-[#98A0AD] mt-3 mb-1">Photo Cards (uses kade.jpg)</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>photo-split</strong> - Photo left half, text right half with gradient fade.</li>
              <li><strong>photo-quote</strong> - Big headline top, photo inset bottom right.</li>
              <li><strong>photo-top</strong> - Photo pinned top, dark text panel below.</li>
              <li><strong>photo-right</strong> - Text left, full-height photo right with gradient fade.</li>
            </ul>
            <p className="text-[12.5px] font-semibold text-[#98A0AD] mt-3 mb-1">Carousel Cards</p>
            <p className="text-[#666D7A] text-[12.5px] mb-1">All carousel cards share a left teal border stripe for visual consistency when swiped.</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>carousel-hook</strong> - Slide 1. Big hook headline, optional sub-copy, Swipe indicator.</li>
              <li><strong>carousel-slide</strong> - Interior numbered slides. Use <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">n=2</code>, <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">n=3</code> etc. for each slide number.</li>
              <li><strong>carousel-cta</strong> - Final slide. Teal pill CTA driving to scorecard or check-in. Use <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">label=</code> to override CTA button text.</li>
            </ul>
            <p className="text-[12.5px] font-semibold text-[#98A0AD] mt-3 mb-1">Conversion Cards</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm">
              <li><strong>scorecard-cta</strong> - Sunday diagnostic post. Shows all 3 body states condensed with colour-coded strips, teal pill CTA, "Free · 2 min · Link in bio".</li>
            </ul>
          </Section>

          <Section id="be-strategy" title="34. Strategy Hub" colour="amber">
            <p>The Strategy Hub is the central reference for the Body Recode marketing and acquisition strategy. Navigate to <strong>Business → Strategy</strong> to access it.</p>
            <p className="mt-2">It has 8 tabs:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li><strong>Overview</strong> - Mission, funnel flow (Content → Scorecard → Check-In → Consultation → Client), primary platform, posting frequency, and ad budget.</li>
              <li><strong>Positioning</strong> - Target audience (primary: women 35–50, secondary: men 35–55), the core problem solved, tone of voice principles, the 5 topics you own, what every post must make people feel, messaging framework (Insight → Signal → Shift → Solution → Momentum), the 3 public-facing body states, and the Never Say/Do list.</li>
              <li><strong>Content System</strong> - Weekly posting cadence (Mon authority / Wed pattern recognition / Fri coach perspective / Sun diagnostic), detailed post ideas and format guidance for each type, and content production guide with effort ratings and tools.</li>
              <li><strong>Pre-Launch</strong> - The 5 pre-launch posts (Brand Arrival, Who You Are, The Problem, Three Body States, Scorecard CTA) with graphic specs, full captions, and posting order. Post these before any ads go live.</li>
              <li><strong>Paid Ads</strong> - Ad strategy, budget, targeting, and 3 full reel scripts (angle, hook, duration, full spoken script) ready to film.</li>
              <li><strong>Launch Timeline</strong> - Phase-by-phase launch plan from pre-launch through to scale.</li>
              <li><strong>Content Calendar</strong> - Monthly calendar for scheduling posts. Click any day to see scheduled posts or add a new one. Colour-coded by content type (authority, pattern, coach, diagnostic, ad, pre-launch) and by campaign phase (pre-launch, ads, optimise, scale).</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Content Calendar</p>
            <p>The calendar shows the current month by default. Navigate months with the arrow buttons. Click any day to select it and see what is scheduled. To add a post:</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li>Click a day then click <strong>Add Post</strong>, or click <strong>+ Add Post</strong> at the top of the calendar.</li>
              <li>Fill in date, content type, campaign phase, title, and optional notes.</li>
              <li>Click <strong>Save</strong>. The post appears as a colour-coded dot on the calendar.</li>
              <li>Click any post dot to view or edit it. Use the pencil icon to edit or the trash icon to delete.</li>
            </ul>
            <Note>Calendar posts are saved to Supabase and persist across page refreshes and devices. Changes take effect immediately.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Native Instagram Publishing (2026-06-30)</p>
            <p>Feed posts and carousels now publish directly to <strong>@body_recode_</strong> from this calendar via Meta Graph API. No Meta Business Suite, no Later/Buffer, no copy-paste.</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li>Click any non-story Instagram post in the calendar to open the post detail modal.</li>
              <li><strong>Post now</strong> button publishes immediately. ~5-10 sec round-trip. Returns a green <strong>✓ Posted</strong> badge with a link to the live IG post.</li>
              <li><strong>Schedule</strong> button hands the post + the row&apos;s scheduled date+time to Meta. Meta publishes it automatically at that time (minimum 10 minutes in the future, maximum 75 days).</li>
              <li>Carousels (multiple slides) publish natively as a single multi-slide post.</li>
              <li>Posted state persists on the row (<code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">ig_post_id</code>, <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">ig_post_url</code>, <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">posted_at</code>) so re-clicking shows the live URL instead of re-publishing.</li>
            </ul>
            <p className="text-[12.5px] mt-2 text-[#43474F]"><strong>Stories publish only when the row is marked story_auto.</strong> Meta&apos;s API strips link stickers, countdown stickers and polls, and the tap on a sticker is the completion signal that recovers story ranking - so a story carrying one still goes up by hand. <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">story_auto</code> marks the plain-image ones that were never going to have a sticker, and those publish themselves like any other post. Two differences from a feed post: a story has no caption, so all the text has to be in the image, and Meta will not accept a scheduled publish time for stories, so our own cron fires them at the moment they should be live rather than handing them over in advance. Everything else on the calendar is tracked the same way.</p>
            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Two accounts, from 2026-08-20</p>
            <p className="text-[12.5px] mt-2 text-[#43474F]"><strong>@body_recode_ and @kade_dunstone_ both publish natively.</strong> The personal brand was the only channel with no automation, so it died whenever Kade got busy — five days quiet in July, then <strong>twelve days from 8 Aug with 73 finished posts sitting behind it</strong>, every one with a caption and a graphic. The morning cadence alert fired for fifteen straight days, so another alert was never the fix.</p>
            <p className="text-[12.5px] mt-2 text-[#43474F]"><strong>Each account has its own credential pair and there is NO fallback.</strong> If the personal vars are missing, a personal post refuses to publish and says so; it never drops back to the Body Recode token. That prevents Kade&apos;s personal posts appearing on @body_recode_ in front of the client audience, which has no undo. The code can only check the vars <em>exist</em> though — it cannot tell that the wrong Page&apos;s token was pasted in, which is why the setup guide makes you verify <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">GET /&lt;id&gt;?fields=username</code> returns <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">kade_dunstone_</code> before going further.</p>
            <p className="text-[12.5px] mt-2 text-[#43474F]"><strong>The BR footer is skipped on personal posts.</strong> It reads &quot;More from our founder → @kade_dunstone_&quot;, which is right on the brand account and nonsense on the personal one.</p>
            <StatusList items={[
              { label: '@body_recode_', desc: 'META_GRAPH_ACCESS_TOKEN + META_IG_BUSINESS_ACCOUNT_ID' },
              { label: '@kade_dunstone_', desc: 'META_GRAPH_ACCESS_TOKEN_PB + META_IG_BUSINESS_ACCOUNT_ID_PB — setup guide at 07_MARKETING/04_PERSONAL_BRAND/2026-08-20_Personal_Brand_Auto_Publishing.md' },
            ]} />
            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Measurement · the missing permission</p>
            <p className="text-[12.5px] mt-2 text-[#43474F]"><strong>Neither token can read insights.</strong> Both were generated with four permissions and <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">instagram_manage_insights</code> is not among them, so reach, saves and shares are unreadable on <strong>every post either account has ever published</strong> — 44 on @body_recode_ and counting. Publishing is entirely unaffected; this is a read permission only.</p>
            <p className="text-[12.5px] mt-2 text-[#43474F]">Fix: regenerate both tokens with that permission added and update the env vars. Then <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">npx tsx --env-file=.env.local scripts/ig-insights.ts</code> reports reach, saves, shares and likes per brand and per format, with top and bottom performers. <strong>Until then every content decision on both accounts is taste, not evidence.</strong></p>
            <p className="text-[12.5px] mt-2 text-[#43474F]">Token + IG Business Account ID configured one-time via env vars (Vercel body-recode project only). Token is a long-lived User Access Token with the 4 perms: <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">instagram_basic</code>, <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">instagram_content_publish</code>, <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">pages_show_list</code>, <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">pages_read_engagement</code>. Regenerate via Graph API Explorer every ~60 days. Full setup walkthrough in <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/2026-06-30_Instagram_Native_Publishing.md</code>.</p>
            <Note>Publish failures stamp <code>publish_error</code> on the row + bump <code>publish_attempts</code>. A <strong>retry</strong> link appears on the button. Common failure modes: token expired (regenerate), image URL not publicly fetchable by Meta (use static <code>/calendar/...</code> path, not live-render <code>/api/content/graphic</code>), caption empty or &gt;2200 chars.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">The 5 Topics You Own</p>
            <p>Every piece of content maps to one of these five topics. Nothing outside these.</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li><strong>Body State</strong> - Depleted / Transitioning / Ready and why state determines everything.</li>
              <li><strong>Why Effort Isn&apos;t Working</strong> - The training harder / eating less trap.</li>
              <li><strong>Cortisol and Fat Storage</strong> - Stress belt, protection mode, why the body resists.</li>
              <li><strong>Prescription Without Interpretation</strong> - The fundamental flaw in mainstream fitness.</li>
              <li><strong>The Intelligent Approach</strong> - What reading the body first actually looks like.</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Body State Terminology</p>
            <p><strong>Public-facing (Scorecard + social content):</strong> Depleted / Transitioning / Ready. Use these in all Instagram content and the Readiness Scorecard.</p>
            <p className="mt-1"><strong>CFFS classification (coaching system only):</strong> Remediation / Optimisation / Post-Optimisation. These are revealed after the full CFFS assessment - not used in pre-CFFS content or social media.</p>
            <Note>Never conflate the two terminologies. The gap between them is intentional - the scorecard gives a signal, the CFFS gives the real classification. That distinction protects the value of the paid coaching system.</Note>
          </Section>

          <Section id="be-social-profiles" title="35. Social Profiles" colour="amber">
            <p>The canonical spec for every Body Recode social profile. Copy each field directly into Instagram.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Instagram - Field by Field</p>
            <div className="space-y-3">

              <div className="bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-[#E8EAEE]"><span className="text-[12.5px] font-medium text-[#666D7A]">Name</span></div>
                <div className="px-4 py-3 font-mono text-sm text-[#141821] select-all">Body Recode</div>
              </div>

              <div className="bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-[#E8EAEE]"><span className="text-[12.5px] font-medium text-[#666D7A]">Username</span></div>
                <div className="px-4 py-3 font-mono text-sm text-[#141821] select-all">@body_recode_</div>
              </div>

              <div className="bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-[#E8EAEE]"><span className="text-[12.5px] font-medium text-[#666D7A]">Bio - Line 1</span></div>
                <div className="px-4 py-3 font-mono text-sm text-[#141821] select-all">Performance coaching for people whose bodies stopped responding.</div>
              </div>

              <div className="bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-[#E8EAEE]"><span className="text-[12.5px] font-medium text-[#666D7A]">Bio - Line 2</span></div>
                <div className="px-4 py-3 font-mono text-sm text-[#141821] select-all">Body state interpretation. Training. Nutrition.</div>
              </div>

              <div className="bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-[#E8EAEE]"><span className="text-[12.5px] font-medium text-[#666D7A]">Bio - Line 3</span></div>
                <div className="px-4 py-3 font-mono text-sm text-[#141821] select-all">↓ Find out which state you&apos;re in (2 min)</div>
              </div>

              <div className="bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-[#E8EAEE]"><span className="text-[12.5px] font-medium text-[#666D7A]">Link in Bio</span></div>
                <div className="px-4 py-3 font-mono text-sm text-[#1B6DFC] select-all">performance.bodyrecode.au/scorecard?source=instagram</div>
              </div>

              <div className="bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-[#E8EAEE]"><span className="text-[12.5px] font-medium text-[#666D7A]">Account Type</span></div>
                <div className="px-4 py-3 text-sm text-[#141821]">Creator or Business - not Personal</div>
              </div>

            </div>
            <Note>No emojis except the arrow on line 3. No hashtags. No location. One link, one destination. Do not use Linktree or any link-in-bio tool.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Tracked Source URLs</p>
            <div className="space-y-2">
              {[
                { source: 'Instagram bio', url: 'performance.bodyrecode.au/scorecard?source=instagram' },
                { source: 'Instagram story', url: 'performance.bodyrecode.au/scorecard?source=instagram_story' },
                { source: 'LinkedIn post', url: 'performance.bodyrecode.au/scorecard?source=linkedin_post' },
                { source: 'LinkedIn profile bio', url: 'performance.bodyrecode.au/scorecard?source=linkedin_profile' },
                { source: 'QR floor banner', url: 'performance.bodyrecode.au/scorecard?source=qr_floor_banner' },
                { source: 'QR flyer', url: 'performance.bodyrecode.au/scorecard?source=qr_flyer' },
              ].map(row => (
                <div key={row.source} className="flex items-center gap-3 bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-4 py-2.5">
                  <span className="text-[#666D7A] text-sm w-36 shrink-0">{row.source}</span>
                  <span className="text-[#1B6DFC] font-mono text-[12.5px]">{row.url}</span>
                </div>
              ))}
            </div>
            <Note>All URLs redirect to performance.bodyrecode.au/scorecard with source preserved. Every lead that comes in is tagged by source automatically in the CRM.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Personal Brand (@kade_dunstone_) — Content Kit + Calendar</p>
            <p>The <strong>Business → Personal Brand → Content Kit</strong> tab documents the visual identity and the 4-week launch plan. Scheduling is <strong>not</strong> separate - the posts live in the one Content Calendar on <strong>Marketing Strategy → Content Calendar</strong>, filtered by <strong>brand = Personal Brand</strong>, alongside Body Recode, AI Co-Founder and The Collective. The 16 launch posts (4/week Mon/Wed/Fri/Sun, drawn from the Script Library) are seeded via <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">sql/2026-06-04_seed_personal_brand_calendar_posts.sql</code>.</p>
            <p className="mt-2"><strong>Brand colour = Clay.</strong> One signature colour across the whole feed - paper tint #F3E9E1, ink #2A1E16, accent/solid #B5552F - deliberately distinct from Body Recode (Signal Blue), AI Co-Founder (indigo) and The Collective (sky blue). Pillars are told apart by the eyebrow label, not colour.</p>
            <p className="mt-2"><strong>Card system</strong> (all via the graphic endpoint, clay is the default theme): <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">style=personal</code> = editorial text card (Source Serif 4 headline, clay eyebrow + rule, @kade_dunstone_ wordmark, no logo); add <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">num=</code> + <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">cue=swipe</code> for carousel slides and <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">theme=clay-solid</code> for the solid close slide. <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">style=personal-photo</code> = photo card with <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">layout=top|overlay|split|inset</code> and <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">photo=1-8</code>. Square + story. ~1 in 4 posts carries a photo; framework posts are carousels; the rest are clay cards. A carousel row stores comma-separated slide URLs in its <em>graphic</em> field.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">LinkedIn (Body Recode Channel)</p>
            <p>Opened May 2026 as a parallel funnel into the same scorecard. Reaches the same demographic (high-functioning adults, executives, founders) through a different channel with different language. Instagram strategy is unchanged. LinkedIn is additive.</p>
            <p className="mt-2">Posted from <strong>Kade Dunstone&apos;s personal LinkedIn profile</strong>. No separate Body Recode LinkedIn page - audience follows the person. Four pillars: State over Discipline / The Effort Trap / Physiology and Decision-Making / Interpretation over Prescription.</p>
            <p className="mt-2"><strong>Cadence:</strong> 1-2 BR LinkedIn posts/week (Tue + Thu morning ~7am Brisbane), alongside The Collective (2-3/wk) and Personal Brand (1/wk). Total feed 4-6 LinkedIn posts/wk.</p>
            <p className="mt-2"><strong>Tone:</strong> performance, recovery, decision-making, executive function language. Never fat loss vocabulary. Never scorecard-funnel hooks. Short essay format 150-250 words. CTAs every 4-5 posts only. No links in post body (kills reach) - put CTAs in profile and first comment.</p>
            <p className="mt-2">Full strategy at <strong>Business → Marketing Strategy → LinkedIn tab</strong>. 12-week pipeline document at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/LINKEDIN-BODY-RECODE-12-WEEK-PIPELINE.md</code>.</p>
            <p className="mt-2">Leads land tagged <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">source=linkedin</code> in the CRM, filterable separately from Instagram on the leads page. Realistic ramp to first booking is 6-10 weeks - slow-burn channel, not primary conversion engine.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Highlight Covers</p>
            <p>Set up highlight covers before outreach begins - even if empty. An account with covers looks established.</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li><strong>About</strong> - What Body Recode is and who it&apos;s for</li>
              <li><strong>Body State</strong> - Depleted / Transitioning / Ready explainer content</li>
              <li><strong>Results</strong> - Client outcomes (add as they come in)</li>
              <li><strong>Scorecard</strong> - How the scorecard works, CTA to take it</li>
              <li><strong>Program</strong> - What coaching looks like in practice</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Content Pillars</p>
            <p>Every post maps to one of five topics. Nothing outside these.</p>
            <ul className="space-y-1 list-disc list-inside text-[#43474F] text-sm mt-1">
              <li><strong>Body State</strong> - Depleted / Transitioning / Ready and why state determines everything</li>
              <li><strong>Why effort isn&apos;t working</strong> - The training harder / eating less trap</li>
              <li><strong>Cortisol and fat storage</strong> - Stress, protection mode, why the body resists</li>
              <li><strong>Prescription without interpretation</strong> - The fundamental flaw in mainstream fitness</li>
              <li><strong>The intelligent approach</strong> - What reading the body first actually looks like</li>
            </ul>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Posting Cadence</p>
            <div className="space-y-1">
              {[
                { day: 'Monday', type: 'Authority', desc: 'Insight, mechanism, clinical education' },
                { day: 'Wednesday', type: 'Pattern recognition', desc: '"If you\'re doing X and getting Y"' },
                { day: 'Friday', type: 'Coach perspective', desc: 'Observation, case principle, direct take' },
                { day: 'Sunday', type: 'Diagnostic', desc: 'Body state content, scorecard CTA' },
              ].map(row => (
                <div key={row.day} className="flex items-center gap-3 bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-4 py-2.5">
                  <span className="text-[#666D7A] text-sm w-24 shrink-0">{row.day}</span>
                  <span className="text-[#141821] text-sm font-medium w-40 shrink-0">{row.type}</span>
                  <span className="text-[#666D7A] text-sm">{row.desc}</span>
                </div>
              ))}
            </div>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Launch Sequence</p>
            <ol className="space-y-1.5 list-decimal list-inside text-[#43474F] text-sm">
              <li>Profile complete and aligned to this spec</li>
              <li>Warm outreach - 20–30 personal messages to existing contacts</li>
              <li>Daily engagement - 20–30 min per day in target hashtags</li>
              <li>5 pre-launch posts in order</li>
              <li>Regular 4x/week cadence begins</li>
            </ol>
            <Note>Full cold start strategy and post copy are in the Marketing folder: 07_MARKETING/03_ORGANIC_INSTAGRAM/</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Terminology Rule</p>
            <p>Public content and the scorecard use: <strong className="text-[#141821]">Depleted / Transitioning / Ready</strong></p>
            <p className="mt-1">The CFFS coaching system uses: <strong className="text-[#141821]">Remediation / Optimisation / Post-Optimisation</strong></p>
            <Note>Never use the CFFS classification terms in public content. The gap is intentional - the scorecard gives a signal, the CFFS gives the real classification. That distinction protects the value of the paid system.</Note>
          </Section>

          <Section id="be-website" title="36. Website Analytics" colour="amber">
            <p>Found at <strong>Business → Website</strong>. Shows traffic data from performance.bodyrecode.au pulled directly from Vercel Analytics. The page header links directly to the live site.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Stats</p>
            <StatusList items={[
              { label: 'Visitors', desc: 'Unique devices that landed on the site in the selected period - tracked by Vercel Analytics' },
              { label: 'Page Views', desc: 'Total pages loaded across all visits in the period' },
              { label: 'Scorecard Submissions', desc: 'Pulled from the leads database for the same time window. Shows visitor-to-submission conversion rate if both are non-zero' },
              { label: 'Bounce Rate', desc: 'Percentage of sessions where the visitor left without navigating to a second page' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Daily Chart</p>
            <p>Bar chart showing page views per day across the selected range. Today is highlighted in teal. Hover any bar to see exact views and unique visitors for that day. Use this to correlate traffic spikes with posts - you will see immediately which content drove people to the site.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Time Range</p>
            <p>Switch between 7, 30, and 90 day views using the buttons at the top right. All four stats and the daily chart update to match the selected window.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Live Pages</p>
            <p>Quick links to open any page on performance.bodyrecode.au directly from the dashboard - Homepage, How It Works, Online Coaching, Brisbane, Readiness Scorecard.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Data Accuracy Note</p>
            <p>Vercel Analytics was enabled in April 2026 - no historical traffic data exists before that date. In the early weeks, visitor counts are low and conversion rate will appear inflated or misleading because scorecard submissions (from the leads DB) span a longer window than visitor data. A warning banner appears automatically while visitor data is sparse. Numbers will stabilise and become meaningful once 4-6 weeks of tracking data has accumulated.</p>

            <Note>Analytics data is sourced from the Vercel API using the VERCEL_API_TOKEN, VERCEL_PERFORMANCE_PROJECT_ID, and VERCEL_TEAM_ID environment variables. If the page shows an error, check those vars are set in Vercel → Project Settings → Environment Variables.</Note>
          </Section>

          {/* ── CHALLENGE SECTIONS ── */}

          <Section id="ch-overview" title="Challenge Overview" colour="teal">
            <p>The 14-Day Body Decode Challenge is a standalone consumer product that runs entirely independently of the Performance Coaching platform. Participants sign up at <strong>bodyrecode.au/challenge</strong>, receive a personal portal link, and move through a 14-day structured reset with daily coaching, training, nutrition, and automated SMS support.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Model</p>
            <p>Evergreen and self-paced. Every participant starts on their own Day 1 at the point of enrollment. All timing is relative to their enrollment date - not a fixed cohort calendar. There are no live sessions, no join windows, and no group structure. Everything is automated.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Purpose in the funnel</p>
            <p>The challenge sits at the top of the Body Recode funnel. It is a free-entry product designed to demonstrate the method, build biological understanding, and ascend participants toward the 6-Week Body Recode Blueprint. The Day 14 email and SMS transition sequence drives this ascension.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Key URLs</p>
            <StatusList items={[
              { label: 'Landing page', desc: 'bodyrecode.au/challenge - signup form, what you get, about the challenge' },
              { label: 'Participant portal', desc: 'bodyrecode.au/challenge/[token] - unique per participant, accessed via their personal link' },
              { label: 'Training page', desc: 'bodyrecode.au/challenge/[token]/training - 3 session plans with full exercise detail' },
              { label: 'Nutrition page', desc: 'bodyrecode.au/challenge/[token]/nutrition - HABNS guide, meal builder, shopping list' },
              { label: 'Privacy Policy', desc: 'bodyrecode.au/privacy' },
              { label: 'Terms', desc: 'bodyrecode.au/terms' },
            ]} />
          </Section>

          <Section id="ch-landing" title="Landing Page" colour="teal">
            <p>Found at <strong>bodyrecode.au/challenge</strong>. Built as a light-theme page (white background, teal accents) - separate from the dark portal experience. The landing page is the public-facing entry point for the challenge.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Sections on the page</p>
            <StatusList items={[
              { label: 'Hero', desc: 'Headline, subheading, and primary CTA button that jumps to the signup form' },
              { label: 'What you get', desc: '7 items including training plan, nutrition guide, morning/evening sequences, Day 5 progress session, Mini Hormone Quiz, and daily SMS coaching' },
              { label: 'How it works', desc: '3-step process: sign up, follow the structure, understand your biology' },
              { label: 'Mid-CTA', desc: 'Mint gradient section with secondary signup prompt' },
              { label: 'Signup form', desc: 'First name, email, and phone (all required). Submits to the enrollment API.' },
              { label: 'Footer', desc: 'Copyright, Privacy Policy, Terms, and contact links' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Signup form behaviour</p>
            <p>On submission the form calls <strong>POST /api/challenge/enroll</strong>. If successful, the form is replaced with a success message confirming enrollment and telling the participant to check their email and phone. The portal link is emailed immediately via the welcome email.</p>

            <Note>The landing page links to /privacy and /terms. Both pages are built and live. They are light-theme pages matching the landing page aesthetic.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Pre-launch waitlist mode (2026-06-12)</p>
            <p>Challenge, Blueprint, and Membership are gated behind launch flags (<strong>NEXT_PUBLIC_CHALLENGE_LIVE / _BLUEPRINT_LIVE / _MEMBERSHIP_LIVE</strong>). While a flag is unset or not <strong>&apos;true&apos;</strong>, that product&apos;s landing page shows a <strong>&quot;Starting soon · join the waitlist&quot;</strong> capture instead of live enrollment/checkout. Waitlist signups go to the <strong>product_waitlist</strong> table (same pool the scorecard &quot;coming soon&quot; CTAs feed) and are viewable at <strong>Dashboard → Business → Waitlist</strong>. To launch a product: set its flag to &apos;true&apos; in Vercel and redeploy — the live enroll form / Stripe checkout returns automatically. Marketing copy and pricing stay visible in waitlist mode; only the transaction is gated.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Body Recode Collective EOI pair (2026-07-08, fires immediately on Fit Scorecard submit)</p>
            <p>New expression of interest via the Fit Scorecard at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">bodyrecode.au/collective/apply</code> triggers a synchronous send-pair from <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">POST /api/collective/submit</code> after the row insert.</p>
            <p className="mt-2"><strong>(1) Applicant confirmation</strong> - Collective-branded email to the coach who applied from <strong>{coach().email}</strong>, BCC&apos;d to <strong>{coach().email}</strong>. Warm-professional acknowledgment, "considered reply within 3-5 business days", a "What happens next" card with three outcomes (fit is clear → Foundation Call · close but not quite → resource pack + next cohort · timing not right → plain decline + engine-layer pointer), CTA back to the Collective overview. <strong>Does NOT reveal the internal fit tier</strong> — that&apos;s your read, not the applicant&apos;s.</p>
            <p className="mt-2"><strong>(2) Coach notification</strong> - from <strong>info@bodyrecode.au</strong> (fromBrand) to <strong>{coach().email}</strong> only, <code>replyTo</code> set to applicant&apos;s email. Subject includes emoji tier badge (🟢 / 🟡 / 🔴). Body: prominent tier badge with decision-hint blurb, dimension scores card (method · audience · modality · readiness as coloured chips), full applicant details table, mailto reply CTA with pre-filled subject.</p>
            <p className="mt-2"><strong>Distinct Collective sub-brand:</strong> warm-charcoal (#2C2418) accent, editorial "The Collective" wordmark, brand-first signature (no Kade personal photo) — signals the coach-facing B2B programme identity vs consumer BR emails&apos; Signal Blue + Kade-founder-byline shape. Composed from Collective-brand primitives in <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">src/lib/collective-email-shell.ts</code> wrapping the same shared <code>darkEmailShell</code>.</p>
            <p className="mt-2"><strong>Non-fatal:</strong> independent try/catch around each send. Application row is saved BEFORE either fires — a Resend outage never loses the application, just skips the notification.</p>
            <p className="mt-2"><strong>(3) Ready-tier speed-to-lead SMS:</strong> ONLY when <code>fit.tier === 'ready'</code>, a phone-buzz SMS fires to your <code>whatsAppNumber</code> via Twilio. Copy: <em>"BR Collective · Ready-tier application from {'{firstName}'}. Full details + reply CTA in your inbox."</em> AEST-windowed to Mon-Sat 08:30-20:00 (outside window = skip, no queue - you see the email regardless). Bypasses the client-facing <code>sendLeadSms</code> guards because this is a coach-facing internal notification, not a lead-facing SMS. Per <code>COLLECTIVE_FIT_SCORECARD.md</code> spec.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Waitlist welcome + coach-notify pair (2026-07-08, fires immediately on join)</p>
            <p>New signup to <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">product_waitlist</code> for <strong>challenge</strong> / <strong>blueprint</strong> / <strong>membership</strong> triggers a synchronous send-pair from <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">POST /api/product-waitlist</code> before the response returns.</p>
            <p className="mt-2"><strong>(1) Joiner welcome</strong> — branded email from <strong>{coach().email}</strong>, BCC&apos;d to <strong>{coach().email}</strong> so you see exactly what the joiner received. Product-aware <strong>and state-matched</strong> per <code>project_bodystate_stage_recommendation_mapping</code>: Challenge waitlisters (Depleted-state matched) get &quot;doors open Mon 13 July&quot; + a preview of the 14 days; Blueprint waitlisters (Transitioning-state matched) get &quot;Blueprint opens Mon 20 July&quot; + a preview of the 6 weeks + the $97 one-time price; Membership waitlisters (Ready-state matched) get &quot;Membership opens Mon 10 August&quot; + the 5 Membership pillars + $49/week + cancel-anytime. Blueprint + Membership emails also include a soft optional-Challenge card (&quot;recommendation, not a gate&quot;) mirroring the scorecard result page&apos;s soft opt-in.</p>
            <p className="mt-2"><strong>(2) Coach notification</strong> — separate structured email to <strong>{coach().email}</strong> only. Scan-in-two-seconds table of lead details (product, name, email, phone, SMS opt-in, gender, body state, source). Decide in one glance whether the lead deserves a personal IG DM / email reply outside the standard broadcast queue.</p>
            <p className="mt-2"><strong>Idempotency:</strong> explicit existence-check on (email, product) before insert. Re-clicks return 200 without triggering either email. <strong>Silent-fail:</strong> waitlist success never depends on email pipeline health; a Resend outage logs and continues.</p>
            <p className="mt-2"><strong>Skips</strong> <code>product=extension</code> (internal signup path). Speed-to-lead SMS pipeline still fires at T+60s if phone + SMS opt-in were provided.</p>
            <p className="mt-2"><strong>Related file:</strong> <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">src/lib/product-waitlist-welcome-email.ts</code>.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Launch-day waitlist email broadcast (2026-06-29, fires Mon 13 Jul 2026)</p>
            <p>Single-event broadcast that converts the accumulated <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">product_waitlist</code> rows on launch day. Same hour <strong>NEXT_PUBLIC_CHALLENGE_LIVE</strong> flips to <strong>&apos;true&apos;</strong>, run the broadcast script: <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">cd ~/body-recode-mvp &amp;&amp; set -a &amp;&amp; source .env.local &amp;&amp; set +a &amp;&amp; npx tsx scripts/launch-day-waitlist-email.ts --live</code>.</p>
            <p className="mt-2">Default mode is <strong>PREVIEW</strong> (no <code>--live</code> flag): sends one [PREVIEW] copy of each product variant (challenge / blueprint / membership) to <strong>{coach().email}</strong> so you see the exact look first. Add <code>--live</code> to broadcast.</p>
            <p className="mt-2"><strong>Segmented by product:</strong> each waitlist row gets a copy tailored to which product they originally waitlisted for. Challenge waitlisters get the direct &quot;doors are open&quot; call. Blueprint and Membership waitlisters get &quot;the 14-Day Challenge is the read that comes first&quot; — since only Challenge is live on day 1, all three segments route at <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">/challenge</code> with UTM-tagged URLs (<code>utm_campaign=launch_day_waitlist</code> + <code>utm_content=challenge_waitlist|blueprint_waitlist|membership_waitlist</code>).</p>
            <p className="mt-2"><strong>AF Newstead founding-partner block:</strong> the email body includes a Status card naming Anytime Fitness Newstead as the founding partner of the launch (per the 2026-06-29 founding-partner proposal). If Aimee declines the partnership, strip the block with <code>--no-af-newstead</code>.</p>
            <p className="mt-2"><strong>Other flags:</strong> <code>--product=challenge</code> (or blueprint / membership) restricts the live broadcast to one segment.</p>
            <p className="mt-2"><strong>Idempotency:</strong> on a successful send the script stamps <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">product_waitlist.notified_at</code> per row. Re-running <code>--live</code> only sends to rows where <code>notified_at IS NULL</code> — never double-sends. Throttled 500ms between sends to stay inside Resend&apos;s rate limit.</p>
            <p className="mt-2"><strong>Coach BCC:</strong> every live send BCCs <strong>{coach().email}</strong> for audit. Preview mode is the coach&apos;s copy already.</p>
            <Note>This is a single-event broadcast. After 13 Jul 2026, the script stays in the repo as reference but should not be re-run — Challenge is evergreen post-launch and the LP flips to live signup form (new waitlist signups stop happening).</Note>
          </Section>

          <Section id="ch-enrollment" title="Enrollment Flow" colour="teal">
            <p>Enrollment is handled by <strong>POST /api/challenge/enroll</strong>. It runs the following steps in order:</p>

            <div className="space-y-3 mt-2">
              <ChecklistItem text="Find or create a lead in the leads table using the email address. If the lead exists, update their phone number." />
              <ChecklistItem text="Fire the lead_created automation trigger for new leads only." />
              <ChecklistItem text="Check for an existing active challenge enrollment for this lead. If one exists, return the existing token - no duplicate enrollment." />
              <ChecklistItem text="(New only) Create a new challenge_enrollments row with status active, current_day 1, and enrolled_at set to now." />
              <ChecklistItem text="(New only) Log a challenge_enrolled event in lead_events." />
              <ChecklistItem text="(New only) Fire the form_submitted automation trigger with form: challenge_signup." />
              <ChecklistItem text="(New only) Send the challenge/enrolled Inngest event, which triggers the Day 5 / Day 14 emails and SMS drip in parallel." />
              <ChecklistItem text="(Both new and returning) Send the welcome email AND the coach enrollment notification synchronously in parallel via sendChallengeWelcomeEmail + sendCoachEnrollmentNotification. Each logs a lead event (challenge_welcome_sent / challenge_coach_notified) with the Resend id." />
            </div>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Duplicate enrollment handling</p>
            <p>If someone signs up again with the same email, they receive their existing token back. The portal link in the welcome email will take them back to their current enrollment. No new enrollment is created. They <strong>do</strong> still receive the welcome email synchronously - subject Here is your challenge portal link, [name] - so the front-end success message Check your email always corresponds to a real send.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Token</p>
            <p>Each enrollment has a UUID token generated by Supabase (default value on the column). This token is the participant's permanent unique identifier for their challenge. It never changes and never expires. The portal URL is <strong>bodyrecode.au/challenge/[token]</strong>.</p>
          </Section>

          <Section id="ch-portal" title="Participant Portal" colour="teal">
            <p>Found at <strong>bodyrecode.au/challenge/[token]</strong>. Dark theme matching the Body Recode brand. The portal is the participant's home for the full 14 days. It is a server-rendered Next.js page that fetches the enrollment from Supabase on every load.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">What the portal shows</p>
            <StatusList items={[
              { label: 'Day counter', desc: 'Calculated from enrolled_at - shows which day the participant is on (1-14), capped at 14' },
              { label: 'Progress bar', desc: 'Visual percentage of the challenge completed' },
              { label: 'Today note', desc: 'Day-specific focus and coaching note - 14 unique entries, one per day' },
              { label: 'PAR-Q and Health Dec forms', desc: 'Shown until both are complete. Training and nutrition are locked behind form completion.' },
              { label: 'Cleared for training banner', desc: 'Shown once both forms are complete. Training and nutrition cards unlock.' },
              { label: 'Resources', desc: 'Training Plan, Nutrition Guide, Morning Reset Sequence, Evening Rhythm Sequence' },
              { label: 'Week One Progress Session', desc: 'Unlocks on Day 5. Video session embedded via NEXT_PUBLIC_CHALLENGE_SESSION_VIDEO_URL env var.' },
              { label: 'Mini Hormone Quiz', desc: 'Unlocks on Day 7. Saved result shown on return visits.' },
              { label: 'Day 14 CTA', desc: 'Shown from Day 14 onward. Links to the 6-Week Blueprint at bodyrecode.au.' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Day calculation</p>
            <p>Day is calculated server-side on every page load as <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">Math.floor((now - enrolledAt) / 86400000) + 1</code>, clamped between 1 and 14. Day 1 is the day of enrollment. Day 2 starts 24 hours after enrollment.</p>

            <Note>The portal does not require a login. Anyone with the token URL can access the portal. Tokens are UUID format (32 hex characters) - they are not guessable by brute force.</Note>
          </Section>

          <Section id="ch-day-zero" title="Day 0 Body Decode Intake" colour="teal">
            <p>The Day 0 Body Decode Intake is the FIRST thing a Challenge enroller sees in the portal — gating ALL other content (PAR-Q, Health Declaration, Today&apos;s Note, Resources, Day 5/7/14 milestones) until done. Captures scorecard-equivalent signals (5 section scores, 4 demographics, 2 qualifiers — ~3 minutes) so cold-paid / gym-floor / direct enrollers get the same state classification as scorecard signups.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Why it exists</p>
            <p>The locked scorecard-first routing rule has two exceptions: cold-paid Meta ads and gym-floor QR scans both go DIRECT to /challenge (no scorecard) because adding a quiz between ad-click/QR-scan and signup tanks cold-paid economics and gym-floor conversion. Pre-fix, those enrollers had no state classification at signup — only on Day 7 via a 2-question quiz stored in a different table. The Day 0 intake captures the same signals AFTER enrolment instead of BEFORE, where friction doesn&apos;t hurt the conversion event Meta optimises on.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Skip logic for scorecard signups</p>
            <p>Critical UX: scorecard signups must NOT see the intake form again. The portal checks <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">leads.scorecard_profile</code> on load — if populated, the intake auto-skips and the enroller goes straight to PAR-Q. So the Day 0 intake is exclusively for non-scorecard enrollers.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">State-routed result card</p>
            <p>After intake submit, the enroller sees a state-routed result card mirroring the public scorecard result page:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>Depleted</strong> → &quot;Challenge is your fit&quot; + Continue Challenge (no ascension shown)</li>
              <li><strong>Transitioning</strong> → Continue Challenge default + Blueprint recommendation card (&quot;Your state suggests Blueprint&quot;)</li>
              <li><strong>Ready</strong> → Continue Challenge default + Membership recommendation card (&quot;Your state suggests Membership&quot;)</li>
            </ul>
            <p className="mt-2">Continue Challenge always stays the default action — honours the free 14-day Challenge promise the enroller signed up for. Ascension is the OPTION, not a redirect. CTAs route to <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">/blueprint?from=challenge_day_zero&state=transitioning</code> and <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">/membership?from=challenge_day_zero&state=ready</code> for attribution.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">How data persists</p>
            <p>POST <strong>/api/challenge/day-zero-intake</strong> writes to the SAME columns the public scorecard writes to: <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">leads.scorecard_score</code>, <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">scorecard_body_state</code>, <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">scorecard_profile</code>, <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">scorecard_section_scores</code>, <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">biological_sex</code>, <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">age_band</code>, <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">fat_storage</code>, <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">cycle_status</code>, <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">approach_response</code>, <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">investment_readiness</code>, <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">lead_quality</code>. Uses the shared <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">typeFatMapProfile()</code> from <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">src/lib/fat-map-profile.ts</code>. Same body-state thresholds as scorecard (≤8 Depleted, ≤11 Transitioning, ≥12 Ready). Stamps <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">challenge_enrollments.body_decode_intake_completed_at</code> so the portal advances past the gate, and logs a <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">day_zero_intake_completed</code> lead event.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Source attribution</p>
            <p>Whether a lead&apos;s Fat Map zone was classified via the scorecard or via Day 0 intake is derivable from <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">challenge_enrollments.body_decode_intake_completed_at</code> — non-null means the data came from inside the portal. No separate scorecard_source column needed.</p>

            <Note>Required Supabase columns: body_decode_intake_completed_at (timestamptz, nullable) on challenge_enrollments. Applied via sql/2026-06-27_challenge_day_zero_intake.sql.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">The Estrogen-Shift question (12 Aug 2026)</p>
            <p>Women are now asked one extra question on both the public scorecard and the Day 0 intake: <strong>&quot;Has where it sits changed over the last few years?&quot;</strong> Four answers: stayed on hips and thighs, moved from hips to the middle, always been the middle, or not sure. Stored on <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">leads.storage_direction</code>.</p>
            <p className="mt-2">This is the discriminator the doctrine names for Estrogen-Shift, and until now nothing asked it. The phase was inferred from cycle status and age, which meant a perimenopausal woman could be told her fat had moved to her middle when she had never said anything of the kind. Her result now reads off her own answer: a woman who says it stayed on her hips gets the hips and thighs description, one who says it moved gets the movement description, and anyone who says always central, not sure, or was never asked gets a version that names no location at all.</p>
            <Note><strong>It changes the typing too, not just the wording.</strong> Answering &quot;moved to my middle&quot; or &quot;stayed on my hips&quot; types her Estrogen-Shift at high confidence, because she said it rather than us guessing. And &quot;always been my middle&quot; now blocks the Estrogen-Shift route entirely and types her Stress-Stored, because Estrogen-Shift arrives at the middle from the hips while Stress-Stored was central from the start.</Note>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Fat Map v2.0 alignment (6 Aug 2026)</p>
            <p>Three fixes landed together, all enforcing <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">Fat_Map_Definitions_LOCKED.md</code> v2.0.</p>
            <ul className="list-disc ml-5 space-y-1 mt-2">
              <li><strong>&quot;All over&quot; no longer types as Insulin-Drift.</strong> v2.0 retires &quot;softening all over&quot; as an insulin signal — generalised surface softness is superficial subcutaneous fat, the one compartment with no insulin association. It is now treated as a failure to localise: a woman in the menopausal band reads as phase-2 Estrogen-Shift at low confidence, everyone else falls through to the score pattern with confidence <em>capped</em> at low. The option label changed from &quot;Softening all over, fairly evenly&quot; to &quot;It&apos;s fairly even, I couldn&apos;t pick one spot&quot; on both the public scorecard and the Day 0 intake. Six existing leads were re-typed.</li>
              <li><strong>The Day 7 Check-In gained a phase-2 route.</strong> The oestrogen option previously ended &quot;Storage on hips and thighs&quot;, which is phase 1 only, so phase-2 women picked the post-meal sluggishness option and typed as Insulin-Drift. That option now covers both phases, and a third signal question (<code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">sq3</code>) asks the direction-of-travel discriminator. It is shown <em>only</em> to women in the menopausal band, via <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">isMenopausalBand()</code> in <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">src/lib/pattern-mapping.ts</code>. Only the &quot;moved toward my middle&quot; answer overrides the sq2 result.</li>
              <li><strong>Brief regeneration was silently mistyping leads.</strong> <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">/api/admin/regenerate-pre-call-briefs</code> never passed biological_sex, age_band, fat_storage or cycle_status, so every regenerated brief was typed as if the lead had answered nothing. Fixed.</li>
            </ul>
            <Note>Full rationale, the re-typing table and the evidence trail: 00_PLAYBOOK/Fat_Map_v2_Alignment_Change_Plan.md (+PDF).</Note>
          </Section>

          <Section id="ch-forms" title="PAR-Q and Health Declaration" colour="teal">
            <p>Both forms are required before the participant can access the training plan and nutrition guide. They appear at the top of the portal on Day 1 and persist until complete. Once complete, they never appear again.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">PAR-Q</p>
            <p>7 standard physical activity readiness questions. All answers must be NO to proceed. If any answer is YES, a medical clearance message is shown directing the participant to consult a doctor and contact {coach().email} before training. The form cannot be submitted with a YES answer.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Health Declaration</p>
            <p>5 tick-box declarations: over 18, not pregnant or post-partum, not medical advice, personal responsibility, consult a doctor if symptoms arise. All 5 must be checked to submit.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Reminders (added 2026-08-14)</p>
            <p><strong>This is the second gate, and nothing chased it until now.</strong> The Day 0 intake opens the portal; these two forms then gate training and nutrition specifically. On 14 Aug, <strong>5 of the 24 participants with portal access were sitting behind this gate</strong> — inside a fitness programme unable to see the fitness — and <strong>none of them reached the Day 7 Check-In</strong>. The portal shows an amber banner, but there was no email or SMS for anyone who closed the tab after their Day 0 result and never came back.</p>
            <p><strong>challengeFormsReminderFunction</strong> now sends two nudges, email plus a matching consent-gated SMS, at ~2 and ~4 days. Both land <em>before Day 5</em>, when the Week One Progress Session unlocks and a locked training plan starts costing real content. It only fires for people who already cleared the Day 0 intake, so it never overlaps the intake reminder, and auto-stops the moment both forms are done.</p>
            <p>Copy states the true cost — <strong>12 taps, nothing to type</strong>. The portal banner used to say &quot;this takes 2 minutes&quot;; the Check-In taught us that overstating a form&apos;s cost is a deterrent we build ourselves.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">How completions are saved</p>
            <p>Both forms call <strong>POST /api/challenge/forms</strong> with the token and form type. The API saves a timestamp to <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">parq_completed_at</code> or <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">health_dec_completed_at</code> on the enrollment. PAR-Q answers are also saved as JSON to <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">parq_responses</code>.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">UX flow — merged into ONE form (2026-08-14)</p>
            <p><strong>They used to be two tabbed forms. They are now one screen with one button.</strong> The sequential funnel said the split was costing people for nothing: of everyone who reached this gate, <strong>75% finished the PAR-Q and then 100% of those finished the declaration</strong>. Nobody was ever stopped by the declaration itself — they were stopped by there being a second thing at all, after they thought they were done.</p>
            <p>Nothing is dropped or bundled: all 7 PAR-Q questions still answer yes/no, a YES still blocks training, and all 5 declarations are still ticked individually. One submit posts both form types in sequence, so each keeps its own timestamp and audit trail. The button counts down what is left (&quot;4 to go&quot;) and finishes as <strong>&quot;Unlock my training and nutrition&quot;</strong>, so the payoff is named on the button rather than left implied.</p>
            <p>Anyone part-way through the old two-step flow still sees only the piece they owe — <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">ParqForm</code> and <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">HealthDecForm</code> are both retained for that case. On completion the section is replaced by a cleared confirmation banner and the Training and Nutrition cards unlock without a page reload.</p>

            <Note>Required Supabase columns: parq_completed_at (timestamptz), parq_responses (jsonb), health_dec_completed_at (timestamptz) on challenge_enrollments.</Note>
          </Section>

          <Section id="ch-leaks" title="Where the Challenge actually leaks" colour="teal">
            <p>Measured 14 Aug 2026 against all 29 enrolments. <strong>Read it sequentially or it misleads</strong> — each rate is of the people who actually reached that gate, not of all enrolments. Flat percentages across 29 make the PAR-Q look as leaky as the scorecard, and it is not.</p>
            <StatusList items={[
              { label: 'enrolled — 29', desc: 'name, email and phone are captured HERE, before any gate. That order is deliberate: someone who stalls later is still a lead we can chase.' },
              { label: 'in-portal scorecard — 20 (69%), lost 9', desc: 'The biggest form leak. Gates the entire portal.' },
              { label: 'PAR-Q — 15 (75%), lost 5', desc: 'Second. Now merged with the declaration.' },
              { label: 'health declaration — 15 (100%), lost 0', desc: 'Loses nobody. Everyone who does the PAR-Q does this too.' },
              { label: 'Day 14 quiz — 1 (7%), lost 14', desc: 'Bigger than every form gate combined, and not a form problem at all.' },
            ]} />
            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Three fixes shipped 14 Aug</p>
            <p><strong>1. Straight into the portal on signup.</strong> The enrol API always returned the portal token and the page threw it away, showing &quot;check your email for your portal link&quot;. That put an inbox hop, a spam folder and a delay between the keenest moment a member will ever have and the first thing we ask of them. Signup now redirects into the portal and offers a direct button; the welcome email still goes out as the way back in later.</p>
            <p><strong>2. PAR-Q and health declaration merged</strong> into one form — see the section above.</p>
            <p><strong>3. Portal visits are now logged.</strong> They were logged nowhere at all. There is a <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">current_day</code> column but the portal recalculates the day from <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">enrolled_at</code> and never writes to it, so it said nothing about whether anyone turned up. That made the largest leak in the funnel invisible: we could not tell whether people went quiet on day 2 or day 9, and those need completely different fixes. <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">logPortalVisit()</code> writes one <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">challenge_portal_opened</code> lead event per enrollment per day. Read it with <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">npx tsx --env-file=.env.local scripts/challenge-attendance.ts</code>, which charts attendance across the 14 days and names the biggest single day-to-day drop.</p>
            <Note>Caveat on all of the above: n=29, so treat it as directional. 28 of the 29 also enrolled before the Day 7 Check-In prompts shipped on 3 Aug and before the copy overstating the form&apos;s length was fixed, so the Day 14 figure may already be better than it reads.</Note>
          </Section>

          <Section id="ch-resources" title="Training and Nutrition Pages" colour="teal">
            <p>Both pages are dark-theme, token-gated, and accessible only from the participant portal. They verify the enrollment token against Supabase on every load - if the token is invalid or the enrollment is inactive, the page returns 404.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Training Plan - /challenge/[token]/training</p>
            <StatusList items={[
              { label: 'How to approach this', desc: 'RIR explanation, tempo guidance, rest periods, walking on rest days' },
              { label: 'Warm-up sequence', desc: '6-step warm-up to run before every session' },
              { label: 'Weekly schedule', desc: 'Week 1 (4 sessions: Days 2, 4, 6, 7) and Week 2 (3 sessions: Days 9, 11, 13)' },
              { label: 'Session A', desc: 'Foundation Strength - 5 exercises with sets, RIR, and coaching cue for each' },
              { label: 'Session B', desc: 'Conditioning Focus - 4 strength exercises + conditioning finisher' },
              { label: 'Session C', desc: 'Volume and Density - 4 exercises + core circuit' },
              { label: 'RIR explainer', desc: 'Defines 1, 2, and 3 RIR so participants understand the effort scale' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Nutrition Guide - /challenge/[token]/nutrition</p>
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

          <Section id="ch-quiz" title="Body Decode Check-In" colour="teal">
            <p>Unlocks in the portal on Day 7. Not a quiz - a biological signal audit. Participants rate 8 body markers on their 7-day progress, then answer 2 pattern questions. Results are saved to Supabase. <strong>Two-stage delivery (revised 2026-05-30):</strong> on Day 7 the participant gets a substantive progress feedback moment - score out of 8, per-marker breakdown, brief interpretation, Week 2 guidance, and a Day 14 teaser. <strong>The pattern itself is HELD until Day 14</strong>, when the full Body Decode Report is delivered (progress recap + pattern card + pattern-specific actions + Blueprint ascension push). This honours both the produced-asset promise (Challenge hero video, B-roll and landing page WHAT_YOU_GET card all reference Body Decode Result on Day 14) and the doctrinal principle that Day 7 read should inform Week 2. Late-takers who submit on or after Day 14 bypass the Day 7 email entirely and receive the Body Decode Report immediately.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Structure</p>
            <StatusList items={[
              { label: 'Part 1 - Progress Scan', desc: '8 biological markers (morning energy, afternoon energy, puffiness, sleep quality, cravings, mental clarity, mood stability, digestion). Each rated: Improving / About the same / Still a challenge. Score out of 8 is shown in the result.' },
              { label: 'Part 2 - Signal Pattern', desc: '2 questions: Q1 identifies where excess puffiness or softness is most noticeable (body region). Q2 identifies the lived experience pattern. Q2 is the primary determinant - if Q1 and Q2 diverge, Q2 takes priority.' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">The four biological patterns</p>
            <StatusList items={[
              { label: 'Stress-Stored (a)', desc: 'Cortisol and adrenaline driving storage around the midsection. Maps to Fat Map MZ1. Colour: red #DC2626.' },
              { label: 'Insulin-Drift (b)', desc: 'DB slug: metabolic-drift. Insulin staying elevated too long, blood sugar instability, storage across mid-back, lower back and love handles plus deep abdominal (front spared), carb cravings, post-meal fatigue. Male-leaning per doctrine. Colour: amber #B7791F.' },
              { label: 'Estrogen-Shift (c)', desc: 'DB slug: hormonal-shift. Oestrogen-driven conservation state, hip and thigh storage, water retention, cycle irregularity, mood variability. Female-only per doctrine. Maps to Fat Map MZ3. Colour: purple #8b5cf6.' },
              { label: 'Androgen-Decline (d)', desc: 'DB slug: system-overload. Testosterone signalling decline, reduced muscle tone, reduced drive, capacity slipping despite consistent effort. Male-only per doctrine. Maps to Fat Map MZ4. Colour: teal #1B6DFC.' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">On submission</p>
            <p>Pattern is determined client-side from Q2 answer + gender (a/b/c/d gender-keyed to a slug via <strong>src/lib/pattern-mapping.ts</strong>). Progress score counts markers answered as &quot;better&quot;. The result key, all answers, and a timestamp are saved via <strong>POST /api/challenge/quiz</strong>. <strong>The API branches on currentDay:</strong> pre-Day-14 it sends the Day 7 Progress email (no pattern, no Blueprint CTA - just progress score + per-marker breakdown + Week 2 guidance + Day 14 teaser). Day-14+ (late-takers) it sends the Day 14 Body Decode Report email immediately. <strong>The Day 14 email is pattern-focused, NOT a progress recap.</strong> Single bridge callback line references the Day 7 score, then five pattern cards: pattern hero + What this pattern means + Where this shows up + What this is NOT (anti-shame misreads) + Your three pattern-specific actions + Blueprint ascension. Email composition lives in shared builders at <strong>src/lib/challenge-checkin-emails.ts</strong>. Pattern content (whatItMeans/whereItShows/whatItIsNot) lives in <strong>src/lib/checkin-patterns.ts</strong>. The Blueprint CTA on the Day 14 Body Decode Report links to <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">/blueprint?source=challenge_day14_report</code>.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Return visits</p>
            <p>The <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">/check-in</code> page fetches <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">quiz_result</code>, <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">quiz_answers</code> and currentDay. Three states: (1) no result + currentDay {'>='} 7: form shows. (2) result exists + currentDay {'<'} 14: <strong>Day 7 in-portal view</strong> shows - progress score card + per-marker breakdown + Week 2 guidance + Day 14 teaser. Same content as the Day 7 Progress email but rendered as a substantive page, not a wait-marker. <strong>No pattern reveal, no Blueprint CTA.</strong> (3) result exists + currentDay {'>='} 14: full Body Decode Report shows - bridge callback line + pattern hero + What this means + Where it shows up + What this is NOT + actions + Blueprint CTA. Mirrors the Day 14 email exactly. Discoverable via the new <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">/day-14</code> framing page (linked from the portal home Body Decode Report card), or directly via <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">/check-in</code>.</p>

            <Note>Stage 1 language only - no Fat Map zone names, no "MZ" codes, no diagnostic framing. The check-in creates awareness of the pattern. The full Fat Map diagnostic is introduced in Stage 3 (Transformation Membership). Framework documentation in Dropbox: 06_Platform_Build/01_Pages/day7-body-decode-checkin.md</Note>
            <Note>Required Supabase columns: quiz_completed_at (timestamptz), quiz_result (text), quiz_answers (jsonb) on challenge_enrollments.</Note>
          </Section>

          <Section id="ch-automation" title="Automation Sequence" colour="teal">
            <p>The welcome email AND the coach enrollment notification are sent <strong>synchronously by the enroll route</strong> (<strong>src/app/api/challenge/enroll/route.ts</strong> → <strong>src/lib/challenge-welcome-email.ts</strong>) so signup confirmation never depends on Inngest pickup. Everything else is two Inngest functions that listen to the <strong>challenge/enrolled</strong> event and run in parallel - registered in <strong>src/app/api/inngest/route.ts</strong>.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Inline (synchronous on signup)</p>
            <div className="space-y-2 mt-1">
              <ChecklistItem text="Welcome email to participant - confirms enrollment, lists what is in the portal, includes their personal portal link. Subject (new): You're in, [name]. Day 1 starts now. Subject (returning sign-up with existing active enrollment): Here is your challenge portal link, [name]." />
              <ChecklistItem text={`Coach notification email to ${coach().email} - participant name, email, phone, enrollment time (AEST), and a View their portal button. Subject (new): New enrollment - [name]. Subject (returning): Re-signup - [name] (existing enrollment).`} />
            </div>
            <p className="text-[12.5px] italic text-[#666D7A] mt-2">Both run in parallel via Promise.all and each logs a lead_events row (challenge_welcome_sent / challenge_coach_notified) with the Resend message id, so the lead timeline shows whether each email actually left the platform.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">challengeSequenceFunction - email sequence (Inngest)</p>
            <div className="space-y-2 mt-1">
              <ChecklistItem text="Step 1 (Day 5, 4-day sleep): Week One Progress Session email - announces the session is ready, links to CHALLENGE_SESSION_VIDEO_URL env var. Checks enrollment is still active before sending." />
              <ChecklistItem text="Step 2 (Day 14, 9-day sleep after Day 5, realigned to 7am AEST): Day 14 step branches on quiz_completed_at. If Check-In was completed: calls buildDay14BodyDecodeReportEmail() - subject 'your Body Decode Report is ready', pattern-focused body (bridge callback + pattern hero + What this pattern means + Where this shows up + What this is NOT + three pattern actions + Blueprint ascension). Visually identical to the late-taker email sent inline by the API route. If Check-In NOT completed: sends the original plain ascension email - subject 'you finished the 14 days.', no result content. Both branches mark enrollment status as completed in Supabase. Report CTA -> /blueprint?source=challenge_day14_report. Plain ascension CTA -> /blueprint?source=challenge_day14_ascension." />
            </div>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">challengeCheckinPromptFunction - Body Decode Check-In prompt (Inngest)</p>
            <p>Added 2026-08-03. Chases the Body Decode Check-In, which gates the entire Day 14 pattern reveal. Before this existed the Check-In was asked for only by two SMS on Day 7 and no email in the arc mentioned it: completion sat at 2/28 (7%) against 21/28 (75%) for the Day 0 intake, so 17 of the 18 people who finished received the no-result fallback at Day 14 rather than the Body Decode Report, and never saw the Blueprint pitch that converts. Runs on the same challenge/enrolled event, in parallel with the sequence above. Built as a separate function rather than extra steps inside challengeSequenceFunction because Inngest has no memoised result for a newly-added step id, so inserting sleeps would have pushed the Day 14 email out for every run already in flight. Each step re-reads challenge_enrollments and bails the moment quiz_completed_at is set or status is not active. Both emails link straight to /challenge/[token]/check-in rather than the Day 7 content page.</p>
            <div className="space-y-2 mt-1">
              <ChecklistItem text="Step 1 (Day 7, 6-day sleep realigned to 7am AEST): buildDay7CheckInPromptEmail() - subject '[name], your Body Decode Check-In is open'. Explains what the Check-In reads, what it gives back (7-day progress read, Week 2 focus, Day 14 Report), and that Day 14 is only a date without it. Skipped entirely if the Check-In is already done." />
              <ChecklistItem text="Step 2 (Day 11, 4-day sleep after Step 1, realigned to 7am AEST): buildCheckInReminderEmail() - subject '[name], your Day 14 read needs this first'. Firmer: states plainly that no Check-In means no pattern and no Report. Only sent to people who still have not completed it." />
              <ChecklistItem text="Participants already mid-challenge when this shipped are covered once by scripts/send-checkin-catchup.ts (dry run by default, --send to deliver). That script targets active non-completers on Day 7-13 only." />
            </div>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">challengeIntakeReminderFunction - Day 0 scorecard reminder (Inngest)</p>
            <p>Chases enrollers who have not completed the Day 0 Body Decode Intake (the in-portal scorecard). Runs on the same challenge/enrolled event, in parallel with the sequence above. Each nudge is an email PLUS a matching SMS. Each step re-reads challenge_enrollments and bails the moment body_decode_intake_completed_at is set or status is not active, so completers are never chased. Safe for scorecard-path enrollers (arrive intake-complete) - the guard short-circuits before any send. The SMS goes through sendLeadSms (trigger challenge_enrolled), so it only reaches opted-in numbers, respects STOP, is frequency-capped, and is logged to sms_logs; enrollers without SMS opt-in still get the email.</p>
            <div className="space-y-2 mt-1">
              <ChecklistItem text="Nudge 1 (~24h, 1-day sleep realigned to 7am AEST): Email buildDayZeroIntakeReminderEmail({ second: false }) - subject '[name], one 2-minute step before your Challenge begins' - plus SMS 'your 14-Day Body Decode Challenge is waiting on one 2-minute step - your starting read. Do it and your Challenge unlocks: [portal]'. Warm reminder that the read is waiting and the Challenge unlocks calibrated to it." />
              <ChecklistItem text="Nudge 2 (~72h, 2-day sleep after Nudge 1, realigned to 7am AEST): Email buildDayZeroIntakeReminderEmail({ second: true }) - subject '[name], your Challenge is on hold until you do this' - plus SMS 'your Challenge is still on hold. Your 2-minute starting read is all that is between you and Day 1: [portal]. Reply if something got in the way.' Firmer copy: the 14 days stay on hold until the starting read is done." />
            </div>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Environment variables required</p>
            <StatusList items={[
              { label: 'RESEND_API_KEY', desc: 'Used for all email sends. Set in Vercel environment variables.' },
              { label: 'CHALLENGE_SESSION_VIDEO_URL', desc: 'Server-side URL for the Day 5 email link. Set after recording the session.' },
              { label: 'NEXT_PUBLIC_CHALLENGE_SESSION_VIDEO_URL', desc: 'Client-side URL shown in the portal Week One Progress Session card.' },
            ]} />

            <Note>All emails use the dark branded template - black outer (#FFFFFF), dark card (#FFFFFF), logo, and the darkEmailSignature with photo. Sent from {coach().email} via Resend.</Note>
          </Section>

          <Section id="ch-sms" title="SMS Coaching Sequence" colour="teal">
            <p>Handled by <strong>challengeSmsFunction</strong> in Inngest. Fires on the <strong>challenge/enrolled</strong> event in parallel with the email sequence. <strong>Minimal Pulse cadence (rebuilt 2026-05-30):</strong> 1 morning portal nudge per day for 14 days + 3 afternoon boosts on key moments = 17 SMS total. The daily coaching content lives in the portal; SMS is the pulse that brings the participant back. <strong>The previous 3x/day rich-coaching corpus was retired</strong> because it duplicated the in-portal daily coaching notes. All messages sent via Twilio.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Timing structure</p>
            <StatusList items={[
              { label: 'Initial wait', desc: '1 hour after enrollment before the first message - gives participant time to check their email first' },
              { label: 'Morning nudge', desc: 'One per day, Day 1-14. Points to the portal for today\'s coaching note. ~140 chars each.' },
              { label: 'Afternoon boost (Day 5, 7, 14 only)', desc: '8h after morning nudge. Used to drive action on the day\'s key moment (session video / Check-In / Body Decode Report email).' },
              { label: 'Next day gap', desc: '16h after afternoon boost (24h total cycle), or 24h after morning if no boost that day.' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Per-day messages</p>
            <StatusList items={[
              { label: 'Day 1 morning', desc: '"Welcome [name]. Day 1 is live in your portal. Today is for setup - read the training plan and nutrition guide, do the morning reset. The work begins gently. Portal: [link]"' },
              { label: 'Day 5 afternoon boost', desc: '"Quick reminder [name]. Your Week One Progress Session is in the portal - watch it before bed if you haven\'t yet. It breaks down what your body has been doing all week: [link]"' },
              { label: 'Day 7 afternoon boost', desc: '"Quick check [name]. Have you done your Body Decode Check-In yet? It&apos;s 10 taps, about a minute, nothing to type - and it&apos;s what unlocks your Day 14 pattern read. Portal: [link]"' },
              { label: 'Day 14 morning', desc: '"Day 14 [name]. Final day. Your Body Decode Report drops in your inbox today. Today\'s note is in the portal: [link]"' },
              { label: 'Day 14 afternoon boost', desc: '"Your Body Decode Report is in your inbox [name]. The full pattern read, what it means, where it shows up, and what comes next. Open the email." Times ~8h after morning so the Day 14 email (which fires through challengeSequenceFunction) has already landed.' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Template variables</p>
            <p>Templates use <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">%FIRST%</code> and <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">%URL%</code> placeholders. The <code className="bg-[#EFF1F4] px-1 rounded text-[#1056D6] text-[12.5px]">renderSms()</code> helper substitutes them at send time. Source of truth: <strong>SMS_MORNING</strong> + <strong>SMS_AFTERNOON_BOOST</strong> constants in <strong>src/lib/inngest-functions.ts</strong>.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Retired</p>
            <p>The <strong>3x/day rich coaching corpus (morning + afternoon + evening per day)</strong> and the <strong>Days 15-17 transition sequence</strong> were both removed in the Minimal Pulse rebuild. The Day 14 Body Decode Report email (from challengeSequenceFunction) is the Blueprint ascension moment; the SMS afternoon boost just drives them to open it. No separate post-Challenge SMS nudges.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Environment variables required</p>
            <StatusList items={[
              { label: 'TWILIO_ACCOUNT_SID', desc: 'Twilio account identifier' },
              { label: 'TWILIO_AUTH_TOKEN', desc: 'Twilio authentication token' },
              { label: 'TWILIO_FROM_NUMBER', desc: 'The Twilio phone number SMS is sent from' },
            ]} />

            <Note>Phone numbers are formatted via the formatPhone utility before sending. If no phone is provided at enrollment, the SMS function exits immediately with no messages sent.</Note>
          </Section>

          <Section id="ch-database" title="Database and Supabase" colour="teal">
            <p>The challenge uses two Supabase tables: <strong>leads</strong> (existing) and <strong>challenge_enrollments</strong> (challenge-specific).</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">challenge_enrollments columns</p>
            <StatusList items={[
              { label: 'id', desc: 'UUID primary key' },
              { label: 'lead_id', desc: 'Foreign key to leads table' },
              { label: 'token', desc: 'UUID - the participant portal identifier. Used in all portal URLs.' },
              { label: 'status', desc: "active | completed. Set to active on enrollment, updated to completed by the Day 14 Inngest step." },
              { label: 'current_day', desc: 'Stored but not used for day calculation - day is computed from enrolled_at on every page load' },
              { label: 'enrolled_at', desc: 'Timestamp of enrollment - used to calculate current day' },
              { label: 'parq_completed_at', desc: 'Timestamp when PAR-Q form was submitted (nullable)' },
              { label: 'parq_responses', desc: 'JSON object of all 7 PAR-Q answers (nullable)' },
              { label: 'health_dec_completed_at', desc: 'Timestamp when Health Declaration was submitted (nullable)' },
              { label: 'quiz_completed_at', desc: 'Timestamp when Mini Hormone Quiz was submitted (nullable)' },
              { label: 'quiz_result', desc: 'Pattern key: a (cortisol), b (rhythm), c (insulin), d (adaptation) (nullable)' },
              { label: 'quiz_answers', desc: 'JSON object of all 5 quiz answers (nullable)' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Required SQL migrations</p>
            <p>If setting up from scratch or adding to an existing challenge_enrollments table, run the following in the Supabase SQL editor:</p>
            <pre className="text-[12.5px] bg-[#EFF1F4] text-[#1056D6] rounded-lg p-4 mt-2 overflow-x-auto whitespace-pre-wrap">{`ALTER TABLE challenge_enrollments
  ADD COLUMN IF NOT EXISTS parq_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS parq_responses jsonb,
  ADD COLUMN IF NOT EXISTS health_dec_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS quiz_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS quiz_result text,
  ADD COLUMN IF NOT EXISTS quiz_answers jsonb;`}</pre>
          </Section>

          <Section id="ch-prelaunch" title="Pre-Launch Checklist" colour="teal">
            <p>Everything that needs to be in place before the challenge is open to the public.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Recording</p>
            <div className="space-y-2">
              <ChecklistItem text="Record the Day 5 Week One Progress Session (v6.1 single HeyGen render). Script is at 02_AMANDA_PRODUCTION/00_SCRIPTS_INBOX/DAY5_SESSION_SCRIPT_v6.docx (internal v6.1) in Dropbox." />
              <ChecklistItem text="Upload the recording to a hosting platform (Vimeo or YouTube unlisted recommended)." />
            </div>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Environment Variables (Vercel)</p>
            <div className="space-y-2">
              <ChecklistItem text="Set CHALLENGE_SESSION_VIDEO_URL - the direct video URL for the Day 5 email link." />
              <ChecklistItem text="Set NEXT_PUBLIC_CHALLENGE_SESSION_VIDEO_URL - the same URL for the portal Watch the session button." />
              <ChecklistItem text={`Confirm RESEND_API_KEY is set and the ${coach().email} sending domain is verified.`} />
              <ChecklistItem text="Confirm TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER are set." />
              <ChecklistItem text="Confirm INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY are set for production Inngest." />
            </div>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Supabase</p>
            <div className="space-y-2">
              <ChecklistItem text="Run the SQL migration to add parq_completed_at, parq_responses, health_dec_completed_at, quiz_completed_at, quiz_result, quiz_answers columns to challenge_enrollments." />
              <ChecklistItem text="Confirm challenge_enrollments table exists with token column defaulting to gen_random_uuid()." />
            </div>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">End-to-end test</p>
            <div className="space-y-2">
              <ChecklistItem text="Complete the signup form at bodyrecode.au/challenge with a real name, email, and phone." />
              <ChecklistItem text="Confirm welcome email arrives with correct portal link." />
              <ChecklistItem text={`Confirm coach notification email arrives at ${coach().email} with name, email, phone, and time.`} />
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

          {/* ── BLUEPRINT ─────────────────────────────────────────── */}
          <Section id="bp-overview" title="Blueprint Overview" colour="teal">
            <p>The 6-Week Body Rewire Blueprint is a paid consumer product ($97 AUD one-time) that sits at Stage 2 of the Body Recode funnel. Participants purchase via Stripe, receive a token-gated portal, and complete a 6-week pattern-specific programme covering training, nutrition, and education.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Purpose in the funnel</p>
            <p>The Blueprint is the direct ascension from the 14-Day Challenge. Challenge graduates are driven to the Blueprint via the Day 14 CTA. Direct buyers (no challenge) go through a two-question pattern assessment before their portal opens. At Week 6, members are presented with the Body Recode Membership ascension CTA.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Key URLs</p>
            <StatusList items={[
              { label: 'Sales page', desc: 'app.bodyrecode.au/blueprint - sales page with Stripe checkout' },
              { label: 'Member portal', desc: 'app.bodyrecode.au/blueprint/[token] - token-gated, unique per buyer' },
              { label: 'Pending page', desc: 'app.bodyrecode.au/blueprint/pending - shown after Stripe checkout while webhook processes' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">The four biological patterns</p>
            <StatusList items={[
              { label: 'Stress-Stored', desc: 'Cortisol driver. Fat stored at waist and stomach. Wired but tired at night.' },
              { label: 'Insulin-Drift', desc: 'Insulin driver. Mid-back, lower back and love handles rather than the front. Afternoon crash, evening cravings, post-meal fatigue. Male-leaning per doctrine.' },
              { label: 'Estrogen-Shift', desc: 'Oestrogen driver. Hip and thigh storage, water retention, cycle irregularity, mood variability. Female-only per doctrine.' },
              { label: 'Androgen-Decline', desc: 'Testosterone driver. Reduced muscle tone, reduced drive, capacity slipping despite consistent effort. Male-only per doctrine.' },
            ]} />
          </Section>

          <Section id="bp-sales" title="Sales Page" colour="teal">
            <p>Found at <strong>app.bodyrecode.au/blueprint</strong>. Light theme matching Blueprint brand. Contains hero, pattern cards, three-phase breakdown, what you get, mid-CTA, and footer checkout form.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Checkout form</p>
            <p>Name and email collected on the sales page. Submits to <strong>POST /api/blueprint/checkout</strong> which creates a Stripe one-time checkout session at $97 AUD. On success, the user is redirected to Stripe. On payment, the webhook fires and creates the enrollment.</p>

            <Note>The sales page does not collect phone numbers. Pattern is not collected at checkout - it is either carried from the challenge or determined via the two-question assessment inside the portal.</Note>
          </Section>

          <Section id="bp-purchase" title="Purchase Flow" colour="teal">
            <p>When Stripe fires <strong>checkout.session.completed</strong> with <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">metadata.type === &apos;blueprint_purchase&apos;</code>, the webhook runs the following steps:</p>

            <div className="space-y-2 mt-2">
              <ChecklistItem text="Check if the buyer has a challenge enrollment with a completed quiz result - if so, the pattern is pre-loaded from the challenge." />
              <ChecklistItem text="Create a blueprint_enrollments row with email, first_name, pattern (or 'pending' if no challenge data), pattern_source, and stripe_payment_intent_id." />
              <ChecklistItem text="Send welcome email to the buyer with their portal link and pattern (or assessment gate notice if pending)." />
              <ChecklistItem text={`Send coach notification email to ${coach().email}.`} />
              <ChecklistItem text="Fire the blueprint/enrolled Inngest event, which triggers the week-advance function and the 7-email sequence." />
            </div>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Pattern assessment gate</p>
            <p>If a buyer has no challenge quiz result, their portal shows a two-question assessment before opening. Q1 asks where they notice excess puffiness. Q2 asks which energy/mood description fits best. The answer to Q2 determines the pattern. On submit, the portal calls <strong>POST /api/blueprint/set-pattern</strong> which updates the enrollment and opens the portal.</p>
          </Section>

          <Section id="bp-portal" title="Member Portal" colour="teal">
            <p>Found at <strong>app.bodyrecode.au/blueprint/[token]</strong>. Dark theme. Five tabs: Home, Training, Nutrition, Education, Check-In.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Tab overview</p>
            <StatusList items={[
              { label: 'Home', desc: 'Pattern banner, current week and phase, weekly coaching note, phase structure, midpoint reflection (Week 3), ascension CTA (Week 6)' },
              { label: 'Training', desc: 'Three sessions (A/B/C) with gym/home/bodyweight toggle. Pattern-specific RIR progression table and rules.' },
              { label: 'Nutrition', desc: 'HABNS foundation foods, remove list, hand portion guide, pattern-specific adjustments, meal timing toggle (train later vs train first thing).' },
              { label: 'Education', desc: 'Five biology lessons, week-locked (Lesson 1 open, 2-5 unlock weekly). Loom video embed, transcript, pattern callout per lesson.' },
              { label: 'Check-In', desc: '8-marker weekly form. History of previous submissions displayed below the form.' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Conditional cards on Home tab</p>
            <StatusList items={[
              { label: 'Midpoint reflection (Week 3)', desc: 'Appears when current_week === 3. Structured reflection prompts and progress acknowledgement.' },
              { label: 'Ascension CTA (Week 6)', desc: 'Appears when current_week === 6. Presents the Body Recode Membership offer at $49/week. Primary CTA links to /membership.' },
            ]} />

            <Note>The portal is server-rendered on first load (fetches enrollment from Supabase), then hydrates as a client component. Token is in the URL - no login required. Tokens are 64 hex characters, not guessable.</Note>
          </Section>

          <Section id="bp-patterns" title="Biological Patterns" colour="teal">
            <p>All four patterns use identical session exercises. The pattern determines the RIR targets, progression rules, and the specific nutrition overlays applied to the HABNS foundation.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Training sessions</p>
            <StatusList items={[
              { label: 'Session A', desc: 'Strength Base - squat, press, row, lunge, core' },
              { label: 'Session B', desc: 'Conditioning and Volume - hinge, overhead press, lunge, pull, finisher (pattern-dependent)' },
              { label: 'Session C', desc: 'Balance and Stability - front squat, incline press, row, walking lunge, core' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Pattern-specific rules (key differences)</p>
            <StatusList items={[
              { label: 'Stress-Stored', desc: 'Skip Session B finisher. Zone 2 walking only. Sleep outranks training. 3 RIR throughout, deload at Week 6 with 30% set reduction.' },
              { label: 'Insulin-Drift', desc: 'Session B finisher mandatory. Post-session walk required. Train fasted where possible. Carbs timed to 90-min post-session window only.' },
              { label: 'Estrogen-Shift', desc: 'Finisher optional at 6/10 effort. Never miss a session. Never add extra sessions. Hold intensity if cycle timing disrupts recovery.' },
              { label: 'Androgen-Decline', desc: 'Skip finisher. No extra cardio. 2-3 min rest between sets. Protect resistance training stimulus. Drop to 2 working sets if energy is significantly depleted.' },
            ]} />
          </Section>

          <Section id="bp-checkin" title="Weekly Check-In" colour="teal">
            <p>The weekly check-in is an 8-marker form inside the Blueprint portal. One submission per week per enrollment. Saved to the <strong>blueprint_checkins</strong> table.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">The 8 markers</p>
            <StatusList items={[
              { label: 'Energy Levels', desc: 'General energy across the day (1-5)' },
              { label: 'Morning Energy', desc: 'How the member feels in the first hour of waking (1-5)' },
              { label: 'Sleep Quality', desc: 'Quality and depth of sleep (1-5)' },
              { label: 'Afternoon Crash', desc: '1 = severe crash, 5 = no crash (1-5)' },
              { label: 'Hunger and Cravings', desc: '1 = constant cravings, 5 = controlled and stable (1-5)' },
              { label: 'Training Recovery', desc: 'Recovery between sessions (1-5)' },
              { label: 'Mood Stability', desc: 'Consistency of mood across the week (1-5)' },
              { label: 'Physical Changes', desc: 'Visible or felt changes in body composition (1-5)' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">API</p>
            <StatusList items={[
              { label: 'POST /api/blueprint/checkin', desc: 'Saves a weekly check-in. Validates token, checks week is not already submitted (unique constraint on enrollment_id + week_number). Returns 409 on duplicate.' },
              { label: 'GET /api/blueprint/checkin?token=', desc: 'Returns all check-ins for the enrollment, ordered by week_number ascending.' },
            ]} />
          </Section>

          <Section id="bp-automation" title="Automation and Emails" colour="teal">
            <p>Two Inngest functions are triggered on the <strong>blueprint/enrolled</strong> event, fired from the Stripe webhook after enrollment creation.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">blueprintWeekAdvanceFunction</p>
            <p>Sleeps 7 days then advances <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">current_week</code> from 1 to 2, sleeps again, advances to 3, and so on up to week 6. On each advance it also sends a check-in prompt email. If the check-in is not submitted within 2 days, a reminder email fires automatically.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Check-in email cadence (per week)</p>
            <div className="space-y-1 mt-2">
              <SeqRow day="Day 7 (week advance)" label="Check-in prompt - Week X is complete, submit your check-in" />
              <SeqRow day="Day 9 (if no submission)" label="Reminder - check-in still outstanding" />
            </div>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">blueprintEmailSequenceFunction</p>
            <p>Sends 7 coaching emails across 7 weeks. Fetches the pattern at send time (handles pending-pattern buyers whose pattern resolves after purchase). Email subjects and content are pattern-specific.</p>
            <div className="space-y-1 mt-2">
              <SeqRow day="Week 1 (immediate)" label="Welcome and pattern introduction" />
              <SeqRow day="Week 2" label="Insulin lesson preview + nutrition reminder" />
              <SeqRow day="Week 3" label="Midpoint check-in prompt" />
              <SeqRow day="Week 4" label="Testosterone/thyroid lesson preview" />
              <SeqRow day="Week 5" label="Sleep lesson preview + recovery focus" />
              <SeqRow day="Week 6" label="Ascension - what comes next" />
              <SeqRow day="Week 7" label="Final follow-up if no ascension action taken" />
            </div>

            <Note>Check-in prompt emails and coaching sequence emails are separate. A buyer receives both - the coaching sequence is educational, the check-in prompts are action-driven.</Note>
          </Section>

          <Section id="bp-database" title="Database" colour="teal">
            <p className="text-[12.5px] font-medium text-[#666D7A] mb-2">blueprint_enrollments</p>
            <StatusList items={[
              { label: 'id', desc: 'UUID primary key' },
              { label: 'token', desc: 'Unique 64-char hex token. Used in all portal URLs.' },
              { label: 'email', desc: 'Buyer email, lowercased' },
              { label: 'first_name', desc: 'First name extracted from full name at purchase' },
              { label: 'pattern', desc: 'stress-stored | metabolic-drift | hormonal-shift | system-overload | pending' },
              { label: 'pattern_source', desc: 'challenge | assessment - how the pattern was determined' },
              { label: 'current_week', desc: 'Integer 1-6, advanced by Inngest weekly' },
              { label: 'stripe_payment_intent_id', desc: 'Stripe payment reference' },
              { label: 'purchase_date', desc: 'Timestamptz, set at enrollment creation' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">blueprint_checkins</p>
            <StatusList items={[
              { label: 'enrollment_id', desc: 'FK to blueprint_enrollments.id' },
              { label: 'week_number', desc: 'Integer 1-6. Unique constraint with enrollment_id prevents duplicate weekly submissions.' },
              { label: '8 marker columns', desc: 'energy_levels, morning_energy, sleep_quality, afternoon_crash, hunger_cravings, training_recovery, mood_stability, physical_changes - all int 1-5' },
              { label: 'notes', desc: 'Optional text field' },
            ]} />

            <Note>To create a test enrollment: INSERT INTO blueprint_enrollments (email, first_name, pattern, pattern_source, current_week) VALUES (&apos;email&apos;, &apos;Name&apos;, &apos;stress-stored&apos;, &apos;assessment&apos;, 1) RETURNING token;</Note>
          </Section>

          {/* ── MEMBERSHIP ────────────────────────────────────────── */}
          <Section id="mb-overview" title="Membership Overview" colour="teal">
            <p>The Body Recode Membership is Stage 3 of the funnel. $49 per week, billed weekly via Stripe subscription. Members access ongoing pattern-specific programming across three rotating 6-week blocks (Block A, B, C). After Block C, a pattern re-assessment determines whether the cycle resets or the dominant pattern has shifted.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">What members get</p>
            <StatusList items={[
              { label: 'Progressive training blocks', desc: 'Block A (Consolidate), B (Advance), C (Refine) - 6 weeks each. All 4 patterns, all 3 equipment modes.' },
              { label: 'Nutrition precision layers', desc: 'Each block adds a new nutrition strategy on top of the HABNS foundation - carb cycling, cycle-aware eating, recovery protocols.' },
              { label: 'Monthly coach Loom', desc: 'Kade reviews check-in data and records a personal 3-5 minute Loom response each month.' },
              { label: 'Monthly group Q&A call', desc: 'Live monthly call. Replays available in the portal.' },
              { label: 'Pattern resource library', desc: '3 deep-dive guides per pattern (12 total) - supplement protocols, biology explanations, lifestyle tools.' },
              { label: 'Check-in trend dashboard', desc: '8-marker data visualised over time with bar charts and running averages.' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Key URLs</p>
            <StatusList items={[
              { label: 'Sales page', desc: 'app.bodyrecode.au/membership - sales page with Stripe subscription checkout' },
              { label: 'Member portal', desc: 'app.bodyrecode.au/membership/[token] - token-gated, unique per member' },
              { label: 'Welcome page', desc: 'app.bodyrecode.au/membership/welcome - post-purchase confirmation' },
            ]} />
          </Section>

          <Section id="mb-sales" title="Sales Page" colour="teal">
            <p>Found at <strong>app.bodyrecode.au/membership</strong>. Light theme. Sections: hero, what this is, progression timeline (Blueprint to Block C), what you get (6 items), Block A pattern previews, pricing, who this is for, final CTA.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Checkout form</p>
            <p>Name and email collected on the sales page. Submits to <strong>POST /api/membership/checkout</strong> which creates a Stripe subscription session at $49/week AUD (weekly recurring billing). On payment, the Stripe webhook fires and creates the membership enrollment.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Blueprint integration</p>
            <p>The checkout API checks if the buyer already has a Blueprint enrollment. If so, the pattern is carried over automatically - no re-assessment needed. The Blueprint portal token is stored on the membership enrollment record for reference.</p>
          </Section>

          <Section id="mb-purchase" title="Purchase Flow" colour="teal">
            <p>When Stripe fires <strong>checkout.session.completed</strong> with <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">metadata.type === &apos;membership_purchase&apos;</code>, the webhook runs the following steps:</p>

            <div className="space-y-2 mt-2">
              <ChecklistItem text="Create a membership_enrollments row with email, first_name, pattern (from Blueprint if available), blueprint_token reference, stripe_subscription_id, current_block A, current_week 1." />
              <ChecklistItem text="Send welcome email to the member with their portal link." />
              <ChecklistItem text={`Send coach notification email to ${coach().email}.`} />
              <ChecklistItem text="Fire the membership/enrolled Inngest event, which triggers the membershipWeekAdvanceFunction." />
            </div>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Ascension from Blueprint</p>
            <p>Blueprint members at Week 6 see the ascension CTA card on their Home tab. The primary CTA links directly to <strong>/membership</strong>. Their email pre-fills and their pattern carries over on checkout - no friction in the transition.</p>
          </Section>

          <Section id="mb-portal" title="Member Portal" colour="teal">
            <p>Found at <strong>app.bodyrecode.au/membership/[token]</strong>. Dark theme. Six tabs: Home, Training, Nutrition, Resources, Check-In, Trends.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Tab overview</p>
            <StatusList items={[
              { label: 'Home', desc: 'Pattern banner, current block and week, current phase, weekly coaching note, block phase structure.' },
              { label: 'Training', desc: 'Equipment toggle (gym/home/bodyweight). Block-specific sessions with RIR progression table and pattern rules. Updates automatically when block advances.' },
              { label: 'Nutrition', desc: 'Block-specific nutrition strategy for the current pattern. Phase notes. Foundation (HABNS) reminder.' },
              { label: 'Resources', desc: '3 deep-dive pattern guides per pattern. Expandable accordion cards.' },
              { label: 'Check-In', desc: '8-marker weekly form. Previous submissions displayed below. One per week per enrollment.' },
              { label: 'Trends', desc: 'Averages dashboard and week-by-week bar charts for all 8 check-in markers.' },
            ]} />

            <Note>The portal reads current_block and current_week from the membership_enrollments table. When Inngest advances these values, the member refreshes and sees the updated block content automatically - no code change required.</Note>
          </Section>

          <Section id="mb-blocks" title="Block Structure" colour="teal">
            <p>Three 6-week blocks complete an 18-week cycle. Each block has 4 phases: Reset (weeks 1-2), Build (weeks 3-4), Load (week 5), Deload/Recover (week 6).</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Block progression</p>
            <StatusList items={[
              { label: 'Block A - Consolidate', desc: 'Builds on Blueprint foundations. More complex movements, supersets introduced, nutrition precision layers added.' },
              { label: 'Block B - Advance', desc: 'Heavier barbell compounds, superset pairings, higher volume for applicable patterns. Calorie periodisation introduced.' },
              { label: 'Block C - Refine', desc: 'Peak intensity of the full cycle. Tri-sets, lowest rep ranges, highest loads. Pattern re-assessment follows Block C week 6.' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Content structure</p>
            <p>Each block has: 3 sessions x 3 equipment modes x 4 patterns = 36 session variations. Plus pattern-specific RIR progressions, rules, nutrition strategies, and 6 weekly coaching notes per pattern (24 notes per block, 72 total across all blocks).</p>
          </Section>

          <Section id="mb-checkin" title="Check-In and Trends" colour="teal">
            <p>Same 8-marker structure as the Blueprint check-in. One submission per week per enrollment. Saved to the <strong>membership_checkins</strong> table.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">API</p>
            <StatusList items={[
              { label: 'POST /api/membership/checkin', desc: 'Saves a weekly check-in. Unique constraint on enrollment_id + week_number prevents duplicates.' },
              { label: 'GET /api/membership/checkin?token=', desc: 'Returns all check-ins for the enrollment, ordered by week_number ascending.' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Trends dashboard</p>
            <p>The Trends tab visualises check-in data in two views. Averages: a 2-column grid showing the mean score for each marker across all submissions, colour-coded green/amber/red. Week by week: a bar chart for each marker showing score per week as proportional bars.</p>

            <Note>Blueprint check-in data and membership check-in data are stored in separate tables. The Trends tab currently shows membership data only. A future enhancement could merge both datasets to show the full programme history.</Note>
          </Section>

          <Section id="mb-automation" title="Automation" colour="teal">
            <p className="text-[12.5px] font-medium text-[#666D7A] mb-2">membershipWeekAdvanceFunction</p>
            <p>Triggered by the <strong>membership/enrolled</strong> Inngest event. Sleeps 7 days then advances <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">current_week</code> within the current block. On each advance it sends a check-in prompt email. If no check-in is submitted within 2 days, a reminder fires. After week 6, advances <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">current_block</code> to the next block and resets <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">current_week</code> to 1. Checks <code className="text-[#1B6DFC] text-[12.5px] bg-[#EFF1F4] px-1 py-0.5 rounded">cancelled_at</code> before each step.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Check-in email cadence (per week)</p>
            <div className="space-y-1 mt-2">
              <SeqRow day="Day 7 (week advance)" label="Check-in prompt - Block X Week Y is complete, submit your check-in. Mentions monthly Loom review." />
              <SeqRow day="Day 9 (if no submission)" label="Reminder - check-in outstanding. Reminder that without data the monthly Loom review is limited." />
            </div>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Block advance logic</p>
            <div className="space-y-1 mt-2">
              <SeqRow day="Block A Weeks 1-6" label="current_week advances 1 through 6 over 6 weeks" />
              <SeqRow day="Block A complete" label="current_block set to B, current_week reset to 1" />
              <SeqRow day="Block B Weeks 1-6" label="current_week advances 1 through 6" />
              <SeqRow day="Block B complete" label="current_block set to C, current_week reset to 1" />
              <SeqRow day="Block C Weeks 1-6" label="current_week advances 1 through 6" />
              <SeqRow day="Block C complete" label="Pattern re-assessment - manual process, not yet automated" />
            </div>
          </Section>

          <Section id="mb-database" title="Database" colour="teal">
            <p className="text-[12.5px] font-medium text-[#666D7A] mb-2">membership_enrollments</p>
            <StatusList items={[
              { label: 'id', desc: 'UUID primary key' },
              { label: 'token', desc: 'Unique 64-char hex token. Used in all portal URLs.' },
              { label: 'email', desc: 'Member email, lowercased' },
              { label: 'first_name', desc: 'First name' },
              { label: 'pattern', desc: 'stress-stored | metabolic-drift | hormonal-shift | system-overload | pending' },
              { label: 'pattern_source', desc: 'blueprint | assessment - how the pattern was determined' },
              { label: 'blueprint_token', desc: 'FK to blueprint_enrollments.token - null if direct join with no Blueprint history' },
              { label: 'stripe_subscription_id', desc: 'Stripe subscription reference for cancellation handling' },
              { label: 'current_block', desc: 'A | B | C - advanced by Inngest' },
              { label: 'current_week', desc: 'Integer 1-6 within the current block - advanced by Inngest' },
              { label: 'cancelled_at', desc: 'Set when Stripe fires customer.subscription.deleted' },
            ]} />

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">membership_checkins</p>
            <StatusList items={[
              { label: 'enrollment_id', desc: 'FK to membership_enrollments.id' },
              { label: 'week_number', desc: 'Integer. Unique constraint with enrollment_id prevents duplicate weekly submissions.' },
              { label: '8 marker columns', desc: 'Same as blueprint_checkins - all int 1-5' },
              { label: 'notes', desc: 'Optional text field' },
            ]} />

            <Note>To create a test membership enrollment: INSERT INTO membership_enrollments (email, first_name, pattern, pattern_source, current_block, current_week) VALUES (&apos;email&apos;, &apos;Name&apos;, &apos;stress-stored&apos;, &apos;blueprint&apos;, &apos;A&apos;, 1) RETURNING token;</Note>
          </Section>

          <Section id="mb-library" title="Library and State Field Guides" colour="teal">
            <p>The <strong>Library</strong> is the canonical reader surface for every PDF the platform sells. Three State Field Guides shipped 2026-06-06 (Depleted / Transitioning / Ready, ~41-44 pages each), authored as state-matched playbooks for the three scorecard cohorts and bundled with the $37 Scorecard Report.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Token routing</p>
            <p>The route is <code>/library/{'{token}'}</code> and the token resolves two ways: an <code>active membership_enrollments.token</code> shows every active <code>field_guide</code> and <code>protocol</code> entitled to members, OR a <code>digital_asset_purchases.id</code> shows that cold buyer their single asset. Same reader code, different token shape.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">PDF reader</p>
            <p>Click into any library item and the reader at <code>/library/{'{token}'}/{'{slug}'}</code> server-renders an iframe pointing at a 24-hour Supabase signed URL (private bucket <code>library-assets</code>). Download CTA in the top-right delivers the PDF directly.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Adding a new asset</p>
            <p>Render the PDF → upload to <code>library-assets/{'{folder}/{slug}'}-v1.pdf</code> → seed one row in <code>be_products</code> + one in <code>digital_asset_metadata</code>. Members see the new item the moment the metadata row is <code>active = true</code>. For Field Guides use <code>kind = &apos;field_guide&apos;</code> with the right <code>state_match</code>; for protocols use <code>kind = &apos;protocol&apos;</code>.</p>
          </Section>

          <Section id="mb-bolt-ons" title="Bolt-on Store and Protocol Packs" colour="teal">
            <p>The <strong>Bolt-on Store</strong> (shipped 2026-06-07) is the members-only à-la-carte ascension surface above the $49/wk Membership. First pack live: <strong>The Sleep Reset Protocol</strong> ($19, a seven-day intervention to restore sleep architecture). Three more Protocol Packs queued (Travel Adaptation / Deload Week / Cycle Syncing) plus four AI Deep-Dives queued.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Member entry points</p>
            <p>The PRIMARY discovery surface is a <strong>featured-bolt-on card on the member portal Home tab</strong> at <code>/membership/{'{token}'}</code>. Server picker in <code>membership/[token]/page.tsx::pickFeaturedBoltOn</code> chooses the most recent active <code>protocol</code> / <code>bolt_on_ai</code> the member hasn&apos;t purchased and renders a cover-thumbnail card with a Read link straight to the per-pack ad detail page. Secondary discovery is a <strong>Bolt-on store →</strong> link in the library top-right at <code>/library/{'{member_token}'}</code>. Non-members hitting <code>/library/{'{token}'}/store</code> directly get the &quot;Unlocks inside Membership&quot; upgrade prompt routing to <code>/membership</code>.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Library gating (important)</p>
            <p>Field Guides are member-entitled — they appear in <code>/library/{'{token}'}</code> for every active member. Protocols + AI deep-dives are PAID bolt-ons — they appear in the library ONLY after a fulfilled <code>digital_asset_purchases</code> row exists matched on <code>email_at_purchase</code> (lowercased) for that member. Don&apos;t change this gate without thinking about it.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">AI Deep-Dives — instant_engine fulfilment (Phase C.9)</p>
            <p>AI Deep-Dive products (<code>kind=&apos;bolt_on_ai&apos;</code>, <code>fulfilment_kind=&apos;instant_engine&apos;</code>) generate their content on purchase rather than serving a pre-uploaded PDF. The pipe: Stripe webhook → synchronous &quot;generating&quot; email → fires Inngest event <code>digital_asset/engine_call</code> → <code>fulfilInstantEngine(purchase_id)</code> orchestrator runs the matching engine (dispatched by <code>digital_asset_metadata.engine_call</code> = <code>trajectory</code> | <code>cffs</code> | <code>fat_map</code> | <code>health_markers</code>) → stores engine output in <code>digital_asset_purchases.raw.engine_output</code> → renders <code>/render/deep-dive/{'{purchase_id}'}?secret=...</code> via puppeteer → uploads PDF to <code>library-assets/deep-dives/{'{purchase_id}'}.pdf</code> → marks fulfilled → sends &quot;ready&quot; email. Typical run is 5-10 minutes end to end.</p>
            <p>The render route is gated by <code>DEEP_DIVE_RENDER_SECRET</code> shared in <code>?secret=...</code>. Set this env var in <code>.env.local</code> AND Vercel Preview + Production. Without it, the orchestrator throws on every deep-dive purchase.</p>
            <p><strong>Eligibility — AI Deep-Dives require a coaching <code>clients</code> row.</strong> The store index, ad page, and member-portal featured card all hide <code>bolt_on_ai</code> products from members whose email does not match an active <code>clients</code> row (the engines read CFFS / CFWS / programs). Direct <code>/library/{'{token}'}/store/{'{ai-slug}'}</code> visits 404 for ineligible members.</p>
            <p>Shipped <code>trajectory-deep-dive</code> ($29) 2026-06-08 as the first deep-dive. Three more queued: <code>fat_map</code> (Fat Map re-read), <code>cffs</code> (full CFFS re-run), <code>health_markers</code> (blood-panel deep-dive). Each new deep-dive needs: a switch case in <code>fulfilInstantEngine</code>, a layout in <code>/render/deep-dive/[purchase_id]/page.tsx</code>, an entry in <code>bolt-on-ad-copy.ts</code>, a cover in Storage, and a seed SQL block.</p>
            <p>To test an instant_engine deep-dive without going through Stripe, call the admin endpoint: <code>GET /api/admin/test-digital-asset-delivery?slug=trajectory-deep-dive&amp;email={'{coaching_client_email}'}</code> (sign into the dashboard first). The endpoint detects <code>fulfilment_kind=&apos;instant_engine&apos;</code> and runs the orchestrator inline so any error surfaces in the response.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Store index</p>
            <p>The index at <code>/library/{'{member_token}'}/store</code> shows every active product where <code>kind IN (&apos;protocol&apos;, &apos;bolt_on_ai&apos;, &apos;bolt_on_human&apos;, &apos;bolt_on_physical&apos;)</code>, grouped by category. Each card shows the pack&apos;s cover thumbnail + tagline + price + a <strong>Read more →</strong> link to the ad detail page.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Per-pack ad page</p>
            <p>Clicking a card lands on <code>/library/{'{member_token}'}/store/{'{slug}'}</code> — the actual sales surface. Cover hero left, headline + sub right, primary &quot;Add&quot; card with the price, three columns (Who this is for / What is inside / Format), dark CTA footer with a second &quot;Add&quot;. Ad copy lives in <code>src/lib/bolt-on-ad-copy.ts</code> keyed by slug.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Checkout and delivery</p>
            <p>The <strong>Add</strong> button POSTs to <code>/api/digital-assets/checkout</code> with the member&apos;s email pre-filled and a <code>bolt_on_store_{'{kind}'}</code> source attribution. Stripe Checkout returns to <code>/library/pending</code>. Fulfilment runs through the same Phase A <code>fulfilInstantPdf()</code> webhook branch as Field Guides — instant delivery email + library row.</p>

            <p className="text-[12.5px] font-medium text-[#666D7A] mt-4 mb-2">Adding a new pack</p>
            <StatusList items={[
              { label: '1. Author', desc: 'Write the pack markdown (~2,500 words for protocol packs). Voice: short, prescriptive, no em dashes.' },
              { label: '2. Render PDF', desc: 'Run /tmp/render_protocol_pack.py with a new PACK_CONFIG entry. NextPageTemplate MUST come BEFORE PageBreak in build_cover_flow.' },
              { label: '3. Render cover PNG', desc: 'pypdfium2 render page 1 at 2.5x, upload to library-assets/{folder}/{slug}-v1-cover.png.' },
              { label: '4. Ad copy', desc: 'Add a slug entry to src/lib/bolt-on-ad-copy.ts (tagline, hero, who-it-is-for, what-is-inside, format).' },
              { label: '5. Seed SQL', desc: 'One row in be_products (type=one_time, category=body_recode, kind=protocol|bolt_on_ai), one in digital_asset_metadata.' },
              { label: '6. Verify', desc: 'Adapt scripts/verify-sleep-reset-e2e.ts with the new slug, run, expect 5/5 green.' },
            ]} />
            <Note>The Phase A <code>instant_engine</code> fulfilment branch is a stub today. The four queued AI Deep-Dives will need that branch wired into Inngest before they can sell.</Note>
          </Section>

        </div>
      </div>
    </div>
  )
}

function Section({ id, title, colour, children }: { id: string; title: string; colour: 'teal' | 'amber' | 'violet'; children: React.ReactNode }) {
  const accent = colour === 'amber' ? '#B7791F' : colour === 'violet' ? '#a78bfa' : '#1B6DFC'
  return (
    <div id={id} className="br-card overflow-hidden scroll-mt-8">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[#E8EAEE]">
        <span
          className="w-7 h-[3px] rounded-full shrink-0"
          style={{ background: accent }}
        />
        <h2
          className="text-[12px] font-medium"
          style={{
            fontFamily: "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace",
            letterSpacing: '0.14em',
            color: accent,
          }}
        >
          {title}
        </h2>
      </div>
      <div className="px-6 py-5 space-y-3 text-[#43474F] text-[14px] leading-relaxed">
        {children}
      </div>
    </div>
  )
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-4 h-4 rounded border border-[#CFD4DC] shrink-0 mt-0.5" />
      <p className="text-[#43474F] text-sm leading-relaxed">{text}</p>
    </div>
  )
}

function Training({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-violet-50 border border-violet-400/20 rounded-lg px-4 py-3 space-y-1">
      <p className="text-[12.5px] font-medium text-violet-300 mb-2">{title}</p>
      <div className="text-[12.5px] text-[#43474F] leading-relaxed space-y-1">
        {children}
      </div>
    </div>
  )
}

function StatusList({ items }: { items: { label: string; desc: string }[] }) {
  return (
    <div className="grid gap-1.5">
      {items.map(item => (
        <div key={item.label} className="flex items-start gap-3 bg-[#EFF1F4]/50 rounded-lg px-3 py-2">
          <span className="text-[#1B6DFC] font-semibold text-[12.5px] shrink-0 mt-0.5">{item.label}</span>
          <span className="text-[#666D7A] text-[12.5px]">{item.desc}</span>
        </div>
      ))}
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="br-card px-4 py-3 text-[12px] text-[#666D7A] leading-relaxed">
      <span className="font-bold text-[#43474F]">Note: </span>{children}
    </div>
  )
}

function FlowRow({ trigger, from, to, auto }: { trigger: string; from: string; to: string; auto: boolean }) {
  return (
    <div className="flex items-start gap-3 bg-[#EFF1F4]/50 rounded-lg px-3 py-2.5">
      <span className={`text-xs font-bold shrink-0 mt-0.5 w-16 ${auto ? 'text-[#1B6DFC]' : 'text-[#A96A12]'}`}>
        {auto ? 'AUTO' : 'MANUAL'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] text-[#43474F]">{trigger}</p>
        {from !== '-' && (
          <p className="text-[12.5px] text-[#98A0AD] mt-0.5">
            <span className="text-[#666D7A]">{from}</span>
            <span className="mx-1.5">→</span>
            <span className="text-[#141821] font-medium">{to}</span>
          </p>
        )}
      </div>
    </div>
  )
}

function SeqRow({ day, label }: { day: string; label: string }) {
  return (
    <div className="flex items-start gap-3 bg-[#EFF1F4]/40 rounded-lg px-3 py-2">
      <span className="text-[12.5px] font-semibold text-[#1B6DFC] shrink-0 w-20">{day}</span>
      <span className="text-[12.5px] text-[#43474F]">{label}</span>
    </div>
  )
}
