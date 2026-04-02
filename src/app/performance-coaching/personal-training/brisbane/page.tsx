import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingNav from '@/components/marketing/nav'
import MarketingFooter from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'Personal Trainer Brisbane | Body Recode™',
  description: 'Looking for a personal trainer in Brisbane? Body Recode™ goes beyond standard personal training. A science-backed coaching system built around your biology. Based at Anytime Fitness Newstead.',
}

export default function PersonalTrainerBrisbanePage() {
  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="bg-black pt-44 pb-28 px-5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-4">Brisbane · Personal Training</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-12">
            Personal Trainer Brisbane
          </h1>
          <p className="text-xl text-white/60 leading-relaxed max-w-2xl mb-12">
            Body Recode™ is not standard personal training. It is a structured, biology-first coaching system that builds around how your body actually works, not a program written for the average person.
          </p>
          <Link
            href="/performance-check-in"
            className="inline-block bg-[#10E1C2] text-black font-bold px-8 py-4 rounded-full text-base hover:bg-[#0ecfb2] transition-colors"
          >
            Start your free performance check-in
          </Link>
        </div>
      </section>

      {/* What's different */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-12">What makes this different from standard personal training</h2>
          <p className="text-white/60 text-lg leading-relaxed mb-4">
            A standard personal trainer in Brisbane designs a workout program, coaches you through sessions, and adjusts based on how the sessions feel. That is a useful service, but it is missing something critical.
          </p>
          <p className="text-white/60 text-lg leading-relaxed mb-4">
            It is missing the biological context. What body state are you in? How is your nervous system coping with total load from training, work, sleep, and stress combined? Is your body currently in a condition where the prescribed training can actually produce adaptation?
          </p>
          <p className="text-white/60 text-lg leading-relaxed">
            Without this context, even a well-designed program can produce poor results or make things worse. Body Recode™ builds this context first, then designs the program around it.
          </p>
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-12">Standard PT vs Body Recode™</h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="border border-white/10 rounded-xl p-6">
              <p className="text-sm font-bold text-white/40 uppercase tracking-wider mb-4">Standard Personal Training</p>
              <ul className="space-y-3">
                {[
                  'Program based on general fitness goals',
                  'Assessment focuses on movement and fitness levels',
                  'Adjustments made based on session feel',
                  'Volume and intensity follow standard progressions',
                  'Recovery is assumed, not assessed',
                  'One program for many different body types',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-base text-white/40 leading-relaxed">
                    <span className="mt-1 w-1 h-1 rounded-full bg-white/20 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-[#10E1C2]/30 rounded-xl p-6 bg-[#10E1C2]/5">
              <p className="text-sm font-bold text-[#10E1C2] uppercase tracking-wider mb-4">Body Recode™</p>
              <ul className="space-y-3">
                {[
                  'Program built on a complete biological assessment',
                  'Eight-domain intake establishes actual body state',
                  'Adjustments driven by biological response data',
                  'Load calibrated to your real recovery capacity',
                  'Recovery is a primary training variable, tracked continuously',
                  'Individual program built for your biology specifically',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-base text-white/70 leading-relaxed">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#10E1C2] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-12">Who Body Recode™ is for</h2>
          <p className="text-white/60 text-lg leading-relaxed mb-12">
            Body Recode™ is for people who are serious about understanding what is happening in their body and building results that actually last. If you are looking for a casual gym session with general guidance, this is not the right fit. If you want a precision coaching system built around your individual biology, it is.
          </p>
          <div className="grid md:grid-cols-2 gap-10">
            {[
              'You\'ve been training for a while but results have stalled',
              'You feel like your body doesn\'t respond the way it should',
              'You have a demanding lifestyle and need coaching that accounts for real-world stress',
              'You want to build strength and improve body composition simultaneously',
              'You\'ve had injuries or setbacks that generic programs don\'t accommodate',
              'You want to understand your body, not just follow someone else\'s plan',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
                <div className="w-5 h-5 rounded-full bg-[#10E1C2]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-[#10E1C2]" />
                </div>
                <p className="text-white/70 text-base leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-12">Based in Newstead, Brisbane</h2>
          <p className="text-white/60 text-lg leading-relaxed mb-4">
            Body Recode™ operates exclusively at <a href="https://www.anytimefitness.com/en-au/locations/newstead-queensland-au-1937" target="_blank" rel="noopener noreferrer" className="text-[#10E1C2] hover:underline">Anytime Fitness Newstead</a>, Brisbane. All coaching is face-to-face and one-on-one. This is not a group fitness model or a high-volume gym environment. Availability is limited by design, because the system requires a level of attention that cannot be delivered at scale.
          </p>
          <p className="text-white/60 text-lg leading-relaxed mb-12">
            To find out if there is current availability and whether Body Recode™ is the right fit for you, start with the free Performance Check-In.
          </p>
          <div className="flex flex-wrap gap-6">
            <Link href="/performance-coaching/personal-training/online" className="text-[#10E1C2] text-sm font-semibold hover:underline">Online personal training →</Link>
            <Link href="/performance-coaching/brisbane" className="text-[#10E1C2] text-sm font-semibold hover:underline">Performance coaching →</Link>
            <Link href="/performance-coaching/strength/brisbane" className="text-[#10E1C2] text-sm font-semibold hover:underline">Strength coaching →</Link>
            <Link href="/performance-coaching/fat-loss/brisbane" className="text-[#10E1C2] text-sm font-semibold hover:underline">Fat loss coaching →</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#0a0a0a] py-32 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-14">Frequently asked questions</h2>
          <div className="space-y-6">
            {[
              { q: 'Is Body Recode™ a personal trainer?', a: 'Kade Dunstone is a qualified personal trainer and performance coach. But Body Recode™ operates above the standard personal training model. It is a structured coaching system built on biological assessment and individual program design, not a generic fitness service.' },
              { q: 'What does the first session look like?', a: 'The process begins before the first session. The Performance Check-In and full intake build the biological picture. By the time you walk into your first session, your coach already knows your body state, your capacity, and exactly how the first phase should be structured.' },
              { q: 'How many sessions per week?', a: 'This depends on your body state and programming phase. Session frequency is not determined by a default package. It is determined by what your system can actually handle and benefit from.' },
              { q: 'Do you offer online coaching?', a: 'Yes. Body Recode™ is available as fully online 1:1 coaching for clients anywhere in the world. The same system, the same intake process, the same program quality, delivered remotely through your dedicated client portal. Face-to-face coaching is also available at Anytime Fitness Newstead, Brisbane.' },
              { q: 'How do I start?', a: 'The free Performance Check-In is the entry point. It takes a few minutes, gives you a clear picture of where your body is right now, and determines whether Body Recode™ is the right approach for you.' },
            ].map((item, i) => (
              <div key={i} className="border-b border-white/10 pb-6">
                <h3 className="text-base font-bold text-white mb-2">{item.q}</h3>
                <p className="text-white/50 text-base leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black py-32 px-5 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            Ready to train differently?
          </h2>
          <p className="text-white/50 text-lg leading-relaxed mb-12 max-w-xl mx-auto">
            The free Performance Check-In is the starting point. A few minutes that give you a real picture of where your body is and what approach will actually work for you.
          </p>
          <Link
            href="/performance-check-in"
            className="inline-block bg-[#10E1C2] text-black font-bold px-8 py-4 rounded-full text-base hover:bg-[#0ecfb2] transition-colors"
          >
            Start your free check-in →
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </>
  )
}
