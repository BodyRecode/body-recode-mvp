import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PortalPageShell from '../portal-page-shell'
import ProgramReviewForm from './program-review-form'

export default async function PortalProgramReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) return notFound()

  const { data: program } = await admin
    .from('programs')
    .select('id, block_name, current_direction, last_review_at')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .maybeSingle()

  const firstName = client.name?.split(' ')[0] ?? 'there'

  const reviewedThisWeek = program?.last_review_at
    ? (Date.now() - new Date(program.last_review_at).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false

  return (
    <PortalPageShell
      backHref={`/portal/${token}`}
      eyebrow="Training Check-In"
      title="Training check-in"
      description={<>How did your training go this week, {firstName}?</>}
    >
      {!program ? (
          <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-6 text-center">
            <p className="text-[#999999] text-sm">No active training program yet. Your coach will set this up for you.</p>
          </div>
        ) : reviewedThisWeek ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#1B6DFC] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-[#1B6DFC] mb-1">Already submitted this week</p>
            <p className="text-[#6B6B6B] text-sm mb-6">Your training check-in for this week has been received. Your coach will review it shortly.</p>
            <Link
              href={`/portal/${token}`}
              className="inline-block text-sm font-semibold text-black bg-[#1B6DFC] px-6 py-2.5 rounded-xl hover:bg-[#5390FF] transition-colors"
            >
              Back to portal
            </Link>
          </div>
      ) : (
        <ProgramReviewForm token={token} blockName={program.block_name} lastReviewAt={program.last_review_at} />
      )}
    </PortalPageShell>
  )
}
