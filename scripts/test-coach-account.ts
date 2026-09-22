/**
 * A real coach account, at the real pilot tier, for walking the product.
 *
 * Run:
 *   npm run coach:test-create          makes it and prints the sign-in details
 *   npm run coach:test-remove          removes the coach and everything they made
 *   npm run coach:test-status          says whether it exists and what it holds
 *
 * WHY A REAL ACCOUNT RATHER THAN A SWITCH. Anything that pretends to be a coach
 * tests the pretending. This signs in through the same door, holds the same
 * tier, and is refused by exactly the same rules as a pilot coach would be. It
 * is the only version of this test that can fail honestly.
 *
 * Its email is deliberately NOT on the coach allowlist, so it gets no special
 * treatment anywhere that checks for Kade by name.
 *
 * Everything it creates is removable in one command, using the same deletion
 * machinery a real client's request would use.
 */

import { readFileSync } from 'fs'
import { join } from 'path'

for (const line of readFileSync(join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const EMAIL = 'testcoach@bodyrecode.au'
const PASSWORD = 'testcoach2026'
const FULL_NAME = 'Test Coach'
const BUSINESS = 'Test Coach Strength'
const TENANT_ID = 'test-coach'

/**
 * 22 September 2026. This said "No test coach exists" while the account was
 * sitting there, and `create` then failed with "already registered", which is
 * the only reason anybody looked.
 *
 * TWO FAULTS, and the second one is not this script's.
 *
 * 1. IT NEVER CHECKED `error`. One page was requested, the call failed, `data`
 *    came back null, and the function returned null, which reads as "no such
 *    user". A lookup that answers "no" when it means "I could not look" is
 *    worse than one that throws.
 *
 * 2. THE AUTH USER LIST IS ACTUALLY BROKEN. One row has `banned_until` set to
 *    the Postgres value `infinity`, which Postgres stores happily and the auth
 *    service cannot deserialise, so EVERY page that contains that row fails
 *    with "Database error finding users". At 25 users a page size of 20 or more
 *    always contains it; a page size of 5 mostly does not. Hence the small
 *    page size here: it is a workaround, not a preference, and it stops working
 *    the moment another row goes the same way.
 *
 * The row is a real client account and fixing it is Kade's call, so this pages
 * around the problem and REPORTS it rather than silently skipping.
 */
async function findUser(): Promise<{ id: string; email: string } | null> {
  let unreadable = 0
  for (let page = 1; page <= 200; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 5 })
    if (error) {
      // One unreadable page must not be reported as "user not found".
      unreadable++
      continue
    }
    const users = data?.users ?? []
    const u = users.find((x) => (x.email ?? '').toLowerCase() === EMAIL)
    if (u) return { id: u.id, email: u.email ?? EMAIL }
    if (users.length < 5) {
      if (unreadable > 0) {
        console.warn(`\n  WARNING: ${unreadable} page(s) of the auth user list could not be read.`)
        console.warn(`  A "not found" here may be wrong. See the note on findUser().`)
      }
      return null
    }
  }
  return null
}

async function create() {
  const existing = await findUser()
  if (existing) {
    console.log(`\nAlready exists. Sign in with:\n  ${EMAIL}\n  ${PASSWORD}\n`)
    return
  }

  const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: FULL_NAME, is_test_account: true },
  })
  if (userErr || !userRes.user) throw new Error(`Could not create the account: ${userErr?.message}`)
  const coachId = userRes.user.id

  const { error: cfgErr } = await admin.from('tenant_config').insert({
    coach_id: coachId,
    // interpret is the pilot tier: the read and the weekly loop, no prescribing.
    product_tier: 'interpret',
    brand: {
      name: BUSINESS,
      nameWithMark: BUSINESS,
      tagline: 'Strength coaching',
      logoUrlLight: '/logo-black.png',
      logoUrlDark: '/logo-white.png',
      apexDomain: 'testcoach.example.com',
      marketingDomain: 'https://testcoach.example.com',
      performanceDomain: 'https://testcoach.example.com',
      appDomain: 'https://testcoach.example.com',
      supportEmail: EMAIL,
      replyToEmail: EMAIL,
      fromEmail: EMAIL,
      accentColor: '#1B6DFC',
    },
    coach: {
      firstName: 'Test',
      fullName: FULL_NAME,
      email: EMAIL,
      adminEmail: EMAIL,
      photoUrl: '',
      location: 'Brisbane',
      credentials: '',
      instagramHandle: '',
      personalInstagramHandle: '',
      whatsAppNumber: '',
    },
    products: {},
    licence: { version: '2026-09-21', tenantId: TENANT_ID, poweredBy: true },
    modality: 'strength',
  })
  if (cfgErr) {
    await admin.auth.admin.deleteUser(coachId)
    throw new Error(`Could not create the configuration, so the account was removed again: ${cfgErr.message}`)
  }

  console.log(`
Test coach created.

  Sign in at   /login
  Email        ${EMAIL}
  Password     ${PASSWORD}

  Tier         interpret, which is exactly what a pilot coach gets
  Clients      none, on purpose. This is a coach's genuine first hour.

What to look for:
  - The sidebar should show ten links, not forty-five.
  - Leads, ads, payments, the CRM and the build boards should be GONE, and
    typing one of those addresses should send you back to Today.
  - Inside a client there should be no Training, Nutrition, Direction, Daily
    Sequences, Recovery or Supplements tab.
  - You should see none of the real clients.

Remove it and everything it makes with: npm run coach:test-remove
`)
}

async function status() {
  const user = await findUser()
  if (!user) {
    console.log('\nNo test coach exists. Make one with: npm run coach:test-create\n')
    return
  }
  const { data: cfg } = await admin.from('tenant_config').select('product_tier').eq('coach_id', user.id).maybeSingle()
  const { data: clients } = await admin.from('clients').select('id, name').eq('coach_id', user.id)
  console.log(`\nTest coach exists.\n  ${EMAIL}\n  tier: ${cfg?.product_tier ?? 'NO CONFIG ROW'}\n  clients: ${clients?.length ?? 0}${(clients ?? []).map(c => `\n    - ${c.name}`).join('')}\n`)
}

async function remove() {
  const user = await findUser()
  if (!user) {
    console.log('\nNothing to remove.\n')
    return
  }

  // Their clients first, through the same path a real deletion request uses, so
  // this is also a rehearsal of that.
  const { data: clients } = await admin.from('clients').select('id, name').eq('coach_id', user.id)
  const { deleteClientData } = await import('../src/lib/client-data-request')
  for (const c of clients ?? []) {
    const result = await deleteClientData(admin, c.id as string, { dryRun: false })
    console.log(`  removed ${c.name}: ${result.rowsAffected} records, ${result.filesAffected} files`)
  }

  await admin.from('tenant_config').delete().eq('coach_id', user.id)
  await admin.from('coach_agreements').delete().eq('coach_id', user.id)
  await admin.from('coach_invitations').delete().eq('email', EMAIL)
  await admin.from('support_tickets').delete().eq('coach_id', user.id)
  await admin.auth.admin.deleteUser(user.id)

  console.log(`\nTest coach removed, along with ${clients?.length ?? 0} client(s).\n`)
}

const mode = process.argv[2]
const run = mode === 'create' ? create : mode === 'remove' ? remove : mode === 'status' ? status : null
if (!run) {
  console.error('\nUse create, remove or status.\n')
  process.exit(1)
}
run().catch((e) => {
  console.error(e)
  process.exit(1)
})
