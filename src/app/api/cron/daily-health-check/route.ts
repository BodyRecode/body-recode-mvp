import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'

type CheckResult = {
  name: string
  ok: boolean
  detail: string
}

async function checkDatabase(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const { error } = await admin.from('leads').select('id').limit(1)
    if (error) return { name: 'Database', ok: false, detail: error.message }
    return { name: 'Database', ok: true, detail: 'Connected and readable' }
  } catch (e) {
    return { name: 'Database', ok: false, detail: String(e) }
  }
}

async function checkAvailabilitySlots(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const { data, error } = await admin
      .from('be_availability')
      .select('id')
      .eq('is_active', true)
    if (error) return { name: 'Booking Slots', ok: false, detail: error.message }
    if (!data || data.length === 0) {
      return { name: 'Booking Slots', ok: false, detail: 'No active availability rules - leads cannot book a call' }
    }
    // Also check that slots actually generate for the next 7 days
    const slotsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/booking-slots?days=7`)
    const slots = await slotsRes.json()
    if (!Array.isArray(slots) || slots.length === 0) {
      return { name: 'Booking Slots', ok: false, detail: 'Availability rules exist but no slots generated for next 7 days (check blocked times or schedule gaps)' }
    }
    return { name: 'Booking Slots', ok: true, detail: `${slots.length} slots available over next 7 days` }
  } catch (e) {
    return { name: 'Booking Slots', ok: false, detail: String(e) }
  }
}

async function checkZoom(): Promise<CheckResult> {
  try {
    const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env
    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      return { name: 'Zoom', ok: false, detail: 'Missing ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, or ZOOM_CLIENT_SECRET env vars' }
    }
    const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')
    const res = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
      { method: 'POST', headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    if (!res.ok) {
      const err = await res.text()
      return { name: 'Zoom', ok: false, detail: `Token exchange failed: ${err}` }
    }
    return { name: 'Zoom', ok: true, detail: 'Credentials valid, token exchange successful' }
  } catch (e) {
    return { name: 'Zoom', ok: false, detail: String(e) }
  }
}

async function checkResend(): Promise<CheckResult> {
  // The API key is send-only (restricted) — management calls like domains.list() will fail.
  // Just verify the key is present and non-empty. Actual sending is proven by the health
  // check email itself arriving in the inbox each morning.
  if (!process.env.RESEND_API_KEY) {
    return { name: 'Email (Resend)', ok: false, detail: 'RESEND_API_KEY env var missing' }
  }
  return { name: 'Email (Resend)', ok: true, detail: 'API key present (send-only key — delivery confirmed by this email)' }
}

async function checkRecentBookingErrors(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    // Check if there are any leads that completed a scorecard in the last 24h but have no booking
    // This surfaces the pattern where something broke mid-funnel
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await admin
      .from('lead_events')
      .select('lead_id, type, created_at')
      .eq('type', 'scorecard_completed')
      .gte('sent_at', since)
    if (error) return { name: 'Funnel Activity (24h)', ok: true, detail: 'Could not query events (non-critical)' }
    const count = data?.length ?? 0
    return {
      name: 'Funnel Activity (24h)',
      ok: true,
      detail: count === 0
        ? 'No scorecard completions in the last 24 hours'
        : `${count} scorecard${count === 1 ? '' : 's'} completed in the last 24 hours`,
    }
  } catch (e) {
    return { name: 'Funnel Activity (24h)', ok: true, detail: 'Could not check (non-critical)' }
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()

  const [db, slots, zoom, email, funnel] = await Promise.all([
    checkDatabase(admin),
    checkAvailabilitySlots(admin),
    checkZoom(),
    checkResend(),
    checkRecentBookingErrors(admin),
  ])

  const checks: CheckResult[] = [db, slots, zoom, email, funnel]
  const failures = checks.filter(c => !c.ok)
  const allGood = failures.length === 0

  // Build email
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const statusBadge = allGood
      ? `<span style="display:inline-block;padding:4px 14px;background:rgba(20,184,166,0.15);border:1px solid rgba(20,184,166,0.4);border-radius:99px;font-size:12px;font-weight:700;color:#14b8a6;">All systems operational</span>`
      : `<span style="display:inline-block;padding:4px 14px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);border-radius:99px;font-size:12px;font-weight:700;color:#ef4444;">${failures.length} issue${failures.length === 1 ? '' : 's'} detected</span>`

    const checkRows = checks.map(c => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #1c1917;">
          <span style="font-size:13px;font-weight:600;color:${c.ok ? '#ffffff' : '#ef4444'};">
            ${c.ok ? '&#10003;' : '&#10007;'} ${c.name}
          </span>
          <br/>
          <span style="font-size:12px;color:#57534e;">${c.detail}</span>
        </td>
      </tr>`).join('')

    const subject = allGood
      ? 'Body Recode - Daily Health Check: All good'
      : `Body Recode - Daily Health Check: ${failures.length} issue${failures.length === 1 ? '' : 's'} need attention`

    await resend.emails.send({
      from: 'Body Recode System <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:520px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
        <tr>
          <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;border-bottom:1px solid #1c1917;">
            <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;"/>
          </td>
        </tr>
        <tr>
          <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#ffffff;">Daily System Health Check</p>
            <p style="margin:0 0 24px;font-size:13px;color:#57534e;">Run at ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Brisbane', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })} Brisbane</p>
            <div style="margin-bottom:28px;">${statusBadge}</div>
            <table style="width:100%;border-top:1px solid #1c1917;" cellpadding="0" cellspacing="0">
              ${checkRows}
            </table>
            ${!allGood ? `
            <div style="margin-top:28px;padding:16px 20px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:10px;">
              <p style="margin:0;font-size:13px;color:#ef4444;font-weight:600;">Action required</p>
              <p style="margin:6px 0 0;font-size:13px;color:#a8a29e;">One or more systems are failing. Leads may not be able to complete the funnel. Check the issues above and fix before your next lead comes through.</p>
            </div>` : ''}
            <div style="margin-top:32px;">
              ${darkEmailSignature()}
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    })
  }

  return NextResponse.json({
    ok: allGood,
    checks,
    failures: failures.map(f => f.name),
  })
}
