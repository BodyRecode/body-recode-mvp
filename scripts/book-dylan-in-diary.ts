/**
 * Put Dylan Shields' Collective call into the Body Recode Bookings diary.
 * be_bookings requires a lead/client (CHECK booking_has_contact), so this:
 *   1. Ensures Dylan exists as a lead (referral, tagged Collective coach).
 *   2. Inserts a zoom1 be_bookings row reusing the EXISTING Zoom link
 *      already sent to Dylan (no new meeting minted).
 * Idempotent-ish: skips lead creation if his email already exists; skips the
 * booking if one already exists at the same time.
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

const env: Record<string, string> = {}
for (const line of readFileSync(resolve(__dirname, '../.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const EMAIL = 'shieldssuccess@gmail.com'
const ZOOM = 'https://us06web.zoom.us/j/82026411972?pwd=8YqiY3aRQTn74wquT0xbsXeo09ksjm.1'
const SCHEDULED_AT = '2026-07-24T12:00:00+10:00' // Fri 24 Jul, 12:00pm Brisbane

async function main() {
  // coach_id = the account that owns the CRM (all leads belong to Kade)
  const { data: anyLead } = await supabase.from('leads').select('coach_id').limit(1).single()
  const coachId = anyLead?.coach_id
  if (!coachId) throw new Error('Could not resolve coach_id from leads table')

  // 1. Ensure Dylan exists as a lead
  const { data: existing } = await supabase.from('leads').select('id').ilike('email', EMAIL).limit(1).maybeSingle()
  let leadId = existing?.id as string | undefined

  if (leadId) {
    console.log('Lead already exists:', leadId)
  } else {
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        coach_id: coachId,
        name: 'Dylan Shields',
        email: EMAIL,
        phone: '+61410932563',
        source: 'referral',
        source_detail: 'Collective coach prospect - Shields Success (not a consumer lead)',
        status: 'zoom_1_booked',
        active: true,
      })
      .select('id')
      .single()
    if (error) throw new Error(`Lead insert failed: ${error.message}`)
    leadId = lead.id
    console.log('Created lead:', leadId)
  }

  // 2. Skip if a booking already exists at this time for this lead
  const { data: dupe } = await supabase
    .from('be_bookings')
    .select('id')
    .eq('lead_id', leadId)
    .eq('scheduled_at', new Date(SCHEDULED_AT).toISOString())
    .maybeSingle()
  if (dupe) {
    console.log('Booking already exists:', dupe.id)
    return
  }

  const { data: booking, error: bErr } = await supabase
    .from('be_bookings')
    .insert({
      coach_id: coachId,
      lead_id: leadId,
      type: 'zoom1',
      scheduled_at: new Date(SCHEDULED_AT).toISOString(),
      duration_minutes: 45,
      meeting_link: ZOOM,
      status: 'scheduled',
      notes: 'Body Recode Collective call - Dylan Shields (Shields Success). Existing mate/protege; discussing The Collective.',
    })
    .select('id')
    .single()
  if (bErr) throw new Error(`Booking insert failed: ${bErr.message}`)
  console.log('Created booking:', booking.id)
  console.log('\nDONE - Dylan Shields, Fri 24 Jul 12:00pm, now in Bookings diary.')
}

main().catch((e) => { console.error('FAILED:', e); process.exit(1) })
