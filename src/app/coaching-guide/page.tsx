'use client'

import { useEffect, useRef, useState } from 'react'

const sections = [
  { id: 'coach', label: 'Note from Your Coach' },
  { id: 'welcome', label: 'Welcome to Active Coaching' },
  { id: 'biology', label: 'Performance & Biology' },
  { id: 'activation', label: 'Commitment and Activation' },
  { id: 'documentation', label: 'Initial Documentation' },
  { id: 'data', label: 'Data Collection & Baseline' },
  { id: 'start-window', label: 'Deliberate Start Window' },
  { id: 'cffs', label: 'CFFS' },
  { id: 'ieep', label: 'IEEP' },
  { id: 'roles', label: 'Roles and Expectations' },
  { id: 'how-it-works', label: 'How Coaching Works' },
  { id: 'cadence', label: 'Weekly Cadence' },
  { id: 'cfws', label: 'CFWS' },
  { id: 'body-state', label: 'Body State & Re-evaluation' },
  { id: 'holds', label: 'Holds, Deloads & Rebuilds' },
  { id: 'long-arc', label: 'The Long Arc' },
  { id: 'communication', label: 'Communication' },
  { id: 'closing', label: 'Closing' },
]

export default function CoachingGuidePage() {
  const [activeId, setActiveId] = useState('coach')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id)
        }
      })
    }

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    })

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observerRef.current?.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <div className="max-w-5xl mx-auto px-6 py-16 lg:flex lg:gap-14">

        {/* Sidebar */}
        <aside className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-16">
            <p className="text-[9px] text-stone-600 uppercase tracking-[0.2em] font-semibold mb-5">Contents</p>
            <nav className="space-y-0.5">
              {sections.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`block w-full text-left text-xs leading-snug px-2 py-1.5 rounded transition-colors ${
                    activeId === id
                      ? 'text-teal-400 bg-teal-400/5'
                      : 'text-stone-500 hover:text-stone-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">

          {/* Header */}
          <div className="mb-16">
            <p className="text-[10px] text-stone-600 uppercase tracking-[0.25em] font-semibold mb-10">Body Recode&trade; &middot; Performance Coaching</p>
            <div className="w-8 h-px bg-teal-400/60 mb-8" />
            <h1 className="text-4xl font-light text-white mb-4 leading-tight tracking-tight">Active Coaching<br />Client Guide</h1>
            <p className="text-stone-400 text-base leading-relaxed">Your roadmap for how coaching works, how we train, and how progress is built.</p>
          </div>

          <div className="border-l-2 border-teal-400/30 pl-6 mb-16">
            <p className="text-stone-400 text-sm leading-relaxed italic">This guide explains the structure, expectations, and process you will follow throughout your coaching journey inside the Body Recode&trade; system.</p>
          </div>

          <div className="space-y-20 text-stone-300 text-[15px] leading-relaxed">

            <GuideSection id="coach" title="A Note from Your Coach">
              <div className="flex items-center gap-5 mb-6">
                <img
                  src="https://bodyrecode.au/kade.jpg"
                  alt="Kade Dunstone"
                  width={72}
                  height={72}
                  className="rounded-full object-cover object-top shrink-0"
                />
                <div>
                  <p className="text-white font-semibold text-sm">Kade Dunstone</p>
                  <p className="text-stone-500 text-xs mt-0.5">Performance Coach · Founder, Body Recode&trade;</p>
                </div>
              </div>
              <p>I have spent more than two decades in the health and performance industry, working inside high-intensity models, physique-driven environments, and traditional personal training. I competed nationally and internationally and held multiple titles in the sport. I saw dedication and discipline in abundance.</p>
              <Emphasis>What I saw far less often was stability.</Emphasis>
              <p>Clients would commit fully and achieve short-term change. Then fatigue accumulated, recovery declined, body composition fluctuated, motivation oscillated, and the cycle repeated. The issue was rarely commitment. It was volatility.</p>
              <p>My understanding deepened during a period of significant instability in my own life. Structure disappeared, stress increased, and effort alone did not correct it.</p>
              <Emphasis>It was not a discipline problem. It was biological instability.</Emphasis>
              <p>Body Recode&trade; emerged from those questions. It is an interpretive system designed to regulate exposure, protect recovery, and sequence progression intelligently. It is built to function under real-life conditions, where biological tolerance and lifestyle load fluctuate.</p>
              <p>If you have chosen to enter this process, I do not take that lightly. I am invested in your stability and your progress.</p>
              <Emphasis>Body Recode Performance Coaching is the application of that system in practice.</Emphasis>
            </GuideSection>

            <GuideSection id="welcome" title="Welcome to Active Coaching">
              <p>You have formally commenced Active Coaching. This is the execution phase, where structure becomes lived practice and your weekly rhythm takes shape.</p>
              <p>Active Coaching is not a schedule of training sessions. It is the structured application of the Body Recode&trade; system in real time:</p>
              <SimpleList items={[
                'Decisions are sequenced deliberately, not made impulsively',
                'Progress is evaluated across defined review windows',
                'Direction is governed by pattern interpretation, not momentary feedback',
                'Cadence protects stability so adaptation can accumulate',
              ]} />
              <Emphasis>This is where the work becomes consistent. This is where the system becomes visible.</Emphasis>
            </GuideSection>

            <GuideSection id="biology" title="Performance, Biology, and Body Composition">
              <p>Clients enter Body Recode Performance Coaching for different reasons. Some come for body composition. Others come for biological stability, recovery capacity, renewed training rhythm, or a stronger sense of identity around performance.</p>
              <Emphasis>Within Body Recode&trade;, these drivers are not separated. They are interconnected.</Emphasis>
              <p>Body composition, identity, performance, and biological regulation are expressions of the same underlying processes. When stress exceeds recovery tolerance, the body compensates. When intensity outpaces stability, volatility replaces progress.</p>
              <p>Rather than chasing change through extremes, the system stabilises inputs:</p>
              <SimpleList items={[
                'Training exposure is introduced deliberately',
                'Recovery is treated as performance infrastructure',
                'Nutrition is aligned with biological demand, not imposed as punishment',
              ]} />
              <Emphasis>As stability improves, capacity increases. As capacity increases, body composition shifts in a way that is more predictable and more durable.</Emphasis>
            </GuideSection>

            <GuideSection id="activation" title="Commitment and Activation">
              <p>Active Coaching is formally activated once your Commencement Fee has been processed and your Coaching Agreement becomes available in your portal. From that point, your onboarding sequence begins.</p>
              <Emphasis>The Commencement Fee does not begin training exposure. It activates configuration.</Emphasis>
              <p>Body Recode operates on governed sequencing. Load is not introduced until contractual alignment, health status, and readiness have been confirmed. Your coaching phase is now active. Structured exposure has not yet begun.</p>
              <Emphasis>Once foundational documentation is returned, the next stage opens.</Emphasis>
            </GuideSection>

            <GuideSection id="documentation" title="Initial Documentation and Readiness Confirmation">
              <p>Following activation, two documents must be completed before structured data collection can begin:</p>
              <BulletList items={[
                { label: 'Coaching Agreement', desc: 'Formalises expectations, responsibilities, and operational boundaries. Establishes clarity around communication, cadence, and professional conduct.' },
                { label: 'Health Declaration', desc: 'Confirms exposure can be introduced safely. Identifies medical considerations, current limitations, or recent health changes that may influence prescription.' },
              ]} />
              <p>If responses indicate that medical clearance is required, this will be communicated clearly. It is a safeguard, not a barrier.</p>
              <Emphasis>These documents are not administrative formalities. They are structural safeguards.</Emphasis>
              <p>No intake or baseline documentation is issued until this stage is complete.</p>
            </GuideSection>

            <GuideSection id="data" title="Structured Data Collection and Baseline Establishment">
              <p>Once foundational documentation is reviewed, the system advances to structured data collection. Two elements work together:</p>
              <BulletList items={[
                { label: 'Foundational Intake', desc: 'A multi-section interpretive form covering training history, injury and pain status, nutrition history, body pattern signals (fat distribution mapping), schedule and availability, sleep and recovery, stress load, supplements and stimulants, and present objectives.' },
                { label: 'Baseline Documentation', desc: 'Establishes objective reference anchors: morning bodyweight, defined circumference measurements, and standardised relaxed progress photos.' },
              ]} />
              <Emphasis>This stage is not about intensity. It is about accuracy.</Emphasis>
              <p>Honest reporting allows the system to function correctly. Overstating capacity or minimising stress does not accelerate progress. It increases volatility. The quality of this data directly influences the integrity of your first exposure phase.</p>
              <p>Once submitted and reviewed, interpretive synthesis begins. This is the final step before your Deliberate Start Window opens.</p>
            </GuideSection>

            <GuideSection id="start-window" title="The Deliberate Start Window">
              <p>Once your Foundational Intake and Baseline are submitted, the Deliberate Start Window begins. It typically spans three to seven days, though it may extend depending on coach load and scheduling. During this period:</p>
              <SimpleList items={[
                'Your data is synthesised into your Coach-Facing Foundational Synthesis (CFFS)',
                'Biological tolerance, lifestyle load, recovery bandwidth, and behavioural patterns are interpreted in context',
                'Your first exposure phase is constructed: volume, frequency, recovery positioning, and pacing sequenced to interpreted capacity',
              ]} />
              <Emphasis>This is not an automated configuration.</Emphasis>
              <p>Each new entry into Performance Coaching is treated with care. Where the window extends beyond seven days, it reflects prioritisation, not delay.</p>
              <Emphasis>Nothing is rushed. Exposure is introduced only after interpretation has occurred.</Emphasis>
            </GuideSection>

            <GuideSection id="cffs" title="Coach-Facing Foundational Synthesis (CFFS)">
              <p>Your submitted data is synthesised into the Coach-Facing Foundational Synthesis. This document is not client-facing. It exists as a coaching reference that governs the architecture of your entire program.</p>
              <Emphasis>The CFFS identifies your current Body State.</Emphasis>
              <p>Within Body Recode&trade;, Body State is classified across three structural stages:</p>
              <BulletList items={[
                { label: 'Remediation', desc: 'Stability must be restored or reinforced before progression can be sustained.' },
                { label: 'Optimisation', desc: 'A position of balanced capacity where adaptation can accumulate predictably.' },
                { label: 'Post-Optimisation', desc: 'A higher level of structural resilience where controlled progression can occur with greater tolerance.' },
              ]} />
              <p>Once state is clarified, the question shifts from <em>&ldquo;How hard can we push?&rdquo;</em> to <strong className="text-white">&ldquo;What does this body currently have the capacity to sustain and adapt to?&rdquo;</strong></p>
              <Emphasis>Interpretation precedes exposure. The CFFS is that interpretation.</Emphasis>
            </GuideSection>

            <GuideSection id="ieep" title="The Initial Exposure &amp; Entry Phase (IEEP)">
              <p>Following your Start Window and CFFS, coaching enters the Initial Exposure &amp; Entry Phase. The first weeks of training function as a calibration period rather than a testing block.</p>
              <Emphasis>The IEEP is the first governed exposure phase. It confirms that your classified Body State aligns with lived response under load.</Emphasis>
              <p>During this phase:</p>
              <SimpleList items={[
                'Training exposure is introduced according to your Body State',
                'Recovery response is observed carefully',
                'Regulation flags are monitored',
                'Lifestyle stability is assessed under structured load',
              ]} />
              <p>If exposure is tolerated as predicted, structural confidence increases. If instability emerges, adjustment occurs early and deliberately.</p>
              <Emphasis>Disciplined alignment in this phase protects months of sustainable adaptation.</Emphasis>
            </GuideSection>

            <GuideSection id="roles" title="Roles and Expectations">
              <p>Active Coaching operates within defined behavioural boundaries. Roles are not restrictive. They are stabilising.</p>
              <BulletList items={[
                { label: 'Your role', desc: 'Execute consistently. Show up as prescribed. Report honestly. Maintain communication rhythm. Do not override fatigue or escalate load to prove commitment.' },
                { label: 'My role', desc: 'Govern exposure. Sequence load and progression. Position recovery. Reduce or hold load when structural stability requires it.' },
              ]} />
              <p>Honest reporting is essential. If sleep declines, stress rises, or recovery shifts, that information informs exposure decisions. Withholding data disrupts the interpretive process.</p>
              <Emphasis>Coaching within Body Recode&trade; is not performative. It is interpretive.</Emphasis>
              <p>You bring execution and communication. I bring interpretation and governance. Structure protects both of us.</p>
            </GuideSection>

            <GuideSection id="how-it-works" title="How Coaching Actually Works">
              <p>Body Recode operates in structured phases. These are biological positioning periods, not aesthetic blocks. Progression is not linear. Expect three rhythms:</p>
              <SimpleList items={[
                'Periods of visible change',
                'Periods of consolidation',
                'Periods where progress appears quiet',
              ]} />
              <p>All three are functional. Load is applied. Adaptation accumulates. Consolidation is respected. Escalation is introduced only when capacity supports it.</p>
              <Emphasis>Regression within Body Recode&trade; is not failure. It is strategic.</Emphasis>
              <p>If fatigue accumulates beyond tolerance or biological markers indicate instability, exposure may be reduced intentionally. This protects long-term adaptation. Fatigue is information, not proof of effectiveness.</p>
              <Emphasis>Adaptation is measured across weeks and months, not sessions.</Emphasis>
            </GuideSection>

            <GuideSection id="cadence" title="Weekly Cadence and Check-In System">
              <p>Active Coaching operates on a fixed weekly rhythm. Each training week concludes with a formal Check-In Window:</p>
              <SimpleList items={[
                'Opens 6:00pm Friday',
                'Closes 6:30pm Sunday',
                'All structured weekly inputs must be submitted inside this window',
              ]} />
              <p>Within this cadence, check-ins alternate on an A/B rotation:</p>
              <BulletList items={[
                { label: 'Check-In A', desc: 'The deeper interpretive review. Captures biological response, recovery signals, stress markers, behavioural stability, and regulation patterns.' },
                { label: 'Check-In B', desc: 'The stabilisation review. Confirms rhythm adherence and identifies early instability signals. Its role is continuity and structural monitoring.' },
              ]} />
              <p>Both check-ins are required to maintain progression eligibility. A valid escalation requires the structural pairing of an A followed by a B. Without this pairing, exposure remains held. This is not punitive. It protects continuity.</p>
              <p>Once the window closes at 6:30pm Sunday, review and synthesis occur. Adjustments are applied within the structured decision window aligned to the upcoming training week.</p>
              <Emphasis>Change is governed. Stability is protected. Accumulation is deliberate.</Emphasis>
              <p>Missed submissions do not pause or reset the cadence. Exposure remains held and the system continues forward.</p>
            </GuideSection>

            <GuideSection id="cfws" title="Coach-Facing Weekly Synthesis (CFWS)">
              <p>At the close of each Check-In Window, your inputs are reviewed through the Coach-Facing Weekly Synthesis. It is a structured interpretive layer that evaluates pattern stability across a rolling window of weeks rather than reacting to isolated data points.</p>
              <p>Each week, the CFWS determines whether exposure should be:</p>
              <SimpleList items={[
                'Progressed',
                'Held',
                'Deloaded',
                'Rebuilt',
              ]} />
              <p>Progression is earned through pattern stability, never granted on enthusiasm or urgency.</p>
              <Emphasis>Protective adjustments can occur immediately if instability appears. Protection does not require permission. Progression does.</Emphasis>
              <p>The CFWS evaluates trend consistency, regulatory tolerance, load handling, and behavioural rhythm across multiple weeks. Most coaching models react to single data points. Body Recode evaluates pattern integrity.</p>
              <Emphasis>The result is progression that accumulates rather than oscillates.</Emphasis>
            </GuideSection>

            <GuideSection id="body-state" title="Body State Stability and Formal Re-evaluation">
              <p>Your Body State was identified at the start of Active Coaching through the CFFS. That classification governs how exposure is sequenced, how load is tolerated, and how progression is evaluated.</p>
              <p>Body State is structural, not motivational. It does not change because of:</p>
              <SimpleList items={[
                'One good week',
                'Rapid body composition shifts',
                'Training feeling easier',
                'High motivation',
              ]} />
              <Emphasis>Structural repositioning is rare and deliberate.</Emphasis>
              <p>Formal re-evaluation occurs only through a structured intake process, separate from weekly cadence, and only when broader biological capacity and regulatory stability appear meaningfully different over time.</p>
              <Emphasis>Remaining in a given Body State while building durability is not stagnation. It is consolidation. You are being sequenced correctly.</Emphasis>
            </GuideSection>

            <GuideSection id="holds" title="Holds, Deloads, and Rebuilds">
              <p>Active Coaching is built to function under real-life conditions. Illness, travel, work pressure, sleep fluctuation, and injury are realities, not failures.</p>
              <Emphasis>The system does not collapse when life becomes unstable. It adjusts deliberately.</Emphasis>
              <p>Each weekly review assigns one of four directions to your program. Three of them are protective:</p>
              <BulletList items={[
                { label: 'Hold', desc: 'Exposure remains unchanged when check-in pairing or biological signals do not support escalation. Not regression. Structural patience.' },
                { label: 'Deload', desc: 'A deliberate reduction in load when fatigue, stress, or recovery signals indicate the current exposure cannot be sustained. Protection takes priority over progression.' },
                { label: 'Rebuild', desc: 'A more substantial reset when significant instability, illness, injury, or major life disruption has compromised capacity. Training is recalibrated to a position the body can currently sustain. Foundational synthesis remains intact.' },
              ]} />
              <p>If disruption is severe enough that structured training is temporarily inappropriate, formal re-entry is coordinated directly with your coach. Training does not resume at arbitrary intensity.</p>
              <Emphasis>You are not expected to be perfect. You are expected to be consistent when stable and communicative when unstable. The system handles the rest.</Emphasis>
            </GuideSection>

            <GuideSection id="long-arc" title="The Long Arc of Performance and Body Composition">
              <p>The objective is durable change. Body composition pursued through stability rather than force becomes more predictable. Rapid changes in unstable systems are usually followed by regression or rebound.</p>
              <div className="space-y-2 my-4">
                <PhaseBlock week="Weeks 1-4" desc="Calibration and rhythm stabilisation. Exposure is controlled. Regulation is observed. Patterns begin forming." />
                <PhaseBlock week="Weeks 4-8" desc="Structural consistency becomes visible. Recovery improves. Load tolerance increases. Early body composition shifts may begin to appear." />
                <PhaseBlock week="Weeks 8-12" desc="Pattern accumulation becomes measurable. Capacity stabilises further. Body composition change becomes more reliable because it is supported by stability rather than force." />
                <PhaseBlock week="Beyond 12 Weeks" desc="Change compounds. Six months is where deeper pattern shifts become obvious. Volatility reduces. Capacity feels normal rather than effortful. Composition changes hold because they are built on regulation, not restriction." />
              </div>
              <p>This timeline reflects structural sequencing, not aesthetic expectation. There will be weeks that feel unchanged. That is not failure. It is accumulation.</p>
              <Emphasis>Quiet progression. Stable regulation. Durable composition change. Integrated performance.</Emphasis>
            </GuideSection>

            <GuideSection id="communication" title="Communication Standards and WhatsApp Protocol">
              <p><strong className="text-white">WhatsApp is the required communication platform for all clients.</strong> Every client must download and maintain active access for the duration of coaching.</p>
              <Emphasis>Communication inside this system is structured. It is not open-ended or reactive.</Emphasis>
              <p>The primary formal communication window each week is the Check-In Window (6:00pm Friday to 6:30pm Sunday). All weekly analysis, CFWS generation, and adjustments occur after this window closes.</p>
              <p>Standard weekday response time is within 24 hours. Weekend responses outside the Check-In Window may extend beyond this.</p>
              <p>WhatsApp is designed for:</p>
              <SimpleList items={[
                'Clarification of program instructions',
                'Logistical coordination and scheduling',
                'Minor training questions',
                'Non-urgent guidance',
              ]} />
              <p>WhatsApp is <strong className="text-white">not</strong> designed for real-time emotional processing, immediate program overhauls, crisis intervention, medical advice, or rapid reaction to temporary fluctuations.</p>
              <p>When a concern arises, it is noted. When the Check-In Window opens, it is assessed properly within the CFWS process.</p>
              <Emphasis>Boundaries do not reduce support. They protect the quality of it. This is a high-integrity coaching model, not a high-frequency messaging one.</Emphasis>
            </GuideSection>

            <GuideSection id="closing" title="Closing Confirmation">
              <p>You are now entering the structured phase of Body Recode Performance Coaching. Everything in this guide exists to protect progression, regulate exposure, and ensure that performance and body composition are built on biological stability rather than force.</p>
              <Emphasis>You are not entering a program. You are entering a system.</Emphasis>
              <p>As your coach, I am invested in this process. Your foundational synthesis, your exposure sequencing, and your weekly interpretation are not automated decisions. They are deliberate.</p>
              <Emphasis>This is my craft. This is my discipline. This is my passion.</Emphasis>
              <div className="pt-4">
                <div className="w-8 h-px bg-teal-400/30 mb-8" />
                <div className="space-y-2 text-stone-400 text-sm leading-relaxed">
                  <p>From this point forward, your role is simple.</p>
                  <p className="text-white font-medium">Execute consistently.</p>
                  <p className="text-white font-medium">Communicate honestly.</p>
                  <p className="text-white font-medium">Respect the cadence.</p>
                  <p className="text-stone-400 mt-4 italic">The system will handle the rest.</p>
                  <p className="text-teal-400/70 font-semibold mt-2">Welcome to Active Coaching.</p>
                </div>
              </div>
            </GuideSection>

          </div>

          <p className="text-[10px] text-stone-700 uppercase tracking-[0.25em] mt-24">Body Recode&trade;</p>
        </main>
      </div>
    </div>
  )
}

function GuideSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-1 h-4 bg-teal-400/50 rounded-full shrink-0" />
        <h2
          className="text-xs font-semibold text-teal-400/70 uppercase tracking-[0.15em]"
          dangerouslySetInnerHTML={{ __html: title }}
        />
      </div>
      <div className="space-y-4 pl-5">
        {children}
      </div>
    </section>
  )
}

function Emphasis({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-white font-medium leading-relaxed">{children}</p>
  )
}

function BulletList({ items }: { items: { label: string; desc: string }[] }) {
  return (
    <div className="space-y-2 my-2">
      {items.map(item => (
        <div key={item.label} className="flex items-start gap-3 bg-stone-900/80 border border-stone-800 rounded-lg px-4 py-3">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-400/60 mt-1.5 shrink-0" />
          <div>
            <span className="text-white font-medium text-sm">{item.label}</span>
            <span className="text-stone-400 text-sm">: {item.desc}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function SimpleList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1 my-2 pl-1">
      {items.map(item => (
        <li key={item} className="flex items-start gap-2 text-stone-300 text-sm">
          <div className="w-1 h-1 rounded-full bg-teal-400/50 mt-2 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  )
}

function PhaseBlock({ week, desc }: { week: string; desc: string }) {
  return (
    <div className="bg-stone-900/80 border border-stone-800 rounded-lg px-4 py-3">
      <p className="text-teal-400/80 text-xs font-semibold uppercase tracking-wider mb-1">{week}</p>
      <p className="text-stone-300 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}
