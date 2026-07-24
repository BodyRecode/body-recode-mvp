import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { renderSessionsIndexed, applyProgramEdits, validateEditOps } from '@/lib/program-patch'
import { extractFirstJsonObject } from '@/lib/extract-json'

export const maxDuration = 120

// Coach Co-Pilot — Phase 3 surgical draft edits.
//   action=propose → the model returns a MINIMAL structured patch + a plain
//     summary. Read-only (saves nothing); the coach approves first.
//   action=apply   → the validated patch is applied DETERMINISTICALLY to the
//     draft's sessions (server-side, in program-patch.ts) and saved. Only ever
//     touches a DRAFT (status=draft), never a live program.

/* eslint-disable @typescript-eslint/no-explicit-any */

async function loadLatestDraft(admin: any, clientId: string) {
  const { data } = await admin
    .from('programs')
    .select('id, block_name, progression_phase, training_goal, sessions, client_note, status')
    .eq('client_id', clientId)
    .eq('status', 'draft')
    .order('generated_at', { ascending: false })
    .limit(1)
  return data?.[0] ?? null
}

const EDIT_SYSTEM = `You surgically edit a DRAFT Body Recode training program on behalf of a COACH. Apply ONLY the change the coach asks for. Do NOT rewrite, re-balance, or "improve" anything they did not name — everything you don't touch must stay exactly as it is.

You return a minimal set of operations that target exact indices from the SESSIONS list you are given:
- update_exercise: change one exercise. Target it with day_index, block_index, exercise_index (the numbers in the indexed list). In "changes", include ONLY the fields that actually change (exercise_name, sets, reps, rpe, rest, notes). To swap an exercise, set exercise_name; only change rpe/reps/sets as well if the coach asked or the swap clearly requires it.
- edit_client_note: replace the client-facing note text (note_text).

Hard rules:
- Change ONLY what is named. "Drop the squat to 3 sets" = one update_exercise with changes {"sets":3}. Nothing else.
- Do NOT invent or reorder days, blocks, or exercises, and do NOT add or remove exercises (not supported yet). If that is what they need, return an empty operations array and say so in summary.
- Doctrine still binds: do NOT make an edit that breaks the block's phase (e.g. adding heavy/tempo/max intensity to a Restoration block), a readiness gate, a stated injury constraint, or safety. If the ask would break doctrine, return an empty operations array and explain the concern in summary.
- If the target is ambiguous or you cannot find it, return an empty operations array and say what you need.
- summary: one or two plain sentences the coach reads before approving. Name exactly what will change, and confirm the rest of the plan is untouched. No em dashes.

Return ONLY JSON, no prose:
{"operations":[{"kind":"update_exercise","day_index":0,"block_index":0,"exercise_index":1,"changes":{"sets":3}}],"summary":"..."}`

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
    return NextResponse.json({ error: 'No draft program to refine. Draft one first, then refine it.' }, { status: 404 })
  }

  // ── Propose ────────────────────────────────────────────────────────────
  if (action === 'propose') {
    const instruction = String(body?.instruction ?? '').trim()
    if (!instruction) return NextResponse.json({ error: 'Empty instruction' }, { status: 400 })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 3 })
    const userContent = `DRAFT PROGRAM: ${draft.block_name} (${draft.progression_phase}, ${draft.training_goal})

SESSIONS (indexed — use these exact indices):
${renderSessionsIndexed(draft.sessions)}

CURRENT CLIENT-FACING NOTE:
${draft.client_note ?? '(none)'}

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
        console.error(`[copilot edit-draft] propose attempt ${attempt}/3:`, lastErr)
      }
    }
    if (!parsed) {
      return NextResponse.json({ error: `Could not work out the edit (${lastErr}). Try rephrasing.` }, { status: 502 })
    }

    const operations = validateEditOps(parsed.operations)
    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : ''
    // operations may be legitimately empty (ambiguous / refused on doctrine) —
    // the panel shows the summary as a plain message with no Apply button.
    return NextResponse.json({ operations, summary })
  }

  // ── Apply ──────────────────────────────────────────────────────────────
  if (action === 'apply') {
    const ops = validateEditOps(body?.operations)
    if (ops.length === 0) return NextResponse.json({ error: 'No valid changes to apply' }, { status: 400 })

    const { sessions, clientNoteOverride, applied, missed } = applyProgramEdits(draft.sessions, ops)
    if (applied.length === 0) {
      return NextResponse.json({ error: missed[0] ?? 'Nothing could be applied.' }, { status: 422 })
    }

    const update: any = { sessions }
    if (clientNoteOverride != null) update.client_note = clientNoteOverride

    const { error } = await admin.from('programs').update(update).eq('id', draft.id).eq('status', 'draft')
    if (error) {
      console.error('[copilot edit-draft] save failed:', error.message)
      return NextResponse.json({ error: `Could not save the change: ${error.message}` }, { status: 500 })
    }
    return NextResponse.json({ ok: true, applied, missed, block_name: draft.block_name })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
