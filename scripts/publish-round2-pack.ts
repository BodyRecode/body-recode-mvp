/**
 * Publishes the Round 2 launch pack to /public/docs/ads/ so the Paid Ads tab's
 * "View .md" and "View .pdf" buttons resolve.
 *
 * WHY THIS EXISTS. Those buttons link to
 * `br-round2-two-streams-${ROUND2_PACK_VERSION}.{md,pdf}`, so bumping the
 * version constant silently 404s them - which is exactly what happened when the
 * pack went to v2.0 on 25 Aug 2026. Worse, the published v1.9 .md was a copy
 * taken on 14 Aug and had been serving copy eight days older than the pack ever
 * since, with nothing to say so.
 *
 * I checked for an existing builder before writing this one, per
 * feedback_generated_assets_need_a_builder: nothing in scripts/ or in
 * 07_ADS/_creative_build/ writes these filenames.
 *
 * NOT the same artefact as 2026-09_ROUND2_ADS_for_approval.pdf, which is Kade's
 * review doc and is owned by build_round2_review.py in Dropbox. This publishes
 * the PACK itself, verbatim.
 *
 * Run: npx tsx scripts/publish-round2-pack.ts
 */
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const PACK = '/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_ADS/BR_ROUND2_TWO_STREAMS.md'
const STRATEGY = 'src/app/dashboard/business/strategy/page.tsx'
const OUT_DIR = 'public/docs/ads'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const TMP = '/private/tmp/claude-501/-Users-kadedunstone/10e457ab-a05a-4cf6-bd57-ec3fb1a02118/scratchpad/round2-pack.html'

// Read the version from the dashboard rather than passing it in, so the links
// and the files cannot disagree.
const version = readFileSync(STRATEGY, 'utf8').match(/ROUND2_PACK_VERSION = '([^']+)'/)?.[1]
if (!version) throw new Error('ROUND2_PACK_VERSION not found in ' + STRATEGY)

const md = readFileSync(PACK, 'utf8')
copyFileSync(PACK, `${OUT_DIR}/br-round2-two-streams-${version}.md`)

// Minimal markdown render. The pack is headings, paragraphs, blockquotes,
// tables and bold - no images - so a full markdown library is not worth pulling
// in for one document.
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const inline = (t: string) => esc(t)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  .replace(/`(.+?)`/g, '<code>$1</code>')

const html: string[] = []
let inQuote = false
for (const raw of md.split('\n')) {
  const line = raw.trimEnd()
  const quote = line.startsWith('>')
  if (quote && !inQuote) { html.push('<blockquote>'); inQuote = true }
  if (!quote && inQuote) { html.push('</blockquote>'); inQuote = false }
  const t = quote ? line.replace(/^>\s?/, '') : line
  if (!t.trim()) { if (!inQuote) html.push(''); continue }
  const h = t.match(/^(#{1,4})\s+(.*)$/)
  if (h) { const n = h[1].length; html.push(`<h${n}>${inline(h[2])}</h${n}>`); continue }
  if (/^[-*]\s+/.test(t)) { html.push(`<p class="li">&bull; ${inline(t.replace(/^[-*]\s+/, ''))}</p>`); continue }
  if (/^---+$/.test(t)) { html.push('<hr>'); continue }
  html.push(`<p>${inline(t)}</p>`)
}
if (inQuote) html.push('</blockquote>')

writeFileSync(TMP, `<!doctype html><html><head><meta charset="utf-8"><title>Round 2 pack ${version}</title><style>
  @page { size: A4; margin: 16mm; }
  body { font: 12px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1A1A1A; }
  h1 { font-size: 26px; letter-spacing: -0.03em; margin: 0 0 4px; }
  h2 { font-size: 18px; letter-spacing: -0.02em; margin: 26px 0 8px; padding-top: 10px; border-top: 2px solid #1B6DFC; }
  h3 { font-size: 15px; margin: 20px 0 6px; }
  h4 { font-size: 13px; margin: 14px 0 4px; color: #4A4A4A; }
  p { margin: 0 0 8px; } .li { margin-left: 14px; }
  blockquote { margin: 8px 0 12px; padding: 10px 14px; background: #F7F8FA; border-left: 3px solid #1B6DFC; }
  blockquote p { margin: 0 0 6px; }
  code { background: #F0F1F4; padding: 1px 4px; border-radius: 3px; font-size: 11px; }
  hr { border: 0; border-top: 1px solid #E5E5E5; margin: 18px 0; }
</style></head><body>${html.join('\n')}</body></html>`)

execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer',
  `--print-to-pdf=${OUT_DIR}/br-round2-two-streams-${version}.pdf`, TMP])

console.log(`published br-round2-two-streams-${version}.{md,pdf}`)
