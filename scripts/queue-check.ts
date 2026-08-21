// What is actually queued, and what is actually switched on, per account.
//
// Written 21 Aug 2026 after I told Kade "neither account has anything queued past
// 31 August" and it was false. The brand column stores 'personal_brand', not
// 'personal', so filtering on the obvious guess returns zero rows and reads as an
// empty queue rather than as a typo. Never answer "what is scheduled" from memory.
//
// Run: npx tsx --env-file=.env.local scripts/queue-check.ts
import { createClient } from '@supabase/supabase-js'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function main() {
  const { data, error } = await db.from('calendar_posts').select('*')
    .gte('date','2026-08-21').lte('date','2026-09-30').order('date')
  if (error) { console.log('ERROR', error.message); return }
  const rows: any[] = data ?? []
  for (const brand of ['body_recode','personal_brand']) {
    const b = rows.filter(r => r.brand===brand && r.type!=='story')
    const aug = b.filter(r => r.date.slice(0,10) <= '2026-08-31')
    const sep = b.filter(r => r.date.slice(0,10) >= '2026-09-01')
    console.log(`\n${brand}`)
    console.log(`  21-31 Aug: ${aug.length} feed posts`)
    console.log(`  Sept:      ${sep.length} feed posts`)
    console.log(`  last one:  ${b.at(-1)?.date.slice(0,10) ?? 'NOTHING QUEUED'}`)
    const sch = b.filter(r => r.scheduled).length
    const withGraphic = b.filter(r => r.graphic).length
    const withCaption = b.filter(r => r.caption && r.caption.length > 40).length
    console.log(`  scheduled to auto-publish: ${sch} of ${b.length}`)
    console.log(`  has a graphic: ${withGraphic}   has a real caption: ${withCaption}`)
    for (const r of b) console.log(`     ${r.date.slice(0,10)}  sched=${r.scheduled?'Y':'n'} gfx=${r.graphic?'Y':'n'}  ${(r.title??'').slice(0,44)}`)
  }
  const brands = [...new Set(rows.map(r=>r.brand))]
  console.log(`\nbrand values present: ${JSON.stringify(brands)}`)
}
main()
