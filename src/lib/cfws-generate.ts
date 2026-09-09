/**
 * CFWS generation, extracted from the weekly check-in route on 2026-08-20 so
 * that the live path and the backfill script cannot drift apart.
 *
 * Why this file exists:
 *
 * CFWS generation was silently dead from 2026-07-26 to 2026-08-20. Commit
 * 31437dfe (29 Jul) moved AI_MODELS.clinical from Haiku 4.5 to Sonnet 5, which
 * runs extended thinking by default. The call still asked for max_tokens: 2000,
 * which was ample for Haiku. On Sonnet 5 thinking consumed 1610 of those 2000
 * tokens and the JSON came back truncated, so extractFirstJsonObject returned
 * null and the function returned early.
 *
 * Nothing threw. The caller's .catch() never fired, no row was inserted, and the
 * coach still received an email saying "a CFWS will be generated shortly." Nine
 * check-ins across three clients produced nothing, and the reassessment triggers
 * that key off the CFWS kept firing against three-week-old data.
 *
 * Two changes prevent a repeat:
 *
 *   1. max_tokens is 8000, measured not guessed. A real week-13 generation used
 *      3847 output tokens (2655 thinking, 1192 text), so this is roughly double
 *      headroom. CFWS is ANALYSIS in the ai-models.ts taxonomy, genuine synthesis
 *      rather than structured assembly, so thinking stays on and the budget is
 *      sized to fit it rather than the effort being turned down.
 *
 *   2. Every failure path THROWS. A silent return is what turned a one-line
 *      budget error into three and a half weeks of missing clinical data.
 */

import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCFWSSystemPrompt, buildCFWSUserPrompt, WeeklyCheckInPair, type CFWSCycleContext } from '@/lib/cfws-prompt'
import { cycleContextFor } from '@/lib/cycle-phase-bands'
import { withTemporalContext } from '@/lib/temporal-context'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { AI_MODELS } from '@/lib/ai-models'

/**
 * Sized from a measured generation, not a guess. See the header note.
 * If the CFWS prompt grows, re-measure rather than nudging this upward.
 */
export const CFWS_MAX_TOKENS = 8000

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

function stripEmDashes(obj: unknown): unknown {
  if (typeof obj === 'string') return obj.replace(/\s*—\s*/g, ', ')
  if (Array.isArray(obj)) return obj.map(stripEmDashes)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, stripEmDashes(v)]))
  }
  return obj
}

/**
 * Where a check-in week sat in her cycle, or null.
 *
 * Dated against the check-in's own submission time rather than "now", so
 * regenerating an old week does not stamp it with today's phase. Falls back to
 * now when the row has no timestamp, which is the live path anyway.
 *
 * Returns null for a missing date, a stale one, or a day beyond a plausible
 * luteal phase — and null means the read says nothing about her cycle at all.
 * A wrong phase is worse than no phase: it is confidently two weeks out.
 */
