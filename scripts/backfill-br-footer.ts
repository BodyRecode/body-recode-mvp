// Write the Body Recode sign-off block into every unpublished BR Instagram
// caption, so the calendar shows what will actually publish.
//
//     → Link in bio
//
//     ↳ More from our founder → @kade_dunstone_
//
// appendBrFooter already applies this at publish time, so this changes nothing
// about what goes out. It exists so the caption you review in the dashboard is
// the caption Meta receives, instead of the footer appearing only at the last
// moment where nobody can check it.
//
// Scope, deliberately:
//   INCLUDED  brand=body_recode, platform=instagram, type != 'story', unpublished
//   EXCLUDED  LinkedIn rows ("link in bio" is meaningless off Instagram)
//   EXCLUDED  stories (text is baked into the PNG; they don't publish natively)
//   EXCLUDED  anything already published or already scheduled
//
// Run: npx tsx --env-file=.env.local scripts/backfill-br-footer.ts [--dry]
import { createClient } from '@supabase/supabase-js'
import { appendBrFooter } from '../src/lib/br-post-footer'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const DRY = process.argv.includes('--dry')

async function main() {
  const { data, error } = await db.from('calendar_posts')
    .select('id, date, type, title, caption, platform, scheduled, posted_at')
    .eq('brand', 'body_recode').eq('platform', 'instagram')
    .order('date')
  if (error) { console.log('ERROR', error.message); return }

  let changed = 0, already = 0, skipped = 0
  for (const p of data ?? []) {
    if (p.type === 'story') continue
    if (p.posted_at) continue
    if (p.scheduled) { skipped++; continue }

    const cur = p.caption ?? ''
    const next = appendBrFooter(cur)
    if (next === cur.trimEnd()) { already++; continue }

    const added = next.slice(cur.trimEnd().length).trim().split('\n').filter(Boolean)
    console.log(`${p.date}  ${p.type.padEnd(11)} ${(p.title ?? '').slice(0, 52)}`)
    console.log(`   + ${added.join(' | ')}`)

    if (!DRY) {
      const { error: e } = await db.from('calendar_posts').update({ caption: next }).eq('id', p.id)
      if (e) { console.log(`   ERROR ${e.message}`); continue }
    }
    changed++
  }

  console.log(`\n${DRY ? '[dry run] ' : ''}${changed} captions updated, ${already} already complete` +
    `${skipped ? `, ${skipped} skipped (already scheduled)` : ''}.`)
  console.log('Stories and LinkedIn rows deliberately untouched.')
}
main()
