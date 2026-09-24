/** Fetch one portal page as the test client and print what you ask for. Used to
 *  check what a CLIENT is actually served, without a browser in the way. */
import { readFileSync } from 'fs'
import { join } from 'path'
for (const line of readFileSync(join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
import { createClient } from '@supabase/supabase-js'

async function main() {
  const rest = process.argv[2] ?? ''
  const needles = process.argv.slice(3)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const ref = url.split('//')[1].split('.')[0]
  const base = process.env.PORTAL_SHOT_BASE ?? 'http://localhost:3100'
  const email = process.env.PORTAL_SHOT_EMAIL ?? 'testclient@bodyrecode.au'

  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: client } = await admin.from('clients').select('onboarding_token').eq('email', email).maybeSingle()
  const { data: link } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: sess, error } = await anon.auth.verifyOtp({ token_hash: link!.properties!.hashed_token, type: 'magiclink' })
  if (error || !sess.session) { console.log('sign-in failed:', error?.message); process.exit(1) }
  const cookie = `sb-${ref}-auth-token=base64-${Buffer.from(JSON.stringify(sess.session)).toString('base64')}`

  const r = await fetch(`${base}/portal/${client!.onboarding_token}${rest}`, { headers: { cookie } })
  const html = await r.text()
  console.log(`${r.status}  ${rest || '/'}  ${html.length} bytes`)
  if (/Sign in to your coaching portal|Send sign-in code/.test(html)) {
    console.log('  SERVED THE SIGN-IN PAGE, so the session was not accepted.')
  }
  for (const n of needles) {
    const count = (html.match(new RegExp(n, 'gi')) || []).length
    console.log(`  ${count === 0 ? 'absent ' : `${count}x     `} ${n}`)
  }
}
main().catch(e => { console.error(e); process.exit(1) })
