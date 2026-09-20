/**
 * The coach agreement: recorded once, refused while it is a draft, and the
 * typed name actually has to be a name.
 *
 * Run: npx tsx scripts/test-coach-agreement.ts
 *
 * Writes against a made-up coach id and deletes everything it makes, including
 * on failure.
 */

import { readFileSync } from 'fs'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

import { createClient } from '@supabase/supabase-js'
import {
  CURRENT_AGREEMENT,
  hasAcceptedCurrent,
  nameLooksReal,
  agreementGateActive,
} from '../src/lib/coach-agreement'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

let passed = 0
let failed = 0
const check = (name: string, ok: boolean, detail = '') => {
  if (ok) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

// A real coach id is needed because of the foreign key to auth.users, so the
// test borrows whichever coach exists rather than inventing one.
async function borrowCoachId(): Promise<string | null> {
  const { data } = await admin.from('clients').select('coach_id').not('coach_id', 'is', null).limit(1)
  return (data?.[0]?.coach_id as string) ?? null
}

async function cleanup(coachId: string) {
  await admin.from('coach_agreements').delete().eq('coach_id', coachId).eq('version', 'test-version')
}

async function main() {
  console.log('\nCoach agreement\n')

  // The name check, which needs no database at all.
  check('a single word is not a signature', !nameLooksReal('Kade'))
  check('initials are not a signature', !nameLooksReal('K D'))
  check('a blank is not a signature', !nameLooksReal('   '))
  check('numbers are not a signature', !nameLooksReal('12345 67890'))
  check('a real full name is accepted', nameLooksReal('Kade Dunstone'))
  check('a three part name is accepted', nameLooksReal('Kade Robert Dunstone'))

  // The draft switch. This is the one that matters right now.
  check('the agreement is still a draft', CURRENT_AGREEMENT.cleared === false)
  check('nothing is gated while it is a draft', agreementGateActive() === false)
  check('the draft says so on the page', CURRENT_AGREEMENT.draftNotice.length > 20)

  // The clauses that must not quietly disappear.
  const allText = CURRENT_AGREEMENT.clauses.flatMap((c) => c.body).join(' ').toLowerCase()
  check('the referral obligation is in it', allText.includes('talk them out of it'))
  check('the generators are excluded', allText.includes('not licensed to you'))
  check('the reviews are an obligation', allText.includes('thirty, sixty and ninety days'))
  check('insurance is required', allText.includes('professional indemnity'))
  check('it refuses to claim diagnosis', allText.includes('does not diagnose'))
  check(
    'the clauses needing a lawyer are marked',
    CURRENT_AGREEMENT.clauses.filter((c) => c.forTheLawyer).length >= 3,
  )

  const coachId = await borrowCoachId()
  if (!coachId) {
    console.log('\n  SKIP  database checks: no coach found to borrow an id from\n')
  } else {
    await cleanup(coachId)

    check('a coach who has accepted nothing reads as not accepted', !(await hasAcceptedCurrent(admin, coachId)))

    await admin.from('coach_agreements').insert({
      coach_id: coachId,
      agreement_kind: CURRENT_AGREEMENT.kind,
      version: 'test-version',
      accepted_name: 'Test Person',
    })
    check(
      'accepting a DIFFERENT version does not count as accepting this one',
      !(await hasAcceptedCurrent(admin, coachId)),
    )

    const second = await admin.from('coach_agreements').insert({
      coach_id: coachId,
      agreement_kind: CURRENT_AGREEMENT.kind,
      version: 'test-version',
      accepted_name: 'Test Person',
    })
    check('the same version cannot be accepted twice', second.error?.code === '23505', second.error?.code)

    await cleanup(coachId)
    const { data: left } = await admin
      .from('coach_agreements')
      .select('id')
      .eq('coach_id', coachId)
      .eq('version', 'test-version')
    check('the test left nothing behind', (left ?? []).length === 0)
  }

  console.log(`\n${passed} passed, ${failed} failed\n`)
  if (failed === 0) console.log('COACH AGREEMENT HOLDS\n')
  process.exit(failed === 0 ? 0 : 1)
}

main().catch(async (e) => {
  const id = await borrowCoachId()
  if (id) await cleanup(id)
  console.error(e)
  process.exit(1)
})
