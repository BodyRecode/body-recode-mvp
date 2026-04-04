import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingNav from '@/components/marketing/nav'
import MarketingFooter from '@/components/marketing/footer'
import DnaHelix from '@/components/dna-helix'

export const metadata: Metadata = {
  title: 'Performance Coaching | Body Recode™',
  description: 'Biology-first 1:1 coaching for high-functioning adults whose bodies have stopped responding to effort. Find out why — and fix it.',
}

export default function PerformanceCoachingPage() {
  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="bg-black min-h-screen flex items-center pt-20 overflow-hidden relative">
        <DnaHelix className="absolute right-0 top-0 h-full w-auto max-w-xs md:max-w-sm pointer-events-none select-none" opacity={0.06} />
        <div className="max-w-4xl mx-auto px-5 py-32 relative z-10">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-8">
            Body Recode™ — Performance Coaching
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-8">
            Find out why your body has stopped responding.<br />
            <span className="text-[#10E1C2]">Then fix it.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 leading-relaxed max-w-2xl mb-12">
            You are training. You are eating well. You are doing everything you have always done. And the body is not moving. This is not a motivation problem. It is a biology problem. And biology responds to the right read — not more effort.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/performance-check-in"
              className="inline-block bg-[#10E1C2] text-black font-bold px-8 py-4 rounded-full text-base hover:bg-[#0ecfb2] transition-colors"
            >
              Start your free check-in
            </Link>
            <Link
              href="#how-it-works"
              className="inline-block border border-white/20 text-white font-semibold px-8 py-4 rounded-full text-base hover:border-white/40 transition-colors"
            >
              How it works →
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">The Problem</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-12">
            Effort can stay high while capacity quietly deteriorates.
          </h2>
          <div className="max-w-2xl mx-auto space-y-6 text-white/60 text-lg leading-relaxed">
            <p>
              Most training approaches assess progress based on output — weights lifted, sessions completed, calories tracked. Output can stay consistent while the body's internal capacity is narrowing. That is when effort stops producing results.
            </p>
            <p>
              You push harder. The body digs in. Recovery drops. Sleep suffers. The signals are there — abdominal softening, afternoon crashes, training that feels heavier than it should, body composition that won't shift despite compliance. These are not signs of undereffort. They are signs the system is under load it cannot resolve.
            </p>
            <p>
              Prescribing more training into that environment makes it worse.
            </p>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section id="how-it-works" className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-6">The Solution</p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-8 leading-tight">
            Read the body first.<br />Then prescribe.
          </h2>
          <p className="text-white/60 text-xl leading-relaxed max-w-2xl mx-auto mb-16">
            Body Recode™ Performance Coaching sits one layer upstream of every intervention. Before a program is designed or a nutrition structure is built, the system produces a complete biological read. Everything downstream is derived from that read.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              {
                step: '01',
                title: 'Decode',
                body: 'A structured 208-question intake across eight biological domains — training load, stress architecture, recovery capacity, hormonal signals, fat distribution, sleep, behaviour, and emotional load. A complete picture of how your system is currently organised.',
              },
              {
                step: '02',
                title: 'Rewire',
                body: 'The interpretation produces the CFFS — your Coach-Facing Foundational Synthesis. Every training and nutrition decision is derived from this document. Not a template. Not a generic program. A system built for exactly where your biology is right now.',
              },
              {
                step: '03',
                title: 'Rebuild',
                body: 'Sustained progress built on a foundation that understands your biology. Stronger, leaner, and more resilient — not through more pressure, but through precision. The CFWS captures how your system responds week to week and keeps coaching current.',
              },
            ].map(item => (
              <div key={item.step} className="border border-white/10 rounded-2xl p-8">
                <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-4">{item.step}</p>
                <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                <p className="text-white/50 text-base leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What makes it different */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">What Makes This Different</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-16">
            Most coaching measures output.<br />This measures capacity.
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-white/10 rounded-2xl p-8">
              <p className="text-sm font-bold uppercase tracking-wider text-white/30 mb-6">Conventional coaching</p>
              <ul className="space-y-4">
                {[
                  'Starts with goals',
                  'Prescribes a program',
                  'Measures output',
                  'Assumes the body is ready',
                  'Adjusts when results plateau',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/40 text-base">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/15 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-[#10E1C2]/30 rounded-2xl p-8 bg-[#10E1C2]/5">
              <p className="text-sm font-bold uppercase tracking-wider text-[#10E1C2] mb-6">Body Recode™</p>
              <ul className="space-y-4">
                {[
                  'Starts with biological interpretation',
                  'Prescribes only what the body can tolerate',
                  'Measures capacity, not just output',
                  'Asks whether the body is ready — and reads the answer',
                  'Adjusts based on real-time biological signal',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/70 text-base">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#10E1C2] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What they get */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">What You Get</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-6">
            Everything in one place.<br />Built around your biology.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            Every client gets access to a dedicated portal from day one. Your program, your data, your synthesis documents, your weekly check-ins — all in one place, updated continuously as your biology responds and changes.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Foundational Synthesis (CFFS)', desc: 'Your complete biological read from intake. The document everything else operates within. Non-temporal — it does not expire.' },
              { title: 'Training Program', desc: 'Structured training built around your biological profile and updated as your phase progresses. Not a template.' },
              { title: 'Nutrition Structure', desc: 'A framework built for your current body state — not a calorie target, not a generic meal plan.' },
              { title: 'Weekly Synthesis (CFWS)', desc: 'A running record of how your system is responding to applied load. Keeps coaching current week to week.' },
              { title: 'Weekly Check-Ins', desc: 'Structured reporting that captures how training and nutrition are landing. Your responses are read and interpreted every week.' },
              { title: 'Progress Tracking', desc: 'Your measurements tracked over time. How your body is responding, what is changing, and where the system is heading.' },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-3">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">Who This Is For</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-6">
            Four biological patterns.<br />One system built around all of them.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            Body Recode™ recognises four distinct biological profiles. Each has predictable symptoms and a predictable reason why effort has stopped producing results. Knowing which one applies changes everything about how coaching should proceed.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {[
              {
                label: 'Stress-Stored',
                who: 'Male + Female',
                desc: 'Wired and tired. Abdominal puffiness, morning heaviness, afternoon crashes, broken sleep, caffeine as a daily coping mechanism. Training happens but results do not. The system is overloaded, not undermotivated.',
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
          <p className="text-white/30 text-base text-center max-w-xl mx-auto">
            If any of these feel accurate, the Performance Check-In is where to start.
          </p>
        </div>
      </section>

      {/* Delivery */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
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
              <p className="text-white/60 text-base leading-relaxed mb-8">
                Full 1:1 coaching delivered remotely. Same structured intake, same biological assessment, same program design. Everything lives in your dedicated client portal — accessible anywhere.
              </p>
              <Link href="/performance-coaching/online" className="text-[#10E1C2] text-sm font-semibold hover:underline">
                Online coaching →
              </Link>
            </div>
            <div className="border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-bold text-white/40 uppercase tracking-wider">Face-to-Face</p>
                <span className="text-[10px] font-bold text-white/30 border border-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Brisbane</span>
              </div>
              <p className="text-white/60 text-base leading-relaxed mb-8">
                The same system delivered face-to-face at Anytime Fitness Newstead. One-on-one only. Availability is intentionally limited to maintain the coaching depth the system requires.
              </p>
              <Link href="/performance-coaching/brisbane" className="text-white/50 text-sm font-semibold hover:text-white transition-colors">
                Brisbane coaching →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
            Start with the check-in.<br />
            <span className="text-[#10E1C2]">It&apos;s free.</span>
          </h2>
          <p className="text-white/50 text-lg leading-relaxed mb-12 max-w-xl mx-auto">
            A short performance check-in that identifies the patterns currently showing up across your training, recovery, and how your body is responding to life load. Takes 3–5 minutes. No obligation.
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
