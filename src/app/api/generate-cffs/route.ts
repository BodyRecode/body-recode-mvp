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
import { resolveHeightCm } from '@/lib/client-height'
import { signedBaselinePhotoUrl } from '@/lib/baseline-photos'
import { withTemporalContext } from '@/lib/temporal-context'
import { isCanonicalPattern, supersedes, type PatternSource } from '@/lib/pattern-doctrine'
import {
  sniffImageMediaType,
  describeImageFormat,
  type ImageMediaType,
} from '@/lib/image-media-type'
import { CFFS_MODEL } from '@/lib/ai-models'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export const maxDuration = 300

// Anthropic vision accepts up to 5MB per image. Our baseline pipeline already
// compresses to 1600px / 0.82 JPEG (~400KB) so we never approach the cap, but
// the timeout keeps a stuck S3 fetch from blocking the whole CFFS generation.
const IMAGE_FETCH_TIMEOUT_MS = 15_000

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
    const buf = Buffer.from(await res.arrayBuffer())
    const media_type = sniffImageMediaType(buf)
    if (!media_type) {
      console.warn(
        `[CFFS] baseline photo skipped — ${describeImageFormat(buf)} is not readable by Anthropic vision ` +
        `(JPEG/PNG/GIF/WebP only). Client should retake with the camera set to JPEG. ${url.slice(0, 120)}`
      )
      return null
    }
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
  if (!(await isCoachUser(user))) return forbidden()

  const body = await request.json()
  return runCFFSGenerationInternal(body)
}

/**
 * Internal entrypoint. Sixth of the set, after generate-nutrition and
 * generate-program (30 Aug), then generate-trajectory-reading,
 * suggest-nutrition and suggest-plan (1 Sep). A server-side script can run the
 * read for one client without a browser session.
 *
 * The read was the last generator still unreachable outside the browser, and
 * it is the one that matters most: every other artefact derives from the CFFS,
 * so a failure here is the most expensive to diagnose blind.
 *
 * Pure extraction, auth unchanged on POST.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runCFFSGenerationInternal(body: any): Promise<NextResponse> {
  const { intake_id, client_id } = body ?? {}
  if (!intake_id || !client_id) {
    return NextResponse.json({ error: 'intake_id and client_id required' }, { status: 400 })
  }

  // All data fetches + writes go through the admin client to bypass RLS,
  // which would otherwise hide intakes / baselines from the coach. Mirrors
  // the pattern in every other generate-* route (program reading,
  // nutrition reading, etc.). Auth gating on POST is what protects the route.
  const admin = createAdminClient()

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
    admin.from('clients').select('medications, height_cm, height_recorded_at, height_source').eq('id', client_id).maybeSingle(),
    admin
      .from('baselines')
      .select('bodyweight_kg, height_cm, waist_cm, hips_cm, chest_cm, captured_at, photo_front_url, photo_side_url, photo_back_url')
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

  // The funnel's own read, so the CFFS can agree with it or depart from it
  // deliberately rather than never knowing it existed. Matched via the lead
  // that converted into this client.
  const { data: leadRow } = await admin
    .from('leads')
    .select('scorecard_profile, scorecard_profile_confidence')
    .eq('converted_to_client_id', client_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const incomingPattern = {
    pattern: leadRow?.scorecard_profile ?? null,
    source: leadRow?.scorecard_profile ? 'scorecard' : null,
    confidence: leadRow?.scorecard_profile_confidence ?? null,
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
      // The bucket is private, so a stored URL is not directly fetchable.
      // Sign it for the life of this request.
      const signed = await signedBaselinePhotoUrl(admin, url, 5 * 60)
      if (!signed) return { label, image: null as Awaited<ReturnType<typeof fetchImageAsBase64>> }
      return { label, image: await fetchImageAsBase64(signed) }
    })
  )
  const availablePhotos = fetchedPhotos.filter(p => p.image !== null) as Array<{
    label: 'front' | 'side' | 'back'
    image: NonNullable<Awaited<ReturnType<typeof fetchImageAsBase64>>>
  }>

  // Height through the resolver so a coach-entered height on the client record
  // reaches the anthropometry section (waist-to-height, BMI plausibility) for
  // the clients who captured a baseline before height was ever asked for.
  const resolvedHeight = resolveHeightCm({
    clientHeightCm: clientRow?.height_cm,
    clientHeightRecordedAt: clientRow?.height_recorded_at ?? null,
    clientHeightSource: clientRow?.height_source ?? null,
    baselineHeightCm: baselineRow?.height_cm,
    baselineCapturedAt: baselineRow?.captured_at ?? null,
  })

  const baselineContext: CFFSBaselineContext | null = baselineRow
    ? {
        bodyweight_kg: baselineRow.bodyweight_kg ?? null,
        height_cm: resolvedHeight.heightCm,
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
  // single-shot with a 6000-token cap. For data-rich clients (full 234-question
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
        model: CFFS_MODEL,
        max_tokens: MAX_TOKENS,
        system: withTemporalContext(buildCFFSSystemPrompt(incomingPattern)),
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

  // Resolve the pattern onto the client. The CFFS read supersedes a funnel
  // read because it draws on an order of magnitude more evidence, not because
  // it is newer. The per-generation read stays on the cffs row, so history
  // survives regeneration and "what did we think, when, and why" is always
  // answerable.
  const readPattern = (cffsData as Record<string, unknown>).pattern_classification
  if (isCanonicalPattern(readPattern)) {
    const { data: current } = await admin
      .from('clients')
      .select('pattern, pattern_source')
      .eq('id', client_id)
      .maybeSingle()

    if (supersedes('cffs', (current?.pattern_source as PatternSource | null) ?? null)) {
      await admin
        .from('clients')
        .update({
          pattern: readPattern,
          pattern_source: 'cffs',
          pattern_set_at: new Date().toISOString(),
        })
        .eq('id', client_id)
      if (current?.pattern && current.pattern !== readPattern) {
        console.log(
          `[CFFS] pattern changed for client ${String(client_id).slice(0, 8)}: ` +
          `${current.pattern} -> ${readPattern} (was ${current.pattern_source ?? 'unset'}, now cffs)`
        )
      }
    }
  } else {
    console.warn(`[CFFS] no usable pattern_classification returned for client ${String(client_id).slice(0, 8)}`)
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
