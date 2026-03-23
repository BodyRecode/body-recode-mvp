import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingNav from '@/components/marketing/nav'
import MarketingFooter from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'Performance Coach Brisbane | Body Recode™',
  description: 'Body Recode™ is a biology-first performance coaching system in Brisbane for high-functioning adults whose bodies have stopped responding to effort. Based at Anytime Fitness Newstead.',
}

export default function PerformanceCoachBrisbanePage() {
  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="bg-black pt-44 pb-32 px-5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-6">Brisbane · Face-to-Face Performance Coaching</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-8">
            Performance Coaching Brisbane
          </h1>
          <p className="text-xl text-white/60 leading-relaxed max-w-2xl mb-12">
            Body Recode™ is a biology-first coaching system built for high-functioning adults in Brisbane whose bodies have stopped responding to effort. If you want to understand why before you do anything else, this is where to start.
          </p>
          <Link
            href="/performance-check-in"
            className="inline-block bg-[#10E1C2] text-black font-bold px-8 py-4 rounded-full text-base hover:bg-[#0ecfb2] transition-colors"
          >
            Start your free performance check-in
          </Link>
        </div>
      </section>

      {/* Recognition */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">Sound familiar?</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-16">
            The effort is still there.<br />The response has gone quiet.
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              'You are training consistently but nothing visible is changing',
              'You wake up puffy and feel heavier than you should',
              'Energy crashes hit at the same time every afternoon',
              'Sleep is not restoring you the way it used to',
              'You feel capable at work but flat and depleted underneath',
              'Your body feels unpredictable, different week to week for no clear reason',
              'You have done the programs. You know the habits. It is still not working.',
              'Something has shifted. You just do not know what.',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 bg-white/5 rounded-2xl p-5">
                <div className="w-5 h-5 rounded-full bg-[#10E1C2]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-[#10E1C2]" />
                </div>
                <p className="text-white/70 text-base leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-base text-center leading-relaxed mt-12 max-w-2xl mx-auto">
            These are not discipline problems. They are biological signals. Body Recode™ is built to read them.
          </p>
        </div>
      </section>

      {/* What performance coaching is */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-6">The Approach</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-8">
            Biology first. Training second.
          </h2>
          <p className="text-white/60 text-lg leading-relaxed mb-6">
            Most coaching in Brisbane escalates when progress stalls: more sessions, more intensity, more restriction. Body Recode™ does the opposite. Before any training is prescribed, we establish what your biology is actually doing and why.
          </p>
          <p className="text-white/60 text-lg leading-relaxed mb-6">
            This means building a complete picture across eight domains: training history, stress load, sleep and recovery, body pattern signals, nutrition behaviours, schedule, stimulant use, and hormonal context. Not a fitness test. A full read of your system.
          </p>
          <p className="text-white/60 text-lg leading-relaxed">
            From that picture, everything is designed around your individual biological profile: training, recovery, and lifestyle inputs. Not a template. Not a generic program. A system built for exactly where you are right now.
          </p>
        </div>
      </section>

      {/* Four biological patterns */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">Who This Is For</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-6">
            Four biological patterns.<br />One system built around all of them.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            Body Recode™ recognises four distinct biological profiles, each with predictable symptoms and patterns. Understanding which one applies to you changes everything about how coaching should proceed.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
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
          <p className="text-white/30 text-base text-center leading-relaxed max-w-xl mx-auto">
            If any of these feel accurate, the Performance Check-In is where to start.
          </p>
        </div>
      </section>

      {/* The system */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-6">The System</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-16">Decode. Rewire. Rebuild.</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { step: '01', title: 'Decode', body: 'A structured assessment across eight biological domains: training history, stress load, sleep, recovery, body pattern signals, nutrition, schedule, and stimulant use. This is not a fitness test. It is a complete picture of your system.' },
              { step: '02', title: 'Rewire', body: 'Training, recovery, and lifestyle inputs are redesigned around your individual biological profile. Not a template. Not a generic program. A system built for exactly where you are right now.' },
              { step: '03', title: 'Rebuild', body: 'Sustained progress built on a foundation that understands your biology. Stronger, leaner, and more resilient. Not through pressure, but through precision.' },
            ].map(item => (
              <div key={item.step} className="border border-white/10 rounded-2xl p-8">
                <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-4">{item.step}</p>
                <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                <p className="text-white/50 text-base leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-6">
            <Link href="/strength-coach-brisbane" className="text-[#10E1C2] text-sm font-semibold hover:underline">Strength coaching →</Link>
            <Link href="/fat-loss-coach-brisbane" className="text-[#10E1C2] text-sm font-semibold hover:underline">Fat loss coaching →</Link>
            <Link href="/personal-trainer-brisbane" className="text-[#10E1C2] text-sm font-semibold hover:underline">Personal training →</Link>
          </div>
        </div>
      </section>

      {/* Inside the coaching system */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-6">Inside the System</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-6">
            What happens once you are accepted into coaching
          </h2>
          <p className="text-white/50 text-lg leading-relaxed max-w-2xl mb-16">
            The Performance Check-In is the starting point. Once accepted, the coaching system operates through two distinct documents that run in parallel throughout the entire relationship.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="border border-white/10 rounded-2xl p-8">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-4">CFFS</p>
              <h3 className="text-lg font-bold text-white mb-4">Coach-Facing Foundational Synthesis</h3>
              <p className="text-white/50 text-base leading-relaxed mb-4">
                Produced at intake. Foundational, interpretive, and non-temporal. It does not change week to week. The CFFS establishes what is structurally true about your system: dominant patterns, limiting factors, non-negotiable constraints, and risk signals.
              </p>
              <p className="text-white/40 text-sm leading-relaxed">
                Everything that happens in coaching operates within the boundaries defined by the CFFS. No execution decision overrides it.
              </p>
            </div>
            <div className="border border-white/10 rounded-2xl p-8">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-4">CFWS</p>
              <h3 className="text-lg font-bold text-white mb-4">Coach-Facing Weekly Synthesis</h3>
              <p className="text-white/50 text-base leading-relaxed mb-4">
                Generated weekly throughout active coaching. Observational, not interpretive. It captures how your system is responding to applied load in real time: changes in recovery, tolerance, regulation, and any emerging risks or patterns.
              </p>
              <p className="text-white/40 text-sm leading-relaxed">
                The CFWS feeds back into the system as new data. It keeps the coaching picture current without overriding the foundational interpretation.
              </p>
            </div>
          </div>

          <h3 className="text-2xl font-extrabold text-white tracking-tight mb-6">Three body states. One continuous loop.</h3>
          <p className="text-white/50 text-base leading-relaxed mb-10 max-w-2xl">
            The CFFS places every client into one of three body states. This determines everything about how coaching is structured: what training is appropriate, what recovery demands are real, and what goals are biologically viable right now.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                state: 'Remediation',
                colour: 'border-red-800/40',
                label: 'text-red-400',
                desc: 'The regulatory system is under stress. Before any training escalation, the system needs stabilising. Pushing harder here does not produce better results; it produces setbacks. Remediation is not a failure state. It is a biological reality that must be respected before progress is possible.',
              },
              {
                state: 'Optimisation',
                colour: 'border-amber-300/40',
                label: 'text-amber-300',
                desc: 'The system is stable and can be built upon. Training load can be progressively increased. Body composition goals become realistic and sustainable. This is the phase where structured effort produces consistent, measurable output.',
              },
              {
                state: 'Post-Optimisation',
                colour: 'border-[#10E1C2]/30',
                label: 'text-[#10E1C2]',
                desc: 'A long-arc performance phase. The system is resilient and capable of sustained high-level output. It is built over time and cannot be forced. This is where the Body Recode™ approach produces its most complete expression.',
              },
            ].map((item) => (
              <div key={item.state} className={`border rounded-2xl p-7 ${item.colour}`}>
                <p className={`text-sm font-bold uppercase tracking-wider mb-4 ${item.label}`}>{item.state}</p>
                <p className="text-white/50 text-base leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-white/30 text-sm leading-relaxed max-w-2xl">
            Body state is not permanent. As the CFWS captures weekly responses and the system re-interprets, the coaching structure updates. The loop is continuous: interpretation informs execution, execution informs interpretation.
          </p>
        </div>
      </section>

      {/* Coach */}
      <section id="kade" className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-6">Your Coach</p>
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <img
                src="/kade.jpg"
                alt="Kade Dunstone, Performance Coach, Body Recode™"
                className="w-full rounded-2xl object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">Kade Dunstone</h2>
              <p className="text-sm text-white/40 uppercase tracking-wider font-semibold mb-10">
                Performance Coach · Founder, Body Recode™ · Anytime Fitness Newstead
              </p>
              <div className="space-y-5 text-white/60 text-base leading-relaxed">
                <p>
                  I spent years competing nationally and internationally. Winning titles. Understanding the body at a level most people never reach. I knew how to train. I knew how to eat. I knew how to shape my body with precision.
                </p>
                <p>
                  Then a few years ago, everything changed at once. A relationship ended. A business closed. The structure I had built my life inside was gone, almost overnight.
                </p>
                <p>
                  And my body responded in ways I had never seen before.
                </p>
                <p>
                  My rhythm collapsed. Hunger signals I had always trusted became unpredictable. My energy dropped in a way that had nothing to do with sleep or training. I held fat in places my body had never held it. And the harder I pushed, the worse things got.
                </p>
                <p>
                  For someone whose identity was built around knowing how to do this, it was confronting in a way I was not prepared for. Not just physically. It challenged who I thought I was.
                </p>
                <p>
                  What I had to learn, and what took far longer than it should have, is that my body was not broken. It was signalling. Loudly. And everything I had been trained to do was making it worse, not better.
                </p>
                <p className="text-white/80 font-medium">
                  Body Recode™ exists because of that experience. Not as a theory. As a system built from understanding what happens when biology stops responding to effort, and what actually has to change first.
                </p>
              </div>
              <p className="mt-10 text-sm text-white/30 leading-relaxed">
                <a href="https://www.anytimefitness.com/en-au/locations/newstead-queensland-au-1937" target="_blank" rel="noopener noreferrer" className="text-[#10E1C2] hover:underline">Anytime Fitness Newstead</a> · Brisbane · <a href="mailto:info@bodyrecode.au" className="text-[#10E1C2] hover:underline">info@bodyrecode.au</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-14">Frequently asked questions</h2>
          <div className="space-y-8">
            {[
              { q: 'What makes Body Recode™ different from a personal trainer in Brisbane?', a: 'Most personal trainers focus on the workout session. Body Recode™ uses a structured biological assessment to understand your body before any training is prescribed. The result is a system built around your current biology, not a generic template applied to everyone.' },
              { q: 'How do I get started?', a: 'The starting point is the free Performance Check-In. It identifies the patterns currently showing up across your training, recovery, and how your body is responding to life load. No obligation. Just clarity.' },
              { q: 'Where are you located?', a: 'Body Recode™ operates out of Anytime Fitness Newstead in Brisbane. All coaching is face-to-face.' },
              { q: 'How many clients do you work with at once?', a: 'Availability is intentionally limited. This is a precision coaching environment, not a high-volume gym model. Each client receives the level of attention the system requires.' },
              { q: 'Do I need to be an experienced gym-goer?', a: 'No. The system is built to meet you exactly where you are. Your training history and current capacity are assessed through the intake process, and everything is structured accordingly.' },
              { q: 'What does performance coaching involve day-to-day?', a: 'Structured training sessions, recovery monitoring, lifestyle adjustments where relevant, and regular review of how your body is responding. Everything is guided by your biological profile and updated as you progress.' },
            ].map((item, i) => (
              <div key={i} className="border-b border-white/10 pb-8">
                <h3 className="text-base font-bold text-white mb-3">{item.q}</h3>
                <p className="text-white/50 text-base leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-6">
            Start with the check-in.<br />
            <span className="text-[#10E1C2]">It&apos;s free.</span>
          </h2>
          <p className="text-white/50 text-lg leading-relaxed mb-12 max-w-xl mx-auto">
            A short performance check-in that identifies the patterns currently showing up across your training, recovery, and how your body is responding to life load. No obligation. No pressure. Just clarity.
          </p>
          <Link
            href="/performance-check-in"
            className="inline-block bg-[#10E1C2] text-black font-bold px-10 py-5 rounded-full text-lg hover:bg-[#0ecfb2] transition-colors"
          >
            Start your free check-in →
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </>
  )
}
