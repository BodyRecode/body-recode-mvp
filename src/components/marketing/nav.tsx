import Link from 'next/link'
import Image from 'next/image'

export default function MarketingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/5">
      <div className="max-w-6xl mx-auto px-5 h-24 flex items-center justify-between">
        <Link href="/" className="cursor-pointer">
          <Image src="/logo-teal.png" alt="Body Recode" width={220} height={97} className="h-14 w-auto" />
        </Link>
        <a
          href="mailto:info@bodyrecode.au"
          className="text-sm font-semibold text-white/50 hover:text-white transition-colors tracking-wide"
        >
          info@bodyrecode.au
        </a>
      </div>
    </nav>
  )
}
