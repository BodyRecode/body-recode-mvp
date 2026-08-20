// Generate the personal-brand card treatments the bank is short of.
//
// The format plan is 4 posts a week: one full-bleed photo, one carousel, and two
// cards, with reels replacing two of those once filming happens. Over four weeks
// that needs 4 photos and 4 carousels. What existed after filtering: 3 photos, 2
// carousels, and 33 clay cards in the one flat treatment.
//
// So this stops rationing the bank and makes the missing treatments instead:
//   full-bleed greyscale photo  - the layout Kade picked ("the whole images card")
//   solid terracotta            - the only tonal break the clay system has, and
//                                 there were ZERO standalone ones; the only two
//                                 in the library were carousel closing slides
//
// The text is the post's `title`, which is what the original card rendered. NOT
// the caption's first line - those diverge, and assuming otherwise puts the
// wrong words on the card.
//
// The eyebrow label was a render parameter and was lost when graphics were
// frozen to PNGs, so it is inferred here from the copy. Inferred labels are
// printed for review; the review sheet is the check.
//
// Greyscale is applied AFTER fetching, because /api/content/graphic renders
// through Satori, which silently ignores CSS filters.
//
// Run: npx tsx --env-file=.env.local scripts/generate-personal-cards.ts [--commit]
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const commit = process.argv.includes('--commit')
const ORIGIN = 'https://bodyrecode.au'
const OUT = 'public/calendar'

const N_PHOTO = 5
const N_SOLID = 5

/** Infer the eyebrow label from the copy. Printed for review, never silent. */
function labelFor(text: string): string {
  const t = text.toLowerCase()
  // Order matters, and every pattern must be specific enough not to fire on a
  // stray substring. An early loose /system i/ matched "system IN protection
  // mode" and labelled a nervous-system post BUILD.
  if (/\brebuild|\bidentity\b|start(ing)? over|discharg|walked away|became someone|from scratch|relationship/.test(t)) return 'REBUILD'
  if (/software|platform|no coding|built my own|rent (their )?software|co-?builder/.test(t)) return 'BUILD'
  if (/clarity|interpret|prescri|pattern recognition|\bthink|decision/.test(t)) return 'THINKING'
  return 'BODY'
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 44)

async function fetchCard(url: string, grey: boolean): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 1000 || buf[0] !== 0x89) throw new Error('not a PNG')
  if (!grey) return buf
  // Satori ignores CSS filters, so greyscale happens here or not at all.
  const tmp = `/tmp/_card_${Date.now()}.png`
  writeFileSync(tmp, buf)
  execSync(`python3 -c "from PIL import Image; Image.open('${tmp}').convert('L').convert('RGB').save('${tmp}')"`)
  return require('node:fs').readFileSync(tmp)
}

async function main() {
  const { data } = await db.from('calendar_posts')
    .select('id, date, title, caption, graphic, type')
    .eq('brand', 'personal_brand').eq('platform', 'instagram')
    .is('posted_at', null).is('scheduled_publish_at', null)
    .order('date', { ascending: true })

  const RETIRED = /co-?founder|aicm/i
  const TIME_BOUND = /\btomorrow\b|\btoday\b|\bopens\b|\blaunch/i

  // Only re-treat posts whose title is a real standalone line. A title like
  // "Post 2 - The Problem" is a filing label, not a headline.
  const candidates = ((data ?? []) as Array<Record<string, string>>).filter(p => {
    const t = p.title ?? ''
    if (!t || !p.caption?.trim()) return false
    // NEVER re-treat a carousel. Overwriting its graphic replaces five slides
    // with one card and destroys the best dwell-time asset on the account -
    // which is exactly what happened to "Three states. One body." on 20 Aug.
    if ((p.graphic ?? '').split(',').filter(Boolean).length > 1) return false
    // Filing labels, not headlines: "Thinking - Clarity Problem", "Post 2 - ..."
    if (/^Post \d|^Personal ·|^Reel -|^AICM/.test(t)) return false
    if (/^(Thinking|Body|Rebuild|AI|Contrarian|System|Connection|Identity|Arrival)\s*-\s/i.test(t)) return false
    if (RETIRED.test(`${t} ${p.caption}`) || TIME_BOUND.test(`${t} ${p.caption}`)) return false
    return t.length > 24 && t.length < 120
  })

  console.log(`${candidates.length} posts with a usable standalone headline\n`)

  // One headline, one treatment. Without this the same line came out as both a
  // photo and a solid card.
  const seen = new Set<string>()
  const unique = candidates.filter(p => {
    const k = (p.title ?? '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  const picks = unique.slice(0, N_PHOTO + N_SOLID)
  const made: Array<{ id: string; kind: string; label: string; file: string; title: string }> = []

  for (const [i, p] of picks.entries()) {
    const isPhoto = i < N_PHOTO
    // Infer from the TITLE only. Passing the caption in as well let stray words
    // from the body copy decide the label - "you can't out-train a nervous
    // system" came out THINKING because the caption happened to say "think".
    const label = labelFor(p.title)
    const sub = (p.caption ?? '').split('\n').filter(l => l.trim())[1]?.slice(0, 90) ?? ''
    const url = isPhoto
      ? `${ORIGIN}/api/content/graphic?style=personal-photo&layout=overlay&photo=${(i % 7) + 1}` +
        `&label=${encodeURIComponent(label)}&text=${encodeURIComponent(p.title)}` +
        (sub ? `&sub=${encodeURIComponent(sub)}` : '')
      : `${ORIGIN}/api/content/graphic?style=personal&theme=clay-solid` +
        `&label=${encodeURIComponent(label)}&text=${encodeURIComponent(p.title)}`

    const name = `pbx-${isPhoto ? 'photo' : 'solid'}-${slug(p.title)}.png`
    try {
      writeFileSync(`${OUT}/${name}`, await fetchCard(url, isPhoto))
      made.push({ id: p.id, kind: isPhoto ? 'full-bleed photo' : 'solid terracotta', label, file: `/calendar/${name}`, title: p.title })
      console.log(`  ${(isPhoto ? 'PHOTO' : 'SOLID').padEnd(6)} [${label.padEnd(8)}] ${p.title.slice(0, 52)}`)
    } catch (e) {
      console.log(`  FAILED ${p.title.slice(0, 40)}: ${e instanceof Error ? e.message : e}`)
    }
  }

  console.log(`\n${made.length} cards written to ${OUT}/pbx-*.png`)
  if (!commit) {
    console.log('\nNOT attached to any calendar row. Re-run with --commit to attach.')
    return
  }
  for (const m of made) {
    await db.from('calendar_posts').update({ graphic: m.file }).eq('id', m.id)
  }
  console.log(`Attached ${made.length} rows. Re-run the card audit, then the proposal sheet.`)
}

main()
