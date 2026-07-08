import type { Metadata } from 'next'
import { MARKETING_HTML } from './_marketing-html'

export const metadata: Metadata = {
  title: 'The Body Recode Collective',
  description: 'A collective of coaches practising to one standard. Your own branded coaching platform, powered by the Body Recode engine.',
}

// The approved Collective marketing design, ported from studiooften under Body
// Recode. Self-contained + scoped to .col so it renders inside the app layout
// without clashing. "Apply to join" CTAs point at /collective/apply.
export default function CollectivePage() {
  return <div dangerouslySetInnerHTML={{ __html: MARKETING_HTML }} />
}
