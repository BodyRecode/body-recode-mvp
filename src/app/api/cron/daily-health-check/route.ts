import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'
import { appUrl } from '@/lib/app-url'
import {
  darkEmailShell,
  emailLogo, emailEyebrow, emailHeading, emailDivider, emailBody,
  emailFeaturedCard, emailCallout, emailStatusCard,
  EMAIL_BLUE, EMAIL_BLUE_DARK, EMAIL_BODY, EMAIL_BODY_SOFT, EMAIL_MUTED,
  EMAIL_HAIRLINE, EMAIL_FF,
} from '@/lib/email-shell'
import { coach, brand } from '@/config/tenant'

type CheckStatus = 'ok' | 'fixed' | 'failed' | 'info'

type CheckResult = {
  name: string
  status: CheckStatus
  detail: string
  action?: string
  manualFix?: string
}

// ─── Infrastructure checks ────────────────────────────────────────────────

async function checkDatabase(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const { error } = await admin.from('leads').select('id').limit(1)
    if (error) {
      return {
        name: 'Database',
        status: 'failed',
        detail: error.message,
        manualFix: 'Check Supabase project status at supabase.com — the project may be paused or over its usage limit.',
      }
    }
    return { name: 'Database', status: 'ok', detail: 'Connected and readable' }
  } catch (e) {
    return {
      name: 'Database',
      status: 'failed',
      detail: String(e),
      manualFix: 'Check Supabase project status at supabase.com.',
    }
  }
}

async function checkAvailabilitySlots(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const { data, error } = await admin
      .from('be_availability')
      .select('id')
      .eq('is_active', true)

    if (error) {
      return {
        name: 'Booking Slots',
        status: 'failed',
        detail: error.message,
        manualFix: 'Check Supabase — the be_availability table may be missing.',
      }
    }

    if (!data || data.length === 0) {
      return {
        name: 'Booking Slots',
        status: 'failed',
        detail: 'No active availability rules — leads cannot see any times to book.',
        manualFix: 'Go to Dashboard → Business → Availability and add your available days and times.',
      }
    }

    const slotsRes = await fetch(`${appUrl()}/api/booking-slots?days=7`)
    const slots = await slotsRes.json()
    if (!Array.isArray(slots) || slots.length === 0) {
      return {
        name: 'Booking Slots',
        status: 'failed',
        detail: 'Availability rules exist but no slots are showing for the next 7 days.',
        manualFix: 'Go to Dashboard → Business → Availability and check for blocked times or gaps in your schedule.',
      }
    }

    return { name: 'Booking Slots', status: 'ok', detail: `${slots.length} slots available over the next 7 days` }
  } catch (e) {
    return {
      name: 'Booking Slots',
      status: 'failed',
      detail: String(e),
      manualFix: 'Go to Dashboard → Business → Availability to review your schedule.',
    }
  }
}

async function checkZoom(): Promise<CheckResult> {
  try {
    const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env
    if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
      return {
        name: 'Zoom',
        status: 'failed',
        detail: 'One or more Zoom environment variables are missing.',
        manualFix: 'Go to Vercel → body-recode-mvp → Settings → Environment Variables and check ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET are all set.',
      }
    }

    const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')
    const res = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
      { method: 'POST', headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    if (!res.ok) {
      const err = await res.text()
      return {
        name: 'Zoom',
        status: 'failed',
        detail: `Credentials rejected by Zoom: ${err}`,
        manualFix: 'Go to marketplace.zoom.us → your Server-to-Server OAuth app → check the credentials are still active.',
      }
    }

    return { name: 'Zoom', status: 'ok', detail: 'Credentials valid — meeting links will generate on booking' }
  } catch (e) {
    return {
      name: 'Zoom',
      status: 'failed',
      detail: String(e),
      manualFix: 'Check your Zoom app credentials at marketplace.zoom.us.',
    }
  }
}

async function checkResend(): Promise<CheckResult> {
  if (!process.env.RESEND_API_KEY) {
    return {
      name: 'Email (Resend)',
      status: 'failed',
      detail: 'RESEND_API_KEY environment variable is missing.',
      manualFix: 'Go to Vercel → body-recode-mvp → Settings → Environment Variables and add RESEND_API_KEY.',
    }
  }
  return {
    name: 'Email (Resend)',
    status: 'ok',
    detail: 'Key present — delivery confirmed by receipt of this email',
  }
}

// ─── Write smoke tests ────────────────────────────────────────────────────
// Each test actually inserts a record and immediately deletes it.
// This catches schema mismatches, constraint violations, and permission
// failures that a read-only check cannot detect.

async function checkBookingWrite(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  const SENTINEL = 'health-check-sentinel'
  try {
    // Need a real lead_id to satisfy the FK — grab any existing lead
    const { data: anyLead } = await admin.from('leads').select('id').limit(1).maybeSingle()
    if (!anyLead) {
      return { name: 'Booking Write', status: 'info', detail: 'No leads in the system yet — skipping write test' }
    }

    const futureTime = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await admin
      .from('be_bookings')
      .insert({
        lead_id: anyLead.id,
        type: 'zoom1',
        scheduled_at: futureTime,
        duration_minutes: 30,
        status: 'scheduled',
        notes: SENTINEL,
      })
      .select('id')
      .single()

    if (error || !data) {
      return {
        name: 'Booking Write',
        status: 'failed',
        detail: `Insert failed: ${error?.message ?? 'no data returned'}`,
        manualFix: 'Check the be_bookings table schema in Supabase — a column constraint or RLS policy may be blocking inserts.',
      }
    }

    await admin.from('be_bookings').delete().eq('id', data.id)
    return { name: 'Booking Write', status: 'ok', detail: 'Insert and delete succeeded' }
  } catch (e) {
    return {
      name: 'Booking Write',
      status: 'failed',
      detail: String(e),
      manualFix: 'Check the be_bookings table in Supabase for schema or permission issues.',
    }
  }
}

