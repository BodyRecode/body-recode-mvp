// Manual runner for the Body Decode Check-In catch-up.
//
// The scheduled job at /api/cron/checkin-catchup does this automatically every
// morning at 7am Brisbane. This script exists for running it on demand or
// previewing who is currently eligible without sending anything.
//
// All the logic, and every safety guard, lives in src/lib/checkin-catchup.ts
// so the cron and this script can never diverge. See that file for why the
// pre-deploy cutoff matters.
//
// Dry run by default. Pass --send to actually deliver.
//
//   npx tsx --env-file=.env.local scripts/send-checkin-catchup.ts
//   npx tsx --env-file=.env.local scripts/send-checkin-catchup.ts --send

import { runCheckinCatchup, PRE_DEPLOY_CUTOFF } from '../src/lib/checkin-catchup'

const LIVE = process.argv.includes('--send')

async function main() {
  const r = await runCheckinCatchup({ live: LIVE })

  console.log(`${LIVE ? 'SENDING' : 'DRY RUN'} - ${r.eligible} eligible`)
  console.log(`  pre-deploy cohort still active + no Check-In: ${r.cohortRemaining}`)
  console.log(`  already caught up: ${r.alreadyCaughtUp}`)
  console.log(`  not yet at Day 7: ${r.notYetDay7}`)
  console.log(`  cutoff: enrolled before ${PRE_DEPLOY_CUTOFF.toISOString()}\n`)

  if (!LIVE) {
    console.log(
      r.eligible
        ? `  ${r.eligible} would be emailed. Re-run with --send to deliver.`
        : '  Nothing to send.'
    )
    return
  }

  for (const s of r.sent) console.log(`  sent    day ${s.day}  ${s.email}  ${s.id}`)
  for (const f of r.failed) console.log(`  FAILED  ${f.email}  ${f.error}`)
  if (!r.sent.length && !r.failed.length) console.log('  Nothing to send.')
}

main().catch((e) => {
  console.error('FAILED:', e instanceof Error ? e.message : e)
  process.exit(1)
})
