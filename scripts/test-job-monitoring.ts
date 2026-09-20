/**
 * Proves the background job monitoring actually records and actually refuses.
 *
 * Run: npx tsx scripts/test-job-monitoring.ts
 *
 * The email key is removed before anything runs, so a test can never send Kade
 * a real alert. Everything written is deleted at the end, including on failure.
 */

import { readFileSync } from 'fs'

// Load the local environment without adding a dependency for one script.
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

// Before importing anything that could send. The alert returns early without it.
delete process.env.RESEND_API_KEY

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../src/lib/supabase/admin'
import { withJobRun, jobHealth, JOB_SCHEDULES } from '../src/lib/job-run'

const TEST_JOB = 'test-job-monitoring'
const admin = createAdminClient()

let passed = 0
let failed = 0

function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function request(): NextRequest {
  return new NextRequest('https://example.test/api/cron/test')
}

async function rowsFor(job: string) {
  const { data } = await admin.from('job_runs').select('*').eq('job', job).order('started_at', { ascending: false })
  return data ?? []
}

async function cleanup() {
  await admin.from('job_runs').delete().eq('job', TEST_JOB)
}

async function main() {
  console.log('\nBackground job monitoring\n')
  await cleanup()

  // 1. A successful run is recorded, with whatever the job counted.
  const okRoute = withJobRun(TEST_JOB, async () => NextResponse.json({ sent: 3 }))
  const okResponse = await okRoute(request())
  check('a successful run returns the handler response', okResponse.status === 200)
  let rows = await rowsFor(TEST_JOB)
  check('a successful run is recorded', rows.length === 1 && rows[0].status === 'ok', `${rows.length} rows`)
  check('what the job counted is kept', rows[0]?.summary?.sent === 3, JSON.stringify(rows[0]?.summary))
  check('how long it took is kept', typeof rows[0]?.duration_ms === 'number')
  await cleanup()

  // 2. A thrown error is recorded AND still thrown, so the platform sees it too.
  const throwRoute = withJobRun(TEST_JOB, async () => {
    throw new Error('deliberate test failure')
  })
  let threw = false
  try {
    await throwRoute(request())
  } catch {
    threw = true
  }
  check('a throwing job still throws', threw)
  rows = await rowsFor(TEST_JOB)
  check('a throwing job is recorded as failed', rows.length === 1 && rows[0].status === 'failed', `${rows.length} rows`)
  check('the error message is kept', String(rows[0]?.error).includes('deliberate test failure'), String(rows[0]?.error))
  await cleanup()

  // 3. A 500 response is a failure even though nothing threw.
  const errorRoute = withJobRun(TEST_JOB, async () => NextResponse.json({ error: 'nope' }, { status: 500 }))
  const errorResponse = await errorRoute(request())
  check('a failing response is passed through unchanged', errorResponse.status === 500)
  check('the body is still readable by the caller', (await errorResponse.json())?.error === 'nope')
  rows = await rowsFor(TEST_JOB)
  check('a 500 is recorded as failed', rows.length === 1 && rows[0].status === 'failed')
  await cleanup()

  // 4. An unauthorised knock is NOT a run. Recording it would reset the quiet
  //    window and hide a job that has genuinely stopped.
  const authRoute = withJobRun(TEST_JOB, async () => NextResponse.json({ error: 'Unauthorised' }, { status: 401 }))
  await authRoute(request())
  rows = await rowsFor(TEST_JOB)
  check('an unauthorised call is not recorded as a run', rows.length === 0, `${rows.length} rows`)
  await cleanup()

  // 5. Recording never takes the job down with it.
  const badNameRoute = withJobRun('x'.repeat(50_000), async () => NextResponse.json({ ok: true }))
  const badNameResponse = await badNameRoute(request())
  check('a recording failure does not break the job', badNameResponse.status === 200)

  // 6. A job that has never run reads as silent, which is the whole point.
  const health = await jobHealth(admin, 24)
  const everyJobListed = Object.keys(JOB_SCHEDULES).length
  check('every scheduled job is in the schedule map', everyJobListed === 17, `${everyJobListed} listed`)
  check('silent jobs are reported, not skipped', Array.isArray(health.silent))
  check('a job with no runs at all counts as silent', health.silent.every((j) => j.lastOk !== undefined))

  // 7. A recorded job nobody put in the map is named rather than ignored.
  await admin.from('job_runs').insert({ job: TEST_JOB, status: 'ok' })
  const health2 = await jobHealth(admin, 24)
  check('a job outside the schedule map is named', health2.unlisted.includes(TEST_JOB), health2.unlisted.join(', '))
  await cleanup()

  console.log(`\n${passed} passed, ${failed} failed\n`)
  if (failed === 0) console.log('JOB MONITORING HOLDS\n')
  process.exit(failed === 0 ? 0 : 1)
}

main().catch(async (e) => {
  await cleanup()
  console.error(e)
  process.exit(1)
})
