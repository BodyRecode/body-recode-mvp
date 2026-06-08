import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
})

async function main() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Idempotent: skip if a row for this slug already exists.
  const { data: existing } = await admin
    .from('digital_asset_metadata')
    .select('slug')
    .eq('slug', 'trajectory-deep-dive')
    .maybeSingle()
  if (existing) {
    console.log('already seeded — slug trajectory-deep-dive exists')
    return
  }

  // 1. Resolve coach_id
  const { data: coach } = await admin.auth.admin.listUsers()
  const kade = coach.users.find(u => u.email === 'kade@bodyrecode.au')
  if (!kade) { console.error('kade user not found'); process.exit(1) }

  // 2. Insert product
  const { data: product, error: pErr } = await admin
    .from('be_products')
    .insert({
      coach_id: kade.id,
      name: 'Trajectory Deep-Dive',
      description: 'A fresh AI reading of how your signal moved across your last block. Same engine your coach uses for the official Block-End Reading, on the schedule you choose.',
      price: 29.00,
      type: 'one_time',
      category: 'body_recode',
      kind: 'bolt_on_ai',
    })
    .select('id')
    .single()
  if (pErr || !product) { console.error('product insert error:', pErr); process.exit(1) }

  // 3. Insert metadata
  const { error: mErr } = await admin
    .from('digital_asset_metadata')
    .insert({
      product_id: product.id,
      slug: 'trajectory-deep-dive',
      state_match: null,
      pattern_match: null,
      source_path: 'deep-dives/trajectory-deep-dive.pdf',
      fulfilment_kind: 'instant_engine',
      engine_call: 'trajectory',
      ascension_cta_path: null,
      active: true,
    })
  if (mErr) { console.error('metadata insert error:', mErr); process.exit(1) }

  // 4. Verify
  const { data: row } = await admin
    .from('be_products')
    .select('id, name, kind, price, digital_asset_metadata(slug, fulfilment_kind, engine_call, active)')
    .eq('id', product.id)
    .single()
  console.log('seeded:', JSON.stringify(row, null, 2))
}
main()
