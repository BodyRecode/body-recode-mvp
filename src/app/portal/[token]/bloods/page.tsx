import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import PortalPageShell from '../portal-page-shell'
import { isCoachEmail } from '@/lib/coach-auth'
import { getGpRequestUrl } from '@/lib/gp-request'
import BloodUploadForm from './blood-upload-form'

/**
 * Client-facing Health Markers page. Always available: the client can upload a
 * copy of their blood test results at any time, and see the history of what
 * they have uploaded plus links to any published readings. The medical detail
 * (numbers, ranges) stays in the coach view; here the client sees status and
 * their published reading only.
 */
export default async function BloodsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email')
    .eq('onboarding_token', token)
    .maybeSingle()
  if (!client) return notFound()

  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) redirect(`/portal/${token}`)

  const { data: panels } = await admin
    .from('blood_panels')
    .select('id, status, submitted_at, collected_on, lab_name, reading_published_at')
    .eq('client_id', client.id)
    .order('submitted_at', { ascending: false })

  const list = panels ?? []

  // Gender-matched education guide. Lives on intakes, not clients. Hidden when
  // gender is unset or is neither male nor female — there is no appropriate
  // version to serve, and the guide page bounces direct URL hits anyway.
  const { data: genderIntake } = await admin
    .from('intakes')
    .select('gender')
    .eq('client_id', client.id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const guideGender = (genderIntake?.gender ?? '').toLowerCase()
  const showBloodworkGuide = guideGender === 'male' || guideGender === 'female'

  // Personal GP request list, if the coach has prepared one for this client.
  const gpRequestUrl = await getGpRequestUrl(admin, client.id)

  return (
    <PortalPageShell
      backHref={`/portal/${token}`}
      eyebrow="Health Markers"
      title="Your blood test results"
      description="If you have recent blood work, you can upload a copy here. Your coach reads it as one more signal alongside everything else, so your training and nutrition account for what is actually happening in your body. We are not your doctor: anything medical stays with your GP, and we will always point you back to them when that is the right call."
    >
      {(gpRequestUrl || showBloodworkGuide) && (
        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest text-[#999999] uppercase mb-3">Before you start</p>
          <div className="space-y-3">
            {gpRequestUrl && (
              <a
                href={gpRequestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-[#1B6DFC] bg-blue-50 p-5 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">Your blood test request — for your GP</p>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">A list of the markers to discuss, prepared for you. Opens as a PDF you can print or save — take it to your appointment.</p>
                  </div>
                  <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">Open →</span>
                </div>
              </a>
            )}
            {showBloodworkGuide && (
              <Link
                href={`/portal/${token}/guides/baseline-bloodwork`}
                className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#3A3A3A]">Understanding your baseline bloodwork</p>
                    <p className="text-xs text-[#999999] mt-0.5">What a comprehensive baseline panel covers and what each marker measures. Download the guide to keep.</p>
                  </div>
                  <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">View →</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5 mb-8">
          <p className="text-xs font-bold tracking-widest text-[#999999] uppercase mb-3">Upload results</p>
          <BloodUploadForm clientId={client.id} />
        </div>

        {list.length > 0 && (
          <div>
            <p className="text-xs font-bold tracking-widest text-[#999999] uppercase mb-3">Your uploads</p>
            <div className="space-y-3">
              {list.map(panel => {
                const dateLabel = panel.collected_on
                  ? new Date(panel.collected_on).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                  : new Date(panel.submitted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                const published = !!panel.reading_published_at
                return published ? (
                  <Link
                    key={panel.id}
                    href={`/portal/${token}/bloods/${panel.id}`}
                    className="block rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5 hover:border-[#1B6DFC]/40 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Blood panel · {dateLabel}</p>
                        <p className="text-xs text-[#6B6B6B] leading-relaxed">Your coach has written up what this means for your coaching.</p>
                      </div>
                      <span className="text-xs font-bold text-[#1B6DFC] ml-4 shrink-0">Read →</span>
                    </div>
                  </Link>
                ) : (
                  <div key={panel.id} className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF]/60 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#3A3A3A] mb-1">Blood panel · {dateLabel}</p>
                        <p className="text-xs text-[#999999] leading-relaxed">
                          {panel.status === 'failed'
                            ? 'We had trouble reading this file. Your coach has been notified and may ask for a clearer copy.'
                            : 'Received. Your coach is reviewing it. You will see their write-up here once it is ready.'}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#999999] ml-4 shrink-0">
                        {panel.status === 'failed' ? 'Needs a clearer copy' : 'In review'}
                      </span>
                    </div>
                  </div>
                )
            })}
          </div>
        </div>
      )}
    </PortalPageShell>
  )
}