async function checkLeadWrite(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  const SENTINEL_EMAIL = 'healthcheck-sentinel@bodyrecode.internal'
  try {
    // Clean up any leftover sentinel from a previous failed run
    await admin.from('leads').delete().eq('email', SENTINEL_EMAIL)

    const { data, error } = await admin
      .from('leads')
      .insert({
        name: 'Health Check Sentinel',
        email: SENTINEL_EMAIL,
        source: 'direct',
        status: 'new_check_in',
      })
      .select('id')
      .single()

    if (error || !data) {
      return {
        name: 'Lead Write',
        status: 'failed',
        detail: `Insert failed: ${error?.message ?? 'no data returned'}`,
        manualFix: 'Check the leads table schema in Supabase — a column constraint or required field may be missing.',
      }
    }

    await admin.from('leads').delete().eq('id', data.id)
    return { name: 'Lead Write', status: 'ok', detail: 'Insert and delete succeeded' }
  } catch (e) {
    return {
      name: 'Lead Write',
      status: 'failed',
      detail: String(e),
      manualFix: 'Check the leads table in Supabase for schema or permission issues.',
    }
  }
}

async function checkIntakeInvitationWrite(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const { data: anyClient } = await admin.from('clients').select('id').limit(1).maybeSingle()
    if (!anyClient) {
      return { name: 'Intake Invitation Write', status: 'info', detail: 'No clients in the system yet — skipping write test' }
    }

    const { data, error } = await admin
      .from('intake_invitations')
      .insert({ client_id: anyClient.id, status: 'pending' })
      .select('id')
      .single()

    if (error || !data) {
      return {
        name: 'Intake Invitation Write',
        status: 'failed',
        detail: `Insert failed: ${error?.message ?? 'no data returned'}`,
        manualFix: 'Check the intake_invitations table schema in Supabase.',
      }
    }

    await admin.from('intake_invitations').delete().eq('id', data.id)
    return { name: 'Intake Invitation Write', status: 'ok', detail: 'Insert and delete succeeded' }
  } catch (e) {
    return {
      name: 'Intake Invitation Write',
      status: 'failed',
      detail: String(e),
      manualFix: 'Check the intake_invitations table in Supabase for schema or permission issues.',
    }
  }
}

async function checkBaselineWrite(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const { data: anyClient } = await admin.from('clients').select('id').limit(1).maybeSingle()
    if (!anyClient) {
      return { name: 'Baseline Write', status: 'info', detail: 'No clients in the system yet — skipping write test' }
    }

    const { data, error } = await admin
      .from('baselines')
      .insert({ client_id: anyClient.id })
      .select('id')
      .single()

    if (error || !data) {
      return {
        name: 'Baseline Write',
        status: 'failed',
        detail: `Insert failed: ${error?.message ?? 'no data returned'}`,
        manualFix: 'Check the baselines table schema in Supabase.',
      }
    }

    await admin.from('baselines').delete().eq('id', data.id)
    return { name: 'Baseline Write', status: 'ok', detail: 'Insert and delete succeeded' }
  } catch (e) {
    return {
      name: 'Baseline Write',
      status: 'failed',
      detail: String(e),
      manualFix: 'Check the baselines table in Supabase for schema or permission issues.',
    }
  }
}

async function checkWeeklyCheckinWrite(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const { data: anyClient } = await admin.from('clients').select('id').limit(1).maybeSingle()
    if (!anyClient) {
      return { name: 'Weekly Check-In Write', status: 'info', detail: 'No clients in the system yet — skipping write test' }
    }

    const { data, error } = await admin
      .from('weekly_checkins')
      .insert({
        client_id: anyClient.id,
        week_number: 9999,
        form_type: 'A',
        submitted_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !data) {
      return {
        name: 'Weekly Check-In Write',
        status: 'failed',
        detail: `Insert failed: ${error?.message ?? 'no data returned'}`,
        manualFix: 'Check the weekly_checkins table schema in Supabase.',
      }
    }

    await admin.from('weekly_checkins').delete().eq('id', data.id)
    return { name: 'Weekly Check-In Write', status: 'ok', detail: 'Insert and delete succeeded' }
  } catch (e) {
    return {
      name: 'Weekly Check-In Write',
      status: 'failed',
      detail: String(e),
      manualFix: 'Check the weekly_checkins table in Supabase for schema or permission issues.',
    }
  }
}

// ─── Data integrity checks ────────────────────────────────────────────────
//
// Every client query below filters `ended_at is null`. When offboarding was
// built on 2026-08-01 the twelve CLIENT-FACING crons were fixed to read that
// gate; this job was missed because it emails the coach, not the client. The
// effect was that people who had ended, or who never started, went on being
// counted as active clients and named in the daily email every morning
// (2026-08-17). A report that keeps raising former clients trains you to
// ignore it, which is worse than not sending it.
//
// `clients.active` is NOT the gate and must not be used here — see
// src/lib/offboard-client.ts for why.

