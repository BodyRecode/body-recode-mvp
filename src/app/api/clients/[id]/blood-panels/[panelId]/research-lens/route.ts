import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { stripEmDashes } from '@/lib/medications-analysis-prompt'
import {
  buildResearchLensCore,
  buildLensProseSystemPrompt,
  buildLensProseUserPrompt,
  RESEARCH_LENS_DISCLAIMER,
  type FramedPattern,
} from '@/lib/research-lens'
import type { BloodMarker } from '@/lib/blood-panel-prompt'
import { withTemporalContext } from '@/lib/temporal-context'
import { AI_MODELS } from '@/lib/ai-models'

/**
 * Research Lens — coach/admin-ONLY contextual reading over one blood panel.
 * Read-only on the panel, ephemeral (persists nothing), never touches
 * blood_panels.reading/analysis/approved_for_plan or the CFFS. Deterministic
 * detection (research-lens.ts) + a Haiku prose layer that only frames the
 * already-detected patterns. See research-lens-prd.md.
 */
export const maxDuration = 120

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; panelId: string }> }
) {
  const { id, panelId } = await params

  // Auth gate: logged in AND a coach. This output never reaches a client.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail(user.email)) return NextResponse.json({ error: 'Coach access only' }, { status: 403 })

  const admin = createAdminClient()

  const { data: panel } = await admin
    .from('blood_panels')
    .select('id, markers, collected_on, lab_name')
    .eq('id', panelId)
    .eq('client_id', id)
    .maybeSingle()
  if (!panel) return NextResponse.json({ error: 'Blood panel not found' }, { status: 404 })

  const markers = (panel.markers ?? []) as BloodMarker[]
  // The deterministic core: parse, resolve, derive, detect.
  const core = buildResearchLensCore(markers)

  // No patterns fired -> return the deterministic shell, skip the model.
  if (core.patterns.length === 0) {
    return NextResponse.json({
      panel_id: panelId,
      collected_on: panel.collected_on ?? null,
      lab_name: panel.lab_name ?? null,
      ...core,
      framed_patterns: [] as FramedPattern[],
      note: 'No contextual patterns assessable from these markers.',
      disclaimer: RESEARCH_LENS_DISCLAIMER,
    })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 3 })

  let framed: FramedPattern[] = []
  try {
    const message = await anthropic.messages.create({
      model: AI_MODELS.clinical,
      max_tokens: 3000,
      system: withTemporalContext(buildLensProseSystemPrompt()),
      messages: [{ role: 'user', content: buildLensProseUserPrompt(core) }],
    })
    const content = message.content[0]
    if (content && content.type === 'text') {
      const jsonText = extractFirstJsonObject(content.text)
      if (jsonText) {
        const parsed = JSON.parse(jsonText) as { patterns?: Array<Partial<FramedPattern> & { id: string }> }
        const byId = new Map(core.patterns.map(p => [p.id, p]))
        framed = (parsed.patterns ?? [])
          .filter(p => byId.has(p.id as FramedPattern['id'])) // never let the model invent a pattern
          .map(p => {
            const det = byId.get(p.id as FramedPattern['id'])!
            return stripEmDashes<FramedPattern>({
              id: det.id,
              label: det.label,
              confidence: det.confidence,
              observation: String(p.observation ?? '').trim(),
              whatWouldClarify: Array.isArray(p.whatWouldClarify) ? p.whatWouldClarify.map(String) : [],
              clinicianQuestion: String(p.clinicianQuestion ?? '').trim(),
              caveat: String(p.caveat ?? '').trim(),
            })
          })
      }
    }
  } catch (err) {
    console.error('Research Lens prose error:', err instanceof Error ? err.message : err)
    // Degrade gracefully: return deterministic patterns without prose rather than failing.
  }

  return NextResponse.json({
    panel_id: panelId,
    collected_on: panel.collected_on ?? null,
    lab_name: panel.lab_name ?? null,
    inputs: core.inputs,
    derived: core.derived,
    patterns: core.patterns,
    framed_patterns: framed,
    unresolved_markers: core.unresolved_markers,
    missing_for_patterns: core.missing_for_patterns,
    disclaimer: RESEARCH_LENS_DISCLAIMER,
  })
}
