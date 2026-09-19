/**
 * Generation failures are recorded, resolve their coach, and never throw.
 * Run: npx tsx scripts/test-generation-failure.ts
 */
import { createClient } from '@supabase/supabase-js'
import { recordGenerationFailure } from '../src/lib/generation-failure'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
let failed = 0
const check = (n: string, ok: boolean, d?: unknown) => { if (ok) console.log(`ok    ${n}`); else { failed++; console.log(`FAIL  ${n}`, d ?? '') } }

async function main() {
  const { data: client } = await admin.from('clients').select('id, name, coach_id').limit(1).single()
  if (!client) { console.log('no clients to test against'); return }

  const before = new Date().toISOString()
  await recordGenerationFailure({
    surface: 'nutrition',
    reason: 'validation_exhausted',
    clientId: client.id as string,
    detail: 'Test row from scripts/test-generation-failure.ts',
    codes: ['TEST_CODE', 'TEST_CODE', 'OTHER_CODE'],
    attempts: 3,
  })

  const { data: rows } = await admin
    .from('generation_failures')
    .select('*')
    .gte('occurred_at', before)
    .order('occurred_at', { ascending: false })

  const row = (rows ?? [])[0]
  check('the failure is recorded', !!row)
  if (!row) return
  check('it resolves the coach from the client, with no session', row.coach_id === client.coach_id, { got: row.coach_id, want: client.coach_id })
  check('duplicate codes are collapsed', Array.isArray(row.codes) && row.codes.length === 2, row.codes)
  check('the detail is kept', String(row.detail).includes('Test row'))

  // Instrumentation must never take a generation down with it.
  let threw = false
  try {
    await recordGenerationFailure({ surface: 'program', reason: 'ai_error', clientId: 'not-a-uuid', detail: 'bad input on purpose' })
  } catch { threw = true }
  check('a bad write does not throw', !threw)

  await admin.from('generation_failures').delete().eq('id', row.id)
  const { data: left } = await admin.from('generation_failures').select('id').eq('id', row.id)
  check('the test cleans up after itself', (left ?? []).length === 0)

  console.log('')
  console.log(failed === 0 ? 'FAILURE RECORDING HOLDS' : `${failed} CASE(S) FAILED`)
  process.exit(failed === 0 ? 0 : 1)
}
main()
