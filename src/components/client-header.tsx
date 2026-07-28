'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import PortalSignOutButton from './portal-sign-out-button'
import { brand, coach } from '@/config/tenant'

export default function ClientHeader({ homeHref: explicitHomeHref }: { homeHref?: string | null } = {}) {
  const pathname = usePathname()
  const params = useParams()
  const token = typeof params?.token === 'string' ? params.token : null
  const t = brand()
  const c = coach()
  // Default behaviour: link home only from /portal/[token]/* routes (those tokens are
  // onboarding_tokens). Pages on other tokens (e.g. /baseline/[baseline_token]) can
  // pass an explicit homeHref so the logo still links back to the portal.
  const isPortalRoute = pathname?.startsWith('/portal/') ?? false
  const defaultHomeHref = isPortalRoute && token ? `/portal/${token}` : null
  const homeHref = explicitHomeHref !== undefined ? explicitHomeHref : defaultHomeHref

  const logo = (
    <img
      src={`${t.marketingDomain}${t.logoUrlLight}`}
      width="170"
      alt={t.name}
      style={{ display: 'block' }}
    />
  )

  return (
    <>
      <div className="sticky top-0 z-10 bg-[#FFFFFF]/95 backdrop-blur-sm border-b border-[#ECEEF2] px-5 py-4 flex items-center justify-between print:hidden">
        {homeHref ? (
          <Link href={homeHref} aria-label="Back to portal home" className="block">
            {logo}
          </Link>
        ) : (
          logo
        )}
        <PortalSignOutButton />
      </div>
      {/* Persistent contact bar — the only always-visible "how do I reach you"
          affordance in the portal, so inside the portal it points at the portal
          thread. Client contact stays on the record: attached to their file,
          answerable from the coach inbox, and legible months later.

          Pre-portal routes (e.g. /baseline/[token]) have no thread to send to,
          so those keep the WhatsApp fallback. */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-[#FFFFFF]/95 backdrop-blur-sm border-t border-[#ECEEF2] px-5 py-3 text-center print:hidden">
        {isPortalRoute && token ? (
          <Link
            href={`/portal/${token}/message`}
            className="text-xs text-[#999999] hover:text-[#1B6DFC] transition-colors"
          >
            Questions? <span className="font-semibold text-[#1B6DFC]">Message {c.firstName} →</span>
          </Link>
        ) : (
          <a
            href={`https://wa.me/${c.whatsAppNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#999999] hover:text-blue-500 transition-colors"
          >
            Questions? Message {c.firstName} on WhatsApp →
          </a>
        )}
      </div>
    </>
  )
}
