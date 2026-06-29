// POST /api/ig/publish - publish a calendar_posts row to Instagram (or
// schedule it). Auth-gated to coach session. Updates the row with the
// resulting IG container/post id + permalink + posted_at timestamp.
//
// Body: { calendar_post_id: string, schedule?: boolean }
//   - schedule=false (default): immediate publish, returns post id + URL
//   - schedule=true: uses the row's scheduled_publish_at OR date+time to
//     hand Meta a future timestamp (Meta publishes itself at that time)
//
// Returns 200 { ok, containerId, postId, postUrl, scheduled } on success.
// Returns 409 if already posted. Returns 500 with error detail on failure.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { publishToInstagram } from '@/lib/instagram-publish'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { appUrl } from '@/lib/app-url'

export async function POST(request: NextRequest) {
  // Coach auth required
  const sessionClient = await createServerSupabaseClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'auth_required' }, { status: 401 })
  }

  let body: { calendar_post_id?: string; schedule?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  if (!body.calendar_post_id) {
    return NextResponse.json({ error: 'calendar_post_id required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: post, error: fetchErr } = await admin
    .from('calendar_posts')
    .select('id, date, time, type, brand, platform, title, caption, graphic, posted_at, scheduled_publish_at, publish_attempts')
    .eq('id', body.calendar_post_id)
    .single()
  if (fetchErr || !post) {
    return NextResponse.json({ error: 'post_not_found', detail: fetchErr?.message }, { status: 404 })
  }

  if (post.posted_at) {
    return NextResponse.json({ error: 'already_posted', posted_at: post.posted_at }, { status: 409 })
  }

  // Only IG-supported types - block stories at the API level
  if (post.platform && post.platform !== 'instagram') {
    return NextResponse.json({ error: 'unsupported_platform', platform: post.platform, message: 'This poster only publishes to Instagram. LinkedIn / other platforms stay manual.' }, { status: 400 })
  }
  if (post.type === 'story') {
    return NextResponse.json({ error: 'stories_not_supported', message: 'Instagram Stories must be posted manually - the API strips link stickers, countdown stickers, and polls, which kills the story value.' }, { status: 400 })
  }

  // Resolve graphic URLs (comma-separated for carousels). Convert relative
  // paths like /calendar/xxx.png to absolute public URLs Meta can fetch.
  const rawGraphic = (post.graphic ?? '').trim()
  if (!rawGraphic) {
    return NextResponse.json({ error: 'graphic_missing', message: 'No graphic URL on this post.' }, { status: 400 })
  }
  const imageUrls: string[] = rawGraphic.split(',').map((s: string) => s.trim()).filter(Boolean).map((u: string) => {
    if (u.startsWith('http://') || u.startsWith('https://')) return u
    if (u.startsWith('/')) return `${appUrl()}${u}`
    return u
  })

  // Reject api-style live render URLs - Meta needs static public PNG
  const hasLiveRender = imageUrls.some((u: string) => u.includes('/api/content/graphic'))
  if (hasLiveRender) {
    return NextResponse.json({ error: 'live_render_unsupported', message: 'This post uses /api/content/graphic live render. Meta needs a static PNG URL. Re-render to /public/calendar/ first.' }, { status: 400 })
  }

  // Resolve caption
  const caption = (post.caption ?? '').trim()
  if (!caption) {
    return NextResponse.json({ error: 'caption_missing', message: 'No caption on this post - add one before publishing.' }, { status: 400 })
  }

  // Resolve schedule time if --schedule passed
  let scheduledPublishTime: number | undefined
  if (body.schedule) {
    const scheduledIso = post.scheduled_publish_at ?? `${post.date}T${post.time ?? '09:00'}:00+10:00`
    const ms = Date.parse(scheduledIso)
    if (Number.isNaN(ms)) {
      return NextResponse.json({ error: 'invalid_schedule_time', message: `Could not parse scheduled time from ${scheduledIso}` }, { status: 400 })
    }
    const minFuture = Date.now() + 10 * 60 * 1000
    if (ms < minFuture) {
      return NextResponse.json({ error: 'schedule_too_soon', message: 'Meta requires scheduled posts to be at least 10 minutes in the future. Use immediate publish instead.' }, { status: 400 })
    }
    scheduledPublishTime = Math.floor(ms / 1000)
  }

  // Bump publish_attempts counter (so retries don't loop silently)
  await admin
    .from('calendar_posts')
    .update({ publish_attempts: (post.publish_attempts ?? 0) + 1, publish_error: null })
    .eq('id', post.id)

  // Fire
  const result = await publishToInstagram({ imageUrls, caption, scheduledPublishTime })

  if (!result.ok) {
    await admin
      .from('calendar_posts')
      .update({ publish_error: `[${result.stage}] ${result.error}` })
      .eq('id', post.id)
    return NextResponse.json({ error: 'publish_failed', stage: result.stage, message: result.error, detail: result.detail }, { status: 500 })
  }

  // Persist the success
  await admin
    .from('calendar_posts')
    .update({
      ig_container_id: result.containerId,
      ig_post_id: result.postId,
      ig_post_url: result.postUrl,
      posted_at: result.scheduled ? null : new Date().toISOString(),
      scheduled_publish_at: result.scheduled && scheduledPublishTime ? new Date(scheduledPublishTime * 1000).toISOString() : null,
      publish_error: null,
    })
    .eq('id', post.id)

  return NextResponse.json({
    ok: true,
    containerId: result.containerId,
    postId: result.postId,
    postUrl: result.postUrl,
    scheduled: result.scheduled,
  })
}
