import type { Metadata } from 'next'
import { brand } from "@/config/tenant";

export const metadata: Metadata = {
  title: "The 14-Day Body Decode. Free.",
  description: "You're training. You're eating clean. The fat won't move. The 14-Day Body Decode reads your body first. By Day 14 you know which of four patterns is holding it, and exactly what to do next. Free.",
  openGraph: {
    title: "The 14-Day Body Decode. Free.",
    description: "You're training. You're eating clean. The fat won't move. The 14-Day Body Decode reads your body first.",
    url: `${brand().marketingDomain}/challenge`,
    siteName: brand().name,
    type: 'website',
    // og image auto-generated from opengraph-image.tsx in this folder
  },
  twitter: {
    card: 'summary_large_image',
    title: "The 14-Day Body Decode. Free.",
    description: "You're training. You're eating clean. The fat won't move. The 14-Day Body Decode reads your body first.",
    // twitter image auto-generated from opengraph-image.tsx in this folder
  },
}

export default function ChallengeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
