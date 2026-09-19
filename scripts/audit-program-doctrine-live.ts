/**
 * What the four training doctrine rules would do TODAY if they refused.
 *
 * Written 19 September 2026 to replace a guess with a count. The rules have
 * been checked and reported since 14 September but never enforced, because on
 * the day they were written seven of eight blocks broke them and every one had
 * been approved by the coach. Before asking Kade to decide refuse, retry or
 * warn for each rule, this re-measures against every block that exists now.
 *
 * Run: npx tsx scripts/audit-program-doctrine-live.ts
 *
 * RESULT, 19 September 2026: 22 blocks, 10 break at least one rule, 36 breaks
 * in total. 34 of the 36 are the injured-joint rule, and 13 of those 34 are
 * bodyweight exercises (Dead Bug, Bird Dog, Plank, Glute Bridge) that are
 * prescribed FOR the joint rather than loading it. The rule as worded cannot
 * be enforced until it can tell those apart. The remaining 21 are externally
 * loaded (hip thrust for hip pain, leg press and step-ups for knee pain) and
 * are a genuine doctrine question rather than a bug.
 *
 * Two of the four rules are effectively untested: only 2 blocks record the
 * readiness they were generated under, so the Red axial rule has almost no
 * history to judge it on.
 */
import { createClient } from '@supabase/supabase-js'
import { checkProgramDoctrine, injuredJointsFromIntake, type DoctrineExerciseMeta } from '../src/lib/program-doctrine-check'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/** The regulation colour out of the stored readiness object, or null when the block predates it. */
function readinessOf(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null
  const applied = (raw as { applied?: Record<string, unknown> }).applied
  const reg = applied?.regulation
  return typeof reg === 'string' ? reg : null
}

async function main() {
  const { data: exercises } = await admin
    .from('exercises')
    .select('name, axial_loading, stability_demand, primary_joint_stress, load_profile, equipment')
  const exerciseByName = new Map<string, DoctrineExerciseMeta>()
  const loadProfileByName = new Map<string, string>()
  for (const e of exercises ?? []) {
    exerciseByName.set(String(e.name).toLowerCase(), {
      axial_loading: Boolean(e.axial_loading),
      stability_demand: (e.stability_demand as string) ?? null,
      primary_joint_stress: (e.primary_joint_stress as string) ?? null,
      load_profile: (e.load_profile as string) ?? null,
    })
    loadProfileByName.set(String(e.name).toLowerCase(), String(e.load_profile ?? ''))
  }
  console.log(`exercise library: ${exerciseByName.size} entries\n`)

  const { data: programs } = await admin
    .from('programs')
    .select('id, client_id, status, sessions, generated_at, body_state_at_generation, readiness_at_generation, body_state_override')
    .order('generated_at', { ascending: false })

  // body_state lives on the program (body_state_at_generation), not on the client.
  const { data: clients } = await admin.from('clients').select('id, name')
  const clientById = new Map((clients ?? []).map(c => [c.id as string, c]))

  const { data: intakes } = await admin
    .from('intakes')
    .select('client_id, injury_location_current, submitted_at')
    .order('submitted_at', { ascending: false })
  const injuriesFor = new Map<string, string[]>()
  for (const i of intakes ?? []) {
    if (!injuriesFor.has(i.client_id as string)) {
      injuriesFor.set(i.client_id as string, (i.injury_location_current as string[]) ?? [])
    }
  }

  const byCode = new Map<string, number>()
  let blocksWithAny = 0
  let blocksChecked = 0
  let withReadiness = 0
  let bodyweightInjured = 0
  let externallyLoadedInjured = 0
  const detail: string[] = []

  for (const p of programs ?? []) {
    const client = clientById.get(p.client_id as string)
    if (!client) continue
    const sessions = (p.sessions as unknown as Array<Record<string, unknown>>) ?? []
    if (!Array.isArray(sessions) || sessions.length === 0) continue
    blocksChecked++
    if (readinessOf(p.readiness_at_generation)) withReadiness++
    const violations = checkProgramDoctrine(sessions as never, {
      // Both are stored ON the block as they were at generation, which is the
      // honest comparison: what the rules would have said at the moment the
      // block was written, not against today's state.
      bodyState: ((p.body_state_override ?? p.body_state_at_generation) as string) ?? null,
      // readiness_at_generation is an object: { applied: { regulation, capacity, ... } }.
      // Only the blocks generated since that field was added carry one, so the
      // Red rule can only be judged on those, and the summary says how many.
      regulationReadiness: readinessOf(p.readiness_at_generation),
      injuredJoints: injuredJointsFromIntake(injuriesFor.get(p.client_id as string)),
      exerciseByName,
    })
    if (violations.length > 0) {
      blocksWithAny++
      detail.push(`  ${client.name} (${p.status}, ${String(p.generated_at).slice(0, 10)}, state ${p.body_state_at_generation ?? '?'}, readiness ${p.readiness_at_generation ?? '?'}): ${violations.length}`)
      for (const v of violations.slice(0, 3)) detail.push(`     - [${v.code}] ${v.exercise}`)
      if (violations.length > 3) detail.push(`     ... and ${violations.length - 3} more`)
    }
    for (const v of violations) {
      byCode.set(v.code, (byCode.get(v.code) ?? 0) + 1)
      if (v.code === 'INJURED_JOINT') {
        const lp = loadProfileByName.get(v.exercise.toLowerCase()) ?? ''
        if (lp === 'bodyweight_profile') bodyweightInjured++
        else externallyLoadedInjured++
      }
    }
  }

  console.log(`${blocksChecked} blocks checked, ${blocksWithAny} break at least one rule`)
  console.log(`${withReadiness} of them record the readiness they were generated under, so the Red rule could only be judged on those\n`)
  console.log('by rule:')
  for (const [code, n] of [...byCode.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${code.padEnd(22)} ${n}`)
  }
  if (byCode.size === 0) console.log('  (none)')
  console.log('')
  console.log('the injured-joint rule, split by whether the exercise carries external load:')
  console.log(`  bodyweight (Dead Bug, Bird Dog, Plank, Glute Bridge and the like): ${bodyweightInjured}`)
  console.log(`  externally loaded (barbell, dumbbell, machine):                   ${externallyLoadedInjured}`)
  console.log('\nblocks:')
  console.log(detail.join('\n') || '  (none)')
}
main()
