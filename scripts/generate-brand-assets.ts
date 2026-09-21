/**
 * Every logo file, generated from one definition.
 *
 * Run: npm run brand:assets
 *
 * 22 September 2026. Kade needs the mark in the file types, colours and sizes
 * a real business actually gets asked for: a printer wants vector, Instagram
 * wants a square, a browser wants a favicon, a partner's deck wants a
 * transparent PNG, and somebody will eventually need it white on a photograph.
 *
 * WHY GENERATED RATHER THAN DRAWN ONCE. The previous logo existed as two PNG
 * files, one of which had never been made, and nobody noticed for months. A
 * folder of forty hand-exported files rots the same way: the moment one
 * variant changes, the other thirty-nine are quietly wrong. This rebuilds all
 * of them from one definition in seconds, so they cannot drift apart.
 *
 * TEXT IS CONVERTED TO OUTLINES. A logo containing live text renders
 * differently on any machine without the font, which is every machine that
 * does not belong to us. The letterforms become paths here, so the file is the
 * shape rather than an instruction to find a font.
 */

import { execFileSync } from 'child_process'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const OUT = join(homedir(), 'Dropbox', '01_BODY_RECODE', '01_BRAND_ASSETS')
const FONT = join(homedir(), 'Dropbox', '01_BODY_RECODE', '06_SAAS_PLATFORM_BUILD', '_pdf_build', 'Montserrat.ttf')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

/* ── The palette, matching src/lib/brand-tokens.ts ───────────────────── */
const INK = '#141821'
const ACCENT = '#1B6DFC'
const WHITE = '#FFFFFF'

/* ── Geometry, in a 1000-unit grid so every size scales cleanly ──────── */
const BOX = 200          // the rounded square
const RADIUS = 50
const MARK_SIZE = 108    // cap height of "BR" inside the square
const WORD_SIZE = 132    // cap height of the wordmark
const GAP = 58           // between square and wordmark

type Paths = { d: string; width: number }

