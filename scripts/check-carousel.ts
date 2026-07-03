import { createClient } from '@supabase/supabase-js'

async function main() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data } = await admin
    .from('calendar_posts')
    .select('id, title, scheduled_publish_at, posted_at, publish_attempts, publish_error, ig_post_url')
    .eq('brand', 'body_recode')
    .eq('platform', 'instagram')
    .neq('type', 'story')
    .gte('date', '2026-07-01')
    .lte('date', '2026-07-04')
    .order('scheduled_publish_at', { ascending: true })

  console.log(`\nAll BR IG posts 2026-07-01 → 2026-07-04:\n`)
  for (const r of data ?? []) {
    console.log(`▸ ${r.title}`)
    console.log(`  scheduled: ${r.scheduled_publish_at ?? '—'}`)
    console.log(`  posted:    ${r.posted_at ?? '—'}`)
    console.log(`  attempts:  ${r.publish_attempts ?? 0}   error: ${r.publish_error ?? '—'}`)
    console.log(`  IG URL:    ${r.ig_post_url ?? '—'}`)
    console.log('')
  }
}
main().catch(e => { console.error(e); process.exit(1) })
