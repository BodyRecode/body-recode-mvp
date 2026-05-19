import type { Metadata } from 'next'

// B-roll utility pages. Not linked publicly. Designed for screen recording
// to use as B-roll cutaway footage in the Body Recode explainer videos.
// noindex / nofollow across the whole namespace so search engines don't
// surface these. Per-page opengraph-image.tsx files override the root OG
// image so shared URLs show the correct canvas preview.

export const metadata: Metadata = {
  title: 'B-Roll Canvas · Body Recode',
  description: 'Internal production canvas. Used for screen recording footage in Body Recode explainer videos. Not for public distribution.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    title: 'B-Roll Canvas · Body Recode',
    description: 'Internal production canvas. Used for screen recording footage in Body Recode explainer videos.',
    siteName: 'Body Recode',
    type: 'website',
    // og image overridden per-page via opengraph-image.tsx in each subfolder
  },
  twitter: {
    card: 'summary_large_image',
    title: 'B-Roll Canvas · Body Recode',
    description: 'Internal production canvas. Used for screen recording footage in Body Recode explainer videos.',
  },
}

export default function BrollLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
