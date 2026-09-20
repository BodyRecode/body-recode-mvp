/**
 * Proves a file backup is one: every file that exists in storage is on disk,
 * at the right size, and openable rather than a zero-byte stub.
 * Run: npx tsx scripts/verify-backup-files.ts [folder]
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, existsSync, statSync } from 'fs'
import { join } from 'path'

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

async function walk(bucket: string, prefix = ''): Promise<string[]> {
  const out: string[] = []
  const { data } = await admin.storage.from(bucket).list(prefix, { limit: 1000 })
  for (const e of data ?? []) {
    const path = prefix ? `${prefix}/${e.name}` : e.name
    if (e.id === null) out.push(...(await walk(bucket, path)))
    else out.push(path)
  }
  return out
}

async function main() {
  const arg = process.argv[2]
  const dir = arg ? (existsSync(arg) ? arg : join(ROOT, arg)) : join(ROOT, readdirSync(ROOT).filter(d => /^\d{4}-/.test(d)).sort().pop()!)
  console.log(`checking ${dir}\n`)

  const manifest = JSON.parse(readFileSync(join(dir, '_manifest.json'), 'utf8')) as {
    taken_at: string
    buckets: string[]
    files: Array<{ bucket: string; path: string; bytes: number; error?: string }>
    downloaded: number
    failed: number
  }

  let problems = 0
  const problem = (m: string) => { problems++; console.log(`  PROBLEM  ${m}`) }

  if (manifest.failed > 0) problem(`${manifest.failed} file(s) failed when this was taken, so it is incomplete`)

  // 1. Is every file on disk, at the size claimed, and not empty?
  let checked = 0
  let empty = 0
  for (const f of manifest.files) {
    if (f.error) continue
    const dest = join(dir, f.bucket, f.path)
    if (!existsSync(dest)) { problem(`${f.bucket}/${f.path} is in the manifest and missing from disk`); continue }
    const size = statSync(dest).size
    checked++
    if (size === 0) { empty++; problem(`${f.bucket}/${f.path} is zero bytes`) }
    else if (size !== f.bytes) problem(`${f.bucket}/${f.path}: manifest says ${f.bytes} bytes, disk has ${size}`)
  }
  console.log(`  ${checked} files on disk, ${empty} empty`)

  // 2. Does it cover what storage holds NOW? New files since are expected.
  const backed = new Set(manifest.files.filter(f => !f.error).map(f => `${f.bucket}/${f.path}`))
  let live = 0
  let missing = 0
  for (const bucket of manifest.buckets) {
    for (const path of await walk(bucket)) {
      live++
      if (!backed.has(`${bucket}/${path}`)) missing++
    }
  }
  console.log(`  ${live} files in storage now, ${missing} of them not in this backup (new since it was taken, unless it is stale)`)

  console.log('')
  console.log(`taken ${manifest.taken_at}, ${manifest.downloaded} files`)
  console.log(problems === 0 ? 'FILE BACKUP VERIFIED' : `${problems} PROBLEM(S) — this is not a usable backup`)
  process.exit(problems === 0 ? 0 : 1)
}
main()
