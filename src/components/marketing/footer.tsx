import Link from 'next/link'
import Image from 'next/image'

export default function MarketingFooter() {
  return (
    <footer className="bg-black border-t border-white/10 py-12 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
          <div>
            <Image src="/logo-teal.png" alt="Body Recode" width={220} height={97} className="h-14 w-auto mb-6" />
            <p className="text-sm text-white/40 max-w-xs leading-relaxed">
              Decode. Rewire. Rebuild.<br />
              Online 1:1 · Face-to-face in Brisbane.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-bold tracking-[0.15em] text-white/30 uppercase mb-1">Online Coaching</p>
            <Link href="/online-performance-coaching" className="text-sm text-white/50 hover:text-white transition-colors">Performance Coaching</Link>
            <Link href="/online-strength-coaching" className="text-sm text-white/50 hover:text-white transition-colors">Strength Coaching</Link>
            <Link href="/online-fat-loss-coaching" className="text-sm text-white/50 hover:text-white transition-colors">Fat Loss Coaching</Link>
            <Link href="/online-personal-trainer" className="text-sm text-white/50 hover:text-white transition-colors">Personal Training</Link>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-bold tracking-[0.15em] text-white/30 uppercase mb-1">Brisbane · Face-to-Face</p>
            <Link href="/performance-coach-brisbane" className="text-sm text-white/50 hover:text-white transition-colors">Performance Coaching</Link>
            <Link href="/strength-coach-brisbane" className="text-sm text-white/50 hover:text-white transition-colors">Strength Coaching</Link>
            <Link href="/fat-loss-coach-brisbane" className="text-sm text-white/50 hover:text-white transition-colors">Fat Loss Coaching</Link>
            <Link href="/personal-trainer-brisbane" className="text-sm text-white/50 hover:text-white transition-colors">Personal Training</Link>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-bold tracking-[0.15em] text-white/30 uppercase mb-1">Get Started</p>
            <Link href="/performance-check-in" className="text-sm text-[#10E1C2] hover:text-white transition-colors">Free Performance Check-In</Link>
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
