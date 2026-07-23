import { redirect } from 'next/navigation'

// The weekly nutrition check-in has been folded into the single weekly
// check-in so clients have one thing to complete. Any old link or bookmark
// to the standalone nutrition check-in now lands on the unified check-in.
export default async function PortalNutritionReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  redirect(`/portal/${token}/checkin`)
}
