import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, Plus, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import CreateBookingButton from './create-booking-button'
import BookingStatusButton from './booking-status-button'

const typeLabel: Record<string, string> = {
  zoom1: 'Zoom 1',
  zoom2: 'Zoom 2',
  other: 'Session',
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; colour: string }> = {
  scheduled: { label: 'Scheduled', icon: Clock, colour: 'text-amber-700' },
  completed: { label: 'Completed', icon: CheckCircle2, colour: 'text-blue-500' },
  cancelled: { label: 'Cancelled', icon: XCircle, colour: 'text-stone-500' },
  no_show: { label: 'No Show', icon: AlertCircle, colour: 'text-red-700' },
}

export default async function BookingsPage() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase
      .from('be_bookings')
      .select('*, leads(id, name, email), clients(id, name)')
      .eq('status', 'scheduled')
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(20),
    supabase
      .from('be_bookings')
      .select('*, leads(id, name, email), clients(id, name)')
      .or(`status.neq.scheduled,scheduled_at.lt.${now}`)
      .order('scheduled_at', { ascending: false })
      .limit(20),
  ])

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Bookings</h1>
          <p className="text-stone-600 text-sm">
            {upcoming?.length || 0} upcoming · {past?.length || 0} past
          </p>
        </div>
        <CreateBookingButton />
      </div>

      {/* Upcoming */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Upcoming</h2>
        {upcoming && upcoming.length > 0 ? (
          <div className="space-y-2">
            {upcoming.map((booking) => {
              const contact = booking.leads || booking.clients
              const contactId = booking.lead_id || booking.client_id
              const contactHref = booking.lead_id
                ? `/dashboard/business/crm/${booking.lead_id}`
                : `/dashboard/clients/${booking.client_id}`
              const cfg = statusConfig[booking.status]
              const Icon = cfg.icon
              return (
                <div
                  key={booking.id}
                  className="bg-stone-100 border border-stone-200 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="shrink-0 w-14 text-center">
                    <p className="text-lg font-bold text-[#1A1A1A] leading-none">
                      {new Date(booking.scheduled_at).toLocaleDateString('en-AU', { day: 'numeric' })}
                    </p>
                    <p className="text-xs text-stone-500 uppercase">
                      {new Date(booking.scheduled_at).toLocaleDateString('en-AU', { month: 'short' })}
                    </p>
                  </div>

                  <div className="w-px h-10 bg-stone-200 shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">
                        {typeLabel[booking.type]}
                      </span>
                      <span className="text-stone-700">·</span>
                      <span className="text-xs text-stone-600">
                        {new Date(booking.scheduled_at).toLocaleTimeString('en-AU', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'Australia/Brisbane',
                        })}
                      </span>
                      {booking.duration_minutes && (
                        <>
                          <span className="text-stone-700">·</span>
                          <span className="text-xs text-stone-500">{booking.duration_minutes}min</span>
                        </>
                      )}
                    </div>
                    <Link
                      href={contactHref}
                      className="text-sm font-medium text-[#1A1A1A] hover:text-blue-500 transition-colors truncate block"
                    >
                      {Array.isArray(contact) ? contact[0]?.name : (contact as { name: string } | null)?.name ?? 'Unknown'}
                    </Link>
                    {booking.meeting_link && (
                      <a
                        href={booking.meeting_link}
                        target="_blank"
                        className="text-xs text-stone-500 hover:text-stone-700 transition-colors truncate block mt-0.5"
                      >
                        {booking.meeting_link}
                      </a>
                    )}
                  </div>

                  <BookingStatusButton
                    bookingId={booking.id}
                    currentStatus={booking.status}
                    scheduledAt={booking.scheduled_at}
                    durationMinutes={booking.duration_minutes ?? 60}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-stone-100 border border-dashed border-stone-200 rounded-xl p-8 text-center">
            <Calendar size={20} className="text-stone-400 mx-auto mb-2" />
            <p className="text-stone-500 text-sm">No upcoming bookings</p>
          </div>
        )}
      </div>

      {/* Past */}
      {past && past.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Past</h2>
          <div className="space-y-2">
            {past.map((booking) => {
              const contact = booking.leads || booking.clients
              const contactHref = booking.lead_id
                ? `/dashboard/business/crm/${booking.lead_id}`
                : `/dashboard/clients/${booking.client_id}`
              const cfg = statusConfig[booking.status] ?? statusConfig.scheduled
              const Icon = cfg.icon
              return (
                <div
                  key={booking.id}
                  className="bg-stone-100/60 border border-stone-200 rounded-xl p-4 flex items-center gap-4 opacity-70"
                >
                  <div className="shrink-0 w-14 text-center">
                    <p className="text-base font-bold text-stone-600 leading-none">
                      {new Date(booking.scheduled_at).toLocaleDateString('en-AU', { day: 'numeric' })}
                    </p>
                    <p className="text-xs text-stone-400 uppercase">
                      {new Date(booking.scheduled_at).toLocaleDateString('en-AU', { month: 'short' })}
                    </p>
                  </div>

                  <div className="w-px h-10 bg-stone-200 shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                        {typeLabel[booking.type]}
                      </span>
                    </div>
                    <Link
                      href={contactHref}
                      className="text-sm font-medium text-stone-600 hover:text-blue-500 transition-colors truncate block"
                    >
                      {Array.isArray(contact) ? contact[0]?.name : (contact as { name: string } | null)?.name ?? 'Unknown'}
                    </Link>
                  </div>

                  <div className={`flex items-center gap-1.5 text-xs ${cfg.colour}`}>
                    <Icon size={13} />
                    {cfg.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
