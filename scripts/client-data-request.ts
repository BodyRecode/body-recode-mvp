/**
 * Honour a client's request to see, or to remove, what we hold about them.
 *
 * Run:
 *   npm run client:export -- <client id>
 *   npm run client:delete -- <client id>            (dry run, shows what would go)
 *   npm run client:delete -- <client id> --confirm  (actually deletes)
 *
 * A deletion is a dry run unless --confirm is passed, and the dry run prints
 * every table and count so the real thing is never the first time anybody sees
 * the damage.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

for (const line of readFileSync(join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

import { createClient } from '@supabase/supabase-js'
import { exportClientData, deleteClientData, collectClientData } from '../src/lib/client-data-request'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const OUT = join(process.env.HOME!, 'Dropbox', '01_BODY_RECODE', '00_Project_HQ', '09_Archive_and_Backups', 'data_requests')

async function main() {
  const mode = process.argv[2]
  const clientId = process.argv[3]
  const confirmed = process.argv.includes('--confirm')

  if (!clientId) {
    console.error('\nWhich client? Pass their id.\n  npm run client:export -- <client id>\n')
    process.exit(1)
  }

  if (mode === 'export') {
    const result = await exportClientData(admin, clientId)
    if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    const base = join(OUT, `${clientId}-${stamp}`)
    writeFileSync(`${base}.json`, result.json)
    writeFileSync(`${base}.txt`, result.readable)
    console.log('\n' + result.readable + '\n')
    console.log(`Written to ${base}.json and ${base}.txt\n`)
    return
  }

  if (mode === 'delete') {
    const haul = await collectClientData(admin, clientId)
    console.log(`\nAbout to remove everything held about ${String(haul.client.name)} (${String(haul.client.email ?? 'no email')}).`)

    if (!confirmed) {
      console.log('\nDRY RUN. Nothing will be deleted. Add --confirm to do it for real.\n')
    } else {
      console.log('\nCONFIRMED. This cannot be undone.\n')
    }

    const result = await deleteClientData(admin, clientId, { dryRun: !confirmed })

    for (const t of result.tablesTouched.filter((t) => t.rows > 0)) {
      const mark = result.dryRun ? 'would go' : t.deleted ? 'deleted ' : 'FAILED  '
      console.log(`  ${mark}  ${String(t.rows).padStart(5)}  ${t.table}${t.error ? `  (${t.error})` : ''}`)
    }
    console.log(`\n  ${result.rowsAffected} records, ${result.filesAffected} uploaded files, ${result.freeTextScrubbed} mentions of the name in saved report text.`)
    for (const w of result.warnings) console.log(`\n  NOTE: ${w}`)
    console.log('')

    if (!confirmed) console.log('Nothing was deleted. Re-run with --confirm.\n')
    return
  }

  console.error('\nUse "export" or "delete".\n')
  process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
