import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { buildDailyRoutineSystemPrompt, buildDailyRoutineUserPrompt, DailyRoutineClientData } from '@/lib/daily-routine-prompt'
import { validateDailyRoutine, summariseIssuesForRetry } from '@/lib/daily-routine-validation'
import { readHormonalLoad } from '@/lib/training-doctrine'
import { temporalContext } from '@/lib/temporal-context'
import { AI_MODELS } from '@/lib/ai-models'

export const maxDuration = 180

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 3 })

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const SONNET_MODEL = 'claude-sonnet-4-6'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isCoachEmail((user.email ?? '').toLowerCase())) {
    return NextResponse.json({ error: 'Coach only' }, { status: 403 })
  }

  const { client_id } = await request.json()
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  return generateDailyRoutineInternal(client_id)
}

export async function generateDailyRoutineInternal(clientId: string): Promise<NextResponse> {
  const admin = createAdminClient()

  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('id, name, medications, body_state')
    .eq('id', clientId)
    .maybeSingle()

  if (clientError || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const { data: intake } = await admin
    .from('intakes')
    .select('gender, date_of_birth, primary_goal, sleep_responses, stress_responses, schedule_responses, training_days_available')
    .eq('client_id', clientId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const age = intake?.date_of_birth ? calculateAge(intake.date_of_birth) : null
  const hormonalLoad = readHormonalLoad(client.medications)
  const trainingDays = Array.isArray(intake?.training_days_available) ? intake.training_days_available.length : null

  const bodyStateNormalized = normaliseBodyState(client.body_state)

  const healthFlags: string[] = []
  const medsLower = (client.medications || '').toLowerCase()
  if (/\b(cardiac|heart\s+condition|arrhythmia|afib|angina|heart\s+attack|myocardial|beta.?blocker|ace.?inhibitor)\b/i.test(medsLower)) {
    healthFlags.push('cardiac')
  }
  if (/\b(high\s+blood\s+pressure|hypertension|bp\s+med)\b/i.test(medsLower)) {
    healthFlags.push('hypertension')
  }

  const data: DailyRoutineClientData = {
    name: (client.name || '').split(' ')[0] || 'Client',
    gender: normaliseGender(intake?.gender),
    age,
    body_state: bodyStateNormalized,
    hormonal_load: hormonalLoad,
    training_days_per_week: trainingDays,
    medications_summary: client.medications && client.medications.trim().length > 0 ? client.medications.trim().slice(0, 1000) : null,
    health_flags: healthFlags,
    intake_highlights: {
      primary_goal: intake?.primary_goal ? String(intake.primary_goal).slice(0, 400) : null,
      sleep_quality: extractSummary(intake?.sleep_responses),
      stress_level: extractSummary(intake?.stress_responses),
      work_schedule: extractSummary(intake?.schedule_responses),
      current_morning_habits: null,
      current_evening_habits: null,
    },
    latest_signals: null,
  }

  const systemPrompt = buildDailyRoutineSystemPrompt()
  const userPrompt = buildDailyRoutineUserPrompt(data)

  const cardiacFlag = healthFlags.includes('cardiac') || healthFlags.includes('hypertension')

  async function callModel(modelId: string, correctionNote: string | null): Promise<Record<string, unknown>> {
    const finalUserPrompt = correctionNote
      ? `${userPrompt}\n\n═══════════════════════════════════════\nVALIDATION CORRECTION REQUIRED\n═══════════════════════════════════════\n${correctionNote}\n\nRegenerate the JSON correcting every issue above.`
      : userPrompt
    const message = await anthropic.messages.create({
      model: modelId,
      max_tokens: 4000,
      system: [
        // Stable prompt stays cached; the date is volatile so it sits AFTER the
        // breakpoint, otherwise the cache would be invalidated every day.
        { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: temporalContext() },
      ],
      messages: [{ role: 'user', content: finalUserPrompt }],
    })
    const content = (message.content.find(b => b.type === 'text') ?? message.content[0])
    if (content.type !== 'text') throw new Error('Unexpected AI response')
    const jsonText = extractFirstJsonObject(content.text)
    if (jsonText) return JSON.parse(jsonText)
    const trimmed = content.text.trim()
    if (trimmed.startsWith('{')) {
      try { return JSON.parse(trimmed) } catch { /* fall through */ }
    }
    const preview = content.text.slice(0, 300).replace(/\s+/g, ' ')
    throw new Error(`Could not parse daily routine output from ${modelId}. Preview: "${preview}"`)
  }

  function runValidate(raw: Record<string, unknown>) {
    return validateDailyRoutine({
      routine: raw,
      client_age: age,
      client_has_cardiac_flag: cardiacFlag,
      client_body_state: bodyStateNormalized,
    })
  }

  let parsed: Record<string, unknown>
  let validation: ReturnType<typeof runValidate>

  try {
    parsed = await callModel(HAIKU_MODEL, null)
    validation = runValidate(parsed)

    if (!validation.ok) {
      console.warn('[generate-daily-routine] Haiku attempt 1 failed validation:', validation.issues.map(i => i.code))
      parsed = await callModel(HAIKU_MODEL, summariseIssuesForRetry(validation.issues))
      validation = runValidate(parsed)
    }

    if (!validation.ok) {
      console.warn('[generate-daily-routine] Haiku attempt 2 failed, escalating to Sonnet')
      parsed = await callModel(SONNET_MODEL, summariseIssuesForRetry(validation.issues))
      validation = runValidate(parsed)
    }

    if (!validation.ok || !validation.routine) {
      return NextResponse.json({
        error: 'Could not generate a valid routine after retries',
        issues: validation.issues,
      }, { status: 502 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generate-daily-routine] Generation error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const { error: writeError } = await admin
    .from('clients')
    .update({
      daily_routine_draft: validation.routine,
      daily_routine_generated_at: new Date().toISOString(),
      daily_routine_generation_rationale: validation.rationale,
    })
    .eq('id', clientId)

  if (writeError) {
    console.error('[generate-daily-routine] Write error:', writeError)
    return NextResponse.json({ error: 'Could not save draft' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    routine: validation.routine,
    rationale: validation.rationale,
    warnings: validation.issues.filter(i => i.severity === 'strip'),
  })
}

function normaliseBodyState(raw: string | null | undefined): 'remediation' | 'optimisation' | 'post_optimisation' | null {
  if (!raw) return null
  const s = String(raw).toLowerCase().trim()
  if (s === 'remediation' || s === 'depleted') return 'remediation'
  if (s === 'optimisation' || s === 'optimization' || s === 'transitioning') return 'optimisation'
  if (s === 'post_optimisation' || s === 'post_optimization' || s === 'ready') return 'post_optimisation'
  return null
}

function normaliseGender(raw: string | null | undefined): 'male' | 'female' | 'other' | null {
  if (!raw) return null
  const s = String(raw).toLowerCase().trim()
  if (s === 'male' || s === 'm') return 'male'
  if (s === 'female' || s === 'f') return 'female'
  return 'other'
}

function calculateAge(dob: string): number | null {
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age > 0 && age < 130 ? age : null
}

function extractSummary(responses: unknown): string | null {
  if (!responses) return null
  if (typeof responses === 'string') return responses.slice(0, 300)
  if (typeof responses === 'object') {
    const values = Object.values(responses as Record<string, unknown>)
      .filter(v => typeof v === 'string' && v.trim().length > 0)
      .slice(0, 3) as string[]
    if (values.length === 0) return null
    return values.join(' | ').slice(0, 400)
  }
  return null
}