async function checkClientsWithoutIntakeInvitation(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const { data: clients, error } = await admin
      .from('clients')
      .select('id, name, onboarding_token')
      .not('onboarding_token', 'is', null)
      .is('ended_at', null)

    if (error) {
      return { name: 'Clients — Intake Invitation', status: 'info', detail: 'Could not query clients table' }
    }

    if (!clients || clients.length === 0) {
      return { name: 'Clients — Intake Invitation', status: 'ok', detail: 'No clients in the system yet' }
    }

    const { data: invitations } = await admin
      .from('intake_invitations')
      .select('client_id')

    const clientsWithInvite = new Set((invitations ?? []).map((i: { client_id: string }) => i.client_id))
    const missing = clients.filter(c => !clientsWithInvite.has(c.id))

    if (missing.length > 0) {
      return {
        name: 'Clients — Intake Invitation',
        status: 'failed',
        detail: `${missing.length} client${missing.length === 1 ? '' : 's'} have a portal but no intake invitation: ${missing.map(c => c.name).join(', ')}`,
        manualFix: 'Go to Dashboard → each affected client → create a new intake invitation from the client profile.',
      }
    }

    return { name: 'Clients — Intake Invitation', status: 'ok', detail: `All ${clients.length} portal client${clients.length === 1 ? '' : 's'} have an intake invitation` }
  } catch (e) {
    return { name: 'Clients — Intake Invitation', status: 'info', detail: String(e) }
  }
}

async function checkActiveClientsWithoutProgram(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const { data: activeClients, error } = await admin
      .from('clients')
      .select('id, name')
      .not('coaching_started_at', 'is', null)
      .is('ended_at', null)

    if (error || !activeClients || activeClients.length === 0) {
      return { name: 'Active Clients — Programs', status: 'ok', detail: 'No active clients in the system yet' }
    }

    const { data: programs } = await admin
      .from('programs')
      .select('client_id')
      .eq('is_active', true)

    const clientsWithProgram = new Set((programs ?? []).map((p: { client_id: string }) => p.client_id))
    const missing = activeClients.filter(c => !clientsWithProgram.has(c.id))

    if (missing.length > 0) {
      return {
        name: 'Active Clients — Programs',
        status: 'failed',
        detail: `${missing.length} active client${missing.length === 1 ? '' : 's'} have no training program: ${missing.map(c => c.name).join(', ')}`,
        manualFix: 'Go to Dashboard → each affected client → generate a training program.',
      }
    }

    return { name: 'Active Clients — Programs', status: 'ok', detail: `All ${activeClients.length} active client${activeClients.length === 1 ? '' : 's'} have a training program` }
  } catch (e) {
    return { name: 'Active Clients — Programs', status: 'info', detail: String(e) }
  }
}

async function checkActiveClientsWithoutNutrition(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const { data: activeClients, error } = await admin
      .from('clients')
      .select('id, name')
      .not('coaching_started_at', 'is', null)
      .is('ended_at', null)

    if (error || !activeClients || activeClients.length === 0) {
      return { name: 'Active Clients — Nutrition', status: 'ok', detail: 'No active clients in the system yet' }
    }

    const { data: plans } = await admin
      .from('nutrition_plans')
      .select('client_id')
      .eq('status', 'active')

    const clientsWithPlan = new Set((plans ?? []).map((p: { client_id: string }) => p.client_id))
    const missing = activeClients.filter(c => !clientsWithPlan.has(c.id))

    if (missing.length > 0) {
      return {
        name: 'Active Clients — Nutrition',
        status: 'failed',
        detail: `${missing.length} active client${missing.length === 1 ? '' : 's'} have no nutrition plan: ${missing.map(c => c.name).join(', ')}`,
        manualFix: 'Go to Dashboard → each affected client → generate a nutrition plan.',
      }
    }

    return { name: 'Active Clients — Nutrition', status: 'ok', detail: `All ${activeClients.length} active client${activeClients.length === 1 ? '' : 's'} have a nutrition plan` }
  } catch (e) {
    return { name: 'Active Clients — Nutrition', status: 'info', detail: String(e) }
  }
}

async function checkStuckLeads(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await admin
      .from('leads')
      .select('id, name, created_at')
      .eq('status', 'zoom_1_booked')
      .is('zoom_1_date', null)
      .lt('created_at', sevenDaysAgo)

    if (error) {
      return { name: 'Leads — Stuck Bookings', status: 'info', detail: 'Could not query leads table' }
    }

    const stuck = data ?? []
    if (stuck.length > 0) {
      return {
        name: 'Leads — Stuck Bookings',
        status: 'failed',
        detail: `${stuck.length} lead${stuck.length === 1 ? '' : 's'} marked as zoom_1_booked for 7+ days but have no Zoom date set: ${stuck.map(l => l.name).join(', ')}`,
        manualFix: 'Go to Dashboard → Leads → check each affected lead. Either set their Zoom date manually in Actions, or update their status.',
      }
    }

    return { name: 'Leads — Stuck Bookings', status: 'ok', detail: 'No leads stuck in booked status without a date' }
  } catch (e) {
    return { name: 'Leads — Stuck Bookings', status: 'info', detail: String(e) }
  }
}

async function checkPendingIntakes(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await admin
      .from('intake_invitations')
      .select('id, client_id, created_at, clients(name)')
      .eq('status', 'pending')
      .lt('created_at', tenDaysAgo)

    if (error) {
      return { name: 'Intake — Pending 10+ Days', status: 'info', detail: 'Could not query intake_invitations table' }
    }

    const stale = data ?? []
    if (stale.length > 0) {
      const names = stale.map((i: { clients: { name: string }[] | { name: string } | null }) => {
        const c = i.clients
        if (!c) return 'Unknown'
        return Array.isArray(c) ? (c[0]?.name ?? 'Unknown') : c.name
      }).join(', ')
      return {
        name: 'Intake — Pending 10+ Days',
        status: 'failed',
        detail: `${stale.length} client${stale.length === 1 ? '' : 's'} have not completed their intake form after 10+ days: ${names}`,
        manualFix: 'Follow up with each client via WhatsApp to complete their intake form.',
      }
    }

    return { name: 'Intake — Pending 10+ Days', status: 'ok', detail: 'All intake forms completed or recently sent' }
  } catch (e) {
    return { name: 'Intake — Pending 10+ Days', status: 'info', detail: String(e) }
  }
}

