// Full backup of every calendar row before any destructive change.
// Writes JSON to the Dropbox playbook folder so it survives outside the repo.
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync } from 'node:fs'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const DIR = '/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/00_PLAYBOOK/_calendar_backups'
const stamp = process.argv[2] ?? 'manual'

async function main() {
  const { data, error } = await db.from('calendar_posts').select('*').order('date')
  if (error) { console.log('ERROR', error.message); process.exit(1) }
  mkdirSync(DIR, { recursive: true })
  const file = `${DIR}/calendar_full_${stamp}.json`
  writeFileSync(file, JSON.stringify(data, null, 2))
  console.log(`Backed up ${data?.length} rows -> ${file}`)
}
main()
