// Ingest filmed reels from the Dropbox drop folder into the content calendar.
//
// Reads every .mp4 in REELS/03_READY_TO_POST, uploads it to the public Supabase
// `videos` bucket, pulls a cover frame with ffmpeg, and attaches both to the
// matching calendar_posts row. After this the reel is a schedulable post like
// any other: video_url set, graphic replaced by a real cover frame instead of
// the TO FILM placeholder.
//
// Filename drives the match: YYYY-MM-DD_REEL_ShortTitle_vN.mp4, where the date
// is the PUBLISH date. No date in the name means no match, deliberately - a
// silent guess about which slot a video belongs in is worse than an error.
//
// Validates before uploading, because Meta rejects reels quietly and slowly:
//   - portrait (9:16-ish). A landscape reel gets cropped to nonsense.
//   - 3 to 90 seconds. Scripts target 30-45.
//   - under the bucket's 500MB limit.
//
// Run: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/ingest-reels.ts
//      add --dry to validate without uploading.

import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const DROP = '/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_MARKETING/03_ORGANIC_INSTAGRAM/REELS/03_READY_TO_POST'
const BUCKET = 'videos'
const PREFIX = 'reels'
const DRY = process.argv.includes('--dry')

interface Probe { width: number; height: number; duration: number }

function probe(file: string): Probe {
  const out = execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height:format=duration',
    '-of', 'json', file,
  ]).toString()
  const j = JSON.parse(out)
  return {
    width: j.streams?.[0]?.width ?? 0,
    height: j.streams?.[0]?.height ?? 0,
    duration: Number(j.format?.duration ?? 0),
  }
}

function coverFrame(file: string, at: number): Buffer {
  const dir = mkdtempSync(join(tmpdir(), 'reelcover-'))
  const out = join(dir, 'cover.jpg')
  execFileSync('ffmpeg', ['-v', 'error', '-ss', String(at), '-i', file, '-frames:v', '1', '-q:v', '3', out])
  return readFileSync(out)
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  const db = createClient(url, key)

  let files: string[]
  try {
    files = readdirSync(DROP).filter(f => f.toLowerCase().endsWith('.mp4'))
  } catch {
    console.error(`Drop folder not found: ${DROP}`)
    process.exit(1)
  }
  if (!files.length) {
    console.log(`Nothing to ingest. Drop finished reels in:\n  ${DROP}`)
    return
  }

  for (const f of files) {
    const path = join(DROP, f)
    const date = f.match(/^(\d{4}-\d{2}-\d{2})_/)?.[1]
    if (!date) { console.log(`SKIP  ${f}\n      no leading YYYY-MM-DD, cannot tell which slot this is`); continue }

    const { width, height, duration } = probe(path)
    const sizeMb = statSync(path).size / 1e6
    const problems: string[] = []
    if (height <= width) problems.push(`not portrait (${width}x${height})`)
    if (duration < 3 || duration > 90) problems.push(`duration ${duration.toFixed(1)}s outside 3-90s`)
    if (sizeMb > 500) problems.push(`${sizeMb.toFixed(0)}MB over the 500MB bucket limit`)
    if (problems.length) { console.log(`FAIL  ${f}\n      ${problems.join('; ')}`); continue }

    const { data: rows, error: findErr } = await db.from('calendar_posts')
      .select('id, title, notes')
      .eq('brand', 'body_recode').eq('date', date).neq('type', 'story')
      .like('notes', 'REEL%')
    if (findErr) throw findErr
    if (!rows?.length) { console.log(`SKIP  ${f}\n      no reel slot on ${date}`); continue }
    if (rows.length > 1) { console.log(`SKIP  ${f}\n      ${rows.length} reel slots on ${date}, ambiguous`); continue }
    const row = rows[0]

    console.log(`${DRY ? 'DRY   ' : 'OK    '}${f}`)
    console.log(`      ${width}x${height}  ${duration.toFixed(1)}s  ${sizeMb.toFixed(1)}MB  -> ${row.title.slice(0, 52)}`)
    if (DRY) continue

    // Video. upsert so a re-cut with the same filename replaces cleanly.
    const videoKey = `${PREFIX}/${f}`
    const { error: upErr } = await db.storage.from(BUCKET)
      .upload(videoKey, readFileSync(path), { contentType: 'video/mp4', upsert: true })
    if (upErr) throw upErr
    const videoUrl = db.storage.from(BUCKET).getPublicUrl(videoKey).data.publicUrl

    // Cover frame at 1s, past any hard cut on the very first frame.
    const coverKey = `${PREFIX}/covers/${f.replace(/\.mp4$/i, '')}.jpg`
    const { error: covErr } = await db.storage.from(BUCKET)
      .upload(coverKey, coverFrame(path, Math.min(1, duration / 2)), { contentType: 'image/jpeg', upsert: true })
    if (covErr) throw covErr
    const coverUrl = db.storage.from(BUCKET).getPublicUrl(coverKey).data.publicUrl

    const { error: updErr } = await db.from('calendar_posts')
      .update({ video_url: videoUrl, graphic: coverUrl }).eq('id', row.id)
    if (updErr) throw updErr
    console.log(`      attached, placeholder replaced by cover frame`)
  }

  if (!DRY) console.log(`\nDone. These are now schedulable like any other post.`)
}

main().catch(e => { console.error(e); process.exit(1) })
