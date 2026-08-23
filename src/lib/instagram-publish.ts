// Instagram Graph API native publishing client.
//
// Publishes feed posts, carousels and reels from the Content Calendar directly
// to Instagram without third-party schedulers.
//
// STORIES, from 2026-08-22, and only the plain-image kind. The API strips link
// stickers, countdowns and polls, and the story doctrine in
// build_warmup_stories.py says the sticker IS the point: the tap is the
// completion signal that recovers ranking. So a story only publishes here when
// calendar_posts.story_auto is true, which marks the ones that were never going
// to carry a sticker anyway. Everything else stays phone-manual.
//
// Two ways stories differ from every other type:
//   - No caption. Stories have no caption field; the text is in the image.
//   - No scheduled_publish_time. Meta rejects it for STORIES, so our own cron
//     has to fire at the moment the story should go live.
//
// TWO ACCOUNTS, from 2026-08-20. @kade_dunstone_ was the only channel with no
// automation, so it died whenever Kade got busy - twice, most recently going
// quiet for twelve days with a full calendar of finished posts sitting behind
// it. Each account has its OWN credential pair and they are never mixed.
//
// Setup requirements, PER ACCOUNT (one-time):
//   1. The account is an Instagram Professional (Business or Creator) account
//   2. Linked to a Facebook Page Kade manages
//   3. Long-lived Page Access Token in that account's token env var
//   4. Instagram Business Account ID in that account's id env var
//
//   @body_recode_    META_GRAPH_ACCESS_TOKEN     / META_IG_BUSINESS_ACCOUNT_ID
//   @kade_dunstone_  META_GRAPH_ACCESS_TOKEN_PB  / META_IG_BUSINESS_ACCOUNT_ID_PB
//
// See `06_SAAS_PLATFORM_BUILD/2026-06-30_Instagram_Native_Publishing.md` for
// the exact token-generation walkthrough Kade follows.
//
// API flow:
//   Single image: POST /{ig-account-id}/media -> creation_id -> POST /{ig-account-id}/media_publish
//   Carousel: N x POST /{ig-account-id}/media (with is_carousel_item=true)
//             -> POST /{ig-account-id}/media (media_type=CAROUSEL, children=[ids])
//             -> POST /{ig-account-id}/media_publish
//   Reel:     POST /{ig-account-id}/media (media_type=REELS, video_url, cover_url)
//             -> poll until FINISHED (video transcoding is slow, unlike images)
//             -> POST /{ig-account-id}/media_publish
//   Scheduled: include scheduled_publish_time on first POST; Meta publishes
//              automatically at that time. Min 10min in future, max 75 days.

const GRAPH_API_VERSION = 'v21.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

export interface PublishInput {
  imageUrls: string[]      // 1 = single image, 2-10 = carousel. Ignored when videoUrl is set.
  caption: string          // IG caption (incl hashtags)
  scheduledPublishTime?: number  // Unix timestamp (seconds). Omit to publish immediately.
  // Reels. When set, this publishes as a REEL and imageUrls[0] (if present) is
  // used as the cover frame. Meta must be able to fetch the URL itself, so it
  // has to be publicly reachable - Supabase `videos` bucket, not a signed URL.
  videoUrl?: string
  /** Publish to Stories rather than the feed. Plain image only: no caption, no
   *  sticker, and Meta rejects scheduled_publish_time for this type. */
  story?: boolean
  /** Which IG account to publish to. Defaults to body_recode so existing
   *  callers are unchanged. */
  account?: IgAccount
}

export interface PublishResult {
  ok: true
  containerId: string
  postId: string | null    // null if scheduled (Meta publishes later, no immediate id)
  postUrl: string | null
  scheduled: boolean
}

export interface PublishError {
  ok: false
  error: string
  stage: 'env' | 'container' | 'publish' | 'permalink'
  detail?: unknown
}

// Which Instagram account a post publishes to. Maps 1:1 to calendar_posts.brand.
export type IgAccount = 'body_recode' | 'personal_brand'

const ACCOUNTS: Record<IgAccount, { handle: string; tokenVar: string; idVar: string }> = {
  body_recode: {
    handle: '@body_recode_',
    tokenVar: 'META_GRAPH_ACCESS_TOKEN',
    idVar: 'META_IG_BUSINESS_ACCOUNT_ID',
  },
  personal_brand: {
    handle: '@kade_dunstone_',
    tokenVar: 'META_GRAPH_ACCESS_TOKEN_PB',
    idVar: 'META_IG_BUSINESS_ACCOUNT_ID_PB',
  },
}

