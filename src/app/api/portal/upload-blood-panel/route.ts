import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { buildCoachNotificationEmail } from '@/lib/coach-notification-email'
import { appUrl } from '@/lib/app-url'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { sniffImageMediaType, describeImageFormat } from '@/lib/image-media-type'
import { fromBrand } from '@/lib/email-shell'
import { withTemporalContext } from '@/lib/temporal-context'
import {
  buildExtractionSystemPrompt,
  buildExtractionUserText,
  normaliseExtraction,
  type BloodPanelClientFacts,
} from '@/lib/blood-panel-prompt'
import { coach } from '@/config/tenant'
import { AI_MODELS } from '@/lib/ai-models'

/**
 * Client self-serve blood panel upload. Uploads the file to the private
 * blood-test-docs bucket, inserts a blood_panels row, reads the file
 * multimodally to transcribe the markers, stamps the extraction, and notifies
 * the coach. The panel does NOT influence the plan yet — that requires the
 * coach to Approve it (coach-gated). See /api/clients/[id]/blood-panels/...
 */
export const maxDuration = 300


export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const clientId = formData.get('clientId') as string | null
  const labName = (formData.get('labName') as string | null)?.trim() || null
  const collectedOnRaw = (formData.get('collectedOn') as string | null)?.trim() || null
  const clientNote = (formData.get('clientNote') as string | null)?.trim() || null

  if (!file || !clientId) {
    return NextResponse.json({ error: 'Missing file or client' }, { status: 400 })
  }

  // Vercel's serverless body limit is 4.5MB. Backstop here.
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 4MB)' }, { status: 413 })
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  const isImage = file.type.startsWith('image/')
  if (!isPdf && !isImage) {
    return NextResponse.json({ error: 'Please upload a PDF or a photo (JPG/PNG).' }, { status: 415 })
  }

  // Normalise the optional date to YYYY-MM-DD or null (a free-text date input
  // can arrive in odd shapes; the report's own date wins during extraction).
  const collectedOn = collectedOnRaw && /^\d{4}-\d{2}-\d{2}$/.test(collectedOnRaw) ? collectedOnRaw : null

  const admin = createAdminClient()

  const buffer = Buffer.from(await file.arrayBuffer())

  // Reject unreadable image formats before storing anything. Phones set to
  // "high efficiency" produce HEIC, which we cannot transcribe — better to
  // tell the client now, while they still have the report in front of them,
  // than to store a file that silently fails extraction.
  const imageMediaTypeOrNull = isPdf ? null : sniffImageMediaType(buffer)
  if (!isPdf && !imageMediaTypeOrNull) {
    return NextResponse.json(
      {
        error:
          `That photo is in ${describeImageFormat(buffer)}, which we can't read. ` +
          `Please upload the report as a PDF, or change your camera format to JPEG and retake it ` +
          `(iPhone: Settings → Camera → Formats → Most Compatible).`,
      },
      { status: 415 }
    )
  }

  // Upload to the private blood-test-docs bucket.
  const ext = file.name.split('.').pop()?.toLowerCase() ?? (isPdf ? 'pdf' : 'jpg')
  const path = `${clientId}/${Date.now()}_bloods.${ext}`

  const { error: uploadError } = await admin.storage
    .from('blood-test-docs')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    console.error('Blood panel upload error:', uploadError)
    return NextResponse.json(
      { error: 'Upload failed. If this keeps happening, let your coach know.' },
      { status: 500 }
    )
  }

  // Insert the panel row immediately so nothing is lost even if extraction
  // fails. Extraction then updates this row in place.
  const { data: panel, error: insertError } = await admin
    .from('blood_panels')
    .insert({
      client_id: clientId,
      file_path: path,
      file_type: file.type,
      original_filename: file.name,
      lab_name: labName,
      collected_on: collectedOn,
      client_note: clientNote,
      status: 'uploaded',
    })
    .select('id')
    .single()

  if (insertError || !panel) {
    console.error('Blood panel insert error:', insertError)
    return NextResponse.json({ error: 'Could not save the upload. Please try again.' }, { status: 500 })
  }

  // Fetch client identity for the extraction context + notification.
  const { data: client } = await admin
    .from('clients')
    .select('name, email')
    .eq('id', clientId)
    .maybeSingle()
  const { data: intake } = await admin
    .from('intakes')
    .select('date_of_birth, gender, full_name')
    .eq('client_id', clientId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const firstName = client?.name?.split(' ')[0] ?? 'client'
  const clientFacts: BloodPanelClientFacts = {
    firstName,
    fullName: intake?.full_name ?? client?.name ?? null,
    dateOfBirth: intake?.date_of_birth ?? null,
    gender: intake?.gender ?? null,
  }

  // ── Extraction (multimodal). A failure here is non-fatal: the file is
  // already saved and the coach can re-run extraction from the dashboard. ──
  let extractionOk = false
  let markerCount = 0
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 3 })
      const base64 = buffer.toString('base64')

      const fileBlock: Anthropic.Messages.ContentBlockParam = isPdf
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
        : { type: 'image', source: { type: 'base64', media_type: imageMediaTypeOrNull!, data: base64 } }

      const message = await anthropic.messages.create({
        model: AI_MODELS.clinical,
        max_tokens: 4000,
        system: withTemporalContext(buildExtractionSystemPrompt()),
        messages: [
          {
            role: 'user',
            content: [
              fileBlock,
              { type: 'text', text: buildExtractionUserText({ client: clientFacts, labName, collectedOn, clientNote }) },
            ],
          },
        ],
      })

      const content = (message.content.find(b => b.type === 'text') ?? message.content[0])
      if (content && content.type === 'text') {
        const jsonText = extractFirstJsonObject(content.text)
        if (jsonText) {
          const extraction = normaliseExtraction(JSON.parse(jsonText))
          markerCount = extraction.markers.length
          await admin
            .from('blood_panels')
            .update({
              status: extraction.unreadable ? 'failed' : 'extracted',
              panel_summary: extraction.panel_summary,
              markers: extraction.markers,
              gp_flags: extraction.gp_flags,
              extraction_meta: {
                model: AI_MODELS.clinical,
                unreadable: extraction.unreadable,
                notes: extraction.notes,
              },
              extracted_at: new Date().toISOString(),
              // Let the report's printed date/lab win over the client's guess.
              collected_on: extraction.collected_on ?? collectedOn,
              lab_name: extraction.lab_name ?? labName,
            })
            .eq('id', panel.id)
          extractionOk = !extraction.unreadable
        }
      }
    } catch (err) {
      // Leave status 'uploaded'; coach re-runs extraction. Don't fail the upload.
      console.error('Blood panel extraction error:', err instanceof Error ? err.message : err)
      await admin
        .from('blood_panels')
        .update({ extraction_meta: { error: err instanceof Error ? err.message : String(err) } })
        .eq('id', panel.id)
    }
  }

  // Notify the coach.
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const baseUrl = appUrl()
    const name = client?.name ?? 'A client'
    const readState = extractionOk
      ? `${markerCount} marker${markerCount === 1 ? '' : 's'} were read automatically and are ready for your review.`
      : `The automatic read did not land cleanly, so review the file and re-run extraction from their profile.`
    await resend.emails.send({
      from: fromBrand(),
      to: coach().email,
      subject: `${name} uploaded blood test results`,
      html: buildCoachNotificationEmail({
        eyebrow: 'Health Markers',
        heading: `${name} uploaded blood test results`,
        body: [
          `${name} has uploaded a copy of their blood test results to their portal. ${readState}`,
          `Nothing influences their plan until you review the panel and click Approve for plan. Generate the coach analysis and client reading from their profile.`,
        ],
        ctaLabel: 'Review blood panel',
        ctaUrl: `${baseUrl}/dashboard/clients/${clientId}#bloods`,
      }),
    }).catch(err => console.error('Notification email error:', err))
  }

  return NextResponse.json({ success: true, extracted: extractionOk, markerCount })
}
