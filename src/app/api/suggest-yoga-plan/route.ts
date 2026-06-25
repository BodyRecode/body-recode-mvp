import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { buildYogaPlanSystemPrompt, buildYogaPlanUserPrompt } from '@/lib/yoga-plan-prompt'

// Suggest a yoga macro arc and store it as a training_plan + plan_blocks.
// Yoga semantics: intensity ceiling -> phase_category, focus -> phase_objective.
// Strength enum columns get neutral placeholders (ignored for yoga).
export const maxDuration = 120

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

const ALLOWED = new Set(['restorative', 'gentle', 'moderate', 'strong'])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { client_id, body_state_context = null, coach_guidance = null } = await request.json()
  if (!client_id) return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })

  const admin = createAdminClient()
  const { data: client } = await admin.from('clients').select('name').eq('id', client_id).single()

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      system: buildYogaPlanSystemPrompt(),
      messages: [{
        role: 'user',
        content: buildYogaPlanUserPrompt({
          clientName: client?.name ?? 'your client',
          bodyStateContext: body_state_context,
          coachGuidance: coach_guidance,
        }),
      }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  const content = message.content[0]
  if (content.type !== 'text') return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 })
  const jsonText = extractFirstJsonObject(content.text)
  if (!jsonText) return NextResponse.json({ error: 'Could not parse plan' }, { status: 500 })

  let plan: {
    plan_name?: string; macro_objective?: string
    blocks?: Array<{ block_name?: string; intensity?: string; week_duration?: number; focus?: string; rationale?: string }>
  }
  try { plan = JSON.parse(jsonText) } catch { return NextResponse.json({ error: 'Plan JSON parse failed' }, { status: 500 }) }

  const blocks = (plan.blocks ?? []).filter((b) => b.block_name)
  if (blocks.length === 0) return NextResponse.json({ error: 'No blocks suggested' }, { status: 500 })

  // Replace any existing draft (the active plan stays until this is approved).
  await admin.from('training_plans').delete().eq('client_id', client_id).eq('status', 'draft')

  const { data: tp, error: tpErr } = await admin
    .from('training_plans')
    .insert({ client_id, plan_name: plan.plan_name || 'Yoga Arc', macro_objective: plan.macro_objective ?? null, status: 'draft', is_active: false })
    .select('id')
    .single()
  if (tpErr || !tp) return NextResponse.json({ error: `Failed to save plan: ${tpErr?.message}` }, { status: 500 })

  const rows = blocks.map((b, i) => {
    const intensity = ALLOWED.has(String(b.intensity)) ? String(b.intensity) : 'gentle'
    const weeks = [4, 6, 8].includes(Number(b.week_duration)) ? Number(b.week_duration) : 4
    return {
      plan_id: tp.id,
      client_id,
      block_name: b.block_name!,
      progression_phase: 'restoration', // placeholder (yoga ignores)
      training_goal: 'capacity',        // placeholder
      phase_category: intensity,        // yoga intensity ceiling
      phase_objective: b.focus ?? null, // yoga focus/theme
      week_duration: weeks,
      position: i + 1,
      status: 'planned',
    }
  })
  const { error: blkErr } = await admin.from('plan_blocks').insert(rows)
  if (blkErr) return NextResponse.json({ error: `Failed to save blocks: ${blkErr.message}` }, { status: 500 })

  return NextResponse.json({ ok: true, plan_id: tp.id, blocks: rows.length })
}