export async function resolveCycleContext(
  admin: ReturnType<typeof createAdminClient>,
  clientId: string,
  weekNumber: number
): Promise<CFWSCycleContext | null> {
  const [{ data: clientRow }, { data: checkinRow }] = await Promise.all([
    admin.from('clients').select('last_period_start').eq('id', clientId).maybeSingle(),
    admin
      .from('weekly_checkins')
      .select('created_at')
      .eq('client_id', clientId)
      .eq('week_number', weekNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  const lastPeriodStart = (clientRow as { last_period_start?: string | null } | null)?.last_period_start ?? null
  if (!lastPeriodStart) return null
  const onDate = (checkinRow as { created_at?: string | null } | null)?.created_at ?? new Date().toISOString()
  return cycleContextFor(lastPeriodStart, onDate)
}

export async function generateCFWS(
  admin: ReturnType<typeof createAdminClient>,
  client: { id: string; name: string },
  weekNumber: number,
  formAResponses: Record<string, string>,
  formBResponses: Record<string, string>,
  /**
   * The week each form was actually submitted for. Callers pair this week's
   * form with the most recent opposite form, which is normally a week older,
   * so the prompt has to be told which is which. Defaults to weekNumber for
   * both, i.e. a genuine same-week pair. See WeeklyCheckInPair in cfws-prompt.
   */
  formWeeks?: { formAWeekNumber?: number; formBWeekNumber?: number }
) {
  // Get last 2 resolved weeks for rolling window (excluding current)
  const { data: recentCheckins } = await admin
    .from('weekly_checkins')
    .select('week_number, form_type, responses')
    .eq('client_id', client.id)
    .lt('week_number', weekNumber)
    .order('week_number', { ascending: false })
    .limit(6)

  // Build rolling window from recent complete pairs
  const recentPairs: WeeklyCheckInPair[] = []
  if (recentCheckins) {
    const byWeek = new Map<number, { A?: Record<string, string>; B?: Record<string, string> }>()
    for (const ci of recentCheckins) {
      const wk = ci.week_number
      if (!byWeek.has(wk)) byWeek.set(wk, {})
      const entry = byWeek.get(wk)!
      if (ci.form_type === 'A') entry.A = ci.responses as Record<string, string>
      if (ci.form_type === 'B') entry.B = ci.responses as Record<string, string>
    }
    for (const [wk, pair] of byWeek) {
      if (pair.A && pair.B && recentPairs.length < 2) {
        recentPairs.push({ weekNumber: wk, formA: pair.A, formB: pair.B })
      }
    }
  }

  const currentPair: WeeklyCheckInPair = {
    weekNumber,
    formA: formAResponses,
    formB: formBResponses,
    formAWeekNumber: formWeeks?.formAWeekNumber ?? weekNumber,
    formBWeekNumber: formWeeks?.formBWeekNumber ?? weekNumber,
  }

  // The CFFS is the anchor for all four readiness ratings. Without it the
  // rubric has no baseline to hold and the model rates the week cold, which
  // pushes everything to Amber and puts "No CFFS baseline was available in
  // this cycle's inputs" into coach-facing prose (Razia week 14, 23 Aug).
  //
  // /api/generate-cfws has always fetched this. This path never did, so every
  // CFWS generated from a live check-in since the extraction on 2026-08-20 has
  // been unanchored. Added 2026-09-07.
  const { data: cffsRows, error: cffsError } = await admin
    .from('cffs')
    .select(
      'body_state_classification, resolution_state, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour, capacity_constraints_and_guardrails, risk_flags_and_watch_items, generated_at'
    )
    .eq('client_id', client.id)
    .eq('is_archived', false)
    .order('generated_at', { ascending: false })
    .limit(1)
  if (cffsError) {
    throw new Error(
      `CFWS week ${weekNumber} for ${client.name}: CFFS baseline lookup failed: ${cffsError.message}`
    )
  }
  const cffsBaseline = cffsRows?.[0] ?? null

  const cycleContext = await resolveCycleContext(admin, client.id, weekNumber)

  const message = await anthropic.messages.create({
    model: AI_MODELS.clinical,
    max_tokens: CFWS_MAX_TOKENS,
    system: withTemporalContext(buildCFWSSystemPrompt()),
    messages: [
      {
        role: 'user',
        content: buildCFWSUserPrompt(client.name, currentPair, recentPairs, cffsBaseline, cycleContext),
      },
    ],
  })

  // Every one of these was a silent `return` until 2026-08-20. Throw instead:
  // the caller logs, and a failure is visible rather than absent.
  if (message.stop_reason === 'max_tokens') {
    // Not yet in the SDK's Usage type; present on the wire and the single most
    // useful number for diagnosing a budget overrun.
    const thinking = (message.usage as { output_tokens_details?: { thinking_tokens?: number } })
      ?.output_tokens_details?.thinking_tokens
    throw new Error(
      `CFWS week ${weekNumber} for ${client.name} hit max_tokens (${CFWS_MAX_TOKENS}). ` +
        `Thinking tokens: ${thinking ?? 'unknown'}. ` +
        `Re-measure the budget rather than retrying.`
    )
  }

  const content = message.content.find(b => b.type === 'text')
  if (!content || content.type !== 'text') {
    throw new Error(`CFWS week ${weekNumber} for ${client.name}: no text block in response`)
  }

  const jsonText = extractFirstJsonObject(content.text)
  if (!jsonText) {
    throw new Error(
      `CFWS week ${weekNumber} for ${client.name}: no parseable JSON in text block ` +
        `(stop_reason=${message.stop_reason}, ${content.text.length} chars)`
    )
  }

  const cfwsRaw = JSON.parse(jsonText)
  const cfwsData = stripEmDashes(cfwsRaw)

  // Archive any existing CFWS for this week (in case of regeneration)
  await admin
    .from('cfws')
    .update({ is_archived: true })
    .eq('client_id', client.id)
    .eq('week_number', weekNumber)

  const { error } = await admin.from('cfws').insert({
    client_id: client.id,
    week_number: weekNumber,
    rolling_window_weeks: [weekNumber, ...recentPairs.map(p => p.weekNumber)],
    ...(cfwsData as Record<string, unknown>),
  })

  if (error) {
    throw new Error(`CFWS week ${weekNumber} for ${client.name}: insert failed: ${error.message}`)
  }
}
