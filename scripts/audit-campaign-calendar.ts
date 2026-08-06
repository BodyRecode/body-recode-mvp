// Audits the campaign window end to end so status is checked, not asserted.
import { createClient } from '@supabase/supabase-js'
import { existsSync } from 'node:fs'

const FROM = '2026-08-07', TO = '2026-08-31'
async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await db.from('calendar_posts')
    .select('date,time,type,phase,brand,platform,title,caption,graphic,video_url,notes,scheduled,ig_post_id')
    .gte('date', FROM).lte('date', TO).order('date')
  if (error) throw error
  const rows = data ?? []
  const br = rows.filter(r => r.brand === 'body_recode' && (r.platform ?? 'instagram') === 'instagram')
  const feed = br.filter(r => r.type !== 'story')
  const story = br.filter(r => r.type === 'story')

  const localOk = (g: string | null) => !g ? false :
    g.split(',').every(u => u.trim().startsWith('http') || existsSync('public' + u.trim()))

  const noCaption = feed.filter(r => !r.caption || r.caption.length < 40)
  const noGraphic = feed.filter(r => !r.graphic)
  const badGraphic = feed.filter(r => r.graphic && !localOk(r.graphic))
  const placeholders = feed.filter(r => (r.graphic ?? '').includes('PLACEHOLDER'))
  const stale = feed.filter(r => r.phase !== 'ads')
  const scorecard = feed.filter(r => (r.caption ?? '').toLowerCase().includes('scorecard'))
  const storyNoGfx = story.filter(r => !localOk(r.graphic))

  const days = new Set<string>()
  for (let d = new Date(FROM + 'T00:00:00Z'); d <= new Date(TO + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1))
    days.add(d.toISOString().slice(0, 10))
  const noStoryDays = [...days].filter(d => !story.some(s => s.date === d))

  console.log(`WINDOW ${FROM} -> ${TO}\n`)
  console.log(`FEED POSTS        ${feed.length}`)
  console.log(`  missing caption ${noCaption.length ? noCaption.map(r=>r.date).join(', ') : 'none'}`)
  console.log(`  missing graphic ${noGraphic.length ? noGraphic.map(r=>r.date).join(', ') : 'none'}`)
  console.log(`  broken path     ${badGraphic.length ? badGraphic.map(r=>r.date).join(', ') : 'none'}`)
  console.log(`  reel placehold. ${placeholders.length} (expected 7, replaced on ingest)`)
  console.log(`  not campaign    ${stale.length ? stale.map(r=>r.date+' '+r.phase).join(', ') : 'none'}`)
  console.log(`  mentions scorec.${scorecard.length ? scorecard.map(r=>r.date).join(', ') : 'none'}`)
  console.log(`\nSTORIES           ${story.length}`)
  console.log(`  days with none  ${noStoryDays.length ? noStoryDays.join(', ') : 'none'}`)
  console.log(`  missing graphic ${storyNoGfx.length ? storyNoGfx.map(r=>r.date).join(', ') : 'none'}`)
  console.log(`\nSCHEDULED         ${br.filter(r=>r.scheduled).length}   PUBLISHED ${br.filter(r=>r.ig_post_id).length}`)

  const other = rows.filter(r => !(r.brand === 'body_recode' && (r.platform ?? 'instagram') === 'instagram'))
  const grouped: Record<string, number> = {}
  for (const r of other) grouped[`${r.brand}/${r.platform}`] = (grouped[`${r.brand}/${r.platform}`] ?? 0) + 1
  console.log(`\nNOT TOUCHED (other brands/platforms in window)`)
  for (const [k, v] of Object.entries(grouped)) console.log(`  ${k}: ${v}`)
}
main().catch(e => { console.error(e); process.exit(1) })
