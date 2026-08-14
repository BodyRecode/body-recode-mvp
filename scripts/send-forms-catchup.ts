// One-off PAR-Q + Health Declaration catch-up for the July cohort.
//
// challengeFormsReminderFunction only starts on NEW challenge/enrolled events,
// so the people it was built for - already enrolled when it shipped - are
// invisible to it. This reaches them once.
//
// Dry run by default. Pass --send to actually deliver.
//   npx tsx --env-file=.env.local scripts/send-forms-catchup.ts
//   npx tsx --env-file=.env.local scripts/send-forms-catchup.ts --send
import { runFormsCatchup, PRE_DEPLOY_CUTOFF } from '../src/lib/forms-catchup'

const LIVE = process.argv.includes('--send')

async function main() {
  const r = await runFormsCatchup({ live: LIVE })
  console.log(`${LIVE ? 'SENDING' : 'DRY RUN'} - ${r.eligible} eligible`)
  console.log(`  already caught up:            ${r.alreadySent}`)
  console.log(`  no portal access (cancelled): ${r.noPortalAccess}`)
  console.log(`  cutoff: enrolled before ${PRE_DEPLOY_CUTOFF.toISOString()}\n`)
  if (!LIVE) {
    console.log(r.eligible ? `  ${r.eligible} would be emailed. Re-run with --send.` : '  Nothing to send.')
    return
  }
  for (const s of r.sent) console.log(`  sent    ${s.name} <${s.email}>  ${s.id}`)
  for (const f of r.failed) console.log(`  FAILED  ${f.email}  ${f.error}`)
  if (!r.sent.length && !r.failed.length) console.log('  Nothing to send.')
}
main()
