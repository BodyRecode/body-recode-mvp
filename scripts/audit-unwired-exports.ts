// Find exported functions in src/lib that nothing calls.
//
// Written 2026-09-08 after THREE features were found in one morning that were
// fully built, specced, documented, and never connected to anything:
//
//   - the program BLOCK BRIEF: collected from the coach, saved to the database,
//     and never passed to the model. Three blocks were generated against
//     written instructions the engine never saw.
//   - attachSupplementsToPlan: the whole Unified Consumption Plan, zero callers.
//     Every nutrition plan since 1 Sep had an empty supplements field.
//   - and one FALSE alarm worth remembering: clampProgramToDoctrine WAS wired
//     and working. A stale note said otherwise and it was repeated for hours
//     without being checked.
//
// A feature existing is not evidence it runs. Working code, a spec, a doc entry
// and a coach-facing UI are all compatible with nothing ever calling it.
//
// Two categories, and the difference matters:
//   UNREFERENCED  the name appears nowhere but its own definition. Dead.
//   INTERNAL ONLY exported but only used inside its own file. Usually just an
//                 over-broad export, occasionally a feature nothing reached.
//
//   npx tsx scripts/audit-unwired-exports.ts          # unreferenced only
//   npx tsx scripts/audit-unwired-exports.ts --all    # include internal-only

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const SHOW_ALL = process.argv.includes('--all')
const ROOTS = ['src', 'scripts']

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full)
  }
  return out
}

// One pass: read every file once, keep its text in memory.
const files = ROOTS.flatMap(r => walk(r))
const text = new Map<string, string>()
for (const f of files) text.set(f, readFileSync(f, 'utf8'))

const libFiles = files.filter(f => /^src\/lib\/[^/]+\.tsx?$/.test(f)).sort()

type Finding = { file: string; name: string; kind: 'unreferenced' | 'internal-only' }
const findings: Finding[] = []

for (const lib of libFiles) {
  const src = text.get(lib)!
  const names = [...src.matchAll(/^export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/gm)].map(m => m[1])
  for (const name of names) {
    if (name.length < 4) continue // too generic to match reliably
    const re = new RegExp(`\\b${name}\\b`)
    let external = 0
    for (const [f, t] of text) {
      if (f === lib) continue
      if (re.test(t)) { external++; break }
    }
    if (external > 0) continue

    // No external reference. Is it used inside its own file at all?
    const internalUses = (src.match(new RegExp(`\\b${name}\\b`, 'g')) ?? []).length
    // 1 = the definition itself. 2+ means something in the file calls it.
    findings.push({ file: lib.replace('src/lib/', ''), name, kind: internalUses <= 1 ? 'unreferenced' : 'internal-only' })
  }
}

const dead = findings.filter(f => f.kind === 'unreferenced')
const internal = findings.filter(f => f.kind === 'internal-only')

console.log(`scanned ${libFiles.length} files in src/lib against ${files.length} source files\n`)
console.log(`UNREFERENCED — nothing anywhere calls these (${dead.length}):`)
if (!dead.length) console.log('  none')
for (const f of dead) console.log(`  ${f.file.padEnd(38)} ${f.name}`)

if (SHOW_ALL) {
  console.log(`\nINTERNAL ONLY — exported but used only inside their own file (${internal.length}):`)
  for (const f of internal) console.log(`  ${f.file.padEnd(38)} ${f.name}`)
} else if (internal.length) {
  console.log(`\n(${internal.length} more are exported but used only inside their own file. Re-run with --all.)`)
}

console.log(`\nAn entry here is a question, not a verdict. Read what it does before deleting or wiring it:`)
console.log(`a dead convenience wrapper is harmless, a dead engine entry point is a feature nobody is getting.`)
