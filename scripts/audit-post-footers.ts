// Which BR posts carry a "Link in bio" line, and which carry the founder tag?
import { createClient } from '@supabase/supabase-js'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const LINK = /link'?s? (is )?in (the )?bio/i
const FOUNDER = /@kade_dunstone_/

async function main() {
  const { data, error } = await db.from('calendar_posts')
    .select('id, date, type, title, caption, platform, scheduled, posted_at')
    .eq('brand', 'body_recode').gte('date', '2026-08-06').order('date')
  if (error) { console.log('ERROR', error.message); return }

  const rows = (data ?? []).filter(p => !p.posted_at)
  const feed = rows.filter(p => p.type !== 'story')
  const story = rows.filter(p => p.type === 'story')

  const report = (label: string, set: typeof rows) => {
    const withLink = set.filter(p => LINK.test(p.caption ?? ''))
    const withFounder = set.filter(p => FOUNDER.test(p.caption ?? ''))
    console.log(`\n${label}: ${set.length}`)
    console.log(`  "link in bio" present : ${withLink.length}`)
    console.log(`  founder tag present   : ${withFounder.length}`)
    return set.filter(p => !LINK.test(p.caption ?? ''))
  }

  const feedMissing = report('FEED POSTS', feed)
  report('STORIES', story)

  console.log(`\nFeed posts with NO link line (${feedMissing.length}):`)
  for (const p of feedMissing) console.log(`  ${p.date}  ${p.type.padEnd(12)} ${(p.title ?? '').slice(0, 66)}`)
}
main()
