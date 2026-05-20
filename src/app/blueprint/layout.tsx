import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "The 6-Week Body Rewire. $97.",
  description: "Knowing your pattern is not correcting it. The 6-Week Body Rewire is focused corrective work built specifically for your pattern. Training calibrated. Nutrition timed. Weekly coaching written for your pattern. By Week 6 the pattern is corrected and your body is ready to compound. $97 AUD.",
  openGraph: {
    title: "The 6-Week Body Rewire. $97.",
    description: "Knowing your pattern is not correcting it. The 6-Week Body Rewire is focused corrective work built specifically for your pattern.",
    url: 'https://bodyrecode.au/blueprint',
    siteName: 'Body Recode',
    type: 'website',
    // og image auto-generated from opengraph-image.tsx in this folder
  },
  twitter: {
    card: 'summary_large_image',
    title: "The 6-Week Body Rewire. $97.",
    description: "Knowing your pattern is not correcting it. The 6-Week Body Rewire is focused corrective work built specifically for your pattern.",
    // twitter image auto-generated from opengraph-image.tsx in this folder
  },
}

export default function BlueprintLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
