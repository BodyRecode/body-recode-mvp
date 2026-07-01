import type { Metadata } from 'next'
import { brand, coach, products } from '@/config/tenant'

const t = brand()
const c = coach()
const p = products()
const title = `The ${p.membershipName}. $${p.membershipPrice}/week.`
const shortDesc = 'You do the work. The results come. They never last. The Body Recode Membership is the infrastructure for the long arc.'

export const metadata: Metadata = {
  title,
  description: `${shortDesc} Block by block. Pattern continuity. A monthly Loom from ${c.firstName} reading your check-in data. $${p.membershipPrice} per week. Cancel anytime.`,
  openGraph: {
    title,
    description: shortDesc,
    url: `${t.marketingDomain}/membership`,
    siteName: t.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description: shortDesc,
  },
}

export default function MembershipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
