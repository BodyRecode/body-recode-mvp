import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSms, formatPhone } from '@/lib/twilio'
import { logClientCommunication } from '@/lib/client-communications'
import { parsePrescribedSessions, todayBrisbaneDayName } from '@/lib/workout-logging'

/**
 * SMS reminder for Greg's standing in-person sessions with Kade.
 *
 * Greg trains face-to-face with Kade on a fixed weekly schedule:
 *   Mon 2:00pm, Wed 2:00pm, Fri 9:00am (Australia/Brisbane).
 * He wants a text 30 minutes before each one, so this fires at:
 *   Mon 1:30pm, Wed 1:30pm, Fri 8:30am Brisbane.
 *
 * Brisbane is UTC+10 with no daylight saving, so the vercel.json crons are:
 *   "30 3 * * 1,3"  -> 03:30 UTC Mon/Wed = 13:30 Brisbane (Mon/Wed sessions)
 *   "30 22 * * 4"   -> 22:30 UTC Thu     = 08:30 Fri Brisbane (Fri session)
 * Both crons point at this same path (Vercel allows one path with multiple
 * schedules; the x-vercel-cron-schedule header says which one fired).
 *
 * This is deliberately a standing per-client reminder, NOT the event-driven
 * session-reminders cron (which emails ~24h before rows in client_sessions).
 * Greg has no session rows; his schedule is fixed, so we drive it off the clock.
 *
 * Each send is written fresh by Claude so the text never repeats and can nod to
 * what Greg is actually training that day. If generation fails for any reason we
 * fall back to a fixed, coach-approved line so a text always goes out.
 *
 * SMS goes out on our one-way alphanumeric sender ("BodyRecode") — Greg cannot
 * reply, so the message carries no reply CTA. A dedup guard prevents a double
 * fire from texting twice.
 */

// Greg McDonald — looked up once from clients.name. Phone is fetched fresh at
// runtime by id, so a number change in the DB is picked up automatically.
const GREG_CLIENT_ID = '027cabc0-42ef-4b1e-b9b7-c7827ba113e1'

// Kade's "about Greg" colour — the human context the database doesn't hold
// (personality, what motivates him, banter level, in-jokes, no-go topics).
// Fed to Claude on every send so the texts stay in character.
const GREG_PROFILE = `Greg is no-nonsense and doesn't like to stuff around, so keep it short and get straight to the point.
He likes a laugh though, so a bit of light, easy humour lands well (never forced or corny).
He's not chasing numbers in the gym. He trains to feel good and to get some balance against a stressful project he's building: a golf simulator. An occasional, natural nod to the golf sim, or to stepping away from a stressful build, works nicely, but don't force it into every message.
The deeper why: he works hard and often gets mentally drained to the point of feeling fried and over it. These three sessions matter because they're HIS - a reset and some headspace, an hour that's just for him away from the pressure. Lean into that framing when it fits: this is your time, your reset, one thing today that's just for you, step away and come back clearer.
Keep it light, warm and affirming. Do NOT name stress, burnout, mental health, or how he might be feeling directly, and never sound like therapy or a wellness app. Just quietly make the session feel like the good, restoring part of his day.
Keep the energy relaxed and human, not intense or hype.`

// Coach-approved line used verbatim if AI generation fails or looks off, so a
// text always goes out.
function fallbackMessage(firstName: string): string {
  return `Hi ${firstName}, you're on with Kade in 30 minutes at AF Newstead. Come ready to work, see you there.`
}

/**
 * Pull the safe, motivating slice of Greg's active program: his training goal,
 * current block, and (if today lines up with a prescribed day) what he's
 * training. Deliberately excludes anything sensitive (weights, measurements,
 * numbers) — only the kind of detail that reads well on a lock screen.
 */
async function trainingContext(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  const { data: program } = await admin
    .from('programs')
    .select('training_goal, block_name, sessions')
    .eq('client_id', GREG_CLIENT_ID)
    .eq('is_active', true)
    .maybeSingle()

  if (!program) return ''

  const lines: string[] = []
  if (program.training_goal) lines.push(`Training goal: ${program.training_goal}`)
  if (program.block_name) lines.push(`Current block: ${program.block_name}`)

  // Does today (Brisbane) match one of his prescribed sessions? If so, name the
  // focus so the text can nod to it. "Day 1/2/3" style labels won't match a
  // weekday, which is the safe default — the model just stays general.
  const today = todayBrisbaneDayName().toLowerCase()
  const sessions = parsePrescribedSessions(program.sessions)
  const todaySession = sessions.find(s => {
    const label = s.day_label.toLowerCase()
    return label.includes(today) || today.includes(label)
  })
  if (todaySession) {
    if (todaySession.skeleton) {
      lines.push(`Today's session: ${todaySession.skeleton}`)
    } else if (todaySession.flatExercises.length > 0) {
      const names = todaySession.flatExercises.slice(0, 3).map(e => e.exercise.exercise_name)
      lines.push(`Today's main work: ${names.join(', ')}`)
    }
  }

  return lines.join('\n')
}