async function checkClientsWithMissedCheckins(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

    const { data: activeClients, error } = await admin
      .from('clients')
      .select('id, name, coaching_started_at')
      .not('coaching_started_at', 'is', null)
      .lt('coaching_started_at', fourteenDaysAgo)
      .is('ended_at', null)

    if (error || !activeClients || activeClients.length === 0) {
      return { name: 'Active Clients — Check-Ins', status: 'ok', detail: 'No clients have been active for 14+ days yet' }
    }

    const { data: recentCheckins } = await admin
      .from('weekly_checkins')
      .select('client_id, submitted_at')
      .gte('submitted_at', fourteenDaysAgo)

    const clientsWithRecentCheckin = new Set((recentCheckins ?? []).map((c: { client_id: string }) => c.client_id))
    const missing = activeClients.filter(c => !clientsWithRecentCheckin.has(c.id))

    if (missing.length > 0) {
      return {
        name: 'Active Clients — Check-Ins',
        status: 'failed',
        detail: `${missing.length} active client${missing.length === 1 ? '' : 's'} have not submitted a check-in in 14+ days: ${missing.map(c => c.name).join(', ')}`,
        manualFix: 'Follow up with each client via WhatsApp to check if they are engaged and completing their check-ins.',
      }
    }

    return { name: 'Active Clients — Check-Ins', status: 'ok', detail: `All ${activeClients.length} active client${activeClients.length === 1 ? '' : 's'} have checked in within the last 14 days` }
  } catch (e) {
    return { name: 'Active Clients — Check-Ins', status: 'info', detail: String(e) }
  }
}

// ─── Automation checks ────────────────────────────────────────────────────

async function checkScorecardAutomation(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const { data: workflow, error } = await admin
      .from('be_workflows')
      .select('id, is_active')
      .eq('name', 'Scorecard — Follow-up Sequence')
      .eq('trigger_type', 'form_submitted')
      .maybeSingle()

    if (error) {
      return {
        name: 'Scorecard Automation',
        status: 'failed',
        detail: `Could not query workflows table: ${error.message}`,
        manualFix: 'Go to Dashboard → Business and click Re-sync on the Scorecard Follow-up Automation.',
      }
    }

    if (!workflow) {
      const seeded = await resyncScorecardWorkflow(admin)
      if (seeded) {
        return {
          name: 'Scorecard Automation',
          status: 'fixed',
          detail: 'Workflow was missing.',
          action: 'Recreated the 9-step scorecard follow-up sequence automatically.',
        }
      }
      return {
        name: 'Scorecard Automation',
        status: 'failed',
        detail: 'Workflow was missing and the auto-recreate attempt failed.',
        manualFix: 'Go to Dashboard → Business and click Re-sync on the Scorecard Follow-up Automation.',
      }
    }

    if (!workflow.is_active) {
      await admin.from('be_workflows').update({ is_active: true }).eq('id', workflow.id)
      return {
        name: 'Scorecard Automation',
        status: 'fixed',
        detail: 'Workflow existed but was deactivated.',
        action: 'Reactivated automatically.',
      }
    }

    const { count: stepCount } = await admin
      .from('be_workflow_steps')
      .select('id', { count: 'exact', head: true })
      .eq('workflow_id', workflow.id)

    if (stepCount !== 9) {
      const seeded = await resyncScorecardWorkflow(admin, workflow.id)
      if (seeded) {
        return {
          name: 'Scorecard Automation',
          status: 'fixed',
          detail: `Workflow had ${stepCount} steps instead of the expected 9 — content was out of date.`,
          action: 'Steps resynced automatically with the latest email copy.',
        }
      }
    }

    return {
      name: 'Scorecard Automation',
      status: 'ok',
      detail: `Active — ${stepCount} steps configured`,
    }
  } catch (e) {
    return {
      name: 'Scorecard Automation',
      status: 'failed',
      detail: String(e),
      manualFix: 'Go to Dashboard → Business and click Re-sync on the Scorecard Follow-up Automation.',
    }
  }
}

