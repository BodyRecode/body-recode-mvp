// Zoom Server-to-Server OAuth
// Docs: https://developers.zoom.us/docs/internal-apps/s2s-oauth/

let cachedToken: { token: string; expiresAt: number } | null = null

async function getZoomAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token
  }

  const accountId = process.env.ZOOM_ACCOUNT_ID
  const clientId = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Missing Zoom credentials in environment')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Zoom token exchange failed: ${err}`)
  }

  const data = await res.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return cachedToken.token
}

export interface ZoomMeetingOptions {
  topic: string
  startTime: string   // ISO 8601
  durationMinutes: number
  timezone?: string
}

export interface ZoomMeeting {
  id: number
  joinUrl: string
  startUrl: string
  password: string
}

export async function createZoomMeeting(options: ZoomMeetingOptions): Promise<ZoomMeeting> {
  const token = await getZoomAccessToken()

  const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: options.topic,
      type: 2, // Scheduled meeting
      start_time: options.startTime,
      duration: options.durationMinutes,
      timezone: options.timezone ?? 'Australia/Brisbane',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        waiting_room: true,
        auto_recording: 'none',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to create Zoom meeting: ${err}`)
  }

  const data = await res.json()
  return {
    id: data.id,
    joinUrl: data.join_url,
    startUrl: data.start_url,
    password: data.password,
  }
}

export async function deleteZoomMeeting(meetingId: number): Promise<void> {
  const token = await getZoomAccessToken()

  await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

/**
 * Move an existing meeting to a new time.
 *
 * Deliberately an UPDATE rather than delete-and-recreate: PATCH preserves the
 * meeting ID and therefore the join URL, so a link already sent to a lead keeps
 * working after a reschedule. Recreating would silently invalidate it and leave
 * them holding a dead link.
 */
export async function updateZoomMeeting(
  meetingId: number,
  options: { startTime: string; durationMinutes: number; timezone?: string },
): Promise<void> {
  const token = await getZoomAccessToken()

  const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      start_time: options.startTime,
      duration: options.durationMinutes,
      timezone: options.timezone ?? 'Australia/Brisbane',
    }),
  })

  if (!res.ok && res.status !== 204) {
    const err = await res.text()
    throw new Error(`Failed to update Zoom meeting ${meetingId}: ${err}`)
  }
}
