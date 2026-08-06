// Confirms the app's own Supabase credentials work, independently of the CLI.
import { createClient } from '@supabase/supabase-js'
async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { count, error } = await db.from('calendar_posts')
    .select('*', { count: 'exact', head: true }).eq('brand', 'body_recode').eq('phase', 'ads')
  console.log(error ? `ERROR ${error.message}` : `OK - app credentials work. ${count} campaign rows readable.`)
}
main()
