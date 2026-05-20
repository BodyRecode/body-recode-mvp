import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'
import { appUrl } from '@/lib/app-url'

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

async function checkClientsWithoutIntakeInvitation(admin: ReturnType<typeof createAdminClient>): Promise<CheckResult> {
  try {
    const { data: clients, error } = await admin
      .from('clients')
      .select('id, name, onboarding_token')
      .not('onboarding_token', 'is', null)

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
        body: `Hi {{first_name}},\n\nYour scorecard result: {{scorecard_score}}/15. Body state: {{scorecard_state}}.\n\nThat result tells you one specific thing: which state your body is currently in.\n\nThat state determines what works. It also determines what makes things worse. Most people apply the same approach regardless of their state. That is why most people stay stuck.\n\nIf you want to understand exactly what is driving your result and what needs to change first, book a free 30-minute call. We go through your scorecard together, identify the specific bottleneck, and map out the first steps.\n\nBook here: https://bodyrecode.au/book\n\n---\n\nWant the written breakdown first? The Body Decode Report ($37) covers what your {{scorecard_state}} result means biologically, what is actively working against you right now, and what needs to change first.\n\nGet your report here: https://bodyrecode.au/get-report\n\nKade\nBody Recode`,
      },
    },
    { position: 2, type: 'wait', action_type: null, config: { unit: 'days', amount: '2' } },
    {
      position: 3, type: 'action', action_type: 'send_email',
      config: {
        subject: 'What your {{scorecard_state}} result actually means',
        body: `Hi {{first_name}},\n\nYour score was {{scorecard_score}}/15. Body state: {{scorecard_state}}.\n\nMost people look at that result and think they need to train harder or eat less. That is usually the wrong call.\n\nYour body state is a biological signal. It tells you how your body is currently handling load, how well it is recovering, and how much capacity it has to respond right now. The right prescription depends entirely on that state.\n\nThe Body Decode Report goes through exactly what {{scorecard_state}} means for your training, your nutrition, and your fat loss. It is written specifically to your result, not a generic guide.\n\n$37. Delivered to your inbox within minutes.\n\nGet your report here: https://bodyrecode.au/get-report\n\nKade\nBody Recode`,
      },
    },
    { position: 4, type: 'wait', action_type: null, config: { unit: 'days', amount: '2' } },
    {
      position: 5, type: 'action', action_type: 'send_email',
      config: {
        subject: 'Re: your Body State Scorecard',
        body: `Hi {{first_name}},\n\nFollowing up on your scorecard.\n\nThe most common thing I hear after someone takes it: "That finally explains why nothing has been working."\n\nKnowing your state is the first piece. The second is knowing exactly what to do about it. That is what the call is for.\n\n30 minutes. Free. No pitch.\n\nBook here: https://bodyrecode.au/book\n\nIf the timing is not right, no problem. The link will be there when you are ready.\n\nKade\nBody Recode`,
      },
    },
    { position: 6, type: 'wait', action_type: null, config: { unit: 'days', amount: '4' } },
    {
      position: 7, type: 'action', action_type: 'send_email',
      config: {
        subject: 'The prescription problem',
        body: `Hi {{first_name}},\n\nMost coaching programs give everyone the same plan. Same training, same nutrition, same timeline. Your body state does not factor into it at all.\n\nYour scorecard came back as {{scorecard_state}}. That is a specific biological pattern, not a label. It tells me how your body is handling load, how well it is recovering, and how much capacity it has to adapt right now.\n\nA program built for a Ready state will not work for a Depleted state. That is not a motivation problem. That is a prescription problem.\n\nThat is exactly what the call addresses. Building the approach around your actual state, not a generic template.\n\nBook here: https://bodyrecode.au/book\n\nKade\nBody Recode`,
      },
    },
    { position: 8, type: 'wait', action_type: null, config: { unit: 'days', amount: '5' } },
    {
      position: 9, type: 'action', action_type: 'send_email',
      config: {
        subject: 'Last one from me, {{first_name}}',
        body: `Hi {{first_name}},\n\nLast email from me on this.\n\nYour scorecard result is still there whenever you want to act on it. The call is still available. The report is still there if you want the written breakdown first.\n\nNo follow-up after this.\n\nBook a call: https://bodyrecode.au/book\nGet the report: https://bodyrecode.au/get-report\n\nKade\nBody Recode`,
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
    funnel,
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
    checkFunnelActivity(admin),
  ])

  const checks: CheckResult[] = [
    // Infrastructure
    db, slots, zoom, email,
    // Write smoke tests
    bookingWrite, leadWrite, intakeWrite, baselineWrite, checkinWrite,
    // Data integrity
    clientsIntake, activePrograms, activeNutrition, stuckLeads, pendingIntakes, missedCheckins,
    // Automation + pipeline
    automation, funnel,
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

    const overallBadge = allGood && fixes.length === 0
      ? `<span style="display:inline-block;padding:4px 14px;background:rgba(27,109,252,0.15);border:1px solid rgba(27,109,252,0.4);border-radius:99px;font-size:12px;font-weight:700;color:#1B6DFC;">All systems operational</span>`
      : fixes.length > 0 && failures.length === 0
        ? `<span style="display:inline-block;padding:4px 14px;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);border-radius:99px;font-size:12px;font-weight:700;color:#B7791F;">${fixes.length} issue${fixes.length === 1 ? '' : 's'} auto-fixed</span>`
        : `<span style="display:inline-block;padding:4px 14px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);border-radius:99px;font-size:12px;font-weight:700;color:#DC2626;">${failures.length} issue${failures.length === 1 ? '' : 's'} need your attention</span>`

    const iconFor = (s: CheckStatus) => {
      if (s === 'ok') return `<span style="color:#1B6DFC;">&#10003;</span>`
      if (s === 'fixed') return `<span style="color:#B7791F;">&#9889;</span>`
      if (s === 'failed') return `<span style="color:#DC2626;">&#10007;</span>`
      return `<span style="color:#999999;">&#8212;</span>`
    }

    const colorFor = (s: CheckStatus) => {
      if (s === 'ok') return '#ffffff'
      if (s === 'fixed') return '#B7791F'
      if (s === 'failed') return '#DC2626'
      return '#6B6B6B'
    }

    const sectionHeader = (label: string) =>
      `<tr><td style="padding:18px 0 6px;"><p style="margin:0;font-size:10px;font-weight:700;color:#999999;letter-spacing:0.1em;text-transform:uppercase;">${label}</p></td></tr>`

    const checkRow = (c: CheckResult) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #E5E5E5;">
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px;">
            ${iconFor(c.status)}
            <span style="font-size:13px;font-weight:600;color:${colorFor(c.status)};">${c.name}</span>
          </div>
          <p style="margin:0 0 ${c.action || c.manualFix ? '6px' : '0'};font-size:12px;color:#999999;padding-left:18px;">${c.detail}</p>
          ${c.action ? `<p style="margin:0;font-size:12px;color:#B7791F;padding-left:18px;">&#9889; ${c.action}</p>` : ''}
          ${c.manualFix ? `<p style="margin:0;font-size:12px;color:#DC2626;padding-left:18px;">Action needed: ${c.manualFix}</p>` : ''}
        </td>
      </tr>`

    const checkRows = `
      ${sectionHeader('Infrastructure')}
      ${[db, slots, zoom, email].map(checkRow).join('')}
      ${sectionHeader('Write Smoke Tests')}
      ${[bookingWrite, leadWrite, intakeWrite, baselineWrite, checkinWrite].map(checkRow).join('')}
      ${sectionHeader('Data Integrity')}
      ${[clientsIntake, activePrograms, activeNutrition, stuckLeads, pendingIntakes, missedCheckins].map(checkRow).join('')}
      ${sectionHeader('Automation + Pipeline')}
      ${[automation, funnel].map(checkRow).join('')}
    `

    const subject = allGood && fixes.length === 0
      ? 'Body Recode - Daily Check: All good'
      : fixes.length > 0 && failures.length === 0
        ? `Body Recode - Daily Check: ${fixes.length} issue${fixes.length === 1 ? '' : 's'} auto-fixed`
        : `Body Recode - Daily Check: ${failures.length} issue${failures.length === 1 ? '' : 's'} need your attention`

    await resend.emails.send({
      from: 'Body Recode System <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
            <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;"/>
          </td>
        </tr>
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#1A1A1A;">Daily System Health Check</p>
            <p style="margin:0 0 24px;font-size:12px;color:#999999;">Run at ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Brisbane', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })} Brisbane</p>
            <div style="margin-bottom:28px;">${overallBadge}</div>
            <table style="width:100%;border-top:1px solid #E5E5E5;" cellpadding="0" cellspacing="0">
              ${checkRows}
            </table>
            ${failures.length > 0 ? `
            <div style="margin-top:24px;padding:16px 20px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:10px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#DC2626;">Manual action required</p>
              <p style="margin:0;font-size:12px;color:#6B6B6B;line-height:1.6;">The issues marked above could not be fixed automatically. Follow the steps listed under each failed check.</p>
            </div>` : ''}
            ${fixes.length > 0 && failures.length === 0 ? `
            <div style="margin-top:24px;padding:16px 20px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:10px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#B7791F;">Auto-fixed</p>
              <p style="margin:0;font-size:12px;color:#6B6B6B;line-height:1.6;">Issues were detected and resolved automatically. No action needed from you.</p>
            </div>` : ''}
            <div style="margin-top:32px;">${darkEmailSignature()}</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    })
  }

  return NextResponse.json({ ok: allGood, checks, fixes: fixes.map(f => f.name), failures: failures.map(f => f.name) })
}
