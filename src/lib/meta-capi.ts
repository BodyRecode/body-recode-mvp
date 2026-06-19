import crypto from 'crypto'

const PIXEL_ID = process.env.META_PIXEL_ID || '972772552072010'
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE
const GRAPH_API_VERSION = 'v18.0'

function hashSha256(value: string | undefined | null): string | undefined {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (!normalized) return undefined
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

export interface CapiUserData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  country?: string
  zip?: string
  clientIp?: string
  clientUserAgent?: string
  fbp?: string
  fbc?: string
}

export type CapiEventName =
  | 'PageView'
  | 'ViewContent'
  | 'Lead'
  | 'CompleteRegistration'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Subscribe'

export interface CapiEventOptions {
  eventName: CapiEventName
  eventId?: string
  eventSourceUrl?: string
  actionSource?: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'business_messaging' | 'other'
  userData: CapiUserData
  customData?: Record<string, unknown>
}

export interface CapiResult {
  ok: boolean
  status?: number
  error?: string
  eventsReceived?: number
}

export async function fireMetaCapiEvent(opts: CapiEventOptions): Promise<CapiResult> {
  if (!ACCESS_TOKEN) {
    console.warn('[meta-capi] META_CAPI_ACCESS_TOKEN not set; skipping CAPI fire for', opts.eventName)
    return { ok: false, error: 'no_token' }
  }

  const userData: Record<string, string> = {}
  if (opts.userData.email) userData.em = hashSha256(opts.userData.email)!
  if (opts.userData.phone) userData.ph = hashSha256(opts.userData.phone.replace(/\D/g, ''))!
  if (opts.userData.firstName) userData.fn = hashSha256(opts.userData.firstName)!
  if (opts.userData.lastName) userData.ln = hashSha256(opts.userData.lastName)!
  if (opts.userData.city) userData.ct = hashSha256(opts.userData.city)!
  if (opts.userData.state) userData.st = hashSha256(opts.userData.state)!
  if (opts.userData.country) userData.country = hashSha256(opts.userData.country.toLowerCase())!
  if (opts.userData.zip) userData.zp = hashSha256(opts.userData.zip)!
  if (opts.userData.clientIp) userData.client_ip_address = opts.userData.clientIp
  if (opts.userData.clientUserAgent) userData.client_user_agent = opts.userData.clientUserAgent
  if (opts.userData.fbp) userData.fbp = opts.userData.fbp
  if (opts.userData.fbc) userData.fbc = opts.userData.fbc

  const eventData: Record<string, unknown> = {
    event_name: opts.eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: opts.actionSource || 'website',
    user_data: userData,
  }
  if (opts.eventId) eventData.event_id = opts.eventId
  if (opts.eventSourceUrl) eventData.event_source_url = opts.eventSourceUrl
  if (opts.customData) eventData.custom_data = opts.customData

  const payload: Record<string, unknown> = { data: [eventData] }
  if (TEST_EVENT_CODE) payload.test_event_code = TEST_EVENT_CODE

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const responseText = await res.text()
    if (!res.ok) {
      console.error('[meta-capi] event fire failed:', opts.eventName, res.status, responseText)
      return { ok: false, status: res.status, error: responseText }
    }
    let parsed: { events_received?: number } | undefined
    try { parsed = JSON.parse(responseText) } catch { /* non-JSON ok */ }
    console.log('[meta-capi] fired:', opts.eventName, 'events_received:', parsed?.events_received)
    return { ok: true, status: res.status, eventsReceived: parsed?.events_received }
  } catch (err) {
    console.error('[meta-capi] fetch error:', opts.eventName, err)
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' }
  }
}

export function extractClientContext(request: Request): { clientIp?: string; clientUserAgent?: string } {
  const xff = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIp = xff?.split(',')[0]?.trim() || realIp || undefined
  const clientUserAgent = request.headers.get('user-agent') || undefined
  return { clientIp, clientUserAgent }
}

export function generateEventId(): string {
  return crypto.randomUUID()
}
