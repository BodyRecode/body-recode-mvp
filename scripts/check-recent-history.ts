import { createClient } from '@supabase/supabase-js'

async function main() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data } = await admin
    .from('calendar_posts')
    .select('id, title, date, scheduled_publish_at, posted_at, publish_attempts, publish_error, ig_post_url, type')
    .eq('brand', 'body_recode')
    .eq('platform', 'instagram')
    .gte('date', '2026-06-28')
    .lte('date', '2026-07-04')
    .order('date', { ascending: true })

  console.log(`\nAll BR IG posts 2026-06-28 → 2026-07-04:\n`)
  for (const r of data ?? []) {
    const status = r.posted_at
      ? '✅ POSTED'
      : r.scheduled_publish_at
        ? new Date(r.scheduled_publish_at).getTime() < Date.now()
          ? '🔴 OVERDUE, unpublished'
          : '⏳ upcoming'
        : '⚠️  no schedule (not queued)'
    console.log(`${status}  ${r.date}  ${r.type}`)
    console.log(`  ${r.title}`)
    console.log(`  scheduled: ${r.scheduled_publish_at ?? '—'}   posted: ${r.posted_at ?? '—'}   attempts: ${r.publish_attempts ?? 0}`)
    if (r.publish_error) console.log(`  ERROR: ${r.publish_error}`)
    console.log('')
  }
}
main().catch(e => { console.error(e); process.exit(1) })