async function resyncScorecardWorkflow(
  admin: ReturnType<typeof createAdminClient>,
  existingId?: string
): Promise<boolean> {
  const steps = [
    {
      position: 1, type: 'action', action_type: 'send_email',
      config: {
        subject: 'Your Body State result',
        body: `Hi {{first_name}},

Your scorecard result: {{scorecard_score}}/15. Body state: {{scorecard_state}}.

That result tells you one specific thing: which state your body is currently in.

That state determines what works. It also determines what makes things worse. Most people apply the same approach regardless of their state. That is why most people stay stuck.

If you want to understand exactly what is driving your result and what needs to change first, book a free 30-minute call. We go through your scorecard together, identify the specific bottleneck, and map out the first steps.

Book here: ${brand().marketingDomain}/book

---

Want the written breakdown first? The Body Decode Report ($37) covers what your {{scorecard_state}} result means biologically, what is actively working against you right now, and what needs to change first.

Get your report here: ${brand().marketingDomain}/get-report

Kade
Body Recode`,
      },
    },
    { position: 2, type: 'wait', action_type: null, config: { unit: 'days', amount: '2' } },
    {
      position: 3, type: 'action', action_type: 'send_email',
      config: {
        subject: 'What your {{scorecard_state}} result actually means',
        body: `Hi {{first_name}},

Your score was {{scorecard_score}}/15. Body state: {{scorecard_state}}.

Most people look at that result and think they need to train harder or eat less. That is usually the wrong call.

Your body state is a biological signal. It tells you how your body is currently handling load, how well it is recovering, and how much capacity it has to respond right now. The right prescription depends entirely on that state.

The Body Decode Report goes through exactly what {{scorecard_state}} means for your training, your nutrition, and your fat loss. It is written specifically to your result, not a generic guide.

$37. Delivered to your inbox within minutes.

Get your report here: ${brand().marketingDomain}/get-report

Kade
Body Recode`,
      },
    },
    { position: 4, type: 'wait', action_type: null, config: { unit: 'days', amount: '2' } },
    {
      position: 5, type: 'action', action_type: 'send_email',
      config: {
        subject: 'Re: your Body State Scorecard',
        body: `Hi {{first_name}},

Following up on your scorecard.

The most common thing I hear after someone takes it: "That finally explains why nothing has been working."

Knowing your state is the first piece. The second is knowing exactly what to do about it. That is what the call is for.

30 minutes. Free. No pitch.

Book here: ${brand().marketingDomain}/book

If the timing is not right, no problem. The link will be there when you are ready.

Kade
Body Recode`,
      },
    },
    { position: 6, type: 'wait', action_type: null, config: { unit: 'days', amount: '4' } },
    {
      position: 7, type: 'action', action_type: 'send_email',
      config: {
        subject: 'The prescription problem',
        body: `Hi {{first_name}},

Most coaching programs give everyone the same plan. Same training, same nutrition, same timeline. Your body state does not factor into it at all.

Your scorecard came back as {{scorecard_state}}. That is a specific biological pattern, not a label. It tells me how your body is handling load, how well it is recovering, and how much capacity it has to adapt right now.

A program built for a Ready state will not work for a Depleted state. That is not a motivation problem. That is a prescription problem.

That is exactly what the call addresses. Building the approach around your actual state, not a generic template.

Book here: ${brand().marketingDomain}/book

---

If you would rather start with the written read of your state instead, the {{scorecard_state}} Field Guide is $19. 25 pages. What this state means, why standard moves are not landing, the first four moves to bring the load down. Instant delivery to your inbox.

Get the {{scorecard_state}} Field Guide: ${brand().marketingDomain}/field-guide/{{scorecard_state}}?email={{email}}&source=email_descension_day8

Kade
Body Recode`,
      },
    },
    { position: 8, type: 'wait', action_type: null, config: { unit: 'days', amount: '5' } },
    {
      position: 9, type: 'action', action_type: 'send_email',
      config: {
        subject: 'Last one from me, {{first_name}}',
        body: `Hi {{first_name}},

Last email from me on this.

Your scorecard result is still there whenever you want to act on it. The call is still available. The report and the {{scorecard_state}} Field Guide are still there if you want the written breakdown first.

No follow-up after this.

Book a call: ${brand().marketingDomain}/book
Get the report + bundled Field Guide: ${brand().marketingDomain}/get-report
Or just the Field Guide ($19): ${brand().marketingDomain}/field-guide/{{scorecard_state}}?email={{email}}&source=email_descension_day13

Kade
Body Recode`,
      },
    },
  ]

  try {
    if (existingId) {
      await admin.from('be_workflow_steps').delete().eq('workflow_id', existingId)
      const { error } = await admin.from('be_workflow_steps').insert(steps.map(s => ({ ...s, workflow_id: existingId })))
      return !error
    } else {
      const { data: newWorkflow, error: wfError } = await admin
        .from('be_workflows')
        .insert({
          name: 'Scorecard — Follow-up Sequence',
          trigger_type: 'form_submitted',
          trigger_config: { form: 'scorecard' },
          is_active: true,
        })
        .select('id')
        .single()
      if (wfError || !newWorkflow) return false
      const { error: stepError } = await admin.from('be_workflow_steps').insert(steps.map(s => ({ ...s, workflow_id: newWorkflow.id })))
      return !stepError
    }
  } catch {
    return false
  }
}

// ─── Content publishing pulse ────────────────────────────────────────────
//
// Catches the class of bug where scheduled BR IG posts stop shipping
// (Inngest cron paused, function not synced in Inngest cloud, Meta token
// expired, all of them). Any BR IG post whose scheduled_publish_at is
// more than 30 minutes in the past AND has no posted_at is a red flag —
// the publisher cron runs every 5 minutes, so 30 min = 6 missed ticks.
//
// Recovery: run `npx tsx scripts/ig-publish-cron-diagnostic.ts` locally
// against prod env to drain the backlog. Then check Inngest cloud →
// Apps → body-recode → Resync.
async function checkContentPublishingPulse(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const staleThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString()

    const { data, error } = await admin
      .from('calendar_posts')
      .select('id, title, scheduled_publish_at, publish_attempts, publish_error')
      .eq('brand', 'body_recode')
      .eq('platform', 'instagram')
      .neq('type', 'story')
      .is('posted_at', null)
      .not('scheduled_publish_at', 'is', null)
      .lte('scheduled_publish_at', staleThreshold)
      .order('scheduled_publish_at', { ascending: true })
      .limit(20)

    if (error) {
      return {
        name: 'Content Publishing Pulse',
        status: 'failed',
        detail: `Could not query calendar_posts: ${error.message}`,
        manualFix: 'Check Supabase — the calendar_posts table may be missing columns or RLS may be blocking service-role reads.',
      }
    }

    const overdue = data ?? []
    if (overdue.length === 0) {
      return { name: 'Content Publishing Pulse', status: 'ok', detail: 'No overdue BR IG posts (all scheduled posts published on time)' }
    }

    const oldestMinutes = Math.round((Date.now() - new Date(overdue[0].scheduled_publish_at).getTime()) / 60000)
    const withErrors = overdue.filter(r => r.publish_error).length
    const errorSummary = withErrors > 0 ? ` (${withErrors} with publish_error stamped)` : ''

    return {
      name: 'Content Publishing Pulse',
      status: 'failed',
      detail: `${overdue.length} BR IG post${overdue.length === 1 ? '' : 's'} overdue by 30min+ — oldest is ${oldestMinutes} min late${errorSummary}. Publisher cron may not be firing.`,
      manualFix: 'Run `npx tsx scripts/ig-publish-cron-diagnostic.ts` locally to drain the backlog. Then check app.inngest.com → Apps → body-recode → Resync to make sure ig-publisher-cron is registered.',
    }
  } catch (e) {
    return {
      name: 'Content Publishing Pulse',
      status: 'failed',
      detail: String(e),
      manualFix: 'Check Supabase connectivity + calendar_posts table.',
    }
  }
}

