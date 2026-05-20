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
  const activeForm = window.formType

  const thisWeekCheckins = (client.weekly_checkins || []).filter(
    (ci: { week_number: number }) => ci.week_number === weekNumber
  )
  const hasSubmitted = thisWeekCheckins.some((ci: { form_type: string }) => ci.form_type === activeForm)

  const formLabel = activeForm === 'A' ? 'Training, load, and recovery' : 'Regulation, lifestyle, and context'
  const checkinUrl = `/checkin/${token}`

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <div className="max-w-lg mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-6">Body Recode</p>
          <h1 className="text-2xl font-semibold mb-1">Hi {firstName}</h1>
          <p className="text-stone-400 text-sm">Week {weekNumber} of your coaching programme</p>
        </div>

        {/* Check-in status */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider">Weekly Check-In</h2>
            {window.isOpen ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-500/30 text-blue-500 bg-blue-500/10">
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
                The check-in window is open until Sunday 6pm Brisbane time.
              </p>

              <div className={`flex items-center justify-between rounded-lg p-4 border ${hasSubmitted ? 'bg-blue-500/5 border-blue-500/20' : 'bg-stone-800 border-stone-700'}`}>
                <div>
                  <p className={`text-sm font-semibold ${hasSubmitted ? 'text-blue-500' : 'text-[#1A1A1A]'}`}>
                    {hasSubmitted ? `Form ${activeForm} - Submitted` : `Form ${activeForm} - Required`}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">{formLabel}</p>
                </div>
                {hasSubmitted ? (
                  <span className="text-blue-500 text-lg">✓</span>
                ) : (
                  <Link
                    href={checkinUrl}
                    className="text-xs font-bold px-4 py-2 bg-[#1B6DFC] text-white rounded-lg hover:bg-[#1056D6] transition-colors"
                  >
                    Complete
                  </Link>
                )}
              </div>

              {hasSubmitted && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 text-center">
                  <p className="text-blue-500 text-sm font-semibold">Form {activeForm} submitted for Week {weekNumber}</p>
                  <p className="text-stone-500 text-xs mt-1">Your coach will review and synthesise your responses.</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-stone-400 text-sm mb-3">
                The check-in window opens every <strong className="text-[#1A1A1A]">Friday at 6pm</strong> and closes <strong className="text-[#1A1A1A]">Sunday at 6pm</strong> Brisbane time.
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
              {hasSubmitted && (
                <div className="mt-4 pt-4 border-t border-stone-800">
                  <p className="text-xs text-stone-500 mb-2">This week&apos;s submission:</p>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-500/30 text-blue-500">
                    Form {activeForm} ✓
                  </span>
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
