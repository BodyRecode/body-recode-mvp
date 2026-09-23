/**
 * PROVES, BY TRYING IT, that one coach cannot act on another coach's client.
 *
 * 22 September 2026. Written after I told Kade the co-pilot was wide open by
 * reading the code, and it was not: the ownership check does not live inside
 * each route, it sits in front of all of them, so searching file by file finds
 * an absence that is not there. He pushed back twice and was right twice.
 *
 * THE LESSON THIS SCRIPT EXISTS TO ENFORCE: a claim about who can reach what
 * is proved by making the request, not by reading for a function call.
 *
 * It signs in as the real test coach and aims at a real client belonging to
 * somebody else. Nothing is written: every probe is built to fail at the step
 * AFTER the ownership check, so the status code says whether it got that far.
 *
 *   PASS  the request is refused before it looks at anything
 *   FAIL  the request gets past ownership and fails on something else,
 *         which means the only thing stopping a real one is a valid id
 *
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


const REF = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0]
const BASE = process.env.ISOLATION_BASE ?? 'http://localhost:3000'
const NOBODY = '00000000-0000-0000-0000-000000000000'

type Probe = { name: string; path: string; body: Record<string, unknown> }

async function main() {
  const { data: row } = await admin.from('clients').select('coach_id').eq('email', 'testclient@bodyrecode.au').maybeSingle()
  if (!row?.coach_id) { console.log('\nNo test coach. Run npm run coach:test-create first.\n'); process.exit(1) }

  const { data: others } = await admin.from('clients').select('id, name').neq('coach_id', row.coach_id).limit(1)
  const victim = others?.[0]
  if (!victim) { console.log('\nNo other coach has a client, so there is nothing to test against.\n'); process.exit(1) }

  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: sess, error } = await anon.auth.signInWithPassword({ email: 'testcoach@bodyrecode.au', password: 'testcoach2026' })
  if (error || !sess.session) { console.log(`\nCould not sign in as the test coach: ${error?.message}\n`); process.exit(1) }
  const cookie = `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(sess.session)).toString('base64')}`

  const PROBES: Probe[] = [
    { name: 'co-pilot (id in the address)',        path: `/api/clients/${victim.id}/copilot`, body: { message: 'Summarise this client' } },
    { name: 'client record (id in the address)',   path: `/api/clients/${victim.id}/height`,  body: { height_cm: 170 } },
    { name: 'generate the read (id in the body)',  path: '/api/generate-cffs',                body: { client_id: victim.id, intake_id: NOBODY } },
    { name: 'client-facing read (id in the body)', path: '/api/generate-client-reading',      body: { client_id: victim.id, cffs_id: NOBODY } },
    { name: 'publish the read (id in the body)',   path: '/api/publish-client-reading',       body: { client_id: victim.id, cffs_id: NOBODY } },
    { name: 'program reading (id in the body)',    path: '/api/generate-program-reading',     body: { client_id: victim.id, program_id: NOBODY } },
    // Added 23 Sep 2026 with the testimonial ask. This one SENDS AN EMAIL to a
    // real person if it gets through, which is why it is probed here and
    // deliberately NOT added to the control below: passing the control would
    // mean emailing the test client every time anybody runs this. The control
    // already proves the gate lets a coach reach their own client, and this
    // route is held by the same path rule as the two above it.
    { name: 'ask for a testimonial (id in the address)', path: `/api/clients/${victim.id}/request-testimonial`, body: {} },
  ]

  console.log(`\nSigned in as the test coach.`)
  console.log(`Aiming at "${victim.name}", who belongs to a different coach.\n`)

  let failed = 0
  for (const p of PROBES) {
    const r = await fetch(BASE + p.path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify(p.body),
    })
    const text = (await r.text()).slice(0, 90).replace(/\s+/g, ' ')
    // Refused before it looked at anything is the only pass. Getting far enough
    // to complain about the OTHER id means ownership was never checked.
    const refused = r.status === 401 || r.status === 403 || (r.status === 404 && /not found"?\}?$/i.test(text) && !/intake|cffs|program|reading/i.test(text))
    if (!refused) failed++
    console.log(`  ${refused ? 'PASS' : 'FAIL'}  ${p.name}`)
    console.log(`        ${r.status} ${text}`)
  }

  // THE CONTROL, and it matters more than the probes above. A gate that
  // refuses everybody passes every test up to here and has broken the product.
  // The test coach acting on their OWN client must get through to the route.
  const { data: mine } = await admin.from('clients').select('id, name').eq('coach_id', row.coach_id).limit(1)
  let controlBroken = false
  if (mine?.[0]) {
    console.log(`\nControl: the same requests against the test coach's OWN client, "${mine[0].name}".`)
    console.log(`They must get THROUGH the gate and fail on their own terms instead.`)
    for (const [path, body] of [
      [`/api/clients/${mine[0].id}/height`, { height_cm: null }],
      ['/api/generate-cffs', { client_id: mine[0].id, intake_id: NOBODY }],
      ['/api/generate-client-reading', { client_id: mine[0].id, cffs_id: NOBODY }],
    ] as [string, Record<string, unknown>][]) {
      const r = await fetch(BASE + path, {
        method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify(body),
      })
      const text = (await r.text()).slice(0, 80).replace(/\s+/g, ' ')
      const blocked = text === '{"error":"Not found"}'
      if (blocked) controlBroken = true
      console.log(`  ${blocked ? 'BROKEN' : 'ok    '} ${path}`)
      console.log(`         ${r.status} ${text}`)
    }
  }

  if (controlBroken) {
    console.log(`\nTHE GATE IS REFUSING A COACH THEIR OWN CLIENT. That is worse than the hole.\n`)
    process.exit(1)
  }

  console.log(failed === 0
    ? `\nAll ${PROBES.length} refused. A coach cannot act on another coach's client.\n`
    : `\n${failed} of ${PROBES.length} GOT PAST THE OWNERSHIP CHECK. The only thing stopping a real request is a valid id.\n`)
  process.exit(failed === 0 ? 0 : 1)
}
main().catch(e => { console.error(e); process.exit(1) })
