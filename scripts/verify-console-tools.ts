/**
 * Verify the Operator Console's read tools against the live database.
 *
 * The UI is auth-gated, so it cannot be click-tested from here. This runs the
 * tool layer directly with a real scope and prints what each tool returns —
 * which catches the class of bug a typecheck cannot: a wrong column name, a
 * filter that silently matches nothing, a join that returns the wrong shape.
 *
 * Run: npx tsx --env-file=.env.local scripts/verify-console-tools.ts
 */

import { createAdminClient } from '../src/lib/supabase/admin'
import { runReadTool } from '../src/lib/console/tools-read'
import type { ConsoleScope } from '../src/lib/console/scope'

async function main() {
  const admin = createAdminClient()

  // Resolve the coach the same way the app does, rather than hardcoding an id.
  const { data: rows } = await admin
    .from('clients')
    .select('coach_id')
    .not('coach_id', 'is', null)
    .limit(50)

  const counts = new Map<string, number>()
  for (const r of rows ?? []) {
    const id = r.coach_id as string
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  const coachId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  if (!coachId) throw new Error('No coach found — cannot verify.')

  const scope: ConsoleScope = { coachId, email: 'verify@local', admin }
  console.log(`Scope: coach ${coachId}\n`)

  const cases: Array<[string, Record<string, unknown>]> = [
    ['count_leads', {}],
    ['count_leads', { never_moved: true }],
    ['count_leads', { status: 'new_check_in' }],
    ['find_leads', { never_moved: true, limit: 3 }],
    ['find_clients', { state: 'active', limit: 5 }],
    ['find_clients', { state: 'ended', limit: 5 }],
    ['recent_sends', { days: 14, limit: 5 }],
    ['list_workflows', {}],
    ['roster_attention', { limit: 5 }],
    ['content_context', { window: 'both', limit: 4 }],
    ['awaiting_decision', {}],
    ['awaiting_decision', { due_only: true }],
  ]

  let failures = 0
  for (const [name, args] of cases) {
    const label = `${name}(${JSON.stringify(args)})`
    try {
      const started = Date.now()
      const out = await runReadTool(name, args, scope)
      const ms = Date.now() - started
      console.log(`✓ ${label}  → count=${out.count}  ${ms}ms`)
      console.log(`  ${JSON.stringify(out.result).slice(0, 320)}\n`)
    } catch (err) {
      failures++
      console.log(`✗ ${label}\n  ${err instanceof Error ? err.message : String(err)}\n`)
    }
  }

  // get_lead needs a real name, so pull one from the scoped set first.
  const { data: sample } = await admin
    .from('leads')
    .select('name')
    .eq('coach_id', coachId)
    .not('name', 'is', null)
    .limit(1)

  if (sample?.length) {
    const query = (sample[0].name as string).split(' ')[0]
    try {
      const out = await runReadTool('get_lead', { query }, scope)
      console.log(`✓ get_lead({query:"${query}"}) → count=${out.count}`)
      console.log(`  ${JSON.stringify(out.result).slice(0, 320)}\n`)
    } catch (err) {
      failures++
      console.log(`✗ get_lead → ${err instanceof Error ? err.message : String(err)}\n`)
    }
  }

  // Scope proof: the same tool under a coach id that owns nothing must return
  // empty. If this returns rows, the scoping is not doing its job.
  const empty: ConsoleScope = {
    coachId: '00000000-0000-0000-0000-000000000000',
    email: 'nobody@local',
    admin,
  }
  const leaked = await runReadTool('count_leads', {}, empty)
  const clientsLeaked = await runReadTool('find_clients', { state: 'all' }, empty)
  // calendar_posts is checked by name because it was the last table to gain an
  // owner column (2026-08-17). If this ever returns rows again, the scoping
  // regressed or a seed inserted without coach_id.
  const contentLeaked = await runReadTool('content_context', { window: 'both' }, empty)
  const ok = leaked.count === 0 && clientsLeaked.count === 0 && contentLeaked.count === 0
  console.log(
    `${ok ? '✓' : '✗ LEAK'} scope isolation: unknown coach sees ${leaked.count} leads, ` +
    `${clientsLeaked.count} clients, ${contentLeaked.count} posts`,
  )
  if (!ok) failures++

  // Unowned rows would be invisible to the scoped read rather than error, so
  // check for them explicitly instead of trusting silence.
  const { count: orphanPosts } = await admin
    .from('calendar_posts')
    .select('id', { count: 'exact', head: true })
    .is('coach_id', null)
  if (orphanPosts && orphanPosts > 0) {
    failures++
    console.log(`✗ ${orphanPosts} calendar_posts rows have no coach_id — invisible to the console.`)
  } else {
    console.log('✓ every calendar_posts row has an owner')
  }

  console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`}`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
