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
 * Renders a dashboard page AS THE TEST COACH, so a page can be looked at rather
 * than reasoned about. 22 September 2026, and it exists because reading the
 * code instead of using the product produced two confident wrong answers in one
 * afternoon.
 *
 *   npx tsx scripts/coach-shot.ts /dashboard/today
 */
import { writeFileSync } from 'fs'
import { execSync } from 'child_process'

const REF = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0]
const BASE = process.env.SHOT_BASE ?? 'http://localhost:3000'
const OUT = process.env.SHOT_OUT ?? '/tmp/coach-shot'

async function main() {
  const path = process.argv[2] ?? '/dashboard/today'
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: sess, error } = await anon.auth.signInWithPassword({ email: 'testcoach@bodyrecode.au', password: 'testcoach2026' })
  if (error || !sess.session) { console.log(`Sign-in failed: ${error?.message}`); process.exit(1) }
  const cookie = `sb-${REF}-auth-token=base64-${Buffer.from(JSON.stringify(sess.session)).toString('base64')}`

  const r = await fetch(BASE + path, { headers: { cookie } })
  let html = await r.text()
  if (r.status >= 300) { console.log(`${path} returned ${r.status}`); }
  // Absolute base so the server's own stylesheets and fonts still load.
  html = html.replace(/<head>/i, `<head><base href="${BASE}/">`)
  const name = path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'page'
  const file = `${OUT}-${name}.html`
  writeFileSync(file, html)
  const png = `${OUT}-${name}.png`
  execSync(`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --screenshot="${png}" --window-size=1440,1100 --virtual-time-budget=6000 --hide-scrollbars "file://${file}" 2>/dev/null`)
  console.log(`${r.status}  ${path}\n${png}`)
}
main().catch(e => { console.error(e); process.exit(1) })
