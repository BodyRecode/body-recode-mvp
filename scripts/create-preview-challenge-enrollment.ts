// Create a preview Challenge enrollment for visual deliverable review.
// - Fake lead (preview.client@bodyrecode.test, name "Preview Client")
// - Active enrollment, current_day = 7 (so Body Decode Check-In is unlocked
//   to view) but PAR-Q + Health Dec still incomplete (so Kade can see the
//   gated state then complete them and re-check)
// - PRINTS the token + a full URL list at the end
// Usage: cd ~/body-recode-mvp && set -a && source .env.local && set +a && npx tsx scripts/create-preview-challenge-enrollment.ts

import { createClient } from '@supabase/supabase-js'

const PREVIEW_EMAIL = 'preview.client@bodyrecode.test'
const PREVIEW_NAME = 'Preview Client'

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Reuse the preview lead if it exists, else create
  let { data: lead } = await supabase
    .from('leads')
    .select('id, name, email')
    .eq('email', PREVIEW_EMAIL)
    .maybeSingle()

  if (!lead) {
    const { data: created, error } = await supabase
      .from('leads')
      .insert({
        name: PREVIEW_NAME,
        email: PREVIEW_EMAIL,
        source: 'direct',
        status: 'new_check_in',
      })
      .select('id, name, email')
      .single()
    if (error || !created) {
      console.error('Failed to create preview lead:', error)
      process.exit(1)
    }
    lead = created
    console.log(`Created preview lead: ${lead.id}`)
  } else {
    console.log(`Reusing preview lead: ${lead.id}`)
  }

  // Look for an existing active enrollment for this lead
  const { data: existing } = await supabase
    .from('challenge_enrollments')
    .select('id, token, current_day')
    .eq('lead_id', lead.id)
    .eq('status', 'active')
    .maybeSingle()

  let token: string
  if (existing) {
    token = existing.token
    console.log(`Reusing existing enrollment: ${token}`)
    // Reset to a useful preview state — Day 7, gates incomplete so Kade sees both states
    await supabase
      .from('challenge_enrollments')
      .update({
        current_day: 7,
        parq_completed_at: null,
        health_dec_completed_at: null,
        quiz_completed_at: null,
        quiz_result: null,
      })
      .eq('id', existing.id)
    console.log('Reset preview state: Day 7, gates incomplete, quiz incomplete')
  } else {
    // Backdate enrolled_at by 6 days so the portal calculates "Day 7"
    const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    const { data: enrollment, error } = await supabase
      .from('challenge_enrollments')
      .insert({
        lead_id: lead.id,
        enrolled_at: sevenDaysAgo,
        status: 'active',
        current_day: 7,
      })
      .select('token')
      .single()
    if (error || !enrollment) {
      console.error('Failed to create enrollment:', error)
      process.exit(1)
    }
    token = enrollment.token
    console.log(`Created new enrollment: ${token}`)
  }

  const isProd = process.env.NEXT_PUBLIC_APP_URL?.includes('localhost') === false
  const base = isProd ? 'https://bodyrecode.au' : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')

  console.log('\n========================================')
  console.log('PREVIEW TOKEN READY')
  console.log('========================================')
  console.log(`Token         : ${token}`)
  console.log(`Lead id       : ${lead.id}`)
  console.log(`Email         : ${PREVIEW_EMAIL}`)
  console.log(`Current day   : 7 (Body Decode Check-In unlocked)`)
  console.log(`Gates         : PAR-Q + Health Dec INCOMPLETE`)
  console.log(`               (complete them in-portal to unlock training + nutrition)`)
  console.log('')
  console.log('URLs to walk through, in journey order:')
  console.log('')
  console.log(`  1. Marketing landing     : ${base}/challenge`)
  console.log(`  2. Portal landing        : ${base}/challenge/${token}`)
  console.log(`     (PAR-Q + Health Dec forms appear at top, gated state)`)
  console.log(`     (Once both done: progress bar, daily note, resources unlock)`)
  console.log(`  3. Body Decode Check-In  : (scroll down on portal — Day 7 unlock card)`)
  console.log(`  4. Check-In Result       : (shown after submitting the check-in)`)
  console.log(`  5. Training plan page    : ${base}/challenge/${token}/training`)
  console.log(`  6. Nutrition guide page  : ${base}/challenge/${token}/nutrition`)
  console.log('')
  console.log('Drip emails are separate — sent on Day 1 / Day 5 / Day 14.')
  console.log('Previews already in your inbox from Phase 3b.')
  console.log('========================================\n')
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