/** Turn a string into a single path, using Python and fontTools. */
function textToPath(text: string, sizePx: number, weight: number, letterSpacing: number): Paths {
  const py = `
import json, sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform

font = instantiateVariableFont(TTFont(${JSON.stringify(FONT)}), {"wght": ${weight}})
upem = font["head"].unitsPerEm
glyphSet = font.getGlyphSet()
cmap = font.getBestCmap()
scale = ${sizePx} / upem

pen_out = SVGPathPen(glyphSet)
x = 0.0
for ch in ${JSON.stringify(text)}:
    name = cmap.get(ord(ch))
    if name is None:
        x += ${sizePx} * 0.4
        continue
    g = glyphSet[name]
    # Flip Y (font space is up, SVG is down) and place at the running x.
    t = Transform(scale, 0, 0, -scale, x, 0)
    g.draw(TransformPen(pen_out, t))
    x += g.width * scale + ${letterSpacing}

print(json.dumps({"d": pen_out.getCommands(), "width": x - ${letterSpacing}}))
`
  const out = execFileSync('python3', ['-c', py], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  return JSON.parse(out.trim()) as Paths
}

/* ── The pieces, built once ──────────────────────────────────────────── */
const initials = textToPath('BR', MARK_SIZE, 800, -MARK_SIZE * 0.04)
const wordmark = textToPath('Body Recode', WORD_SIZE, 700, -WORD_SIZE * 0.025)

/** The rounded square with the initials centred inside it. */
function markGroup(squareFill: string, letterFill: string, x = 0): string {
  const lx = x + (BOX - initials.width) / 2
  const ly = BOX / 2 + MARK_SIZE * 0.36
  return `  <rect x="${x}" y="0" width="${BOX}" height="${BOX}" rx="${RADIUS}" fill="${squareFill}"/>
  <path transform="translate(${lx.toFixed(2)} ${ly.toFixed(2)})" d="${initials.d}" fill="${letterFill}"/>`
}

function svg(width: number, height: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width.toFixed(2)} ${height.toFixed(2)}" width="${width.toFixed(2)}" height="${height.toFixed(2)}" role="img" aria-label="Body Recode">
${body}
</svg>
`
}

/** Full lockup: square, then the name beside it. */
function lockup(squareFill: string, letterFill: string, wordFill: string): string {
  const w = BOX + GAP + wordmark.width
  const wy = BOX / 2 + WORD_SIZE * 0.36
  return svg(w, BOX,
    markGroup(squareFill, letterFill) +
    `\n  <path transform="translate(${(BOX + GAP).toFixed(2)} ${wy.toFixed(2)})" d="${wordmark.d}" fill="${wordFill}"/>`)
}

/** The square on its own, for an avatar or an app icon. */
function markOnly(squareFill: string, letterFill: string): string {
  return svg(BOX, BOX, markGroup(squareFill, letterFill))
}

/** The name on its own. */
function wordOnly(fill: string): string {
  const h = WORD_SIZE * 1.34
  return svg(wordmark.width, h, `  <path transform="translate(0 ${(h * 0.78).toFixed(2)})" d="${wordmark.d}" fill="${fill}"/>`)
}

/** A padded square with the mark centred, for a profile picture. */
function avatar(bg: string, squareFill: string, letterFill: string): string {
  const pad = 96
  const size = BOX + pad * 2
  return svg(size, size,
    `  <rect width="${size}" height="${size}" fill="${bg}"/>\n` + markGroup(squareFill, letterFill, pad).replace(/y="0"/, `y="${pad}"`).replace(/translate\(([\d.]+) ([\d.]+)\)/, (_m, a, b) => `translate(${a} ${(parseFloat(b) + pad).toFixed(2)})`))
}

/* ── What gets written ───────────────────────────────────────────────── */
type Asset = {
  name: string
  svg: string
  pngSizes?: number[]
  note: string
  /**
   * Avatars are full-bleed squares, so their padding IS the artwork. Trimming
   * one removes the very thing that makes it an avatar, which is how the first
   * run produced a 206px square from a 400px request.
   */
  keepPadding?: boolean
}

const ASSETS: Asset[] = [
  { name: 'lockup-on-light', svg: lockup(INK, WHITE, INK), pngSizes: [2400, 1200, 600, 300], note: 'The default. Use on white and on any pale background.' },
  { name: 'lockup-on-dark', svg: lockup(WHITE, INK, WHITE), pngSizes: [2400, 1200, 600, 300], note: 'For dark backgrounds. The square inverts, so the mark stays readable.' },
  { name: 'lockup-accent', svg: lockup(ACCENT, WHITE, INK), pngSizes: [2400, 1200, 600], note: 'When the brand blue is wanted and the background is pale.' },
  { name: 'lockup-all-black', svg: lockup(INK, WHITE, INK), pngSizes: [2400, 1200], note: 'One-colour black, for a printer or a partner who asks for mono.' },
  { name: 'lockup-all-white', svg: lockup(WHITE, INK, WHITE), pngSizes: [2400, 1200], note: 'One-colour white, for a photograph or a dark print.' },

  { name: 'mark-on-light', svg: markOnly(INK, WHITE), pngSizes: [1024, 512, 256, 128], note: 'The square alone.' },
  { name: 'mark-on-dark', svg: markOnly(WHITE, INK), pngSizes: [1024, 512, 256, 128], note: 'The square alone, inverted.' },
  { name: 'mark-accent', svg: markOnly(ACCENT, WHITE), pngSizes: [1024, 512, 256, 128, 64, 32, 16], note: 'The square in brand blue. This is the favicon and the app icon.' },

  { name: 'wordmark-on-light', svg: wordOnly(INK), pngSizes: [2400, 1200, 600], note: 'The name alone, where a mark would be redundant.' },
  { name: 'wordmark-on-dark', svg: wordOnly(WHITE), pngSizes: [2400, 1200, 600], note: 'The name alone, on dark.' },

  { name: 'avatar-accent', svg: avatar(ACCENT, WHITE, ACCENT), pngSizes: [1024, 512, 400, 180], keepPadding: true, note: 'Square profile picture for Instagram, LinkedIn or a directory.' },
  { name: 'avatar-ink', svg: avatar(INK, WHITE, INK), pngSizes: [1024, 512, 400, 180], keepPadding: true, note: 'Square profile picture, near-black.' },
]

function renderPng(svgPath: string, outPath: string, size: number, transparent: boolean, keepPadding = false) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:${transparent ? 'transparent' : WHITE};}
    img{display:block;width:${size}px;height:auto;}
  </style></head><body><img src="file://${svgPath}"></body></html>`
  const tmp = join(OUT, '_tmp.html')
  writeFileSync(tmp, html)
  execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--hide-scrollbars',
    transparent ? '--default-background-color=00000000' : '--default-background-color=FFFFFFFF',
    `--screenshot=${outPath}`,
    `--window-size=${size},${size}`,
    tmp,
  ], { stdio: 'ignore' })
  if (keepPadding) {
    // A full-bleed square: crop the window down to exactly the artwork box.
    execFileSync('magick', [outPath, '-crop', `${size}x${size}+0+0`, '+repage', outPath])
  } else {
    // Chrome screenshots the whole window, so trim to the artwork.
    execFileSync('magick', [outPath, '-trim', '+repage', outPath])
  }
  rmSync(tmp, { force: true })
}

