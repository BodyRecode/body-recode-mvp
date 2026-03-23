import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingNav from '@/components/marketing/nav'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Before You Start | Body Recode™',
}

export default function NotASignUpPage() {
  return (
    <>
      <MarketingNav />

      <section className="bg-black min-h-screen flex items-center px-5 pt-20">
        <div className="max-w-xl mx-auto py-32">

          <p className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase mb-12"><a href="https://bodyrecode.au" className="text-[11px] font-bold tracking-[0.2em] text-[#10E1C2] uppercase">Body Recode™</a> Performance Coaching</p>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mb-12">
            Before you start, take a moment.
          </h1>

          <p className="text-white/60 text-lg leading-relaxed mb-2">You&apos;re about to complete a short check-in.</p>
          <p className="text-white/60 text-lg leading-relaxed mb-2">There&apos;s nothing to prepare for.</p>
          <p className="text-white/60 text-lg leading-relaxed mb-2">There are no right or wrong answers.</p>
          <p className="text-white/60 text-lg leading-relaxed mb-14">This isn&apos;t a test.</p>

          <div className="border-t border-white/10 pt-10 mb-14 space-y-8">
            <div>
              <h2 className="text-base font-bold text-white mb-3">What this is</h2>
              <p className="text-white/50 text-base leading-relaxed mb-2">A brief, private snapshot of how things are sitting for you right now.</p>
              <p className="text-white/50 text-base leading-relaxed">It looks at how training has been feeling, how well you&apos;re recovering, and how stress and life load may be interacting. The aim is clarity, not evaluation.</p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white mb-3">What this isn&apos;t</h2>
              <ul className="space-y-1">
                {['An assessment', 'A diagnosis', 'An application', 'A commitment to coaching'].map((item, i) => (
                  <li key={i} className="text-white/40 text-base leading-relaxed">— {item}</li>
                ))}
              </ul>
              <p className="text-white/40 text-base leading-relaxed mt-3">Nothing happens unless you choose it.</p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white mb-3">How to answer</h2>
              <p className="text-white/50 text-base leading-relaxed mb-2">Answer based on what&apos;s true right now. Not what you think you should be doing. Not what you want to be doing later.</p>
              <p className="text-white/50 text-base leading-relaxed">Honest answers make the reflection more useful.</p>
            </div>

            <div>
              <h2 className="text-base font-bold text-white mb-3">What happens after</h2>
              <p className="text-white/50 text-base leading-relaxed mb-2">Once you complete the check-in, you can continue on with your day.</p>
              <p className="text-white/50 text-base leading-relaxed mb-2">A short summary reflecting your current patterns will be sent to you by email. There&apos;s no requirement to act on it.</p>
              <p className="text-white/50 text-base leading-relaxed">Some people read it and leave it there. Others notice things they&apos;d like to understand more deeply. If you choose to explore further, the email will include an optional link. That decision is entirely yours.</p>
            </div>
          </div>

          <Link
            href="/performance-check-in-quiz"
            className="inline-block bg-[#10E1C2] text-black font-bold px-10 py-5 rounded-full text-base hover:bg-[#0ecfb2] transition-colors"
          >
            Begin the performance check-in
          </Link>

          <p className="text-white/20 text-xs mt-4">About 3–5 minutes.</p>
        </div>
      </section>
    </>
  )
}
