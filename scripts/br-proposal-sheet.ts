// Visual review sheet for the September @body_recode_ posts, before scheduling.
//
// Kade's standing rule from 20 Aug: nothing enters the calendar until he has
// seen it on screen. Reads LOCAL files so it never waits on a Vercel deploy.
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const OUT = '/private/tmp/claude-501/-Users-kadedunstone/a957f6f2-3385-4ca0-b65f-aa046fb50c30/scratchpad/br-proposal.html'
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const NEURO = /\bsleep|\bstress|regulat|nervous system|recover|wired|cortisol|waking|rested|protection mode/i
const READY = /readiness|capacity|absorb|take the load|\bready\b|transitioning|depleted/i
const METAB = /insulin|carb|metabolic/i

async function main() {
  const { data } = await db.from('calendar_posts')
    .select('date, time, type, title, caption, graphic, scheduled_publish_at')
    .eq('brand', 'body_recode').eq('platform', 'instagram')
    .gte('date', '2026-09-01').lte('date', '2026-09-14').order('date')
  const rows = (data ?? []) as Array<Record<string, string | null>>

  const cards = rows.map((p, i) => {
    const t = `${p.title} ${p.caption}`
    const pillar = METAB.test(t) ? ['metabolic', '#8a6a1a', '#f6f0e6']
      : READY.test(t) ? ['readiness', '#1056D6', '#eaf1ff']
      : NEURO.test(t) ? ['neurowellness', '#1a7f42', '#e9f7ef'] : ['unmapped', '#b00', '#fee']
    const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(`${p.date}T00:00:00`).getDay()]
    const slides = (p.graphic ?? '').split(',').filter(Boolean).length
    const cap = (p.caption ?? '').split('\n').filter(l => l.trim())
      .map(l => `<p>${esc(l.trim())}</p>`).join('')
    return `<article><div class="w"><b>${i + 1}</b><span>${day} ${p.date}</span><span>07:00</span>
      <em style="background:${pillar[2]};color:${pillar[1]}">${pillar[0]}</em>
      ${slides > 1 ? `<em style="background:#eee;color:#555">carousel x${slides}</em>` : ''}</div>
      <div class="p">${(p.graphic ?? '').split(',').map(u => `<img src="file://${process.cwd()}/public${u.trim()}">`).join('')}</div>
      <div class="c"><h3>${esc(p.title ?? '')}</h3>${cap}</div></article>`
  }).join('')

  writeFileSync(OUT, `<style>
body{background:#faf9f7;font-family:-apple-system,sans-serif;padding:26px;max-width:1300px;margin:0 auto}
h1{font-size:23px;margin:0 0 4px}.s{color:#6b6b6b;font-size:13.5px;margin:0 0 20px;line-height:1.65}
.s b{color:#1a1a1a}
article{display:grid;grid-template-columns:104px 310px 1fr;gap:22px;background:#fff;border:1px solid #e6e3de;
border-radius:13px;padding:18px 20px;margin-bottom:12px;align-items:start}
.w{font-size:12px;color:#6b6b6b;display:flex;flex-direction:column;gap:3px}
.w b{font-size:19px;color:#1a1a1a}
.w em{font-style:normal;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
padding:4px 8px;border-radius:99px;margin-top:5px;text-align:center}
.p{display:flex;gap:5px;flex-wrap:wrap}
.p img{width:145px;border-radius:7px;border:1px solid #e6e3de;display:block}
.p img:only-child{width:300px}
.c h3{font-size:16px;margin:0 0 9px}.c p{font-size:14px;line-height:1.6;color:#4a4a4a;margin:0 0 8px}
</style><h1>@body_recode_ · 1 to 14 September · ${rows.length} posts</h1>
<p class="s"><b>Nothing scheduled yet.</b> The queue currently stops on 31 August and the ads restart on 1 September,
so this fills the gap paid traffic would otherwise land in.<br>
<b>Deliberately readiness-heavy.</b> The existing queue ran at zero readiness against a target of three in ten,
so the pillar had never actually reached the feed. This pulls the running average back toward 6/3/1.</p>${cards}`)
  execSync(`open "${OUT}"`)
  console.log(`Sheet opened: ${rows.length} posts, nothing scheduled.`)
}
main()
