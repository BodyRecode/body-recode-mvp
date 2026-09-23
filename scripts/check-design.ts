/**
 * Fails when the dashboard drifts off the palette, the type scale, or the rule
 * that colour only appears where it means something.
 *
 * 22 September 2026. Written because "will this stay true from page to page?"
 * has an honest answer and it is no, not on its own. Three things drifted in a
 * single day, all of them mine:
 *
 *   - The login page invented SIX colours within hours of the palette being
 *     written, three of them within four points of one that already existed.
 *   - Remediation was painted RED and survived every sweep, because it was
 *     written `bg-red-100` and every pass counted `#`.
 *   - The global stylesheet was missed entirely, because every sweep looked at
 *     component files and a stylesheet is not one.
 *
 * A COLOUR DECISION IS NOT ALWAYS A HEX CODE. This checks all three shapes.
 *
 * It is a check rather than a formatter on purpose: it says what is wrong and
 * lets a person decide, because some of these have good reasons and a tool
 * that rewrites them would bury the reason.
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

/**
 * A RATCHET, NOT A BIG BANG. Only the surfaces that have been finished are
 * guarded. A page joins this list the day it is done, and from then on it
 * cannot slide back. Checking everything at once would report five thousand
 * problems on screens nobody has converted yet, and a check that always fails
 * is a check everybody turns off.
 *
 * The owner-only screens are deliberately absent. They are Kade's own business
 * pages, still light, and they join when their turn comes.
 */
/**
 * A DOCUMENT IS LIGHT, so the print and report pages under a client are
 * deliberately not in here. They generate the PDFs a CLIENT reads, and the
 * dark sweep had to be reverted on all seven of them: it would have shipped
 * dark PDFs to people, which is the exact thing the tool/document line exists
 * to stop.
 */
const SKIP = /\/(print|cffs-report|cfws-report|foundational-reading-preview)(\/|$)/

const ROOTS = [
  'src/app/globals.css',
  'src/components/dashboard/ui.tsx',
  'src/components/launcher-style.ts',
  'src/app/dashboard/shell.tsx',
  'src/app/dashboard/nav.tsx',
  'src/app/dashboard/command-k-hint.tsx',
  'src/app/dashboard/today',
  'src/app/dashboard/coaching',
  'src/app/dashboard/checkins',
  'src/app/dashboard/practice',
  'src/app/dashboard/getting-started',
  'src/app/dashboard/settings/page.tsx',
  'src/app/dashboard/settings/account-actions.tsx',
  'src/app/dashboard/agreement',
  'src/app/dashboard/support/page.tsx',
  'src/app/dashboard/help/page.tsx',
  'src/app/dashboard/help/coach-guide.tsx',
  'src/app/dashboard/clients',
  'src/components/LogoutButton.tsx',
  'src/app/login',
  'src/lib/coach-today.ts',
]
const PALETTE_FILE = 'src/lib/brand-tokens.ts'

const SIZES = new Set(['10', '11', '12.5', '13.5', '16', '20', '34', '46', '58'])
/** Tailwind's own palette. Every one of these is a colour nobody chose. */
const TW_COLOUR =
  /\b(?:bg|text|border|ring|from|via|to|fill|stroke|divide|outline|shadow|decoration|accent|caret)-(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|\d{3})\b/g

function files(p: string): string[] {
  try {
    if (statSync(p).isFile()) return [p]
  } catch { return [] }
  return readdirSync(p).flatMap(n => {
    const full = join(p, n)
    if (statSync(full).isDirectory()) return SKIP.test(full) ? [] : files(full)
    if (SKIP.test(full)) return []
    return /\.(tsx?|css)$/.test(full) ? [full] : []
  })
}

const palette = new Set(
  (readFileSync(PALETTE_FILE, 'utf8').match(/#[0-9A-Fa-f]{6}/g) ?? []).map(c => c.toUpperCase()),
)
// Pure black and white are allowed: they are not palette entries, they are the
// ends of the scale, and a shadow or a true-white print asset needs them.
palette.add('#000000'); palette.add('#FFFFFF')

type Problem = { file: string; line: number; what: string; detail: string }
const problems: Problem[] = []

for (const root of ROOTS) {
  for (const file of files(root)) {
    const rel = relative(process.cwd(), file)
    readFileSync(file, 'utf8').split('\n').forEach((text, i) => {
      const line = i + 1

      for (const m of text.matchAll(/text-\[([0-9.]+)px\]/g)) {
        if (!SIZES.has(m[1])) {
          problems.push({ file: rel, line, what: 'off-scale type', detail: `${m[1]}px is not one of the nine steps` })
        }
      }
      for (const m of text.matchAll(/#[0-9A-Fa-f]{6}\b/g)) {
        if (!palette.has(m[0].toUpperCase())) {
          problems.push({ file: rel, line, what: 'off-palette colour', detail: `${m[0]} is not in the palette` })
        }
      }
      for (const m of text.matchAll(TW_COLOUR)) {
        problems.push({ file: rel, line, what: 'colour with no hex', detail: `${m[0]} is a colour decision no search for "#" will ever find` })
      }
    })
  }
}

/**
 * THE FRAME, which the palette check cannot protect on its own.
 *
 * 23 September 2026. A blanket sweep of the owner pages re-swept the shell and
 * INVERTED IT: the work surface faded to paper and the navigation went dark,
 * on every page in the dashboard. Every colour involved was in the palette, so
 * nothing above noticed. The rule being broken is not "which colours" but
 * WHICH WAY ROUND, and that is the one thing a colour-membership check can
 * never see.
 *
 * A tool is dark and the thing you navigate with is light. That is an
 * invariant now, so it gets asserted rather than remembered.
 */
const shell = readFileSync('src/app/dashboard/shell.tsx', 'utf8')
const railPaper = /background: 'linear-gradient\(180deg,#FAFAF8 0%,#F2F2EF 100%\)'/.test(shell)
const panelDark = /background: 'linear-gradient\(180deg,#0B0D10,#0F1115 260px\)'/.test(shell)
if (!railPaper || !panelDark) {
  problems.push({
    file: 'src/app/dashboard/shell.tsx', line: 1, what: 'the frame is inverted',
    detail: !railPaper
      ? 'the navigation rail is no longer paper'
      : 'the work surface is no longer graphite',
  })
}

if (problems.length === 0) {
  console.log('\nClean. Every colour is in the palette and every size is on the scale.\n')
  process.exit(0)
}

const byWhat = new Map<string, Problem[]>()
for (const p of problems) byWhat.set(p.what, [...(byWhat.get(p.what) ?? []), p])

console.log('')
for (const [what, list] of byWhat) {
  console.log(`${list.length} ${what}:`)
  const shown = list.slice(0, 12)
  for (const p of shown) console.log(`   ${p.file}:${p.line}  ${p.detail}`)
  if (list.length > shown.length) console.log(`   ... and ${list.length - shown.length} more`)
  console.log('')
}
console.log(`${problems.length} in total. Add a reason to the palette or use what is already there.\n`)
process.exit(1)