function main() {
  if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true })
  mkdirSync(join(OUT, 'svg'), { recursive: true })
  mkdirSync(join(OUT, 'png'), { recursive: true })

  const lines: string[] = []
  for (const a of ASSETS) {
    const svgPath = join(OUT, 'svg', `${a.name}.svg`)
    writeFileSync(svgPath, a.svg)
    const sizes: string[] = []
    for (const size of a.pngSizes ?? []) {
      const pngPath = join(OUT, 'png', `${a.name}-${size}.png`)
      renderPng(svgPath, pngPath, size, true, a.keepPadding)
      sizes.push(String(size))
    }
    lines.push(`| \`${a.name}\` | ${a.note} | ${sizes.join(', ')} |`)
    console.log(`  ${a.name.padEnd(22)} svg + ${sizes.length} png`)
  }

  writeFileSync(join(OUT, 'README.md'), `# Body Recode logo files

Generated ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })} by \`npm run brand:assets\`.

**Rebuild rather than edit.** Every file here comes from one definition, so changing the mark means running the command again, not touching forty files. That is deliberate: the previous logo lived as two hand-made files, one of which had never been created, and nobody noticed for months.

**Use the SVG wherever you can.** It stays sharp at any size and is what a printer or a designer will ask for. The PNGs exist for the places that cannot take a vector: social profiles, some email clients, older presentation software.

**The text is outlined**, meaning the letters are shapes rather than live type. The file will look identical on a machine that does not have the font, which is every machine that is not ours.

| File | What it is for | PNG sizes |
|---|---|---|
${lines.join('\n')}

## Which one do I use

**Almost always:** \`lockup-on-light\` on anything pale, \`lockup-on-dark\` on anything dark.

**A profile picture:** \`avatar-accent\`, at 400 for most platforms.

**A favicon or app icon:** \`mark-accent\`, which is generated down to 16.

**A printer asking for one colour:** \`lockup-all-black\`, or \`lockup-all-white\` for a dark stock.

**Never** stretch it, recolour it by hand, add a shadow to it, or put the lockup on a busy photograph. If a background is busy, use \`mark-accent\` on a clear area instead.

## Clear space and minimum size

Leave at least the width of the square on every side. Do not use the full lockup below about 120 pixels wide, or the name stops being legible; use the mark alone below that.

## Colours

- Ink \`${INK}\`
- Accent \`${ACCENT}\`
- White \`${WHITE}\`

The full palette is in \`src/lib/brand-tokens.ts\`, which is the source of truth.
`)

  console.log(`\nWritten to ${OUT}\n`)
}

main()
