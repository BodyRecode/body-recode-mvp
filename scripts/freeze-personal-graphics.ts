// Freeze personal-brand card graphics from the live-render route into static
// PNGs, and repoint the calendar rows at them.
//
// Why this exists. @kade_dunstone_ posts store their graphic as an
// /api/content/graphic?style=personal... URL, which renders on demand. That is
// fine for the dashboard preview and useless for publishing: Meta fetches the
// image itself from its own servers, so it needs a plain static file. The
// publisher rejects live-render URLs outright rather than handing Meta a link it
// cannot use.
//
// So when auto-publishing was switched on for the personal account on
// 2026-08-20, it had nothing it could actually send - 66 of 71 posts were
// live-render. This closes that gap.
//
// Idempotent: rows already pointing at a static file are skipped, and an
// existing PNG is not re-fetched unless --force is passed.
//
// Run: npx tsx --env-file=.env.local scripts/freeze-personal-graphics.ts [--force] [--limit=N]
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const ORIGIN = 'https://bodyrecode.au'
const OUT_DIR = join(process.cwd(), 'public', 'calendar')
const LIVE = '/api/content/graphic'
const force = process.argv.includes('--force')
const limitArg = process.argv.find(a => a.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity

const slug = (s: string) =>
  (s || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'post'

async function fetchPng(url: string, tries = 3): Promise<Buffer> {
  let lastErr: unknown
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const type = res.headers.get('content-type') ?? ''
      if (!type.includes('image/png')) throw new Error(`content-type ${type}`)
      const buf = Buffer.from(await res.arrayBuffer())
      // A truncated or error-page response would still be "a file". Check the
      // PNG magic bytes so we never repoint a row at a broken image.
      if (buf.length < 1000 || buf[0] !== 0x89 || buf[1] !== 0x50) throw new Error('not a valid PNG')
      return buf
    } catch (e) {
      lastErr = e
      await new Promise(r => setTimeout(r, 800 * (i + 1)))
    }
  }
  throw lastErr
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const { data, error } = await db
    .from('calendar_posts')
    .select('id, date, title, graphic')
    .eq('brand', 'personal_brand')
    .eq('platform', 'instagram')
    .order('date', { ascending: true })
  if (error) throw error

  const rows = (data ?? []).filter(r => (r.graphic ?? '').includes(LIVE)).slice(0, limit)
  console.log(`${rows.length} personal posts still on live-render\n`)

  let frozen = 0, reused = 0, failed = 0
  for (const row of rows as Array<{ id: string; date: string; title: string | null; graphic: string }>) {
    const slides = row.graphic.split(',').map(s => s.trim()).filter(Boolean)
    const out: string[] = []
    let rowFailed = false

    for (const [i, raw] of slides.entries()) {
      if (!raw.includes(LIVE)) { out.push(raw); continue } // already static, keep as-is
      const name = `pb-${row.date}_${slug(row.title ?? '')}${slides.length > 1 ? `-s${i + 1}` : ''}.png`
      const dest = join(OUT_DIR, name)
      const publicPath = `/calendar/${name}`

      if (existsSync(dest) && !force) { out.push(publicPath); reused++; continue }
      try {
        const url = raw.startsWith('http') ? raw : `${ORIGIN}${raw}`
        writeFileSync(dest, await fetchPng(url))
        out.push(publicPath)
        frozen++
      } catch (e) {
        console.log(`  FAILED ${row.date} slide ${i + 1}: ${e instanceof Error ? e.message : String(e)}`)
        rowFailed = true
        failed++
        break
      }
    }

    // All-or-nothing per row. A half-repointed carousel would publish with
    // missing slides, which is worse than leaving the row alone.
    if (rowFailed) continue
    const { error: updErr } = await db.from('calendar_posts').update({ graphic: out.join(',') }).eq('id', row.id)
    if (updErr) { console.log(`  DB update failed ${row.date}: ${updErr.message}`); failed++; continue }
    console.log(`  ${row.date}  ${out.length} slide${out.length > 1 ? 's' : ''}  ${String(row.title ?? '').slice(0, 44)}`)
  }

  console.log(`\nfrozen ${frozen}, reused ${reused}, failed ${failed}`)
  console.log('Commit public/calendar/pb-*.png and deploy, or Meta cannot fetch them.')
}

main()
