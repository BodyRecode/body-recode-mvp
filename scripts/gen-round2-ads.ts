// Generates the ROUND2_ADS literal for the Paid Ads tab from the launch pack,
// so the dashboard cannot drift from the doc. Same contract as Round 1.
//
// Run: npx tsx scripts/gen-round2-ads.ts
// Then paste the output over the ROUND2_ADS block in
// src/app/dashboard/business/strategy/page.tsx
import { readFileSync } from 'node:fs'

const MD = '/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_ADS/BR_ROUND2_TWO_STREAMS.md'

const META: Record<string, [string, string, string, string]> = {
  A1: ['a1-wrong-one', 'The wrong one', 'streamA', 'Women 40+, neurowellness'],
  A2: ['a2-four-in-ten', 'Four in ten', 'streamA', 'Women 40+, neurowellness'],
  A3: ['a3-under-recovering', 'Under-recovering', 'streamA', 'Women 40+, neurowellness'],
  B1: ['b1-eighteen', 'Eighteen per cent', 'streamB', 'Women 40+, readiness'],
  B2: ['b2-wrong-question', 'The wrong question', 'streamB', 'Women 40+, readiness'],
  B3: ['b3-eight-weeks', 'Eight weeks away', 'streamB', 'Women 40+, readiness'],
  M1: ['m1-one-in-25', 'One in twenty-five', 'metabolic', 'Either sex, disqualifier'],
}

const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

const md = readFileSync(MD, 'utf8')
const out: string[] = []

for (const blk of md.split('\n### ').slice(1)) {
  const ad = blk.split(' ·')[0].trim()
  const meta = META[ad]
  if (!meta) continue
  const [slug, short, layer, audience] = meta
  const headline = blk.split('**Headline**\n> ')[1].split('\n')[0].trim()
  // "> ?" and NOT ">\s?" - \s matches a newline, so \s? silently ate every
  // blank line between paragraphs and pasted the ad as one wall of text.
  // Heavy line breaks are a pre-flight rule, so that is a real defect.
  const primaryText = blk
    .split('**Primary text**')[1].split('**Link description**')[0]
    .replace(/^> ?/gm, '').trim()
  const description = blk.split('**Link description** · ')[1].split('\n')[0].trim()
  out.push(`  { slug: '${slug}', short: '${short}', layer: '${layer}', audience: '${audience}',
    img: '/creative/round2/${slug}.png',
    headline: \`${esc(headline)}\`,
    primaryText: \`${esc(primaryText)}\`,
    description: \`${esc(description)}\` },`)
}

console.log(`const ROUND2_ADS: Round1Ad[] = [\n${out.join('\n')}\n]`)
