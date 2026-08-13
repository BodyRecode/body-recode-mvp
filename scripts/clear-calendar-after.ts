// Clear the calendar forward of a cutoff date, so it can be repopulated clean.
//
// Deletes every UNPOSTED row dated after the cutoff, across all brands. Rows
// with posted_at set are never touched under any circumstances - those are a
// record of what actually went out on the account and deleting them would make
// the history lie.
//
// A full backup of every row must exist before this runs. scripts/backup-calendar.ts
// writes one to Dropbox; restoring is a straight re-insert of that JSON.
//
// Run: npx tsx --env-file=.env.local scripts/clear-calendar-after.ts 2026-08-09 [--confirm]
// Without --confirm it only reports.
import { createClient } from '@supabase/supabase-js'
import { existsSync, readdirSync } from 'node:fs'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const BACKUPS = '/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/00_PLAYBOOK/_calendar_backups'
const cutoff = process.argv[2]
const CONFIRM = process.argv.includes('--confirm')

async function main() {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoff ?? '')) {
    console.log('usage: clear-calendar-after.ts YYYY-MM-DD [--confirm]'); process.exit(1)
  }

  // Refuse to run without a backup on disk. This is the only safety net.
  if (!existsSync(BACKUPS) || !readdirSync(BACKUPS).some(f => f.endsWith('.json'))) {
    console.log(`REFUSING: no backup found in ${BACKUPS}`)
    console.log('Run scripts/backup-calendar.ts first.'); process.exit(1)
  }

  const { data, error } = await db.from('calendar_posts')
    .select('id, date, brand, platform, type, phase, title, posted_at')
    .gt('date', cutoff).is('posted_at', null)
  if (error) { console.log('ERROR', error.message); process.exit(1) }
  const rows = data ?? []

  const g = new Map<string, number>()
  for (const r of rows) {
    const k = `${r.brand} | ${r.platform} | ${r.type === 'story' ? 'STORY' : 'post'}`
    g.set(k, (g.get(k) ?? 0) + 1)
  }
  console.log(`Unposted rows dated after ${cutoff}: ${rows.length}\n`)
  for (const [k, n] of [...g].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${k}`)

  // Belt and braces: prove nothing posted is in the set before deleting.
  const anyPosted = rows.filter(r => r.posted_at)
  if (anyPosted.length) { console.log(`\nABORT: ${anyPosted.length} posted rows in the set.`); process.exit(1) }

  if (!CONFIRM) { console.log('\n[report only] re-run with --confirm to delete.'); return }

  const ids = rows.map(r => r.id)
  let done = 0
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100)
    const { error: e } = await db.from('calendar_posts').delete().in('id', batch)
    if (e) { console.log(`ERROR on batch ${i}: ${e.message}`); process.exit(1) }
    done += batch.length
  }
  console.log(`\nDeleted ${done} rows.`)

  const { count } = await db.from('calendar_posts')
    .select('*', { count: 'exact', head: true }).gt('date', cutoff).is('posted_at', null)
  console.log(`Remaining unposted rows after ${cutoff}: ${count}`)
  const { count: kept } = await db.from('calendar_posts')
    .select('*', { count: 'exact', head: true }).not('posted_at', 'is', null)
  console.log(`Posted rows preserved: ${kept}`)
}
main()
