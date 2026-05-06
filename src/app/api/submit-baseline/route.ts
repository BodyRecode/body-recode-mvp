import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { buildPortalOrientationEmail } from '@/lib/portal-orientation-email'
import { logClientCommunication } from '@/lib/client-communications'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const clientId = formData.get('clientId') as string
  const bodyweight = parseFloat(formData.get('bodyweight') as string)
  const waist = parseFloat(formData.get('waist') as string)
  const hips = parseFloat(formData.get('hips') as string)
  const chest = parseFloat(formData.get('chest') as string)
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
    const { data } = admin.storage.from('baseline-photos').getPublicUrl(path)
    return data.publicUrl
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
    photo_front_url: frontUrl,
    photo_side_url: sideUrl,
    photo_back_url: backUrl,
    re_capture_week: 1,
  })

  if (error) {
    console.error('Baseline insert error:', error)
    return NextResponse.json({ error: 'Failed to save baseline' }, { status: 500 })
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data: client } = await admin
      .from('clients')
      .select('name, email, onboarding_token')
      .eq('id', clientId)
      .maybeSingle()
    const name = client?.name ?? 'A client'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.bodyrecode.au'

    // Notify Kade
    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `${name} submitted their baseline`,
      html: buildCoachNotificationEmail({
        eyebrow: 'Baseline',
        heading: `${name} submitted their baseline`,
        body: `${name} has uploaded their baseline measurements and progress photos. This is the calibration point for everything that follows. The Portal Orientation email has been sent to them automatically. Their Deliberate Start Window can begin once you have reviewed the baseline and generated the program.`,
        ctaLabel: 'Open client profile',
        ctaUrl: `${baseUrl}/dashboard/clients/${clientId}`,
      }),
    })

    // Send Portal Orientation email to the client (auto-fires here so the
    // client has time to read through the portal while the program is built).
    if (client?.email && client.onboarding_token) {
      const firstName = (client.name?.split(' ')[0] ?? 'there')
      const portalUrl = `${baseUrl}/portal/${client.onboarding_token}`
      const { subject, html } = buildPortalOrientationEmail({ firstName, portalUrl })
      try {
        await resend.emails.send({
          from: 'Kade at Body Recode <kade@bodyrecode.au>',
          to: client.email,
          subject,
          html,
        })
        await logClientCommunication(admin, {
          clientId,
          kind: 'portal_orientation',
          subject,
          toAddress: client.email,
          meta: { trigger: 'baseline_submission' },
        })
      } catch (e) {
        console.error('Portal orientation email failed:', e)
      }
    }
  } catch (e) {
    console.error('Notification email failed:', e)
  }

  return NextResponse.json({ success: true })
}
