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


/**
 * Proves an ENDED client cannot open their own portal pages.
 *
 * 23 September 2026. Written because the only thing stopping them was a ban on
 * their login, applied at offboarding, and twenty-nine of the forty-one portal
 * pages never checked whether the engagement had ended. A ban is not a gate.
 *
 * It ends a real test client, tries the pages that matter, then restores them,
 * so it can be run any time without leaving anybody offboarded.
 *
 * IT SIGNS IN AS THE CLIENT. Without a session the middleware bounces every
 * portal request to the sign-in page, so an unauthenticated sweep reports
 * "closed" for everything and proves nothing at all. The first version of this
 * did exactly that and looked like a pass.
 */
const BASE = process.env.PORTAL_BASE ?? 'http://localhost:3100'

async function main() {
  const { data: c } = await admin.from('clients')
    .select('id, name, onboarding_token, ended_at')
    .eq('email', 'alison.whelan@testbook.bodyrecode.au').maybeSingle()
  if (!c) { console.log('\nNo test client. Run npm run coach:test-book first.\n'); process.exit(1) }
  if (c.ended_at) { console.log('\nThat client is already ended; restore it first.\n'); process.exit(1) }

  const token = c.onboarding_token as string
  const EMAIL = 'alison.whelan@testbook.bodyrecode.au'
  const PASSWORD = 'portal-test-2026'

  // A portal login for the test client, made here and removed at the end.
  let madeUser: string | null = null
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  let signIn = await anon.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  if (!signIn.data.session) {
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: EMAIL, password: PASSWORD, email_confirm: true,
    })
    if (cErr || !created.user) { console.log(`\nCould not make a portal login: ${cErr?.message}\n`); process.exit(1) }
    madeUser = created.user.id
    signIn = await anon.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  }
  if (!signIn.data.session) { console.log('\nCould not sign in as the client.\n'); process.exit(1) }
  const REF = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0]
  const cookie = `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(signIn.data.session)).toString('base64')}`
  const PAGES = ['', '/foundational-reading', '/readings', '/progress-read', '/nutrition', '/training', '/bloods', '/account']

  async function sweep(label: string) {
    console.log(`\n${label}`)
    for (const p of PAGES) {
      const r = await fetch(`${BASE}/portal/${token}${p}`, { redirect: 'manual', headers: { cookie } })
      const to = r.headers.get('location') ?? ''
      const closed = to.includes('/portal/ended')
      const signin = to.includes('/portal/login')
      const state = closed ? 'closed  ' : signin ? 'NOT SIGNED IN' : `OPEN (${r.status})`
      console.log(`  ${state} /portal/…${p || ' (home)'}`)
    }
  }

  await sweep('While the engagement is live:')
  await admin.from('clients').update({ ended_at: new Date().toISOString(), active: false }).eq('id', c.id)
  await sweep('After it ends (every line must read "closed"):')
  await admin.from('clients').update({ ended_at: null, active: true }).eq('id', c.id)
  if (madeUser) await admin.auth.admin.deleteUser(madeUser)
  console.log(`\n${c.name} restored${madeUser ? ', portal login removed' : ''}.\n`)
}
main().catch(e => { console.error(e); process.exit(1) })
