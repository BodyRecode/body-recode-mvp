import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractFirstJsonObject } from '@/lib/extract-json'
import { sniffImageMediaType, describeImageFormat } from '@/lib/image-media-type'
import { withTemporalContext } from '@/lib/temporal-context'
import {
  buildExtractionSystemPrompt,
  buildExtractionUserText,
  normaliseExtraction,
  type BloodPanelClientFacts,
} from '@/lib/blood-panel-prompt'
import { AI_MODELS } from '@/lib/ai-models'
import { isCoachUser, forbidden } from '@/lib/api-auth'

/**
 * Re-run the multimodal transcription for a panel whose upload-time extraction
 * failed or read poorly. Downloads the stored file, reads it again, and
 * overwrites markers / panel_summary / gp_flags. Coach-only.
 */
export const maxDuration = 300


export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; panelId: string }> }
) {
  const { id, panelId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const admin = createAdminClient()

  const { data: panel } = await admin
    .from('blood_panels')
    .select('id, client_id, file_path, file_type, lab_name, collected_on, client_note, approved_for_plan')
    .eq('id', panelId)
    .eq('client_id', id)
    .maybeSingle()
  if (!panel) return NextResponse.json({ error: 'Blood panel not found' }, { status: 404 })

  const { data: blob, error: dlErr } = await admin.storage.from('blood-test-docs').download(panel.file_path)
  if (dlErr || !blob) {
    return NextResponse.json({ error: `Could not read the stored file: ${dlErr?.message ?? 'missing'}` }, { status: 500 })
  }
  const buffer = Buffer.from(await blob.arrayBuffer())
  const base64 = buffer.toString('base64')
  const isPdf = (panel.file_type ?? '').includes('pdf') || panel.file_path.toLowerCase().endsWith('.pdf')

  const { data: client } = await admin.from('clients').select('name').eq('id', id).maybeSingle()
  const { data: intake } = await admin
    .from('intakes')
    .select('date_of_birth, gender, full_name')
    .eq('client_id', id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const clientFacts: BloodPanelClientFacts = {
    firstName: client?.name?.split(' ')[0] ?? 'client',
    fullName: intake?.full_name ?? client?.name ?? null,
    dateOfBirth: intake?.date_of_birth ?? null,
    gender: intake?.gender ?? null,
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 3 })

  // Sniff the real format from the bytes. A HEIC photo stored here would
  // otherwise be sent labelled as JPEG and fail the whole extraction with an
  // opaque "Could not process image" from the API.
  let fileBlock: Anthropic.Messages.ContentBlockParam
  if (isPdf) {
    fileBlock = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
  } else {
    const mediaType = sniffImageMediaType(buffer)
    if (!mediaType) {
      return NextResponse.json(
        {
          error:
            `This panel was uploaded as ${describeImageFormat(buffer)}, which cannot be read. ` +
            `Ask the client to re-upload it as a PDF, or retake the photo with their camera set to JPEG ` +
            `(iPhone: Settings → Camera → Formats → Most Compatible).`,
        },
        { status: 422 }
      )
    }
    fileBlock = { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }
  }

  let message
  try {
    message = await anthropic.messages.create({
      model: AI_MODELS.clinical,
      max_tokens: 4000,
      system: withTemporalContext(buildExtractionSystemPrompt()),
      messages: [
        {
          role: 'user',
          content: [
            fileBlock,
            { type: 'text', text: buildExtractionUserText({ client: clientFacts, labName: panel.lab_name, collectedOn: panel.collected_on, clientNote: panel.client_note }) },
          ],
        },
      ],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `AI error: ${msg}` }, { status: 500 })
  }

  const content = (message.content.find(b => b.type === 'text') ?? message.content[0])
  if (!content || content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 })
  }
  const jsonText = extractFirstJsonObject(content.text)
  if (!jsonText) {
    return NextResponse.json({ error: `Could not parse extraction: ${content.text.slice(0, 160)}` }, { status: 500 })
  }

  let extraction
  try {
    extraction = normaliseExtraction(JSON.parse(jsonText))
  } catch (err) {
    return NextResponse.json({ error: `Invalid extraction: ${(err as Error).message}` }, { status: 500 })
  }

  const nowIso = new Date().toISOString()
  const { error: updateErr } = await admin
    .from('blood_panels')
    .update({
      status: extraction.unreadable ? 'failed' : (panel.approved_for_plan ? 'approved' : 'extracted'),
      panel_summary: extraction.panel_summary,
      markers: extraction.markers,
      gp_flags: extraction.gp_flags,
      extraction_meta: { model: AI_MODELS.clinical, unreadable: extraction.unreadable, notes: extraction.notes, reextracted_at: nowIso },
      extracted_at: nowIso,
      collected_on: extraction.collected_on ?? panel.collected_on,
      lab_name: extraction.lab_name ?? panel.lab_name,
    })
    .eq('id', panelId)
  if (updateErr) return NextResponse.json({ error: `Failed to save: ${updateErr.message}` }, { status: 500 })

  return NextResponse.json({ extraction, markerCount: extraction.markers.length, unreadable: extraction.unreadable })
}
