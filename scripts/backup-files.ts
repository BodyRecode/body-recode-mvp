/**
 * The uploaded files: progress photographs, blood panel documents, medical
 * clearance letters. The half the database backup does not cover.
 *
 * WHY (20 September 2026). The database backup built earlier today covers
 * every row of every table and NOT ONE FILE. Progress photographs and blood
 * panel documents live in Supabase storage, and they were single-copy: if that
 * project went, the photographs a client took in her bathroom on week one went
 * with it, and those are the ones that cannot be retaken later.
 *
 * WHICH BUCKETS, AND WHY NOT ALL OF THEM. Only the private ones, which are the
 * client's own material and irreplaceable: baseline photographs, blood test
 * documents, medical clearance letters, and the library assets. The public
 * buckets (marketing assets, video, audio) are deliberately skipped: they are
 * large, they are reproducible, and mixing them in would make this slow enough
 * that nobody runs it. Pass --include-public to take them anyway.
 *
 * HEALTH INFORMATION AND PHOTOGRAPHS OF PEOPLE. The output is somebody's body,
 * so it goes to Dropbox beside the database backup and nowhere else, the file
 * list is printed rather than the contents, and old backups should be pruned
 * rather than kept forever.
 */
import { createClient } from '@supabase/supabase-js'
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'

// Load .env.local ourselves. THE BACKUP HAS TO WORK FROM A PLAIN TERMINAL,
// because these are run by hand, and one that only works when the environment
// happens to be loaded is one that does not run. Found 20 Sep 2026, when the
// first use from a clean shell failed outright.
try {
  const envPath = join(process.cwd(), '.env.local')
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
} catch {
  // Fall back to whatever is already set.
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const ROOT = join(process.env.HOME!, 'Dropbox', '01_BODY_RECODE', '00_Project_HQ', '09_Archive_and_Backups', 'files')
const PRIVATE_BUCKETS = ['baseline-photos', 'blood-test-docs', 'clearance-docs', 'library-assets']
const PUBLIC_BUCKETS = ['public-assets', 'assets', 'content-audio', 'videos']

interface FileEntry { path: string; size: number }

/** Storage has no recursive list, so walk it. A folder is an entry with no id. */
async function walk(bucket: string, prefix = ''): Promise<FileEntry[]> {
  const out: FileEntry[] = []
  const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 })
  if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`)
  for (const entry of data ?? []) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.id === null) out.push(...(await walk(bucket, path)))
    else out.push({ path, size: (entry.metadata?.size as number) ?? 0 })
  }
  return out
}

async function main() {
  const includePublic = process.argv.includes('--include-public')
  const buckets = includePublic ? [...PRIVATE_BUCKETS, ...PUBLIC_BUCKETS] : PRIVATE_BUCKETS

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const dir = join(ROOT, stamp)
  mkdirSync(dir, { recursive: true })

  const manifest: Array<{ bucket: string; path: string; bytes: number; error?: string }> = []
  let downloaded = 0
  let failed = 0
  let bytes = 0

  for (const bucket of buckets) {
    let files: FileEntry[]
    try {
      files = await walk(bucket)
    } catch (err) {
      failed++
      console.log(`  FAILED  ${bucket}: ${err instanceof Error ? err.message : String(err)}`)
      manifest.push({ bucket, path: '(listing)', bytes: 0, error: String(err) })
      continue
    }
    console.log(`  ${bucket}: ${files.length} files`)

    for (const f of files) {
      const { data, error } = await admin.storage.from(bucket).download(f.path)
      if (error || !data) {
        failed++
        console.log(`    FAILED  ${f.path}: ${error?.message ?? 'no data'}`)
        manifest.push({ bucket, path: f.path, bytes: 0, error: error?.message ?? 'no data' })
        continue
      }
      const buf = Buffer.from(await data.arrayBuffer())
      const dest = join(dir, bucket, f.path)
      mkdirSync(dirname(dest), { recursive: true })
      writeFileSync(dest, buf)
      downloaded++
      bytes += buf.length
      manifest.push({ bucket, path: f.path, bytes: buf.length })
    }
  }

  writeFileSync(
    join(dir, '_manifest.json'),
    JSON.stringify({ taken_at: new Date().toISOString(), buckets, files: manifest, downloaded, failed, bytes }, null, 2),
  )

  console.log('')
  console.log(`${downloaded} files, ${(bytes / 1024 / 1024).toFixed(1)} MB, ${failed} failed`)
  console.log(`written to ${dir}`)
  if (!includePublic) console.log('(public marketing buckets skipped: reproducible, and large enough to stop anyone running this. --include-public takes them too)')
  if (failed > 0) {
    console.log('')
    console.log('A FAILED FILE MEANS THIS BACKUP IS INCOMPLETE. Do not treat it as one.')
    process.exit(1)
  }
  console.log('FILE BACKUP COMPLETE')
}
main()
