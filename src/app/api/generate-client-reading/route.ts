import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildClientReadingSystemPrompt,
  buildClientReadingUserPrompt,
  type CFFSContext,
} from '@/lib/client-reading-prompt'
import { extractFirstJsonObject } from '@/lib/extract-json'

// Reading-published client emails scrapped 2026-06-09 per product call:
// only nutrition plan + training plan publishes notify the client now.
// Readings still generate and live in the portal, but they don't email.

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
    .select('id, name, package')
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

  // Banned-terms aware retry loop, same shape as generate-program-reading
  // and medications-reading. Pre-2026-06-22 was single-shot — anything that
  // leaked failed the whole route and the coach had to click Regenerate
  // again, which would often hit the same leak (Haiku gravitates back to
  // the natural physiology vocabulary for Remediation / nervous-system
  // body states).
  const { auditClientReadingFields } = await import('@/lib/banned-client-terms')
  const required = [
    'cr_where_you_are',
    'cr_what_your_body_is_telling_us',
    'cr_what_were_focusing_on_first',
    'cr_what_were_not_doing_yet',
    'cr_coach_note',
  ] as const
  const conversation: { role: 'user' | 'assistant'; content: string }[] = [
    {
      role: 'user',
      content: buildClientReadingUserPrompt(
        intake,
        cffsContext,
        { name: client.name, package: client.package },
        cffs.cr_coach_guidance ?? null
      ),
    },
  ]
  let cleaned: Record<string, string> | null = null
  let leaksSeen: string[] = []
  let lastError: string | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    let message
    try {
      message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 6000,
        system: buildClientReadingSystemPrompt(),
        messages: conversation,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Anthropic API error (client reading):', msg)
      return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
    }

    const content = message.content[0]
    if (!content || content.type !== 'text') {
      lastError = 'Unexpected response from AI'
      continue
    }

    const jsonText = extractFirstJsonObject(content.text)
    if (!jsonText) {
      lastError = `Could not parse reading. AI returned: ${content.text.slice(0, 120)}`
      continue
    }

    let reading: Record<string, unknown>
    try {
      reading = JSON.parse(jsonText)
    } catch (err) {
      lastError = `JSON parse failed: ${(err as Error).message}`
      continue
    }

    const missing = required.filter(k => typeof reading[k] !== 'string' || !(reading[k] as string).trim())
    if (missing.length > 0) {
      lastError = `Missing required sections: ${missing.join(', ')}`
      continue
    }

    const audit = auditClientReadingFields(reading as Record<string, string>, required as unknown as string[])

    // Partner-specific banned phrase check (Mode A+ overlay). Additive.
    const { findPartnerBannedPhrase } = await import('@/lib/doctrine-parameters')
    const partnerLeaks: string[] = []
    for (const key of required) {
      const val = (reading as Record<string, unknown>)[key]
      if (typeof val !== 'string') continue
      const hit = findPartnerBannedPhrase(val)
      if (hit && !partnerLeaks.includes(hit)) partnerLeaks.push(hit)
    }

    if (audit.ok && partnerLeaks.length === 0) {
      // Apply partner terminology substitutions post-audit. No-op for BR.
      const { applyPartnerTerminology } = await import('@/lib/doctrine-parameters')
      const rewritten: Record<string, string> = {}
      for (const [k, v] of Object.entries(audit.cleaned as Record<string, string>)) {
        rewritten[k] = applyPartnerTerminology(v)
      }
      cleaned = rewritten
      break
    }

    const allLeaks = [...audit.leaks, ...partnerLeaks]
    leaksSeen = Array.from(new Set([...leaksSeen, ...allLeaks].map(t => t.toLowerCase())))
    if (attempt < 3) {
      conversation.push({ role: 'assistant', content: jsonText })
      conversation.push({
        role: 'user',
        content: `That draft contained internal terminology the client has never seen and the system will reject. These terms must not appear anywhere in the output: ${allLeaks.map(t => `"${t}"`).join(', ')}. Rewrite the entire JSON object using ONLY plain client-facing words to express the same idea. Return only the corrected JSON, no commentary.`,
      })
      lastError = `Leaked: ${allLeaks.join(', ')}`
    }
  }

  if (!cleaned) {
    return NextResponse.json(
      {
        error: `Reading leaked internal terminology after 3 attempts (${leaksSeen.length ? leaksSeen.join(', ') : lastError ?? 'unknown'}). Click Regenerate to try a fresh start.`,
      },
      { status: 500 }
    )
  }

  const { DOCTRINE_VERSIONS } = await import('@/lib/doctrine-versions')

  // Archive the previous FR version before overwriting (item I, 2026-06-09).
  // Best-effort — failures here can't block the regenerate.
  if (cffs.cr_where_you_are || cffs.cr_what_your_body_is_telling_us) {
    const { archiveArtefactVersion } = await import('@/lib/artefact-archive')
    void archiveArtefactVersion({
      admin,
      clientId: cffs.client_id,
      artefactType: 'fr',
      sourceRowId: cffs_id,
      doctrineVersion: cffs.fr_doctrine_version ?? null,
      content: {
        cr_where_you_are: cffs.cr_where_you_are,
        cr_what_your_body_is_telling_us: cffs.cr_what_your_body_is_telling_us,
        cr_what_were_focusing_on_first: cffs.cr_what_were_focusing_on_first,
        cr_what_were_not_doing_yet: cffs.cr_what_were_not_doing_yet,
        cr_coach_note: cffs.cr_coach_note,
      },
      generatedAt: cffs.client_reading_generated_at ?? null,
      archivedBy: user.id,
    })
  }

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
      fr_doctrine_version: DOCTRINE_VERSIONS.foundational_reading,
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

  // No client email on Foundational Reading publish. Reading sits silently
  // in the portal until the client is notified about the plan that consumes
  // it (Notify Client button on Training Plan or Nutrition Plan).

  return NextResponse.json({ cffs: updated })
}
