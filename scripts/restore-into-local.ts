/**
 * Put a backup back, into a local PostgreSQL, and count what arrived.
 *
 * WHY THIS EXISTS. An untested backup is a belief. This is the rehearsal, and
 * running it on 20 September 2026 is what turned the schema capture from a
 * plausible file into one that actually rebuilds the database: the first
 * attempt produced 1,015 errors and 68 of 116 tables, and every fix in
 * backup-database.ts after that came from watching this fail.
 *
 * It restores into a LOCAL database and never touches anything remote. The
 * connection is hard-coded to localhost for that reason.
 *
 * Run:
 *   createdb restore_test
 *   psql -d restore_test -f <backup>/_schema.sql
 *   npx tsx scripts/restore-into-local.ts <backup folder> [database]
 */
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'
import { Client } from 'pg'

const ROOT = join(process.env.HOME!, 'Dropbox', '01_BODY_RECODE', '00_Project_HQ', '09_Archive_and_Backups', 'database')

async function main() {
  const arg = process.argv[2]
  const dir = arg ? (existsSync(arg) ? arg : join(ROOT, arg)) : join(ROOT, readdirSync(ROOT).filter(d => /^\d{4}-/.test(d)).sort().pop()!)
  const database = process.argv[3] ?? 'restore_test'

  const manifest = JSON.parse(readFileSync(join(dir, '_manifest.json'), 'utf8')) as {
    tables: Array<{ table: string; rows: number; error?: string }>
  }

  const client = new Client({ host: 'localhost', database })
  await client.connect()
  console.log(`restoring ${dir}\ninto local database "${database}"\n`)

  // Constraints off for the load: the rows are internally consistent, but the
  // order tables are loaded in is not the order foreign keys would require.
  await client.query('set session_replication_role = replica')

  let inserted = 0
  let failedTables = 0
  const problems: string[] = []

  for (const t of manifest.tables) {
    if (t.error || t.rows === 0) continue
    const rows = JSON.parse(readFileSync(join(dir, `${t.table}.json`), 'utf8')) as Array<Record<string, unknown>>
    if (rows.length === 0) continue

    const columns = Object.keys(rows[0])
    const quoted = columns.map(c => `"${c}"`).join(', ')

    // Ask each column what it is. A text[] column needs a real array and a
    // jsonb column needs a string, and they look identical in JSON. Getting
    // this wrong cost eight tables on the first rehearsal run, all reporting
    // "malformed array literal".
    const { rows: typeRows } = await client.query<{ column_name: string; data_type: string }>(
      `select column_name, data_type from information_schema.columns where table_schema = 'public' and table_name = $1`,
      [t.table],
    )
    const typeOf = new Map(typeRows.map(r => [r.column_name, r.data_type]))

    let tableInserted = 0
    for (const row of rows) {
      const values = columns.map(c => {
        const v = row[c]
        if (v === null || typeof v !== 'object') return v
        const type = typeOf.get(c)
        if (type === 'ARRAY') return v            // node-postgres writes the array literal
        return JSON.stringify(v)                   // json and jsonb want text
      })
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
      try {
        await client.query(`insert into public."${t.table}" (${quoted}) values (${placeholders}) on conflict do nothing`, values)
        tableInserted++
      } catch (err) {
        problems.push(`${t.table}: ${err instanceof Error ? err.message.slice(0, 90) : String(err)}`)
        break
      }
    }
    if (tableInserted !== rows.length) failedTables++
    inserted += tableInserted
    console.log(`  ${tableInserted === rows.length ? 'ok    ' : 'PART  '}${t.table.padEnd(38)} ${tableInserted}/${rows.length}`)
  }

  await client.query('set session_replication_role = origin')

  // The proof: count what is actually in the restored database.
  const { rows: counts } = await client.query<{ total: string }>(
    `select coalesce(sum(n), 0)::text as total from (
       select (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', table_name), false, true, '')))[1]::text::int as n
       from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'
     ) x`,
  )

  await client.end()

  console.log('')
  console.log(`inserted ${inserted} rows`)
  console.log(`the restored database now holds ${counts[0].total} rows`)
  if (problems.length) {
    console.log('')
    for (const p of problems.slice(0, 10)) console.log(`  PROBLEM  ${p}`)
  }
  console.log('')
  console.log(failedTables === 0 ? 'RESTORE REHEARSED AND CLEAN' : `${failedTables} table(s) did not fully restore`)
  process.exit(failedTables === 0 ? 0 : 1)
}
main()
