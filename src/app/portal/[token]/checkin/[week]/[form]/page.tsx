import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import PortalPageShell from '../../../portal-page-shell'
import { isCoachEmail } from '@/lib/coach-auth'

/**
 * Client-facing per-check-in page. Shows the coach's response (interpretation
 * + optional reframe + this week's focus) above the client's own answers.
 *
 * The coach response uses the same dark-card aesthetic as the FR/PR/NR
 * readings so the visual cue is "this is a structured read of your check-in",
 * not a casual message.
 */
export default async function PortalCheckinDetail({
  params,
}: {
  params: Promise<{ token: string; week: string; form: string }>
}) {
  const { token, week, form } = await params
  const formType = form.toUpperCase() as 'A' | 'B'
  const weekNumber = parseInt(week)

  if (!['A', 'B'].includes(formType) || isNaN(weekNumber)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) return notFound()

  // Wrong-account guard — mirrors the portal landing.
  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) {
    redirect(`/portal/${token}`)
  }

  const { data: checkin } = await admin
    .from('weekly_checkins')
    .select('id, week_number, form_type, submitted_at, responses')
    .eq('client_id', client.id)
    .eq('week_number', weekNumber)
    .eq('form_type', formType)
    .maybeSingle()

  if (!checkin) notFound()

  const { data: feedback } = await admin
    .from('weekly_checkin_feedback')
    .select('interpretation, reframe, next_focus, email_sent_at, updated_at')
    .eq('weekly_checkin_id', checkin.id)
    .maybeSingle()

  const submittedAt = new Date(checkin.submitted_at).toLocaleDateString('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const responses = (checkin.responses ?? {}) as Record<string, string>
  const answeredCount = Object.values(responses).filter(v => (v ?? '').toString().trim().length > 0).length

  return (
    <PortalPageShell
      backHref={`/portal/${token}/checkin-history`}
      backLabel="← All check-ins"
      eyebrow={`Week ${weekNumber} · Form ${formType}`}
      title="Your check-in"
      description={`Submitted ${submittedAt} · ${answeredCount} responses`}
    >
      {feedback ? (
          <div className="mb-10 rounded-2xl border border-blue-200 bg-[#FFFFFF] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5E5E5] flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#1B6DFC]">Body Recode read</p>
              {feedback.email_sent_at && (
                <p className="text-[10px] uppercase tracking-widest text-[#999999]">
                  Sent {new Date(feedback.email_sent_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </p>
              )}
            </div>
            <div className="px-5 py-5 space-y-5">
              <Section title="Interpretation" body={feedback.interpretation} />
              {feedback.reframe && <Section title="Reframe" body={feedback.reframe} />}
              <Section title="This week, hold this" body={feedback.next_focus} accent />
              <p className="text-sm text-[#3A3A3A] leading-relaxed border-t border-[#E5E5E5] pt-4">
                Kade will personally review your check-in and this response, and decide what, if anything, changes in your plan.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-10 rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#999999]">Body Recode read</p>
            <p className="mt-2 text-sm text-[#6B6B6B]">Your read for this check-in is not ready yet. You will receive an email when it is.</p>
          </div>
        )}

      <div className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] px-5 py-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#999999] mb-3">Your responses</p>
        <p className="text-sm text-[#6B6B6B] leading-relaxed">
          Your full {answeredCount}-response check-in is in your coach's view. If you want to see your own answers again, your coach can share them.
        </p>
      </div>
    </PortalPageShell>
  )
}

function Section({ title, body, accent }: { title: string; body: string; accent?: boolean }) {
  return (
    <div>
      <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${accent ? 'text-[#1B6DFC]' : 'text-[#6B6B6B]'}`}>{title}</p>
      <div className="text-sm text-[#3A3A3A] leading-relaxed space-y-3 whitespace-pre-wrap">{body}</div>
    </div>
  )
}
