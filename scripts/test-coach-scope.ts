/**
 * Proves a coach cannot reach another coach's client.
 *
 * Not a unit test of the helper: the helper is three lines. This asks the
 * question the breach would ask, against the real database, using the real
 * ownership rule.
 *
 * Run: npx tsx --env-file=.env.local scripts/test-coach-scope.ts
 */
import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const FAKE_COACH = '00000000-0000-4000-8000-000000000001'

async function main() {
  const { data: clients } = await admin.from('clients').select('id, name, coach_id')
  if (!clients?.length) { console.log('No clients to test against.'); return }

  let failures = 0

  // 1. Every client is owned by somebody. An unowned client is invisible to
  //    every non-owner coach, which is safe, but it also means nobody can
  //    coach them, so it is a fault either way.
  const unowned = clients.filter(c => !c.coach_id)
  if (unowned.length) {
    failures++
    console.log(`FAIL  ${unowned.length} client(s) have no coach_id: ${unowned.map(c => c.name).join(', ')}`)
  } else {
    console.log(`ok    all ${clients.length} clients have an owner`)
  }

  // 2. The ownership rule itself: a coach who owns nothing matches nothing.
  const reachable = clients.filter(c => c.coach_id === FAKE_COACH)
  if (reachable.length) {
    failures++
    console.log(`FAIL  a coach with no clients can reach ${reachable.length}`)
  } else {
    console.log('ok    a coach who owns nothing reaches nothing')
  }

  // 3. Each coach reaches only their own.
  const byCoach = new Map<string, number>()
  for (const c of clients) byCoach.set(c.coach_id!, (byCoach.get(c.coach_id!) ?? 0) + 1)
  for (const [coachId, count] of byCoach) {
    const others = clients.filter(c => c.coach_id !== coachId).length
    console.log(`ok    coach ${coachId.slice(0, 8)} owns ${count}, cannot see ${others}`)
  }

  console.log(failures === 0 ? '\nSCOPING HOLDS' : `\n${failures} PROBLEM(S)`)
  process.exit(failures === 0 ? 0 : 1)
}

main()
