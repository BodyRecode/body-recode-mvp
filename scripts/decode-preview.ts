/**
 * Creates or refreshes ONE clearly-labelled TEST enrolment so the
 * Body Decode portal can be reviewed without opening a real lead's portal.
 *
 * Why not just use a real token: every portal page calls logPortalVisit(),
 * which writes a challenge_portal_opened event. Browsing a real lead's portal
 * would attribute fake opens to them and corrupt the completion metric that
 * scripts/decode-cohort.ts reads.
 *
 * Backdated 4 days so days 1-5 are all unlocked and the whole arc is visible.
 */
import { createClient } from '@supabase/supabase-js'

const EMAIL = 'decode-preview@bodyrecode.au'

async function main() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: coach } = await admin.from('coaches').select('id').limit(1).maybeSingle()

  const scores = { '01': 2, '02': 1, '03': 1, '04': 2, '05': 2 }
  const leadFields = {
    name: 'PREVIEW Body Decode',
    email: EMAIL,
    gender: 'female',
    status: 'new_check_in',
    active: false,                       // never eligible for any sequence
    source_detail: 'INTERNAL PREVIEW - not a real lead',
    scorecard_score: 8,
    scorecard_body_state: 'Depleted State',
    scorecard_section_scores: scores,
    biological_sex: 'F',
    age_band: '45_54',
    fat_storage: 'hips_thighs',
    cycle_status: 'perimenopausal',
    storage_direction: 'to_middle',      // -> Estrogen-Shift, high confidence
    approach_response: 'B',
  }

  const { data: existing } = await admin.from('leads').select('id').eq('email', EMAIL).maybeSingle()
  let leadId: string
  if (existing) {
    await admin.from('leads').update(leadFields).eq('id', existing.id)
    leadId = existing.id
  } else {
    const { data, error } = await admin.from('leads')
      .insert({ ...leadFields, coach_id: coach?.id ?? null }).select('id').single()
    if (error) { console.error(error); return }
    leadId = data.id
  }

  const enrolledAt = new Date(Date.now() - 4 * 86_400_000).toISOString()
  const { data: enr } = await admin.from('challenge_enrollments')
    .select('id, token').eq('lead_id', leadId).maybeSingle()

  let token: string
  if (enr) {
    await admin.from('challenge_enrollments')
      .update({ enrolled_at: enrolledAt, status: 'active' }).eq('id', enr.id)
    token = enr.token
  } else {
    const { data, error } = await admin.from('challenge_enrollments')
      .insert({ lead_id: leadId, enrolled_at: enrolledAt, status: 'active', current_day: 5, wave: 1 })
      .select('token').single()
    if (error) { console.error(error); return }
    token = data.token
  }

  const base = 'https://app.bodyrecode.au/decode'
  console.log(`\nPREVIEW PORTAL — test lead, safe to click around\n${'='.repeat(52)}`)
  console.log(`\nHub          ${base}/${token}`)
  console.log(`Her read     ${base}/${token}/read`)
  for (let d = 1; d <= 5; d++) console.log(`Day ${d}        ${base}/${token}/day/${d}`)
  console.log(`\nProfile: Depleted, sleep and stress at the floor, perimenopausal,`)
  console.log(`fat moving hips -> middle, so she types Estrogen-Shift.`)
  console.log(`Enrolled 4 days ago, so all five days are open.\n`)
}
main()
