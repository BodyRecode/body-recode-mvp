import type { Metadata } from 'next'

// B-roll utility pages. Not linked publicly. Designed for screen recording
// to use as B-roll cutaway footage in the Body Recode explainer videos.
// noindex / nofollow across the whole namespace so search engines don't
// surface these.

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function BrollLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
