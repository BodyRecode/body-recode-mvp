'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import PortalSignOutButton from './portal-sign-out-button'
import { brand, coach } from '@/config/tenant'
import { BrandMark } from '@/components/brand-mark'

export default function ClientHeader({
  homeHref: explicitHomeHref,
  coachFirstName,
}: {
  homeHref?: string | null
  /**
   * The client's OWN coach. "Message Kade" sat at the bottom of every page of
   * every portal, including a pilot coach's, because this read the global
   * config. A client being told to message a stranger is the loudest version
   * of the same fault as the read being signed by one. 25 Sep 2026.
   */
  coachFirstName?: string
} = {}) {
  const pathname = usePathname()
  const params = useParams()
  const token = typeof params?.token === 'string' ? params.token : null
  const t = brand()
  const c = coach()
  const coachName = coachFirstName ?? c.firstName
  // Default behaviour: link home only from /portal/[token]/* routes (those tokens are
  // onboarding_tokens). Pages on other tokens (e.g. /baseline/[baseline_token]) can
  // pass an explicit homeHref so the logo still links back to the portal.
  const isPortalRoute = pathname?.startsWith('/portal/') ?? false
  const defaultHomeHref = isPortalRoute && token ? `/portal/${token}` : null
  const homeHref = explicitHomeHref !== undefined ? explicitHomeHref : defaultHomeHref

  // THE RETIRED MARK WAS ON EVERY PAGE OF THE PORTAL, not just the sign-in: a
  // remote image of the old helix with "decode, rewire, rebuild" under it, a
  // tagline that stopped being the positioning months ago. It was also a
  // network request to another domain on every single page load, for a logo.
  // The drawn mark is local and is the same one the rest of the product uses.
  // 23 Sep 2026.
  const logo = <BrandMark tone="dark" size="sm" name={t.name} />

  return (
    <>
      <div className="sticky top-0 z-10 bg-[#FFFFFF]/95 backdrop-blur-sm border-b border-[#E4E4E0] px-5 py-4 flex items-center justify-between print:hidden">
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
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-[#FFFFFF]/95 backdrop-blur-sm border-t border-[#E4E4E0] px-5 py-3 text-center print:hidden">
        {isPortalRoute && token ? (
          <Link
            href={`/portal/${token}/message`}
            className="text-[12.5px] text-[#6E747D] hover:text-[#0F1115] transition-colors"
          >
            Questions? <span className="font-semibold text-[#0F1115]">Message {coachName} →</span>
          </Link>
        ) : (
          <a
            href={`https://wa.me/${c.whatsAppNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12.5px] text-[#6E747D] hover:text-[#0F1115] transition-colors"
          >
            Questions? Message {coachName} on WhatsApp →
          </a>
        )}
      </div>
    </>
  )
}
