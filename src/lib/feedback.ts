// Stage-keyed feedback capture helpers.
//
// Two-step permission flow:
//   1. captureFeedback() persists the response with permission_status='pending'
//   2. requestPermission() fires the consent email + flips to 'requested'
//   3. grantPermission(token) / denyPermission(token) called from email links
//   4. Only granted records are publishable on site / IG / sales pages

import { createAdminClient } from './supabase/admin'
import crypto from 'node:crypto'

export type FeedbackStage = 'scorecard' | 'challenge' | 'blueprint' | 'membership' | 'coaching' | 'churn'

export interface CaptureFeedbackInput {
  stage: FeedbackStage
  moment: string // e.g. 'scorecard_result', 'day14_report', 'day21_email_nps'
  leadId?: string | null
  clientId?: string | null
  challengeEnrollmentId?: string | null
  accuracyScore?: number | null
  npsScore?: number | null
  responseText?: string | null
  firstName?: string | null
  lastInitial?: string | null
  source?: string | null
  userAgent?: string | null
  ipHash?: string | null
}

export async function captureFeedback(input: CaptureFeedbackInput): Promise<{ ok: true; id: string; permissionToken: string } | { ok: false; error: string }> {
  const admin = createAdminClient()

  const permissionToken = generatePermissionToken()

  const { data, error } = await admin
    .from('feedback_responses')
    .insert({
      stage: input.stage,
      moment: input.moment,
      lead_id: input.leadId ?? null,
      client_id: input.clientId ?? null,
      challenge_enrollment_id: input.challengeEnrollmentId ?? null,
      accuracy_score: input.accuracyScore ?? null,
      nps_score: input.npsScore ?? null,
      response_text: input.responseText ?? null,
      first_name: input.firstName ?? null,
      last_initial: input.lastInitial ?? null,
      permission_status: 'pending',
      permission_token: permissionToken,
      source: input.source ?? null,
      user_agent: input.userAgent ?? null,
      ip_hash: input.ipHash ?? null,
    })
    .select('id, permission_token')
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'insert failed' }
  }

  return { ok: true, id: data.id, permissionToken: data.permission_token as string }
}

export function generatePermissionToken(): string {
  return crypto.randomBytes(24).toString('hex')
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null
  return crypto.createHash('sha256').update(ip).digest('hex')
}

/**
 * Marks a feedback record as having had its consent email sent.
 * Caller is responsible for actually sending the email.
 */
export async function markPermissionRequested(id: string): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('feedback_responses')
    .update({ permission_status: 'requested', permission_requested_at: new Date().toISOString() })
    .eq('id', id)
    .eq('permission_status', 'pending') // idempotent: only flip if still pending
}

export async function grantPermission(token: string, publishAs: 'first_name' | 'first_last_initial' | 'anonymous' = 'first_last_initial'): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('feedback_responses')
    .update({
      permission_status: 'granted',
      permission_granted_at: new Date().toISOString(),
      publish_as: publishAs,
    })
    .eq('permission_token', token)
    .in('permission_status', ['pending', 'requested'])
    .select('id')
    .single()
  if (error || !data) {
    return { ok: false, error: error?.message ?? 'token not found or already actioned' }
  }
  return { ok: true, id: data.id as string }
}

export async function denyPermission(token: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('feedback_responses')
    .update({
      permission_status: 'denied',
      permission_denied_at: new Date().toISOString(),
    })
    .eq('permission_token', token)
    .in('permission_status', ['pending', 'requested'])
    .select('id')
    .single()
  if (error || !data) {
    return { ok: false, error: error?.message ?? 'token not found or already actioned' }
  }
  return { ok: true, id: data.id as string }
}

export async function withdrawPermission(token: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('feedback_responses')
    .update({
      permission_status: 'withdrawn',
    })
    .eq('permission_token', token)
    .eq('permission_status', 'granted')
    .select('id')
    .single()
  if (error || !data) {
    return { ok: false, error: error?.message ?? 'token not found or not currently granted' }
  }
  return { ok: true, id: data.id as string }
}
