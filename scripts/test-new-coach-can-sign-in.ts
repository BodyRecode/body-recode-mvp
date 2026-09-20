/**
 * A coach who has just been set up, and owns nobody yet, can get in.
 * Run: npx tsx scripts/test-new-coach-can-sign-in.ts
 *
 * Written 21 September 2026 after the test coach could not sign in. The
 * password was fine. The dashboard defined a coach as "owns at least one
 * client", so a coach on their first ever sign-in was bounced back to the
 * login page, which reads from the outside as a wrong password.
 *
 * Every pilot coach would have hit this, on their first attempt, before they
 * had done anything at all.
 */
import { readFileSync } from 'fs'
import { join } from 'path'
for (const line of readFileSync(join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
import { createClient } from '@supabase/supabase-js'
import { productTierForCoach } from '../src/lib/coach-tier'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const EMAIL = 'testcoach@bodyrecode.au'
const PASSWORD = 'testcoach2026'

let failed = 0
const check = (n: string, ok: boolean, d = '') => {
  if (ok) console.log(`  ok    ${n}`)
  else { failed++; console.log(`  FAIL  ${n}${d ? ` — ${d}` : ''}`) }
}

async function main() {
  console.log('\nA brand new coach, owning nobody\n')

  const { data: signIn, error } = await anon.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  check('the password works', !error, error?.message)
  const coachId = signIn?.user?.id
  if (!coachId) { console.log('\nNo session, stopping.\n'); process.exit(1) }

  const { count } = await admin.from('clients').select('id', { count: 'exact', head: true }).eq('coach_id', coachId)
  check('they own no clients, which is the whole point', (count ?? 0) === 0, `${count} clients`)

  const { data: config } = await admin.from('tenant_config').select('coach_id, product_tier').eq('coach_id', coachId).maybeSingle()
  check('they have been set up as a coach', !!config)
  check('at the pilot tier, not the owner tier', config?.product_tier === 'interpret', String(config?.product_tier))

  // The two guards must agree. A page that loads while every request on it
  // fails is worse than being refused at the door.
  const { isCoachUser } = await import('../src/lib/api-auth')
  check('the route guard lets them in', await isCoachUser({ id: coachId, email: EMAIL } as never))

  const tier = await productTierForCoach(admin, coachId)
  check('their tier is read from their own row', tier === 'interpret', tier)

  const { tierForPath, canAccess } = await import('../src/lib/product-tier')
  check('they may open Today', canAccess(tier, '/dashboard/today'))
  check('they may open their clients', canAccess(tier, '/dashboard/coaching'))
  check('they may NOT open leads', !canAccess(tier, '/dashboard/leads'))
  check('they may NOT open ads', !canAccess(tier, '/dashboard/business/ads'))
  check('they may NOT open payments', !canAccess(tier, '/dashboard/business/payments'))
  check('they may NOT generate a training block', !canAccess(tier, `/dashboard/clients/${coachId}/program/generate`))
  check('they may NOT generate an eating plan', !canAccess(tier, `/dashboard/clients/${coachId}/nutrition/generate`))
  check('an unclassified page still needs owner', tierForPath('/dashboard/something-new') === 'owner')

  // An unknown person must not be promoted by the new rule.
  const stranger = '00000000-0000-0000-0000-000000000000'
  check('someone with no row and no clients is not a coach', await isCoachUser({ id: stranger, email: 'nobody@example.com' } as never) === false)
  check('and gets the lowest tier, never owner', (await productTierForCoach(admin, stranger)) === 'interpret')

  console.log(`\n${failed === 0 ? 'A NEW COACH CAN GET IN, AND NO FURTHER' : `${failed} FAILED`}\n`)
  process.exit(failed === 0 ? 0 : 1)
}
main()
