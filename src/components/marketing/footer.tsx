import Link from 'next/link'
import Image from 'next/image'

export default function MarketingFooter() {
  return (
    <footer className="bg-black border-t border-white/10 py-16 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div>
            <Image src="/logo-teal.png" alt="Body Recode" width={220} height={97} className="h-14 w-auto mb-6" />
            <p className="text-sm text-white/40 leading-relaxed">
              A biological interpretation system for high-functioning adults.<br /><br />
              Decode. Rewire. Rebuild.
            </p>
          </div>

          {/* The System */}
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-bold tracking-[0.15em] text-white/30 uppercase mb-1">The System</p>
            <div className="flex items-center gap-2">
              <Link href="/performance-coaching" className="text-sm text-[#10E1C2] hover:text-white transition-colors font-semibold">
                Performance Coaching
              </Link>
              <span className="text-[9px] font-bold text-black bg-[#10E1C2] px-1.5 py-0.5 rounded-full uppercase tracking-wider">Live</span>
            </div>
            <span className="text-sm text-white/20 cursor-default">Corporate Wellness <span className="text-[10px] text-white/20 ml-1">Coming soon</span></span>
            <span className="text-sm text-white/20 cursor-default">Military Readiness <span className="text-[10px] text-white/20 ml-1">Coming soon</span></span>
            <span className="text-sm text-white/20 cursor-default">Medical Integration <span className="text-[10px] text-white/20 ml-1">Coming soon</span></span>
            <span className="text-sm text-white/20 cursor-default">Education <span className="text-[10px] text-white/20 ml-1">Coming soon</span></span>
          </div>

          {/* Performance Coaching */}
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-bold tracking-[0.15em] text-white/30 uppercase mb-1">Performance Coaching</p>
            <p className="text-[10px] font-bold tracking-[0.12em] text-white/20 uppercase mt-1">Online 1:1</p>
            <Link href="/performance-coaching/online" className="text-sm text-white/50 hover:text-white transition-colors">Performance Coaching</Link>
            <Link href="/performance-coaching/strength/online" className="text-sm text-white/50 hover:text-white transition-colors">Strength Coaching</Link>
            <Link href="/performance-coaching/fat-loss/online" className="text-sm text-white/50 hover:text-white transition-colors">Fat Loss Coaching</Link>
            <Link href="/performance-coaching/personal-training/online" className="text-sm text-white/50 hover:text-white transition-colors">Personal Training</Link>
            <p className="text-[10px] font-bold tracking-[0.12em] text-white/20 uppercase mt-2">Brisbane · Face-to-Face</p>
            <Link href="/performance-coaching/brisbane" className="text-sm text-white/50 hover:text-white transition-colors">Performance Coaching</Link>
            <Link href="/performance-coaching/strength/brisbane" className="text-sm text-white/50 hover:text-white transition-colors">Strength Coaching</Link>
            <Link href="/performance-coaching/fat-loss/brisbane" className="text-sm text-white/50 hover:text-white transition-colors">Fat Loss Coaching</Link>
            <Link href="/performance-coaching/personal-training/brisbane" className="text-sm text-white/50 hover:text-white transition-colors">Personal Training</Link>
          </div>

          {/* Get Started */}
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-bold tracking-[0.15em] text-white/30 uppercase mb-1">Get Started</p>
            <Link href="/performance-check-in" className="text-sm text-[#10E1C2] hover:text-white transition-colors font-semibold">Free Performance Check-In</Link>
            <a href="mailto:info@bodyrecode.au" className="text-sm text-white/50 hover:text-white transition-colors">info@bodyrecode.au</a>
            <a href="https://www.anytimefitness.com/en-au/locations/newstead-queensland-au-1937" target="_blank" rel="noopener noreferrer" className="text-sm text-white/50 hover:text-white transition-colors">Anytime Fitness Newstead, Brisbane</a>
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
