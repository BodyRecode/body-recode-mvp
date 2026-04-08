import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Brisbane is always UTC+10 (no DST)
const BRISBANE_OFFSET_MS = 10 * 60 * 60 * 1000

function utcToBrisbane(utcMs: number): Date {
  return new Date(utcMs + BRISBANE_OFFSET_MS)
}

function brisbaneToUtc(brisbaneMs: number): Date {
  return new Date(brisbaneMs - BRISBANE_OFFSET_MS)
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const days = Math.min(parseInt(searchParams.get('days') ?? '7'), 60)
  const sessionType = searchParams.get('session_type') ?? 'zoom'

  const admin = createAdminClient()

  const { data: availability } = await admin
    .from('be_availability')
    .select('*')
    .eq('is_active', true)
    .eq('session_type', sessionType)

  if (!availability || availability.length === 0) {
    return NextResponse.json([])
  }

  // Build a map: dayOfWeek → rule
  const ruleByDay: Record<number, typeof availability[0]> = {}
  for (const rule of availability) {
    ruleByDay[rule.day_of_week] = rule
  }

  // Get existing bookings in window to block out
  const windowStartUtc = new Date()
  const windowEndUtc = new Date(windowStartUtc.getTime() + days * 24 * 60 * 60 * 1000)

  const { data: existingBookings } = await admin
    .from('be_bookings')
    .select('scheduled_at, duration_minutes')
    .eq('status', 'scheduled')
    .gte('scheduled_at', windowStartUtc.toISOString())
    .lte('scheduled_at', windowEndUtc.toISOString())

  const blockedRanges = (existingBookings ?? []).map(b => {
    const rule = availability[0]
    const start = new Date(b.scheduled_at).getTime()
    const end = start + (b.duration_minutes + rule.buffer_minutes) * 60 * 1000
    return { start, end }
  })

  const slots: string[] = []

  // Current Brisbane time
  const nowUtcMs = Date.now()
  const nowBrisbane = utcToBrisbane(nowUtcMs)

  // Iterate over each calendar day in Brisbane time
  for (let d = 0; d < days; d++) {
    // Get Brisbane midnight for this day
    const brisbaneDay = new Date(nowBrisbane)
    brisbaneDay.setUTCDate(nowBrisbane.getUTCDate() + d)
    brisbaneDay.setUTCHours(0, 0, 0, 0)

    const dayOfWeek = brisbaneDay.getUTCDay() // 0=Sun, 1=Mon ... 6=Sat

    const rule = ruleByDay[dayOfWeek]
    if (!rule) continue

    const [startH, startM] = (rule.start_time as string).split(':').map(Number)
    const [endH, endM] = (rule.end_time as string).split(':').map(Number)

    // Brisbane timestamp for first slot of the day
    const dayStartBrisbaneMs = brisbaneDay.getTime()
    const slotWindowStart = dayStartBrisbaneMs + (startH * 60 + startM) * 60 * 1000
    const slotWindowEnd = dayStartBrisbaneMs + (endH * 60 + endM) * 60 * 1000

    const slotDurationMs = rule.slot_duration_minutes * 60 * 1000
    const bufferMs = rule.buffer_minutes * 60 * 1000
    const stepMs = slotDurationMs + bufferMs

    let cursor = slotWindowStart
    while (cursor + slotDurationMs <= slotWindowEnd) {
      const slotEndMs = cursor + slotDurationMs

      // Convert Brisbane slot time to UTC for comparison
      const slotUtc = brisbaneToUtc(cursor)
      const slotUtcMs = slotUtc.getTime()

      // Skip if in the past (1hr buffer)
      if (slotUtcMs < nowUtcMs + 60 * 60 * 1000) {
        cursor += stepMs
        continue
      }

      // Check if blocked by existing booking
      const isBlocked = blockedRanges.some(
        range => slotUtcMs < range.end && (slotUtcMs + slotDurationMs) > range.start
      )

      if (!isBlocked) {
        slots.push(slotUtc.toISOString())
      }

      cursor += stepMs
    }
  }

  return NextResponse.json(slots)
}
