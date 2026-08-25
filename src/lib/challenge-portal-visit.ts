import { createAdminClient } from '@/lib/supabase/admin'

// Portal visits were logged NOWHERE. There is a current_day column on the
// enrollment, but the portal page recalculates the day from enrolled_at and
// never writes to it, so it says nothing about whether anyone actually turned
// up. That left the largest leak in the whole funnel invisible: of the 15 people
// who cleared every form, 1 reached the Day 14 quiz, and we could not see
// whether they went quiet on day 2 or day 9 - which need completely different
// fixes.
//
// Deduped to one row per enrollment per day. We want the shape of attendance
// across the 14 days, not a page-view counter, and a server component re-renders
// on every navigation and prefetch. At 14 days per member this stays tiny.
export async function logPortalVisit(leadId: string, enrollmentId: string, day: number) {
  if (!leadId) return
  try {
    const admin = createAdminClient()
    const marker = `enrollment:${enrollmentId} day:${day}`

    const { data: existing } = await admin
      .from('lead_events')
      .select('id')
      .eq('lead_id', leadId)
      .eq('type', 'challenge_portal_opened')
      .eq('notes', marker)
      .limit(1)

    if (existing?.length) return

    await admin.from('lead_events').insert({
      lead_id: leadId,
      type: 'challenge_portal_opened',
      // The TYPE stays 'challenge_portal_opened': scripts/challenge-attendance.ts
      // queries it by name and every historical row carries it. Only the
      // human-readable subject changed, on 25 Aug 2026, because after the
      // cutover every caller of this function is a /decode page - the Challenge
      // portal hub redirects - so "Challenge portal opened" is now always wrong
      // in the timeline Kade actually reads.
      subject: `Body Decode portal opened - day ${day}`,
      notes: marker,
      sent_at: new Date().toISOString(),
    })
  } catch (e) {
    // Never let instrumentation break the portal. A missing row costs us a data
    // point; a thrown error costs the member their day.
    console.error('logPortalVisit error:', e)
  }
}
