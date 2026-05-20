import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingNav from '@/components/marketing/nav'
import MarketingFooter from '@/components/marketing/footer'
import DnaHelix from '@/components/dna-helix'

export const metadata: Metadata = {
  title: 'Performance Coaching | Body Recode™',
  description: 'Body Recode™ Performance Coaching - Environment 1 of the Body Recode™ biological interpretation system. Available online worldwide and face-to-face in Brisbane.',
}

export default function PerformanceCoachingPage() {
  return (
    <>
      <MarketingNav variant="consumer" />

      {/* Hero */}
      <section className="bg-black pt-44 pb-32 px-5 overflow-hidden relative">
        <DnaHelix className="absolute right-0 top-0 h-full w-auto max-w-xs pointer-events-none select-none" opacity={0.06} />
        <div className="max-w-4xl mx-auto relative z-10">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-6">
            Environment 01: Health &amp; Fitness
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] leading-tight tracking-tight mb-8">
            Performance Coaching
          </h1>
          <p className="text-xl text-stone-400 leading-relaxed max-w-2xl mb-8">
            The first execution layer of the Body Recode™ system. 1:1 coaching for high-functioning adults whose bodies have stopped responding to effort. Every training decision, every nutrition structure, every recovery adjustment is derived from the biological interpretation. Not from goals, not from preference, not from a template.
          </p>
          <p className="text-stone-500 text-base leading-relaxed max-w-xl">
            Available online worldwide and face-to-face in Brisbane.
          </p>
        </div>
      </section>

      {/* What it is */}
      <section className="bg-[#FFFFFF] py-32 px-5 border-t border-stone-800">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-6">The Execution Layer</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-8">
            Coaching derived entirely from the CFFS.
          </h2>
          <div className="max-w-2xl space-y-6 text-stone-400 text-lg leading-relaxed">
            <p>
              Performance Coaching is the downstream application of the Body Recode™ interpretive system in the health and fitness environment. It does not begin with a program. It begins with interpretation. A full biological intake across eight domains produces the CFFS: the Coach-Facing Foundational Synthesis. Every decision operates within the boundaries the CFFS defines.
            </p>
            <p>
              The coaching system runs on two parallel documents throughout the entire client relationship: the CFFS, foundational and non-temporal, produced at intake; and the CFWS, the Coach-Facing Weekly Synthesis, which captures how the system is responding to applied load in real time. Both feed a continuous loop: interpretation informs execution, execution informs interpretation.
            </p>
          </div>
        </div>
      </section>

      {/* Client population */}
      <section className="bg-black py-32 px-5 border-t border-stone-800">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-6">Client Population</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-8">
            General population. High-functioning adults.
          </h2>
          <div className="max-w-2xl space-y-6 text-stone-400 text-lg leading-relaxed">
            <p>
              The Performance Coaching environment serves general population clients: high-functioning adults whose bodies have stopped responding to effort despite consistent training and nutrition compliance. The common thread is not age, gender, or goal. It is a body operating under load it cannot resolve.
            </p>
            <p>
              The system recognises four distinct biological profiles within this population: Stress-Stored, Estrogen-Shift, Insulin-Drift, and Androgen-Decline. Each presents with predictable signal patterns. Each requires a different execution approach. The interpretation layer identifies which profile applies and defines the boundaries within which coaching proceeds.
            </p>
            <p>
              This is not a corrective or clinical environment. The client population is functioning (training, working, living) but experiencing biological non-response that conventional coaching cannot explain or resolve.
            </p>
          </div>
        </div>
      </section>

      {/* Delivery */}
      <section className="bg-[#FFFFFF] py-32 px-5 border-t border-stone-800">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase text-center mb-6">Delivery</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] text-center tracking-tight mb-6">
            The same system.<br />Two ways to access it.
          </h2>
          <p className="text-stone-500 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            Whether you are in Brisbane or anywhere in the world, the methodology, the depth, and the quality are identical.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-blue-200 rounded-2xl p-8 bg-blue-50">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-bold text-[#1B6DFC] uppercase tracking-wider">Online 1:1</p>
                <span className="text-[10px] font-bold text-black bg-[#1B6DFC] px-2.5 py-1 rounded-full uppercase tracking-wider">Worldwide</span>
              </div>
              <p className="text-stone-400 text-base leading-relaxed mb-6">
                Full 1:1 coaching delivered remotely. Same structured intake, same biological assessment, same program design. Everything lives in your client portal: your program, your synthesis documents, your weekly check-ins, your progress data.
              </p>
              <a href="https://performance.bodyrecode.au/online" className="text-sm font-semibold text-[#1B6DFC] hover:underline">Online Coaching →</a>
            </div>
            <div className="border border-stone-800 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-bold text-stone-500 uppercase tracking-wider">Face-to-Face</p>
                <span className="text-[10px] font-bold text-stone-600 border border-stone-800 px-2.5 py-1 rounded-full uppercase tracking-wider">Brisbane</span>
              </div>
              <p className="text-stone-400 text-base leading-relaxed mb-6">
                The same Body Recode™ system delivered face-to-face at Anytime Fitness Newstead. One-on-one only. Availability is intentionally limited to maintain the coaching depth the system requires.
              </p>
              <a href="https://performance.bodyrecode.au/brisbane" className="text-sm font-semibold text-stone-500 hover:text-stone-400 transition-colors">Brisbane Coaching →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="bg-black py-32 px-5 border-t border-stone-800">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-6">Environment 01: Live</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-6">
            Built, validated, and accepting clients.
          </h2>
          <p className="text-stone-500 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Performance Coaching is the first live deployment of the Body Recode™ system. Available online worldwide and face-to-face in Brisbane.
          </p>
          <a
            href="https://performance.bodyrecode.au"
            className="inline-block bg-[#1B6DFC] text-[#1A1A1A] font-bold px-8 py-4 rounded-full text-base hover:bg-[#0ecfb3] transition-colors mb-4"
          >
            Visit Performance Coaching
          </a>
          <p className="text-stone-600 text-sm mt-2">performance.bodyrecode.au</p>
        </div>
      </section>

      <MarketingFooter variant="consumer" />
    </>
  )
}
