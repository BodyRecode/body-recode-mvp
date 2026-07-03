import { createClient } from '@supabase/supabase-js'

async function main() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const now = new Date()
  const in48h = new Date(now.getTime() + 48 * 3600 * 1000)

  const { data, error } = await admin
    .from('calendar_posts')
    .select('id, title, scheduled_publish_at, publish_attempts, publish_error, posted_at')
    .eq('brand', 'body_recode')
    .eq('platform', 'instagram')
    .neq('type', 'story')
    .is('posted_at', null)
    .not('scheduled_publish_at', 'is', null)
    .lte('scheduled_publish_at', in48h.toISOString())
    .order('scheduled_publish_at', { ascending: true })

  if (error) { console.error(error); process.exit(1) }

  const rows = data ?? []
  console.log(`\nUnpublished BR IG posts scheduled through +48h: ${rows.length}\n`)
  const nowMs = now.getTime()
  for (const r of rows) {
    const dueMs = new Date(r.scheduled_publish_at).getTime()
    const state = dueMs <= nowMs ? '🔴 OVERDUE' : '⏳ upcoming'
    const delta = Math.round((dueMs - nowMs) / 60000)
    console.log(`${state}  ${r.scheduled_publish_at}  (${delta >= 0 ? '+' : ''}${delta} min)`)
    console.log(`         ${r.title}`)
    console.log(`         attempts=${r.publish_attempts ?? 0}  error=${r.publish_error ?? '—'}`)
    console.log('')
  }
}
main().catch(e => { console.error(e); process.exit(1) })
