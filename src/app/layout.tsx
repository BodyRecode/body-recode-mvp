import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://bodyrecode.au'),
  title: "Body Recode™",
  description: "Coach Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ background: '#0c0a09' }}>
      <body className={geist.className} style={{ background: '#0c0a09' }}>{children}</body>
    </html>
  );
}
