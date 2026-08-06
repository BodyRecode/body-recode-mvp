// Remove the "nothing to buy at the end of it" claim from every unpublished row.
//
// Blueprint went live 3 Aug and challenge -> Blueprint is the ascension path, so
// the claim is untrue. Saying nothing is for sale and then selling something is
// the fastest way to burn the trust the rest of the campaign is built to earn.
// "Nothing to pay to get the read" is true, is just as strong, and survives
// contact with the Blueprint offer.
//
// Run: npx tsx --env-file=.env.local scripts/fix-nothing-to-buy.ts [--dry]
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const DRY = process.argv.includes('--dry')

// Ordered: longest and most specific first, so a broad rule never eats a
// sentence a narrower rule would have handled better.
const REWRITES: [RegExp, string][] = [
  [/Fourteen days,? free,? and there is nothing to buy at the end of it\./gi,
   'Fourteen days, free, and nothing to pay to get the read.'],
  // Must precede the bare "Free, and nothing to buy" rule, which would otherwise
  // match mid-sentence and leave a capitalised "Free." stranded after a comma.
  [/Fourteen days,? free,? and nothing to buy at the end\./gi,
   'Fourteen days, free, and nothing to pay to get the read.'],
  [/Free,? and nothing to buy at the end\./gi, 'Free. Nothing to pay to get the read.'],
  [/Free\. Nothing to buy at the end\./gi, 'Free. Nothing to pay to get the read.'],
  [/Nothing to buy at the end of it\./gi, 'Nothing to pay to get the read.'],
  [/Nothing to buy at the end\./gi, 'Nothing to pay to get the read.'],
  [/Nothing to buy\./gi, 'Nothing to pay for the read.'],
]

const apply = (s: string) => REWRITES.reduce((acc, [re, to]) => acc.replace(re, to), s)

async function main() {
  const { data, error } = await db.from('calendar_posts')
    .select('id, date, type, title, caption, scheduled, posted_at')
    .gte('date', '2026-08-06')
  if (error) { console.log('ERROR', error.message); return }

  let n = 0, skipped = 0
  for (const p of data ?? []) {
    if (p.posted_at) continue
    const cap = p.caption ?? '', title = p.title ?? ''
    if (!/nothing to (buy|sell)/i.test(`${cap} ${title}`)) continue

    if (p.scheduled) { console.log(`SKIP ${p.date}: already scheduled, not overwriting`); skipped++; continue }

    const newCap = apply(cap), newTitle = apply(title)
    console.log(`\n${p.date} ${p.type}`)
    const before = `${cap} ${title}`.match(/[^.!?]*nothing to (buy|sell)[^.!?]*[.!?]/i)?.[0]?.trim()
    console.log(`  before: ${before}`)
    console.log(`  after:  ${apply(before ?? '')}`)

    if (!DRY) {
      const { error: e } = await db.from('calendar_posts')
        .update({ caption: newCap, title: newTitle }).eq('id', p.id)
      if (e) { console.log(`  ERROR ${e.message}`); continue }
    }
    n++
  }
  console.log(`\n${DRY ? '[dry run] ' : ''}${n} rows corrected${skipped ? `, ${skipped} skipped (scheduled)` : ''}.`)
  if (!DRY) console.log('Story PNGs were re-rendered separately - the text is baked into the image.')
}
main()
