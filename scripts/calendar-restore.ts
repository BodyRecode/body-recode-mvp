// Put a backed-up month back on the calendar.
//
// Written 22 Aug 2026 alongside clearing September. Kade: "nothing should be in
// the calendar for september at all ... we havent finalised the content yet".
// The clear is only safe because this exists, so keep them together.
//
// Run: npx tsx --env-file=.env.local scripts/calendar-restore.ts <backup.json>
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function main() {
  const file = process.argv[2]
  if (!file) return console.log('usage: calendar-restore.ts <backup.json>')
  const rows = JSON.parse(readFileSync(file, 'utf8')) as any[]
  console.log(`restoring ${rows.length} rows from ${file}`)
  const { error } = await db.from('calendar_posts').upsert(rows, { onConflict: 'id' })
  console.log(error ? `ERROR ${error.message}` : `restored ${rows.length} rows`)
}
main()
