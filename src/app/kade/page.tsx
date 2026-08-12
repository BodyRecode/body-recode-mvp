import type { Metadata } from 'next'
import Link from 'next/link'
import { brand, coach } from "@/config/tenant";
import { serif } from '@/app/fonts'

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

        {/* FEATURED SECTION — Challenge as hero product; scorecard now runs as the Day-0 in-portal gate */}
        <section className="mb-12">
          {/* Section eyebrow with Clay rules either side */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#B5552F]/30" />
            <p className="text-[10px] font-bold tracking-[0.3em] text-[#B5552F] uppercase whitespace-nowrap">Featured · {brand().name}</p>
            <div className="flex-1 h-px bg-[#B5552F]/30" />
          </div>

          <a
            href={`${brand().marketingDomain}/challenge?source=kade`}
            className="group block w-full rounded-2xl px-7 py-8 transition-all shadow-lg hover:shadow-xl overflow-hidden relative"
            style={{
              background: 'radial-gradient(circle at 20% 0%, #3a2a1f 0%, #2A1E16 55%, #1d130c 100%)',
            }}
          >
            {/* Subtle Clay glow top-right for depth */}
            <div
              aria-hidden
              className="absolute -top-20 -right-20 w-64 h-64 pointer-events-none opacity-40"
              style={{
                background: 'radial-gradient(circle, rgba(181, 85, 47, 0.35) 0%, transparent 60%)',
              }}
            />

            {/* Status row */}
            <div className="relative flex items-center justify-between mb-6">
              <span className="text-[9px] font-bold tracking-[0.25em] text-[#E8B89A] uppercase">14-Day Diagnostic</span>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.2em] text-[#2A1E16] uppercase bg-[#E8B89A] px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B5552F]" />
                Open Now
              </span>
            </div>

            {/* Title — bigger, more presence */}
            <h2 className="relative text-3xl font-semibold text-[#FAF3EB] mb-4 leading-[1.1] tracking-tight">
              The 14-Day Body Decode Challenge
            </h2>

            {/* Description */}
            <p className="relative text-[15px] text-[#D8CDB5] italic leading-relaxed mb-6">
              Fourteen days of daily structured input. Day 7 check-in. By Day 14 your Body Decode Report names your specific pattern &mdash; the one driving how your body has been responding.
            </p>

            {/* Value props — slightly larger, divided cleanly */}
            <div className="relative grid grid-cols-3 gap-3 mb-7 pt-5 border-t border-[#5a4a3a]/50">
              <div className="text-center">
                <p className="text-base font-semibold text-[#FAF3EB] mb-0.5">Free</p>
                <p className="text-[10px] text-[#8A7565] uppercase tracking-wider">No payment</p>
              </div>
              <div className="text-center border-x border-[#5a4a3a]/40">
                <p className="text-base font-semibold text-[#FAF3EB] mb-0.5">14 days</p>
                <p className="text-[10px] text-[#8A7565] uppercase tracking-wider">Daily portal</p>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-[#FAF3EB] mb-0.5">1 of 4</p>
                <p className="text-[10px] text-[#8A7565] uppercase tracking-wider">Pattern read</p>
              </div>
            </div>

            {/* How to start — numbered Clay circles for visual hierarchy */}
            <div className="relative mb-7">
              <p className="text-[9px] font-bold tracking-[0.25em] text-[#E8B89A] uppercase mb-4">How to start</p>
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#B5552F] text-[#FAF3EB] text-xs font-bold flex items-center justify-center mt-px">
                    1
                  </span>
                  <p className="text-[13px] text-[#D8CDB5] leading-relaxed">
                    <span className="text-[#FAF3EB] font-semibold">Join the free Challenge</span> &mdash; no payment, no card.
                  </p>
                </div>
                <div className="flex items-start gap-3.5">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#B5552F] text-[#FAF3EB] text-xs font-bold flex items-center justify-center mt-px">
                    2
                  </span>
                  <p className="text-[13px] text-[#D8CDB5] leading-relaxed">
                    On Day 0 in the portal, a <span className="text-[#FAF3EB] font-semibold">2-minute Body State Scorecard</span> reads your state and sets your path.
                  </p>
                </div>
              </div>
            </div>

            {/* Full-width CTA button — more presence, clearer click target */}
            <div className="relative flex items-center justify-center gap-2 bg-[#B5552F] group-hover:bg-[#C9633A] text-[#FAF3EB] font-semibold text-base px-5 py-3.5 rounded-lg transition-colors w-full text-center">
              Join the free Challenge
              <span aria-hidden className="text-lg transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </a>
        </section>

        {/* Links — single clay accent across the whole stack */}
        <div className="space-y-3">

          {/* The Collective */}
          <a
            href="https://bodyrecode.au/collective"
            className="group flex items-center justify-between w-full bg-[#FAF3EB] border border-[#E0D1C0] hover:border-[#B5552F] hover:bg-[#EFE4D8] rounded-xl px-5 py-4 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-base font-semibold text-[#2A1E16] group-hover:text-[#B5552F] transition-colors">The Collective</p>
                <span className="text-[9px] font-bold tracking-[0.15em] text-[#B5552F] uppercase">Launching soon</span>
              </div>
              <p className="text-xs text-[#6E5B4D] italic">Capped 10-client build studio for solo operators</p>
            </div>
            <span className="text-[#2A1E16] group-hover:text-[#B5552F] text-lg transition-colors" aria-hidden>→</span>
          </a>

          {/* Performance Coaching */}
          <a
            href={brand().performanceDomain}
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
            href={brand().marketingDomain}
            className="group flex items-center justify-between w-full bg-[#FAF3EB] border border-[#E0D1C0] hover:border-[#B5552F] hover:bg-[#EFE4D8] rounded-xl px-5 py-4 transition-colors"
          >
            <div>
              <p className="text-base font-semibold text-[#2A1E16] group-hover:text-[#B5552F] transition-colors">{brand().name}™</p>
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
            href={`mailto:${coach().email}`}
            className="group flex items-center justify-between w-full bg-[#FAF3EB] border border-[#E0D1C0] hover:border-[#B5552F] hover:bg-[#EFE4D8] rounded-xl px-5 py-4 transition-colors"
          >
            <div>
              <p className="text-base font-semibold text-[#2A1E16] group-hover:text-[#B5552F] transition-colors">Get in touch</p>
              <p className="text-xs text-[#6E5B4D] mt-0.5 italic">{coach().email}</p>
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
