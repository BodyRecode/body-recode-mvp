/**
 * A coach asking their own client for a testimonial, and holding the answer.
 *
 * WHY THIS IS NOT A NEW TABLE. The permission-to-publish machinery already
 * exists on feedback_responses: a one-time token, a granted/denied state, and
 * the client's own choice of how to be named. A second, parallel version of
 * consent is how a product ends up with two answers to "may we use this", and
 * the wrong one gets read. A coach testimonial is a feedback row with
 * stage='coaching' and moment='coach_request'.
 *
 * WHAT IS DIFFERENT FROM THE FUNNEL FLOW. There, feedback is captured in
 * passing and consent is asked for a day later, because the person did not know
 * they were writing a testimonial. Here they do: the coach asked. So it is ONE
 * step — they write it and choose their name on the same page — and the row is
 * created already in 'requested'.
 *
 * SCOPE. Every read here is filtered to the coach's own clients. The owner sees
 * all of them. Nothing in this file trusts an id passed in from a page.
 */

import { createAdminClient } from './supabase/admin'
import { generatePermissionToken } from './feedback'
import type { CoachScope } from './coach-scope'
import { coachFilter } from './coach-scope'
import { coach } from '@/config/tenant'

export type TestimonialState = 'waiting' | 'received' | 'declined'

export interface CoachTestimonial {
  id: string
  clientId: string
  clientName: string
  askedAt: string
  answeredAt: string | null
  state: TestimonialState
  /** Their words. Null until they answer. */
  quote: string | null
  /** How they asked to be named. Null until they answer. */
  attribution: string | null
  /** The quote with the name applied, ready to be used as it stands. */
  asPublished: string | null
}

const MOMENT = 'coach_request'

function attributionLine(publishAs: string | null, firstName: string | null, lastInitial: string | null): string {
  if (publishAs === 'anonymous' || !firstName) return 'Anonymous'
  if (publishAs === 'first_name') return firstName
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName
}

/**
 * Ask one client. Returns the existing ask rather than creating a second one,
 * because two live links for the same person is a way to get two answers and
 * no way to know which one they meant.
 */
export async function requestTestimonial(clientId: string): Promise<
  { ok: true; id: string; token: string; alreadyAsked: boolean } | { ok: false; error: string }
