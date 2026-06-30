// GET /api/feedback/consent/[token] - returns the response preview for the consent landing page
// POST /api/feedback/consent/[token] - body { action: 'grant' | 'deny', publishAs?: 'first_name' | 'first_last_initial' | 'anonymous' }
//
// Public endpoints, no auth - the token IS the auth. Tokens are 48 hex chars (~190 bits of entropy).

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { grantPermission, denyPermission } from '@/lib/feedback'

export async function GET(_request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  if (!token || token.length < 24) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
  }
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('feedback_responses')
    .select('id, stage, moment, response_text, accuracy_score, nps_score, first_name, last_initial, permission_status, permission_granted_at, permission_denied_at')
    .eq('permission_token', token)
    .single()
  if (error || !data) {
    return NextResponse.json({ error: 'token_not_found' }, { status: 404 })
  }
  return NextResponse.json(data)
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  if (!token || token.length < 24) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
  }
  let body: { action?: string; publishAs?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  if (body.action === 'grant') {
    const publishAs = (body.publishAs ?? 'first_last_initial') as 'first_name' | 'first_last_initial' | 'anonymous'
    if (!['first_name','first_last_initial','anonymous'].includes(publishAs)) {
      return NextResponse.json({ error: 'invalid_publish_as' }, { status: 400 })
    }
    const r = await grantPermission(token, publishAs)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 404 })
    return NextResponse.json({ ok: true, id: r.id, status: 'granted', publishAs })
  }
  if (body.action === 'deny') {
    const r = await denyPermission(token)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 404 })
    return NextResponse.json({ ok: true, id: r.id, status: 'denied' })
  }
  return NextResponse.json({ error: 'invalid_action' }, { status: 400 })
}
