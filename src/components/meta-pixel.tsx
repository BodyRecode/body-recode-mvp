'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

/**
 * The Meta advertising pixel, kept off every page that belongs to a client.
 *
 * WHY (17 Sep 2026): the pixel sat in the root layout and fired a PageView on
 * every page in the application, which included the foundational intake, the
 * client portal, the blood upload, the weekly check-in and the daily lesson
 * pages. A pixel PageView sends the page address and the referring address to
 * Meta. Those addresses carry the client's private access token, and the fact
 * of the visit says a named person is filling in a health intake or opening
 * blood results. That is health-adjacent information going to an advertising
 * network, which is the one thing the privacy policy promises does not happen:
 * "They do NOT receive your assessment answers, your photos, your
 * measurements, or any other health information."
 *
 * The July 2026 data processors review called this out as the item to verify.
 * It was real.
 *
 * Marketing pages still carry the pixel, and the purchase trackers on the
 * payment success pages are untouched, so advertising measurement is intact.
 */

/** Anything under these paths belongs to a client, not to marketing. */
const CLIENT_AREA = [
  '/portal',
  '/intake',
  '/intake-supplement',
  '/checkin',
  '/par-q',
  '/report',
  '/program',
  '/dashboard',
  '/engine',
  '/funnel',
  '/decode/',     // /decode itself is the landing page; /decode/<token> is hers
  '/challenge/',
  '/blueprint/',
  '/membership/',
]

const META_PIXEL_ID = '972772552072010'

export default function MetaPixel() {
  const pathname = usePathname() ?? '/'
  const isClientArea = CLIENT_AREA.some(p =>
    p.endsWith('/') ? pathname.startsWith(p) : pathname === p || pathname.startsWith(`${p}/`),
  )
  if (isClientArea) return null

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
