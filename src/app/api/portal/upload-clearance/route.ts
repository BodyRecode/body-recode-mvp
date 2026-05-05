import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const clientId = formData.get('clientId') as string

  if (!file || !clientId) {
    return NextResponse.json({ error: 'Missing file or client' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Upload to clearance-docs bucket
  const ext = file.name.split('.').pop() ?? 'pdf'
  const path = `${clientId}/${Date.now()}_clearance.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from('clearance-docs')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    console.error('Clearance upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  // Get signed URL (private bucket, expires in 7 days for dashboard viewing)
  const { data: signedData } = await admin.storage
    .from('clearance-docs')
    .createSignedUrl(path, 60 * 60 * 24 * 7)

  const docUrl = signedData?.signedUrl ?? null

  // Update client record
  const { data: client, error: updateError } = await admin
    .from('clients')
    .update({
      medical_clearance_doc_url: path, // store path, not signed URL (signed URLs expire)
      medical_clearance_submitted_at: new Date().toISOString(),
    })
    .eq('id', clientId)
    .select('name, email, onboarding_token')
    .single()

  if (updateError) {
    console.error('Client update error:', updateError)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  // Notify Kade
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.bodyrecode.au'
    const name = client?.name ?? 'A client'
    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `${name} uploaded their medical clearance`,
      html: buildCoachNotificationEmail({
        eyebrow: 'Medical Clearance',
        heading: `${name} uploaded their medical clearance`,
        body: `${name} has uploaded their completed medical clearance form. Review the form, then click Approve clearance on the client profile to unlock the rest of their onboarding.`,
        ctaLabel: 'Review and approve',
        ctaUrl: `${baseUrl}/dashboard/clients/${clientId}/medical-clearance`,
        accent: 'amber',
      }),
    }).catch(err => console.error('Notification email error:', err))
  }

  return NextResponse.json({ success: true })
}
