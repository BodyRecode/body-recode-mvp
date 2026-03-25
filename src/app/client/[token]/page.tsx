import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getWeekNumber, getCheckInWindowStatus } from '@/lib/weekly-checkin-questions'

export default async function ClientDashboardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('*, weekly_checkins(week_number, form_type, submitted_at)')
    .eq('checkin_token', token)
    .single()

  if (!client) return notFound()

  const firstName = client.name?.split(' ')[0] ?? 'there'
  const startDate = client.coaching_started_at || client.created_at
  const weekNumber = getWeekNumber(startDate)
  const window = getCheckInWindowStatus()

  const thisWeekCheckins = (client.weekly_checkins || []).filter(
    (ci: { week_number: number }) => ci.week_number === weekNumber
  )
  const hasFormA = thisWeekCheckins.some((ci: { form_type: string }) => ci.form_type === 'A')
  const hasFormB = thisWeekCheckins.some((ci: { form_type: string }) => ci.form_type === 'B')
  const bothDone = hasFormA && hasFormB

  const checkinUrl = `/checkin/${token}`

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-lg mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-6">Body Recode</p>
          <h1 className="text-2xl font-semibold mb-1">Hi {firstName}</h1>
          <p className="text-stone-400 text-sm">Week {weekNumber} of your coaching programme</p>
        </div>

        {/* Check-in status */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider">Weekly Check-In</h2>
            {window.isOpen ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-teal-400/30 text-teal-400 bg-teal-400/10">
                Window Open
              </span>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-stone-700 text-stone-500">
                Window Closed
              </span>
            )}
          </div>

          {window.isOpen ? (
            <div className="space-y-3">
              <p className="text-stone-400 text-sm">
                The check-in window is open until Sunday 6pm Brisbane time. Complete both forms before the window closes.
              </p>

              {/* Form A */}
              <div className={`flex items-center justify-between rounded-lg p-4 border ${hasFormA ? 'bg-teal-400/5 border-teal-400/20' : 'bg-stone-800 border-stone-700'}`}>
                <div>
                  <p className={`text-sm font-semibold ${hasFormA ? 'text-teal-400' : 'text-white'}`}>
                    {hasFormA ? 'Form A - Submitted' : 'Form A - Required'}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">Training, load, and recovery</p>
                </div>
                {hasFormA ? (
                  <span className="text-teal-400 text-lg">✓</span>
                ) : (
                  <Link
                    href={checkinUrl}
                    className="text-xs font-bold px-4 py-2 bg-[#10E1C2] text-black rounded-lg hover:bg-[#0ecfb2] transition-colors"
                  >
                    Complete
                  </Link>
                )}
              </div>

              {/* Form B */}
              <div className={`flex items-center justify-between rounded-lg p-4 border ${hasFormB ? 'bg-teal-400/5 border-teal-400/20' : 'bg-stone-800 border-stone-700'}`}>
                <div>
                  <p className={`text-sm font-semibold ${hasFormB ? 'text-teal-400' : 'text-white'}`}>
                    {hasFormB ? 'Form B - Submitted' : 'Form B - Required'}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">Regulation, lifestyle, and context</p>
                </div>
                {hasFormB ? (
                  <span className="text-teal-400 text-lg">✓</span>
                ) : (
                  <Link
                    href={checkinUrl}
                    className="text-xs font-bold px-4 py-2 bg-[#10E1C2] text-black rounded-lg hover:bg-[#0ecfb2] transition-colors"
                  >
                    Complete
                  </Link>
                )}
              </div>

              {bothDone && (
                <div className="bg-teal-400/5 border border-teal-400/20 rounded-lg p-4 text-center">
                  <p className="text-teal-400 text-sm font-semibold">Both forms submitted for Week {weekNumber}</p>
                  <p className="text-stone-500 text-xs mt-1">Your coach will review and synthesise your responses.</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-stone-400 text-sm mb-3">
                The check-in window opens every <strong className="text-white">Friday at 6pm</strong> and closes <strong className="text-white">Sunday at 6pm</strong> Brisbane time.
              </p>
              <p className="text-stone-500 text-xs">
                Next window opens {window.opensAt.toLocaleString('en-AU', {
                  timeZone: 'Australia/Brisbane',
                  weekday: 'long',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })} Brisbane time.
              </p>
              {(hasFormA || hasFormB) && (
                <div className="mt-4 pt-4 border-t border-stone-800">
                  <p className="text-xs text-stone-500 mb-2">This week&apos;s submissions:</p>
                  <div className="flex gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${hasFormA ? 'border-teal-400/30 text-teal-400' : 'border-stone-700 text-stone-600'}`}>
                      Form A {hasFormA ? '✓' : '—'}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${hasFormB ? 'border-teal-400/30 text-teal-400' : 'border-stone-700 text-stone-600'}`}>
                      Form B {hasFormB ? '✓' : '—'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-stone-600 text-xs text-center mt-8">
          Body Recode Performance Coaching · Questions? Reply to your coach&apos;s emails.
        </p>

      </div>
    </div>
  )
}
