import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '6-Week Body Rewire Blueprint — Body Recode',
  description: 'A 6-week programme built around your biological pattern. Training, nutrition, and weekly education personalised to the hormone driving your results. $97.',
  openGraph: {
    title: '6-Week Body Rewire Blueprint',
    description: 'A 6-week programme built around your biological pattern. Training, nutrition, and weekly education personalised to the hormone driving your results.',
    url: 'https://app.bodyrecode.au/blueprint',
    siteName: 'Body Recode',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '6-Week Body Rewire Blueprint',
    description: 'A 6-week programme built around your biological pattern. Training, nutrition, and weekly education personalised to the hormone driving your results.',
  },
}

export default function BlueprintLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
