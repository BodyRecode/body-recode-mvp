import type { Metadata } from 'next'
import Link from 'next/link'
import { Source_Serif_4 } from 'next/font/google'

const serif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kade Dunstone',
  description: 'Three rebuilds. One constant. I never stopped building.',
}

export default function KadePage() {
  return (
    <div className={`${serif.className} min-h-screen bg-[#F3E9E1] text-[#2A1E16] flex flex-col items-center justify-center px-5 py-16`}>
      <div className="w-full max-w-sm">

        {/* Identity */}
        <div className="text-center mb-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kade.jpg"
            alt="Kade Dunstone"
            className="w-20 h-20 rounded-full object-cover object-top mx-auto mb-5 border border-[#E0D1C0]"
            style={{ objectPosition: '50% 20%' }}
          />
          <h1 className="text-2xl font-semibold text-[#2A1E16] mb-2 tracking-tight">Kade Dunstone</h1>
          <p className="text-sm text-[#2A1E16] leading-snug">
            Three rebuilds. One constant.
            <br />
            <em className="text-[#B5552F]">I never stopped building.</em>
          </p>
          <p className="text-xs text-[#6E5B4D] mt-3 tracking-wide italic">Performance coach. Father. Builder.</p>
        </div>

        {/* Clay rule */}
        <div className="w-12 h-px bg-[#B5552F] mx-auto mb-10" />

        {/* FEATURED SECTION — Scorecard (the front door to Challenge / Blueprint / Membership) */}
        <section className="mb-12">
          <div className="text-center mb-4">
            <p className="text-[10px] font-bold tracking-[0.3em] text-[#B5552F] uppercase">Featured · Body Recode</p>
          </div>

          <a
            href="https://bodyrecode.au/scorecard?intent=challenge&source=kade"
            className="group block w-full bg-[#2A1E16] hover:bg-[#3a2a1f] rounded-2xl px-7 py-8 transition-colors shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-bold tracking-[0.25em] text-[#E8B89A] uppercase">State Read · 2 min</span>
              <span className="text-[8px] font-bold tracking-[0.2em] text-[#2A1E16] uppercase bg-[#E8B89A] px-2 py-1 rounded">Free</span>
            </div>

            <h2 className="text-2xl font-semibold text-[#FAF3EB] mb-3 leading-tight tracking-tight">
              Find out which state your body is in.
            </h2>

            <p className="text-sm text-[#D8CDB5] italic leading-relaxed mb-5">
              The 2-minute Body State Scorecard reads where you are right now &mdash; Depleted, Transitioning, or Ready. Your result unlocks the right next step, including the free 14-Day Body Decode Challenge.
            </p>

            <div className="flex items-center gap-4 mb-6 pt-4 border-t border-[#5a4a3a]/40">
              <div className="flex items-center gap-1.5">
                <span className="text-[#B5552F] text-sm">●</span>
                <span className="text-xs text-[#D8CDB5]">2 minutes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#B5552F] text-sm">●</span>
                <span className="text-xs text-[#D8CDB5]">Free</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#B5552F] text-sm">●</span>
                <span className="text-xs text-[#D8CDB5]">No email until your result</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-[#B5552F] group-hover:bg-[#C9633A] text-[#FAF3EB] font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
              Take the Scorecard
              <span aria-hidden>→</span>
            </div>
          </a>
        </section>

        {/* Links — single clay accent across the whole stack */}
        <div className="space-y-3">

          {/* Studio of Ten */}
          <a
            href="https://studiooften.com"
            className="group flex items-center justify-between w-full bg-[#FAF3EB] border border-[#E0D1C0] hover:border-[#B5552F] hover:bg-[#EFE4D8] rounded-xl px-5 py-4 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-base font-semibold text-[#2A1E16] group-hover:text-[#B5552F] transition-colors">Studio of Ten</p>
                <span className="text-[9px] font-bold tracking-[0.15em] text-[#B5552F] uppercase">Launching soon</span>
              </div>
              <p className="text-xs text-[#6E5B4D] italic">Capped 10-client build studio for solo operators</p>
            </div>
            <span className="text-[#2A1E16] group-hover:text-[#B5552F] text-lg transition-colors" aria-hidden>→</span>
          </a>

          {/* Performance Coaching */}
          <a
            href="https://performance.bodyrecode.au"
            className="group flex items-center justify-between w-full bg-[#FAF3EB] border border-[#E0D1C0] hover:border-[#B5552F] hover:bg-[#EFE4D8] rounded-xl px-5 py-4 transition-colors"
          >
            <div>
              <p className="text-base font-semibold text-[#2A1E16] group-hover:text-[#B5552F] transition-colors">Performance Coaching</p>
              <p className="text-xs text-[#6E5B4D] mt-0.5 italic">1:1 coaching, online and in Brisbane</p>
            </div>
            <span className="text-[#2A1E16] group-hover:text-[#B5552F] text-lg transition-colors" aria-hidden>→</span>
          </a>

          {/* Body Recode Platform */}
          <a
            href="https://bodyrecode.au"
            className="group flex items-center justify-between w-full bg-[#FAF3EB] border border-[#E0D1C0] hover:border-[#B5552F] hover:bg-[#EFE4D8] rounded-xl px-5 py-4 transition-colors"
          >
            <div>
              <p className="text-base font-semibold text-[#2A1E16] group-hover:text-[#B5552F] transition-colors">Body Recode™</p>
              <p className="text-xs text-[#6E5B4D] mt-0.5 italic">The biological interpretation platform</p>
            </div>
            <span className="text-[#2A1E16] group-hover:text-[#B5552F] text-lg transition-colors" aria-hidden>→</span>
          </a>

          {/* AI Co-Founder Method */}
          <a
            href="https://aicofoundermethod.com"
            className="group flex items-center justify-between w-full bg-[#FAF3EB] border border-[#E0D1C0] hover:border-[#B5552F] hover:bg-[#EFE4D8] rounded-xl px-5 py-4 transition-colors"
          >
            <div>
              <p className="text-base font-semibold text-[#2A1E16] group-hover:text-[#B5552F] transition-colors">AI Co-Founder Method</p>
              <p className="text-xs text-[#6E5B4D] mt-0.5 italic">Build with AI as your co-founder</p>
            </div>
            <span className="text-[#2A1E16] group-hover:text-[#B5552F] text-lg transition-colors" aria-hidden>→</span>
          </a>

          {/* Tracing Myself — memoir */}
          <Link
            href="/kade/chapters"
            className="group flex items-center justify-between w-full bg-[#FAF3EB] border border-[#E0D1C0] hover:border-[#B5552F] hover:bg-[#EFE4D8] rounded-xl px-5 py-4 transition-colors"
          >
            <div>
              <p className="text-base font-semibold text-[#2A1E16] group-hover:text-[#B5552F] transition-colors">Tracing Myself</p>
              <p className="text-xs text-[#6E5B4D] mt-0.5 italic">A memoir, published as I write it</p>
            </div>
            <span className="text-[#2A1E16] group-hover:text-[#B5552F] text-lg transition-colors" aria-hidden>→</span>
          </Link>

          {/* Contact */}
          <a
            href="mailto:kade@bodyrecode.au"
            className="group flex items-center justify-between w-full bg-[#FAF3EB] border border-[#E0D1C0] hover:border-[#B5552F] hover:bg-[#EFE4D8] rounded-xl px-5 py-4 transition-colors"
          >
            <div>
              <p className="text-base font-semibold text-[#2A1E16] group-hover:text-[#B5552F] transition-colors">Get in touch</p>
              <p className="text-xs text-[#6E5B4D] mt-0.5 italic">kade@bodyrecode.au</p>
            </div>
            <span className="text-[#2A1E16] group-hover:text-[#B5552F] text-lg transition-colors" aria-hidden>→</span>
          </a>

        </div>

        {/* Footer — @kade_dunstone_ wordmark, no logo per personal brand spec */}
        <p className="text-center text-xs text-[#8A7565] mt-12 italic tracking-[0.15em]">@kade_dunstone_</p>
        <p className="text-center text-[10px] text-[#8A7565] mt-1 tracking-wide">bodyrecode.au/kade</p>
      </div>
    </div>
  )
}
