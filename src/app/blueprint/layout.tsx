import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '6-Week Body Rewire Blueprint — $97',
  description: 'A structured 6-week programme built around your biological pattern. Phase 1: Regulate. Phase 2: Adapt. Phase 3: Embed.',
  openGraph: {
    title: '6-Week Body Rewire Blueprint',
    description: 'A structured 6-week programme built around your biological pattern.',
    url: 'https://app.bodyrecode.au/blueprint',
    siteName: 'Body Recode',
    type: 'website',
  },
}

export default function BlueprintLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
