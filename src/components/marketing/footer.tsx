import Link from 'next/link'
import Image from 'next/image'

export default function MarketingFooter() {
  return (
    <footer className="bg-black border-t border-white/10 py-16 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">

          {/* Brand */}
          <div>
            <Image src="/logo-teal.png" alt="Body Recode" width={220} height={97} className="h-14 w-auto mb-6" />
            <p className="text-sm text-white/40 leading-relaxed">
              A biological interpretation system.<br />One interpretive engine. Five environments.
            </p>
          </div>

          {/* Environments */}
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-bold tracking-[0.15em] text-white/30 uppercase mb-1">Environments</p>
            <div className="flex items-center gap-2">
              <Link href="/performance-coaching" className="text-sm text-[#10E1C2] hover:text-white transition-colors font-semibold">
                Performance Coaching
              </Link>
              <span className="text-[9px] font-bold text-black bg-[#10E1C2] px-1.5 py-0.5 rounded-full uppercase tracking-wider">Live</span>
            </div>
            <span className="text-sm text-white/20 cursor-default">Executive Performance <span className="text-[10px] text-white/20 ml-1">In Development</span></span>
            <span className="text-sm text-white/20 cursor-default">Operational Performance <span className="text-[10px] text-white/20 ml-1">In Development</span></span>
            <span className="text-sm text-white/20 cursor-default">Clinical Integration <span className="text-[10px] text-white/20 ml-1">In Development</span></span>
            <span className="text-sm text-white/20 cursor-default">Developmental Performance <span className="text-[10px] text-white/20 ml-1">In Development</span></span>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-bold tracking-[0.15em] text-white/30 uppercase mb-1">Contact</p>
            <a href="mailto:info@bodyrecode.au" className="text-sm text-white/50 hover:text-white transition-colors">info@bodyrecode.au</a>
            <a href="https://performance-bodyrecode.vercel.app" className="text-sm text-white/30 hover:text-white/50 transition-colors mt-2">performance.bodyrecode.au →</a>
          </div>

        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">©2026 Body Recode™. All rights reserved.</p>
          <p className="text-xs text-white/30">www.bodyrecode.au</p>
        </div>
      </div>
    </footer>
  )
}
