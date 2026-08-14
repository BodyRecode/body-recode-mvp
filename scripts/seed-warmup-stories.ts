// Seed the warm-up stories, 15-31 Aug. ONE a day.
//
// Stories are phone-manual - the Graph API strips link stickers, polls and
// countdowns - so these rows are a schedule and a checklist, not something the
// publisher will fire. The sticker instruction lives in notes.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const DRY = process.argv.includes('--dry')

async function main(){
  const { stories } = JSON.parse(readFileSync('scripts/ig-generator/warmup-stories.json','utf8'))
  // clear any previous warm-up story rows (never touches published)
  if (!DRY) {
    await db.from('calendar_posts').delete()
      .eq('brand','body_recode').eq('phase','warmup').eq('type','story').is('posted_at',null)
  }
  for (const s of stories) {
    const row = {
      brand:'body_recode', platform:'instagram', phase:'warmup', type:'story',
      date:s.date, time:'08:00',
      title:`Story · ${s.slug}`,
      graphic:s.file,
      notes:`ONE story today. Post by hand. STICKER: ${s.sticker}  ·  Bottom third of the card is left empty for it. Polls and questions do NOT reach ManyChat (story-reply automation unbuilt) - the tap is the point, not the answer.`,
    }
    console.log(`  ${s.date}  ${s.sticker.slice(0,52)}`)
    if (!DRY) await db.from('calendar_posts').insert(row)
  }
  console.log(`\n${DRY?'[dry] ':''}${stories.length} stories, one a day.`)
}
main()
