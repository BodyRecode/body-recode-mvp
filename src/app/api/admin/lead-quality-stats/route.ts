import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

type Tier = 'green' | 'yellow' | 'red'
type StatusCounts = Record<string, number>

interface TierStats {
  total: number
  by_status: StatusCounts
  zoom_booked: number
  zoom_completed: number
  closed_no_show: number
  closed_declined: number
  commencement_fee_paid: number
  show_rate: number | null
  close_rate: number | null
}

const ZOOM_BOOKED_STATUSES = new Set(['zoom_booked', 'zoom_1_booked'])
const ZOOM_COMPLETED_STATUSES = new Set(['zoom_completed', 'closed_declined', 'commencement_fee_paid', 'active_deliberate_start', 'active_coaching'])
const CLOSED_STATUSES = new Set(['commencement_fee_paid', 'active_deliberate_start', 'active_coaching'])

function emptyStats(): TierStats {
  return {
    total: 0,
    by_status: {},
    zoom_booked: 0,
    zoom_completed: 0,
    closed_no_show: 0,
    closed_declined: 0,
    commencement_fee_paid: 0,
    show_rate: null,
    close_rate: null,
  }
}

function rate(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null
  return Math.round((numerator / denominator) * 1000) / 10
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret') ?? request.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const windowDays = Number(url.searchParams.get('days') ?? '7')
  const sinceIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()

  const supabase = createAdminClient()

  // Window: leads created in the last N days that have a quality score.
  const { data: windowLeads, error: windowErr } = await supabase
    .from('leads')
    .select('lead_quality, red_flag, status')
    .gte('created_at', sinceIso)
    .not('lead_quality', 'is', null)

  // All-time: every scored lead (full sample for show/close rate, since
  // 7-day windows are too small for meaningful conversion stats).
  const { data: allLeads, error: allErr } = await supabase
    .from('leads')
    .select('lead_quality, red_flag, status, approach_response, investment_readiness')
    .not('lead_quality', 'is', null)

  if (windowErr || allErr) {
    return NextResponse.json({ error: windowErr?.message ?? allErr?.message }, { status: 500 })
  }

  const tiers: Tier[] = ['green', 'yellow', 'red']
  const windowCounts: Record<Tier, number> = { green: 0, yellow: 0, red: 0 }
  for (const l of windowLeads ?? []) {
    const tier = l.lead_quality as Tier | null
    if (tier && tier in windowCounts) windowCounts[tier]++
  }

  const allTime: Record<Tier, TierStats> = {
    green: emptyStats(),
    yellow: emptyStats(),
    red: emptyStats(),
  }

  for (const l of allLeads ?? []) {
    const tier = l.lead_quality as Tier | null
    if (!tier || !(tier in allTime)) continue
    const s = allTime[tier]
    s.total++
    s.by_status[l.status] = (s.by_status[l.status] ?? 0) + 1
    if (ZOOM_BOOKED_STATUSES.has(l.status) || ZOOM_COMPLETED_STATUSES.has(l.status) || l.status === 'closed_no_show') s.zoom_booked++
    if (ZOOM_COMPLETED_STATUSES.has(l.status)) s.zoom_completed++
    if (l.status === 'closed_no_show') s.closed_no_show++
    if (l.status === 'closed_declined') s.closed_declined++
    if (CLOSED_STATUSES.has(l.status)) s.commencement_fee_paid++
  }

  for (const tier of tiers) {
    const s = allTime[tier]
    s.show_rate = rate(s.zoom_completed, s.zoom_booked)
    s.close_rate = rate(s.commencement_fee_paid, s.zoom_completed)
  }

  // Aggregate red vs not-red comparison
  const redFlagged = emptyStats()
  const cleanLeads = emptyStats()
  for (const l of allLeads ?? []) {
    const target = l.red_flag ? redFlagged : cleanLeads
    target.total++
    if (ZOOM_BOOKED_STATUSES.has(l.status) || ZOOM_COMPLETED_STATUSES.has(l.status) || l.status === 'closed_no_show') target.zoom_booked++
    if (ZOOM_COMPLETED_STATUSES.has(l.status)) target.zoom_completed++
    if (l.status === 'closed_no_show') target.closed_no_show++
    if (CLOSED_STATUSES.has(l.status)) target.commencement_fee_paid++
  }
  redFlagged.show_rate = rate(redFlagged.zoom_completed, redFlagged.zoom_booked)
  redFlagged.close_rate = rate(redFlagged.commencement_fee_paid, redFlagged.zoom_completed)
  cleanLeads.show_rate = rate(cleanLeads.zoom_completed, cleanLeads.zoom_booked)
  cleanLeads.close_rate = rate(cleanLeads.commencement_fee_paid, cleanLeads.zoom_completed)

  const payload = {
    generated_at: new Date().toISOString(),
    window_days: windowDays,
    new_leads_in_window: {
      total: (windowLeads ?? []).length,
      by_tier: windowCounts,
    },
    all_time: allTime,
    comparison: {
      red_flagged: redFlagged,
      clean: cleanLeads,
    },
    notes: {
      show_rate_definition: 'zoom_completed / zoom_booked',
      close_rate_definition: 'commencement_fee_paid / zoom_completed',
      hormozi_hypothesis: 'Red-flagged leads should show ~half the show rate and ~half the close rate of clean leads.',
    },
  }

  // Optional email delivery for the scheduled report
  const sendEmail = url.searchParams.get('email') === 'true'
  if (sendEmail && process.env.RESEND_API_KEY) {
    const minSample = Math.min(allTime.green.total, allTime.yellow.total, allTime.red.total)
    const sampleWarning = minSample < 10
      ? `<p style="margin:0 0 16px;font-size:13px;color:#B7791F;">Sample size warning: smallest tier has only ${minSample} leads. Conversion rates are unreliable until ~30+ per tier.</p>`
      : ''

    let verdict = 'Insufficient data — wait for more leads through the Zoom funnel.'
    let verdictColor = '#6B6B6B'
    if (cleanLeads.show_rate != null && redFlagged.show_rate != null && cleanLeads.zoom_booked >= 10 && redFlagged.zoom_booked >= 5) {
      const showRatio = redFlagged.show_rate / cleanLeads.show_rate
      const closeRatio = (cleanLeads.close_rate && redFlagged.close_rate != null)
        ? redFlagged.close_rate / cleanLeads.close_rate
        : null
      if (showRatio <= 0.7 && (closeRatio === null || closeRatio <= 0.7)) {
        verdict = `Hypothesis holding: red-flagged leads show at ${(showRatio * 100).toFixed(0)}% of clean rate.`
        verdictColor = '#1B6DFC'
      } else {
        verdict = `Hypothesis NOT holding so far: red-flagged leads show at ${(showRatio * 100).toFixed(0)}% of clean rate.`
        verdictColor = '#DC2626'
      }
    }

    const tierRow = (tier: Tier) => {
      const s = allTime[tier]
      const c = tier === 'red' ? '#DC2626' : tier === 'yellow' ? '#D97706' : '#16A34A'
      return `<tr>
        <td style="padding:10px 14px;border-bottom:1px solid #E5E5E5;font-size:13px;color:${c};font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">${tier}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E5E5E5;font-size:13px;color:#3A3A3A;text-align:right;">${s.total}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E5E5E5;font-size:13px;color:#3A3A3A;text-align:right;">${s.show_rate ?? '—'}${s.show_rate != null ? '%' : ''}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E5E5E5;font-size:13px;color:#3A3A3A;text-align:right;">${s.close_rate ?? '—'}${s.close_rate != null ? '%' : ''}</td>
      </tr>`
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:560px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid #E5E5E5;">
              <img src="https://bodyrecode.au/logo-black.png" width="110" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#1B6DFC;letter-spacing:0.12em;text-transform:uppercase;">Weekly Lead Quality Report</p>
              <p style="margin:0 0 24px;font-size:20px;font-weight:800;color:#1A1A1A;">${windowDays}-day window — ${new Date().toLocaleDateString('en-AU', { timeZone: 'Australia/Brisbane', day: 'numeric', month: 'short', year: 'numeric' })}</p>

              ${sampleWarning}

              <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#999999;letter-spacing:0.08em;text-transform:uppercase;">New leads this week</p>
              <p style="margin:0 0 24px;font-size:14px;color:#3A3A3A;">
                <strong style="color:#1A1A1A;">${(windowLeads ?? []).length} total</strong> ·
                <span style="color:#16A34A;">${windowCounts.green} green</span> ·
                <span style="color:#D97706;">${windowCounts.yellow} yellow</span> ·
                <span style="color:#DC2626;">${windowCounts.red} red</span>
              </p>

              <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#999999;letter-spacing:0.08em;text-transform:uppercase;">All-time conversion by tier</p>
              <table cellpadding="0" cellspacing="0" style="width:100%;background:#1A1A1A;border-radius:10px;border:1px solid #222;margin-bottom:24px;border-collapse:separate;">
                <tr>
                  <th style="padding:10px 14px;font-size:10px;font-weight:700;color:#999999;text-transform:uppercase;letter-spacing:0.08em;text-align:left;border-bottom:1px solid #E5E5E5;">Tier</th>
                  <th style="padding:10px 14px;font-size:10px;font-weight:700;color:#999999;text-transform:uppercase;letter-spacing:0.08em;text-align:right;border-bottom:1px solid #E5E5E5;">Leads</th>
                  <th style="padding:10px 14px;font-size:10px;font-weight:700;color:#999999;text-transform:uppercase;letter-spacing:0.08em;text-align:right;border-bottom:1px solid #E5E5E5;">Show</th>
                  <th style="padding:10px 14px;font-size:10px;font-weight:700;color:#999999;text-transform:uppercase;letter-spacing:0.08em;text-align:right;border-bottom:1px solid #E5E5E5;">Close</th>
                </tr>
                ${tierRow('green')}
                ${tierRow('yellow')}
                ${tierRow('red')}
              </table>

              <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#999999;letter-spacing:0.08em;text-transform:uppercase;">Red-flagged vs clean</p>
              <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px;background:rgba(27,109,252,0.06);border:1px solid rgba(27,109,252,0.2);border-radius:10px;width:48%;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#1B6DFC;text-transform:uppercase;letter-spacing:0.08em;">Clean</p>
                    <p style="margin:0;font-size:13px;color:#3A3A3A;">Show: <strong style="color:#fff;">${cleanLeads.show_rate ?? '—'}${cleanLeads.show_rate != null ? '%' : ''}</strong></p>
                    <p style="margin:0;font-size:13px;color:#3A3A3A;">Close: <strong style="color:#fff;">${cleanLeads.close_rate ?? '—'}${cleanLeads.close_rate != null ? '%' : ''}</strong></p>
                  </td>
                  <td style="width:4%;"></td>
                  <td style="padding:14px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:10px;width:48%;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#DC2626;text-transform:uppercase;letter-spacing:0.08em;">Red-flagged</p>
                    <p style="margin:0;font-size:13px;color:#3A3A3A;">Show: <strong style="color:#fff;">${redFlagged.show_rate ?? '—'}${redFlagged.show_rate != null ? '%' : ''}</strong></p>
                    <p style="margin:0;font-size:13px;color:#3A3A3A;">Close: <strong style="color:#fff;">${redFlagged.close_rate ?? '—'}${redFlagged.close_rate != null ? '%' : ''}</strong></p>
                  </td>
                </tr>
              </table>

              <div style="padding:14px 18px;background:rgba(${verdictColor === '#1B6DFC' ? '20,184,166' : verdictColor === '#DC2626' ? '239,68,68' : '168,162,158'},0.08);border-left:3px solid ${verdictColor};border-radius:6px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:${verdictColor};text-transform:uppercase;letter-spacing:0.08em;">Verdict</p>
                <p style="margin:0;font-size:14px;color:#3A3A3A;line-height:1.6;">${verdict}</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`

    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Body Recode <kade@bodyrecode.au>',
        to: 'kade@bodyrecode.au',
        subject: `Lead Quality Report — ${(windowLeads ?? []).length} new leads this week`,
        html,
      })
    } catch (err) {
      console.error('[lead-quality-stats] Failed to send email:', err)
    }
  }

  return NextResponse.json(payload)
}
