/**
 * Assertion suite for Mode A+ presets + preview builder.
 * Run:  npx tsx scripts/test-doctrine-parameters-presets-and-preview.ts
 *
 * Two invariants matter:
 *   1. Every shipped preset must pass the save-time validator. If a
 *      preset would fail validation, coaches loading it and clicking
 *      Save would hit a confusing error - that's a broken UX contract.
 *   2. The preview builder must render deterministic, correct output
 *      for the common shapes (empty, tone-only, banned-only,
 *      substitutions, full).
 */

import { PRESETS, getPreset } from '../src/lib/doctrine-parameters-presets'
import { validateDoctrineParameters } from '../src/lib/doctrine-parameters-validator'
import { buildPreview } from '../src/lib/doctrine-parameters-preview'

type Case = { name: string; run: () => void }

const cases: Case[] = []
let passed = 0
let failed = 0

function test(name: string, run: () => void) {
  cases.push({ name, run })
}

function eq(actual: unknown, expected: unknown, name: string) {
  if (actual !== expected) throw new Error(`${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}
function truthy(actual: unknown, name: string) {
  if (!actual) throw new Error(`${name}: expected truthy, got ${JSON.stringify(actual)}`)
}

// ── Preset roster ─────────────────────────────────────────────────────────
test('exactly 4 presets ship', () => {
  eq(PRESETS.length, 4, 'preset count')
})
test('preset ids are unique', () => {
  const ids = new Set(PRESETS.map((p) => p.id))
  eq(ids.size, PRESETS.length, 'unique ids')
})
test('getPreset(yoga-breath-forward) returns it', () => {
  truthy(getPreset('yoga-breath-forward'), 'yoga')
})
test('getPreset(nonexistent) returns undefined', () => {
  eq(getPreset('does-not-exist'), undefined, 'no such preset')
})

// ── Every preset must pass validator ──────────────────────────────────────
for (const preset of PRESETS) {
  test(`preset "${preset.id}" passes save-time validator`, () => {
    const v = validateDoctrineParameters(preset.parameters)
    if (!v.ok) throw new Error(`preset "${preset.id}" would fail save: ${v.error}`)
  })
}

// ── Preset shape sanity ───────────────────────────────────────────────────
for (const preset of PRESETS) {
  test(`preset "${preset.id}" has non-empty voiceTone`, () => {
    truthy(preset.parameters.voiceTone.trim().length > 0, 'voice tone')
  })
  test(`preset "${preset.id}" has non-empty checkin guidance`, () => {
    truthy(preset.parameters.checkinCoachingGuidance.trim().length > 0, 'checkin guidance')
  })
  test(`preset "${preset.id}" label + description non-empty`, () => {
    truthy(preset.label.trim().length > 0 && preset.description.trim().length > 0, 'label+desc')
  })
}

// ── Preview: empty input ──────────────────────────────────────────────────
test('preview of empty params shows "empty" placeholder for all generators', () => {
  const p = buildPreview({})
  eq(p.systemPromptBlocks.length, 4, '4 blocks')
  for (const b of p.systemPromptBlocks) {
    if (!b.text.includes('empty')) throw new Error(`${b.generator}: expected "empty" marker, got: ${b.text}`)
  }
  eq(p.summary.hasVoiceTone, false, 'no voice')
  eq(p.summary.bannedPhraseCount, 0, 'no banned')
  eq(p.summary.substitutionCount, 0, 'no subs')
  eq(p.summary.guidanceFieldsSet, 0, 'no guidance')
})

// ── Preview: voiceTone-only ───────────────────────────────────────────────
test('voiceTone-only preview mentions the tone in every non-empty block', () => {
  const p = buildPreview({ voiceTone: 'warm and grounded' })
  for (const b of p.systemPromptBlocks) {
    truthy(b.text.includes('warm and grounded'), `${b.generator} has tone`)
  }
  eq(p.summary.hasVoiceTone, true, 'has voice')
})

// ── Preview: banned phrases ───────────────────────────────────────────────
test('banned phrases show up as chips + are matched against demo sentence', () => {
  const p = buildPreview({ bannedPhrases: ['downregulate', 'smash', 'not-in-demo'] })
  eq(p.summary.bannedPhraseCount, 3, 'count')
  // demo sentence contains "downregulate" and "smash"; "not-in-demo" won't hit
  truthy(p.bannedPhraseDemo.hits.includes('downregulate'), 'downregulate hit')
  truthy(p.bannedPhraseDemo.hits.includes('smash'), 'smash hit')
  truthy(!p.bannedPhraseDemo.hits.includes('not-in-demo'), 'not-in-demo not hit')
})

// ── Preview: substitutions ────────────────────────────────────────────────
test('substitutions rewrite the demo sentence + report which applied', () => {
  const p = buildPreview({ terminologySubstitutions: { 'hard set': 'strong effort', 'not-in-demo': 'nope' } })
  truthy(p.substitutionDemo.after.includes('strong effort'), 'after contains new')
  truthy(!p.substitutionDemo.after.toLowerCase().includes('hard set'), 'after does NOT contain old')
  truthy(p.substitutionDemo.substitutionsApplied.some((s) => s.includes('hard set')), 'reports applied')
  truthy(!p.substitutionDemo.substitutionsApplied.some((s) => s.includes('not-in-demo')), 'does not report un-applied')
})

// ── Preview: per-generator guidance routing ───────────────────────────────
test('checkin guidance appears in Weekly check-in block only', () => {
  const p = buildPreview({ checkinCoachingGuidance: 'CHECKIN_ONLY_MARKER' })
  const checkin = p.systemPromptBlocks.find((b) => b.generator.includes('check-in'))!
  const program = p.systemPromptBlocks.find((b) => b.generator.includes('Program'))!
  const nutrition = p.systemPromptBlocks.find((b) => b.generator.includes('Nutrition'))!
  const foundational = p.systemPromptBlocks.find((b) => b.generator.includes('Foundational'))!
  truthy(checkin.text.includes('CHECKIN_ONLY_MARKER'), 'checkin has it')
  truthy(!program.text.includes('CHECKIN_ONLY_MARKER'), 'program does not')
  truthy(!nutrition.text.includes('CHECKIN_ONLY_MARKER'), 'nutrition does not')
  truthy(!foundational.text.includes('CHECKIN_ONLY_MARKER'), 'foundational does not')
})

test('program guidance appears in Program block only', () => {
  const p = buildPreview({ programGenerationGuidance: 'PROG_ONLY_MARKER' })
  const program = p.systemPromptBlocks.find((b) => b.generator.includes('Program'))!
  const other = p.systemPromptBlocks.filter((b) => !b.generator.includes('Program'))
  truthy(program.text.includes('PROG_ONLY_MARKER'), 'program has it')
  for (const b of other) truthy(!b.text.includes('PROG_ONLY_MARKER'), `${b.generator} does not`)
})

test('nutrition guidance appears in Nutrition block only', () => {
  const p = buildPreview({ nutritionGenerationGuidance: 'NUTR_ONLY_MARKER' })
  const nutrition = p.systemPromptBlocks.find((b) => b.generator.includes('Nutrition'))!
  const other = p.systemPromptBlocks.filter((b) => !b.generator.includes('Nutrition'))
  truthy(nutrition.text.includes('NUTR_ONLY_MARKER'), 'nutrition has it')
  for (const b of other) truthy(!b.text.includes('NUTR_ONLY_MARKER'), `${b.generator} does not`)
})

// ── Preview: full yoga preset end-to-end ──────────────────────────────────
test('yoga preset produces expected preview shape', () => {
  const yoga = getPreset('yoga-breath-forward')!
  const p = buildPreview(yoga.parameters)
  eq(p.summary.hasVoiceTone, true, 'has voice')
  eq(p.summary.guidanceFieldsSet, 3, 'all 3 guidances')
  truthy(p.summary.bannedPhraseCount > 0, 'has banned')
  truthy(p.summary.substitutionCount > 0, 'has subs')
  // check-in block should mention yoga's specific guidance verb "notice"
  const checkin = p.systemPromptBlocks.find((b) => b.generator.includes('check-in'))!
  truthy(checkin.text.includes('notice'), 'checkin has notice')
})

// ── Execute ───────────────────────────────────────────────────────────────
console.log(`\nRunning ${cases.length} preset + preview tests…\n`)
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
