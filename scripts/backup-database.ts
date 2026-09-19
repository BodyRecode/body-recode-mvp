/**
 * A backup of the whole database that does not depend on Docker, pg_dump, or
 * anything Supabase has to do for us.
 *
 * WHY THIS EXISTS (20 September 2026). Auditing the "know when it breaks"
 * board step turned up something worse than the untested restore it was
 * supposed to cover: THERE WAS NO BACKUP AT ALL. The Supabase command line
 * tool needs Docker to take a dump, Docker is not installed on this machine,
 * pg_dump is not installed either, and nothing in Dropbox was a database
 * backup. Every copy of this data lived inside one Supabase project, and if
 * that project were deleted, billed into suspension or compromised, the
 * recovery path was to ask Supabase nicely.
 *
 * WHAT THIS IS, AND WHAT IT IS NOT. It reads every row of every table through
 * the same interface the application uses and writes it as JSON. That is a
 * DATA backup. It is not a schema dump: the schema lives in sql/ in git, which
 * is version controlled and older than any of this data, so the pair of them
 * is a complete recovery story. It does not capture storage buckets (progress
 * photographs, blood panel files), which are named as a gap rather than
 * silently missed.
 *
 * HEALTH INFORMATION. The output contains client health information, so it is
 * written to Dropbox rather than anywhere public, and the file list is printed
 * rather than the contents. Retention follows the seven years the privacy
 * policy states, which means old backups are NOT to be left lying around
 * indefinitely: prune them when the practice has a retention routine.
 */
import { createClient } from '@supabase/supabase-js'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const ROOT = join(process.env.HOME!, 'Dropbox', '01_BODY_RECODE', '00_Project_HQ', '09_Archive_and_Backups', 'database')
const PAGE = 1000

async function listTables(): Promise<string[]> {
  // Asked of the database rather than kept in a list here, because a
  // hand-maintained list fails silently the first time somebody adds a table
  // and forgets. See sql/2026-09-20_backup_table_list.sql.
  const { data, error } = await admin.rpc('backup_table_list')
  if (error) throw new Error(`Could not read the table list: ${error.message}`)
  if (!Array.isArray(data) || data.length === 0) throw new Error('The table list came back empty, which cannot be right.')
  return data as string[]
}

async function dumpTable(table: string): Promise<{ table: string; rows: number; error?: string }> {
  const all: unknown[] = []
  let from = 0
  for (;;) {
    const { data, error } = await admin.from(table).select('*').range(from, from + PAGE - 1)
    if (error) return { table, rows: 0, error: error.message }
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return { table, rows: all.length, data: all } as { table: string; rows: number; data: unknown[] }
}

async function main() {
  const tables = await listTables()
  console.log(`${tables.length} tables to back up\n`)

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const dir = join(ROOT, stamp)
  mkdirSync(dir, { recursive: true })

  const manifest: Array<{ table: string; rows: number; error?: string }> = []
  let totalRows = 0
  let failed = 0

  for (const t of tables) {
    const res = await dumpTable(t) as { table: string; rows: number; error?: string; data?: unknown[] }
    if (res.error) {
      failed++
      console.log(`  FAILED  ${t}: ${res.error}`)
      manifest.push({ table: t, rows: 0, error: res.error })
      continue
    }
    writeFileSync(join(dir, `${t}.json`), JSON.stringify(res.data ?? [], null, 0))
    totalRows += res.rows
    manifest.push({ table: t, rows: res.rows })
    console.log(`  ok      ${t.padEnd(38)} ${res.rows}`)
  }

  writeFileSync(
    join(dir, '_manifest.json'),
    JSON.stringify({ taken_at: new Date().toISOString(), tables: manifest, total_rows: totalRows, failed }, null, 2),
  )

  console.log('')
  console.log(`${tables.length} tables, ${totalRows} rows, ${failed} failed`)
  console.log(`written to ${dir}`)
  if (failed > 0) {
    console.log('')
    console.log('A FAILED TABLE MEANS THIS BACKUP IS INCOMPLETE. Do not treat it as one.')
    process.exit(1)
  }
  console.log('BACKUP COMPLETE')
}
main()
