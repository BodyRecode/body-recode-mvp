'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import PortalSignOutButton from './portal-sign-out-button'

const WHATSAPP_NUMBER = '61400336284'

export default function ClientHeader({ homeHref: explicitHomeHref }: { homeHref?: string | null } = {}) {
  const pathname = usePathname()
  const params = useParams()
  const token = typeof params?.token === 'string' ? params.token : null
  // Default behaviour: link home only from /portal/[token]/* routes (those tokens are
  // onboarding_tokens). Pages on other tokens (e.g. /baseline/[baseline_token]) can
  // pass an explicit homeHref so the logo still links back to the portal.
  const isPortalRoute = pathname?.startsWith('/portal/') ?? false
  const defaultHomeHref = isPortalRoute && token ? `/portal/${token}` : null
  const homeHref = explicitHomeHref !== undefined ? explicitHomeHref : defaultHomeHref

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