// Resolve one account's credentials.
//
// THE IMPORTANT PROPERTY: there is no fallback. If the personal-brand vars are
// missing this THROWS. It must never quietly drop back to the Body Recode pair,
// because that would publish Kade's personal posts onto @body_recode_ in front
// of the client audience, and there is no way to un-post that.
function env(account: IgAccount = 'body_recode') {
  const cfg = ACCOUNTS[account]
  if (!cfg) throw new Error(`Unknown Instagram account "${account}"`)
  const token = process.env[cfg.tokenVar]?.trim()
  const igId = process.env[cfg.idVar]?.trim()
  if (!token) throw new Error(`${cfg.tokenVar} env missing - cannot publish to ${cfg.handle}`)
  if (!igId) throw new Error(`${cfg.idVar} env missing - cannot publish to ${cfg.handle}`)
  return { token, igId, handle: cfg.handle }
}

export function igAccountHandle(account: IgAccount): string {
  return ACCOUNTS[account]?.handle ?? account
}

/** True when this account has both credentials configured. Used to show a clear
 *  "not connected yet" state instead of failing at publish time. */
export function igAccountConfigured(account: IgAccount): boolean {
  try { env(account); return true } catch { return false }
}

async function graphPost(account: IgAccount, path: string, params: Record<string, string | number>): Promise<{ id: string } & Record<string, unknown>> {
  const { token } = env(account)
  const body = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), access_token: token })
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error(`Meta API ${res.status}: ${data.error?.message ?? JSON.stringify(data)}`)
  }
  return data
}

async function graphGet(account: IgAccount, path: string, fields?: string): Promise<Record<string, unknown>> {
  const { token } = env(account)
  const url = new URL(`${GRAPH_BASE}${path}`)
  url.searchParams.set('access_token', token)
  if (fields) url.searchParams.set('fields', fields)
  const res = await fetch(url.toString())
  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error(`Meta API ${res.status}: ${data.error?.message ?? JSON.stringify(data)}`)
  }
  return data
}

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

// Meta fetches image_url ASYNCHRONOUSLY after /media returns a container id.
// Calling /media_publish before the container has finished processing throws
// "Media API 400: Media ID is not available". So we poll the container's
// status_code until it's FINISHED (or fails) before publishing. Small images
// usually finish in 1-3 polls; the cap keeps us inside the function timeout.
// Images finish in seconds. Video transcoding routinely takes 1-3 minutes, so
// callers publishing a reel must pass a longer budget or media_publish fails
// with "Media ID is not available".
async function waitForContainerReady(account: IgAccount, containerId: string, tries = 15, delayMs = 2000): Promise<void> {
  for (let i = 0; i < tries; i++) {
    const data = await graphGet(account, `/${containerId}`, 'status_code')
    const status = data.status_code as string | undefined
    if (status === 'FINISHED') return
    if (status === 'ERROR' || status === 'EXPIRED') {
      throw new Error(`Container ${containerId} processing ${status} (Meta could not use the image)`)
    }
    await sleep(delayMs) // IN_PROGRESS - wait and re-check
  }
  throw new Error(`Container ${containerId} never reached FINISHED after ${(tries * delayMs) / 1000}s`)
}

// WHO ARE WE ABOUT TO POST AS?
//
// Kade, 23 Aug 2026: "the past two days ive had to delete the BR post that has
// mistakenly been posted to my personal brand page". Two Body Recode posts, on
// 21 and 22 Aug, published to @kade_dunstone_.
//
// The account map in this file was never wrong. The ENV VARS behind it are: the
// token in META_GRAPH_ACCESS_TOKEN reaches exactly one Instagram account, and it
// is the personal one. So the code asked for Body Recode, resolved credentials
// that belong to the personal page, and posted there, correctly, as instructed.
//
// Nothing downstream could catch that. calendar_posts recorded brand=body_recode,
// the publish returned success, and the only detector was Kade opening the wrong
// app and finding a client post on his personal feed.
//
// So the publisher now asks Meta who the target account actually is and refuses
// if the answer is not the handle it expects. An env var can be wrong; a username
// coming back from Graph cannot be. One extra call per publish, and it makes
// posting to the wrong audience impossible rather than merely unlikely.
const identityCache = new Map<string, string>()

