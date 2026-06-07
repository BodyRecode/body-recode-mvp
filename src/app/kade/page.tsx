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

        {/* Links — single clay accent across the whole stack */}
        <div className="space-y-3">

          {/* Studio of Ten */}
          <a
            href="https://studiooften.com"
            className="group flex items-center justify-between w-full bg-[#FAF3EB] border border-[#E0D1C0] hover:border-[#B5552F] hover:bg-[#EFE4D8] rounded-xl px-5 py-4 transition-colors"
          >
            <div>
              <p className="text-base font-semibold text-[#2A1E16] group-hover:text-[#B5552F] transition-colors">Studio of Ten</p>
              <p className="text-xs text-[#6E5B4D] mt-0.5 italic">Capped 10-client build studio for solo operators</p>
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
