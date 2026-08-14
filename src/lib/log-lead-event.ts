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
  | 'scorecard_completed'
  | 'challenge_enrolled'
  | 'challenge_welcome_sent'
  | 'challenge_coach_notified'
  | 'day_zero_intake_completed'
  | 'custom_time_requested'
  | 'prep_form_completed'
  // Added 2026-08-06. /api/book-request fired two emails and logged neither, so
  // there was no way to tell whether a lead's booking confirmation (which
  // carries the pre-call form link) had actually gone out.
  | 'custom_time_coach_notified'
  | 'booking_confirmation_sent'
  | 'prep_form_reminder_sent'
  | 'dormant_reactivation_sent'
  // Added 2026-08-13. The Day 7 / Day 11 Check-In prompts sent straight through
  // Resend and logged nothing, so when someone did not complete the Check-In
  // there was no way to tell whether they ignored the email or never got one.
  // The Check-In gates the whole Day 14 reveal, so that is the one funnel step
  // least affordable to be blind on.
  | 'challenge_checkin_prompt_sent'
  | 'challenge_checkin_reminder_sent'
  // Added 2026-08-14. One-off PAR-Q catch-up for the July cohort, who enrolled
  // before challengeFormsReminderFunction existed and so can never be reached
  // by it. Doubles as the do-not-resend guard.
  | 'forms_catchup_sent'
  // Added 2026-08-14. Portal visits were logged nowhere at all, which made the
  // biggest leak in the funnel invisible: 15 people cleared every form and 1
  // reached the Day 14 quiz, with no way to see WHERE across the 14 days they
  // went quiet. Deduped to one row per enrollment per day.
  | 'challenge_portal_opened'

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
