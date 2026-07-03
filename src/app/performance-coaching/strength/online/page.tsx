import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingNav from '@/components/marketing/nav'
import MarketingFooter from '@/components/marketing/footer'
import { brand } from "@/config/tenant";

export const metadata: Metadata = {
  title: 'Online Strength Coaching | Body Recode™',
  description: 'Body Recode™ online strength coaching. Biology-first 1:1 strength programs built around your individual biological profile, not a generic template. Available worldwide.',
}

export default function OnlineStrengthCoachingPage() {
  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="bg-white pt-44 pb-28 px-5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-4">Online · 1:1 Strength Coaching</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] leading-tight tracking-tight mb-12">
            Online Strength Coaching
          </h1>
          <p className="text-xl text-stone-600 leading-relaxed max-w-2xl mb-12">
            Building strength isn&apos;t just about lifting more weight. It&apos;s about creating the right biological conditions for your body to actually respond to training, and sustaining that over time. Delivered 1:1, fully online.
          </p>
          <Link
            href="/performance-check-in"
            className="inline-block bg-[#1B6DFC] text-white font-bold px-8 py-4 rounded-full text-base hover:bg-[#1056D6] transition-colors"
          >
            Start your free performance check-in
          </Link>
        </div>
      </section>

      {/* Why strength training fails */}
      <section className="bg-[#FFFFFF] py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-12">Why strength training often stops working</h2>
          <p className="text-stone-600 text-lg leading-relaxed mb-4">
            Most people who plateau in the gym aren&apos;t training wrong. They&apos;re training without understanding where their body actually is. Strength is a biological output. If the underlying system is under stress, under-recovered, or hormonally dysregulated, adding more volume or intensity will not produce better results. It will produce worse ones.
          </p>
          <p className="text-stone-600 text-lg leading-relaxed mb-4">
            Hard-working people who train consistently but make slow or no progress, because the training load doesn&apos;t match the body&apos;s actual capacity to adapt, is one of the most common patterns we see.
          </p>
          <p className="text-stone-600 text-lg leading-relaxed">
            {brand().name}™ starts by establishing what that capacity actually is, before any loading decisions are made.
                                </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-12">How online strength coaching works</h2>
          <p className="text-stone-600 text-lg leading-relaxed mb-12">
            Every client begins with a full biological intake. This is not a movement screen or a fitness test. It is a structured assessment of the eight domains that determine how your body responds to training load.
          </p>
          <div className="space-y-4 mb-12">
            {[
              { step: '01', title: 'Read your biology', body: 'Before any loading decisions are made, we establish what your body is actually doing across training history, stress load, sleep, recovery, hormonal patterns, and how your system is currently responding. Not a movement screen. A full biological read.' },
              { step: '02', title: 'Map your training history', body: 'What load has your body actually been exposed to? Perceived effort and actual adaptation are not the same thing. Your training history tells us where your neuromuscular system has been and where it can go.' },
              { step: '03', title: 'Design around your capacity', body: 'Volume, intensity, frequency, and exercise selection are all built around your individual profile. There is no template. The program exists to serve your biology.' },
              { step: '04', title: 'Monitor and adjust', body: 'Strength is not linear. Your body responds differently week to week depending on sleep, stress, and recovery. Weekly check-ins feed directly into your coaching so adjustments are made ahead of problems, not after.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-5 border border-stone-200 rounded-xl p-5">
                <p className="text-[11px] font-bold tracking-[0.15em] text-[#1B6DFC] uppercase shrink-0 mt-0.5">{item.step}</p>
                <div>
                  <p className="text-base font-bold text-[#1A1A1A] mb-1">{item.title}</p>
                  <p className="text-base text-stone-500 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Client portal */}
      <section className="bg-[#FFFFFF] py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-6">Client Portal</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-6">
            Your program, your data,<br />all in one place.
          </h2>
          <p className="text-stone-500 text-lg leading-relaxed max-w-2xl mb-12">
            Every client gets a dedicated portal from day one. Your training program, nutrition guidelines, synthesis documents, weekly check-ins, and progress data, all updated continuously as you move through coaching.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Training Program', desc: 'Your full program, structured by phase, built around your current biological profile and training capacity.' },
              { title: 'Weekly Check-Ins', desc: 'Structured weekly reporting that keeps your coaching current and ensures your program is always calibrated to how your body is actually responding.' },
              { title: 'Foundation Synthesis', desc: 'The complete biological read of your system from intake. The document every loading and recovery decision is built around.' },
              { title: 'Progress Tracking', desc: 'Your data tracked over time. Strength numbers, body responses, and coaching observations, all in one place.' },
            ].map((item, i) => (
              <div key={i} className="bg-stone-50 rounded-2xl p-6">
                <h3 className="text-base font-bold text-[#1A1A1A] mb-3">{item.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who this is for */}
      <section className="bg-white py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-12">Who online strength coaching is for</h2>
          <div className="grid md:grid-cols-2 gap-10 mb-12">
            {[
              'You want to build genuine, lasting strength, not just short-term numbers',
              'You\'ve been training but your strength has plateaued or regressed',
              'You feel beat up from training: always sore, tired, or under-recovered',
              'You\'ve never trained with a proper structure and want to do it right from the start',
              'You have a high-stress lifestyle and need a program that fits your actual recovery capacity',
              'You want to understand why your body responds the way it does',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-stone-50 rounded-xl p-4">
                <div className="w-5 h-5 rounded-full bg-[#1B6DFC]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-[#1B6DFC]" />
                </div>
                <p className="text-stone-600 text-base leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-6">
            <Link href="/performance-coaching/online" className="text-[#1B6DFC] text-sm font-semibold hover:underline">Online performance coaching →</Link>
            <Link href="/performance-coaching/fat-loss/online" className="text-[#1B6DFC] text-sm font-semibold hover:underline">Online fat loss coaching →</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#FFFFFF] py-32 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-14">Frequently asked questions</h2>
          <div className="space-y-6">
            {[
              { q: 'Do I need to be experienced to start?', a: 'No. Your current training history is assessed as part of the intake process. The program is built around where you are right now, not where you think you should be.' },
              { q: 'How is this different from a standard online strength program?', a: 'Most online programs are templates applied to everyone. Body Recode™ builds your program from a complete biological intake across eight domains. Volume, intensity, frequency, and exercise selection are all determined by your individual profile and body state.' },
              { q: 'What if I\'ve tried strength programs before and they haven\'t worked?', a: 'That is exactly the situation Body Recode™ is built for. Most programs fail because they don\'t account for the individual\'s actual biological state. The intake process exists to identify what has been working against your progress.' },
              { q: 'What do I need access to?', a: 'Your program is designed around your actual training environment. Whether you have access to a full gym or train at home, the system is structured accordingly.' },
              { q: 'How do I get started?', a: 'Start with the free Performance Check-In. It takes a few minutes and gives you a clear picture of where your body is right now.' },
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
            Find out where your strength actually is
          </h2>
          <p className="text-stone-500 text-lg leading-relaxed mb-12 max-w-xl mx-auto">
            The free Performance Check-In takes a few minutes and gives you a real picture of your current body state and what it means for how you should be training.
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
