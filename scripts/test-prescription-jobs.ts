/**
 * The prescribing jobs never reach a read-only coach's client.
 * Run: npx tsx scripts/test-prescription-jobs.ts
 *
 * 21 September 2026. Six scheduled jobs service the coaching half of the
 * product. Left alone, a pilot coach's client would have been emailed about a
 * training block she was never given, nudged to log sessions nobody
 * prescribed, and sent a subscription link from a coach who bills elsewhere.
 * All in her coach's name, for him to explain.
 */
import { readFileSync } from 'fs'
import { join } from 'path'
for (const line of readFileSync(join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
import { createClient } from '@supabase/supabase-js'
import { prescriptionClientIds, onlyPrescriptionClients } from '../src/lib/prescription-clients'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
let failed = 0
const check = (n: string, ok: boolean, d = '') => {
  if (ok) console.log(`  ok    ${n}`)
  else { failed++; console.log(`  FAIL  ${n}${d ? ` — ${d}` : ''}`) }
}

async function main() {
  console.log('\nPrescribing jobs and the read-only coach\n')

  const allowed = await prescriptionClientIds(admin)

  const { data: readOnlyCoaches } = await admin.from('tenant_config').select('coach_id').eq('product_tier', 'interpret')
  const readOnlyIds = (readOnlyCoaches ?? []).map(r => r.coach_id as string)
  const { data: theirClients } = readOnlyIds.length
    ? await admin.from('clients').select('id, name').in('coach_id', readOnlyIds)
    : { data: [] as { id: string; name: string }[] }

  console.log(`  ${readOnlyIds.length} read-only coach(es), ${(theirClients ?? []).length} client(s) between them\n`)

  if ((theirClients ?? []).length === 0) {
    check('nothing to exclude, so no filter is applied', allowed === null)
    console.log('\n  Make one with npm run coach:test-create and npm run coach:test-client to test the exclusion.\n')
  } else {
    check('a filter IS applied once a read-only coach has a client', allowed !== null)
    for (const c of theirClients ?? []) {
      check(`${c.name} is excluded from prescribing jobs`, !(allowed ?? []).includes(c.id))
    }
    const { data: kadeClients } = await admin
      .from('clients').select('id, name').not('coach_id', 'in', `(${readOnlyIds.join(',')})`).limit(3)
    for (const c of kadeClients ?? []) {
      check(`${c.name} is still included`, (allowed ?? []).includes(c.id))
    }
  }

  // The helper itself, which is what every job leans on.
  const rows = [{ client_id: 'a' }, { client_id: 'b' }, { client_id: null }]
  check('no filter means every row passes', onlyPrescriptionClients(rows, null).length === 3)
  check('a filter keeps only the allowed ones', onlyPrescriptionClients(rows, ['a']).length === 2, 'null client_id rows pass too')
  check('an empty allow list excludes every identified row', onlyPrescriptionClients(rows, []).length === 1)

  console.log(`\n${failed === 0 ? 'PRESCRIBING JOBS STAY ON THEIR OWN SIDE' : `${failed} FAILED`}\n`)
  process.exit(failed === 0 ? 0 : 1)
}
main()
