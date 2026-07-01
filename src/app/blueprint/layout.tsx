import type { Metadata } from 'next'
import { brand, products } from '@/config/tenant'

const t = brand()
const p = products()
const title = `The 6-Week Body Rewire. $${p.blueprintPrice}.`
const shortDesc = 'Knowing your pattern is not correcting it. The 6-Week Body Rewire is focused corrective work built specifically for your pattern.'

export const metadata: Metadata = {
  title,
  description: `${shortDesc} Training calibrated. Nutrition timed. Weekly coaching written for your pattern. By Week 6 the pattern is corrected and your body is ready to compound. $${p.blueprintPrice} AUD.`,
  openGraph: {
    title,
    description: shortDesc,
    url: `${t.marketingDomain}/blueprint`,
    siteName: t.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description: shortDesc,
  },
}

export default function BlueprintLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