// ─── Personal brand cadence ──────────────────────────────────────────────
//
// @kade_dunstone_ is posted MANUALLY (the app never auto-publishes personal
// brand). So the failure mode is silent: nobody notices when the calendar runs
// dry and the account goes quiet. This check flags when there's no personal
// brand post READY (caption written) in the next 3 days, so it pings before a
// gap opens rather than after.
function bneDateStr(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * 86400000)
  return d.toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' }) // YYYY-MM-DD
}
async function checkPersonalBrandCadence(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const days = [0, 1, 2].map(bneDateStr)
    const { data, error } = await admin
      .from('calendar_posts')
      .select('date, title, caption, graphic')
      .eq('brand', 'personal_brand')
      .eq('platform', 'instagram')
      .in('date', days)
      .order('date', { ascending: true })

    if (error) {
      return {
        name: 'Personal Brand Cadence',
        status: 'failed',
        detail: `Could not query calendar_posts: ${error.message}`,
        manualFix: 'Check Supabase — calendar_posts may be missing columns or RLS may be blocking service-role reads.',
      }
    }

    const rows = data ?? []
    const ready = rows.filter(r => r.caption && r.caption.trim())

    if (ready.length === 0) {
      const detail = rows.length === 0
        ? `No personal-brand (@kade_dunstone_) posts scheduled for ${days[0]} → ${days[2]}. The account will go quiet.`
        : `${rows.length} personal-brand slot${rows.length === 1 ? '' : 's'} in the next 3 days but none have a caption written yet.`
      return {
        name: 'Personal Brand Cadence',
        status: 'failed',
        detail,
        manualFix: 'Open Content Calendar, add/write a personal-brand post. @kade_dunstone_ is posted by hand from your phone — nothing auto-publishes it.',
      }
    }

    const next = ready[0]
    const missingGraphic = ready.filter(r => !r.graphic || !r.graphic.trim()).length
    return {
      name: 'Personal Brand Cadence',
      status: 'ok',
      detail: `${ready.length} personal post${ready.length === 1 ? '' : 's'} ready in the next 3 days (next: ${next.date} "${next.title}")${missingGraphic ? ` — heads up: ${missingGraphic} still need a graphic` : ''}`,
    }
  } catch (e) {
    return {
      name: 'Personal Brand Cadence',
      status: 'failed',
      detail: String(e),
      manualFix: 'Check Supabase connectivity + calendar_posts table.',
    }
  }
}

// ─── Inngest function registration ───────────────────────────────────────
//
// Verifies /api/inngest exposes the expected number of functions AND that
// Inngest cloud is properly connected (has_event_key + has_signing_key).
// Does NOT detect Inngest-cloud-side sync drift (would need Inngest's REST
// API + an INNGEST_API_KEY). The Content Publishing Pulse check catches
// the practical symptom of drift; this check catches code-side breakage.
//
// BUMP `EXPECTED_INNGEST_FUNCTION_COUNT` every time you add or remove an
// inngest.createFunction(...) in src/lib/inngest-functions.ts.
const EXPECTED_INNGEST_FUNCTION_COUNT = 24
async function checkInngestRegistration(): Promise<CheckResult> {
  try {
    const res = await fetch(`${appUrl()}/api/inngest`, { method: 'GET', cache: 'no-store' })
    if (!res.ok) {
      return {
        name: 'Inngest Registration',
        status: 'failed',
        detail: `/api/inngest returned ${res.status}`,
        manualFix: 'Check Vercel logs for /api/inngest — the endpoint may be crashing on boot.',
      }
    }
    const body = await res.json() as { function_count?: number; has_event_key?: boolean; has_signing_key?: boolean; mode?: string }

    if (!body.has_event_key || !body.has_signing_key) {
      return {
        name: 'Inngest Registration',
        status: 'failed',
        detail: `Missing keys — event_key=${body.has_event_key} signing_key=${body.has_signing_key}`,
        manualFix: 'Set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY in Vercel prod env, then redeploy.',
      }
    }

    if (body.function_count !== EXPECTED_INNGEST_FUNCTION_COUNT) {
      return {
        name: 'Inngest Registration',
        status: 'failed',
        detail: `/api/inngest reports function_count=${body.function_count}, expected ${EXPECTED_INNGEST_FUNCTION_COUNT}. Either a function was added/removed without bumping EXPECTED_INNGEST_FUNCTION_COUNT, or a registration was silently dropped.`,
        manualFix: 'Bump EXPECTED_INNGEST_FUNCTION_COUNT in src/app/api/cron/daily-health-check/route.ts if the change was intentional. Then go to app.inngest.com → Apps → body-recode → Resync to publish the change to Inngest cloud.',
      }
    }

    return { name: 'Inngest Registration', status: 'ok', detail: `${body.function_count} functions registered, ${body.mode ?? 'unknown'} mode, both keys present` }
  } catch (e) {
    return {
      name: 'Inngest Registration',
      status: 'failed',
      detail: String(e),
      manualFix: 'Check /api/inngest is reachable and Vercel is up.',
    }
  }
}

