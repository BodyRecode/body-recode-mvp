import type { Metadata } from 'next'
import { brand } from '@/config/tenant'

const TITLE = 'The Body Decode. Free.'
const DESC = "A free assessment for women whose bodies have stopped responding. Two minutes of questions, then a written report naming which of four common causes is behind it, and the three things that shift it."

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
