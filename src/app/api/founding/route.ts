import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  typeFatMapProfile, leadDescriptor,
  type Profile, type AgeBand, type FatStorage, type CycleStatus, type StorageDirection,
} from '@/lib/fat-map-profile'
import { ALLOWED, stateFor, stateDescription, type SectionKey, type TrainingStatus } from '@/lib/rey-founding'
import { sendFoundingConfirmationEmail } from '@/lib/rey-founding-email'

/**
 * The Rey price test (bodyrecode.au/founding).
 *
 *   action 'result'   her answers in, her result out. Writes saw_price_at,
 *                     because the price is on her screen the moment this
 *                     returns. That write is the denominator of the pass mark.
 *   action 'respond'  her reaction to the price, and/or joining the list.
 *                     Matched on the token handed back with her result, never
 *                     on email, so nobody can join someone else up.
 *
 * Deliberately not the leads table: nothing here enters the scorecard email
 * sequence, the Booking Agent or the Pipeline. An existing lead is linked by
 * email so Kade can see the overlap, and that is all.
 */

const KEYS: SectionKey[] = ['01', '02', '03', '04', '05']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const pick = (v: unknown, allowed: string[]): string | null =>
  typeof v === 'string' && allowed.includes(v) ? v : null

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const db = createAdminClient()

  if (body.action === 'respond') {
    const token = typeof body.token === 'string' ? body.token : ''
    if (!/^[0-9a-f-]{36}$/i.test(token)) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

    const { data: row, error: readErr } = await db
      .from('rey_founding_interest')
      .select('id, email, first_name, joined_at, confirmation_sent_at')
      .eq('token', token)
      .maybeSingle()
    if (readErr) return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    if (!row) return NextResponse.json({ error: 'We could not find your result. Please take it again.' }, { status: 404 })

    const now = new Date().toISOString()
    const update: Record<string, unknown> = { updated_at: now }
    const reaction = pick(body.price_reaction, ALLOWED.reaction)
    if (reaction) { update.price_reaction = reaction; update.price_reaction_at = now }
    const joining = body.join === true && !row.joined_at
    if (joining) update.joined_at = now

    const { error: writeErr } = await db.from('rey_founding_interest').update(update).eq('id', row.id)
    if (writeErr) return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })

    if (joining && !row.confirmation_sent_at) {
      const sent = await sendFoundingConfirmationEmail(row.email, row.first_name)
      if (sent.ok) {
        await db.from('rey_founding_interest').update({ confirmation_sent_at: new Date().toISOString() }).eq('id', row.id)
      } else {
        console.error('[founding] confirmation email failed:', row.id, sent.error)
      }
    }
    return NextResponse.json({ ok: true, joined: joining || !!row.joined_at })
  }

  if (body.action !== 'result') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const firstName = typeof body.first_name === 'string' ? body.first_name.trim().slice(0, 80) : ''
  if (!EMAIL_RE.test(email) || !firstName) {
    return NextResponse.json({ error: 'Please add your first name and a valid email.' }, { status: 400 })
  }

  const training = pick(body.training_status, ALLOWED.training) as TrainingStatus | null
  const rawScores = (body.section_scores ?? {}) as Record<string, unknown>
  const scores = Object.fromEntries(KEYS.map(k => [k, rawScores[k]])) as Record<SectionKey, number>
  if (!training || KEYS.some(k => ![1, 2, 3].includes(scores[k]))) {
    return NextResponse.json({ error: 'Please answer every question.' }, { status: 400 })
  }

  const sex = pick(body.biological_sex, ALLOWED.sex) as 'M' | 'F' | null
  const age = pick(body.age_band, ALLOWED.age) as AgeBand | null
  const storage = pick(body.fat_storage, ALLOWED.storage) as FatStorage | null
  const direction = (sex === 'F' ? pick(body.storage_direction, ALLOWED.direction) : null) as StorageDirection | null
  const cycle = (sex === 'F' ? pick(body.cycle_status, ALLOWED.cycle) : null) as CycleStatus | null
  const start = pick(body.start_timing, ALLOWED.start)
  const spent = pick(body.spent_last_year, ALLOWED.spent)
  const where = pick(body.train_where, ALLOWED.where)
  const voice = pick(body.voice_coach, ALLOWED.voice)
  if (!sex || !age || !storage || !start || !spent || !where || !voice || (sex === 'F' && (!direction || !cycle))) {
    return NextResponse.json({ error: 'Please answer every question.' }, { status: 400 })
  }

  const total = KEYS.reduce((n, k) => n + scores[k], 0)
  const state = stateFor(total)
  const { profile, confidence } = typeFatMapProfile(scores, state, {
    sex,
    ageBand: age,
    fatStorage: storage,
    cycleStatus: cycle,
    storageDirection: direction,
  })

  // ilike for case, with its wildcards escaped: an underscore is common in emails.
  const { data: lead } = await db.from('leads').select('id').ilike('email', email.replace(/[\\%_]/g, c => `\\${c}`)).limit(1).maybeSingle()
  const { data: existing } = await db
    .from('rey_founding_interest')
    .select('id, attempts, saw_price_at')
    .eq('email', email)
    .maybeSingle()

  const now = new Date().toISOString()
  const answers = {
    email,
    first_name: firstName,
    lead_id: lead?.id ?? null,
    source: typeof body.source === 'string' ? body.source.slice(0, 80) : null,
    training_status: training,
    section_scores: scores,
    score: total,
    body_state: state,
    biological_sex: sex,
    age_band: age,
    fat_storage: storage,
    storage_direction: direction,
    cycle_status: cycle,
    profile,
    profile_confidence: confidence,
    start_timing: start,
    spent_last_year: spent,
    train_where: where,
    voice_coach: voice,
    updated_at: now,
  }

  // A retake keeps the first moment she saw the price and whether she joined;
  // it refreshes her answers.
  const write = existing
    ? db.from('rey_founding_interest')
        .update({ ...answers, attempts: (existing.attempts ?? 1) + 1, saw_price_at: existing.saw_price_at ?? now })
        .eq('id', existing.id)
        .select('token, joined_at')
        .single()
    : db.from('rey_founding_interest')
        .insert({ ...answers, saw_price_at: now })
        .select('token, joined_at')
        .single()
  const { data: saved, error: saveErr } = await write
  if (saveErr || !saved) {
    console.error('[founding] save failed:', saveErr)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  const named = profile !== 'Indeterminate'
  return NextResponse.json({
    token: saved.token,
    already_joined: !!saved.joined_at,
    score: total,
    body_state: state,
    state_description: stateDescription(state, training),
    profile: named ? profile : null,
    profile_confidence: named ? confidence : null,
    profile_descriptor: named ? leadDescriptor(profile as Profile, { storageDirection: direction }) : null,
  })
}
