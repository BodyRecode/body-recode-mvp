/**
 * A client for the test coach, with a completed intake, so the product can be
 * walked end to end.
 *
 * Run:
 *   npm run coach:test-client          create her
 *   npm run coach:test-client -- onboard  agreement, health, baseline, bloods done
 *   npm run coach:test-client -- signin   a link that signs you in AS HER
 *   npm run coach:test-client -- wipe     remove her and everything she has
 *
 * WHY SHE IS INVENTED RATHER THAN COPIED. The obvious shortcut is to duplicate
 * a real client's intake. That would move a real woman's health information to
 * a second coach, which is the exact thing the whole day has been spent
 * preventing. Every answer here is generated from the question bank against a
 * described profile, so nothing about anybody real is touched.
 *
 * WHAT IS DELIBERATELY NOT DONE FOR YOU: the read. She arrives with a submitted
 * intake and nothing else, so the process Kade asked to walk, generate, review,
 * publish, notify, see it in her portal, is still his to walk.
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
const CLIENT_NAME = 'Test Client'
const CLIENT_EMAIL = 'testclient@bodyrecode.au'

/**
 * The profile the answers are generated against. Written as a real woman in the
 * audience rather than as noise, because a read built from random numbers tells
 * Kade nothing about whether the read is any good.
 *
 * Forty-four, perimenopausal, trains consistently, sleeps badly, high stress
 * load, weight stable for two years despite doing everything she is told. This
 * is the archetype the whole system exists for, so it is the right one to look
 * at first.
 */
const HIGH = 3 // most days
const MID = 2  // a few times a week
const LOW = 1  // occasionally

const SECTION_BIAS: Record<string, number> = {
  fat_map: MID,
  injury: LOW,
  training: HIGH,   // she turns up
  nutrition: MID,
  schedule: MID,
  sleep: HIGH,      // the limiter, deliberately
  stress: HIGH,     // and this
  supplement: LOW,
  health_screen: 0, // nothing flagged, so no referral hold on the first look
}

function answersFor(sectionId: string): Record<string, number | string> {
  const section = INTAKE_SECTIONS.find(s => s.id === sectionId)
  if (!section) return {}
  const bias = SECTION_BIAS[sectionId] ?? MID
  const out: Record<string, number | string> = {}
  for (const q of section.questions) {
    if (q.type === 'scale') {
      // A little variation around the bias so every answer is not identical,
      // which would read as a filled-in form rather than a person.
      const jitter = (q.id.charCodeAt(q.id.length - 1) % 3) - 1
      out[q.id] = Math.max(0, Math.min(4, bias + jitter))
    } else if (q.type === 'checkbox') {
      out[q.id] = 'true'
    }
  }
  return out
}

async function coachId(): Promise<string | null> {
  const { data } = await admin.from('tenant_config').select('coach_id, coach').limit(50)
  const row = (data ?? []).find(r => (r.coach as { email?: string })?.email === COACH_EMAIL)
  return (row?.coach_id as string) ?? null
}

