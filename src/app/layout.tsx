import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import "./globals.css";
import { brand, prefetchTenant } from "@/config/tenant";
import { geist } from "./fonts";

const t = brand();
export const metadata: Metadata = {
  metadataBase: new URL(t.marketingDomain),
  title: `${t.nameWithMark} | ${t.tagline}`,
  description: `${t.nameWithMark} is a biological interpretation system. One interpretive engine. Five environments. Licensable across performance coaching, executive, tactical, clinical and developmental contexts.`,
  other: {
    'facebook-domain-verification': '4krhdl24q7osiw8uhnvyf93htlv3nj',
  },
};

const META_PIXEL_ID = '972772552072010';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Warm the tenant config cache from x-tenant-id header (set by middleware).
  // No-op when NEXT_PUBLIC_TENANT_DB_ENABLED != 'true' (Phase 1 default).
  // Failure is silent — getTenant() falls back to hardcoded BODY_RECODE_TENANT.
  const h = await headers();
  const tenantId = h.get('x-tenant-id') ?? 'body-recode';
  await prefetchTenant(tenantId);

  return (
    <html lang="en" style={{ background: '#FFFFFF' }}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: 'html,body{background:#FFFFFF}' }} />
      </head>
      <body className={geist.className} style={{ background: '#FFFFFF' }}>
        {children}
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
      </body>
    </html>
  );
}
