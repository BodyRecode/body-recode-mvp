import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildStoryRemindersIcs, type StoryRow } from '@/lib/story-reminders-ics'

// Live subscription feed of Body Recode IG story posting reminders. Subscribe a
// calendar to this URL once and every change to the story calendar flows in
// automatically (5-min alert on each, caption + graphic link in the body).
//
// Same auth as the bookings feed (CALENDAR_FEED_KEY). Distinct calendar so it
// can be shown/hidden independently of bookings.

// Brisbane is UTC+10 year-round (no DST).
function brisbaneToday(): string {
  const nowBrisbane = new Date(Date.now() + 10 * 60 * 60 * 1000)
  return nowBrisbane.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')
  if (!key || key !== process.env.CALENDAR_FEED_KEY) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const admin = createAdminClient()
  const { data: rows } = await admin
    .from('calendar_posts')
    .select('date, time, title, caption, graphic')
    .eq('type', 'story')
    .eq('brand', 'body_recode')
    .gte('date', brisbaneToday())
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  const ics = buildStoryRemindersIcs((rows ?? []) as StoryRow[], {
    calName: 'Body Recode · IG Story Posting',
    refreshMinutes: 60,
  })

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
    },
  })
}
