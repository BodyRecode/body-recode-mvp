// Attach the ad-language feed graphics to their calendar_posts rows.
// Carousels are stored comma-separated, which is how the dashboard already
// parses multi-slide posts (see graphicUrls in the strategy page).
//
// Run: set -a && source .env.local && set +a && npx tsx scripts/wire-campaign-graphics.ts
import { createClient } from '@supabase/supabase-js'
import { readdirSync } from 'node:fs'

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const files = readdirSync('public/calendar').filter(f => f.startsWith('br-2026-08-') && f.endsWith('.png'))
  const map: Record<string, string[]> = {}
  for (const f of files) {
    const m = f.match(/^(br-2026-08-\d{2})_[a-z]+(?:-s(\d+))?\.png$/)
    if (!m) continue
    ;(map[m[1].replace('br-', '')] ??= []).push(f)
  }
  for (const date of Object.keys(map).sort()) {
    const fs = map[date].sort((a, b) =>
      Number(a.match(/-s(\d+)/)?.[1] ?? 0) - Number(b.match(/-s(\d+)/)?.[1] ?? 0))
    const graphic = fs.map(f => `/calendar/${f}`).join(',')
    const { data, error } = await db.from('calendar_posts')
      .update({ graphic })
      .eq('brand', 'body_recode').eq('platform', 'instagram').eq('phase', 'ads')
      .neq('type', 'story').eq('date', date).select('id, title')
    if (error) throw error
    console.log(`${date}  ${String(fs.length).padStart(2)} slide(s) -> ${data?.length ?? 0} row  ${data?.[0]?.title?.slice(0, 44) ?? 'NO MATCH'}`)
  }
}
main().catch(e => { console.error(e); process.exit(1) })