> {
  const admin = createAdminClient()

  // clients has `name`, NOT `first_name`. Checked against the database rather
  // than assumed, after writing it the wrong way first.
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, ended_at')
    .eq('id', clientId)
    .maybeSingle()
  if (!client) return { ok: false, error: 'client not found' }
  if (!client.email) return { ok: false, error: 'this client has no email address on file' }

  const { data: open } = await admin
    .from('feedback_responses')
    .select('id, permission_token, permission_status')
    .eq('client_id', clientId)
    .eq('moment', MOMENT)
    .in('permission_status', ['requested', 'granted'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (open?.permission_token) {
    return { ok: true, id: open.id as string, token: open.permission_token as string, alreadyAsked: true }
  }

  const token = generatePermissionToken()
  const name = ((client.name as string | null) ?? '').trim()
  const parts = name.split(/\s+/).filter(Boolean)
  const firstName = parts[0] ?? null
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] : null

  const { data: created, error } = await admin
    .from('feedback_responses')
    .insert({
      client_id: clientId,
      stage: 'coaching',
      moment: MOMENT,
      first_name: firstName,
      last_initial: lastInitial,
      permission_status: 'requested',
      permission_token: token,
      permission_requested_at: new Date().toISOString(),
      source: 'coach_request',
    })
    .select('id')
    .single()

  if (error || !created) return { ok: false, error: error?.message ?? 'could not create the request' }
  return { ok: true, id: created.id as string, token, alreadyAsked: false }
}

/** Every testimonial this coach has asked for. The owner sees all of them. */
export async function coachTestimonials(scope: CoachScope): Promise<CoachTestimonial[]> {
  const admin = createAdminClient()

  const onlyMine = coachFilter(scope)
  let clientQuery = admin.from('clients').select('id, name')
  if (onlyMine) clientQuery = clientQuery.eq('coach_id', onlyMine)
  const { data: clients } = await clientQuery
  const names = new Map<string, string>((clients ?? []).map(c => [c.id as string, (c.name as string) || 'Unnamed client']))
  if (names.size === 0) return []

  const { data } = await admin
    .from('feedback_responses')
    .select('id, client_id, created_at, response_text, permission_status, permission_granted_at, permission_denied_at, publish_as, first_name, last_initial')
    .eq('moment', MOMENT)
    .in('client_id', [...names.keys()])
    .order('created_at', { ascending: false })

  return (data ?? []).map(r => {
    const status = r.permission_status as string
    const state: TestimonialState =
      status === 'granted' ? 'received'
      : status === 'denied' || status === 'withdrawn' ? 'declined'
      : 'waiting'
    const quote = state === 'received' ? ((r.response_text as string | null) ?? null) : null
    const who = attributionLine(r.publish_as as string | null, r.first_name as string | null, r.last_initial as string | null)
    return {
      id: r.id as string,
      clientId: r.client_id as string,
      clientName: names.get(r.client_id as string) ?? 'Unnamed client',
      askedAt: r.created_at as string,
      answeredAt: (r.permission_granted_at ?? r.permission_denied_at) as string | null,
      state,
      quote,
      attribution: state === 'received' ? who : null,
      asPublished: quote ? `"${quote}"\n\n— ${who}` : null,
    }
  })
}

/** What the client sees when they open their link, before they write anything. */
export async function testimonialAsk(token: string): Promise<
  { ok: true; firstName: string; coachName: string; alreadyAnswered: boolean } | { ok: false; error: string }
> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('feedback_responses')
    .select('id, client_id, first_name, permission_status')
    .eq('permission_token', token)
    .eq('moment', MOMENT)
    .maybeSingle()
  if (!data) return { ok: false, error: 'This link is not valid any more.' }

  // The coach's name comes from the tenant config, which is where every other
  // client-facing email gets it. THERE IS NO PER-COACH DISPLAY NAME ANYWHERE IN
  // THE DATABASE: I wrote a lookup against a coach_profiles table, checked, and
  // it does not exist. Worth fixing before a second coach's client reads this
  // page and is greeted by the wrong person's name. Flagged 23 Sep 2026.
  const coachName = coach().firstName

  return {
    ok: true,
    firstName: (data.first_name as string | null) ?? 'there',
    coachName,
    alreadyAnswered: data.permission_status === 'granted' || data.permission_status === 'denied',
  }
}

/** They wrote it and chose their name. One step, because they knew what it was for. */
export async function submitTestimonial(
  token: string,
  text: string,
  publishAs: 'first_name' | 'first_last_initial' | 'anonymous',
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = text.trim()
  if (trimmed.length < 10) return { ok: false, error: 'Please write a little more.' }

  const admin = createAdminClient()
  const { data } = await admin
    .from('feedback_responses')
    .select('id, permission_status')
    .eq('permission_token', token)
    .eq('moment', MOMENT)
    .maybeSingle()
  if (!data) return { ok: false, error: 'This link is not valid any more.' }
  if (data.permission_status === 'granted' || data.permission_status === 'denied') {
    return { ok: false, error: 'This one has already been answered.' }
  }

  const { error } = await admin
    .from('feedback_responses')
    .update({
      response_text: trimmed,
      publish_as: publishAs,
      permission_status: 'granted',
      permission_granted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** They would rather not. Recorded, so nobody asks them again. */
export async function declineTestimonial(token: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('feedback_responses')
    .update({
      permission_status: 'denied',
      permission_denied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('permission_token', token)
    .eq('moment', MOMENT)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
