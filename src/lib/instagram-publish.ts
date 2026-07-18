// Instagram Graph API native publishing client.
//
// Publishes feed posts + carousels (image-based) from the Content Calendar
// directly to @body_recode_ without third-party schedulers. Stories are NOT
// supported (Meta API strips link stickers / countdown / polls, so stories
// stay phone-manual).
//
// Setup requirements (one-time):
//   1. @body_recode_ is an Instagram Professional account
//   2. Linked to a Facebook Page Kade manages
//   3. Long-lived Page Access Token in META_GRAPH_ACCESS_TOKEN env
//   4. Instagram Business Account ID in META_IG_BUSINESS_ACCOUNT_ID env
//
// See `06_SAAS_PLATFORM_BUILD/2026-06-30_Instagram_Native_Publishing.md` for
// the exact token-generation walkthrough Kade follows.
//
// API flow:
//   Single image: POST /{ig-account-id}/media -> creation_id -> POST /{ig-account-id}/media_publish
//   Carousel: N x POST /{ig-account-id}/media (with is_carousel_item=true)
//             -> POST /{ig-account-id}/media (media_type=CAROUSEL, children=[ids])
//             -> POST /{ig-account-id}/media_publish
//   Scheduled: include scheduled_publish_time on first POST; Meta publishes
//              automatically at that time. Min 10min in future, max 75 days.

const GRAPH_API_VERSION = 'v21.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

export interface PublishInput {
  imageUrls: string[]      // 1 = single image, 2-10 = carousel
  caption: string          // IG caption (incl hashtags)
  scheduledPublishTime?: number  // Unix timestamp (seconds). Omit to publish immediately.
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

function env() {
  const token = process.env.META_GRAPH_ACCESS_TOKEN?.trim()
  const igId = process.env.META_IG_BUSINESS_ACCOUNT_ID?.trim()
  if (!token) throw new Error('META_GRAPH_ACCESS_TOKEN env missing')
  if (!igId) throw new Error('META_IG_BUSINESS_ACCOUNT_ID env missing')
  return { token, igId }
}

async function graphPost(path: string, params: Record<string, string | number>): Promise<{ id: string } & Record<string, unknown>> {
  const { token } = env()
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

async function graphGet(path: string, fields?: string): Promise<Record<string, unknown>> {
  const { token } = env()
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
async function waitForContainerReady(containerId: string, tries = 15, delayMs = 2000): Promise<void> {
  for (let i = 0; i < tries; i++) {
    const data = await graphGet(`/${containerId}`, 'status_code')
    const status = data.status_code as string | undefined
    if (status === 'FINISHED') return
    if (status === 'ERROR' || status === 'EXPIRED') {
      throw new Error(`Container ${containerId} processing ${status} (Meta could not use the image)`)
    }
    await sleep(delayMs) // IN_PROGRESS - wait and re-check
  }
  throw new Error(`Container ${containerId} never reached FINISHED after ${(tries * delayMs) / 1000}s`)
}

export async function publishToInstagram(input: PublishInput): Promise<PublishResult | PublishError> {
  let igId: string
  try {
    igId = env().igId
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), stage: 'env' }
  }

  const isCarousel = input.imageUrls.length > 1
  const isScheduled = !!input.scheduledPublishTime
  let containerId: string

  try {
    if (isCarousel) {
      // Step 1: create each child item container
      const childIds: string[] = []
      for (const url of input.imageUrls) {
        const child = await graphPost(`/${igId}/media`, {
          image_url: url,
          is_carousel_item: 'true',
        })
        childIds.push(child.id)
      }
      // Each child must finish processing before it can go in a carousel
      for (const id of childIds) await waitForContainerReady(id)
      // Step 2: create carousel container referencing the children
      const carousel = await graphPost(`/${igId}/media`, {
        media_type: 'CAROUSEL',
        children: childIds.join(','),
        caption: input.caption,
        ...(isScheduled ? { scheduled_publish_time: input.scheduledPublishTime as number } : {}),
      })
      containerId = carousel.id
    } else {
      // Single image
      const single = await graphPost(`/${igId}/media`, {
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
    await waitForContainerReady(containerId)
    const published = await graphPost(`/${igId}/media_publish`, { creation_id: containerId })
    postId = published.id
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), stage: 'publish', detail: { containerId } }
  }

  // Fetch the permalink (public IG URL) for the new post
  let postUrl: string | null = null
  try {
    const meta = await graphGet(`/${postId}`, 'permalink')
    postUrl = (meta.permalink as string | undefined) ?? null
  } catch {
    // Non-fatal: post is up, we just couldn't fetch the URL
  }

  return { ok: true, containerId, postId, postUrl, scheduled: false }
}
