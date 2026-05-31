// Overwrite the saved Week 4 Form B coach feedback for Samantha.
// New version applies Kade-saved framing (cross-week trajectory, quote her line,
// restraint on single-week shifts, intervention-not-observation in next focus)
// and folds in the travel-block heads-up locked separately.
//
// Idempotent — re-running overwrites the same row. Does NOT send the email;
// email is sent by Kade clicking "Save and email client" in the dashboard.

import { createClient } from '@supabase/supabase-js'

const CHECKIN_ID = '00cab621-a91d-41b3-b2dd-bfe5e035f309' // Samantha Week 4 Form B

const INTERPRETATION = `Samantha, four weeks in and the pattern is clear. Your recovery rating is holding at full, sessions are reading easier than they did in Week 2, and your sleep stays consistent. That's the foundation piece, and it's working. The shift is in capacity. Three weeks ago you reported capacity about the same as usual. Last week it felt more available. This week, the same again. Paired with your own note about learning to value exercise, something has genuinely shifted in how your body is distributing what it has.

Upper body felt mentally challenging this week, and left shoulder weakness returned. On a single week neither is a pattern yet, but they're worth naming. Your foundational read shows chronic stress is your load-bearing problem, not training volume. The risk isn't that sessions are hard. It's that your regulatory system is already saturated with work pressure and mental overwhelm. Adding training stress into a system running that tight is the thing to watch.

One more thing to flag for the month ahead. Thursday 4 June is our last in-person session before you're away for four weeks. I'll have a modified version of your program ready for that window, shorter sessions, fewer pieces, no equipment needed, so training stays workable away from the gym. We'll walk through it together on the 4th.`

const REFRAME: string | null = null

const NEXT_FOCUS = `This week, before you train, take a 10-minute walk without your phone. Not a warm-up. A separate thing, earlier in the day if you can, that sits between your workday stress and your session. Your body is learning to train well. The work now is giving it space to recover from everything else first.`

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: existing, error: readErr } = await supabase
    .from('weekly_checkin_feedback')
    .select('id, weekly_checkin_id, email_sent_at, interpretation, next_focus')
    .eq('weekly_checkin_id', CHECKIN_ID)
    .maybeSingle()

  if (readErr) { console.error(readErr); process.exit(1) }
  if (!existing) { console.error('No feedback row to overwrite'); process.exit(1) }

  if (existing.email_sent_at) {
    console.error(`Feedback already emailed at ${existing.email_sent_at}. Aborting overwrite.`)
    process.exit(1)
  }

  console.log('--- BEFORE ---')
  console.log('interpretation:', existing.interpretation.slice(0, 120), '...')
  console.log('next_focus:', existing.next_focus.slice(0, 120), '...')

  const { error: upErr } = await supabase
    .from('weekly_checkin_feedback')
    .update({ interpretation: INTERPRETATION, reframe: REFRAME, next_focus: NEXT_FOCUS })
    .eq('id', existing.id)

  if (upErr) { console.error('Update failed:', upErr); process.exit(1) }

  const { data: after } = await supabase
    .from('weekly_checkin_feedback')
    .select('id, interpretation, reframe, next_focus')
    .eq('id', existing.id)
    .single()

  console.log('\n--- AFTER ---')
  console.log(JSON.stringify(after, null, 2))
}

main().catch((e) => { console.error(e); process.exit(1) })
