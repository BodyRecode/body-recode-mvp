import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('*, baselines(id), intake_invitations(status), weekly_checkins(week_number, form_type, submitted_at)')
    .eq('onboarding_token', token)
    .single()

  if (!client) return notFound()

  const firstName = client.name?.split(' ')[0] ?? 'there'
  const agreementDone = !!client.agreement_accepted_at
  const healthDone = !!client.health_declaration_submitted_at
  const intakeDone = Array.isArray(client.intake_invitations) && client.intake_invitations.some((i: { status: string }) => i.status === 'complete')
  const baselineDone = Array.isArray(client.baselines) && client.baselines.length > 0
  const clearanceRequired = !!client.medical_clearance_required
  const clearanceReceived = !!client.medical_clearance_received_at
  const clearanceBlocking = clearanceRequired && !clearanceReceived

  const tasks = [
    {
      id: 'agreement',
      title: 'Coaching Agreement',
      description: 'Review and sign your coaching agreement before we begin.',
      done: agreementDone,
      href: `/portal/${token}/agreement`,
      available: true,
      notice: null,
    },
    {
      id: 'health',
      title: 'Health Declaration',
      description: 'Complete your health and readiness screening.',
      done: healthDone,
      href: `/portal/${token}/health-declaration`,
      available: agreementDone,
      notice: null,
    },
    ...(clearanceRequired ? [{
      id: 'clearance',
      title: 'Medical Clearance',
      description: 'Download the clearance form, take it to your GP, and upload the completed form here.',
      done: clearanceReceived,
      href: clearanceReceived ? null : `/portal/${token}/medical-clearance`,
      available: healthDone,
      notice: null,
    }] : []),
    {
      id: 'intake',
      title: 'Foundational Intake',
      description: 'Complete your full intake — this informs your entire coaching structure.',
      done: intakeDone,
      href: client.intake_token ? `/intake/${client.intake_token}` : null,
      available: healthDone && !clearanceBlocking,
      notice: clearanceBlocking ? 'Unlocks once medical clearance is received.' : null,
    },
    {
      id: 'baseline',
      title: 'Baseline Documentation',
      description: 'Submit your baseline measurements and progress photos.',
      done: baselineDone,
      href: client.baseline_token ? `/baseline/${client.baseline_token}` : null,
      available: healthDone,
    },
  ]

  const allOnboardingDone = agreementDone && healthDone && intakeDone && baselineDone && !clearanceBlocking

  const recentCheckins = Array.isArray(client.weekly_checkins)
    ? [...client.weekly_checkins].sort((a: { submitted_at: string }, b: { submitted_at: string }) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()).slice(0, 3)
    : []

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-3">Body Recode™</p>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome, {firstName}</h1>
          <p className="text-stone-400 text-sm">Your coaching portal — everything in one place.</p>
        </div>

        {/* Onboarding tasks */}
        {!allOnboardingDone && (
          <div className="mb-10">
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Getting started</p>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-2xl border p-4 transition-colors ${
                    task.done
                      ? 'border-teal-400/20 bg-teal-400/5'
                      : task.available
                      ? 'border-stone-700 bg-stone-900 hover:border-stone-600'
                      : 'border-stone-800 bg-stone-900/50 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center ${task.done ? 'bg-teal-400' : 'border-2 border-stone-600'}`}>
                      {task.done && (
                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold mb-0.5 ${task.done ? 'text-teal-400' : 'text-white'}`}>{task.title}</p>
                      <p className="text-xs text-stone-500">{task.description}</p>
                      {!task.done && task.notice && (
                        <p className="mt-2 text-xs text-amber-400/80">{task.notice}</p>
                      )}
                      {!task.done && task.available && task.href && !task.notice && (
                        <Link
                          href={task.href}
                          className="inline-block mt-3 text-xs font-bold text-black bg-teal-400 px-4 py-2 rounded-xl hover:bg-teal-300 transition-colors"
                        >
                          Start →
                        </Link>
                      )}
                      {!task.done && task.available && !task.href && !task.notice && (
                        <p className="mt-2 text-xs text-stone-600">Your coach will send this link when ready.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active coaching */}
        {allOnboardingDone && client.coaching_started_at && (
          <div className="mb-10">
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Weekly check-in</p>
            {client.checkin_token ? (
              <Link
                href={`/checkin/${client.checkin_token}`}
                className="block rounded-2xl border border-teal-400/30 bg-teal-400/5 p-5 hover:border-teal-400/50 transition-colors"
              >
                <p className="text-sm font-semibold text-white mb-1">Submit this week's check-in</p>
                <p className="text-xs text-stone-400">Track your progress and keep your coach informed.</p>
              </Link>
            ) : (
              <p className="text-sm text-stone-500">Your check-in link will appear here once coaching begins.</p>
            )}
          </div>
        )}

        {/* Recent check-ins */}
        {recentCheckins.length > 0 && (
          <div className="mb-10">
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Recent check-ins</p>
            <div className="space-y-2">
              {recentCheckins.map((c: { week_number: number; form_type: string; submitted_at: string }, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-stone-900 px-4 py-3">
                  <div>
                    <p className="text-sm text-white font-medium">Week {c.week_number} — Form {c.form_type}</p>
                  </div>
                  <p className="text-xs text-stone-500">{new Date(c.submitted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Client guide */}
        <div className="mb-10">
          <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Resources</p>
          <a
            href="https://klotlednmxhywimztozm.supabase.co/storage/v1/object/public/public-assets/client-guide.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full bg-stone-900 border border-stone-800 rounded-2xl px-5 py-4 hover:border-stone-700 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-white">Active Coaching Client Guide</p>
              <p className="text-xs text-stone-500 mt-0.5">Your reference for the coaching process — view or download</p>
            </div>
            <svg className="w-5 h-5 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Footer */}
        <p className="text-xs text-stone-700 text-center">Questions? Message Kade on WhatsApp.</p>
      </div>
    </div>
  )
}
