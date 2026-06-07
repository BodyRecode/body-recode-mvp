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
  description: 'Performance coach. Builder. Father.',
}

export default function KadePage() {
  return (
    <div className={`${serif.className} min-h-screen bg-[#F5EFE4] text-[#2A2520] flex flex-col items-center justify-center px-5 py-16`}>
      <div className="w-full max-w-sm">

        {/* Identity */}
        <div className="text-center mb-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kade.jpg"
            alt="Kade Dunstone"
            className="w-20 h-20 rounded-full object-cover object-top mx-auto mb-5 border border-[#D8CDB5]"
            style={{ objectPosition: '50% 20%' }}
          />
          <h1 className="text-2xl font-semibold text-[#2A2520] mb-1 tracking-tight">Kade Dunstone</h1>
          <p className="text-sm text-[#6B6056] italic">Performance coach. Builder. Father.</p>
          <p className="text-xs text-[#857968] mt-2 tracking-wide italic">Three rebuilds. Still building.</p>
        </div>

        {/* Links — single warm-ink accent across the whole stack */}
        <div className="space-y-3">

          {/* Studio of Ten */}
          <a
            href="https://studiooften.com"
            className="group flex items-center justify-between w-full bg-[#FBF6EC] border border-[#D8CDB5] hover:border-[#2A2520] hover:bg-[#F2EAD8] rounded-xl px-5 py-4 transition-colors"
          >
            <div>
              <p className="text-base font-semibold text-[#2A2520]">Studio of Ten</p>
              <p className="text-xs text-[#6B6056] mt-0.5 italic">Capped 10-client build studio for solo operators</p>
            </div>
            <span className="text-[#2A2520] text-lg" aria-hidden>→</span>
          </a>

          {/* Performance Coaching */}
          <a
            href="https://performance.bodyrecode.au"
            className="group flex items-center justify-between w-full bg-[#FBF6EC] border border-[#D8CDB5] hover:border-[#2A2520] hover:bg-[#F2EAD8] rounded-xl px-5 py-4 transition-colors"
          >
            <div>
              <p className="text-base font-semibold text-[#2A2520]">Performance Coaching</p>
              <p className="text-xs text-[#6B6056] mt-0.5 italic">1:1 coaching, online and in Brisbane</p>
            </div>
            <span className="text-[#2A2520] text-lg" aria-hidden>→</span>
          </a>

          {/* Body Recode Platform */}
          <a
            href="https://bodyrecode.au"
            className="group flex items-center justify-between w-full bg-[#FBF6EC] border border-[#D8CDB5] hover:border-[#2A2520] hover:bg-[#F2EAD8] rounded-xl px-5 py-4 transition-colors"
          >
            <div>
              <p className="text-base font-semibold text-[#2A2520]">Body Recode™</p>
              <p className="text-xs text-[#6B6056] mt-0.5 italic">The biological interpretation platform</p>
            </div>
            <span className="text-[#2A2520] text-lg" aria-hidden>→</span>
          </a>

          {/* AI Co-Founder Method */}
          <a
            href="https://aicofoundermethod.com"
            className="group flex items-center justify-between w-full bg-[#FBF6EC] border border-[#D8CDB5] hover:border-[#2A2520] hover:bg-[#F2EAD8] rounded-xl px-5 py-4 transition-colors"
          >
            <div>
              <p className="text-base font-semibold text-[#2A2520]">AI Co-Founder Method</p>
              <p className="text-xs text-[#6B6056] mt-0.5 italic">Build with AI as your co-founder</p>
            </div>
            <span className="text-[#2A2520] text-lg" aria-hidden>→</span>
          </a>

          {/* Tracing Myself — memoir */}
          <Link
            href="/kade/chapters"
            className="group flex items-center justify-between w-full bg-[#FBF6EC] border border-[#D8CDB5] hover:border-[#2A2520] hover:bg-[#F2EAD8] rounded-xl px-5 py-4 transition-colors"
          >
            <div>
              <p className="text-base font-semibold text-[#2A2520]">Tracing Myself</p>
              <p className="text-xs text-[#6B6056] mt-0.5 italic">A memoir, published as I write it</p>
            </div>
            <span className="text-[#2A2520] text-lg" aria-hidden>→</span>
          </Link>

          {/* Contact */}
          <a
            href="mailto:kade@bodyrecode.au"
            className="group flex items-center justify-between w-full bg-[#FBF6EC] border border-[#D8CDB5] hover:border-[#2A2520] hover:bg-[#F2EAD8] rounded-xl px-5 py-4 transition-colors"
          >
            <div>
              <p className="text-base font-semibold text-[#2A2520]">Get in touch</p>
              <p className="text-xs text-[#6B6056] mt-0.5 italic">kade@bodyrecode.au</p>
            </div>
            <span className="text-[#2A2520] text-lg" aria-hidden>→</span>
          </a>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#857968] mt-12 italic tracking-wide">bodyrecode.au/kade</p>
      </div>
    </div>
  )
}