/** Ask Claude for a fresh, personal reminder. Returns null on any failure. */
async function generateMessage(firstName: string, context: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2 })

  const system = `You write a single SMS reminder from Body Recode, sent to ${firstName} 30 minutes before his in-person training session with his coach Kade at AF Newstead gym.

Voice: warm, human, and quietly motivating — like a coach who knows him and is glad he's coming in. Energising, never corny or salesy.

HARD RULES:
- One or two short sentences. Keep it under ~200 characters (a single SMS).
- Address him as ${firstName}. Make clear the session is in 30 minutes and it's with Kade. You may mention AF Newstead.
- This is a one-way sender: he cannot reply. NEVER include a reply call to action ("reply", "text back", "let me know", "confirm").
- No em dashes. No hashtags. No emojis.
- Only use details that appear in the context below. NEVER invent exercises, personal bests, numbers, or facts.
- Never mention weight, body measurements, calories, or any health or medical detail.
- If little context is given, keep it warm and general rather than making something up.
Output ONLY the message text, nothing else.`

  const parts: string[] = [`His name: ${firstName}`]
  if (GREG_PROFILE.trim()) parts.push(`About ${firstName} (from his coach):\n${GREG_PROFILE.trim()}`)
  if (context.trim()) parts.push(`Today's training context (safe to reference lightly):\n${context.trim()}`)
  parts.push(`Write today's reminder. Make it feel personal and specific to what's above, and phrase it differently from a generic template. Variation seed: ${Math.floor(Math.random() * 100000)}.`)

  try {
    const resp = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      temperature: 1,
      system,
      messages: [{ role: 'user', content: parts.join('\n\n') }],
    })
    const raw = resp.content.find(b => b.type === 'text')?.text ?? ''
    return sanitize(raw)
  } catch (e) {
    console.error('[greg-session-reminder] generation failed:', e)
    return null
  }
}

/** Tidy the model output and reject anything that looks wrong (→ fallback). */
function sanitize(raw: string): string | null {
  let text = raw.trim()
  // Take the first non-empty line and strip any wrapping quotes.
  text = (text.split('\n').find(l => l.trim().length > 0) ?? '').trim()
  text = text.replace(/^["'“”]+|["'“”]+$/g, '').trim()
  // Belt-and-braces: no em dashes on any Body Recode copy.
  text = text.replace(/\s*[—–]\s*/g, ', ')
  if (text.length < 15 || text.length > 300) return null
  // Reject a reply CTA slipping through (one-way sender).
  if (/\b(reply|text back|respond|confirm|let me know)\b/i.test(text)) return null
  return text
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: greg } = await admin
    .from('clients')
    .select('id, name, phone')
    .eq('id', GREG_CLIENT_ID)
    .maybeSingle()

  if (!greg?.phone) {
    return NextResponse.json({ sent: 0, reason: 'no-phone' })
  }

  // Dedup: skip if we already sent this reminder in the last ~25 minutes
  // (guards against a retry / double fire on the same schedule tick).
  const since = new Date(Date.now() - 25 * 60 * 1000).toISOString()
  const { count: recent } = await admin
    .from('client_communications')
    .select('id', { head: true, count: 'exact' })
    .eq('client_id', greg.id)
    .eq('kind', 'in_person_session_reminder')
    .eq('channel', 'sms')
    .gte('sent_at', since)

  if ((recent ?? 0) > 0) {
    return NextResponse.json({ sent: 0, reason: 'already-sent' })
  }

  const firstName = greg.name.split(' ')[0]
  const context = await trainingContext(admin)
  const generated = await generateMessage(firstName, context)
  const message = generated ?? fallbackMessage(firstName)

  await sendSms({ to: formatPhone(greg.phone), message })
  await logClientCommunication(admin, {
    clientId: greg.id,
    kind: 'in_person_session_reminder',
    channel: 'sms',
    subject: null,
    toAddress: greg.phone,
    meta: {
      trigger: 'cron',
      schedule: request.headers.get('x-vercel-cron-schedule') ?? null,
      generated: generated != null,
    },
  })

  return NextResponse.json({ sent: 1, generated: generated != null })
}
