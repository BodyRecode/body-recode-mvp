import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingNav from '@/components/marketing/nav'
import MarketingFooter from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'Body Recode™ | Biology-First Performance Coaching',
  description: 'Body Recode™ is a biology-first performance coaching system for high-functioning adults whose bodies have stopped responding to effort. Available online worldwide and face-to-face in Brisbane.',
}

export default function HomePage() {
  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="bg-black min-h-screen flex items-center pt-20">
        <div className="max-w-4xl mx-auto px-5 py-32 text-center">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-8">
            Online 1:1 Coaching · Worldwide
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-8">
            The effort is still there.<br />
            The response has gone quiet.
          </h1>
          <p className="text-lg md:text-xl text-white/50 leading-relaxed max-w-2xl mx-auto mb-12">
            Body Recode™ is a biology-first coaching system built for high-functioning adults whose bodies are signalling something is off. If you want to understand what that is before you do anything else, this is where to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/performance-check-in"
              className="bg-[#10E1C2] text-black font-bold px-8 py-4 rounded-full text-base hover:bg-[#0ecfb2] transition-colors"
            >
              Start your free check-in
            </Link>
            <Link
              href="/online-performance-coaching"
              className="border border-white/20 text-white font-semibold px-8 py-4 rounded-full text-base hover:border-white/40 transition-colors"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* The recognition moment */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">Sound familiar?</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-16">
            Your body is sending signals.<br />Most coaching ignores them.
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              'You wake up puffy most mornings and feel heavier than you should',
              'You\'re training consistently but nothing visible is changing',
              'Energy crashes hit the same time every afternoon, every day',
              'You feel capable at work but flat and depleted underneath',
              'Sleep isn\'t restoring you the way it used to',
              'Your body feels unpredictable, different week to week for no clear reason',
              'You\'ve done the programs. You know the habits. It\'s still not working.',
              'Something has shifted. You just don\'t know what.',
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
            These are not discipline problems. They are biological signals. And they are the exact patterns Body Recode™ is built to interpret.
          </p>
        </div>
      </section>

      {/* What Body Recode actually is */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">The System</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-6">
            Decode. Rewire. Rebuild.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            Most coaching escalates when progress slows. Body Recode™ interprets first. Before any training is prescribed, we establish what your biology is actually doing and why.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
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
        </div>
      </section>

      {/* Client Portal */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">Client Portal</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-6">
            Everything in one place.<br />Always up to date.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            Every client gets access to a dedicated portal from day one. Your program, your data, your synthesis documents, your check-ins — all in one place, updated as you progress.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                title: 'Your Training Program',
                desc: 'Your structured training plan, built around your biological profile. Updated as your phase progresses.',
              },
              {
                title: 'Nutrition Guidelines',
                desc: 'Nutrition structure designed around your current body state. Not a generic meal plan — a framework built for your biology.',
              },
              {
                title: 'Foundation Synthesis',
                desc: 'Your CFFS — the complete biological read of your system from intake. The document everything else operates within.',
              },
              {
                title: 'Weekly Check-Ins',
                desc: 'Structured weekly reporting that keeps your coaching current. Your responses are read and interpreted every week, not filed away.',
              },
              {
                title: 'Progress Tracking',
                desc: 'Your data, tracked over time. How your body is responding, what is changing, and where the system is heading.',
              },
              {
                title: 'Coach Notes',
                desc: 'Session notes, adjustments, and observations from your coach. A running record of how the system is being applied to you specifically.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-3">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-white/30 text-sm text-center max-w-xl mx-auto">
            The portal is not a static document drop. It is an active coaching environment that reflects your current state and evolves as your biology changes.
          </p>
        </div>
      </section>

      {/* Delivery options */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase text-center mb-6">How Coaching Is Delivered</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center tracking-tight mb-6">
            The same system.<br />Two ways to access it.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
            Body Recode™ is the system. Delivery is how you access it. Whether you are in Brisbane or anywhere in the world, the methodology, the depth, and the quality are identical.
          </p>
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="border border-[#10E1C2]/30 rounded-2xl p-8 bg-[#10E1C2]/5">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-bold text-[#10E1C2] uppercase tracking-wider">Online 1:1</p>
                <span className="text-[10px] font-bold text-black bg-[#10E1C2] px-2.5 py-1 rounded-full uppercase tracking-wider">Primary</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Coach anywhere in the world</h3>
              <p className="text-white/60 text-base leading-relaxed mb-6">
                Full 1:1 coaching delivered remotely. Same structured intake, same biological assessment, same program design. Everything lives in your client portal — your program, your synthesis documents, your weekly check-ins, your progress data.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  'Full eight-domain biological intake',
                  'Individual program design',
                  'Dedicated client portal access',
                  'Weekly check-in and synthesis review',
                  '1:1 coaching communication',
                  'Available worldwide',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/60 leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#10E1C2] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/online-performance-coaching"
                className="inline-block text-[#10E1C2] text-sm font-semibold hover:underline"
              >
                Online coaching →
              </Link>
            </div>
            <div className="border border-white/10 rounded-2xl p-8">
              <p className="text-sm font-bold text-white/40 uppercase tracking-wider mb-6">Face-to-Face · Brisbane</p>
              <h3 className="text-xl font-bold text-white mb-4">In-person coaching in Newstead</h3>
              <p className="text-white/60 text-base leading-relaxed mb-6">
                The same Body Recode™ system delivered face-to-face at Anytime Fitness Newstead, Brisbane. One-on-one only. Availability is intentionally limited to maintain the coaching depth the system requires.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  'Full eight-domain biological intake',
                  'Individual program design',
                  'Dedicated client portal access',
                  'In-person coached sessions',
                  'Anytime Fitness Newstead, Brisbane',
                  'Limited availability',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/50 leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/performance-coach-brisbane"
                className="inline-block text-white/50 text-sm font-semibold hover:text-white transition-colors"
              >
                Brisbane coaching →
              </Link>
            </div>
          </div>
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
                desc: 'Wired and tired. Abdominal puffiness, morning heaviness, afternoon crashes, broken sleep, and caffeine as a daily coping mechanism. Training happens but results don\'t. The system is overloaded, not undermotivated.',
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

      {/* Core message */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-8 leading-tight">
            Your body is not broken.<br />
            <span className="text-white/40">It is signalling.</span>
          </h2>
          <p className="text-white/50 text-lg leading-relaxed mb-6 max-w-2xl mx-auto">
            The patterns you are experiencing: the puffiness, the crashes, the stalled results, the unpredictability. These are biological signals, not failures of effort or discipline.
          </p>
          <p className="text-white/50 text-lg leading-relaxed mb-12 max-w-2xl mx-auto">
            Body Recode™ is built to read those signals, interpret what they mean, and build a coaching structure around them. Not around a template. Around you.
          </p>
          <Link
            href="/performance-check-in"
            className="inline-block bg-[#10E1C2] text-black font-bold px-10 py-5 rounded-full text-lg hover:bg-[#0ecfb2] transition-colors"
          >
            Start your free check-in
          </Link>
        </div>
      </section>

      {/* Coach */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-10">Your Coach</p>
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <img
                src="/kade.jpg"
                alt="Kade Dunstone, Performance Coach, Body Recode™"
                className="w-full rounded-2xl object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">Kade Dunstone</h2>
              <p className="text-sm text-white/40 uppercase tracking-wider font-semibold mb-8">
                Performance Coach · Founder, Body Recode™
              </p>
              <p className="text-white/60 text-base leading-relaxed mb-10">
                Kade built Body Recode™ because conventional coaching was failing people who were doing everything right. The system exists because effort without biological context produces frustration, not results. Every method inside it is built around interpreting your body, not overriding it.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/performance-check-in"
                  className="inline-block bg-[#10E1C2] text-black font-bold px-8 py-4 rounded-full text-base hover:bg-[#0ecfb2] transition-colors"
                >
                  Work with Kade
                </Link>
                <Link
                  href="/online-performance-coaching#kade"
                  className="inline-block border border-white/20 text-white/60 font-semibold px-8 py-4 rounded-full text-base hover:border-white/40 hover:text-white transition-colors"
                >
                  More about Kade
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
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
