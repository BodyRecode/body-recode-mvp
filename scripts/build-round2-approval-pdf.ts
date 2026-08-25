/**
 * Rebuilds 2026-09_ROUND2_ADS_for_approval.pdf from the launch pack.
 *
 * The PDF is what Kade actually reads when uploading to Meta, and it had no
 * builder - the previous one was printed from a page that no longer exists, so
 * when the pack was corrected on 25 Aug 2026 the PDF silently became the older,
 * wrong copy. Same trap as feedback_generated_assets_need_a_builder.
 *
 * Run: npx tsx scripts/build-round2-approval-pdf.ts
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const MD = '/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_ADS/BR_ROUND2_TWO_STREAMS.md'
const OUT = '/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_ADS/2026-09_ROUND2_ADS_for_approval.pdf'
const CREATIVE = '/Users/kadedunstone/body-recode-mvp/public/creative/round2'
const TMP = '/private/tmp/claude-501/-Users-kadedunstone/10e457ab-a05a-4cf6-bd57-ec3fb1a02118/scratchpad/round2-approval.html'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

// Only the seven that actually go up. The pack holds alternates too.
const LIVE: Record<string, string> = {
  A1: 'a1-wrong-one', A2: 'a2-four-in-ten', A3: 'a3-under-recovering',
  B1: 'b1-eighteen', B2: 'b2-wrong-question', B3: 'b3-eight-weeks',
  M1: 'm1-one-in-25',
}
const STREAM: Record<string, string> = {
  A1: 'Stream A · Neurowellness', A2: 'Stream A · Neurowellness', A3: 'Stream A · Neurowellness',
  B1: 'Stream B · Readiness', B2: 'Stream B · Readiness', B3: 'Stream B · Readiness',
  M1: 'Metabolic · run one only',
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const quoted = (blk: string, label: string) =>
  blk.includes(label) ? blk.split(label)[1].split('\n**')[0].split('\n###')[0] : ''
const unquote = (t: string) =>
  t.split('\n').map(l => l.replace(/^>\s?/, '')).join('\n').trim()

const md = readFileSync(MD, 'utf8')
const cards: string[] = []

for (const blk of md.split('\n### ').slice(1)) {
  const ad = blk.split(' ·')[0].trim()
  const slug = LIVE[ad]
  if (!slug) continue
  const title = blk.split('\n')[0].split('·').slice(1).join('·').trim()
  const headline = unquote(quoted(blk, '**Headline**'))
  const primary = unquote(quoted(blk, '**Primary text**'))
  const linkDesc = (blk.split('**Link description**')[1] ?? '').split('\n')[0].replace(/^\s*·\s*/, '').trim()

  const img = `${CREATIVE}/${slug}.png`
  const imgTag = existsSync(img)
    ? `<img src="data:image/png;base64,${readFileSync(img).toString('base64')}" alt="${ad}">`
    : `<div class="noimg">creative not found: ${slug}.png</div>`

  cards.push(`
  <section class="ad">
    <div class="meta"><span class="stream">${esc(STREAM[ad])}</span><span class="slug">${esc(ad)} · ${esc(slug)}</span></div>
    <h2>${esc(title)}</h2>
    <div class="shot">${imgTag}</div>
    <p class="lbl">Headline</p>
    <p class="headline">${esc(headline)}</p>
    <p class="lbl">Primary text</p>
    <div class="primary">${primary.split('\n\n').map(p => `<p>${esc(p.trim())}</p>`).join('')}</div>
    <p class="lbl">Link description</p>
    <p class="linkdesc">${esc(linkDesc)}</p>
    <p class="lbl">Destination</p>
    <p class="dest">bodyrecode.au/decode?utm_source=meta&amp;utm_campaign=funnelb_broad_r2&amp;utm_content=${esc(slug)}</p>
  </section>`)
}

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Round 2 Ads</title><style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font: 13px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1A1A1A; margin: 0; }
  h1 { font-size: 30px; letter-spacing: -0.03em; margin: 0 0 6px; }
  .sub { color: #6B6B6B; margin: 0 0 4px; }
  .warn { background: #FFF6E5; border: 1px solid #E8C97A; border-radius: 8px; padding: 12px 14px; margin: 18px 0 0; font-size: 12.5px; }
  .ad { page-break-before: always; border-top: 3px solid #1B6DFC; padding-top: 14px; }
  /* The cover keeps its own page. It was sharing page 1 with the first ad, and
     the title block plus the routing note leave under 151mm - not enough for a
     205mm creative, so ad A1's image jumped to page 2 and stranded its heading
     on a half-empty page. Ads 2-7 were always fine because they start fresh. */
  .meta { display: flex; justify-content: space-between; font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #1B6DFC; }
  .meta .slug { color: #9A9A9A; }
  h2 { font-size: 21px; letter-spacing: -0.02em; margin: 6px 0 12px; }
  /* THE CREATIVE GETS ITS OWN PAGE.
     At 360px wide the 10px labels inside the scorecard card were too small to
     read at normal zoom, which defeats the point of an approval doc - the card
     is the thing being checked. But these are 4:5 (1080x1350), so full column
     width overflows an A4 page and leaves a blank one behind it. Its own page
     at full width is the only way to get both: readable card, no gap. */
  .shot { page-break-after: always; }
  /* 205mm, NOT the full 232mm the page allows. The stream label and the ad
     title sit above it, so a taller image cannot fit beneath them and Chrome
     pushes it to the next page - leaving the heading stranded on a blank one.
     At 4:5 this lands about 164mm wide, still far bigger than the 360px that
     made the scorecard card unreadable. */
  /* EXPLICIT WIDTH, not width:100% + max-height. With max-height and
     object-fit:contain Chrome laid the box out at the image's intrinsic height
     first, letterboxed the picture inside it, and paginated on the box - so the
     image still jumped to its own page and stranded the heading on a blank one.
     164mm at 4:5 is 205mm tall, which fits under the label and title with room
     to spare, and is still far bigger than the 360px that made the scorecard
     card unreadable. */
  img { width: 164mm; height: auto; display: block; border: 1px solid #E5E5E5; border-radius: 8px; margin: 0; }
  .noimg { padding: 20px; background: #FAFAFA; border: 1px dashed #CCC; color: #9A9A9A; margin-bottom: 14px; }
  .lbl { font-size: 9.5px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #8A8A8E; margin: 14px 0 4px; }
  .headline { font-size: 15px; font-weight: 800; margin: 0; }
  .primary p { margin: 0 0 8px; }
  .linkdesc, .dest { margin: 0; }
  .dest { font-family: ui-monospace, Menlo, monospace; font-size: 11px; color: #1056D6; word-break: break-all; }
</style></head><body>
  <h1>Round 2 · the copy to upload</h1>
  <p class="sub">Body Recode · seven cold ads · generated from BR_ROUND2_TWO_STREAMS.md</p>
  <div class="warn"><strong>Every ad points at /decode.</strong> The Body Decode replaced the 14-Day Challenge on 24 August 2026. /challenge still redirects, but uploading it would make a retired URL the campaign destination and the pixel would learn on a redirect.</div>
  ${cards.join('\n')}
</body></html>`

writeFileSync(TMP, html)
execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${OUT}`, TMP])
console.log(`built ${OUT} from ${cards.length} ads`)
