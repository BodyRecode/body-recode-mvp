/**
 * See a portal page the way a CLIENT sees it: signed in as a real client, at a
 * real phone width.
 *
 *   npm run build && npx next start -p 3100
 *   npx tsx scripts/portal-shot.ts /readings
 *
 * TWO THINGS IT EXISTS TO GET RIGHT, both learned the hard way.
 *
 * 1. A REAL PHONE VIEWPORT. Chrome headless --window-size sets the WINDOW, not
 *    the layout viewport: it lays the page out wide and crops the screenshot,
 *    so a page that is perfectly fine looks like it overflows its edges. That
 *    cost two rounds of fixing a non-existent overflow on 10 Sep, and nearly a
 *    third on the portal sign-in on 23 Sep. The page renders inside an iframe
 *    sized in CSS pixels, which IS a real viewport.
 *
 * 2. AGAINST A BUILD, NOT THE DEV SERVER. Tailwind compiles arbitrary values on
 *    demand, so a long-running dev server serves CSS that never learned newly
 *    written ones and elements render with no background at all, which reads as
 *    "not converted yet". A screenshot is only evidence if it came from the
 *    code that ships.
 *
 * It signs in as the test client through the same door a client uses, so what
 * comes back is what they would actually be served, including anything their
 * own state hides or shows.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

for (const line of readFileSync(join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

import { createClient } from '@supabase/supabase-js'

const BASE = process.env.PORTAL_SHOT_BASE ?? 'http://localhost:3100'
const CLIENT_EMAIL = process.env.PORTAL_SHOT_EMAIL ?? 'testclient@bodyrecode.au'
const OUT = '/tmp/portal-shot'

async function main() {
  const rest = process.argv[2] ?? ''
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const ref = url.split('//')[1].split('.')[0]

  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: client } = await admin
    .from('clients').select('id, onboarding_token').eq('email', CLIENT_EMAIL).maybeSingle()
  if (!client?.onboarding_token) {
    console.log(`No client for ${CLIENT_EMAIL}. Run npm run coach:test-create first.`)
    process.exit(1)
  }

  // The same door a client uses: a one-time link, exchanged for a session.
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink', email: CLIENT_EMAIL,
  })
  if (linkErr || !link?.properties) { console.log(`Could not make a link: ${linkErr?.message}`); process.exit(1) }

  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: sess, error: sessErr } = await anon.auth.verifyOtp({
    token_hash: link.properties.hashed_token, type: 'magiclink',
  })
  if (sessErr || !sess.session) { console.log(`Sign-in failed: ${sessErr?.message}`); process.exit(1) }
  const cookie = `sb-${ref}-auth-token=base64-${Buffer.from(JSON.stringify(sess.session)).toString('base64')}`

  const path = rest.startsWith('/portal') ? rest : `/portal/${client.onboarding_token}${rest}`
  const r = await fetch(BASE + path, { headers: { cookie } })
  let html = await r.text()
  // Absolute base so the server's own stylesheets and fonts still resolve.
  html = html.replace(/<head>/i, `<head><base href="${BASE}/">`)

  const name = (rest || 'home').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'
  const page = `${OUT}-${name}.html`
  writeFileSync(page, html)

  // The iframe is the whole point. See note 1 above.
  const frame = `${OUT}-${name}-frame.html`
  writeFileSync(frame, `<!doctype html><html><head><style>html,body{margin:0;padding:0;overflow:hidden}iframe{border:0;display:block}</style></head><body><iframe src="file://${page}" width="430" height="932"></iframe></body></html>`)

  const png = `${OUT}-${name}.png`
  execSync(`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --allow-file-access-from-files --hide-scrollbars --window-size=430,932 --virtual-time-budget=5000 --screenshot="${png}" "file://${frame}" 2>/dev/null`)
  console.log(`${r.status}  ${path}\n${png}`)
}

main().catch(e => { console.error(e); process.exit(1) })
