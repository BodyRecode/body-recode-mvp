import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildClientReadingSystemPrompt,
  buildClientReadingUserPrompt,
  stripEmDashes,
  findLeakedTerms,
  type MedicationsCFFSContext,
} from '@/lib/medications-analysis-prompt'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { withTemporalContext } from '@/lib/temporal-context'
import { AI_MODELS } from '@/lib/ai-models'

/**
 * Generate the client-facing Medications Reading. Requires the coach
 * analysis to already exist (it's the reference material for the
 * translation). Writes JSON to clients.medications_reading and stamps
 * medications_reading_generated_at. Does NOT publish — the coach has to
 * click Publish to expose it on the portal.
 *
 * Auto-retries up to 3 times if the draft leaks internal jargon, same
 * pattern as the weekly-checkin-feedback generator.
 */
export const maxDuration = 300

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, medications, medications_analysis')
    .eq('id', id)
    .maybeSingle()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  if (!client.medications_analysis) {
    return NextResponse.json(
      { error: 'Generate the coach Medications Analysis first. The reading translates from it.' },
      { status: 400 }
    )
  }

  const { data: cffsRows } = await admin
    .from('cffs')
    .select('body_state_classification, client_context_summary, primary_patterns_and_signals, capacity_constraints_and_guardrails, risk_flags_and_watch_items, generated_at, is_archived')
    .eq('client_id', id)
    .eq('is_archived', false)
    .order('generated_at', { ascending: false })
    .limit(1)
  const cffsRow = cffsRows?.[0] ?? null
  const cffs: MedicationsCFFSContext | null = cffsRow
    ? {
        body_state_classification: cffsRow.body_state_classification,
        client_context_summary: cffsRow.client_context_summary,
        primary_patterns_and_signals: cffsRow.primary_patterns_and_signals,
        capacity_constraints_and_guardrails: cffsRow.capacity_constraints_and_guardrails,
        risk_flags_and_watch_items: cffsRow.risk_flags_and_watch_items,
      }
    : null

  const firstName = client.name?.split(' ')[0] ?? 'there'

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 3 })

  const conversation: { role: 'user' | 'assistant'; content: string }[] = [
    {
      role: 'user',
      content: buildClientReadingUserPrompt({
        client: { firstName, fullName: client.name ?? null, dateOfBirth: null, gender: null, occupation: null },
        medicationsText: (client.medications ?? '').trim(),
        coachAnalysis: client.medications_analysis,
        cffs,
      }),
    },
  ]

  const REQUIRED = ['mr_what_youre_taking', 'mr_why_it_matters', 'mr_how_we_account_for_it', 'mr_what_to_watch'] as const
  let reading: Record<string, string> | null = null
  let leaksSeen: string[] = []
  let lastError: string | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    let message
    try {
      // Start at 8000. If the model hits max_tokens (large stack — Amanda's
      // estradiol+Vyvanse+Brintellix+GLP-1+lysine is the trigger case), retry
      // once at 16000 before falling through to the jargon-leak retry loop.
      // Pre-2026-06-15 default was 3000 which truncated on stacks ≥4 meds.
      message = await anthropic.messages.create({
        model: AI_MODELS.clinical,
        max_tokens: 8000,
        system: withTemporalContext(buildClientReadingSystemPrompt()),
        messages: conversation,
      })
      if (message.stop_reason === 'max_tokens') {
        console.warn('[medications-reading] hit max_tokens at 8000, retrying at 16000')
        message = await anthropic.messages.create({
          model: AI_MODELS.clinical,
          max_tokens: 16000,
          system: withTemporalContext(buildClientReadingSystemPrompt()),
          messages: conversation,
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Anthropic API error (medications reading):', msg)
      return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
    }

    const content = (message.content.find(b => b.type === 'text') ?? message.content[0])
    if (!content || content.type !== 'text') {
      lastError = 'Unexpected response from AI'
      continue
    }
    const jsonText = extractFirstJsonObject(content.text)
    if (!jsonText) {
      const truncated = message.stop_reason === 'max_tokens'
      lastError = truncated
        ? `Truncated at 16000 tokens (in=${message.usage?.input_tokens ?? '?'}, out=${message.usage?.output_tokens ?? '?'}). Raise the cap.`
        : `Could not parse: ${content.text.slice(0, 160)}`
      continue
    }
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonText)
    } catch (err) {
      lastError = `Invalid JSON: ${(err as Error).message}`
      continue
    }
    const missing = REQUIRED.filter(k => typeof parsed[k] !== 'string' || !(parsed[k] as string).trim())
    if (missing.length > 0) {
      lastError = `Missing required fields: ${missing.join(', ')}`
      continue
    }

    const candidate = stripEmDashes({
      mr_what_youre_taking: parsed.mr_what_youre_taking,
      mr_why_it_matters: parsed.mr_why_it_matters,
      mr_how_we_account_for_it: parsed.mr_how_we_account_for_it,
      mr_what_to_watch: parsed.mr_what_to_watch,
    } as Record<string, string>)

    const allText = REQUIRED.map(k => candidate[k]).join(' ')
    const leaks = findLeakedTerms(allText)

    // Partner-specific banned phrase check (Mode A+ overlay). Additive.
    const { findPartnerBannedPhrase, applyPartnerTerminology } = await import('@/lib/doctrine-parameters')
    const partnerLeaks: string[] = []
    for (const key of REQUIRED) {
      const val = candidate[key]
      if (typeof val !== 'string') continue
      const hit = findPartnerBannedPhrase(val)
      if (hit && !partnerLeaks.includes(hit)) partnerLeaks.push(hit)
    }

    if (leaks.length === 0 && partnerLeaks.length === 0) {
      // Apply partner terminology substitutions. No-op for BR.
      const rewritten: Record<string, string> = {}
      for (const [k, v] of Object.entries(candidate)) {
        rewritten[k] = applyPartnerTerminology(v as string)
      }
      reading = rewritten
      break
    }

    const allLeaks = [...leaks, ...partnerLeaks]
    leaksSeen = Array.from(new Set([...leaksSeen, ...allLeaks].map(t => t.toLowerCase())))
    if (attempt < 3) {
      conversation.push({ role: 'assistant', content: jsonText })
      conversation.push({
        role: 'user',
        content: `That draft contained internal terminology the client has never seen. These terms must not appear: ${allLeaks.map(t => `"${t}"`).join(', ')}. Rewrite the entire JSON object using ONLY plain client-facing words. Return only the corrected JSON.`,
      })
      lastError = `Leaked: ${allLeaks.join(', ')}`
    }
  }

  if (!reading) {
    return NextResponse.json(
      {
        error: `Could not produce a clean reading after 3 attempts (${leaksSeen.length ? leaksSeen.join(', ') : lastError ?? 'unknown'}). Try again.`,
      },
      { status: 500 }
    )
  }

  const nowIso = new Date().toISOString()
  const { error: updateErr } = await admin
    .from('clients')
    .update({ medications_reading: reading, medications_reading_generated_at: nowIso })
    .eq('id', id)
  if (updateErr) {
    return NextResponse.json({ error: `Failed to save reading: ${updateErr.message}` }, { status: 500 })
  }

  return NextResponse.json({ reading, generatedAt: nowIso })
}
