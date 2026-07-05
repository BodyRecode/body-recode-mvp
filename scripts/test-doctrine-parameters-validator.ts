/**
 * Assertion suite for the Mode A+ doctrine parameter save-time validator.
 * Same pattern as test-nutrition-corpus.ts. Run:
 *   npx tsx scripts/test-doctrine-parameters-validator.ts
 */

import { validateDoctrineParameters } from '../src/lib/doctrine-parameters-validator'

type Case = { name: string; run: () => void }

const cases: Case[] = []
let passed = 0
let failed = 0

function test(name: string, run: () => void) {
  cases.push({ name, run })
}

function assertOk(result: { ok: boolean }, name: string) {
  if (!result.ok) throw new Error(`${name}: expected ok, got error`)
}
function assertFail(result: { ok: boolean; error?: string }, mustContain: string, name: string) {
  if (result.ok) throw new Error(`${name}: expected failure, got ok`)
  if (!result.error?.toLowerCase().includes(mustContain.toLowerCase())) {
    throw new Error(`${name}: error missing "${mustContain}". Got: ${result.error}`)
  }
}

// ── Baseline: null + empty ────────────────────────────────────────────────
test('null patch is ok', () => {
  assertOk(validateDoctrineParameters(null), 'null')
})
test('undefined patch is ok', () => {
  assertOk(validateDoctrineParameters(undefined), 'undefined')
})
test('empty object is ok', () => {
  assertOk(validateDoctrineParameters({}), 'empty')
})
test('BR-shaped patch (all empty arrays + strings) is ok', () => {
  assertOk(
    validateDoctrineParameters({
      voiceTone: '',
      bannedPhrases: [],
      terminologySubstitutions: {},
      checkinCoachingGuidance: '',
      programGenerationGuidance: '',
      nutritionGenerationGuidance: '',
    }),
    'BR-shaped',
  )
})

// ── Valid partner config (Melisa's yoga tuning shape) ─────────────────────
test('yoga-style partner config is ok', () => {
  assertOk(
    validateDoctrineParameters({
      voiceTone: 'warm and grounded',
      bannedPhrases: ['downregulate', 'sympathetic dominance'],
      terminologySubstitutions: { 'winding down': 'settling', 'hard set': 'strong effort' },
      checkinCoachingGuidance: 'Emphasise breath awareness in every regulation cue.',
      programGenerationGuidance: 'Include one restorative session per week.',
      nutritionGenerationGuidance: 'Prefer plant-forward proteins.',
    }),
    'yoga',
  )
})

// ── Banned phrases: platform-protected terms ──────────────────────────────
test('banning "Optimisation" (state name) is rejected', () => {
  assertFail(
    validateDoctrineParameters({ bannedPhrases: ['Optimisation'] }),
    'Optimisation',
    'ban state name',
  )
})
test('banning "protein" (nutrition unit) is rejected', () => {
  assertFail(
    validateDoctrineParameters({ bannedPhrases: ['protein'] }),
    'protein',
    'ban protein',
  )
})
test('banning "Post-Optimisation" (hyphenated state) is rejected', () => {
  assertFail(
    validateDoctrineParameters({ bannedPhrases: ['Post-Optimisation'] }),
    'Post-Optimisation',
    'ban hyphenated',
  )
})
test('banning a phrase containing "Insulin-Drift" is rejected', () => {
  assertFail(
    validateDoctrineParameters({ bannedPhrases: ['classic Insulin-Drift pattern'] }),
    'Insulin-Drift',
    'ban insulin-drift phrase',
  )
})

// ── Banned phrases: length + stopwords ────────────────────────────────────
test('banning "" (empty) is ignored, not an error', () => {
  assertOk(
    validateDoctrineParameters({ bannedPhrases: ['', '  ', 'legitimate phrase'] }),
    'empty-ok',
  )
})
test('banning "ab" (2 chars) is rejected', () => {
  assertFail(
    validateDoctrineParameters({ bannedPhrases: ['ab'] }),
    'too short',
    'ban too short',
  )
})
test('banning "the" (stopword) is rejected', () => {
  assertFail(
    validateDoctrineParameters({ bannedPhrases: ['the'] }),
    'common English word',
    'ban stopword',
  )
})

// ── Terminology substitutions: platform-protected terms ───────────────────
test('substitution "Optimisation => Peak" is rejected', () => {
  assertFail(
    validateDoctrineParameters({ terminologySubstitutions: { Optimisation: 'Peak' } }),
    'Optimisation',
    'sub from state name',
  )
})
test('substitution "settling => Remediation" is rejected', () => {
  assertFail(
    validateDoctrineParameters({ terminologySubstitutions: { settling: 'Remediation' } }),
    'Remediation',
    'sub to state name',
  )
})
test('substitution "protein => plant" is rejected (from side)', () => {
  assertFail(
    validateDoctrineParameters({ terminologySubstitutions: { protein: 'plant' } }),
    'protein',
    'sub protein',
  )
})

// ── Terminology substitutions: shape ─────────────────────────────────────
test('substitution with empty "to" is rejected', () => {
  assertFail(
    validateDoctrineParameters({ terminologySubstitutions: { downregulate: '' } }),
    'empty replacement',
    'sub empty to',
  )
})
test('substitution with 1-char "from" is rejected', () => {
  assertFail(
    validateDoctrineParameters({ terminologySubstitutions: { 'x': 'something' } }),
    'too short',
    'sub short from',
  )
})
test('substitution with only-whitespace "from" is silently skipped', () => {
  assertOk(
    validateDoctrineParameters({ terminologySubstitutions: { '   ': 'anything' } }),
    'sub whitespace from',
  )
})

// ── Length caps ───────────────────────────────────────────────────────────
test('voiceTone > 200 chars is rejected', () => {
  assertFail(
    validateDoctrineParameters({ voiceTone: 'x'.repeat(201) }),
    'too long',
    'voiceTone long',
  )
})
test('voiceTone exactly 200 chars is ok', () => {
  assertOk(
    validateDoctrineParameters({ voiceTone: 'x'.repeat(200) }),
    'voiceTone at cap',
  )
})
test('checkinCoachingGuidance > 2000 chars is rejected', () => {
  assertFail(
    validateDoctrineParameters({ checkinCoachingGuidance: 'x'.repeat(2001) }),
    'too long',
    'guidance long',
  )
})

// ── Combined valid + invalid  ─────────────────────────────────────────────
test('one valid banned phrase + one invalid short one → rejects on short', () => {
  assertFail(
    validateDoctrineParameters({ bannedPhrases: ['downregulate', 'ab'] }),
    'too short',
    'combined',
  )
})

// ── Execute ───────────────────────────────────────────────────────────────
console.log(`\nRunning ${cases.length} doctrine-parameters-validator tests…\n`)
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
