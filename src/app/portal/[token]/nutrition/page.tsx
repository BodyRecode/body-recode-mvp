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

  // is_active=true is the single source of truth for the current plan —
  // promote endpoint only flips is_active on demote, leaves status='active'
  // on previous plans. Filtering on status broke .maybeSingle() with multiple
  // matches and made Amanda's plan disappear on 2026-05-26.
  const { data: plan } = await admin
    .from('nutrition_plans')
    .select('id, plan_name, current_direction, last_review_at')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .maybeSingle()

  const firstName = client.name?.split(' ')[0] ?? 'there'

  const reviewedThisWeek = plan?.last_review_at
    ? (Date.now() - new Date(plan.last_review_at).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href={`/portal/${token}`} className="text-[#999999] hover:text-[#3A3A3A] text-sm transition-colors">← Back</Link>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mt-4 mb-1">Nutrition Check-In</h1>
          <p className="text-[#6B6B6B] text-sm">How did you go with your nutrition this week, {firstName}?</p>
        </div>

        {!plan ? (
          <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-6 text-center">
            <p className="text-[#999999] text-sm">No active nutrition plan yet. Your coach will set this up for you.</p>
          </div>
        ) : reviewedThisWeek ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#1B6DFC] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-[#1B6DFC] mb-1">Already submitted this week</p>
            <p className="text-[#6B6B6B] text-sm mb-6">Your nutrition check-in for this week has been received. Your coach will review it shortly.</p>
            <Link
              href={`/portal/${token}`}
              className="inline-block text-sm font-semibold text-black bg-[#1B6DFC] px-6 py-2.5 rounded-xl hover:bg-[#5390FF] transition-colors"
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
