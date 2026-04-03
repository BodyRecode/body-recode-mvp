import { createAdminClient } from '@/lib/supabase/admin'

export type LeadEventType =
  | 'check_in_submitted'
  | 'report_scheduled'
  | 'followup_scheduled'
  | 'followup_cancelled'
  | 'reengagement_sent'
  | 'orientation_sent'
  | 'zoom_booked'
  | 'noshow_sequence_scheduled'
  | 'email_sent'

export async function logLeadEvent(params: {
  leadId: string
  type: LeadEventType
  subject?: string
  resendEmailId?: string
  notes?: string
  sentAt?: Date
}) {
  try {
    const admin = createAdminClient()
    await admin.from('lead_events').insert({
      lead_id: params.leadId,
      type: params.type,
      subject: params.subject ?? null,
      resend_email_id: params.resendEmailId ?? null,
      notes: params.notes ?? null,
      sent_at: (params.sentAt ?? new Date()).toISOString(),
    })
  } catch (e) {
    console.error('logLeadEvent error:', e)
  }
}
