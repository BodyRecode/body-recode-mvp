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
  cancelled: { label: 'Cancelled', icon: XCircle, colour: 'text-[#666D7A]' },
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
      <div className="flex items-center justify-between br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E8EAEE] bg-white/[0.88] backdrop-blur-md print:static print:bg-transparent">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] mb-1">Bookings</h1>
          <p className="text-[#666D7A] text-sm">
            {upcoming?.length || 0} upcoming · {past?.length || 0} past
          </p>
        </div>
        <CreateBookingButton />
      </div>

      {/* Upcoming */}
      <div className="mb-8">
        <h2 className="text-[12.5px] font-semibold text-[#666D7A] mb-3">Upcoming</h2>
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
                  className="bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="shrink-0 w-14 text-center">
                    <p className="text-lg font-bold text-[#141821] leading-none">
                      {new Date(booking.scheduled_at).toLocaleDateString('en-AU', { day: 'numeric' })}
                    </p>
                    <p className="text-[12.5px] text-[#666D7A]">
                      {new Date(booking.scheduled_at).toLocaleDateString('en-AU', { month: 'short' })}
                    </p>
                  </div>

                  <div className="w-px h-10 bg-[#EFF1F4] shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[12.5px] font-semibold text-blue-500">
                        {typeLabel[booking.type]}
                      </span>
                      <span className="text-[#141821]">·</span>
                      <span className="text-[12.5px] text-[#666D7A]">
                        {new Date(booking.scheduled_at).toLocaleTimeString('en-AU', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'Australia/Brisbane',
                        })}
                      </span>
                      {booking.duration_minutes && (
                        <>
                          <span className="text-[#141821]">·</span>
                          <span className="text-[12.5px] text-[#666D7A]">{booking.duration_minutes}min</span>
                        </>
                      )}
                    </div>
                    <Link
                      href={contactHref}
                      className="text-sm font-medium text-[#141821] hover:text-blue-500 transition-colors truncate block"
                    >
                      {Array.isArray(contact) ? contact[0]?.name : (contact as { name: string } | null)?.name ?? 'Unknown'}
                    </Link>
                    {booking.meeting_link && (
                      <a
                        href={booking.meeting_link}
                        target="_blank"
                        className="text-[12.5px] text-[#666D7A] hover:text-[#141821] transition-colors truncate block mt-0.5"
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
          <div className="bg-[#F4F6F9] border border-dashed border-[#E8EAEE] rounded-xl p-8 text-center">
            <Calendar size={20} className="text-[#98A0AD] mx-auto mb-2" />
            <p className="text-[#666D7A] text-sm">No upcoming bookings</p>
          </div>
        )}
      </div>

      {/* Past */}
      {past && past.length > 0 && (
        <div>
          <h2 className="text-[12.5px] font-semibold text-[#666D7A] mb-3">Past</h2>
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
                  className="bg-[#F4F6F9]/60 border border-[#E8EAEE] rounded-xl p-4 flex items-center gap-4 opacity-70"
                >
                  <div className="shrink-0 w-14 text-center">
                    <p className="text-base font-bold text-[#666D7A] leading-none">
                      {new Date(booking.scheduled_at).toLocaleDateString('en-AU', { day: 'numeric' })}
                    </p>
                    <p className="text-[12.5px] text-[#98A0AD]">
                      {new Date(booking.scheduled_at).toLocaleDateString('en-AU', { month: 'short' })}
                    </p>
                  </div>

                  <div className="w-px h-10 bg-[#EFF1F4] shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[12.5px] font-semibold text-[#666D7A]">
                        {typeLabel[booking.type]}
                      </span>
                    </div>
                    <Link
                      href={contactHref}
                      className="text-sm font-medium text-[#666D7A] hover:text-blue-500 transition-colors truncate block"
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
