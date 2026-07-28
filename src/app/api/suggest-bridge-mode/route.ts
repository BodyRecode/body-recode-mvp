import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { detectAppetiteSuppression } from '@/lib/nutrition-validation'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { withTemporalContext } from '@/lib/temporal-context'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 3 })

/**
 * Suggest Bridge Mode (Transitional Override) Inputs
 *
 * Coach-side helper that pre-fills the bridge mode fields with sensible
 * defaults drawn from the client's actual data:
 *   - medications (appetite-suppressing meds → bridge needed)
 *   - baseline bodyweight (→ standard bodyweight floor for comparison)
 *   - latest 2 weekly check-ins (extract evidence of low intake / appetite
 *     struggle / meal skip patterns)
 *
 * Returns { suggested_floor_kcal, suggested_justification, evidence_summary }.
 * Coach reviews, accepts, or edits. A licensee coach who has never written
 * a clinical justification before still ships a defensible plan.
 *
 * Body: { client_id: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { client_id } = await request.json()
  if (!client_id) return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })

  const admin = createAdminClient()

  const [
    { data: client },
    { data: baseline },
    { data: checkins },
  ] = await Promise.all([
    admin.from('clients').select('id, name, medications').eq('id', client_id).maybeSingle(),
    admin.from('baselines').select('bodyweight_kg').eq('client_id', client_id).order('captured_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('weekly_checkins').select('week_number, form_type, submitted_at, responses').eq('client_id', client_id).order('submitted_at', { ascending: false }).limit(3),
  ])

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const bw = baseline?.bodyweight_kg ?? null
  const suppression = detectAppetiteSuppression(client.medications)

  // Heuristic bodyweight-derived floor: protein 1.7 g/kg × 4 + carb 1.5 g/kg × 4
  // + fat 0.7 g/kg × 9. Matches the validator's safety floors for a
  // stabilisation client. Used as the upper anchor — "this is what the
  // standard floor would be."
  const standardFloorKcal = bw ? Math.round((bw * 1.7 * 4) + (bw * 1.5 * 4) + (bw * 0.7 * 9)) : null
  const standardProteinAnchor = bw ? Math.round(bw * 1.7) : null

  // Default suggested floor: 1500 kcal floor when we have appetite suppression
  // signals but no explicit intake data — clinically defensible bridge above
  // most documented chronic-under-eater intakes (~1,200-1,400 typical) while
  // staying meaningfully below the standard floor. Tuned in the LLM step below.
  let suggestedFloor = 1500

  // Light heuristic on the floor before the LLM: if no suppression detected,
  // bridge mode probably shouldn't be on at all — surface that as the reason.
  // If suppression detected and bodyweight known, set the heuristic to
  // ~midpoint between 1,400 (typical chronic-under-eater intake) and the
  // standard floor.
  if (suppression.any && standardFloorKcal) {
    suggestedFloor = Math.max(1200, Math.min(standardFloorKcal - 200, Math.round((1400 + standardFloorKcal) / 2)))
    // Round to nearest 50 for clean numbers.
    suggestedFloor = Math.round(suggestedFloor / 50) * 50
  }

  // Scaled protein anchor for the bridge plan. Without this, the engine
  // produces plans where protein alone consumes most of the bridge kcal
  // budget, forcing the model to overshoot the ceiling. Two-clamp logic:
  //
  //   bridgeCeiling = 1.3 g/kg  (above 1.2 g/kg muscle-preservation
  //                              minimum but below 1.5 g/kg standard;
  //                              lets carbs+fat fit the bridge band)
  //   bridgeFloor   = 1.2 g/kg  (don't go below this — muscle loss risk)
  //
  // Suggested anchor = min(bridgeCeiling, kcal-ratio-scaled) clamped to
  // ≥ bridgeFloor. This keeps the anchor inside the kcal budget without
  // dropping below the safe minimum.
  let suggestedProteinAnchor: number | null = null
  if (bw && standardFloorKcal && standardProteinAnchor) {
    const ratio = suggestedFloor / standardFloorKcal
    const scaled = Math.round(standardProteinAnchor * ratio)
    const muscleFloor = Math.round(bw * 1.2)
    const bridgeCeiling = Math.round(bw * 1.3)
    suggestedProteinAnchor = Math.max(muscleFloor, Math.min(bridgeCeiling, scaled))
    // Round to nearest 5g.
    suggestedProteinAnchor = Math.round(suggestedProteinAnchor / 5) * 5
  }

  // Build context block for the LLM justification drafter.
  const contextLines: string[] = []
  contextLines.push(`CLIENT: ${client.name}`)
  if (bw) contextLines.push(`Bodyweight: ${bw}kg`)
  if (standardFloorKcal) contextLines.push(`Standard bodyweight-derived calorie floor (would apply without override): ~${standardFloorKcal} kcal`)
  contextLines.push(`Suggested transitional floor: ${suggestedFloor} kcal`)
  contextLines.push('')
  contextLines.push('MEDICATIONS:')
  contextLines.push(client.medications || '(none recorded)')
  contextLines.push('')
  contextLines.push(`Appetite-suppression detection: stimulant=${suppression.has_stimulant}, GLP-1=${suppression.has_glp1}, serotonergic=${suppression.has_serotonergic}`)
  contextLines.push('')
  contextLines.push('RECENT WEEKLY CHECK-INS (most recent first):')
  if (!checkins || checkins.length === 0) {
    contextLines.push('(no check-ins on file)')
  } else {
    for (const c of checkins) {
      contextLines.push(`\nWeek ${c.week_number} (form ${c.form_type}) — submitted ${c.submitted_at?.slice(0, 10)}:`)
      const r = c.responses as Record<string, unknown>
      for (const [k, v] of Object.entries(r ?? {})) {
        if (typeof v === 'string' && v.trim().length > 0) {
          contextLines.push(`  ${k}: ${v}`)
        }
      }
    }
  }

  const systemPrompt = `You are drafting a clinical justification for a coach enabling "bridge mode" on a client's nutrition plan. Bridge mode prescribes a calorie floor BELOW the bodyweight-derived standard, with explicit coach reasoning required.

Your job: synthesize the available evidence (medications, bodyweight, recent check-ins) into one paragraph that defends the bridge floor. Reference SPECIFIC evidence from the check-ins (use direct quotes where possible). Name the medications driving appetite suppression. State the standard floor and the bridge floor explicitly. End with a Week-4 reassessment commitment.

Style: clinical but plain language. ~80-120 words. No headers, no markdown. One paragraph.

Output JSON only:
{
  "justification": "string — the paragraph",
  "evidence_summary": "string — one sentence summarising what evidence you found, for the coach's reference"
}`

  let suggestedJustification = ''
  let evidenceSummary = ''

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: withTemporalContext(systemPrompt),
      messages: [{ role: 'user', content: contextLines.join('\n') + '\n\nDraft the justification. JSON only.' }],
    })
    const content = message.content[0]
    if (content.type === 'text') {
      const m = extractFirstJsonObject(content.text)
      if (m) {
        const parsed = JSON.parse(m)
        suggestedJustification = String(parsed.justification || '').trim()
        evidenceSummary = String(parsed.evidence_summary || '').trim()
      }
    }
  } catch (err) {
    console.warn('[suggest-bridge-mode] AI draft failed, falling back to template:', err)
  }

  // Template fallback if the LLM call failed or returned empty.
  if (!suggestedJustification) {
    const classes = [
      suppression.has_stimulant && 'stimulant',
      suppression.has_glp1 && 'GLP-1 agonist',
      suppression.has_serotonergic && 'SSRI/SNRI',
    ].filter(Boolean).join(' + ') || 'medication-related'
    suggestedJustification = `Client is on ${classes} medication, which materially suppresses appetite. ${standardFloorKcal ? `The standard bodyweight-derived floor (~${standardFloorKcal} kcal) is not physically executable at current capacity.` : 'Current intake is below the standard floor.'} Bridge mode at ${suggestedFloor} kcal provides an achievable stretch above documented intake while preserving the protein anchor and meal-rhythm targets. Reassess at Week 4 check-in to remove override and apply standard prescription.`
    evidenceSummary = 'Fallback template (AI draft unavailable). Edit to add specific check-in evidence.'
  }

  return NextResponse.json({
    suggested_floor_kcal: suggestedFloor,
    suggested_justification: suggestedJustification,
    suggested_protein_anchor_g: suggestedProteinAnchor,
    standard_floor_kcal: standardFloorKcal,
    standard_protein_anchor_g: standardProteinAnchor,
    evidence_summary: evidenceSummary,
    suppression,
  })
}
