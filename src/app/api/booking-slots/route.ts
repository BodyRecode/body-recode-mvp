import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Returns available 30-min slots for the next N days
// Brisbane timezone (UTC+10, no DST)
const BRISBANE_OFFSET = 10 * 60 // minutes

function toBrisbane(date: Date): Date {
  return new Date(date.getTime() + BRISBANE_OFFSET * 60_000)
}

function fromBrisbane(date: Date): Date {
  return new Date(date.getTime() - BRISBANE_OFFSET * 60_000)
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const days = Math.min(parseInt(searchParams.get('days') ?? '28'), 60)

  const admin = createAdminClient()

  // Get availability rules
  const { data: availability } = await admin
    .from('be_availability')
    .select('*')
    .eq('is_active', true)

  if (!availability || availability.length === 0) {
    return NextResponse.json([])
  }

  // Get existing bookings in the window
  const windowStart = new Date()
  const windowEnd = new Date(windowStart.getTime() + days * 24 * 60 * 60_000)

  const { data: existingBookings } = await admin
    .from('be_bookings')
    .select('scheduled_at, duration_minutes')
    .eq('status', 'scheduled')
    .gte('scheduled_at', windowStart.toISOString())
    .lte('scheduled_at', windowEnd.toISOString())

  // Build blocked ranges from existing bookings (including buffer)
  const blockedRanges = (existingBookings ?? []).map(b => {
    const avail = availability[0] // use first rule for buffer — all same
    const start = new Date(b.scheduled_at).getTime()
    const end = start + (b.duration_minutes + avail.buffer_minutes) * 60_000
    return { start, end }
  })

  // Generate slots
  const slots: string[] = []
  const nowBrisbane = toBrisbane(new Date())

  for (let d = 0; d < days; d++) {
    const dayBrisbane = new Date(nowBrisbane)
    dayBrisbane.setDate(nowBrisbane.getDate() + d)
    dayBrisbane.setHours(0, 0, 0, 0)

    const dayOfWeek = dayBrisbane.getDay() // 0=Sun

    const rule = availability.find(a => a.day_of_week === dayOfWeek)
    if (!rule) continue

    const [startH, startM] = rule.start_time.split(':').map(Number)
    const [endH, endM] = rule.end_time.split(':').map(Number)

    const slotStart = new Date(dayBrisbane)
    slotStart.setHours(startH, startM, 0, 0)

    const slotEnd = new Date(dayBrisbane)
    slotEnd.setHours(endH, endM, 0, 0)

    let cursor = slotStart.getTime()
    const windowEndMs = slotEnd.getTime() - rule.slot_duration_minutes * 60_000

    while (cursor <= windowEndMs) {
      const slotEndMs = cursor + rule.slot_duration_minutes * 60_000

      // Skip slots in the past (with 1hr buffer)
      if (cursor < nowBrisbane.getTime() + 60 * 60_000) {
        cursor += (rule.slot_duration_minutes + rule.buffer_minutes) * 60_000
        continue
      }

      // Check if blocked by existing booking
      const isBlocked = blockedRanges.some(
        range => cursor < range.end && slotEndMs > range.start
      )

      if (!isBlocked) {
        // Convert back to UTC ISO for storage
        const utcSlot = fromBrisbane(new Date(cursor))
        slots.push(utcSlot.toISOString())
      }

      cursor += (rule.slot_duration_minutes + rule.buffer_minutes) * 60_000
    }
  }

  return NextResponse.json(slots)
}
