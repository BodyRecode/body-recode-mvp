import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "The Body Recode Membership. $49/week.",
  description: "You do the work. The results come. They never last. The Body Recode Membership is the infrastructure for the long arc. Block by block. Pattern continuity. A monthly Loom from Kade reading your check-in data. $49 per week. Cancel anytime.",
  openGraph: {
    title: "The Body Recode Membership. $49/week.",
    description: "You do the work. The results come. They never last. The Body Recode Membership is the infrastructure for the long arc.",
    url: 'https://bodyrecode.au/membership',
    siteName: 'Body Recode',
    type: 'website',
    // og image auto-generated from opengraph-image.tsx in this folder
  },
  twitter: {
    card: 'summary_large_image',
    title: "The Body Recode Membership. $49/week.",
    description: "You do the work. The results come. They never last. The Body Recode Membership is the infrastructure for the long arc.",
    // twitter image auto-generated from opengraph-image.tsx in this folder
  },
}

export default function MembershipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
