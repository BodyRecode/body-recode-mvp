/**
 * Assertion suite for the Mode A+ runtime helpers - the pure functions
 * that touch every client-facing draft. Complements the save-time
 * validator suite. Run:
 *   npx tsx scripts/test-doctrine-parameters-runtime.ts
 *
 * These functions are on the hot path (every FR / PR / NR / MR / TR /
 * WCCF generation calls them). A regression here rewrites live content.
 */

import { applyTerminologyWith, findBannedIn } from '../src/lib/doctrine-parameters'

type Case = { name: string; run: () => void }

const cases: Case[] = []
let passed = 0
let failed = 0

function test(name: string, run: () => void) {
  cases.push({ name, run })
}

function eq(actual: unknown, expected: unknown, name: string) {
  if (actual !== expected) {
    throw new Error(`${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

// ── applyTerminologyWith: no-op paths ─────────────────────────────────────
test('empty subs returns text unchanged', () => {
  eq(applyTerminologyWith('hello world', {}), 'hello world', 'empty subs')
})
test('empty text returns "" with any subs', () => {
  eq(applyTerminologyWith('', { a: 'b' }), '', 'empty text')
})
test('text with no matches returns unchanged', () => {
  eq(applyTerminologyWith('nothing to see', { downregulate: 'soften' }), 'nothing to see', 'no matches')
})

// ── Simple substitutions ──────────────────────────────────────────────────
test('single sub replaces all occurrences', () => {
  eq(
    applyTerminologyWith('downregulate now, downregulate later', { downregulate: 'soften' }),
    'soften now, soften later',
    'all occurrences',
  )
})
test('case-insensitive match', () => {
  eq(
    applyTerminologyWith('Downregulate. downregulate. DOWNREGULATE.', { downregulate: 'soften' }),
    'soften. soften. soften.',
    'case insensitive',
  )
})
test('multi-word "from" matches multi-word', () => {
  eq(
    applyTerminologyWith('feel that winding down happen', { 'winding down': 'settling' }),
    'feel that settling happen',
    'multi-word',
  )
})

// ── Regex safety ──────────────────────────────────────────────────────────
test('special chars in "from" do NOT act as regex meta', () => {
  // "1.5g" pre-fix: the . matched anything, so this substituted "125g" too.
  eq(
    applyTerminologyWith('at 1.5g and 125g and 1x5g', { '1.5g': 'ONE-POINT-FIVE-G' }),
    'at ONE-POINT-FIVE-G and 125g and 1x5g',
    'regex escape',
  )
})
test('parens in "from" are literal', () => {
  eq(
    applyTerminologyWith('take (a) breath and (b) hold', { '(a)': 'FIRST' }),
    'take FIRST breath and (b) hold',
    'parens literal',
  )
})

// ── Substring vs whole-word (known behavior: substring) ───────────────────
test('sub matches inside longer word (substring, not word-boundary)', () => {
  // This is documented current behavior. The save-time validator blocks
  // banning "fat" so the risk is contained but not zero; consumers should
  // choose sufficiently unique "from" values.
  eq(
    applyTerminologyWith('fatigue and fat', { fat: 'X' }),
    'Xigue and X',
    'substring match',
  )
})

// ── Chained substitutions (insertion-order) ───────────────────────────────
test('chained subs: a=>b, b=>c on "a" yields "c"', () => {
  eq(
    applyTerminologyWith('a', { a: 'b', b: 'c' }),
    'c',
    'chained subs',
  )
})
test('non-chained order: b=>c, a=>b on "a" yields "b" (not chained backwards)', () => {
  eq(
    applyTerminologyWith('a', { b: 'c', a: 'b' }),
    'b',
    'non-chained order',
  )
})

// ── Empty "to" is a no-op (skipped) ───────────────────────────────────────
test('empty "to" leaves the term untouched', () => {
  // Save-time validator now rejects this at write, but the runtime helper
  // must remain robust - old configs saved before the validator, or
  // hand-edited DB rows, could still hit this path.
  eq(
    applyTerminologyWith('downregulate here', { downregulate: '' }),
    'downregulate here',
    'empty to skip',
  )
})

// ── findBannedIn: base cases ──────────────────────────────────────────────
test('empty banned list returns null', () => {
  eq(findBannedIn('anything at all', []), null, 'empty list')
})
test('empty text returns null', () => {
  eq(findBannedIn('', ['downregulate']), null, 'empty text')
})
test('exact match hits', () => {
  eq(findBannedIn('please downregulate', ['downregulate']), 'downregulate', 'exact')
})
test('case-insensitive match', () => {
  eq(findBannedIn('DOWNREGULATE now', ['downregulate']), 'downregulate', 'ci match')
})
test('substring match hits', () => {
  eq(
    findBannedIn('you must downregulate the load', ['downregulate']),
    'downregulate',
    'substring',
  )
})
test('returns FIRST match by list order', () => {
  eq(
    findBannedIn('sympathetic dominance and downregulate', ['downregulate', 'sympathetic dominance']),
    'downregulate',
    'first match order',
  )
})
test('no match returns null', () => {
  eq(
    findBannedIn('nothing controversial here', ['downregulate', 'sympathetic dominance']),
    null,
    'no match',
  )
})
test('whitespace-only banned entries skipped', () => {
  eq(
    findBannedIn('legitimate copy', ['   ', '', 'downregulate']),
    null,
    'whitespace skipped',
  )
})
test('trimmed match returns trimmed value', () => {
  eq(
    findBannedIn('please downregulate now', [' downregulate '] ),
    'downregulate',
    'trimmed returned',
  )
})

// ── Execute ───────────────────────────────────────────────────────────────
console.log(`\nRunning ${cases.length} doctrine-parameters-runtime tests…\n`)
for (const c of cases) {
  try {
    c.run()
    passed++
    console.log(`  \x1b[32m✓\x1b[0m ${c.name}`)
  } catch (err) {
    failed++
    console.log(`  \x1b[31m✗\x1b[0m ${c.name}`)
    console.log(`     ${(err as Error).message}`)
  }
}
console.log(`\n${passed}/${cases.length} passed, ${failed} failed\n`)
process.exit(failed === 0 ? 0 : 1)
