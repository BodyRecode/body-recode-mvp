import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function fmt(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeIcs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const key = searchParams.get('key')

  if (!key || key !== process.env.CALENDAR_FEED_KEY) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const admin = createAdminClient()

  const { data: bookings } = await admin
    .from('be_bookings')
    .select('id, scheduled_at, duration_minutes, meeting_link, type, lead_id, leads(name, email)')
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true })

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Body Recode//Bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Body Recode Bookings',
    'X-WR-TIMEZONE:Australia/Brisbane',
    'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
    'X-PUBLISHED-TTL:PT15M',
  ]

  for (const booking of bookings ?? []) {
    const lead = Array.isArray(booking.leads) ? booking.leads[0] : booking.leads
    const leadName = (lead as { name?: string })?.name ?? 'Unknown'
    const start = new Date(booking.scheduled_at)
    const end = new Date(start.getTime() + booking.duration_minutes * 60_000)
    const zoomNum = booking.type === 'zoom2' ? '2' : '1'
    const title = `Body Recode — Zoom ${zoomNum} — ${leadName}`

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${booking.id}@bodyrecode.au`)
    lines.push(`DTSTAMP:${fmt(new Date())}`)
    lines.push(`DTSTART:${fmt(start)}`)
    lines.push(`DTEND:${fmt(end)}`)
    lines.push(`SUMMARY:${escapeIcs(title)}`)
    if (booking.meeting_link) {
      lines.push(`LOCATION:${escapeIcs(booking.meeting_link)}`)
      lines.push(`URL:${escapeIcs(booking.meeting_link)}`)
    }
    lines.push('STATUS:CONFIRMED')
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
    },
  })
}
