import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingNav from '@/components/marketing/nav'
import MarketingFooter from '@/components/marketing/footer'
import { brand } from "@/config/tenant";

export const metadata: Metadata = {
  title: 'Online Personal Trainer | Body Recode™',
  description: 'Body Recode™ online personal training. A science-backed, biology-first coaching system built around your individual biology. 1:1, fully online, available worldwide.',
}

export default function OnlinePersonalTrainerPage() {
  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="bg-white pt-44 pb-28 px-5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-4">Online · 1:1 Personal Training</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] leading-tight tracking-tight mb-12">
            Online Personal Trainer
          </h1>
          <p className="text-xl text-stone-600 leading-relaxed max-w-2xl mb-12">
            {brand().name}™ is not standard personal training. It is a structured, biology-first coaching system that builds around how your body actually works, not a program written for the average person. Delivered 1:1, fully online.
                                </p>
          <Link
            href="/performance-check-in"
            className="inline-block bg-[#1B6DFC] text-white font-bold px-8 py-4 rounded-full text-base hover:bg-[#1056D6] transition-colors"
          >
            Start your free performance check-in
          </Link>
        </div>
      </section>

      {/* What's different */}
      <section className="bg-[#FFFFFF] py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-12">What makes this different from standard online personal training</h2>
          <p className="text-stone-600 text-lg leading-relaxed mb-4">
            A standard online personal trainer sends you a workout program and checks in weekly. That is a useful service, but it is missing something critical.
          </p>
          <p className="text-stone-600 text-lg leading-relaxed mb-4">
            It is missing the biological context. What body state are you in? How is your nervous system coping with total load from training, work, sleep, and stress combined? Is your body currently in a condition where the prescribed training can actually produce adaptation?
          </p>
          <p className="text-stone-600 text-lg leading-relaxed">
            Without this context, even a well-designed program can produce poor results or make things worse. {brand().name}™ builds this context first, then designs the program around it.
                                </p>
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-white py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-12">Standard online PT vs {brand().name}™</h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="border border-stone-200 rounded-xl p-6">
              <p className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">Standard Online Personal Training</p>
              <ul className="space-y-3">
                {[
                  'Program based on general fitness goals',
                  'Assessment focuses on movement and fitness levels',
                  'Adjustments made based on session feel',
                  'Volume and intensity follow standard progressions',
                  'Recovery is assumed, not assessed',
                  'One program for many different body types',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-base text-stone-500 leading-relaxed">
                    <span className="mt-1 w-1 h-1 rounded-full bg-stone-200 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-blue-200 rounded-xl p-6 bg-blue-50">
              <p className="text-sm font-bold text-[#1B6DFC] uppercase tracking-wider mb-4">{brand().name}™</p>
              <ul className="space-y-3">
                {[
                  'Program built on a complete biological assessment',
                  'Eight-domain intake establishes actual body state',
                  'Adjustments driven by weekly biological response data',
                  'Load calibrated to your real recovery capacity',
                  'Recovery is a primary training variable, tracked continuously',
                  'Individual program built for your biology specifically',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-base text-stone-600 leading-relaxed">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#1B6DFC] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Client portal */}
      <section className="bg-[#FFFFFF] py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-6">Client Portal</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-6">
            Everything your coaching needs.<br />In one place.
          </h2>
          <p className="text-stone-500 text-lg leading-relaxed max-w-2xl mb-12">
            Every client gets access to a dedicated portal from day one. Your program, your synthesis documents, your weekly check-ins, and your progress data, all in one place, updated continuously as you progress through coaching.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Training Program', desc: 'Your full program, structured by phase, built around your current biological profile.' },
              { title: 'Nutrition Guidelines', desc: 'Nutrition structure designed around your body state, not a generic plan.' },
              { title: 'Foundation Synthesis', desc: 'The complete biological read of your system. The document every decision is built around.' },
              { title: 'Weekly Check-Ins', desc: 'Structured weekly reporting that keeps your coaching calibrated to how your body is actually responding.' },
              { title: 'Progress Tracking', desc: 'Your data tracked over time, training responses, body changes, and coaching observations.' },
              { title: 'Coach Notes', desc: 'Adjustments and observations from your coach as you move through each phase.' },
            ].map((item, i) => (
              <div key={i} className="bg-stone-50 rounded-2xl p-6">
                <h3 className="text-base font-bold text-[#1A1A1A] mb-3">{item.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="bg-white py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-12">Who {brand().name}™ is for</h2>
          <p className="text-stone-600 text-lg leading-relaxed mb-12">
            {brand().name}™ is for people who are serious about understanding what is happening in their body and building results that actually last. If you are looking for a casual check-in and a generic program, this is not the right fit. If you want a precision coaching system built around your individual biology, it is.
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
              <div key={i} className="flex items-start gap-3 bg-stone-50 rounded-xl p-4">
                <div className="w-5 h-5 rounded-full bg-[#1B6DFC]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-[#1B6DFC]" />
                </div>
                <p className="text-stone-600 text-base leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#FFFFFF] py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-14">Frequently asked questions</h2>
          <div className="space-y-6">
            {[
              { q: 'Is Body Recode™ a personal trainer?', a: 'Kade Dunstone is a qualified personal trainer and performance coach. But Body Recode™ operates above the standard personal training model. It is a structured coaching system built on biological assessment and individual program design, not a generic fitness service.' },
              { q: 'How does the process start?', a: 'The process begins with the Performance Check-In and a full intake, which builds the biological picture. By the time coaching begins, your coach already knows your body state, your capacity, and exactly how the first phase should be structured.' },
              { q: 'How does online coaching actually work?', a: 'Everything is delivered through your dedicated client portal: your program, nutrition guidelines, synthesis documents, weekly check-ins, and progress data. Coaching communication is direct, 1:1 with Kade throughout the relationship.' },
              { q: 'How many sessions per week?', a: 'This depends on your body state and programming phase. Session frequency is not determined by a default package. It is determined by what your system can actually handle and benefit from.' },
              { q: 'Is the online system as effective as face-to-face coaching?', a: 'Yes. The methodology, intake process, program design, and weekly review system are identical. Everything is structured to be just as effective remotely. The only difference is delivery.' },
              { q: 'How do I start?', a: 'The free Performance Check-In is the entry point. It takes a few minutes, gives you a clear picture of where your body is right now, and determines whether Body Recode™ is the right approach for you.' },
            ].map((item, i) => (
              <div key={i} className="border-b border-stone-200 pb-6">
                <h3 className="text-base font-bold text-[#1A1A1A] mb-2">{item.q}</h3>
                <p className="text-stone-500 text-base leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-32 px-5 border-t border-stone-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-4">
            Ready to train differently?
          </h2>
          <p className="text-stone-500 text-lg leading-relaxed mb-12 max-w-xl mx-auto">
            The free Performance Check-In is the starting point. A few minutes that give you a real picture of where your body is and what approach will actually work for you.
          </p>
          <Link
            href="/performance-check-in"
            className="inline-block bg-[#1B6DFC] text-white font-bold px-8 py-4 rounded-full text-base hover:bg-[#1056D6] transition-colors"
          >
            Start your free check-in →
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </>
  )
}