async function assertIdentity(account: IgAccount, igId: string, token: string): Promise<string | null> {
  const expected = ACCOUNTS[account].handle.replace(/^@/, '').toLowerCase()
  let actual = identityCache.get(igId)
  if (!actual) {
    const res = await fetch(`${GRAPH_BASE}/${igId}?fields=username&access_token=${encodeURIComponent(token)}`)
    const json = await res.json().catch(() => ({})) as { username?: string; error?: { message?: string } }
    if (!json.username) {
      return `Cannot confirm which Instagram account ${ACCOUNTS[account].idVar} points at`
        + `${json.error?.message ? `: ${json.error.message}` : ''}. Refusing to publish rather than guess.`
    }
    actual = json.username.toLowerCase()
    identityCache.set(igId, actual)
  }
  if (actual !== expected) {
    return `WRONG ACCOUNT. Publishing as "${account}" resolved to @${actual}, expected @${expected}. `
      + `${ACCOUNTS[account].tokenVar} and ${ACCOUNTS[account].idVar} belong to the wrong Instagram account. `
      + `Refusing to publish: this is how Body Recode posts reached the personal feed on 21 and 22 Aug 2026.`
  }
  return null
}

export async function publishToInstagram(input: PublishInput): Promise<PublishResult | PublishError> {
  const account: IgAccount = input.account ?? 'body_recode'
  let igId: string
  let token: string
  try {
    ({ igId, token } = env(account))
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), stage: 'env' }
  }

  const wrongAccount = await assertIdentity(account, igId, token)
  if (wrongAccount) return { ok: false, error: wrongAccount, stage: 'env' }

  const isStory = !!input.story
  const isReel = !isStory && !!input.videoUrl
  const isCarousel = !isStory && !isReel && input.imageUrls.length > 1
  const isScheduled = !!input.scheduledPublishTime
  let containerId: string

  try {
    if (isStory) {
      // No caption and no scheduled_publish_time: Meta rejects both for
      // STORIES. The cron calls this at the moment it should be live.
      const story = await graphPost(account, `/${igId}/media`, {
        media_type: 'STORIES',
        image_url: input.imageUrls[0],
      })
      containerId = story.id
    } else if (isReel) {
      // Video containers transcode asynchronously and take far longer than
      // images, so the FINISHED poll below is mandatory rather than an
      // optimisation. Publishing early returns a "media not ready" error.
      const reel = await graphPost(account, `/${igId}/media`, {
        media_type: 'REELS',
        video_url: input.videoUrl as string,
        caption: input.caption,
        share_to_feed: 'true',
        ...(input.imageUrls[0] ? { cover_url: input.imageUrls[0] } : {}),
        ...(isScheduled ? { scheduled_publish_time: input.scheduledPublishTime as number } : {}),
      })
      containerId = reel.id
    } else if (isCarousel) {
      // Step 1: create each child item container
      const childIds: string[] = []
      for (const url of input.imageUrls) {
        const child = await graphPost(account, `/${igId}/media`, {
          image_url: url,
          is_carousel_item: 'true',
        })
        childIds.push(child.id)
      }
      // Each child must finish processing before it can go in a carousel
      for (const id of childIds) await waitForContainerReady(account, id)
      // Step 2: create carousel container referencing the children
      const carousel = await graphPost(account, `/${igId}/media`, {
        media_type: 'CAROUSEL',
        children: childIds.join(','),
        caption: input.caption,
        ...(isScheduled ? { scheduled_publish_time: input.scheduledPublishTime as number } : {}),
      })
      containerId = carousel.id
    } else {
      // Single image
      const single = await graphPost(account, `/${igId}/media`, {
        image_url: input.imageUrls[0],
        caption: input.caption,
        ...(isScheduled ? { scheduled_publish_time: input.scheduledPublishTime as number } : {}),
      })
      containerId = single.id
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), stage: 'container' }
  }

  // Scheduled containers don't get publish-called; Meta publishes them at
  // scheduled_publish_time. Return the container id so the caller can track
  // it (the actual post id materialises after the scheduled time hits).
  if (isScheduled) {
    return { ok: true, containerId, postId: null, postUrl: null, scheduled: true }
  }

  // Immediate publish - wait for Meta to finish processing the container first,
  // otherwise media_publish throws "Media ID is not available".
  let postId: string
  try {
    // 5 minutes for a reel, 30s for images.
    if (isReel) await waitForContainerReady(account, containerId, 60, 5000)
    else await waitForContainerReady(account, containerId)
    const published = await graphPost(account, `/${igId}/media_publish`, { creation_id: containerId })
    postId = published.id
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), stage: 'publish', detail: { containerId } }
  }

  // Fetch the permalink (public IG URL) for the new post
  let postUrl: string | null = null
  try {
    const meta = await graphGet(account, `/${postId}`, 'permalink')
    postUrl = (meta.permalink as string | undefined) ?? null
  } catch {
    // Non-fatal: post is up, we just couldn't fetch the URL
  }

  return { ok: true, containerId, postId, postUrl, scheduled: false }
}
