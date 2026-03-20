import Link from 'next/link'
import Image from 'next/image'

export default function MarketingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/5">
      <div className="max-w-6xl mx-auto px-5 h-24 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo-teal.png" alt="Body Recode" width={220} height={97} className="h-14 w-auto" />
        </Link>
        <Link
          href="/performance-check-in"
          className="text-sm font-bold bg-[#10E1C2] text-black px-5 py-2.5 rounded-full hover:bg-[#0ecfb2] transition-colors tracking-wide"
        >
          Free Check-In
        </Link>
      </div>
    </nav>
  )
}
