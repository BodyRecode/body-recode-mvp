import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingNav from '@/components/marketing/nav'
import MarketingFooter from '@/components/marketing/footer'
import DnaHelix from '@/components/dna-helix'

export const metadata: Metadata = {
  title: 'Body Recode™ | Biological Interpretation System',
  description: 'Body Recode™ is a biological interpretation system built as a platform. One interpretive engine. Five environments. Licensable across industries.',
}

export default function HomePage() {
  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="bg-black min-h-screen flex items-center pt-20 overflow-hidden relative">
        <DnaHelix className="absolute right-0 top-0 h-full w-auto max-w-xs md:max-w-sm pointer-events-none select-none" opacity={0.10} />
        <DnaHelix className="absolute left-0 bottom-0 h-3/4 w-auto max-w-[160px] pointer-events-none select-none" opacity={0.04} />
        <div className="max-w-4xl mx-auto px-5 py-32 text-center relative z-10">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-8">
            Body Recode™: Biological Interpretation Platform
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-8">
            Interpretation before prescription.
          </h1>
          <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto mb-12">
            Body Recode™ is a biological interpretation system built as a licensable platform. One engine reads body state before any intervention is designed. The IP sits above all environments it operates in.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="#system"
              className="border border-white/20 text-white font-semibold px-8 py-4 rounded-full text-base hover:border-white/40 transition-colors"
            >
              Read the system
            </Link>
            <a
              href="#platform"
              className="border border-[#10E1C2]/40 text-[#10E1C2] font-semibold px-8 py-4 rounded-full text-base hover:border-[#10E1C2] transition-colors"
            >
              Licensing enquiries
            </a>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section id="system" className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">The Problem</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-12">
            Every intervention fails at the same point.
          </h2>
          <div className="max-w-2xl mx-auto space-y-6 text-white/60 text-lg leading-relaxed">
            <p>
              The conventional model goes: assess goals, prescribe approach, measure output, adjust. This works when the body is in a state to respond. Most of the time, it is not. The model assumes the body is ready. It rarely asks whether it is.
            </p>
            <p>
              The result is effort without response. Training that doesn&apos;t build. Nutrition that doesn&apos;t shift body composition. Recovery that never fully lands. The intervention is not wrong. The sequencing is.
            </p>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-6">The Solution</p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-8 leading-tight">
            Read the body first.<br />Then prescribe.
          </h2>
          <p className="text-white/60 text-xl leading-relaxed max-w-2xl mx-auto mb-12">
            Body Recode™ sits one layer upstream of every intervention. Before anything is prescribed, the system asks one question: what state is this body actually in right now, and why is it organised that way?
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="border border-white/10 rounded-2xl p-6">
              <p className="text-[#10E1C2] text-2xl font-extrabold mb-2">208</p>
              <p className="text-white font-semibold mb-1">Intake data points</p>
              <p className="text-white/50 text-sm leading-relaxed">Structured across eight signal domains. Not a questionnaire. A biological read.</p>
            </div>
            <div className="border border-white/10 rounded-2xl p-6">
              <p className="text-[#10E1C2] text-2xl font-extrabold mb-2">5</p>
              <p className="text-white font-semibold mb-1">Interpretive pillars</p>
              <p className="text-white/50 text-sm leading-relaxed">Each reads a different domain of the body&apos;s state. The output is always a synthesis.</p>
            </div>
            <div className="border border-white/10 rounded-2xl p-6">
              <p className="text-[#10E1C2] text-2xl font-extrabold mb-2">3</p>
              <p className="text-white font-semibold mb-1">Body state classifications</p>
              <p className="text-white/50 text-sm leading-relaxed">Every body, every environment. The classification determines everything downstream.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Layer Structure */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">Architecture</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-16">
            Two layers. Neither collapses into the other.
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div className="border border-[#10E1C2]/30 rounded-2xl p-8 bg-[#10E1C2]/5">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-4">Layer 1: Interpretation</p>
              <p className="text-white/60 text-base leading-relaxed">
                Takes structured input data across eight signal domains and produces the CFFS: the Coach-Facing Foundational Synthesis. It does not prescribe. It does not design programs. Interpretation terminates at interpretation.
              </p>
            </div>
            <div className="border border-white/10 rounded-2xl p-8">
              <p className="text-[11px] font-bold tracking-[0.2em] text-white/50 uppercase mb-4">Layer 2: Execution</p>
              <p className="text-white/60 text-base leading-relaxed">
                Downstream of the CFFS, the practitioner designs the actual intervention: training, nutrition, load management, clinical protocol, performance strategy. Everything in the execution layer is derived from the interpretation. The interpretation never changes to accommodate the execution.
              </p>
            </div>
          </div>
          <p className="text-white/40 text-base text-center leading-relaxed max-w-xl mx-auto">
            This separation is non-negotiable. It is central to the system&apos;s integrity.
          </p>
        </div>
      </section>

      {/* For Practitioners */}
      <section id="platform" className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">For Practitioners</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-6">
            The interpretation engine is licensable.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            Body Recode™ is built as one interpretive core with multiple execution layers on top. The interpretation engine, the intake architecture, and the CFFS methodology are available for licensing, white-labelling, or integration into existing practitioner workflows.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="border border-white/20 rounded-2xl p-7">
              <p className="text-[#10E1C2] font-bold text-sm uppercase tracking-wider mb-3">Licensing</p>
              <p className="text-white/60 text-sm leading-relaxed">
                Use the Body Recode™ interpretation system within your practice or organisation. Full access to the intake architecture, the five interpretive pillars, and the CFFS output framework.
              </p>
            </div>
            <div className="border border-white/20 rounded-2xl p-7">
              <p className="text-[#10E1C2] font-bold text-sm uppercase tracking-wider mb-3">White-Labelling</p>
              <p className="text-white/60 text-sm leading-relaxed">
                Deploy the system under your brand. The interpretation engine, intake process, and output documents are built to operate independently of the Body Recode™ identity where required.
              </p>
            </div>
            <div className="border border-white/20 rounded-2xl p-7">
              <p className="text-[#10E1C2] font-bold text-sm uppercase tracking-wider mb-3">Integration</p>
              <p className="text-white/60 text-sm leading-relaxed">
                Embed the interpretation layer into existing clinical, coaching, or organisational workflows. The system sits upstream of whatever the practitioner does with the output.
              </p>
            </div>
          </div>
          <div className="border border-[#10E1C2]/20 rounded-2xl p-10 bg-[#10E1C2]/5 text-center">
            <p className="text-white font-bold text-xl mb-3">Enquire about the platform</p>
            <p className="text-white/50 text-base leading-relaxed max-w-xl mx-auto mb-8">
              Licensing and integration enquiries are handled directly. If you are a practitioner, clinic, sports organisation, or business interested in deploying the Body Recode™ interpretation system, reach out.
            </p>
            <a
              href="mailto:info@bodyrecode.au"
              className="inline-block bg-[#10E1C2] text-black font-bold px-8 py-4 rounded-full text-base hover:bg-[#0ecfb3] transition-colors"
            >
              Contact: info@bodyrecode.au
            </a>
          </div>
        </div>
      </section>

      {/* The Five Environments */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">Environments</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-6">
            One interpretive engine. Five environments.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            The interpretive layer does not care what environment the body is operating in. The body responds to load through the same biological mechanisms regardless of context. What changes between environments is not the interpretation. It is what the practitioner does with it.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Environment 1 - Live */}
            <div className="border border-[#10E1C2]/30 rounded-2xl p-8 bg-[#10E1C2]/5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase">Health &amp; Fitness</p>
                <span className="text-[10px] font-bold text-black bg-[#10E1C2] px-2.5 py-1 rounded-full uppercase tracking-wider">Live</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Performance Coaching</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                The origin environment and first proof of concept. Clients are general population: people whose bodies have stopped responding to effort. The execution layer is structured training and nutrition design derived entirely from the CFFS.
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
                High-performing professionals under chronic cognitive and organisational load. The body under sustained mental stress responds identically to physical stress: cortisol elevation, recovery suppression, regulatory disruption.
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

            {/* Environment 5 */}
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

      {/* Platform Architecture */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">Platform</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-8">
            One engine. Built to scale across industries.
          </h2>
          <p className="text-white/60 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            The interpretation engine ingests structured client data, classifies body state, and produces the CFFS. This engine is environment-agnostic. Each execution layer is a downstream application: its own product, its own interface, its own practitioner tools, calibrated to the demands and language of its environment.
          </p>

          <div className="border border-white/10 rounded-2xl overflow-hidden">
            <div className="bg-[#10E1C2]/10 border-b border-[#10E1C2]/20 p-6 text-center">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase">Body Recode™ Interpretation Engine</p>
              <p className="text-white/40 text-xs mt-1">Intake → Classification → CFFS</p>
            </div>
            <div className="flex justify-center py-4 bg-black/40">
              <div className="w-px h-6 bg-white/10" />
            </div>
            <div className="grid grid-cols-5 divide-x divide-white/5">
              <div className="p-4 text-center bg-[#10E1C2]/5 border-t border-[#10E1C2]/20">
                <p className="text-[#10E1C2] text-[10px] font-bold uppercase tracking-wider leading-snug">Performance Coaching</p>
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-[#10E1C2] mx-auto" />
              </div>
              <div className="p-4 text-center border-t border-white/5">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider leading-snug">Executive Performance</p>
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white/10 mx-auto" />
              </div>
              <div className="p-4 text-center border-t border-white/5">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider leading-snug">Operational Readiness</p>
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white/10 mx-auto" />
              </div>
              <div className="p-4 text-center border-t border-white/5">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider leading-snug">Clinical Integration</p>
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white/10 mx-auto" />
              </div>
              <div className="p-4 text-center border-t border-white/5">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider leading-snug">Developmental Performance</p>
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-white/10 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Eight Signal Domains */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">Foundational Intake</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-6">
            208 questions. Eight signal domains.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            Before any interpretation begins, the system collects structured data across eight distinct signal domains. This is the raw material the interpretation engine operates on. The depth and specificity of the intake is what makes the output defensible.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { num: '01', name: 'Training Load', desc: 'Physical stress exposure, training history, volume, and fatigue patterns.' },
              { num: '02', name: 'Recovery Capacity', desc: 'The system\'s ability to restore and return to baseline between stress exposures.' },
              { num: '03', name: 'Stress Architecture', desc: 'How the body\'s stress response is organised and its capacity to resolve accumulated load.' },
              { num: '04', name: 'Hormonal Signals', desc: 'Endocrine markers and hormonal regulation patterns affecting body state and adaptation.' },
              { num: '05', name: 'Fat Distribution Patterns', desc: 'Adaptive fat accumulation read as hormonal and metabolic signalling via the Fat Map Method™.' },
              { num: '06', name: 'Sleep Quality', desc: 'Sleep depth, recovery patterns, and nervous system restoration during rest.' },
              { num: '07', name: 'Behavioural Patterns', desc: 'Observable behaviours reflecting underlying biological state, rhythm, and adaptation capacity.' },
              { num: '08', name: 'Emotional Load', desc: 'Emotional threat, identity load, and over-compliance read as structural stressors affecting regulation.' },
            ].map((domain) => (
              <div key={domain.num} className="border border-white/10 rounded-2xl p-6">
                <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-3">{domain.num}</p>
                <h3 className="text-sm font-bold text-white mb-2">{domain.name}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{domain.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-sm text-center mt-10 max-w-xl mx-auto">
            The 208-question intake is structured, not conversational. Every question maps to a signal domain. The data set is what separates interpretation from assumption.
          </p>
        </div>
      </section>

      {/* Interpretive Pillars */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">Interpretive Pillars</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-6">
            Five pillars. One read.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            The Body Recode™ interpretation engine reads the body across five distinct pillars simultaneously. Each pillar contributes signal data. No single pillar drives the output in isolation. The interpretation is always a synthesis of the full picture.
          </p>

          {/* Pillar 1 - Fat Map Method (featured) */}
          <div className="border border-[#10E1C2]/30 rounded-2xl p-8 bg-[#10E1C2]/5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase">Pillar 01</p>
              <span className="text-[10px] font-bold text-black bg-[#10E1C2] px-2.5 py-1 rounded-full uppercase tracking-wider">Primary</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Fat Map Method™</h3>
            <p className="text-white/60 text-base leading-relaxed mb-8">
              Fat accumulation patterns are read as hormonal and metabolic signalling, not simple energy surplus. Where the body stores fat reflects its adaptive response to the current hormonal and regulatory environment. The Fat Map is the most visually observable signal domain and one of the primary inputs to body state classification.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { zone: 'MZ1', name: 'Stress Belt', location: 'Stomach / Waist', signal: 'Cortisol and adrenaline dominance' },
                { zone: 'MZ2', name: 'Gut and Bloat', location: 'Digestive region', signal: 'Insulin timing disruption' },
                { zone: 'MZ3', name: 'Hip and Thigh Conservation', location: 'Hips / Thighs', signal: 'Reproductive hormone and metabolic conservation patterns' },
                { zone: 'MZ4', name: 'Upper Body Stress Response', location: 'Upper body', signal: 'Nervous system load, adrenaline, sleep retention' },
              ].map((item) => (
                <div key={item.zone} className="border border-[#10E1C2]/15 rounded-xl p-5 bg-black/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase">{item.zone}</p>
                    <span className="text-xs text-white/40 font-medium">{item.location}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{item.name}</h4>
                  <p className="text-white/50 text-xs leading-relaxed">{item.signal}</p>
                </div>
              ))}
            </div>
            <p className="text-white/40 text-sm mt-6">
              Four macro zones containing eight extended sub-zones. The Fat Map feeds into broader interpretation and never drives outcome independently.
            </p>
          </div>

          {/* Pillars 2–5 */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                num: '02',
                name: 'Performance Training System',
                abbr: 'PTS',
                desc: 'Reads physical stress exposure, training load, fatigue patterns, and adaptation signals. The PTS does not prescribe training. It interprets the risk and capacity picture that defines what training the body can tolerate right now.',
              },
              {
                num: '03',
                name: 'Hybrid Animal-Based Nutrition System',
                abbr: 'HABNS',
                desc: 'Interprets nutritional sufficiency and biological threat signalling. Assesses whether current intake is supporting regulation and adaptation, or reinforcing scarcity and hormonal disruption.',
              },
              {
                num: '04',
                name: 'Recovery and Regulation System',
                abbr: 'RRS',
                desc: 'Reads the system\'s capacity to restore, downregulate, and return to baseline between stress exposures. Distinguishes genuine recovery from suppression: the body that appears stable but is not regenerating.',
              },
              {
                num: '05',
                name: 'Behaviour, Identity and Rhythm System',
                abbr: 'BIRS',
                desc: 'Interprets emotional load, identity constraints, and behavioural patterns as structural biological stressors. Compliance, identity threat, and rhythm disruption are not psychological observations. They are inputs that affect adaptation and regulation.',
              },
            ].map((pillar) => (
              <div key={pillar.num} className="border border-white/20 rounded-2xl p-7">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold tracking-[0.2em] text-white/50 uppercase">Pillar {pillar.num}</p>
                  <span className="text-[10px] font-bold text-white/40 border border-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">{pillar.abbr}</span>
                </div>
                <h3 className="text-base font-bold text-white mb-3">{pillar.name}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
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
              <p className="text-white/60 text-base leading-relaxed">
                The body is under load it cannot resolve. Stress architecture is dominant. Recovery is compromised. Pushing performance-level intervention in this state is counterproductive and often harmful. Most people who present believing they are in Optimisation are actually here.
              </p>
            </div>
            <div className="border border-amber-300/40 rounded-2xl p-7">
              <p className="text-sm font-bold uppercase tracking-wider text-amber-300 mb-4">Optimisation</p>
              <p className="text-white/60 text-base leading-relaxed">
                The body has stabilised. Capacity exists to pursue body composition and performance goals. This is where most coaching begins, but very few clients are actually here when they arrive.
              </p>
            </div>
            <div className="border border-[#10E1C2]/30 rounded-2xl p-7">
              <p className="text-sm font-bold uppercase tracking-wider text-[#10E1C2] mb-4">Post-Optimisation</p>
              <p className="text-white/60 text-base leading-relaxed">
                The body is performing. The goal shifts to identity-level performance and long-term maintenance of the system. Built over time. Cannot be forced.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-6">Environment 01: Live</p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
            Performance Coaching is live.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Environment 1 of the Body Recode™ system is built, validated, and accepting clients. Online 1:1 worldwide and face-to-face in Brisbane.
          </p>
          <Link
            href="/performance-coaching"
            className="inline-block border border-[#10E1C2]/40 text-[#10E1C2] font-semibold px-8 py-4 rounded-full text-base hover:border-[#10E1C2] transition-colors"
          >
            Performance Coaching →
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </>
  )
}
