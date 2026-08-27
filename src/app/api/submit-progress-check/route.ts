import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { PROGRESS_CHECK_QUESTION_IDS } from '@/lib/progress-check-questions'
import { fromCoach } from '@/lib/email-shell'
import { coach } from '@/config/tenant'
import { appUrl } from '@/lib/app-url'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'

// Stores a completed Progress Check. Token-authorised (the client reaches it via
// their unique link), service-role write. On completion it notifies the coach so
// they can generate the Progress Read (which re-scores body state from these
// answers). No client-facing publish happens here - the coach stays the gate.
export const maxDuration = 300

export async function POST(request: NextRequest) {
  // Multipart: the answers and the milestone capture arrive together, so a
  // client can never end up with answers on file and no photos.
  const form = await request.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  const token = form.get('token') as string | null
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  let responses: Record<string, unknown> = {}
  try {
    responses = JSON.parse((form.get('responses') as string) ?? '{}')
  } catch {
    responses = {}
  }
  const body = { responses }

  const admin = createAdminClient()
  const { data: pc } = await admin
    .from('progress_checks')
    .select('id, status, client_id, program_id')
    .eq('token', token)
    .maybeSingle()
  if (!pc) return NextResponse.json({ error: 'Progress Check not found' }, { status: 404 })
  if (pc.status === 'complete') return NextResponse.json({ ok: true, already: true })

  // Persist only known question ids, as strings. Ignore anything unexpected.
  const clean: Record<string, string> = {}
  for (const id of PROGRESS_CHECK_QUESTION_IDS) {
    const v = body?.responses?.[id]
    if (v != null && String(v).trim() !== '') clean[id] = String(v)
  }

  const { error } = await admin
    .from('progress_checks')
    .update({ responses: clean, status: 'complete', submitted_at: new Date().toISOString() })
    .eq('id', pc.id)

  if (error) {
    console.error('submit-progress-check update error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  // ── Milestone capture ────────────────────────────────────────────────
  // Every baseline on file was captured in week one, because the capture only
  // ever existed as a one-off onboarding task. Writing a fresh `baselines` row
  // here is what finally produces a before-and-after: the table has always been
  // multi-row and the portal already renders "Week N re-capture".
  //
  // Best-effort by design. The answers are already saved above; a storage
  // failure must never cost the client her whole submission.
  const num = (k: string) => {
    const v = parseFloat((form.get(k) as string) ?? '')
    return Number.isFinite(v) ? v : null
  }
  const bodyweight = num('bodyweight')
  let captureSaved = false
  let photosSaved = 0

  if (bodyweight != null) {
    try {
      const { data: client } = await admin
        .from('clients')
        .select('coaching_started_at')
        .eq('id', pc.client_id)
        .maybeSingle()
      const week = client?.coaching_started_at ? getWeekNumber(client.coaching_started_at) : null

      async function uploadPhoto(file: File | null, position: string): Promise<string | null> {
        if (!file || file.size === 0) return null
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${pc!.client_id}/${Date.now()}_${position}.${ext}`
        const buffer = Buffer.from(await file.arrayBuffer())
        const { error: upErr } = await admin.storage
          .from('baseline-photos')
          .upload(path, buffer, { contentType: file.type, upsert: true })
        if (upErr) { console.error('Progress Check photo upload error:', upErr); return null }
        // Object path, not a public URL - the bucket is private and these are
        // served over short-lived signed URLs (src/lib/baseline-photos.ts).
        return path
      }

      const [frontUrl, sideUrl, backUrl] = await Promise.all([
        uploadPhoto(form.get('photoFront') as File | null, 'front'),
        uploadPhoto(form.get('photoSide') as File | null, 'side'),
        uploadPhoto(form.get('photoBack') as File | null, 'back'),
      ])
      photosSaved = [frontUrl, sideUrl, backUrl].filter(Boolean).length

      const { error: capErr } = await admin.from('baselines').insert({
        client_id: pc.client_id,
        bodyweight_kg: bodyweight,
        waist_cm: num('waist'),
        hips_cm: num('hips'),
        chest_cm: num('chest'),
        photo_front_url: frontUrl,
        photo_side_url: sideUrl,
        photo_back_url: backUrl,
        re_capture_week: week,
      })
      if (capErr) console.error('Progress Check capture insert error:', capErr)
      else captureSaved = true
    } catch (e) {
      console.error('Progress Check capture failed (non-fatal):', e)
    }
  }

  // Notify the coach so they can generate + review the Progress Read. Best-effort;
  // a failed notification must not fail the client's submission.
  try {
    const { data: client } = await admin
      .from('clients')
      .select('name')
      .eq('id', pc.client_id)
      .maybeSingle()
    const clientName = client?.name || 'A client'
    const programUrl = `${appUrl()}/dashboard/clients/${pc.client_id}/program`
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: fromCoach(),
      to: coach().adminEmail,
      subject: `Progress Check submitted: ${clientName}`,
      html: `<p>${clientName} has completed their Progress Check.</p>
<p>${
        captureSaved
          ? `Fresh capture saved: measurements and ${photosSaved} photo${photosSaved === 1 ? '' : 's'}.${
              photosSaved < 3 ? ' Fewer than three photos landed - worth checking the file.' : ''
            }`
          : 'No capture was saved with this one, which should not happen now that measurements and photos are required. Worth checking the logs.'
      }</p>
<p>Open their program, then use <b>Generate</b> on the Block-End / Progress Read panel to draft the reading. It will re-score their body state from these answers. Review it, then publish.</p>
<p><a href="${programUrl}">${programUrl}</a></p>`,
    })
  } catch (e) {
    console.error('Progress Check coach notification failed (non-fatal):', e)
  }

  return NextResponse.json({ ok: true })
}
