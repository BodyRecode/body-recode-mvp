import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function PortalDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('*')
    .eq('portal_user_id', user!.id)
    .single()

  if (!client) return null

  const firstName = client.name.split(' ')[0]

  // Load tasks data
  const [{ data: intakeInvitation }, { data: baseline }, { data: recentCheckins }] = await Promise.all([
    admin.from('intake_invitations').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).single(),
    admin.from('baselines').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).single(),
    admin.from('weekly_checkins').select('week_number, form_type, submitted_at').eq('client_id', client.id).order('submitted_at', { ascending: false }).limit(5),
  ])

  // Determine current phase
  const agreementDone = !!client.agreement_accepted_at
  const healthDone = !!client.health_declaration_submitted_at
  const intakeDone = intakeInvitation?.status === 'complete'
  const baselineDone = !!baseline

  const tasks = [
    {
      id: 'agreement',
      title: 'Coaching Agreement',
      description: 'Review and accept your coaching agreement.',
      done: agreementDone,
      href: '/portal/agreement',
      available: true,
    },
    {
      id: 'health',
      title: 'Health Declaration',
      description: 'Complete your health declaration and readiness screening.',
      done: healthDone,
      href: '/portal/health-declaration',
      available: agreementDone,
    },
    {
      id: 'intake',
      title: 'Foundational Intake',
      description: 'Complete your foundational intake form.',
      done: intakeDone,
      href: intakeInvitation ? `/intake/${intakeInvitation.token}` : null,
      available: agreementDone && healthDone && !!intakeInvitation,
      locked: !intakeInvitation,
      lockedReason: 'Your coach will send this once your initial docs are complete.',
    },
    {
      id: 'baseline',
      title: 'Baseline Documentation',
      description: 'Submit your measurements and composition photos.',
      done: baselineDone,
      href: client.baseline_token ? `/baseline/${client.baseline_token}` : null,
      available: agreementDone && healthDone && !!intakeInvitation,
      locked: !client.baseline_token,
      lockedReason: 'Your coach will send this once your initial docs are complete.',
    },
  ]

  const completedTasks = tasks.filter(t => t.done).length
  const allOnboardingDone = agreementDone && healthDone && intakeDone && baselineDone

  // Determine phase label
  let phaseLabel = 'Onboarding'
  let phaseDesc = 'Complete your initial documentation to begin.'
  if (allOnboardingDone && !client.ieep_complete) {
    phaseLabel = 'Initial Exposure & Entry Phase'
    phaseDesc = 'Two-week calibration period. Weekly check-ins are active.'
  } else if (client.ieep_complete) {
    phaseLabel = 'Active Coaching'
    phaseDesc = 'Weekly cadence is live. Check-ins open Friday 6pm – Sunday 6pm.'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-lg mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-3">Body Recode™</p>
          <h1 className="text-2xl font-bold text-white">Welcome back, {firstName}.</h1>
        </div>

        {/* Phase */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 mb-6">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Current phase</p>
          <p className="text-white font-semibold text-base mb-1">{phaseLabel}</p>
          <p className="text-stone-400 text-sm">{phaseDesc}</p>
        </div>

        {/* Tasks / Onboarding */}
        {!allOnboardingDone && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider">Your tasks</h2>
              <span className="text-xs text-stone-500">{completedTasks} of {tasks.length} complete</span>
            </div>
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className={`bg-stone-900 border rounded-2xl p-5 ${task.done ? 'border-teal-400/20 opacity-60' : 'border-stone-800'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${task.done ? 'bg-teal-400' : 'border-2 border-stone-700'}`}>
                      {task.done && (
                        <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold mb-0.5 ${task.done ? 'text-stone-400 line-through' : 'text-white'}`}>{task.title}</p>
                      <p className="text-stone-500 text-xs leading-relaxed">
                        {task.locked ? task.lockedReason : task.description}
                      </p>
                      {!task.done && task.available && task.href && (
                        <Link
                          href={task.href}
                          className="inline-block mt-3 bg-teal-400 text-black text-xs font-bold px-4 py-2 rounded-xl hover:bg-teal-300 transition-colors"
                        >
                          Start →
                        </Link>
                      )}
                      {!task.done && task.locked && (
                        <span className="inline-block mt-3 text-xs text-stone-600">Waiting on coach</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Check-In */}
        {(client.ieep_complete || intakeDone) && client.checkin_token && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-3">Weekly check-in</h2>
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <p className="text-stone-400 text-sm mb-4">Check-in window opens Friday 6pm and closes Sunday 6pm Brisbane time.</p>
              <Link
                href={`/checkin/${client.checkin_token}`}
                className="inline-block bg-teal-400 text-black text-sm font-bold px-5 py-3 rounded-xl hover:bg-teal-300 transition-colors"
              >
                Go to check-in →
              </Link>
            </div>
          </div>
        )}

        {/* Recent Check-Ins */}
        {recentCheckins && recentCheckins.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-3">Recent check-ins</h2>
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <div className="space-y-2">
                {recentCheckins.map((ci, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-stone-300">Week {ci.week_number} · Form {ci.form_type}</span>
                    <span className="text-stone-600 text-xs">{new Date(ci.submitted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sign out */}
        <form action="/api/portal/signout" method="POST">
          <button type="submit" className="text-stone-600 text-xs hover:text-stone-400 transition-colors">Sign out</button>
        </form>

      </div>
    </div>
  )
}
