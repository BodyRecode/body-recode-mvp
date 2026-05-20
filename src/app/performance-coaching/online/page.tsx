import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingNav from '@/components/marketing/nav'
import MarketingFooter from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'Online Performance Coaching | Body Recode™',
  description: 'Body Recode™ online performance coaching. A biology-first 1:1 coaching system for high-functioning adults whose bodies have stopped responding to effort. Available worldwide.',
}

export default function OnlinePerformanceCoachingPage() {
  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="bg-black pt-44 pb-32 px-5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-6">Online · 1:1 Performance Coaching</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] leading-tight tracking-tight mb-8">
            Online Performance Coaching
          </h1>
          <p className="text-xl text-stone-600 leading-relaxed max-w-2xl mb-12">
            Body Recode™ is a biology-first coaching system built for high-functioning adults whose bodies have stopped responding to effort. Delivered 1:1 online, same system, same depth, available anywhere in the world.
          </p>
          <Link
            href="/performance-check-in"
            className="inline-block bg-[#1B6DFC] text-[#1A1A1A] font-bold px-8 py-4 rounded-full text-base hover:bg-[#1056D6] transition-colors"
          >
            Start your free performance check-in
          </Link>
        </div>
      </section>

      {/* Recognition */}
      <section className="bg-[#FFFFFF] py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase text-center mb-6">Sound familiar?</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] text-center tracking-tight mb-16">
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
              <div key={i} className="flex items-start gap-4 bg-stone-50 rounded-2xl p-5">
                <div className="w-5 h-5 rounded-full bg-[#1B6DFC]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-[#1B6DFC]" />
                </div>
                <p className="text-stone-600 text-base leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
          <p className="text-stone-500 text-base text-center leading-relaxed mt-12 max-w-2xl mx-auto">
            These are not discipline problems. They are biological signals. Body Recode™ is built to read them.
          </p>
        </div>
      </section>

      {/* The approach */}
      <section className="bg-black py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-6">The Approach</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-8">
            Biology first. Training second.
          </h2>
          <p className="text-stone-600 text-lg leading-relaxed mb-6">
            Most online coaching sends you a program and checks in once a week. Body Recode™ does something different. Before any training is prescribed, we establish what your biology is actually doing and why.
          </p>
          <p className="text-stone-600 text-lg leading-relaxed mb-6">
            This means building a complete picture across eight domains: training history, stress load, sleep and recovery, body pattern signals, nutrition behaviours, schedule, stimulant use, and hormonal context. Not a fitness questionnaire. A full read of your system.
          </p>
          <p className="text-stone-600 text-lg leading-relaxed">
            From that picture, everything is designed around your individual biological profile: training, recovery, and lifestyle inputs. Not a template. Not a generic program. A system built for exactly where you are right now.
          </p>
        </div>
      </section>

      {/* Client portal */}
      <section className="bg-[#FFFFFF] py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-6">Client Portal</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-6">
            Everything in one place.<br />Always up to date.
          </h2>
          <p className="text-stone-500 text-lg leading-relaxed max-w-2xl mb-16">
            Every client gets access to a dedicated portal from day one. Your program, your data, your synthesis documents, your weekly check-ins, all in one place, updated continuously as you progress through coaching.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                title: 'Your Training Program',
                desc: 'Your structured training plan, built around your biological profile and updated as your phase progresses.',
              },
              {
                title: 'Nutrition Guidelines',
                desc: 'Nutrition structure designed around your current body state. A framework built for your biology, not a generic plan.',
              },
              {
                title: 'Foundation Synthesis',
                desc: 'Your CFFS, the complete biological read of your system from intake. The document everything else operates within.',
              },
              {
                title: 'Weekly Check-Ins',
                desc: 'Structured weekly reporting that keeps your coaching current. Your responses are read and interpreted every week.',
              },
              {
                title: 'Progress Tracking',
                desc: 'Your data tracked over time. How your body is responding, what is changing, and where the system is heading.',
              },
              {
                title: 'Coach Notes',
                desc: 'Adjustments and observations from your coach. A running record of how the system is being applied to you specifically.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-stone-50 rounded-2xl p-6">
                <h3 className="text-base font-bold text-[#1A1A1A] mb-3">{item.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-stone-400 text-sm max-w-xl">
            The portal is not a static document drop. It is an active coaching environment that reflects your current state and evolves as your biology changes.
          </p>
        </div>
      </section>

      {/* The system */}
      <section className="bg-black py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-6">The System</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-16">Decode. Rewire. Rebuild.</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { step: '01', title: 'Decode', body: 'A structured assessment across eight biological domains: training history, stress load, sleep, recovery, body pattern signals, nutrition, schedule, and stimulant use. This is not a fitness test. It is a complete picture of your system.' },
              { step: '02', title: 'Rewire', body: 'Training, recovery, and lifestyle inputs are redesigned around your individual biological profile. Not a template. Not a generic program. A system built for exactly where you are right now.' },
              { step: '03', title: 'Rebuild', body: 'Sustained progress built on a foundation that understands your biology. Stronger, leaner, and more resilient. Not through pressure, but through precision.' },
            ].map(item => (
              <div key={item.step} className="border border-stone-200 rounded-2xl p-8">
                <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-4">{item.step}</p>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">{item.title}</h3>
                <p className="text-stone-500 text-base leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-6">
            <Link href="/performance-coaching/strength/online" className="text-[#1B6DFC] text-sm font-semibold hover:underline">Online strength coaching →</Link>
            <Link href="/performance-coaching/fat-loss/online" className="text-[#1B6DFC] text-sm font-semibold hover:underline">Online fat loss coaching →</Link>
            <Link href="/performance-coaching/personal-training/online" className="text-[#1B6DFC] text-sm font-semibold hover:underline">Online personal training →</Link>
          </div>
        </div>
      </section>

      {/* Inside the coaching system */}
      <section className="bg-[#FFFFFF] py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-6">Inside the System</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-6">
            What happens once you are accepted into coaching
          </h2>
          <p className="text-stone-500 text-lg leading-relaxed max-w-2xl mb-16">
            The Performance Check-In is the starting point. Once accepted, the coaching system operates through two distinct documents that run in parallel throughout the entire relationship.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="border border-stone-200 rounded-2xl p-8">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-4">CFFS</p>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Coach-Facing Foundational Synthesis</h3>
              <p className="text-stone-500 text-base leading-relaxed mb-4">
                Produced at intake. Foundational, interpretive, and non-temporal. It does not change week to week. The CFFS establishes what is structurally true about your system: dominant patterns, limiting factors, non-negotiable constraints, and risk signals.
              </p>
              <p className="text-stone-500 text-sm leading-relaxed">
                Everything that happens in coaching operates within the boundaries defined by the CFFS. No execution decision overrides it.
              </p>
            </div>
            <div className="border border-stone-200 rounded-2xl p-8">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-4">CFWS</p>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Coach-Facing Weekly Synthesis</h3>
              <p className="text-stone-500 text-base leading-relaxed mb-4">
                Generated weekly throughout active coaching. Observational, not interpretive. It captures how your system is responding to applied load in real time: changes in recovery, tolerance, regulation, and any emerging risks or patterns.
              </p>
              <p className="text-stone-500 text-sm leading-relaxed">
                The CFWS feeds back into the system as new data. It keeps the coaching picture current without overriding the foundational interpretation.
              </p>
            </div>
          </div>

          <h3 className="text-2xl font-extrabold text-[#1A1A1A] tracking-tight mb-6">Three body states. One continuous loop.</h3>
          <p className="text-stone-500 text-base leading-relaxed mb-10 max-w-2xl">
            The CFFS places every client into one of three body states. This determines everything about how coaching is structured: what training is appropriate, what recovery demands are real, and what goals are biologically viable right now.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                state: 'Remediation',
                colour: 'border-red-800/40',
                label: 'text-red-700',
                desc: 'The regulatory system is under stress. Before any training escalation, the system needs stabilising. Pushing harder here does not produce better results; it produces setbacks.',
              },
              {
                state: 'Optimisation',
                colour: 'border-amber-300/40',
                label: 'text-amber-700',
                desc: 'The system is stable and can be built upon. Training load can be progressively increased. Body composition goals become realistic and sustainable.',
              },
              {
                state: 'Post-Optimisation',
                colour: 'border-blue-200',
                label: 'text-[#1B6DFC]',
                desc: 'A long-arc performance phase. The system is resilient and capable of sustained high-level output. This is where the Body Recode™ approach produces its most complete expression.',
              },
            ].map((item) => (
              <div key={item.state} className={`border rounded-2xl p-7 ${item.colour}`}>
                <p className={`text-sm font-bold uppercase tracking-wider mb-4 ${item.label}`}>{item.state}</p>
                <p className="text-stone-500 text-base leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Four biological patterns */}
      <section className="bg-black py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase text-center mb-6">Who This Is For</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] text-center tracking-tight mb-6">
            Four biological patterns.<br />One system built around all of them.
          </h2>
          <p className="text-stone-500 text-lg leading-relaxed text-center max-w-2xl mx-auto mb-16">
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
              <div key={i} className="border border-stone-200 rounded-2xl p-7">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-base font-bold text-[#1A1A1A]">{item.label}</p>
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">{item.who}</span>
                </div>
                <p className="text-stone-500 text-base leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coach */}
      <section id="kade" className="bg-[#FFFFFF] py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-6">Your Coach</p>
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <img
                src="/kade.jpg"
                alt="Kade Dunstone, Performance Coach, Body Recode™"
                className="w-full rounded-2xl object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-3">Kade Dunstone</h2>
              <p className="text-sm text-stone-500 uppercase tracking-wider font-semibold mb-10">
                Performance Coach · Founder, Body Recode™
              </p>
              <div className="space-y-5 text-stone-600 text-base leading-relaxed">
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
                <p className="text-stone-700 font-medium">
                  Body Recode™ exists because of that experience. Not as a theory. As a system built from understanding what happens when biology stops responding to effort, and what actually has to change first.
                </p>
              </div>
              <p className="mt-10 text-sm text-stone-400 leading-relaxed">
                <a href="mailto:info@bodyrecode.au" className="text-[#1B6DFC] hover:underline">info@bodyrecode.au</a> · Also available face-to-face at <a href="https://www.anytimefitness.com/en-au/locations/newstead-queensland-au-1937" target="_blank" rel="noopener noreferrer" className="text-[#1B6DFC] hover:underline">Anytime Fitness Newstead</a>, Brisbane
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-black py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-14">Frequently asked questions</h2>
          <div className="space-y-8">
            {[
              { q: 'How does online coaching work?', a: 'Your full intake is completed online through a structured assessment. From there, your program is built and delivered through your client portal, which holds everything: your training program, nutrition guidelines, synthesis documents, weekly check-ins, and progress data. Coaching communication happens directly with Kade throughout.' },
              { q: 'What do I get access to as a client?', a: 'Every client gets a dedicated portal from day one. It contains your training program, nutrition guidelines, your Coach-Facing Foundational Synthesis (the complete biological read of your system), weekly check-in tracking, progress data, and coach notes. Everything is updated as you progress.' },
              { q: 'How is this different from generic online coaching?', a: 'Most online coaching sends a template program and checks in weekly. Body Recode™ begins with a full biological intake across eight domains before anything is prescribed. The program is built around your individual profile, not adjusted to fit a template. Weekly check-ins produce a synthesis document that is read and interpreted, not just filed.' },
              { q: 'Do I need a gym?', a: 'Your program is designed around your actual training environment. Whether you train at a gym or at home, the system is built around what you have access to and what your biology can currently handle.' },
              { q: 'How do I get started?', a: 'The starting point is the free Performance Check-In. It identifies the patterns currently showing up across your training, recovery, and how your body is responding to life load. No obligation. Just clarity.' },
              { q: 'Is the system the same as your face-to-face coaching?', a: 'Yes. The methodology, the intake process, the program design, and the weekly review system are identical. The only difference is delivery. Everything is structured to be just as effective remotely.' },
            ].map((item, i) => (
              <div key={i} className="border-b border-stone-200 pb-8">
                <h3 className="text-base font-bold text-[#1A1A1A] mb-3">{item.q}</h3>
                <p className="text-stone-500 text-base leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#FFFFFF] py-32 px-5 border-t border-stone-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-6">
            Start with the check-in.<br />
            <span className="text-[#1B6DFC]">It&apos;s free.</span>
          </h2>
          <p className="text-stone-500 text-lg leading-relaxed mb-12 max-w-xl mx-auto">
            A short performance check-in that identifies the patterns currently showing up across your training, recovery, and how your body is responding to life load. No obligation. No pressure. Just clarity.
          </p>
          <Link
            href="/performance-check-in"
            className="inline-block bg-[#1B6DFC] text-[#1A1A1A] font-bold px-10 py-5 rounded-full text-lg hover:bg-[#1056D6] transition-colors"
          >
            Start your free check-in →
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </>
  )
}
