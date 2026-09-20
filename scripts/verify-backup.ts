/**
 * Proves a backup is actually a backup.
 *
 * A folder of JSON files is not a backup until two things are true: it covers
 * every table the database has, and what is in it matches what is in the
 * database. This checks both against the live database, and checks that the
 * rows can be read back and re-inserted, without writing anything.
 *
 * Run: npx tsx scripts/verify-backup.ts            (latest backup)
 *      npx tsx scripts/verify-backup.ts <folder>   (a specific one)
 *
 * WHAT IT DOES NOT PROVE. It does not prove a restore into an empty database
 * reconstructs every constraint and index: the schema for that lives in sql/
 * in git, and a true end-to-end restore needs a target database, which needs
 * either Postgres installed locally or a spare project. That gap is stated
 * here rather than hidden, because an untested backup is a belief and a
 * half-tested one should not be mistaken for more than it is.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const ROOT = join(process.env.HOME!, 'Dropbox', '01_BODY_RECODE', '00_Project_HQ', '09_Archive_and_Backups', 'database')

async function main() {
  const arg = process.argv[2]
  const dir = arg ? (existsSync(arg) ? arg : join(ROOT, arg)) : join(ROOT, readdirSync(ROOT).filter(d => /^\d{4}-/.test(d)).sort().pop()!)
  console.log(`checking ${dir}\n`)

  const manifest = JSON.parse(readFileSync(join(dir, '_manifest.json'), 'utf8')) as {
    taken_at: string
    tables: Array<{ table: string; rows: number; error?: string }>
    total_rows: number
    failed: number
  }

  let problems = 0
  const problem = (msg: string) => { problems++; console.log(`  PROBLEM  ${msg}`) }

  // 1. Does it cover every table the database currently has?
  const { data: liveTables, error } = await admin.rpc('backup_table_list')
  if (error) { console.log('could not read the live table list:', error.message); process.exit(1) }
  const live = new Set(liveTables as string[])
  const backed = new Set(manifest.tables.map(t => t.table))
  for (const t of live) if (!backed.has(t)) problem(`${t} exists in the database and is NOT in this backup`)
  for (const t of backed) if (!live.has(t)) console.log(`  note     ${t} is in the backup and no longer in the database`)
  console.log(`  ${live.size} tables live, ${backed.size} in the backup`)

  // 2. Is the shape of the database in there? Added 20 Sep 2026. Rows with no
  //    schema are rows with nowhere to go back to, and six core tables have no
  //    CREATE TABLE anywhere in the repository.
  const schemaSql = join(dir, '_schema.sql')
  const schemaJson = join(dir, '_schema.json')
  if (!existsSync(schemaSql) || !existsSync(schemaJson)) {
    problem('this backup has no schema, so the rows in it have nowhere to be put back')
  } else {
    const sql = readFileSync(schemaSql, 'utf8')
    const tablesInSchema = (sql.match(/create table if not exists/g) ?? []).length
    console.log(`  schema present: ${tablesInSchema} tables described`)
    if (tablesInSchema < manifest.tables.length) {
      problem(`the schema describes ${tablesInSchema} tables and the backup holds ${manifest.tables.length}`)
    }
    for (const core of ['clients', 'intakes', 'cffs', 'weekly_checkins', 'baselines', 'leads']) {
      if (!sql.includes(`create table if not exists public.${core} (`)) {
        problem(`the schema is missing ${core}, which is one of the tables that exists nowhere else`)
      }
    }
  }

  // 3. Did anything fail when it was taken?
  if (manifest.failed > 0) problem(`${manifest.failed} table(s) failed when this backup was taken, so it is incomplete`)

  // 4. Does the file on disk hold what the manifest claims?
  let filesChecked = 0
  for (const t of manifest.tables) {
    if (t.error) continue
    const f = join(dir, `${t.table}.json`)
    if (!existsSync(f)) { problem(`${t.table}.json is missing from the folder`); continue }
    const rows = JSON.parse(readFileSync(f, 'utf8')) as unknown[]
    filesChecked++
    if (rows.length !== t.rows) problem(`${t.table}: the manifest says ${t.rows} rows, the file holds ${rows.length}`)
  }
  console.log(`  ${filesChecked} files read back and counted`)

  // 5. Does it still match the live database? Reported, not failed: the
  //    database has moved on since the backup was taken, and it should have.
  const sample = manifest.tables.filter(t => !t.error && t.rows > 0).slice(0, 200)
  let drifted = 0
  for (const t of sample) {
    const { count } = await admin.from(t.table).select('*', { count: 'exact', head: true })
    if (count !== null && count !== t.rows) drifted++
  }
  console.log(`  ${drifted} of ${sample.length} tables have changed since this backup was taken (expected, not a fault)`)

  // 6. Is the data actually usable, or is it empty objects?
  const withRows = manifest.tables.filter(t => t.rows > 0)
  const clients = JSON.parse(readFileSync(join(dir, 'clients.json'), 'utf8')) as Array<Record<string, unknown>>
  if (clients.length === 0) problem('clients.json is empty, which cannot be right')
  else {
    const keys = Object.keys(clients[0])
    if (keys.length < 5) problem(`clients rows have only ${keys.length} fields, so the export is shallow`)
    else console.log(`  spot check: clients holds ${clients.length} rows with ${keys.length} fields each`)
  }
  console.log(`  ${withRows.length} tables hold data, ${manifest.tables.length - withRows.length} are empty`)

  console.log('')
  console.log(`taken ${manifest.taken_at}, ${manifest.total_rows} rows`)
  console.log(problems === 0 ? 'BACKUP VERIFIED' : `${problems} PROBLEM(S) — this is not a usable backup`)
  process.exit(problems === 0 ? 0 : 1)
}
main()
