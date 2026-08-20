// Pull real Instagram insights for every published post we have an ID for.
//
// Why this exists. Content decisions across both accounts have been made on
// instinct for months, because nothing was ever measured. @body_recode_ has 44
// posts carrying an ig_post_id and they have never once been read. This turns
// them into a benchmark, so when @kade_dunstone_ starts producing IDs (it went
// native 20 Aug 2026) the "personal lands better than business" hunch becomes a
// comparison instead of a feeling.
//
// Reads only. Writes nothing back yet.
//
// Run: npx tsx --env-file=.env.local scripts/ig-insights.ts [--brand=body_recode]
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const GRAPH = 'https://graph.facebook.com/v21.0'

const ACCOUNT_TOKEN: Record<string, string | undefined> = {
  body_recode: process.env.META_GRAPH_ACCESS_TOKEN,
  personal_brand: process.env.META_GRAPH_ACCESS_TOKEN_PB,
}

const brandArg = process.argv.find(a => a.startsWith('--brand='))
const brands = brandArg ? [brandArg.split('=')[1]] : ['body_recode', 'personal_brand']

type Row = { id: string; brand: string; date: string; type: string | null; title: string | null; ig_post_id: string }

async function insightsFor(postId: string, token: string) {
  // media_product_type tells us whether to ask for reel metrics or feed metrics;
  // asking for the wrong ones makes the whole call fail rather than skip a field.
  const meta = await fetch(`${GRAPH}/${postId}?fields=media_product_type,like_count,comments_count&access_token=${token}`)
    .then(r => r.json())
  if (meta.error) throw new Error(meta.error.message)

  const isReel = meta.media_product_type === 'REELS'
  const metrics = isReel ? 'reach,saved,shares,total_interactions' : 'reach,saved,shares,total_interactions'
  const ins = await fetch(`${GRAPH}/${postId}/insights?metric=${metrics}&access_token=${token}`).then(r => r.json())
  const out: Record<string, number> = {
    likes: meta.like_count ?? 0,
    comments: meta.comments_count ?? 0,
  }
  for (const m of ins.data ?? []) out[m.name] = m.values?.[0]?.value ?? 0
  return { isReel, ...out }
}

async function main() {
  const { data } = await db.from('calendar_posts')
    .select('id, brand, date, type, title, ig_post_id')
    .in('brand', brands)
    .not('ig_post_id', 'is', null)
    .order('date', { ascending: false })
  const rows = (data ?? []) as Row[]

  if (!rows.length) return console.log('No posts with an ig_post_id yet.')

  const results: Array<Row & { reach: number; saved: number; shares: number; likes: number; comments: number; isReel: boolean }> = []
  let failed = 0

  for (const row of rows) {
    const token = ACCOUNT_TOKEN[row.brand]
    if (!token) { failed++; continue }
    try {
      const i = await insightsFor(row.ig_post_id, token)
      results.push({ ...row, reach: i.reach ?? 0, saved: i.saved ?? 0, shares: i.shares ?? 0, likes: i.likes, comments: i.comments, isReel: i.isReel })
    } catch (e) {
      failed++
      if (failed <= 3) console.log(`  skip ${row.date}: ${e instanceof Error ? e.message.slice(0, 90) : e}`)
    }
  }

  if (!results.length) {
    console.log(`\nNo insights returned (${failed} failed).`)
    console.log('\nAlmost certainly the missing permission, not the code. Reading insights needs')
    console.log('instagram_manage_insights, which is NOT in the four permissions either token was')
    console.log('generated with. Regenerate with it added and the same call works. If the error')
    console.log('says the ACCOUNT id does not exist, the local .env copy of the token is just stale;')
    console.log('production has its own and is unaffected.')
    return
  }

  const avg = (xs: number[]) => xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0
  const line = (label: string, set: typeof results) =>
    console.log(`${label.padEnd(22)} ${String(set.length).padStart(3)}  ${String(avg(set.map(r => r.reach))).padStart(7)}  ${String(avg(set.map(r => r.saved))).padStart(6)}  ${String(avg(set.map(r => r.shares))).padStart(6)}  ${String(avg(set.map(r => r.likes))).padStart(6)}`)

  console.log(`\nRead ${results.length} posts (${failed} skipped)\n`)
  console.log(`${''.padEnd(22)} ${'n'.padStart(3)}  ${'reach'.padStart(7)}  ${'saves'.padStart(6)}  ${'shares'.padStart(6)}  ${'likes'.padStart(6)}`)
  console.log('-'.repeat(60))

  for (const b of brands) {
    const set = results.filter(r => r.brand === b)
    if (set.length) line(b, set)
  }

  console.log('\nBY FORMAT')
  console.log('-'.repeat(60))
  line('reels', results.filter(r => r.isReel))
  line('static / carousel', results.filter(r => !r.isReel))

  console.log('\nTOP 8 BY REACH')
  console.log('-'.repeat(60))
  for (const r of [...results].sort((a, b) => b.reach - a.reach).slice(0, 8))
    console.log(`${r.date}  ${r.isReel ? 'REEL' : '    '}  reach ${String(r.reach).padStart(6)}  saves ${String(r.saved).padStart(4)}  ${String(r.title ?? '').slice(0, 40)}`)

  console.log('\nBOTTOM 4 BY REACH')
  console.log('-'.repeat(60))
  for (const r of [...results].sort((a, b) => a.reach - b.reach).slice(0, 4))
    console.log(`${r.date}  ${r.isReel ? 'REEL' : '    '}  reach ${String(r.reach).padStart(6)}  saves ${String(r.saved).padStart(4)}  ${String(r.title ?? '').slice(0, 40)}`)
  console.log()
}

main()
