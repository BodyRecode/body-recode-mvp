import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildClientReadingSystemPrompt,
  buildClientReadingUserPrompt,
  type CFFSContext,
} from '@/lib/client-reading-prompt'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { buildFoundationalReadingEmail } from '@/lib/foundational-reading-email'
import { appUrl } from '@/lib/app-url'

export const maxDuration = 300

function stripEmDashes<T>(value: T): T {
  if (typeof value === 'string') return value.replace(/—/g, ', ') as T
  if (Array.isArray(value)) return value.map(stripEmDashes) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripEmDashes(v)])
    ) as T
  }
  return value
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { cffs_id } = await request.json()
  if (!cffs_id) {
    return NextResponse.json({ error: 'Missing cffs_id' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: cffs, error: cffsErr } = await admin
    .from('cffs')
    .select('*')
    .eq('id', cffs_id)
    .single()

  if (cffsErr || !cffs) {
    return NextResponse.json({ error: 'CFFS not found' }, { status: 404 })
  }

  const { data: intake, error: intakeErr } = await admin
    .from('intakes')
    .select('*')
    .eq('id', cffs.intake_id)
    .single()

  if (intakeErr || !intake) {
    return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
  }

  const { data: client, error: clientErr } = await admin
    .from('clients')
    .select('id, name, email, onboarding_token, package')
    .eq('id', cffs.client_id)
    .single()

  if (clientErr || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const cffsContext: CFFSContext = {
    body_state_classification: cffs.body_state_classification,
    resolution_state: cffs.resolution_state,
    client_context_summary: cffs.client_context_summary,
    primary_patterns_and_signals: cffs.primary_patterns_and_signals,
    capacity_constraints_and_guardrails: cffs.capacity_constraints_and_guardrails,
    risk_flags_and_watch_items: cffs.risk_flags_and_watch_items,
    tensions_and_tradeoffs: cffs.tensions_and_tradeoffs,
    explicit_non_directives: cffs.explicit_non_directives,
    closing_interpretive_notes: cffs.closing_interpretive_notes,
    exposure_readiness_capacity: cffs.exposure_readiness_capacity,
    exposure_readiness_schedule: cffs.exposure_readiness_schedule,
    exposure_readiness_regulation: cffs.exposure_readiness_regulation,
    exposure_readiness_behaviour: cffs.exposure_readiness_behaviour,
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: buildClientReadingSystemPrompt(),
      messages: [{
        role: 'user',
        content: buildClientReadingUserPrompt(
          intake,
          cffsContext,
          { name: client.name, package: client.package },
          cffs.cr_coach_guidance ?? null
        ),
      }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Anthropic API error:', msg)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 })
  }

  const jsonText = extractFirstJsonObject(content.text)
  if (!jsonText) {
    return NextResponse.json(
      { error: `Could not parse reading. AI returned: ${content.text.slice(0, 120)}` },
      { status: 500 }
    )
  }

  let reading: {
    cr_where_you_are?: string
    cr_what_your_body_is_telling_us?: string
    cr_what_were_focusing_on_first?: string
    cr_what_were_not_doing_yet?: string
    cr_coach_note?: string
  }
  try {
    reading = JSON.parse(jsonText)
  } catch (err) {
    return NextResponse.json(
      { error: `JSON parse failed: ${jsonText.slice(0, 120)}` },
      { status: 500 }
    )
  }

  const required = [
    'cr_where_you_are',
    'cr_what_your_body_is_telling_us',
    'cr_what_were_focusing_on_first',
    'cr_what_were_not_doing_yet',
    'cr_coach_note',
  ] as const
  for (const key of required) {
    if (!reading[key] || typeof reading[key] !== 'string') {
      return NextResponse.json(
        { error: `Missing or invalid section: ${key}` },
        { status: 500 }
      )
    }
  }

  // Strip em dashes + audit client-facing fields against the shared
  // banned-terms list (src/lib/banned-client-terms.ts). Added 2026-06-09
  // after Ruby's published FR was found to contain "mid-arc compression"
  // and "sympathetic dominance" — banned client-facing terms that were
  // previously enforced only on weekly-checkin-feedback.
  const { auditClientReadingFields } = await import('@/lib/banned-client-terms')
  const audit = auditClientReadingFields(reading, [
    'cr_where_you_are',
    'cr_what_your_body_is_telling_us',
    'cr_what_were_focusing_on_first',
    'cr_what_were_not_doing_yet',
    'cr_coach_note',
  ])
  if (!audit.ok) {
    return NextResponse.json(
      { error: `Reading leaked internal terminology (${audit.leaks.join(', ')}). Click Regenerate to redraft.` },
      { status: 500 }
    )
  }
  const cleaned = audit.cleaned

  const now = new Date().toISOString()
  // Auto-publish on generation. Regenerations stay published silently.
  const { data: updated, error: updateErr } = await admin
    .from('cffs')
    .update({
      cr_where_you_are: cleaned.cr_where_you_are,
      cr_what_your_body_is_telling_us: cleaned.cr_what_your_body_is_telling_us,
      cr_what_were_focusing_on_first: cleaned.cr_what_were_focusing_on_first,
      cr_what_were_not_doing_yet: cleaned.cr_what_were_not_doing_yet,
      cr_coach_note: cleaned.cr_coach_note,
      client_reading_generated_at: now,
      client_reading_published_at: now,
    })
    .eq('id', cffs_id)
    .select()
    .single()

  if (updateErr) {
    console.error('Failed to save reading:', updateErr)
    return NextResponse.json(
      { error: `Failed to save reading: ${updateErr.message}` },
      { status: 500 }
    )
  }

  // Notify the client - first time only, never on regenerations
  let emailSent = false
  let emailError: string | null = null
  if (!cffs.client_reading_email_sent_at && client.email && client.onboarding_token) {
    try {
      const firstName = client.name?.split(' ')[0] ?? 'there'
      const baseUrl = appUrl()
      const portalUrl = `${baseUrl}/portal/${client.onboarding_token}/foundational-reading`
      const { subject, html } = buildFoundationalReadingEmail({
        firstName,
        bodyState: cffs.body_state_classification ?? null,
        portalUrl,
      })

      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: client.email,
        subject,
        html,
      })

      await admin
        .from('cffs')
        .update({ client_reading_email_sent_at: new Date().toISOString() })
        .eq('id', cffs_id)

      emailSent = true
    } catch (err) {
      // Email failure should not break the reading generation flow
      emailError = err instanceof Error ? err.message : String(err)
      console.error('Foundational Reading email failed to send:', emailError)
    }
  }

  return NextResponse.json({ cffs: updated, emailSent, emailError })
}
