import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingNav from '@/components/marketing/nav'
import MarketingFooter from '@/components/marketing/footer'
import { brand } from "@/config/tenant";

export const metadata: Metadata = {
  title: 'Free Performance Check-In | Body Recode™',
  description: 'The Body Recode™ Performance Check-In is a short reflective tool that identifies how your training, recovery, and life load are currently interacting. Takes 3–5 minutes.',
}

export default function PerformanceCheckInPage() {
  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="bg-white pt-44 pb-28 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-4"><a href={brand().marketingDomain} className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase">{brand().name}™</a> Performance Coaching</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] leading-tight tracking-tight mb-12">
            Performance Check-In
          </h1>
          <p className="text-xl text-stone-600 leading-relaxed max-w-2xl mx-auto mb-14">
            A short, structured snapshot of how things are sitting for you right now, across training, recovery, and how life load is interacting with both.
          </p>
          <Link
            href="/not-a-sign-up"
            className="inline-block bg-[#1B6DFC] text-white font-bold px-10 py-5 rounded-full text-lg hover:bg-[#1056D6] transition-colors"
          >
            Begin the check-in
          </Link>
          <p className="text-stone-400 text-sm mt-4">About 3–5 minutes. No right or wrong answers.</p>
        </div>
      </section>

      {/* What it is */}
      <section className="bg-[#FFFFFF] py-28 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-xl font-extrabold text-[#1A1A1A] tracking-tight mb-5">What this is</h2>
            <div className="space-y-4">
              {[
                'A brief, private snapshot of how things are sitting for you right now',
                'A look at how training has been feeling, how well you\'re recovering, and how stress and life load may be interacting',
                'A clarity-building instrument, not an evaluation',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#1B6DFC]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#1B6DFC]" />
                  </div>
                  <p className="text-stone-600 text-base leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#1A1A1A] tracking-tight mb-5">What this isn&apos;t</h2>
            <div className="space-y-4">
              {[
                'An assessment or fitness test',
                'A diagnosis or readiness score',
                'An application or commitment to coaching',
                'A promise of results or a personalised plan',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-stone-200" />
                  </div>
                  <p className="text-stone-500 text-base leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What happens after */}
      <section className="bg-white py-28 px-5 border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-12">What happens after</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Continue with your day', body: 'Once you complete the check-in, there\'s nothing further required. You can continue on without taking any further action.' },
              { step: '02', title: 'Receive your report', body: 'A short written report will be sent to you by email, reflecting the patterns currently showing up across your training, recovery, and consistency.' },
              { step: '03', title: 'Decide what to do with it', body: 'Some people read it and leave it there. Others notice things they\'d like to understand more deeply. If you choose to explore further, the email will include an optional link. That decision is entirely yours.' },
            ].map((item) => (
              <div key={item.step} className="border border-stone-200 rounded-2xl p-6">
                <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-3">{item.step}</p>
                <h3 className="text-base font-bold text-[#1A1A1A] mb-2">{item.title}</h3>
                <p className="text-stone-500 text-base leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to answer */}
      <section className="bg-[#FFFFFF] py-28 px-5 border-t border-stone-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-12">How to answer</h2>
          <p className="text-stone-600 text-lg leading-relaxed mb-4">
            Answer based on what&apos;s true right now. Not what you think you should be doing. Not what you want to be doing later.
          </p>
          <p className="text-stone-600 text-lg leading-relaxed mb-4">
            There are no right or wrong answers. The aim is self-reflection, not performance. Honest answers make the report more useful.
          </p>
          <p className="text-stone-500 text-lg leading-relaxed">
            Nothing happens unless you choose it.
          </p>
        </div>
      </section>

      {/* Why it exists */}
      <section className="bg-white py-28 px-5 border-t border-stone-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-12">Why it exists</h2>
          <p className="text-stone-600 text-lg leading-relaxed mb-4">
            Most coaching escalates when progress slows. {brand().name}™ interprets first.
                                </p>
          <p className="text-stone-600 text-lg leading-relaxed mb-4">
            The Performance Check-In was built around that distinction. It identifies how effort, recovery, external load, and consistency are currently interacting, before any coaching conversation begins. It creates clarity before prescription.
          </p>
          <p className="text-stone-600 text-lg leading-relaxed">
            It replaces urgency-driven hooks with self-reflection. Authority comes from restraint, not pressure.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#FFFFFF] py-28 px-5 border-t border-stone-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-4">
            When you&apos;re ready
          </h2>
          <p className="text-stone-500 text-lg leading-relaxed mb-12 max-w-xl mx-auto">
            Begin when it suits you. There&apos;s nothing to prepare for.
          </p>
          <Link
            href="/not-a-sign-up"
            className="inline-block bg-[#1B6DFC] text-white font-bold px-10 py-5 rounded-full text-lg hover:bg-[#1056D6] transition-colors"
          >
            Begin the check-in →
          </Link>
          <p className="text-stone-400 text-sm mt-4">About 3–5 minutes. No account required.</p>
        </div>
      </section>

      <MarketingFooter />
    </>
  )
}
