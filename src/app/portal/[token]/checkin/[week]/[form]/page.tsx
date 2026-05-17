import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ClientHeader from '@/components/client-header'

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
  if ((user.email ?? '').toLowerCase() !== (client.email ?? '').toLowerCase()) {
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
    <div className="min-h-screen bg-[#0c0a09] text-white">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href={`/portal/${token}/checkin-history`} className="text-[#57534e] hover:text-[#d4cfc9] text-sm transition-colors">← All check-ins</Link>
          <p className="text-[11px] font-bold tracking-widest text-[#14b8a6] uppercase mt-5 mb-2">Week {weekNumber} · Form {formType}</p>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Your check-in</h1>
          <p className="text-[#57534e] text-sm">Submitted {submittedAt} · {answeredCount} responses</p>
        </div>

        {feedback ? (
          <div className="mb-10 rounded-2xl border border-[#14b8a6]/30 bg-[#111110] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#1c1917] flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#14b8a6]">Coach response</p>
              {feedback.email_sent_at && (
                <p className="text-[10px] uppercase tracking-widest text-[#57534e]">
                  Sent {new Date(feedback.email_sent_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </p>
              )}
            </div>
            <div className="px-5 py-5 space-y-5">
              <Section title="Interpretation" body={feedback.interpretation} />
              {feedback.reframe && <Section title="Reframe" body={feedback.reframe} />}
              <Section title="This week, hold this" body={feedback.next_focus} accent />
            </div>
          </div>
        ) : (
          <div className="mb-10 rounded-2xl border border-[#1c1917] bg-[#111110] px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#57534e]">Coach response</p>
            <p className="mt-2 text-sm text-[#a8a29e]">Your coach has not responded to this check-in yet. You will receive an email when they do.</p>
          </div>
        )}

        <div className="rounded-2xl border border-[#1c1917] bg-[#111110] px-5 py-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#57534e] mb-3">Your responses</p>
          <p className="text-sm text-[#a8a29e] leading-relaxed">
            Your full {answeredCount}-response check-in is in your coach's view. If you want to see your own answers again, your coach can share them.
          </p>
        </div>

        <div className="h-10" />
      </div>
    </div>
  )
}

function Section({ title, body, accent }: { title: string; body: string; accent?: boolean }) {
  return (
    <div>
      <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${accent ? 'text-[#14b8a6]' : 'text-[#a8a29e]'}`}>{title}</p>
      <div className="text-sm text-[#d4cfc9] leading-relaxed space-y-3 whitespace-pre-wrap">{body}</div>
    </div>
  )
}
