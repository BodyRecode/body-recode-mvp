// ManyChat → lead. The missing half of comment-to-DM.
//
// The comment-to-DM flows have captured email addresses since 7 August and
// every one of them stopped inside ManyChat. Across 125 leads, none had ever
// arrived from a DM: the flow replies, delivers the guide and asks for an
// address, and then that address sits in a ManyChat contact record that nothing
// here can see. No lead, no welcome email, no dashboard row.
//
// This is the endpoint ManyChat calls at the end of a flow, via an External
// Request step, so a DM capture becomes a real lead like any other signup.
//
// SOURCE. The lead source stays 'instagram', because that is where the person
// actually came from, and the DB CHECK constraint on leads.source does not carry
// a manychat value. The keyword goes in source_detail as "manychat · HORMONES",
// which is what makes it attributable per flow.
//
// AUTH. A shared secret in the x-manychat-secret header, compared against
// MANYCHAT_WEBHOOK_SECRET. ManyChat cannot sign a request the way Stripe or
// Calendly do, so a secret header is the available option. Without the env var
// set the route refuses everything rather than running open.
//
// CONSENT. "Want me to email you a copy" is consent to send the copy. It is not
// consent to add somebody to a marketing list, and Australian spam rules care
// about the difference. This route records the lead and the keyword. It does NOT
// subscribe anyone to anything, and nothing here should start doing so quietly.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getDefaultCoachId } from '@/lib/default-coach'

export const runtime = 'nodejs'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  const secret = process.env.MANYCHAT_WEBHOOK_SECRET?.trim()
  if (!secret) {
    return NextResponse.json(
      { error: 'not_configured', message: 'MANYCHAT_WEBHOOK_SECRET is not set, so this route refuses everything rather than accepting unauthenticated writes.' },
      { status: 503 })
  }
  if (request.headers.get('x-manychat-secret')?.trim() !== secret) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }) }

  const email = String(body.email ?? '').trim().toLowerCase()
  const keyword = String(body.keyword ?? '').trim().toUpperCase() || 'UNKNOWN'
  // igUsername is read before name, because name falls back to it.
  // name is NOT NULL on leads, and ManyChat does not always have a first name.
  // Fall back to the handle, then to something honest rather than empty.
  const igUsername = String(body.ig_username ?? '').trim() || null
  const rawName = String(body.name ?? '').trim()
  const name = rawName || (igUsername ? `@${igUsername}` : 'Instagram DM')

  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: 'bad_email', message: 'No usable email address in the request body.' }, { status: 400 })
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const detail = `manychat · ${keyword}${igUsername ? ` · @${igUsername}` : ''}`

  // Never create a second row for somebody we already know. A person who
  // comments on three posts across September is one lead, not three.
  const { data: existing } = await admin.from('leads').select('id, source_detail').eq('email', email).maybeSingle()

  if (existing) {
    const already = String(existing.source_detail ?? '')
    const merged = already.includes(keyword) ? already : [already, detail].filter(Boolean).join(' | ')
    await admin.from('leads').update({ source_detail: merged }).eq('id', existing.id)
    await admin.from('lead_events').insert({
      lead_id: existing.id, type: 'manychat_keyword',
      subject: `Commented ${keyword} on Instagram`,
      notes: `keyword:${keyword}${igUsername ? ` @${igUsername}` : ''} (already a lead)`,
    })
    return NextResponse.json({ ok: true, lead_id: existing.id, created: false })
  }

  const coachId = await getDefaultCoachId(admin)
  const { data: created, error } = await admin.from('leads').insert({
    coach_id: coachId, name, email, source: 'instagram', source_detail: detail,
    // 'new_check_in' is the first value in the leads_status_check constraint and
    // the same entry point every other public surface uses. There is no 'new'.
    status: 'new_check_in',
  }).select('id').single()

  if (error) {
    return NextResponse.json({ error: 'insert_failed', detail: error.message }, { status: 500 })
  }

  await admin.from('lead_events').insert({
    lead_id: created.id, type: 'manychat_keyword',
    subject: `Commented ${keyword} on Instagram`,
    notes: `keyword:${keyword}${igUsername ? ` @${igUsername}` : ''}`,
  })

  return NextResponse.json({ ok: true, lead_id: created.id, created: true })
}
