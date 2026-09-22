/**
 * A book of clients for the test coach, so the dashboard can be LOOKED AT.
 *
 * 22 September 2026. Kade, reviewing the palette pass: "test with clients
 * details and etc so i can look over it". One client tells you nothing about a
 * screen whose whole job is to show you a list and let your eye find the one
 * that needs you. A readiness colour only means something next to the other
 * three, and an attendance state only means something next to a client who is
 * fine.
 *
 * So this makes SIX, chosen to fill every state the dashboard can show rather
 * than to be realistic on their own:
 *
 *   - all three readiness levels, plus one with no reading at all
 *   - all four attendance states: steady, slipping, quiet, too_new
 *   - both sexes, because the product is universal even though the audience
 *     is not, and a book of six women would hide anything sex-keyed
 *   - one with a safety gate open, which is the state with the ring on it
 *
 * NOT REALISTIC DATA, AND DELIBERATELY SO: the readings are written by hand
 * rather than generated, so nothing here says anything about whether the engine
 * is any good. It is scaffolding for looking at a screen. `wipe` removes every
 * one of them.
 */

import { readFileSync } from 'fs'
import { join } from 'path'

for (const line of readFileSync(join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { INTAKE_SECTIONS } from '../src/lib/intake-questions'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const COACH_EMAIL = 'testcoach@bodyrecode.au'
/** Every address here, so `wipe` can find them all without guessing. */
const DOMAIN = '@testbook.bodyrecode.au'

const days = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

type Person = {
  name: string
  sex: 'male' | 'female'
  dob: string
  height: number
  startedDaysAgo: number
  /** How long since their last check-in. null means they have never sent one. */
  lastCheckinDaysAgo: number | null
  readiness: 'Remediation' | 'Optimisation' | 'Post-Optimisation' | null
  pattern: string | null
  goal: string
  note: string
  /**
   * NOTE FOR ANYONE WRITING TO cffs: `pattern_classification` stores the
   * CLIENT-FACING LABEL, not the database slug. The check constraint allows
   * Stress-Stored, Insulin-Drift, Estrogen-Shift, Androgen-Decline and
   * Indeterminate. The slugs (stress-stored, metabolic-drift, hormonal-shift,
   * system-overload) live elsewhere and are rejected here.
   */
  /** Opens the safety gate, which is the state that carries the ring. */
  gateOpen?: boolean
  /** Capacity, Schedule, Regulation, Behaviour. Green / Amber / Red. */
  signals: [string, string, string, string]
  guardrail: string
}

const BOOK: Person[] = [
  {
    name: 'Alison Whelan', sex: 'female', dob: '1981-03-14', height: 166,
    startedDaysAgo: 96, lastCheckinDaysAgo: 3,
    readiness: 'Remediation', pattern: 'Stress-Stored',
    goal: 'Lose the weight around my middle and stop feeling wrecked by Wednesday',
    signals: ['Red', 'Amber', 'Red', 'Green'],
    guardrail: 'No added load while sleep is under six hours. Hold volume where it is and let recovery catch up before anything is increased.',
    note: 'The system is settling rather than building. Sleep has been under six hours for three weeks and recovery has not come back up between sessions.',
  },
  {
    name: 'Michael Tran', sex: 'male', dob: '1975-09-02', height: 179,
    startedDaysAgo: 74, lastCheckinDaysAgo: 5,
    readiness: 'Optimisation', pattern: 'Insulin-Drift',
    goal: 'Get back to the shape I was in before the business took over',
    signals: ['Green', 'Amber', 'Green', 'Amber'],
    guardrail: 'Capacity is there. The limiter is the calendar rather than the body.',
    note: 'Capacity is holding and recovery is keeping up with the load. There is room here, and the limiter is consistency rather than anything physiological.',
  },
  {
    name: 'Jordan Okafor', sex: 'male', dob: '1989-11-27', height: 183,
    startedDaysAgo: 188, lastCheckinDaysAgo: 4,
    readiness: 'Post-Optimisation', pattern: 'Stress-Stored',
    goal: 'Hold what I have built and stop yo-yoing every winter',
    signals: ['Green', 'Green', 'Green', 'Green'],
    guardrail: 'Nothing is asking for attention. Stability is the finding.',
    note: 'Established and stable across the last three reads. Nothing here is asking for attention, which is itself the finding.',
  },
  {
    name: 'Sarah Reid', sex: 'female', dob: '1968-06-08', height: 161,
    startedDaysAgo: 61, lastCheckinDaysAgo: 19,
    readiness: 'Remediation', pattern: 'Estrogen-Shift',
    goal: 'Feel like myself again',
    signals: ['Amber', 'Green', 'Red', 'Amber'],
    guardrail: 'Held. Nothing is read further until the open question has been answered by somebody qualified.',
    note: 'A question in the intake has not been answered by anybody qualified to answer it, so the read is held there rather than guessed past.',
    gateOpen: true,
  },
  {
    name: 'Priya Nair', sex: 'female', dob: '1993-01-30', height: 158,
    startedDaysAgo: 41, lastCheckinDaysAgo: 34,
    readiness: 'Optimisation', pattern: 'Stress-Stored',
    goal: 'Build strength without wrecking my sleep',
    signals: ['Amber', 'Red', 'Amber', 'Red'],
    guardrail: 'Nothing new has been reported for a month, so the picture is older than it looks.',
    note: 'Reads as capable, but there has been nothing new to read for a month.',
  },
  {
    name: 'Daniel Barnes', sex: 'male', dob: '1986-07-19', height: 176,
    startedDaysAgo: 9, lastCheckinDaysAgo: null,
    readiness: null, pattern: null,
    goal: 'Get a proper look at where I actually am',
    signals: ['Unknown', 'Unknown', 'Unknown', 'Unknown'],
    guardrail: '',
    note: '',
  },
]

const SECTION_BIAS: Record<string, number> = {
  fat_map: 2, injury: 1, training: 3, nutrition: 2, schedule: 2,
  sleep: 3, stress: 3, supplement: 1, health_screen: 0,
}

function answersFor(sectionId: string, salt: number): Record<string, number | string> {
  const section = INTAKE_SECTIONS.find(s => s.id === sectionId)
  if (!section) return {}
  const bias = SECTION_BIAS[sectionId] ?? 2
  const out: Record<string, number | string> = {}
  for (const q of section.questions) {
    if (q.type === 'scale') {
      const jitter = ((q.id.charCodeAt(q.id.length - 1) + salt) % 3) - 1
      out[q.id] = Math.max(0, Math.min(4, bias + jitter))
    } else if (q.type === 'checkbox') {
      out[q.id] = 'true'
    }
  }
  return out
}

function emailFor(name: string) {
  return name.toLowerCase().replace(/[^a-z]+/g, '.') + DOMAIN
}

async function coachId(): Promise<string | null> {
  const { data } = await admin.from('clients').select('coach_id').eq('email', 'testclient@bodyrecode.au').maybeSingle()
  if (data?.coach_id) return data.coach_id
  // Fall back to the auth id, which is what coach_id holds.
  for (let page = 1; page <= 200; page++) {
    const { data: list, error } = await admin.auth.admin.listUsers({ page, perPage: 5 })
    if (error) continue
    const users = list?.users ?? []
    const u = users.find(x => (x.email ?? '').toLowerCase() === COACH_EMAIL)
    if (u) return u.id
    if (users.length < 5) return null
  }
  return null
}

async function create() {
  const coach = await coachId()
  if (!coach) {
    console.log('\nNo test coach. Run npm run coach:test-create first.\n')
    process.exit(1)
  }

  let made = 0
  for (const [i, p] of BOOK.entries()) {
    const email = emailFor(p.name)
    const { data: existing } = await admin.from('clients').select('id').eq('email', email).maybeSingle()
    if (existing) { console.log(`  ${p.name} already there, skipped`); continue }

    const { data: client, error } = await admin.from('clients').insert({
      name: p.name,
      email,
      coach_id: coach,
      onboarding_token: randomUUID(),
      coaching_started_at: days(p.startedDaysAgo),
      active: true,
      session_type: i % 3 === 0 ? 'online' : 'in_person',
      height_cm: p.height,
      height_source: 'client',
      height_recorded_at: days(p.startedDaysAgo),
    }).select('id').single()
    if (error || !client) { console.log(`  ${p.name}: ${error?.message}`); continue }

    const { data: intake, error: ie } = await admin.from('intakes').insert({
      client_id: client.id,
      full_name: p.name,
      date_of_birth: p.dob,
      gender: p.sex,
      sex_at_birth: p.sex,
      occupation: 'Not stated',
      submitted_at: days(p.startedDaysAgo),
      primary_goal: p.goal,
      secondary_goals: 'Sleep better. Get stronger.',
      desired_timeline: '6 months',
      subjective_motivator: 'I want to stop guessing.',
      dietary_restrictions: 'None',
      dietary_preferences: 'None stated',
      typical_day_eating: 'Coffee, eggs, a salad at lunch, whatever is cooked at night.',
      meals_per_day: '3',
      fluid_intake: 'About 2 litres',
      caffeine_intake: '2 coffees before midday',
      training_days_available: ['monday', 'wednesday', 'friday', 'saturday'],
      period_pattern: p.sex === 'female' ? 'irregular' : null,
      hormone_therapy: 'no',
      hormonal_contraception: 'no',
      pregnant_or_postpartum: 'no',
      androgen_use: 'no',
      health_consent_at: days(p.startedDaysAgo),
      alcohol_intake: 'A few glasses most weeks',
      vitality_energy: 2, vitality_drive: 2, vitality_libido: 2, vitality_recovery: 2,
      storage_direction: 'more_middle',
      injury_location_current: [],
      injury_location_history: [],
      fat_map_responses: answersFor('fat_map', i),
      injury_responses: answersFor('injury', i),
      training_responses: answersFor('training', i),
      nutrition_responses: answersFor('nutrition', i),
      schedule_responses: answersFor('schedule', i),
      sleep_responses: answersFor('sleep', i),
      stress_responses: answersFor('stress', i),
      supplement_responses: answersFor('supplement', i),
      final_disclosure: 'true', final_system_alignment: 'true', final_accuracy: 'true',
    }).select('id').single()
    if (ie) { console.log(`  ${p.name} intake: ${ie.message}`); await admin.from('clients').delete().eq('id', client.id); continue }

    if (p.readiness) {
      const { error: ce } = await admin.from('cffs').insert({
        client_id: client.id,
        intake_id: intake?.id ?? null,
        generated_at: days(p.startedDaysAgo - 1),
        body_state_classification: p.readiness,
        pattern_classification: p.pattern,
        client_context_summary: p.note,
        cr_where_you_are: p.note,
        client_reading_generated_at: days(p.startedDaysAgo - 1),
        client_reading_published_at: days(p.startedDaysAgo - 1),
        client_reading_email_sent_at: days(p.startedDaysAgo - 1),
        client_opened_at: p.lastCheckinDaysAgo === null ? null : days(p.startedDaysAgo - 2),
        reassessment_flagged: p.gateOpen ?? false,
        // The four signals a coach reads at the top of a client's file. Left
        // at their 'Unknown' default the whole header renders grey, which
        // reads as a bland page rather than as missing data.
        exposure_readiness_capacity: p.signals[0],
        exposure_readiness_schedule: p.signals[1],
        exposure_readiness_regulation: p.signals[2],
        exposure_readiness_behaviour: p.signals[3],
        capacity_constraints_and_guardrails: p.guardrail,
        primary_patterns_and_signals: p.note,
      })
      if (ce) console.log(`  ${p.name} reading: ${ce.message}`)
    }

    if (p.lastCheckinDaysAgo !== null) {
      const weeks = Math.min(8, Math.floor((p.startedDaysAgo - p.lastCheckinDaysAgo) / 7) + 1)
      const rows = []
      for (let w = 0; w < weeks; w++) {
        rows.push({
          client_id: client.id,
          week_number: weeks - w,
          submitted_at: days(p.lastCheckinDaysAgo + w * 7),
        })
      }
      const { error: we } = await admin.from('weekly_checkins').insert(rows)
      if (we) console.log(`  ${p.name} check-ins: ${we.message}`)
    }

    made++
    console.log(`  ${p.name.padEnd(16)} ${(p.readiness ?? 'no reading').padEnd(18)} last check-in ${p.lastCheckinDaysAgo === null ? 'never' : p.lastCheckinDaysAgo + 'd ago'}`)
  }

  console.log(`\n${made} added. Sign in at /login as ${COACH_EMAIL}\n`)
}

async function wipe() {
  const { data } = await admin.from('clients').select('id, name').like('email', `%${DOMAIN}`)
  const ids = (data ?? []).map(c => c.id)
  if (ids.length === 0) { console.log('\nNothing to remove.\n'); return }
  await admin.from('weekly_checkins').delete().in('client_id', ids)
  await admin.from('cffs').delete().in('client_id', ids)
  await admin.from('intakes').delete().in('client_id', ids)
  await admin.from('clients').delete().in('id', ids)
  console.log(`\nRemoved ${ids.length}: ${(data ?? []).map(c => c.name).join(', ')}\n`)
}

const run = process.argv[2] === 'wipe' ? wipe : create
run().catch(e => { console.error(e); process.exit(1) })
