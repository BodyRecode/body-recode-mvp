import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { updateZoomMeeting, deleteZoomMeeting } from '@/lib/zoom'
import { fromCoach } from '@/lib/email-shell'
import { coach, brand } from '@/config/tenant'
import {
  buildBookingConfirmationEmail,
  scheduleBookingReminders,
  cancelBookingReminders,
  formatBookingTimes,
  generateBookingIcs,
} from '@/lib/booking-reminders'

const typeLabel: Record<string, string> = {
  zoom: 'Zoom',
  zoom1: 'Zoom',
  zoom2: 'Zoom',
  other: 'Session',
}

/**
 * PATCH a booking.
 *
 * Two paths beyond a plain field update, both added 2026-08-10 after a Zoom 1
 * was created at the wrong time and could not be corrected:
 *
 *   RESCHEDULE — `scheduled_at` (or duration) changes. The Zoom meeting is
 *   moved rather than recreated so the join URL survives, the stale reminders
 *   are pulled out of Resend's queue, new ones are queued, and the contact gets
 *   a corrected confirmation with an .ics at a higher SEQUENCE so their
 *   calendar updates the existing event in place.
 *
 *   CANCEL — status becomes 'cancelled'. Queued reminders are cancelled and the
 *   Zoom meeting is deleted. Deliberately does NOT email the contact: telling
 *   someone their call is off is a message you write yourself.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const { data: existing, error: loadError } = await supabase
    .from('be_bookings')
    .select('id, lead_id, client_id, type, scheduled_at, duration_minutes, status, meeting_link, notes, zoom_meeting_id, reminder_email_ids')
    .eq('id', id)
    .eq('coach_id', user.id)
    .single()

  if (loadError || !existing) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
  }

  const isCancelling = body.status === 'cancelled' && existing.status !== 'cancelled'
  const newScheduledAt = body.scheduled_at ?? existing.scheduled_at
  const newDuration = body.duration_minutes ?? existing.duration_minutes
  const isRescheduling =
    !isCancelling &&
    (new Date(newScheduledAt).getTime() !== new Date(existing.scheduled_at).getTime() ||
      newDuration !== existing.duration_minutes)

  // Surfaced to the caller so a failed reminder cancellation is visible in the
  // UI instead of being swallowed. See CancelRemindersResult.restrictedKey.
  let warning: string | null = null

  // ── Cancel ────────────────────────────────────────────────────────────
  if (isCancelling) {
    const res = await cancelBookingReminders(existing.reminder_email_ids)
    if (res.attempted > res.cancelled) {
      warning = res.restrictedKey
        ? 'Booking cancelled, but the queued reminder emails could NOT be cancelled: RESEND_API_KEY is a send-only key. They will still send at the original time. Swap it for a Full Access key in Resend.'
        : `Booking cancelled, but ${res.attempted - res.cancelled} reminder email(s) could not be cancelled and may still send.`
    }
    if (existing.zoom_meeting_id) {
      try {
        await deleteZoomMeeting(existing.zoom_meeting_id)
      } catch (e) {
        console.error('[bookings/PATCH] Zoom delete failed:', e)
      }
    }
  }

  // ── Reschedule: move the Zoom meeting before touching the row ─────────
  if (isRescheduling && existing.zoom_meeting_id) {
    try {
      await updateZoomMeeting(existing.zoom_meeting_id, {
        startTime: new Date(newScheduledAt).toISOString(),
        durationMinutes: newDuration,
      })
    } catch (e) {
      console.error('[bookings/PATCH] Zoom update failed:', e)
    }
  }

  const update: Record<string, unknown> = {
    status: body.status ?? existing.status,
    meeting_link: body.meeting_link ?? existing.meeting_link,
    notes: body.notes ?? existing.notes,
    scheduled_at: newScheduledAt,
    duration_minutes: newDuration,
  }
  if (isCancelling) update.reminder_email_ids = []

  const { data, error } = await supabase
    .from('be_bookings')
    .update(update)
    .eq('id', id)
    .eq('coach_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Reschedule: re-queue reminders and send the corrected confirmation ──
  if (isRescheduling) {
    const cancelRes = await cancelBookingReminders(existing.reminder_email_ids)
    if (cancelRes.attempted > cancelRes.cancelled) {
      warning = cancelRes.restrictedKey
        ? 'Time updated and they have been emailed, but the OLD reminder emails could NOT be cancelled: RESEND_API_KEY is a send-only key. They will still send at the original time. Swap it for a Full Access key in Resend.'
        : `Time updated, but ${cancelRes.attempted - cancelRes.cancelled} old reminder email(s) could not be cancelled and may still send at the original time.`
    }

    let contactName = 'Client'
    let contactEmail: string | null = null
    let prepUrl: string | null = null

    if (existing.lead_id) {
      const { data: lead } = await supabase
        .from('leads').select('name, email').eq('id', existing.lead_id).single()
      if (lead) { contactName = lead.name; contactEmail = lead.email }

      const { data: prepDone } = await supabase
        .from('lead_events')
        .select('id')
        .eq('lead_id', existing.lead_id)
        .eq('type', 'prep_form_completed')
        .limit(1)
      if (!prepDone || prepDone.length === 0) {
        prepUrl = `${brand().marketingDomain}/book/prep/${existing.lead_id}`
      }
    } else if (existing.client_id) {
      const { data: client } = await supabase
        .from('clients').select('name, email').eq('id', existing.client_id).single()
      if (client) { contactName = client.name; contactEmail = client.email }
    }

    let reminderIds: string[] = []

    if (contactEmail && process.env.RESEND_API_KEY) {
      const scheduledAt = new Date(newScheduledAt)
      const { dateStr, timeStr } = formatBookingTimes(scheduledAt)
      const emailCtx = {
        firstName: contactName.split(' ')[0],
        dateStr,
        timeStr,
        durationMinutes: newDuration,
        meetingLink: data.meeting_link ?? null,
        prepUrl,
        rescheduled: true,
      }

      // SEQUENCE must climb for a calendar client to replace the existing
      // event rather than ignore the update. Derived from how many times this
      // booking has been touched, which is good enough and needs no new column.
      const sequence = Math.floor(Date.now() / 1000) % 1_000_000

      const ics = generateBookingIcs({
        title: `Body Recode — ${typeLabel[existing.type] ?? 'Session'} — ${contactName}`,
        startTime: scheduledAt.toISOString(),
        durationMinutes: newDuration,
        location: data.meeting_link ?? 'Zoom',
        description: data.meeting_link ? `Join Zoom: ${data.meeting_link}` : 'Zoom link not available',
        uid: existing.id,
        sequence,
      })

      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const confirmation = buildBookingConfirmationEmail(emailCtx)
        await resend.emails.send({
          from: fromCoach(),
          to: contactEmail,
          subject: confirmation.subject,
          html: confirmation.html,
          attachments: [{ filename: 'booking.ics', content: Buffer.from(ics).toString('base64') }],
        })

        // Coach copy, so the corrected time lands in Kade's calendar too.
        await resend.emails.send({
          from: fromCoach(),
          to: coach().email,
          subject: `Moved: ${contactName} — ${dateStr} at ${timeStr}`,
          html: confirmation.html,
          attachments: [{ filename: 'booking.ics', content: Buffer.from(ics).toString('base64') }],
        })

        reminderIds = await scheduleBookingReminders({ to: contactEmail, scheduledAt, ctx: emailCtx })
      } catch (e) {
        console.error('[bookings/PATCH] reschedule email failed:', e)
      }
    }

    await supabase
      .from('be_bookings')
      .update({ reminder_email_ids: reminderIds })
      .eq('id', id)
  }

  return NextResponse.json({ ...data, warning })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  // Pull the queued reminders and the Zoom meeting down with the row, otherwise
  // a deleted booking still emails the contact at its old time.
  const { data: existing } = await supabase
    .from('be_bookings')
    .select('zoom_meeting_id, reminder_email_ids')
    .eq('id', id)
    .eq('coach_id', user.id)
    .single()

  let warning: string | null = null
  if (existing) {
    const res = await cancelBookingReminders(existing.reminder_email_ids)
    if (res.attempted > res.cancelled) {
      warning = res.restrictedKey
        ? 'Booking deleted, but the queued reminder emails could NOT be cancelled: RESEND_API_KEY is a send-only key. They will still send at the original time.'
        : `Booking deleted, but ${res.attempted - res.cancelled} reminder email(s) could not be cancelled and may still send.`
    }
    if (existing.zoom_meeting_id) {
      try {
        await deleteZoomMeeting(existing.zoom_meeting_id)
      } catch (e) {
        console.error('[bookings/DELETE] Zoom delete failed:', e)
      }
    }
  }

  const { error } = await supabase
    .from('be_bookings')
    .delete()
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, warning })
}
