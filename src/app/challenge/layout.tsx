import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '14-Day Body Decode Challenge — Free',
  description: 'A structured 14-day reset to lower biological noise, stabilise your energy, and let your body start responding again. Free. Instant access.',
  openGraph: {
    title: '14-Day Body Decode Challenge — Free',
    description: 'A structured 14-day reset to lower biological noise, stabilise your energy, and let your body start responding again.',
    url: 'https://app.bodyrecode.au/challenge',
    siteName: 'Body Recode',
    images: [
      {
        url: 'https://app.bodyrecode.au/og-challenge.png',
        width: 1200,
        height: 630,
        alt: '14-Day Body Decode Challenge',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '14-Day Body Decode Challenge — Free',
    description: 'A structured 14-day reset to lower biological noise, stabilise your energy, and let your body start responding again.',
    images: ['https://app.bodyrecode.au/og-challenge.png'],
  },
}

export default function ChallengeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
