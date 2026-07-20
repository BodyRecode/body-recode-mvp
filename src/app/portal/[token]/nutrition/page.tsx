import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PortalPageShell from '../portal-page-shell'
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
    <PortalPageShell
      backHref={`/portal/${token}`}
      eyebrow="Nutrition Check-In"
      title="Nutrition check-in"
      description={<>How did you go with your nutrition this week, {firstName}?</>}
    >
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
    </PortalPageShell>
  )
}
