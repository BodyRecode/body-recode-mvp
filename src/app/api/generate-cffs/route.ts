import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import {
  buildCFFSSystemPrompt,
  buildCFFSUserPrompt,
  type CFFSBaselineContext,
} from '@/lib/cffs-prompt'

export const maxDuration = 300

// Anthropic vision accepts up to 5MB per image. Our baseline pipeline already
// compresses to 1600px / 0.82 JPEG (~400KB) so we never approach the cap, but
// the timeout keeps a stuck S3 fetch from blocking the whole CFFS generation.
const IMAGE_FETCH_TIMEOUT_MS = 15_000
type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

async function fetchImageAsBase64(
  url: string,
): Promise<{ base64: string; media_type: ImageMediaType } | null> {
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(t)
    if (!res.ok) {
      console.warn(`[CFFS] baseline photo fetch failed: ${res.status} ${url.slice(0, 80)}…`)
      return null
    }
    const ct = (res.headers.get('content-type') ?? 'image/jpeg').toLowerCase()
    const media_type: ImageMediaType =
      ct.includes('png')  ? 'image/png'  :
      ct.includes('gif')  ? 'image/gif'  :
      ct.includes('webp') ? 'image/webp' :
      'image/jpeg'
    const buf = Buffer.from(await res.arrayBuffer())
    return { base64: buf.toString('base64'), media_type }
  } catch (err) {
    console.warn('[CFFS] baseline photo fetch threw:', err instanceof Error ? err.message : err)
    return null
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { intake_id, client_id } = await request.json()

  // Fetch intake + client medications + latest baseline (measurements + photo
  // URLs). Medications context is critical for pattern interpretation
  // (HR-blunting drugs, mood-flattening drugs, etc.). Baseline photos feed
  // the Fat Map's Spatial Patterning pillar — they are evidence, not
  // conclusion, and the prompt's VISUAL SIGNAL INTEGRATION rules govern how
  // Claude weighs them.
  const [
    { data: intake, error: intakeError },
    { data: clientRow },
    { data: baselineRow },
  ] = await Promise.all([
    supabase.from('intakes').select('*').eq('id', intake_id).single(),
    supabase.from('clients').select('medications').eq('id', client_id).maybeSingle(),
    supabase
      .from('baselines')
      .select('bodyweight_kg, waist_cm, hips_cm, chest_cm, captured_at, photo_front_url, photo_side_url, photo_back_url')
      .eq('client_id', client_id)
      .order('captured_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (intakeError || !intake) {
    return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
  }

  // Download baseline photos in parallel. Each can fail independently without
  // killing the whole CFFS — we fall back to the text-only path and the
  // prompt's VISUAL SIGNAL INTEGRATION rules tell Claude to note the absence.
  const photoEntries: Array<{ label: 'front' | 'side' | 'back'; url: string | null }> = [
    { label: 'front', url: baselineRow?.photo_front_url ?? null },
    { label: 'side',  url: baselineRow?.photo_side_url  ?? null },
    { label: 'back',  url: baselineRow?.photo_back_url  ?? null },
  ]
  const fetchedPhotos = await Promise.all(
    photoEntries.map(async ({ label, url }) => {
      if (!url) return { label, image: null as Awaited<ReturnType<typeof fetchImageAsBase64>> }
      return { label, image: await fetchImageAsBase64(url) }
    })
  )
  const availablePhotos = fetchedPhotos.filter(p => p.image !== null) as Array<{
    label: 'front' | 'side' | 'back'
    image: NonNullable<Awaited<ReturnType<typeof fetchImageAsBase64>>>
  }>

  const baselineContext: CFFSBaselineContext | null = baselineRow
    ? {
        bodyweight_kg: baselineRow.bodyweight_kg ?? null,
        waist_cm: baselineRow.waist_cm ?? null,
        hips_cm: baselineRow.hips_cm ?? null,
        chest_cm: baselineRow.chest_cm ?? null,
        captured_at: baselineRow.captured_at ?? null,
        has_photos: availablePhotos.length > 0,
      }
    : null

  console.log(
    `[CFFS] client=${String(client_id).slice(0, 8)} baseline=${!!baselineRow} photos_attached=${availablePhotos.length}/3`
  )

  // Build the user content. Photos go first (Anthropic recommends image
  // blocks before the text that references them), each labelled by a short
  // text block so Claude knows which view it's looking at. The full text
  // prompt comes last and includes all the structural context.
  const labelMap = {
    front: 'BASELINE PHOTOS - 1 of 3 - Front view (relaxed stance):',
    side:  'BASELINE PHOTOS - 2 of 3 - Side view (natural posture):',
    back:  'BASELINE PHOTOS - 3 of 3 - Back view (relaxed arms):',
  } as const

  const userContent: Anthropic.Messages.ContentBlockParam[] = []
  for (const { label, image } of availablePhotos) {
    userContent.push({ type: 'text', text: labelMap[label] })
    userContent.push({
      type: 'image',
      source: { type: 'base64', media_type: image.media_type, data: image.base64 },
    })
  }
  userContent.push({
    type: 'text',
    text: buildCFFSUserPrompt(intake, clientRow?.medications ?? null, baselineContext),
  })

  // Generate CFFS via Claude
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system: buildCFFSSystemPrompt(),
      messages: [{ role: 'user', content: userContent }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Anthropic API error:', msg)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 })
  }

  console.log('Claude raw response:', content.text.slice(0, 200))

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return NextResponse.json({ error: `Could not parse CFFS — AI returned: ${content.text.slice(0, 100)}` }, { status: 500 })
  }

  let cffsData
  try {
    cffsData = JSON.parse(jsonMatch[0])
  } catch (err) {
    return NextResponse.json({ error: `JSON parse failed: ${jsonMatch[0].slice(0, 100)}` }, { status: 500 })
  }

  // Strip em dashes from all generated text fields
  cffsData = stripEmDashes(cffsData)

  // Doctrinal guard: reassessment is a TEMPORAL construct per Signal Monitoring v1.0.
  // It can only be set true after longitudinal data exists (CFWS rows, completed
  // blocks, sustained instability, 12-week cap, etc.). At intake-time CFFS
  // generation there is no trajectory to evaluate, so the field must be false.
  // The LLM was previously asked to set this in the JSON schema and would default
  // to true on any "Partially Resolved" classification — which is most clients
  // in Remediation. We override server-side regardless of what the LLM produced.
  ;(cffsData as Record<string, unknown>).reassessment_flagged = false

  // Archive any existing CFFS for this client
  await supabase
    .from('cffs')
    .update({ is_archived: true })
    .eq('client_id', client_id)
    .eq('is_archived', false)

  // Save CFFS to database
  const { data: cffs, error: cffsError } = await supabase
    .from('cffs')
    .insert({ client_id, intake_id, ...(cffsData as Record<string, unknown>) })
    .select()
    .single()

  if (cffsError) {
    return NextResponse.json({ error: 'Failed to save CFFS' }, { status: 500 })
  }

  return NextResponse.json({ cffs })
}

function stripEmDashes(obj: unknown): unknown {
  if (typeof obj === 'string') return obj.replace(/\s*—\s*/g, ', ')
  if (Array.isArray(obj)) return obj.map(stripEmDashes)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, stripEmDashes(v)]))
  }
  return obj
}
