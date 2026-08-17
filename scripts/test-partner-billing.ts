/**
 * Assertion suite for partner-billing computation.
 * Run:  npx tsx scripts/test-partner-billing.ts
 *
 * The union-set counter (countDistinctActiveClients) is the money-critical
 * path. It runs monthly per tenant via the partner-active-client-counter
 * Inngest cron; a bug here mis-invoices Collective Partners. Same holds
 * for the month boundary helpers - a wrong month cap under- or over-counts.
 *
 * Pattern follows test-doctrine-parameters-*.ts. Pure functions only,
 * no DB, no network. computeActiveClientCount itself remains untested
 * (it wraps admin client calls) but delegates its arithmetic to the pure
 * helper tested here.
 */

import { monthStartIso, nextMonthStartIso, countDistinctActiveClients } from '../src/lib/partner-billing'

type Case = { name: string; run: () => void }
const cases: Case[] = []
let passed = 0
let failed = 0
function test(name: string, run: () => void) { cases.push({ name, run }) }
function eq(actual: unknown, expected: unknown, name: string) {
  if (actual !== expected) throw new Error(`${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}
function throws(fn: () => unknown, mustContain: string, name: string) {
  try { fn(); throw new Error(`${name}: expected throw, none happened`) }
  catch (err) {
    const msg = (err as Error).message ?? String(err)
    if (!msg.toLowerCase().includes(mustContain.toLowerCase())) {
      throw new Error(`${name}: throw message missing "${mustContain}". Got: ${msg}`)
    }
  }
}

// ── monthStartIso ─────────────────────────────────────────────────────────
test('monthStartIso mid-month returns first of that month', () => {
  eq(monthStartIso(new Date('2026-07-07T14:30:00Z')), '2026-07-01', 'mid-Jul')
})
test('monthStartIso first-of-month returns first of that month', () => {
  eq(monthStartIso(new Date('2026-07-01T00:00:00Z')), '2026-07-01', 'first-Jul')
})
test('monthStartIso last-of-month returns first of THAT month (not next)', () => {
  eq(monthStartIso(new Date('2026-07-31T23:59:59Z')), '2026-07-01', 'last-Jul')
})
test('monthStartIso January returns YYYY-01-01', () => {
  eq(monthStartIso(new Date('2026-01-15T00:00:00Z')), '2026-01-01', 'Jan')
})
test('monthStartIso December returns YYYY-12-01', () => {
  eq(monthStartIso(new Date('2026-12-31T23:59:59Z')), '2026-12-01', 'Dec')
})
test('monthStartIso pads single-digit months', () => {
  eq(monthStartIso(new Date('2026-03-15T00:00:00Z')), '2026-03-01', 'Mar padded to 03')
})

// ── nextMonthStartIso ─────────────────────────────────────────────────────
test('nextMonthStartIso Jul -> Aug', () => {
  eq(nextMonthStartIso('2026-07-01'), '2026-08-01', 'jul-aug')
})
test('nextMonthStartIso Dec -> Jan of next year', () => {
  eq(nextMonthStartIso('2026-12-01'), '2027-01-01', 'dec-jan year rollover')
})
test('nextMonthStartIso Jan -> Feb', () => {
  eq(nextMonthStartIso('2026-01-01'), '2026-02-01', 'jan-feb')
})
test('nextMonthStartIso Feb (leap year) -> March', () => {
  // Note: we always return the FIRST of next month, not the last of this
  // month. Leap year does not change our behaviour.
  eq(nextMonthStartIso('2028-02-01'), '2028-03-01', 'feb-mar leap')
})
test('nextMonthStartIso Feb (non-leap) -> March', () => {
  eq(nextMonthStartIso('2026-02-01'), '2026-03-01', 'feb-mar non-leap')
})
test('nextMonthStartIso invalid input throws', () => {
  throws(() => nextMonthStartIso('not-a-date'), 'invalid', 'invalid string')
  throws(() => nextMonthStartIso('2026-13-01'), 'invalid', 'month 13')
  throws(() => nextMonthStartIso('2026-00-01'), 'invalid', 'month 0')
})

// ── countDistinctActiveClients ────────────────────────────────────────────
test('empty arrays return 0', () => {
  eq(countDistinctActiveClients([], [], []), 0, 'all empty')
})
test('null / undefined inputs return 0', () => {
  eq(countDistinctActiveClients(null, null, null), 0, 'all null')
  eq(countDistinctActiveClients(undefined, undefined, undefined), 0, 'all undef')
  eq(countDistinctActiveClients(null, undefined, []), 0, 'mixed null/undef/empty')
})
test('one client in one source counts as 1', () => {
  eq(countDistinctActiveClients([{ client_id: 'a' }], [], []), 1, 'plan-only')
})
test('one client in all three sources counts as 1 (dedup)', () => {
  eq(
    countDistinctActiveClients(
      [{ client_id: 'a' }],
      [{ client_id: 'a' }],
      [{ client_id: 'a' }],
    ),
    1,
    'triple dedup',
  )
})
test('three distinct clients across sources count as 3', () => {
  eq(
    countDistinctActiveClients(
      [{ client_id: 'a' }],
      [{ client_id: 'b' }],
      [{ client_id: 'c' }],
    ),
    3,
    '3 distinct across sources',
  )
})
test('same client appearing multiple times in same source counts as 1', () => {
  eq(
    countDistinctActiveClients(
      [{ client_id: 'a' }, { client_id: 'a' }, { client_id: 'a' }],
      [],
      [],
    ),
    1,
    'triple same source',
  )
})
test('null client_id ignored', () => {
  eq(
    countDistinctActiveClients(
      [{ client_id: 'a' }, { client_id: null }],
      [],
      [],
    ),
    1,
    'null ignored',
  )
})
test('empty-string client_id ignored', () => {
  eq(
    countDistinctActiveClients(
      [{ client_id: 'a' }, { client_id: '' }],
      [],
      [],
    ),
    1,
    'empty string ignored',
  )
})
test('client_ids are case-sensitive (UUIDs)', () => {
  // UUIDs are canonical lowercase; DB will always return lowercase. If a bug
  // ever mixes case we want it to count as two distinct clients so it shows
  // up in the health dashboard, not silently merges.
  eq(
    countDistinctActiveClients(
      [{ client_id: 'a1b2' }, { client_id: 'A1B2' }],
      [],
      [],
    ),
    2,
    'case-sensitive',
  )
})
test('realistic scenario: 7 clients on the tenant', () => {
  // 5 have plans updated this month, 6 have check-ins, 2 have new nutrition
  // plans. Total distinct = 7 (matches roster).
  eq(
    countDistinctActiveClients(
      [{ client_id: 'sarah' }, { client_id: 'emma' }, { client_id: 'anaya' }, { client_id: 'jenna' }, { client_id: 'kate' }],
      [{ client_id: 'ruth' }, { client_id: 'priya' }],
      [{ client_id: 'sarah' }, { client_id: 'emma' }, { client_id: 'anaya' }, { client_id: 'jenna' }, { client_id: 'kate' }, { client_id: 'priya' }],
    ),
    7,
    '7-client realistic',
  )
})
test('inactive month: no plans updated, no check-ins -> 0', () => {
  // A tenant on holiday with no coaching activity should bill 0.
  eq(countDistinctActiveClients([], [], []), 0, 'inactive month')
})

// ── Execute ───────────────────────────────────────────────────────────────
console.log(`\nRunning ${cases.length} partner-billing tests…\n`)
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
