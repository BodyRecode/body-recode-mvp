import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyOnboardingCompleteIfReady } from '@/lib/onboarding-complete-notification'
import { appUrl } from '@/lib/app-url'
import { fromBrand } from '@/lib/email-shell'
import { coach } from '@/config/tenant'
import { MIN_HEIGHT_CM, MAX_HEIGHT_CM } from '@/lib/client-height'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const clientId = formData.get('clientId') as string
  const bodyweight = parseFloat(formData.get('bodyweight') as string)
  const waist = parseFloat(formData.get('waist') as string)
  const hips = parseFloat(formData.get('hips') as string)
  const chest = parseFloat(formData.get('chest') as string)
  // Height is captured once and carried forward on re-captures, so it arrives
  // on every submission but is only typed by the client the first time.
  // An implausible value (feet typed into a cm field) is dropped to null rather
  // than passed through. The database now range-checks this column, and a
  // rejected insert would cost the client their whole submission — photos,
  // weight and all — over one mistyped field. Better to save the capture and
  // leave the height for the coach to enter on the client file.
  const heightRaw = parseFloat(formData.get('height') as string)
  const height = Number.isFinite(heightRaw) && heightRaw >= MIN_HEIGHT_CM && heightRaw <= MAX_HEIGHT_CM
    ? heightRaw
    : null
  const photoFront = formData.get('photoFront') as File | null
  const photoSide = formData.get('photoSide') as File | null
  const photoBack = formData.get('photoBack') as File | null

  if (!clientId) return NextResponse.json({ error: 'Missing client' }, { status: 400 })

  const admin = createAdminClient()

  // Upload photos to Supabase Storage
  async function uploadPhoto(file: File, position: string): Promise<string | null> {
    if (!file) return null
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${clientId}/${Date.now()}_${position}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error } = await admin.storage
      .from('baseline-photos')
      .upload(path, buffer, { contentType: file.type, upsert: true })
    if (error) { console.error('Photo upload error:', error); return null }
    // Store the object path, not a public URL. The bucket is private as of
    // 2026-07-28 and these are only ever served over short-lived signed URLs
    // (see src/lib/baseline-photos.ts). Older rows hold a full public-format
    // URL; the signing helper accepts either shape.
    return path
  }

  const [frontUrl, sideUrl, backUrl] = await Promise.all([
    photoFront ? uploadPhoto(photoFront, 'front') : Promise.resolve(null),
    photoSide ? uploadPhoto(photoSide, 'side') : Promise.resolve(null),
    photoBack ? uploadPhoto(photoBack, 'back') : Promise.resolve(null),
  ])

  const { error } = await admin.from('baselines').insert({
    client_id: clientId,
    bodyweight_kg: bodyweight,
    waist_cm: waist,
    hips_cm: hips,
    chest_cm: chest,
    height_cm: height,
    photo_front_url: frontUrl,
    photo_side_url: sideUrl,
    photo_back_url: backUrl,
    re_capture_week: 1,
  })

  if (error) {
    console.error('Baseline insert error:', error)
    return NextResponse.json({ error: 'Failed to save baseline' }, { status: 500 })
  }

  // Mirror the height onto the client record, which is the standing system
  // record readers fall back to when there is no baseline. Failing this must
  // not fail the submission — the baseline row is already saved and holds the
  // height either way, so a mirror failure costs nothing the resolver can't
  // recover from.
  if (height !== null && height !== undefined && !Number.isNaN(Number(height))) {
    const { error: mirrorErr } = await admin
      .from('clients')
      .update({
        height_cm: height,
        height_recorded_at: new Date().toISOString(),
        height_source: 'client',
      })
      .eq('id', clientId)
    if (mirrorErr) console.error('Client height mirror error:', mirrorErr)
  }

  // Try the onboarding-complete notification first. If intake is also in,
  // it fires the richer "CFFS ready to generate" email and we skip the
  // generic baseline-only one. If intake is not yet in (rare reverse order),
  // it returns sent:false and we fall back to the existing baseline email.
  const onboardingNotice = await notifyOnboardingCompleteIfReady(admin, clientId, {
    trigger: 'baseline',
  })

  if (!onboardingNotice.sent) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { data: client } = await admin.from('clients').select('name').eq('id', clientId).maybeSingle()
      const name = client?.name ?? 'A client'
      const baseUrl = appUrl()
      await resend.emails.send({
        from: fromBrand(),
        to: coach().email,
        subject: `${name} submitted their baseline`,
        html: buildCoachNotificationEmail({
          eyebrow: 'Baseline',
          heading: `${name} submitted their baseline`,
          body: `${name} has uploaded their baseline measurements and progress photos. This is the calibration point for everything that follows. Their foundational intake is still outstanding; CFFS generation will be available once that is also in. You will receive a second email when both forms are complete and the CFFS is ready to generate.`,
          ctaLabel: 'Open client profile',
          ctaUrl: `${baseUrl}/dashboard/clients/${clientId}`,
        }),
      })
    } catch (e) {
      console.error('Notification email failed:', e)
    }
  }

  return NextResponse.json({ success: true })
}
