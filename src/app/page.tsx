import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingNav from '@/components/marketing/nav'
import MarketingFooter from '@/components/marketing/footer'
import DnaHelix from '@/components/dna-helix'

export const metadata: Metadata = {
  title: 'Body Recode™ | Biological Interpretation System',
  description: 'Body Recode™ is a biological interpretation system. One interpretive engine. Five environments. The IP sits above all of it.',
}

export default function HomePage() {
  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="bg-black min-h-screen flex items-center pt-20 overflow-hidden relative">
        <DnaHelix className="absolute right-0 top-0 h-full w-auto max-w-xs md:max-w-sm pointer-events-none select-none" opacity={0.06} bgColor="#000000" />
        <DnaHelix className="absolute left-0 bottom-0 h-3/4 w-auto max-w-[160px] pointer-events-none select-none" opacity={0.04} bgColor="#000000" />
        <div className="max-w-4xl mx-auto px-5 py-32 text-center relative z-10">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-8">
            Body Recode™, Biological Interpretation System
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-8">
            Interpretation before prescription.
          </h1>
          <p className="text-lg md:text-xl text-white/50 leading-relaxed max-w-2xl mx-auto mb-12">
            The body communicates its state through observable patterns. Body Recode™ reads those patterns before anything is prescribed. One interpretive system. Five environments. The IP sits above all of it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/performance-coaching"
              className="bg-[#10E1C2] text-black font-bold px-8 py-4 rounded-full text-base hover:bg-[#0ecfb2] transition-colors"
            >
              Performance Coaching
            </Link>
            <Link
              href="#system"
              className="border border-white/20 text-white font-semibold px-8 py-4 rounded-full text-base hover:border-white/40 transition-colors"
            >
              Read the system
            </Link>
          </div>
        </div>
      </section>

      {/* The Premise */}
      <section id="system" className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">The Problem</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-12">
            Every intervention fails at the same point.
          </h2>
          <div className="max-w-2xl mx-auto space-y-6 text-white/60 text-lg leading-relaxed">
            <p>
              The conventional model goes, assess goals, prescribe approach, measure output, adjust. This works when the body is in a state to respond. Most of the time, it is not. The model assumes the body is ready. It rarely asks whether it is.
            </p>
            <p>
              Body Recode™ sits one layer upstream of that. Before any prescription is made, the system asks a different question: what state is this body actually operating in right now, and why is it organised the way it is?
            </p>
            <p>
              The answer to that question changes everything downstream.
            </p>
          </div>
        </div>
      </section>

      {/* Two-Layer Structure */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">Architecture</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-16">
            Two layers. Neither collapses into the other.
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div className="border border-[#10E1C2]/30 rounded-2xl p-8 bg-[#10E1C2]/5">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-4">Layer 1, Interpretation</p>
              <p className="text-white/60 text-base leading-relaxed">
                Takes structured input data across eight signal domains, training load, recovery capacity, stress architecture, hormonal signals, fat distribution patterns, sleep quality, behavioural patterns, and emotional load, and produces the CFFS: the Coach-Facing Foundational Synthesis. It does not prescribe. It does not design programs. Interpretation terminates at interpretation.
              </p>
            </div>
            <div className="border border-white/10 rounded-2xl p-8">
              <p className="text-[11px] font-bold tracking-[0.2em] text-white/40 uppercase mb-4">Layer 2, Execution</p>
              <p className="text-white/60 text-base leading-relaxed">
                Downstream of the CFFS, the practitioner designs the actual intervention, training, nutrition, load management, clinical protocol, performance strategy. Everything in the execution layer is derived from the interpretation. The interpretation never changes to accommodate the execution.
              </p>
            </div>
          </div>
          <p className="text-white/30 text-base text-center leading-relaxed max-w-xl mx-auto">
            This separation is non-negotiable. It is central to the system&apos;s integrity.
          </p>
        </div>
      </section>

      {/* The Five Environments */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5 overflow-hidden relative">
        <DnaHelix className="absolute -right-8 top-1/2 -translate-y-1/2 h-[120%] w-auto max-w-[180px] pointer-events-none select-none" opacity={0.05} bgColor="#0a0a0a" />
        <div className="max-w-4xl mx-auto relative z-10">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">Environments</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-6">
            One interpretive engine. Five environments.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            The interpretive layer does not care what environment the body is operating in. The body responds to load through the same biological mechanisms regardless of context. What changes between environments is not the interpretation, it is what the practitioner does with it.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Environment 1, Live */}
            <div className="border border-[#10E1C2]/30 rounded-2xl p-8 bg-[#10E1C2]/5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase">Health &amp; Fitness</p>
                <span className="text-[10px] font-bold text-black bg-[#10E1C2] px-2.5 py-1 rounded-full uppercase tracking-wider">Live</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Performance Coaching</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                The origin environment and first proof of concept. Clients are general population, people whose bodies have stopped responding to effort. The execution layer is structured training and nutrition design derived entirely from the CFFS.
              </p>
              <Link
                href="/performance-coaching"
                className="inline-block text-[#10E1C2] text-sm font-semibold hover:underline"
              >
                Performance Coaching →
              </Link>
            </div>

            {/* Environment 2 */}
            <div className="border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold tracking-[0.2em] text-white/40 uppercase">Corporate &amp; Executive</p>
                <span className="text-[10px] font-bold text-white/30 border border-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider">In Development</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Executive Performance</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                High-performing professionals under chronic cognitive and organisational load. The body under sustained mental stress responds identically to physical stress, cortisol elevation, recovery suppression, regulatory disruption.
              </p>
            </div>

            {/* Environment 3 */}
            <div className="border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold tracking-[0.2em] text-white/40 uppercase">Military &amp; Tactical</p>
                <span className="text-[10px] font-bold text-white/30 border border-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider">In Development</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Operational Performance</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Defence personnel, law enforcement, and tactical operators. The stakes of misread body state in this environment are operational. An operator in Remediation being pushed through performance-level training is a liability.
              </p>
            </div>

            {/* Environment 4 */}
            <div className="border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold tracking-[0.2em] text-white/40 uppercase">Medical &amp; Allied Health</p>
                <span className="text-[10px] font-bold text-white/30 border border-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider">In Development</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Clinical Integration</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                GPs, physiotherapists, sports medicine practitioners, and allied health professionals. Body Recode™ sits upstream of clinical assessment, providing a structured biological read that informs the clinical picture before the appointment.
              </p>
            </div>

            {/* Environment 5, centred on last row */}
            <div className="border border-white/10 rounded-2xl p-8 md:col-span-2 md:max-w-lg md:mx-auto md:w-full">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold tracking-[0.2em] text-white/40 uppercase">Education &amp; Youth</p>
                <span className="text-[10px] font-bold text-white/30 border border-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider">In Development</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Developmental Performance</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Young athletes, student populations, and development-stage bodies. The earlier a body is read correctly, the less dysfunction accumulates over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fat Map Method™ */}
      <section className="bg-black py-32 px-5 border-t border-white/5 overflow-hidden relative">
        <DnaHelix className="absolute -left-6 top-1/2 -translate-y-1/2 h-[110%] w-auto max-w-[160px] pointer-events-none select-none" opacity={0.05} bgColor="#000000" />
        <div className="max-w-4xl mx-auto relative z-10">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">Core Methodology</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-6">
            Fat Map Method™
          </h2>
          <p className="text-white/50 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            One of the core interpretive tools within Body Recode™. Fat accumulation patterns are read as hormonal and metabolic signalling, not simple energy surplus. Where fat accumulates on the body reflects the body&apos;s adaptive response to its current hormonal and regulatory environment.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {[
              {
                zone: 'MZ1',
                name: 'Stress Belt',
                location: 'Stomach / Waist',
                signal: 'Cortisol and adrenaline dominance',
              },
              {
                zone: 'MZ2',
                name: 'Gut and Bloat',
                location: 'Digestive region',
                signal: 'Insulin timing disruption',
              },
              {
                zone: 'MZ3',
                name: 'Hip and Thigh Conservation',
                location: 'Hips / Thighs',
                signal: 'Reproductive hormone and metabolic conservation patterns',
              },
              {
                zone: 'MZ4',
                name: 'Upper Body Stress Response',
                location: 'Upper body',
                signal: 'Nervous system load, adrenaline, sleep retention',
              },
            ].map((item) => (
              <div key={item.zone} className="border border-white/10 rounded-2xl p-7">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase">{item.zone}</p>
                  <span className="text-xs text-white/30 font-medium">{item.location}</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{item.name}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.signal}</p>
              </div>
            ))}
          </div>
          <p className="text-white/30 text-base text-center leading-relaxed max-w-2xl mx-auto">
            These macro zones contain eight extended sub-zones that further refine the read. The Fat Map feeds into broader interpretation and is one of the primary signal sources for body state classification.
          </p>
        </div>
      </section>

      {/* Body State Classification */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">Classification Output</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-6">
            Three body states. Every client, every environment.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            The interpretation produces one of three body state classifications. The classification drives the entire downstream approach.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-red-800/40 rounded-2xl p-7">
              <p className="text-sm font-bold uppercase tracking-wider text-red-400 mb-4">Remediation</p>
              <p className="text-white/50 text-base leading-relaxed">
                The body is under load it cannot resolve. Stress architecture is dominant. Recovery is compromised. Pushing performance-level intervention in this state is counterproductive and often harmful. Most people who present believing they are in Optimisation are actually here.
              </p>
            </div>
            <div className="border border-amber-300/40 rounded-2xl p-7">
              <p className="text-sm font-bold uppercase tracking-wider text-amber-300 mb-4">Optimisation</p>
              <p className="text-white/50 text-base leading-relaxed">
                The body has stabilised. Capacity exists to pursue body composition and performance goals. This is where most coaching begins, but very few clients are actually here when they arrive.
              </p>
            </div>
            <div className="border border-[#10E1C2]/30 rounded-2xl p-7">
              <p className="text-sm font-bold uppercase tracking-wider text-[#10E1C2] mb-4">Post-Optimisation</p>
              <p className="text-white/50 text-base leading-relaxed">
                The body is performing. The goal shifts to identity-level performance and long-term maintenance of the system. Built over time. Cannot be forced.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Architecture */}
      <section className="bg-black py-32 px-5 border-t border-white/5 overflow-hidden relative">
        <DnaHelix className="absolute -right-6 top-1/2 -translate-y-1/2 h-[110%] w-auto max-w-[160px] pointer-events-none select-none" opacity={0.05} bgColor="#000000" />
        <div className="max-w-4xl mx-auto relative z-10">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">Platform</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-8">
            One engine. Built to scale across industries.
          </h2>
          <p className="text-white/60 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            Body Recode™ is built as one interpretive core with multiple execution layers on top of it. The interpretation engine ingests structured client data, classifies body state, and produces the CFFS. This engine is environment-agnostic. It can be licensed, white-labelled, or integrated into existing practitioner workflows. Each execution layer is a downstream application, its own product, its own interface, its own practitioner tools, calibrated to the demands and language of its environment.
          </p>

          {/* Architecture Diagram */}
          <div className="border border-white/10 rounded-2xl overflow-hidden">
            {/* Engine block */}
            <div className="bg-[#10E1C2]/10 border-b border-[#10E1C2]/20 p-6 text-center">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase">Body Recode™ Interpretation Engine</p>
              <p className="text-white/40 text-xs mt-1">Intake → Classification → CFFS</p>
            </div>
            {/* Connector line */}
            <div className="flex justify-center py-4 bg-black/40">
              <div className="w-px h-6 bg-white/10" />
            </div>
            {/* Five execution layers */}
            <div className="grid grid-cols-5 divide-x divide-white/5">
              <div className="p-4 text-center bg-[#10E1C2]/5 border-t border-[#10E1C2]/20">
                <p className="text-[#10E1C2] text-[10px] font-bold uppercase tracking-wider leading-snug">Performance Coaching</p>
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#10E1C2] mx-auto" />
              </div>
              <div className="p-4 text-center border-t border-white/5">
                <p className="text-white/25 text-[10px] font-bold uppercase tracking-wider leading-snug">Executive Performance</p>
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white/10 mx-auto" />
              </div>
              <div className="p-4 text-center border-t border-white/5">
                <p className="text-white/25 text-[10px] font-bold uppercase tracking-wider leading-snug">Operational Readiness</p>
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white/10 mx-auto" />
              </div>
              <div className="p-4 text-center border-t border-white/5">
                <p className="text-white/25 text-[10px] font-bold uppercase tracking-wider leading-snug">Clinical Integration</p>
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white/10 mx-auto" />
              </div>
              <div className="p-4 text-center border-t border-white/5">
                <p className="text-white/25 text-[10px] font-bold uppercase tracking-wider leading-snug">Developmental Performance</p>
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white/10 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
            Performance Coaching is live.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed mb-12 max-w-xl mx-auto">
            Environment 1 of the Body Recode™ system is built, validated, and accepting clients. Online 1:1 worldwide and face-to-face in Brisbane.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/performance-coaching"
              className="inline-block bg-[#10E1C2] text-black font-bold px-10 py-5 rounded-full text-lg hover:bg-[#0ecfb2] transition-colors"
            >
              Performance Coaching
            </Link>
            <Link
              href="/performance-check-in"
              className="text-white/50 text-base font-semibold hover:text-white transition-colors"
            >
              Start with a free check-in →
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  )
}
