import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LandingRoot, Nav, Footer } from '@/components/landing/kit'
import { logoUrl, brand } from '@/config/tenant'
import FoundingFlow from './founding-flow'

/**
 * The Strenn price test. Sent to warm audiences only, so it is kept out of search:
 * a stranger arriving from Google is not the woman the pass mark was set for.
 */
export const metadata: Metadata = {
  title: 'Your body has changed. Find out why. | Body Recode',
  description: 'Two minutes of questions, your readiness and likely pattern on screen straight away, and a first look at what Body Recode is building next.',
  robots: { index: false, follow: false },
}

export default function FoundingPage() {
  return (
    <LandingRoot>
      <Nav logo={logoUrl()} brandName={brand().name} />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '8px 24px 72px' }}>
        <Suspense fallback={null}>
          <FoundingFlow />
        </Suspense>
      </main>
      <Footer brandName={brand().name} supportEmail={brand().supportEmail} />
    </LandingRoot>
  )
}