async function create() {
  const coach = await coachId()
  if (!coach) {
    console.log('\nNo test coach. Run npm run coach:test-create first.\n')
    process.exit(1)
  }

  const { data: existing } = await admin.from('clients').select('id').eq('email', CLIENT_EMAIL).maybeSingle()
  if (existing) {
    console.log(`\nShe already exists. Remove her first with: npm run coach:test-client -- wipe\n`)
    return
  }

  const token = randomUUID()
  const { data: client, error } = await admin
    .from('clients')
    .insert({
      name: CLIENT_NAME,
      email: CLIENT_EMAIL,
      coach_id: coach,
      onboarding_token: token,
      coaching_started_at: new Date().toISOString(),
      active: true,
      session_type: 'online',
      height_cm: 166,
      height_source: 'client',
      height_recorded_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !client) throw new Error(`Could not create her: ${error?.message}`)

  const { error: intakeError } = await admin.from('intakes').insert({
    client_id: client.id,
    full_name: CLIENT_NAME,
    date_of_birth: '1982-04-11',
    gender: 'female',
    occupation: 'Operations manager',
    submitted_at: new Date().toISOString(),
    primary_goal: 'Lose body fat around my middle and stop feeling wrecked by Wednesday',
    secondary_goals: 'Sleep through the night. Get stronger.',
    desired_timeline: '6 months',
    subjective_motivator: 'I want to stop feeling like my body is working against me.',
    dietary_restrictions: 'None',
    dietary_preferences: 'No red meat more than twice a week',
    typical_day_eating: 'Coffee, yoghurt and berries, chicken salad, whatever the kids are having, chocolate after dinner.',
    meals_per_day: '3',
    fluid_intake: 'About 1.5 litres',
    caffeine_intake: '2 coffees, both before 10am',
    training_days_available: ['monday', 'tuesday', 'thursday', 'saturday'],
    sex_at_birth: 'female',
    // Perimenopausal, which is 60 per cent of the real audience.
    period_pattern: 'irregular',
    hormone_therapy: 'no',
    hormonal_contraception: 'no',
    pregnant_or_postpartum: 'no',
    androgen_use: 'no',
    health_consent_at: new Date().toISOString(),
    alcohol_intake: 'Two or three glasses of wine most weeks',
    vitality_energy: 2,
    vitality_drive: 2,
    vitality_libido: 1,
    vitality_recovery: 1,
    storage_direction: 'more_middle',
    injury_location_current: [],
    injury_location_history: ['knee'],
    fat_map_responses: answersFor('fat_map'),
    injury_responses: answersFor('injury'),
    training_responses: answersFor('training'),
    nutrition_responses: answersFor('nutrition'),
    schedule_responses: answersFor('schedule'),
    sleep_responses: answersFor('sleep'),
    stress_responses: answersFor('stress'),
    supplement_responses: answersFor('supplement'),
    final_disclosure: 'true',
    final_system_alignment: 'true',
    final_accuracy: 'true',
  })

  if (intakeError) {
    await admin.from('clients').delete().eq('id', client.id)
    throw new Error(`Her intake would not save, so she was removed again: ${intakeError.message}`)
  }

  console.log(`
A client is waiting for the test coach.

  ${CLIENT_NAME}, 44, online
  Her intake is submitted. Nothing else has been done for you.

WHO SHE IS, so you can judge whether the read is any good:
  Trains four days and turns up. Sleeps badly. High stress load.
  Weight has not moved in two years while she has done everything asked.
  Nothing flagged on the health screen, so no referral hold on this first look.

WALK IT FROM HERE:
  1. Open her from Clients. Check the tabs: no Training, Nutrition, Direction,
     Daily Sequences, Recovery or Supplements. That is the product line.
  2. Generate her read. It should refuse rather than save if it breaks a rule.
  3. Read it. Then press "Explain this read" and see whether the answer would
     help a coach who did not write the method.
  4. Publish it, notify her, and look at her portal.
  5. Come back and see whether it says she has read it.

  Her portal: /portal/${token}

Remove her with: npm run coach:test-client -- wipe
`)
}

async function wipe() {
  const { data: client } = await admin.from('clients').select('id, name').eq('email', CLIENT_EMAIL).maybeSingle()
  if (!client) { console.log('\nNothing to remove.\n'); return }
  const { deleteClientData } = await import('../src/lib/client-data-request')
  const result = await deleteClientData(admin, client.id as string, { dryRun: false })
  console.log(`\nRemoved ${client.name}: ${result.rowsAffected} records, ${result.filesAffected} files.\n`)
}


/**
 * Everything after the intake, so the portal a real client LIVES in can be
 * looked at rather than only the day-one checklist.
 *
 * Kade, 25 Sep 2026, on why this had to exist: every seeded test client sat
 * forever on "Coaching Agreement, step 1 of 5", so the ongoing portal — months
 * of it, for every client — had never been seen by anybody, including me.
 */
async function onboard() {
  const { data: client } = await admin
    .from('clients').select('id, name, onboarding_token').eq('email', CLIENT_EMAIL).maybeSingle()
  if (!client) { console.log('\nShe does not exist yet. Run npm run coach:test-client first.\n'); return }

  const when = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()

  await admin.from('clients').update({
    agreement_accepted_at: when,
    agreement_accepted_name: CLIENT_NAME,
    health_declaration_submitted_at: when,
    bloodwork_arranged_at: when,
  }).eq('id', client.id)

  const { data: inv } = await admin.from('intake_invitations')
    .select('id').eq('client_id', client.id).eq('kind', 'foundational').maybeSingle()
  if (inv) await admin.from('intake_invitations').update({ status: 'complete' }).eq('id', inv.id)
  else await admin.from('intake_invitations').insert({
    client_id: client.id, kind: 'foundational', status: 'complete', token: randomUUID(), created_at: when,
  })

  const { count } = await admin.from('baselines').select('id', { count: 'exact', head: true }).eq('client_id', client.id)
  if (!count) await admin.from('baselines').insert({ client_id: client.id, created_at: when })

  console.log(`\n${client.name} is past onboarding.`)
  console.log(`Her portal: /portal/${client.onboarding_token}\n`)
}

/**
 * A one-time link that signs you in AS HER.
 *
 * The portal signs in by emailing a code, and testclient@bodyrecode.au is not a
 * mailbox anybody reads, so there is otherwise no way in. Viewing her portal as
 * a COACH is not the same thing: the page knows who is looking and a coach is
 * shown things she is not.
 */
async function signin() {
  const { data: client } = await admin
    .from('clients').select('id, name, onboarding_token').eq('email', CLIENT_EMAIL).maybeSingle()
  if (!client) { console.log('\nShe does not exist yet. Run npm run coach:test-client first.\n'); return }

  const { data: user } = await admin.auth.admin.listUsers()
  const exists = user?.users?.some(u => (u.email ?? '').toLowerCase() === CLIENT_EMAIL)
  if (!exists) {
    await admin.auth.admin.createUser({ email: CLIENT_EMAIL, email_confirm: true })
  }

  // The LIVE site by default. NEXT_PUBLIC_APP_URL is localhost in .env.local,
  // so reading it first produced a sign-in link that landed on a machine Kade
  // was not running. Pass PORTAL_SITE to point somewhere else on purpose.
  const site = process.env.PORTAL_SITE ?? 'https://app.bodyrecode.au'
  const { data: link, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: CLIENT_EMAIL,
    options: { redirectTo: `${site}/portal/${client.onboarding_token}` },
  })
  if (error || !link?.properties) { console.log(`\nCould not make a link: ${error?.message}\n`); return }

  console.log(`\nSigned-in link for ${client.name} (single use, expires in an hour):\n`)
  console.log(link.properties.action_link)
  console.log(`\nHer portal afterwards: ${site}/portal/${client.onboarding_token}`)
  console.log(`Run this again any time for a fresh link.\n`)
}

const mode = process.argv[2]
const run = mode === 'wipe' ? wipe : mode === 'onboard' ? onboard : mode === 'signin' ? signin : create
run().catch(e => { console.error(e); process.exit(1) })
