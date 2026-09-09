import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { type CFFSBaselineContext } from '@/lib/cffs-prompt'
import { type BloodMarker } from '@/lib/blood-panel-prompt'
import { runRead } from '@/lib/cffs-read'
import { resolveHeightCm } from '@/lib/client-height'
import { signedBaselinePhotoUrl } from '@/lib/baseline-photos'
import { isCanonicalPattern, supersedes, type PatternSource } from '@/lib/pattern-doctrine'
import {
  sniffImageMediaType,
  describeImageFormat,
  type ImageMediaType,
} from '@/lib/image-media-type'
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
      .select('panel_summary, collected_on, markers, analysis, cycle_day, cycle_note')
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

  // has_photos is deliberately NOT set here: runRead derives it from the photos
  // it is actually given, so the flag can never disagree with the images.
  const baselineContext: Omit<CFFSBaselineContext, 'has_photos'> | null = baselineRow
    ? {
        bodyweight_kg: baselineRow.bodyweight_kg ?? null,
        height_cm: resolvedHeight.heightCm,
        waist_cm: baselineRow.waist_cm ?? null,
        hips_cm: baselineRow.hips_cm ?? null,
        chest_cm: baselineRow.chest_cm ?? null,
        captured_at: baselineRow.captured_at ?? null,
      }
    : null

  console.log(
    `[CFFS] client=${String(client_id).slice(0, 8)} baseline=${!!baselineRow} photos_attached=${availablePhotos.length}/3`
  )

  // What the recent weekly syntheses say about the four readiness domains.
  // Handed to the read as EVIDENCE it must reconcile, never as a substituted
  // value: the weekly synthesis rates itself against THIS read, so writing the
  // weeklies back into it would have the two reading each other and nothing
  // would hold still. Added 2026-09-08 alongside the readiness rubric, after
  // the same intake produced Green, Amber, Green on three runs because nothing
  // told the model how to score these at all.
  const { data: cfwsForReadiness } = await admin
    .from('cfws')
    .select('week_number, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour')
    .eq('client_id', client_id)
    .eq('is_archived', false)
    .order('week_number', { ascending: false })
    .limit(6)

  const { data: priorCffsRows } = await admin
    .from('cffs')
    .select('exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour')
    .eq('client_id', client_id)
    .eq('is_archived', false)
    .order('generated_at', { ascending: false })
    .limit(1)

  // Everything above this line is DATA GATHERING, and all of it is specific to
  // Kade's own records. Everything below is the read itself, which knows none
  // of that. See src/lib/cffs-read.ts.
  const result = await runRead({
    intake,
    medications: clientRow?.medications ?? null,
    baseline: baselineContext,
    photos: availablePhotos.map(p => ({
      label: p.label,
      base64: p.image.base64,
      media_type: p.image.media_type,
    })),
    bloodPanel: bloodPanel
      ? {
          panel_summary: bloodPanel.panel_summary ?? null,
          collected_on: bloodPanel.collected_on ?? null,
          markers: (bloodPanel.markers ?? []) as BloodMarker[],
          combined_picture: (bloodPanel.analysis as { combined_picture?: string } | null)?.combined_picture ?? null,
          // Lets the phase-dependent hormone markers be read against the band
          // that actually applies, rather than reaching the model as four
          // ranges and a shrug. Added 2026-09-08.
          cycleDay: bloodPanel.cycle_day ?? null,
          cycleNote: bloodPanel.cycle_note ?? null,
        }
      : null,
    weeklyReadiness: cfwsForReadiness ?? [],
    priorReadiness: priorCffsRows?.[0] ?? null,
    incomingPattern,
    label: String(client_id).slice(0, 8),
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: `${result.error} Please click Regenerate to try again.` },
      { status: 500 }
    )
  }

  const cffsData = result.cffs

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
