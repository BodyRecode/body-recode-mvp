import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { renderMealsIndexed, applyNutritionEdits, validateNutritionEditOps } from '@/lib/nutrition-patch'
import { extractFirstJsonObject } from '@/lib/extract-json'

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

const EDIT_SYSTEM = `You surgically edit a DRAFT Body Recode NUTRITION plan on behalf of a COACH. Apply ONLY the change the coach asks for. Do NOT rewrite or re-balance anything they did not name — everything you don't touch stays exactly as it is.

You return a minimal set of operations that target exact indices from the MEALS list you are given. Whenever you add or change a food, supply its macros (protein_g, carb_g, fat_g) for the portion implied — the server recomputes every meal and the day total from the foods, so accurate per-food macros matter.
- update_food: change one food (meal_index, food_index; "changes" = name and/or protein_g/carb_g/fat_g).
- add_food: add a food to a meal (meal_index; optional position; "food" = {name, protein_g, carb_g, fat_g}).
- remove_food: remove one food (meal_index, food_index).
- remove_meal: remove a whole meal (meal_index).
- add_meal: add a whole meal ("meal" = {meal_name, foods:[{name, protein_g, carb_g, fat_g}, ...]}).

Hard rules:
- Change ONLY what is named. "Swap the oats for berries" = one update_food (name + macros). "Drop to 3 meals" = remove the least-essential meal(s). Keep each proposal to ONE coherent change.
- Doctrine still binds: keep the change consistent with the plan's protein anchor and the client's dietary restrictions/allergies. A change that would blow the protein anchor, drop below the calorie floor, or violate a stated restriction should be flagged — return an empty operations array and explain the concern in summary, or pick portions/meals that hold the targets.
- If the target is ambiguous or you cannot find it, return an empty operations array and say what you need.
- summary: one or two plain sentences the coach reads before approving. Name exactly what will change (and the macro effect), and confirm the rest is untouched. No em dashes.

Return ONLY JSON, no prose:
{"operations":[{"kind":"update_food","meal_index":0,"food_index":1,"changes":{"name":"Mixed berries","protein_g":1,"carb_g":18,"fat_g":0}}],"summary":"..."}`

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
          system: EDIT_SYSTEM,
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
