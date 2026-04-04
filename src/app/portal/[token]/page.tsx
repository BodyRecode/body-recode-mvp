import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCheckInWindowStatus, getWeekNumber } from '@/lib/weekly-checkin-questions'
import ClientHeader from '@/components/client-header'

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('*, baselines(id), intake_invitations(status), weekly_checkins(week_number, form_type, submitted_at)')
    .eq('onboarding_token', token)
    .ilike('email', user.email!)
    .single()

  const { data: activeNutritionPlan } = await admin
    .from('nutrition_plans')
    .select('id, plan_name, last_review_at')
    .eq('client_id', client?.id ?? '')
    .eq('status', 'active')
    .maybeSingle()

  const { data: activeProgram } = await admin
    .from('programs')
    .select('id, block_name, last_review_at')
    .eq('client_id', client?.id ?? '')
    .eq('is_active', true)
    .maybeSingle()

  const { data: latestProgramReview } = await admin
    .from('program_reviews')
    .select('coach_notes, direction, reviewed_at')
    .eq('client_id', client?.id ?? '')
    .not('coach_notes', 'is', null)
    .order('reviewed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: latestNutritionReview } = await admin
    .from('nutrition_reviews')
    .select('coach_notes, reviewed_at')
    .eq('client_id', client?.id ?? '')
    .not('coach_notes', 'is', null)
    .order('reviewed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

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
      description: 'Complete your full intake. This informs your entire coaching structure.',
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

  const now = Date.now()
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  const programReviewedThisWeek = activeProgram?.last_review_at
    ? (now - new Date(activeProgram.last_review_at).getTime()) < sevenDays
    : false
  const nutritionReviewedThisWeek = activeNutritionPlan?.last_review_at
    ? (now - new Date(activeNutritionPlan.last_review_at).getTime()) < sevenDays
    : false

  const checkinWindow = getCheckInWindowStatus()
  const testMode = process.env.CHECKIN_TEST_MODE?.trim().toLowerCase() === 'true'
  const windowOpen = checkinWindow.isOpen || testMode
  const startDate = client.coaching_started_at || client.created_at
  const weekNumber = startDate ? getWeekNumber(startDate) : null

  const thisWeekFormADone = weekNumber && Array.isArray(client.weekly_checkins)
    ? !!client.weekly_checkins.find((c: { week_number: number; form_type: string }) => c.week_number === weekNumber && c.form_type === 'A')
    : false
  const thisWeekFormBDone = weekNumber && Array.isArray(client.weekly_checkins)
    ? !!client.weekly_checkins.find((c: { week_number: number; form_type: string }) => c.week_number === weekNumber && c.form_type === 'B')
    : false

  // In test mode, both forms need to be submitted before showing "done"
  // In normal mode, only the current window's form matters
  const checkinDoneThisWeek = testMode
    ? (thisWeekFormADone && thisWeekFormBDone)
    : (checkinWindow.formType === 'A' ? thisWeekFormADone : thisWeekFormBDone)

  // Determine which form to show next in test mode
  const activeFormType: 'A' | 'B' = testMode && checkinWindow.formType === 'A' && thisWeekFormADone && !thisWeekFormBDone
    ? 'B'
    : testMode && checkinWindow.formType === 'B' && thisWeekFormBDone && !thisWeekFormADone
    ? 'A'
    : checkinWindow.formType

  const opensAt = checkinWindow.opensAt.toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const closesAt = checkinWindow.closesAt.toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  // Is it Sunday? (closing day — show urgency)
  const nowDate = new Date()
  const brisbaneDay = new Date(nowDate.getTime() + 10 * 60 * 60 * 1000).getUTCDay()
  const isClosingDay = brisbaneDay === 0 // Sunday

  // Did client miss last week's check-in? Window closed and no submission for current week
  const missedCheckin = !windowOpen && !checkinDoneThisWeek && weekNumber && weekNumber > 1

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome, {firstName}</h1>
          <p className="text-stone-400 text-sm">Your coaching portal, everything in one place.</p>
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

        {/* Weekly check-in task */}
        {allOnboardingDone && client.coaching_started_at && (
          <div className="mb-10">
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">This week</p>
            {checkinDoneThisWeek ? (
              <div className="rounded-2xl border border-teal-400/20 bg-teal-400/5 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-teal-400">Check-in submitted</p>
                    <p className="text-xs text-stone-500 mt-0.5">Week {weekNumber}, your coach will review shortly.</p>
                  </div>
                </div>
              </div>
            ) : windowOpen ? (
              <Link
                href={`/portal/${token}/checkin`}
                className={`block rounded-2xl border p-5 transition-colors ${isClosingDay ? 'border-amber-500/50 bg-amber-500/5 hover:border-amber-400/60' : 'border-stone-700 bg-stone-900 hover:border-teal-400/40 hover:bg-teal-400/5'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">Weekly check-in, Form {activeFormType}</p>
                    {isClosingDay ? (
                      <p className="text-xs text-amber-400 font-medium">Closes today at 6:30pm Brisbane time. Do it now.</p>
                    ) : (
                      <p className="text-xs text-stone-400">Week {weekNumber} · Closes {closesAt}.</p>
                    )}
                  </div>
                  <span className={`text-xs font-bold ml-4 ${isClosingDay ? 'text-amber-400' : 'text-teal-400'}`}>Start →</span>
                </div>
              </Link>
            ) : missedCheckin ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-red-800/50 bg-red-950/20 p-5">
                  <p className="text-sm font-semibold text-red-400 mb-1">You missed last week&apos;s check-in</p>
                  <p className="text-xs text-red-400/70">The window closed without a submission. Your coach won&apos;t have data for this week.</p>
                </div>
                <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4">
                  <p className="text-xs text-stone-600">Next window opens {opensAt}.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-5">
                <p className="text-sm font-semibold text-stone-500 mb-1">Check-in window closed</p>
                <p className="text-xs text-stone-600">Opens {opensAt} every Friday.</p>
              </div>
            )}
          </div>
        )}

        {/* Training */}
        {allOnboardingDone && activeProgram && (
          <div className="mb-10">
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Training</p>
            <div className="space-y-3">
              {programReviewedThisWeek ? (
                <div className="rounded-2xl border border-teal-400/20 bg-teal-400/5 p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-teal-400">Training check-in submitted</p>
                      <p className="text-xs text-stone-500 mt-0.5">Reviewed {new Date(activeProgram.last_review_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} — your coach will review shortly.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href={`/portal/${token}/training`}
                  className="block rounded-2xl border border-stone-700 bg-stone-900 p-5 hover:border-teal-400/40 hover:bg-teal-400/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">Weekly training check-in</p>
                      <p className="text-xs text-stone-400">How did your sessions go this week?</p>
                    </div>
                    <span className="text-xs font-bold text-teal-400 ml-4">Start →</span>
                  </div>
                </Link>
              )}
              <Link
                href={`/portal/${token}/program`}
                className="block rounded-2xl border border-stone-800 bg-stone-900/50 p-4 hover:border-stone-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-300">View your program</p>
                    <p className="text-xs text-stone-600 mt-0.5">{activeProgram.block_name}</p>
                  </div>
                  <span className="text-xs text-stone-500 ml-4">→</span>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Nutrition */}
        {allOnboardingDone && activeNutritionPlan && (
          <div className="mb-10">
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Nutrition</p>
            <div className="space-y-3">
              {nutritionReviewedThisWeek ? (
                <div className="rounded-2xl border border-teal-400/20 bg-teal-400/5 p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-teal-400">Nutrition check-in submitted</p>
                      <p className="text-xs text-stone-500 mt-0.5">Reviewed {new Date(activeNutritionPlan.last_review_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} — your coach will review shortly.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href={`/portal/${token}/nutrition`}
                  className="block rounded-2xl border border-stone-700 bg-stone-900 p-5 hover:border-teal-400/40 hover:bg-teal-400/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">Weekly nutrition check-in</p>
                      <p className="text-xs text-stone-400">How are you going with your plan?</p>
                    </div>
                    <span className="text-xs font-bold text-teal-400 ml-4">Start →</span>
                  </div>
                </Link>
              )}
              <Link
                href={`/portal/${token}/my-plan`}
                className="block rounded-2xl border border-stone-800 bg-stone-900/50 p-4 hover:border-stone-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-300">View your nutrition plan</p>
                    <p className="text-xs text-stone-600 mt-0.5">{activeNutritionPlan.plan_name}</p>
                  </div>
                  <span className="text-xs text-stone-500 ml-4">→</span>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Progress */}
        {allOnboardingDone && (
          <div className="mb-10">
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Progress</p>
            <Link
              href={`/portal/${token}/progress`}
              className="block rounded-2xl border border-stone-800 bg-stone-900/50 p-4 hover:border-stone-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-300">Measurements</p>
                  <p className="text-xs text-stone-600 mt-0.5">Track your bodyweight, waist, hips and chest over time.</p>
                </div>
                <span className="text-xs text-stone-500 ml-4">→</span>
              </div>
            </Link>
          </div>
        )}

        {/* Coach feedback */}
        {(latestProgramReview?.coach_notes || latestNutritionReview?.coach_notes) && (
          <div className="mb-10">
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">From your coach</p>
            <div className="space-y-3">
              {latestProgramReview?.coach_notes && (
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-teal-500 uppercase tracking-widest">Training</p>
                    <p className="text-xs text-stone-600">{new Date(latestProgramReview.reviewed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <p className="text-sm text-stone-300 leading-relaxed">{latestProgramReview.coach_notes}</p>
                </div>
              )}
              {latestNutritionReview?.coach_notes && (
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-teal-500 uppercase tracking-widest">Nutrition</p>
                    <p className="text-xs text-stone-600">{new Date(latestNutritionReview.reviewed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <p className="text-sm text-stone-300 leading-relaxed">{latestNutritionReview.coach_notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent check-ins */}
        {recentCheckins.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold tracking-widest text-stone-500 uppercase">Recent check-ins</p>
              <Link href={`/portal/${token}/checkin-history`} className="text-xs text-teal-500 hover:text-teal-400 transition-colors">View all →</Link>
            </div>
            <div className="space-y-2">
              {recentCheckins.map((c: { week_number: number; form_type: string; submitted_at: string }, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-stone-900 px-4 py-3">
                  <p className="text-sm text-white font-medium">Week {c.week_number}, Form {c.form_type}</p>
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
            href="https://app.bodyrecode.au/coaching-guide"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full bg-stone-900 border border-stone-800 rounded-2xl px-5 py-4 hover:border-stone-700 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-white">Active Coaching Client Guide</p>
              <p className="text-xs text-stone-500 mt-0.5">How the coaching process works and what to expect each week.</p>
            </div>
            <svg className="w-5 h-5 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        <div className="h-10" />{/* spacer for fixed footer */}
      </div>
    </div>
  )
}
