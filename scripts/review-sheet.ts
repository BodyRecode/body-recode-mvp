// Build a visual review sheet for scheduled posts and open it.
//
// Standing rule from Kade, 20 Aug 2026: nothing gets populated into the content
// calendar until he has seen it on screen. A terminal dry run is not a review -
// he needs the graphic and the caption as they will actually appear.
//
// Run: npx tsx --env-file=.env.local scripts/review-sheet.ts [--brand=personal_brand]
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const brandArg = process.argv.find(a => a.startsWith('--brand='))
const BRAND = brandArg ? brandArg.split('=')[1] : 'personal_brand'
const OUT = `/private/tmp/claude-501/-Users-kadedunstone/a957f6f2-3385-4ca0-b65f-aa046fb50c30/scratchpad/review-${BRAND}.html`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function main() {
  const { data } = await db.from('calendar_posts')
    .select('date, time, type, title, caption, graphic, scheduled_publish_at, posted_at')
    .eq('brand', BRAND).not('scheduled_publish_at', 'is', null)
    .order('date', { ascending: true })
  const rows = (data ?? []) as Array<Record<string, string | null>>
  if (!rows.length) return console.log('Nothing scheduled for', BRAND)

  const cards = rows.map((p, i) => {
    const slides = (p.graphic ?? '').split(',').map(s => s.trim()).filter(Boolean)
    const fmt = slides.length > 1 ? `Carousel · ${slides.length} slides` : 'Single card'
    const imgs = slides.map(u => `<img src="https://bodyrecode.au${u}">`).join('')
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(`${p.date}T00:00:00`).getDay()]
    const caption = (p.caption ?? '').split('\n').filter(l => l.trim())
      .map(l => l.trim().startsWith('#') ? `<p class="tags">${esc(l)}</p>` : `<p>${esc(l)}</p>`).join('')
    return `<article${p.posted_at ? ' class="done"' : ''}>
      <div class="when"><b>${i + 1}</b><span>${day} ${p.date}</span><span>${p.time ?? ''}</span>
        <em>${fmt}</em>${p.posted_at ? '<span class="live">PUBLISHED</span>' : ''}</div>
      <div class="pics">${imgs}</div>
      <div class="copy"><h3>${esc(p.title ?? '')}</h3>${caption}</div>
    </article>`
  }).join('')

  writeFileSync(OUT, `<style>
body{background:#faf9f7;font-family:-apple-system,sans-serif;padding:26px;max-width:1180px;margin:0 auto;color:#1a1a1a}
h1{font-size:24px;margin:0 0 4px}.sub{color:#6b6b6b;font-size:14px;margin:0 0 22px;line-height:1.6}
article{display:grid;grid-template-columns:120px 300px 1fr;gap:22px;background:#fff;border:1px solid #e6e3de;
border-radius:14px;padding:20px 22px;margin-bottom:14px;align-items:start}
article.done{opacity:.55}
.when{font-size:12px;color:#6b6b6b;display:flex;flex-direction:column;gap:3px}
.when b{font-size:20px;color:#1a1a1a}
.when em{font-style:normal;font-size:11px;color:#9a9a9a;margin-top:4px}
.when .live{margin-top:6px;font-size:10px;font-weight:800;color:#1a7f42;background:#e9f7ef;padding:3px 7px;border-radius:99px;align-self:flex-start}
.pics{display:flex;gap:6px;overflow-x:auto}
.pics img{width:${'${slides}'};height:auto;max-width:300px;border-radius:8px;border:1px solid #e6e3de;display:block;flex:none}
.copy h3{font-size:16px;margin:0 0 10px}
.copy p{font-size:14px;line-height:1.6;color:#4a4a4a;margin:0 0 8px}
.copy p.tags{color:#9a9a9a;font-size:12px}
</style>
<h1>${BRAND.replace('_', ' ')} · ${rows.length} scheduled</h1>
<p class="sub">Everything currently queued to publish, in order. Nothing else fires.<br>
To stop one: clear <b>scheduled_publish_at</b> on that row in the Content Calendar.</p>${cards}`
    .replace('${slides}', '300px'))

  execSync(`open "${OUT}"`)
  console.log(`Review sheet opened: ${rows.length} posts for ${BRAND}`)
}
main()
