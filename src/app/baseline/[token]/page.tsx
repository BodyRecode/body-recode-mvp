import { createAdminClient } from '@/lib/supabase/admin'
import BaselineForm from './baseline-form'

export default async function BaselinePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, baseline_token, onboarding_token')
    .eq('baseline_token', token)
    .single()

  if (!client) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Link not found</h1>
          <p className="text-stone-500 text-sm">This baseline link is invalid or has expired. Please contact your coach.</p>
        </div>
      </div>
    )
  }

  // Check if baseline already submitted
  const { data: existing } = await admin
    .from('baselines')
    .select('id')
    .eq('client_id', client.id)
    .eq('re_capture_week', 1)
    .single()

  if (existing) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#1B6DFC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Baseline submitted</h1>
          <p className="text-[#999999] text-sm mb-7">Your baseline documentation has been received. Your coach will be in touch shortly.</p>
          {client.onboarding_token && (
            <a
              href={`/portal/${client.onboarding_token}`}
              className="inline-flex items-center gap-2 bg-[#1B6DFC] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#5390FF] transition-colors"
            >
              Back to your portal
            </a>
          )}
        </div>
      </div>
    )
  }

  // Carry height forward so it is captured once, not at every re-capture.
  const { data: heightRow } = await admin
    .from('baselines')
    .select('height_cm')
    .eq('client_id', client.id)
    .not('height_cm', 'is', null)
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const knownHeightCm: number | null = heightRow?.height_cm ?? null

  return (
    <BaselineForm
      clientId={client.id}
      clientName={client.name}
      portalHref={client.onboarding_token ? `/portal/${client.onboarding_token}` : null}
      knownHeightCm={knownHeightCm}
    />
  )
}
