// One-off: wire in the weekly Blueprint story beat + reword the stray Aug 10
// "Challenge is live" story to an evergreen invite.
//
// - Reword Aug 10 (row 369a94a9): the Challenge has been live since 13 Jul, so
//   any "live / now open / launch" framing is false. New copy makes no time
//   claim. Its graphic is overwritten in place (path/URL unchanged).
// - Add 4 Blueprint stories, one per week (Thu 30 Jul, 6/13/20 Aug at 17:00),
//   as a 4th slot. These drive to /blueprint (warm audience), unlike the
//   Challenge stories which drive to /challenge.
//
// Graphic naming convention (observed): /stories/filled/story_<first8-of-uuid>.png
//
// Rendered source PNGs come from scripts/ig-generator (already reviewed):
//   scratchpad/story-preview/{aug10_evergreen_invite,bp_wk3,bp_wk4,bp_wk5,bp_wk6}.png
//
// Run: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/wire-blueprint-stories.ts

import { createClient } from '@supabase/supabase-js'
import { copyFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'

const PREVIEW = process.argv[2] // dir holding the rendered PNGs
if (!PREVIEW || !existsSync(PREVIEW)) {
  throw new Error('Pass the preview dir holding the rendered PNGs as arg 1')
}
const FILLED = `${homedir()}/body-recode-mvp/public/stories/filled`

const AUG10_ID = '369a94a9-e4cd-481e-b99f-6c6455c5d78a'
const AUG10 = {
  title: 'Challenge invite · W5 1',
  caption: 'The 14-Day Body Decode Challenge. A free read of your state, anytime.',
  src: 'aug10_evergreen_invite.png',
  graphic: '/stories/filled/story_369a94a9.png', // overwrite in place
}

const BLUEPRINTS = [
  { date: '2026-07-30', title: 'Blueprint · W3 4', caption: 'The read is done. The Blueprint writes the six weeks.', src: 'bp_wk3.png' },
  { date: '2026-08-06', title: 'Blueprint · W4 4', caption: 'Not a template. The six weeks your pattern needs.', src: 'bp_wk4.png' },
  { date: '2026-08-13', title: 'Blueprint · W5 4', caption: 'You named the pattern. The Blueprint corrects it.', src: 'bp_wk5.png' },
  { date: '2026-08-20', title: 'Blueprint · W6 4', caption: 'The Challenge reads. The Blueprint rebuilds.', src: 'bp_wk6.png' },
]
const BP_TIME = '17:00'
const BP_NOTES = 'Weekly Blueprint beat -> bodyrecode.au/blueprint (warm audience) · category=hook'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env missing')
  const supabase = createClient(url, key)

  // 1. Reword Aug 10 + overwrite its graphic in place.
  copyFileSync(`${PREVIEW}/${AUG10.src}`, `${homedir()}/body-recode-mvp/public${AUG10.graphic}`)
  const { error: aug10Err } = await supabase
    .from('calendar_posts')
    .update({ title: AUG10.title, caption: AUG10.caption })
    .eq('id', AUG10_ID)
  if (aug10Err) throw new Error(`Aug 10 update failed: ${aug10Err.message}`)
  console.log(`[✓] Aug 10 reworded → "${AUG10.title}" · graphic overwritten`)

  // 2. Insert each Blueprint story, then name its graphic from the new row id.
  for (const bp of BLUEPRINTS) {
    // Guard: skip if this exact slot already exists (idempotent re-run).
    const { data: existing } = await supabase
      .from('calendar_posts')
      .select('id')
      .eq('brand', 'body_recode').eq('type', 'story')
      .eq('date', bp.date).eq('time', BP_TIME)
      .maybeSingle()
    if (existing) {
      console.log(`[=] ${bp.date} ${BP_TIME} already exists (${existing.id}) — skipping insert`)
      continue
    }

    const { data: row, error: insErr } = await supabase
      .from('calendar_posts')
      .insert({
        date: bp.date, time: BP_TIME, type: 'story', brand: 'body_recode',
        phase: 'evergreen', platform: 'instagram', scheduled: false,
        title: bp.title, caption: bp.caption, notes: BP_NOTES, graphic: null,
      })
      .select('id')
      .single()
    if (insErr || !row) throw new Error(`Insert failed for ${bp.date}: ${insErr?.message}`)

    const graphic = `/stories/filled/story_${row.id.slice(0, 8)}.png`
    copyFileSync(`${PREVIEW}/${bp.src}`, `${FILLED}/story_${row.id.slice(0, 8)}.png`)
    const { error: gErr } = await supabase.from('calendar_posts').update({ graphic }).eq('id', row.id)
    if (gErr) throw new Error(`Graphic link failed for ${bp.date}: ${gErr.message}`)
    console.log(`[✓] ${bp.date} ${BP_TIME} · ${bp.title} → ${graphic}`)
  }

  console.log('\nDone. Regenerate reminders next.')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
