import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { brand, prefetchTenant } from "@/config/tenant";
import { geist } from "./fonts";
import MetaPixel from "@/components/meta-pixel";

const t = brand();
export const metadata: Metadata = {
  metadataBase: new URL(t.marketingDomain),
  title: `${t.nameWithMark} | ${t.tagline}`,
  description: `${t.nameWithMark} is a biological interpretation system. One interpretive engine. Five environments. Licensable across performance coaching, executive, tactical, clinical and developmental contexts.`,
  other: {
    'facebook-domain-verification': '4krhdl24q7osiw8uhnvyf93htlv3nj',
  },
};

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
        <MetaPixel />
      </body>
    </html>
  );
}
