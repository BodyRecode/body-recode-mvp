import Image from 'next/image'

export default function MarketingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/5">
      <div className="max-w-6xl mx-auto px-5 h-24 flex items-center justify-between">
        <a href="/" className="cursor-pointer block">
          <Image src="/logo-teal.png" alt="Body Recode" width={220} height={97} className="h-16 w-auto" />
        </a>
        <div className="flex items-center gap-6">
          <a
            href="/scorecard"
            className="text-sm font-semibold text-[#10E1C2] hover:text-[#0ecfb3] transition-colors tracking-wide"
          >
            Take the Scorecard
          </a>
          <a
            href="mailto:info@bodyrecode.au"
            className="text-sm font-semibold text-white/50 hover:text-white transition-colors tracking-wide"
          >
            info@bodyrecode.au
          </a>
        </div>
      </div>
    </nav>
  )
}