async function checkFunnelActivity(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await admin
      .from('lead_events')
      .select('lead_id')
      .eq('type', 'scorecard_completed')
      .gte('sent_at', since)

    if (error) {
      return { name: 'Funnel Activity (24h)', status: 'info', detail: 'Could not query lead events' }
    }

    const count = data?.length ?? 0
    return {
      name: 'Funnel Activity (24h)',
      status: 'info',
      detail: count === 0
        ? 'No scorecard completions in the last 24 hours'
        : `${count} scorecard${count === 1 ? '' : 's'} completed`,
    }
  } catch {
    return { name: 'Funnel Activity (24h)', status: 'info', detail: 'Could not query lead events' }
  }
}

// ─── Markdown report generator ───────────────────────────────────────────

function generateMarkdownReport(checks: CheckResult[], ranAt: Date): string {
  const failures = checks.filter(c => c.status === 'failed')
  const fixes = checks.filter(c => c.status === 'fixed')
  const allGood = failures.length === 0

  const overallStatus = allGood && fixes.length === 0
    ? 'ALL SYSTEMS OPERATIONAL'
    : fixes.length > 0 && failures.length === 0
      ? `${fixes.length} ISSUE${fixes.length === 1 ? '' : 'S'} AUTO-FIXED`
      : `${failures.length} ISSUE${failures.length === 1 ? '' : 'S'} NEED MANUAL ATTENTION`

  const dateStr = ranAt.toLocaleString('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })

  const iconFor = (s: CheckStatus) => {
    if (s === 'ok') return 'OK'
    if (s === 'fixed') return 'FIXED'
    if (s === 'failed') return 'FAILED'
    return 'INFO'
  }

  const sections: Array<{ label: string; items: CheckResult[] }> = [
    { label: 'Infrastructure', items: checks.slice(0, 4) },
    { label: 'Write Smoke Tests', items: checks.slice(4, 9) },
    { label: 'Data Integrity', items: checks.slice(9, 15) },
    { label: 'Automation + Pipeline', items: checks.slice(15) },
  ]

  const checkLines = sections.map(section => {
    const rows = section.items.map(c => {
      const lines = [`### [${iconFor(c.status)}] ${c.name}`, `${c.detail}`]
      if (c.action) lines.push(`Auto-fixed: ${c.action}`)
      if (c.manualFix) lines.push(`Action needed: ${c.manualFix}`)
      return lines.join('\n')
    }).join('\n\n')
    return `## ${section.label}\n\n${rows}`
  }).join('\n\n---\n\n')

  const summaryLines: string[] = []
  if (failures.length > 0) {
    summaryLines.push('### Needs manual attention')
    failures.forEach(f => {
      summaryLines.push(`- **${f.name}**: ${f.detail}`)
      if (f.manualFix) summaryLines.push(`  - Fix: ${f.manualFix}`)
    })
  }
  if (fixes.length > 0) {
    summaryLines.push('### Auto-fixed')
    fixes.forEach(f => {
      summaryLines.push(`- **${f.name}**: ${f.action ?? f.detail}`)
    })
  }
  if (failures.length === 0 && fixes.length === 0) {
    summaryLines.push('No issues found. All checks passed.')
  }

  return `# Body Recode — Daily System Health Check

**Run:** ${dateStr} Brisbane
**Status:** ${overallStatus}
**Checks run:** ${checks.length}
**Failures:** ${failures.length}
**Auto-fixed:** ${fixes.length}

---

## Summary

${summaryLines.join('\n')}

---

${checkLines}
`
}

// ─── Main handler ──────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()

  const [db, slots, zoom, email] = await Promise.all([
    checkDatabase(admin),
    checkAvailabilitySlots(admin),
    checkZoom(),
    checkResend(),
  ])

  const [
    bookingWrite,
    leadWrite,
    intakeWrite,
    baselineWrite,
    checkinWrite,
    clientsIntake,
    activePrograms,
    activeNutrition,
    stuckLeads,
    pendingIntakes,
    missedCheckins,
    automation,
    publishingPulse,
    inngestRegistration,
    funnel,
    personalBrandCadence,
  ] = await Promise.all([
    checkBookingWrite(admin),
    checkLeadWrite(admin),
    checkIntakeInvitationWrite(admin),
    checkBaselineWrite(admin),
    checkWeeklyCheckinWrite(admin),
    checkClientsWithoutIntakeInvitation(admin),
    checkActiveClientsWithoutProgram(admin),
    checkActiveClientsWithoutNutrition(admin),
    checkStuckLeads(admin),
    checkPendingIntakes(admin),
    checkClientsWithMissedCheckins(admin),
    checkScorecardAutomation(admin),
    checkContentPublishingPulse(admin),
    checkInngestRegistration(),
    checkFunnelActivity(admin),
    checkPersonalBrandCadence(admin),
  ])

  const checks: CheckResult[] = [
    // Infrastructure
    db, slots, zoom, email,
    // Write smoke tests
    bookingWrite, leadWrite, intakeWrite, baselineWrite, checkinWrite,
    // Data integrity
    clientsIntake, activePrograms, activeNutrition, stuckLeads, pendingIntakes, missedCheckins,
    // Automation + pipeline
    automation, publishingPulse, inngestRegistration, funnel, personalBrandCadence,
  ]

  const failures = checks.filter(c => c.status === 'failed')
  const fixes = checks.filter(c => c.status === 'fixed')
  const allGood = failures.length === 0

  const ranAt = new Date()
  const overallStatus = allGood && fixes.length === 0 ? 'ok' : fixes.length > 0 && failures.length === 0 ? 'fixed' : 'failed'
  const reportMd = generateMarkdownReport(checks, ranAt)

  // Save run to database
  await admin.from('health_check_runs').insert({
    ran_at: ranAt.toISOString(),
    status: overallStatus,
    failures_count: failures.length,
    fixes_count: fixes.length,
    checks: checks,
    report_md: reportMd,
  }).then(({ error }) => {
    if (error) console.error('Failed to save health check run:', error.message)
  })

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const headline = allGood && fixes.length === 0
      ? 'All systems operational.'
      : fixes.length > 0 && failures.length === 0
        ? `${fixes.length} issue${fixes.length === 1 ? '' : 's'} auto-fixed.`
        : `${failures.length} issue${failures.length === 1 ? '' : 's'} need your attention.`

    const subject = allGood && fixes.length === 0
      ? 'Body Recode - Daily Check: All good'
      : fixes.length > 0 && failures.length === 0
        ? `Body Recode - Daily Check: ${fixes.length} issue${fixes.length === 1 ? '' : 's'} auto-fixed`
        : `Body Recode - Daily Check: ${failures.length} issue${failures.length === 1 ? '' : 's'} need your attention`

    const runAt = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Brisbane', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', hour12: true })

    const statusPalette = (s: CheckStatus) => {
      if (s === 'ok')     return { tag: 'OK',     color: EMAIL_BLUE_DARK,  bg: 'rgba(27,109,252,0.10)' }
      if (s === 'fixed')  return { tag: 'FIXED',  color: '#B7791F',        bg: 'rgba(245,158,11,0.12)' }
      if (s === 'failed') return { tag: 'FAILED', color: '#DC2626',        bg: 'rgba(239,68,68,0.10)' }
      return                    { tag: 'INFO',   color: EMAIL_MUTED,      bg: 'rgba(107,107,107,0.08)' }
    }

    const renderRow = (c: CheckResult, isLast: boolean): string => {
      const p = statusPalette(c.status)
      const borderBottom = isLast ? 'none' : `1px solid ${EMAIL_HAIRLINE}`
      return `
            <tr>
              <td style="padding:14px 0;border-bottom:${borderBottom};font-family:${EMAIL_FF};">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td valign="top" width="76" style="padding:0 12px 0 0;">
                      <span style="display:inline-block;padding:3px 9px;background-color:${p.bg};color:${p.color};font-size:10px;font-weight:800;letter-spacing:0.08em;border-radius:99px;font-family:${EMAIL_FF};">${p.tag}</span>
                    </td>
                    <td valign="top">
                      <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#1A1A1A;line-height:1.4;font-family:${EMAIL_FF};">${c.name}</p>
                      <p style="margin:0;font-size:13px;color:${EMAIL_BODY_SOFT};line-height:1.55;font-family:${EMAIL_FF};">${c.detail}</p>
                      ${c.action ? `<p style="margin:6px 0 0;font-size:12px;color:#B7791F;line-height:1.55;font-family:${EMAIL_FF};">&#9889; ${c.action}</p>` : ''}
                      ${c.manualFix ? `<p style="margin:6px 0 0;font-size:12px;color:#DC2626;line-height:1.55;font-family:${EMAIL_FF};">Action needed: ${c.manualFix}</p>` : ''}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`
    }

    const renderSection = (label: string, items: CheckResult[]): string => {
      const rows = items.map((c, i) => renderRow(c, i === items.length - 1)).join('')
      const inner = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows}</table>`
      return emailFeaturedCard(inner, { eyebrow: label })
    }

    const calloutBlock = failures.length > 0
      ? emailCallout({ eyebrow: 'Needs manual attention', value: `${failures.length}`, unit: `issue${failures.length === 1 ? '' : 's'} failing` })
      : fixes.length > 0
        ? emailCallout({ eyebrow: 'Auto-fixed', value: `${fixes.length}`, unit: `issue${fixes.length === 1 ? '' : 's'} resolved` })
        : ''

    const tailStatusCard = failures.length > 0
      ? emailStatusCard({ eyebrow: 'Manual action required', headline: 'Follow the steps under each failed check above.', body: 'These issues could not be fixed automatically. Each row lists the exact action you need to take.' })
      : fixes.length > 0
        ? emailStatusCard({ eyebrow: 'Auto-fixed', headline: 'No action needed from you.', body: 'Issues were detected and resolved automatically before they affected any client.' })
        : emailStatusCard({ eyebrow: 'All clear', headline: 'No issues found.', body: `${checks.length} checks ran, all passed. Next run tomorrow morning Brisbane time.` })

    const inner = `
${emailLogo()}
${emailEyebrow('Daily System Check')}
${emailHeading(headline)}
${emailDivider()}
${emailBody(`Run at ${runAt} Brisbane.`, { size: 14, color: EMAIL_MUTED, bottom: calloutBlock ? 22 : 18 })}
${calloutBlock}
${renderSection('Infrastructure', [db, slots, zoom, email])}
${renderSection('Write smoke tests', [bookingWrite, leadWrite, intakeWrite, baselineWrite, checkinWrite])}
${renderSection('Data integrity', [clientsIntake, activePrograms, activeNutrition, stuckLeads, pendingIntakes, missedCheckins])}
${renderSection('Automation + pipeline', [automation, funnel])}
${tailStatusCard}
${darkEmailSignature()}
`

    await resend.emails.send({
      from: `Body Recode System <${coach().email}>`,
      to: coach().email,
      subject,
      html: darkEmailShell(inner, { previewText: headline }),
    })
    // Suppress unused-import warning for EMAIL_BLUE / EMAIL_BODY — kept available
    // for future row tweaks without re-editing the import line.
    void EMAIL_BLUE; void EMAIL_BODY;
  }

  return NextResponse.json({ ok: allGood, checks, fixes: fixes.map(f => f.name), failures: failures.map(f => f.name) })
}
