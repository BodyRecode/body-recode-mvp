import type { Metadata } from 'next'
import { brand } from '@/config/tenant'

const TITLE = 'The Body Decode. Free.'
const DESC = "You're training. You're eating well. The fat won't move. The Body Decode reads your body first: your full read in about ten minutes, then five short lessons on what it means. Free."

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: {
    title: TITLE,
    description: DESC,
    url: `${brand().marketingDomain}/decode`,
    siteName: brand().name,
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC },
}

export default function DecodeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
