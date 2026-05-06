import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Canonical list of communication kinds. Add a new entry here whenever
 * a new email/link type is sent to a client, then label it in
 * COMMUNICATION_KIND_LABELS below.
 */
export type ClientCommunicationKind =
  | 'subscription_link'
  | 'portal_access'
  | 'intake_invite'
  | 'portal_login_code'
  | 'medical_clearance_approved'
  | 'coaching_start_reminder'
  | 'onboarding_reminder'
  | 'session_reminder'
  | 'checkin_window_open'
  | 'checkin_window_closing'

export const COMMUNICATION_KIND_LABELS: Record<ClientCommunicationKind, string> = {
  subscription_link: 'Subscription link',
  portal_access: 'Portal access',
  intake_invite: 'Intake invitation',
  portal_login_code: 'Portal login code',
  medical_clearance_approved: 'Medical clearance approved',
  coaching_start_reminder: 'Coaching start reminder',
  onboarding_reminder: 'Onboarding reminder',
  session_reminder: 'Session reminder',
  checkin_window_open: 'Check-in window opened',
  checkin_window_closing: 'Check-in window closing',
}

export interface LogClientCommunicationInput {
  clientId: string
  kind: ClientCommunicationKind
  channel?: 'email' | 'sms'
  subject?: string | null
  toAddress?: string | null
  meta?: Record<string, unknown>
  sentBy?: string | null
  sentAt?: string
}

/**
 * Append an entry to client_communications. Failures are logged but never
 * thrown so a logging hiccup can't break the actual send flow.
 */
export async function logClientCommunication(
  admin: SupabaseClient,
  input: LogClientCommunicationInput
): Promise<void> {
  try {
    const { error } = await admin.from('client_communications').insert({
      client_id: input.clientId,
      kind: input.kind,
      channel: input.channel ?? 'email',
      subject: input.subject ?? null,
      to_address: input.toAddress ?? null,
      meta: input.meta ?? {},
      sent_by: input.sentBy ?? null,
      sent_at: input.sentAt ?? new Date().toISOString(),
    })
    if (error) {
      console.error('[logClientCommunication] insert error:', error, 'kind:', input.kind, 'client:', input.clientId)
    }
  } catch (err) {
    console.error('[logClientCommunication] threw:', err, 'kind:', input.kind, 'client:', input.clientId)
  }
}
