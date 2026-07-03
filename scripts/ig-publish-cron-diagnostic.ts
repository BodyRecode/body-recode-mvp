/**
 * Diagnostic script: runs the EXACT same logic as igPublisherCron in
 * inngest-functions.ts but WITHOUT the Inngest step.run() wrapper.
 *
 * If this publishes due posts successfully → Inngest orchestration is the bug,
 * fix in Inngest cloud (probably paused function).
 * If this fails → real code bug that also breaks the cron.
 *
 * Run: npx tsx scripts/ig-publish-cron-diagnostic.ts
 */

import { createClient } from '@supabase/supabase-js'
import { publishToInstagram } from '../src/lib/instagram-publish'
import { appUrl } from '../src/lib/app-url'

async function main() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const nowIso = new Date().toISOString()
  console.log(`\n=== Diagnostic run at ${nowIso} ===\n`)

  // Same query as the cron
  const { data, error } = await admin
    .from('calendar_posts')
    .select('id, title, caption, graphic, publish_attempts, date, time, scheduled_publish_at')
    .eq('brand', 'body_recode')
    .eq('platform', 'instagram')
    .neq('type', 'story')
    .is('posted_at', null)
    .not('scheduled_publish_at', 'is', null)
    .lte('scheduled_publish_at', nowIso)
    .or('publish_attempts.is.null,publish_attempts.lt.3')
    .limit(20)

  if (error) {
    console.error('Query failed:', error.message)
    process.exit(1)
  }

  const rows = data ?? []
  console.log(`Found ${rows.length} due post(s).\n`)

  if (rows.length === 0) {
    console.log('Nothing to publish. Check scheduled_publish_at values on target posts.')
    return
  }

  for (const row of rows) {
    console.log(`\n▶ Publishing "${row.title}" (id=${row.id.slice(0, 8)}…)`)
    console.log(`  scheduled for: ${row.scheduled_publish_at}`)
    console.log(`  attempts so far: ${row.publish_attempts ?? 0}`)

    try {
      const rawGraphic = (row.graphic ?? '').trim()
      if (!rawGraphic) {
        console.log('  ✗ graphic_missing')
        await admin.from('calendar_posts').update({
          publish_error: '[validate] graphic_missing',
          publish_attempts: (row.publish_attempts ?? 0) + 1,
        }).eq('id', row.id)
        continue
      }

      const imageUrls: string[] = rawGraphic.split(',').map((s: string) => s.trim()).filter(Boolean).map((u: string) => {
        if (u.startsWith('http://') || u.startsWith('https://')) return u
        if (u.startsWith('/')) return `${appUrl()}${u}`
        return u
      })
      console.log(`  images (${imageUrls.length}): ${imageUrls[0]}${imageUrls.length > 1 ? ' + ' + (imageUrls.length - 1) + ' more' : ''}`)

      if (imageUrls.some((u: string) => u.includes('/api/content/graphic'))) {
        console.log('  ✗ live_render_unsupported')
        await admin.from('calendar_posts').update({
          publish_error: '[validate] live_render_unsupported',
          publish_attempts: (row.publish_attempts ?? 0) + 1,
        }).eq('id', row.id)
        continue
      }

      const caption = (row.caption ?? '').trim()
      if (!caption) {
        console.log('  ✗ caption_missing')
        await admin.from('calendar_posts').update({
          publish_error: '[validate] caption_missing',
          publish_attempts: (row.publish_attempts ?? 0) + 1,
        }).eq('id', row.id)
        continue
      }

      await admin.from('calendar_posts').update({
        publish_attempts: (row.publish_attempts ?? 0) + 1,
        publish_error: null,
      }).eq('id', row.id)

      console.log('  calling Meta Graph…')
      const r = await publishToInstagram({ imageUrls, caption })

      if (!r.ok) {
        console.log(`  ✗ FAIL [${r.stage}] ${r.error}`)
        await admin.from('calendar_posts').update({
          publish_error: `[${r.stage}] ${r.error}`,
        }).eq('id', row.id)
        continue
      }

      console.log(`  ✓ POSTED: ${r.postUrl}`)
      await admin.from('calendar_posts').update({
        ig_container_id: r.containerId,
        ig_post_id: r.postId,
        ig_post_url: r.postUrl,
        posted_at: new Date().toISOString(),
        scheduled_publish_at: null,
        publish_error: null,
      }).eq('id', row.id)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.log(`  ✗ EXCEPTION: ${msg}`)
      await admin.from('calendar_posts').update({
        publish_error: `[exception] ${msg}`,
        publish_attempts: (row.publish_attempts ?? 0) + 1,
      }).eq('id', row.id)
    }
  }

  console.log('\n=== Done ===\n')
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
