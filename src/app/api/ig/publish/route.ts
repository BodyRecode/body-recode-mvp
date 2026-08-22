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
import { publishToInstagram, igAccountConfigured, igAccountHandle, type IgAccount } from '@/lib/instagram-publish'
import { appendBrFooter } from '@/lib/br-post-footer'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { appUrl } from '@/lib/app-url'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  // Coach auth required
  const sessionClient = await createServerSupabaseClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'auth_required' }, { status: 401 })
  }
  if (!(await isCoachUser(user))) return forbidden()

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
    .select('id, date, time, type, brand, platform, title, caption, graphic, video_url, posted_at, scheduled_publish_at, publish_attempts, story_auto')
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
  // Stories publish only when the row is marked story_auto. The API strips link
  // stickers, countdowns and polls, and the story doctrine says the sticker IS
  // the point, so a story that carries one has to go up by hand. story_auto
  // marks the ones that were never going to have a sticker anyway.
  if (post.type === 'story' && !post.story_auto) {
    return NextResponse.json({ error: 'story_needs_sticker', message: 'This story is phone-manual. The API strips link stickers, countdowns and polls, so a story that needs one goes up by hand. Mark story_auto if it is a plain image.' }, { status: 400 })
  }
  // Brand routing. Each brand has its OWN Instagram account and its own
  // credential pair; nothing is shared and nothing falls back. A brand we have
  // no account for stays manual rather than publishing somewhere wrong.
  const PUBLISHABLE: Record<string, IgAccount> = {
    body_recode: 'body_recode',
    personal_brand: 'personal_brand',
  }
  const account: IgAccount = PUBLISHABLE[post.brand ?? 'body_recode']
  if (!account) {
    return NextResponse.json({
      error: 'wrong_brand',
      brand: post.brand,
      message: `No Instagram account is wired for brand "${post.brand}". This poster publishes to @body_recode_ and @kade_dunstone_ only; other brands stay manual.`,
    }, { status: 400 })
  }
  // Fail here with instructions rather than at the Graph call, and never with a
  // fallback: publishing Kade's personal posts onto @body_recode_ in front of
  // the client audience is not something you can undo.
  if (!igAccountConfigured(account)) {
    return NextResponse.json({
      error: 'account_not_connected',
      brand: post.brand,
      handle: igAccountHandle(account),
      message: `${igAccountHandle(account)} is not connected yet. Add its Page access token and IG Business Account ID to the environment, then redeploy. Until then this post stays manual.`,
    }, { status: 400 })
  }

  // Reels. video_url is set by scripts/ingest-reels.ts and points at the public
  // Supabase videos bucket, which Meta can fetch. The graphic becomes the cover
  // frame rather than the post body.
  const videoUrl = (post.video_url ?? '').trim() || undefined
  if (videoUrl && !/^https?:\/\//.test(videoUrl)) {
    return NextResponse.json({ error: 'video_url_not_public', message: 'video_url must be an absolute public URL Meta can fetch. Re-run scripts/ingest-reels.ts.' }, { status: 400 })
  }

  // Resolve graphic URLs (comma-separated for carousels). Convert relative
  // paths like /calendar/xxx.png to absolute public URLs Meta can fetch.
  const rawGraphic = (post.graphic ?? '').trim()
  if (!rawGraphic && !videoUrl) {
    return NextResponse.json({ error: 'graphic_missing', message: 'No graphic URL on this post.' }, { status: 400 })
  }
  // A reel still carrying its TO FILM placeholder means the video was never
  // ingested. Publishing that would put a placeholder card on the feed.
  if (videoUrl && rawGraphic.includes('PLACEHOLDER')) {
    return NextResponse.json({ error: 'placeholder_cover', message: 'This reel still has the TO FILM placeholder as its cover. Run scripts/ingest-reels.ts to attach the real cover frame.' }, { status: 400 })
  }
  if (!videoUrl && rawGraphic.includes('PLACEHOLDER')) {
    return NextResponse.json({ error: 'not_filmed_yet', message: 'This slot is a reel placeholder - the video has not been filmed and ingested yet.' }, { status: 400 })
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

  // ── SCHEDULE MODE ──
  // Meta's scheduled_publish_time hits an undocumented whitelist gate on Dev
  // mode apps. Instead of fighting that, we use our OWN scheduler: the Schedule
  // button just stamps scheduled_publish_at on the row, and `igPublisherCron`
  // (Inngest, runs every 5 min) finds due rows + fires the immediate-publish
  // path (which has no whitelist gate).
  if (body.schedule) {
    const scheduledIso = post.scheduled_publish_at ?? `${post.date}T${post.time ?? '09:00'}:00+10:00`
    const ms = Date.parse(scheduledIso)
    if (Number.isNaN(ms)) {
      return NextResponse.json({ error: 'invalid_schedule_time', message: `Could not parse scheduled time from ${scheduledIso}` }, { status: 400 })
    }
    // Allow scheduling in the past too — the cron will fire it on its next tick
    // (catches "I forgot to schedule, just post the next 3 minutes ago"). The
    // 10-min Meta minimum no longer applies since we control the publishing.
    const scheduledIsoStored = new Date(ms).toISOString()
    const { error: updErr } = await admin
      .from('calendar_posts')
      .update({
        scheduled_publish_at: scheduledIsoStored,
        publish_error: null, // clear stale errors
      })
      .eq('id', post.id)
    if (updErr) {
      return NextResponse.json({ error: 'schedule_persist_failed', message: updErr.message }, { status: 500 })
    }
    return NextResponse.json({
      ok: true,
      containerId: null,
      postId: null,
      postUrl: null,
      scheduled: true,
      scheduledFor: scheduledIsoStored,
      note: 'Queued in our scheduler. Will publish via Post-now path on the next cron tick (every 5 min) after scheduled time passes.',
    })
  }

  // ── IMMEDIATE PUBLISH MODE ──
  // Bump publish_attempts counter (so retries don't loop silently)
  await admin
    .from('calendar_posts')
    .update({ publish_attempts: (post.publish_attempts ?? 0) + 1, publish_error: null })
    .eq('id', post.id)

  // The BR footer carries "More from our founder -> @kade_dunstone_", which is
  // right on the brand account and nonsense on the personal one, where it would
  // point the reader at the account they are already looking at.
  const finalCaption = account === 'body_recode' ? appendBrFooter(caption) : caption
  const isStory = post.type === 'story'
  const result = await publishToInstagram({ imageUrls, videoUrl, caption: finalCaption, account, story: isStory })

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
      posted_at: new Date().toISOString(),
      scheduled_publish_at: null, // clear schedule flag, it fired
      publish_error: null,
    })
    .eq('id', post.id)

  return NextResponse.json({
    ok: true,
    containerId: result.containerId,
    postId: result.postId,
    postUrl: result.postUrl,
    scheduled: false,
  })
}
