import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildCFFSSystemPrompt,
  buildCFFSUserPrompt,
  type CFFSBaselineContext,
} from '@/lib/cffs-prompt'
import { buildBloodMarkerCFFSSection, type BloodMarker } from '@/lib/blood-panel-prompt'
import { extractFirstJsonObject } from '@/lib/extract-json'

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
  // Auth-gate on the user-bound client (verifies the coach is logged in).
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // All data fetches + writes go through the admin client to bypass RLS,
  // which would otherwise hide intakes / baselines from the coach. Mirrors
  // the pattern in every other generate-* route (program reading,
  // nutrition reading, etc.). Auth gating above is what protects the route.
  const admin = createAdminClient()

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
    { data: bloodPanel },
  ] = await Promise.all([
    admin.from('intakes').select('*').eq('id', intake_id).single(),
    admin.from('clients').select('medications').eq('id', client_id).maybeSingle(),
    admin
      .from('baselines')
      .select('bodyweight_kg, waist_cm, hips_cm, chest_cm, captured_at, photo_front_url, photo_side_url, photo_back_url')
      .eq('client_id', client_id)
      .order('captured_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    // Latest COACH-APPROVED blood panel only. Unapproved panels never touch
    // the plan. This is the coach gate from the Health Markers feature.
    admin
      .from('blood_panels')
      .select('panel_summary, collected_on, markers, analysis')
      .eq('client_id', client_id)
      .eq('approved_for_plan', true)
      .order('approved_at', { ascending: false, nullsFirst: false })
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
  const bloodMarkerSection = buildBloodMarkerCFFSSection(
    bloodPanel
      ? {
          panel_summary: bloodPanel.panel_summary ?? null,
          collected_on: bloodPanel.collected_on ?? null,
          markers: (bloodPanel.markers ?? []) as BloodMarker[],
          combined_picture: (bloodPanel.analysis as { combined_picture?: string } | null)?.combined_picture ?? null,
        }
      : null
  )
  if (bloodMarkerSection) {
    console.log(`[CFFS] client=${String(client_id).slice(0, 8)} approved blood panel attached (${((bloodPanel?.markers ?? []) as unknown[]).length} markers)`)
  }

  userContent.push({
    type: 'text',
    text: buildCFFSUserPrompt(intake, clientRow?.medications ?? null, baselineContext, bloodMarkerSection),
  })

  // Generate CFFS via Claude.
  //
  // Generation + parse retry loop (2026-07-11). Pre-this-date the route was
  // single-shot with a 6000-token cap. For data-rich clients (full 221-question
  // intake + baseline + 3 photos + an approved blood panel) the 14-field CFFS
  // JSON occasionally ran past the cap, truncated mid-object, and
  // extractFirstJsonObject returned null — surfacing to the coach as the opaque
  // "Could not parse CFFS" error that only cleared on a lucky re-click. That is
  // unacceptable for white-label coaches who can't diagnose it. We now:
  //   (a) give the model real output headroom (12k tokens),
  //   (b) detect stop_reason === 'max_tokens' truncation explicitly,
  //   (c) tolerate a missing/empty content block, and
  //   (d) retry up to 3 times before failing with a specific, honest message.
  // The Anthropic SDK's own maxRetries handles transient network/5xx; this loop
  // handles content-level failures (truncation, unparseable output) it can't.
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 5 })

  const MAX_TOKENS = 12000
  let parsed: Record<string, unknown> | null = null
  let lastError = 'unknown error'

  for (let attempt = 1; attempt <= 3; attempt++) {
    let message
    try {
      message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: MAX_TOKENS,
        system: buildCFFSSystemPrompt(),
        messages: [{ role: 'user', content: userContent }],
      })
    } catch (err) {
      lastError = `AI error: ${err instanceof Error ? err.message : String(err)}`
      console.error(`[CFFS] Anthropic API error (attempt ${attempt}/3):`, lastError)
      continue
    }

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      lastError = `AI returned no text content (stop_reason=${message.stop_reason})`
      console.warn(`[CFFS] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    console.log(`[CFFS] attempt ${attempt}/3 raw response (stop_reason=${message.stop_reason}):`, textBlock.text.slice(0, 200))

    // Truncated mid-object: the JSON never closed, so parsing is guaranteed to
    // fail. Retry rather than dumping a garbled half-object into extraction.
    if (message.stop_reason === 'max_tokens') {
      lastError = `AI output was truncated at the ${MAX_TOKENS}-token limit`
      console.warn(`[CFFS] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    const jsonText = extractFirstJsonObject(textBlock.text)
    if (!jsonText) {
      lastError = `Could not locate a JSON object in AI output: ${textBlock.text.slice(0, 200)}`
      console.warn(`[CFFS] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    let candidate: Record<string, unknown>
    try {
      candidate = JSON.parse(jsonText)
    } catch (err) {
      lastError = `JSON parse failed: ${(err as Error).message}`
      console.warn(`[CFFS] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    // Structurally valid but content-empty output (e.g. the model returned `{}`
    // or dropped the core classification) must not be saved as a real CFFS.
    if (typeof candidate.body_state_classification !== 'string' || !candidate.body_state_classification.trim()) {
      lastError = 'AI output missing body_state_classification'
      console.warn(`[CFFS] attempt ${attempt}/3: ${lastError}`)
      continue
    }

    parsed = candidate
    break
  }

  if (!parsed) {
    console.error('[CFFS] generation failed after 3 attempts:', lastError)
    return NextResponse.json(
      { error: `CFFS generation failed after 3 attempts (${lastError}). Please click Regenerate to try again.` },
      { status: 500 }
    )
  }

  // Strip em dashes from all generated text fields
  const cffsData = stripEmDashes(parsed) as Record<string, unknown>

  // Record how many photos actually made it into the prompt. Surfaces as a
  // coach-facing badge ("Photos: ✓ 3/3") on the CFFS panel; null on rows
  // generated by older code paths predating 2026-05-13.
  ;(cffsData as Record<string, unknown>).photos_used = availablePhotos.length

  // Doctrinal guard: reassessment is a TEMPORAL construct per Signal Monitoring v1.0.
  // It can only be set true after longitudinal data exists (CFWS rows, completed
  // blocks, sustained instability, 12-week cap, etc.). At intake-time CFFS
  // generation there is no trajectory to evaluate, so the field must be false.
  // The LLM was previously asked to set this in the JSON schema and would default
  // to true on any "Partially Resolved" classification — which is most clients
  // in Remediation. We override server-side regardless of what the LLM produced.
  ;(cffsData as Record<string, unknown>).reassessment_flagged = false

  // Archive any existing CFFS for this client
  await admin
    .from('cffs')
    .update({ is_archived: true })
    .eq('client_id', client_id)
    .eq('is_archived', false)

  // Save CFFS to database
  const { data: cffs, error: cffsError } = await admin
    .from('cffs')
    .insert({ client_id, intake_id, ...(cffsData as Record<string, unknown>) })
    .select()
    .single()

  if (cffsError) {
    console.error('[CFFS] failed to save CFFS:', cffsError.message)
    return NextResponse.json({ error: `Failed to save CFFS: ${cffsError.message}` }, { status: 500 })
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
