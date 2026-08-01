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
import { withTemporalContext } from '@/lib/temporal-context'
import { AI_MODELS } from '@/lib/ai-models'

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

/**
 * What is actually prescribed right now, appended to the reading prompt.
 *
 * The reading explains the reasoning behind the plans, so it must not describe a
 * plan the client does not have. "What we are not doing yet" in particular is
 * a factual claim about the prescription, not a doctrinal position.
 */
function livePrescriptionSection(
  plan: Record<string, unknown> | null,
  program: Record<string, unknown> | null,
): string {
  if (!plan && !program) {
    return `

WHAT IS CURRENTLY PRESCRIBED: nothing yet. No active training program and no
active nutrition plan. Write about direction and intent only, and do not state
what is or is not being done, because nothing has been decided.`
  }
  const lines: string[] = ['', 'WHAT IS CURRENTLY PRESCRIBED (this is live and the client can see it)']
  if (program) {
    lines.push(`- Training: ${program.block_name}, ${program.progression_phase} phase, ${program.training_goal} goal, ${program.training_frequency}x/week for ${program.week_duration} weeks.`)
    if (program.conditioning) lines.push(`- Conditioning: ${String(program.conditioning).split('\n')[0]}`)
  } else {
    lines.push('- Training: no active program yet.')
  }
  if (plan) {
    lines.push(`- Nutrition: ${plan.entry_state} entry state, ${plan.meal_frequency} meals, protein anchor ${plan.protein_anchor_g}g, carb demand ${plan.carb_demand_level}, ${plan.estimated_calorie_band}.`)
    if (plan.energy_tdee_kcal && plan.energy_target_low_kcal) {
      const tdee = Number(plan.energy_tdee_kcal)
      const band = String(plan.estimated_calorie_band ?? '')
      const mid = Number((band.match(/(\d{3,4})/g) ?? []).map(Number).reduce((a, b) => a + b, 0)) / Math.max(1, (band.match(/(\d{3,4})/g) ?? []).length)
      const deficit = Number.isFinite(mid) ? Math.round(tdee - mid) : null
      if (deficit && deficit > 75) {
        lines.push(`- The nutrition plan carries a deliberate deficit of roughly ${deficit} kcal a day against an estimated maintenance of ${tdee}. IT IS A DEFICIT. Do NOT write that calorie restriction is not part of the picture, or that nutrition is not being tightened. Explain instead that the reduction is small and deliberate and why it is set where it is.`)
      } else {
        lines.push(`- The nutrition plan sits at or near maintenance (estimated ${tdee} kcal). It is not a fat-loss plan, and you may say so.`)
      }
    }
  } else {
    lines.push('- Nutrition: no active plan yet.')
  }
  lines.push('')
  lines.push('CRITICAL: the "what we are not doing yet" section is a FACTUAL claim about the')
  lines.push('list above, not a general statement of doctrine. Check it before you write it.')
  lines.push('Never say something is not being done when the live prescription does it.')
  return lines.join('\n')
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

  // What has ACTUALLY been prescribed. The reading has a section titled "what
  // we are not doing yet", and until 2026-07-30 it was written from the CFFS
  // alone with no knowledge of the live plans. On Vicki S that produced
  // "Calorie restriction isn't part of the picture either... tightening it
  // further isn't what this stage calls for" while her active plan carried a
  // 193 kcal deficit and 50g less carbohydrate. A client reading the
  // explanation and then opening the plan sees the coach contradict himself.
  const [{ data: livePlan }, { data: liveProgram }] = await Promise.all([
    admin.from('nutrition_plans')
      .select('entry_state, carb_demand_level, protein_anchor_g, estimated_calorie_band, meal_frequency, energy_tdee_kcal, energy_target_low_kcal, energy_target_high_kcal')
      .eq('client_id', cffs.client_id).eq('is_active', true).maybeSingle(),
    admin.from('programs')
      .select('block_name, progression_phase, training_goal, training_frequency, week_duration, conditioning')
      .eq('client_id', cffs.client_id).eq('is_active', true).maybeSingle(),
  ])

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
      ) + livePrescriptionSection(livePlan, liveProgram),
    },
  ]
  let cleaned: Record<string, string> | null = null
  let leaksSeen: string[] = []
  let lastError: string | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    let message
    try {
      message = await anthropic.messages.create({
        model: AI_MODELS.structural,
        max_tokens: 12000,
        system: withTemporalContext(buildClientReadingSystemPrompt()),
        messages: conversation,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Anthropic API error (client reading):', msg)
      return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
    }

    const content = (message.content.find(b => b.type === 'text') ?? message.content[0])
    if (!content || content.type !== 'text') {
      // Name what came back. "Unexpected response from AI" told nobody anything.
      lastError = `AI returned no text block (stop_reason=${message.stop_reason}, blocks=${message.content.map(b => b.type).join('+') || 'none'})`
      continue
    }

    // Truncated mid-object: the JSON never closed, so parsing will fail. Retry
    // rather than feeding a garbled half-object into extraction. (2026-07-11)
    if (message.stop_reason === 'max_tokens') {
      lastError = 'AI output was truncated at the 12000-token limit'
      console.warn('[client-reading] output truncated, retrying')
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
        // Two different failures used to share one message. A generation that
        // never produced parseable text was reported as a terminology leak,
        // which sent the coach hunting for banned words that were never there.
        error: leaksSeen.length
          ? `Reading leaked internal terminology after 3 attempts (${leaksSeen.join(', ')}). Click Regenerate to try a fresh start.`
          : `Reading generation failed after 3 attempts: ${lastError ?? 'unknown error'}. This is not a terminology problem. Click Regenerate to try again.`,
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
      // NOT published on generation (changed 2026-08-01). A reading used to go
      // live in the client's portal the instant it was created, so nobody saw it
      // before the client did. That is how a Foundational Reading reached Vicki S
      // asserting "everything going on with your family" when she had never
      // mentioned family, and she ended her engagement over it. Publishing is now
      // a separate, deliberate act with a lint in front of it.
      client_reading_published_at: null,
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
