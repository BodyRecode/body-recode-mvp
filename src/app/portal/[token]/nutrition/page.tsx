import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ClientHeader from '@/components/client-header'
import Link from 'next/link'
import NutritionReviewForm from './nutrition-review-form'

export default async function PortalNutritionReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) return notFound()

  const { data: plan } = await admin
    .from('nutrition_plans')
    .select('id, plan_name, current_direction, last_review_at')
    .eq('client_id', client.id)
    .eq('status', 'active')
    .maybeSingle()

  const firstName = client.name?.split(' ')[0] ?? 'there'

  const reviewedThisWeek = plan?.last_review_at
    ? (Date.now() - new Date(plan.last_review_at).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href={`/portal/${token}`} className="text-stone-500 hover:text-stone-300 text-sm transition-colors">← Back</Link>
          <h1 className="text-2xl font-bold text-white mt-4 mb-1">Nutrition Check-In</h1>
          <p className="text-stone-400 text-sm">How did you go with your nutrition this week, {firstName}?</p>
        </div>

        {!plan ? (
          <div className="rounded-2xl border border-stone-800 bg-stone-900 p-6 text-center">
            <p className="text-stone-500 text-sm">No active nutrition plan yet. Your coach will set this up for you.</p>
          </div>
        ) : reviewedThisWeek ? (
          <div className="rounded-2xl border border-teal-400/20 bg-teal-400/5 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-teal-400 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-teal-400 mb-1">Already submitted this week</p>
            <p className="text-stone-400 text-sm mb-6">Your nutrition check-in for this week has been received. Your coach will review it shortly.</p>
            <Link
              href={`/portal/${token}`}
              className="inline-block text-sm font-semibold text-black bg-teal-400 px-6 py-2.5 rounded-xl hover:bg-teal-300 transition-colors"
            >
              Back to portal
            </Link>
          </div>
        ) : (
          <NutritionReviewForm token={token} planName={plan.plan_name} lastReviewAt={plan.last_review_at} />
        )}
      </div>
    </div>
  )
}
