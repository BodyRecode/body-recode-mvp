import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildCFFSSystemPrompt, buildCFFSUserPrompt } from '@/lib/cffs-prompt'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token, formData } = body

  if (!token || !formData) {
    return NextResponse.json({ error: 'Missing token or form data' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Validate token. Reject if already complete.
  const { data: invitation, error: invErr } = await admin
    .from('intake_invitations')
    .select('*')
    .eq('token', token)
    .neq('status', 'complete')
    .single()

  if (invErr || !invitation) {
    return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
  }

  // Extract JSONB scale sections by question ID prefix
  function extractScale(prefix: string): Record<string, number> {
    const result: Record<string, number> = {}
    for (const [key, val] of Object.entries(formData)) {
      if (key.startsWith(prefix) && typeof val === 'number') {
        result[key] = val
      }
    }
    return result
  }

  const intakePayload = {
    client_id: invitation.client_id,
    invitation_id: invitation.id,
    schema_version: 'v2.0',
    // Identity
    full_name: (formData.full_name as string) || '',
    date_of_birth: (formData.date_of_birth as string) || '',
    gender: (formData.gender as string) || '',
    occupation: (formData.occupation as string) || '',
    mobile_number: (formData.mobile_number as string) || '',
    emergency_contact_name: (formData.emergency_contact_name as string) || '',
    emergency_contact_phone: (formData.emergency_contact_phone as string) || '',
    how_did_you_hear: (formData.how_did_you_hear as string) || '',
    // Scale sections as JSONB
    fat_map_responses: extractScale('fm_'),
    injury_responses: extractScale('inj_'),
    training_responses: extractScale('tr_'),
    nutrition_responses: extractScale('nut_'),
    schedule_responses: extractScale('sch_'),
    sleep_responses: extractScale('sl_'),
    stress_responses: extractScale('str_'),
    supplement_responses: extractScale('sup_'),
    // Injury special fields (multiselect + open text)
    injury_location_current: (formData.inj_21 as string[]) || [],
    injury_location_history: (formData.inj_22 as string[]) || [],
    // Schedule structured field (multiselect)
    training_days_available: (formData.sch_days as string[]) || [],
    injury_primary_concern: (formData.inj_23 as string) || '',
    injury_aggravating_movements: (formData.inj_24 as string) || '',
    // Goals
    primary_goal: (formData.goal_primary as string) || '',
    secondary_goals: (formData.goal_secondary as string) || '',
    desired_timeline: (formData.goal_timeline as string) || '',
    subjective_motivator: (formData.goal_motivator as string) || '',
    // Final confirmation
    final_disclosure: (formData.final_disclosure as string) || '',
    final_system_alignment: Boolean(formData.final_system_alignment),
    final_accuracy: Boolean(formData.final_accuracy),
  }

  // Save intake
  const { data: intake, error: intakeError } = await admin
    .from('intakes')
    .insert(intakePayload)
    .select()
    .single()

  if (intakeError || !intake) {
    console.error('Intake insert error:', intakeError)
    return NextResponse.json({ error: 'Failed to save intake' }, { status: 500 })
  }

  // Mark invitation as complete
  await admin
    .from('intake_invitations')
    .update({ status: 'complete', completed_at: new Date().toISOString() })
    .eq('id', invitation.id)

  // Notify coach
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const clientName = intake.full_name || 'A client'
    await resend.emails.send({
      from: 'Body Recode <kade@bodyrecode.au>',
      to: 'kade@bodyrecode.au',
      subject: `${clientName} submitted their intake`,
      html: `<div style="font-family:sans-serif;background:#0a0a0a;color:#aaa;padding:32px;max-width:480px;"><img src="https://bodyrecode.au/logo-teal.png" width="110" style="display:block;margin-bottom:24px;" alt="Body Recode" /><p style="color:#fff;font-size:16px;font-weight:700;margin:0 0 12px;">Intake submitted</p><p style="margin:0;font-size:14px;line-height:1.7;"><strong style="color:#fff;">${clientName}</strong> has completed and submitted their foundational intake. CFFS generation is underway.</p></div>`,
    })
  } catch (e) {
    console.error('Notification email failed:', e)
  }

  // Generate CFFS via Claude. Fire and forget with error handling.
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      system: buildCFFSSystemPrompt(),
      messages: [{ role: 'user', content: buildCFFSUserPrompt(intake) }],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const cffsData = JSON.parse(jsonMatch[0])

        // Archive any existing active CFFS for this client
        await admin
          .from('cffs')
          .update({ is_archived: true })
          .eq('client_id', invitation.client_id)
          .eq('is_archived', false)

        await admin.from('cffs').insert({
          client_id: invitation.client_id,
          intake_id: intake.id,
          ...cffsData,
        })
      }
    }
  } catch (err) {
    console.error('CFFS generation error:', err)
    // Intake is saved. CFFS can be regenerated by coach manually.
  }

  return NextResponse.json({ success: true })
}
