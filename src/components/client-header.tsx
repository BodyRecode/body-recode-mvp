'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import PortalSignOutButton from './portal-sign-out-button'

const WHATSAPP_NUMBER = '61400336284'

export default function ClientHeader() {
  const pathname = usePathname()
  const params = useParams()
  const token = typeof params?.token === 'string' ? params.token : null
  // Only link the logo home from /portal/[token]/* routes.
  // /baseline/[token] uses a different token (baseline_token, not onboarding_token)
  // so we don't link from there to avoid 404s.
  const isPortalRoute = pathname?.startsWith('/portal/') ?? false
  const homeHref = isPortalRoute && token ? `/portal/${token}` : null

  const logo = (
    <img
      src="https://bodyrecode.au/logo-teal.png"
      width="170"
      alt="Body Recode"
      style={{ display: 'block' }}
    />
  )

  return (
    <>
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#1c1917] px-5 py-4 flex items-center justify-between print:hidden">
        {homeHref ? (
          <Link href={homeHref} aria-label="Back to portal home" className="block">
            {logo}
          </Link>
        ) : (
          logo
        )}
        <PortalSignOutButton />
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-t border-[#1c1917] px-5 py-3 text-center print:hidden">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#57534e] hover:text-teal-400 transition-colors"
        >
          Questions? Message Kade on WhatsApp →
        </a>
      </div>
    </>
  )
}
