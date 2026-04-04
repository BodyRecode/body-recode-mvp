import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingNav from '@/components/marketing/nav'
import MarketingFooter from '@/components/marketing/footer'
import DnaHelix from '@/components/dna-helix'

export const metadata: Metadata = {
  title: 'Performance Coaching | Body Recode™',
  description: 'Body Recode™ Performance Coaching — Environment 1 of the Body Recode™ biological interpretation system. Available online worldwide and face-to-face in Brisbane.',
}

export default function PerformanceCoachingPage() {
  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="bg-black pt-44 pb-32 px-5 overflow-hidden relative">
        <DnaHelix className="absolute right-0 top-0 h-full w-auto max-w-xs pointer-events-none select-none" opacity={0.06} />
        <div className="max-w-4xl mx-auto relative z-10">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-6">
            Environment 01 — Health &amp; Fitness
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-8">
            Performance Coaching
          </h1>
          <p className="text-xl text-white/60 leading-relaxed max-w-2xl mb-8">
            The first execution layer of the Body Recode™ system. 1:1 coaching for high-functioning adults whose bodies have stopped responding to effort. Every training decision, every nutrition structure, every recovery adjustment is derived from the biological interpretation — not from goals, not from preference, not from a template.
          </p>
          <p className="text-white/40 text-base leading-relaxed max-w-xl">
            Available online worldwide and face-to-face in Brisbane.
          </p>
        </div>
      </section>

      {/* What it is */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-6">The Execution Layer</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-8">
            Coaching derived entirely from the CFFS.
          </h2>
          <div className="max-w-2xl space-y-6 text-white/60 text-lg leading-relaxed">
            <p>
              Performance Coaching is the downstream application of the Body Recode™ interpretive system in the health and fitness environment. It does not begin with a program. It begins with interpretation. A full biological intake across eight domains produces the CFFS — the Coach-Facing Foundational Synthesis. Every decision operates within the boundaries the CFFS defines.
            </p>
            <p>
              The coaching system runs on two parallel documents throughout the entire client relationship: the CFFS, foundational and non-temporal, produced at intake; and the CFWS, the Coach-Facing Weekly Synthesis, which captures how the system is responding to applied load in real time. Both feed a continuous loop — interpretation informs execution, execution informs interpretation.
            </p>
          </div>
        </div>
      </section>

      {/* Four biological patterns */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">Who This Is For</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-6">
            Four biological patterns.<br />One system built around all of them.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            Body Recode™ recognises four distinct biological profiles, each with predictable symptoms and patterns. Understanding which one applies changes everything about how coaching should proceed.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                label: 'Stress-Stored',
                who: 'Male + Female',
                desc: 'Wired and tired. Abdominal puffiness, morning heaviness, afternoon crashes, broken sleep, and caffeine as a daily coping mechanism. Training happens but results do not. The system is overloaded, not undermotivated.',
              },
              {
                label: 'Estrogen-Shift',
                who: 'Female',
                desc: 'Lower-body softening, bloating, cycle unpredictability, mood fluctuation. The body feels less predictable. Doing everything right and still not progressing. Something hormonal has shifted.',
              },
              {
                label: 'Insulin-Drift',
                who: 'Male dominant',
                desc: 'Once felt strong without trying. Now softer across the chest and stomach, energy unstable, training heavier than it should feel. Often a formerly consistent trainer who has lost the biological responsiveness he once had.',
              },
              {
                label: 'Androgen-Decline',
                who: 'Male',
                desc: 'Capable on the outside. Privately flat. Strength declining quietly. Morning face looks tired. Motivation reduced. The identity built around capability and physical presence is eroding. Slowly, and without a clear explanation.',
              },
            ].map((item, i) => (
              <div key={i} className="border border-white/10 rounded-2xl p-7">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-base font-bold text-white">{item.label}</p>
                  <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">{item.who}</span>
                </div>
                <p className="text-white/50 text-base leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">Delivery</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-6">
            The same system.<br />Two ways to access it.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            Whether you are in Brisbane or anywhere in the world, the methodology, the depth, and the quality are identical.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-[#10E1C2]/30 rounded-2xl p-8 bg-[#10E1C2]/5">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-bold text-[#10E1C2] uppercase tracking-wider">Online 1:1</p>
                <span className="text-[10px] font-bold text-black bg-[#10E1C2] px-2.5 py-1 rounded-full uppercase tracking-wider">Worldwide</span>
              </div>
              <p className="text-white/60 text-base leading-relaxed">
                Full 1:1 coaching delivered remotely. Same structured intake, same biological assessment, same program design. Everything lives in your client portal — your program, your synthesis documents, your weekly check-ins, your progress data.
              </p>
            </div>
            <div className="border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-bold text-white/40 uppercase tracking-wider">Face-to-Face</p>
                <span className="text-[10px] font-bold text-white/30 border border-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Brisbane</span>
              </div>
              <p className="text-white/60 text-base leading-relaxed">
                The same Body Recode™ system delivered face-to-face at Anytime Fitness Newstead. One-on-one only. Availability is intentionally limited to maintain the coaching depth the system requires.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-6">Get Started</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-6">
            Enquire about Performance Coaching
          </h2>
          <p className="text-white/50 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Online worldwide and face-to-face in Brisbane. Get in touch to discuss availability and whether Performance Coaching is the right fit.
          </p>
          <a
            href="mailto:info@bodyrecode.au"
            className="inline-block border border-[#10E1C2]/40 text-[#10E1C2] font-semibold px-8 py-4 rounded-full text-base hover:border-[#10E1C2] transition-colors"
          >
            info@bodyrecode.au
          </a>
        </div>
      </section>

      <MarketingFooter />
    </>
  )
}
