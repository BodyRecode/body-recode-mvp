import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { renderMealsIndexed, applyNutritionEdits, validateNutritionEditOps } from '@/lib/nutrition-patch'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { withTemporalContext } from '@/lib/temporal-context'
import { NUTRITION_EDIT_SYSTEM_DRAFT } from '@/lib/nutrition-edit-prompt'

export const maxDuration = 120

// Coach Co-Pilot — Phase 5 surgical NUTRITION-draft edits (mirror of edit-draft).
//   action=propose → model returns a MINIMAL structured patch + a plain summary.
//   action=apply   → the validated patch is applied deterministically to the
//     draft's meals, macros are recomputed from the foods, and saved. Only ever
//     touches a DRAFT nutrition plan, never the live one.

/* eslint-disable @typescript-eslint/no-explicit-any */

async function loadLatestDraft(admin: any, clientId: string) {
  const { data } = await admin
    .from('nutrition_plans')
    .select('id, plan_name, entry_state, carb_demand_level, protein_anchor_g, meals, status')
    .eq('client_id', clientId)
    .eq('status', 'draft')
    .order('generated_at', { ascending: false })
    .limit(1)
  return data?.[0] ?? null
}


export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail(user.email)) return NextResponse.json({ error: 'Coach access only' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const action = body?.action

  const admin = createAdminClient()
  const draft = await loadLatestDraft(admin, clientId)
  if (!draft) {
    return NextResponse.json({ error: 'No draft nutrition plan to refine. Draft one first, then refine it.' }, { status: 404 })
  }

  // ── Propose ────────────────────────────────────────────────────────────
  if (action === 'propose') {
    const instruction = String(body?.instruction ?? '').trim()
    if (!instruction) return NextResponse.json({ error: 'Empty instruction' }, { status: 400 })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 3 })
    const userContent = `DRAFT NUTRITION PLAN: ${draft.plan_name} (entry state ${draft.entry_state}, carb demand ${draft.carb_demand_level}, protein anchor ${draft.protein_anchor_g}g)

MEALS (indexed — use these exact indices):
${renderMealsIndexed(draft.meals)}

COACH INSTRUCTION:
${instruction}

Return ONLY the JSON described in your instructions.`

    let parsed: any = null
    let lastErr = 'unknown error'
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const resp = await anthropic.messages.create({
          model: 'claude-sonnet-5',
          max_tokens: 1500,
          system: withTemporalContext(NUTRITION_EDIT_SYSTEM_DRAFT),
          messages: [{ role: 'user', content: userContent }],
        })
        const block = resp.content.find(b => b.type === 'text')
        const text = block && block.type === 'text' ? block.text : ''
        const json = extractFirstJsonObject(text)
        if (json) { parsed = JSON.parse(json); break }
        lastErr = `no JSON in response (stop_reason=${resp.stop_reason})`
      } catch (err) {
        lastErr = err instanceof Error ? err.message : String(err)
        console.error(`[copilot edit-nutrition] propose attempt ${attempt}/3:`, lastErr)
      }
    }
    if (!parsed) {
      return NextResponse.json({ error: `Could not work out the edit (${lastErr}). Try rephrasing.` }, { status: 502 })
    }

    const operations = validateNutritionEditOps(parsed.operations)
    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : ''
    return NextResponse.json({ operations, summary })
  }

  // ── Apply ──────────────────────────────────────────────────────────────
  if (action === 'apply') {
    const ops = validateNutritionEditOps(body?.operations)
    if (ops.length === 0) return NextResponse.json({ error: 'No valid changes to apply' }, { status: 400 })

    const { meals, calorieBand, applied, missed } = applyNutritionEdits(draft.meals, ops)
    if (applied.length === 0) {
      return NextResponse.json({ error: missed[0] ?? 'Nothing could be applied.' }, { status: 422 })
    }

    const update: any = { meals }
    if (calorieBand != null) update.estimated_calorie_band = calorieBand

    const { error } = await admin.from('nutrition_plans').update(update).eq('id', draft.id).eq('status', 'draft')
    if (error) {
      console.error('[copilot edit-nutrition] save failed:', error.message)
      return NextResponse.json({ error: `Could not save the change: ${error.message}` }, { status: 500 })
    }
    return NextResponse.json({ ok: true, applied, missed, plan_name: draft.plan_name })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
