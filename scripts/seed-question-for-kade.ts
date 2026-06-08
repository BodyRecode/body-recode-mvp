import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
})
async function main() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // 1. Upload cover
  const coverBytes = readFileSync('/tmp/a_question_for_kade_cover.png')
  const { error: uploadErr } = await admin.storage
    .from('library-assets')
    .upload('deep-dives/a-question-for-kade-cover.png', coverBytes, { contentType: 'image/png', upsert: true })
  if (uploadErr) { console.error('upload', uploadErr); process.exit(1) }
  console.log('uploaded cover')

  // 2. Idempotency
  const { data: existing } = await admin
    .from('digital_asset_metadata')
    .select('slug')
    .eq('slug', 'a-question-for-kade')
    .maybeSingle()
  if (existing) { console.log('already seeded'); return }

  // 3. Resolve coach
  const { data: users } = await admin.auth.admin.listUsers()
  const kade = users.users.find(u => u.email === 'kade@bodyrecode.au')
  if (!kade) { console.error('kade not found'); process.exit(1) }

  // 4. Insert product
  const { data: product, error: pErr } = await admin
    .from('be_products')
    .insert({
      coach_id: kade.id,
      name: 'A Question for Kade',
      description: 'Ask Kade your specific question. The Body Recode engine reads your pattern + last four check-ins and writes a personalised response. PDF in 10 minutes.',
      price: 29.00,
      type: 'one_time',
      category: 'body_recode',
      kind: 'bolt_on_ai',
    })
    .select('id')
    .single()
  if (pErr || !product) { console.error('product', pErr); process.exit(1) }

  // 5. Metadata
  const { error: mErr } = await admin
    .from('digital_asset_metadata')
    .insert({
      product_id: product.id,
      slug: 'a-question-for-kade',
      state_match: null,
      pattern_match: null,
      source_path: 'deep-dives/a-question-for-kade.pdf', // placeholder
      fulfilment_kind: 'instant_engine',
      engine_call: 'member_question',
      ascension_cta_path: null,
      active: true,
    })
  if (mErr) { console.error('metadata', mErr); process.exit(1) }

  // 6. Verify
  const { data: row } = await admin
    .from('be_products')
    .select('id, name, kind, price, digital_asset_metadata(slug, fulfilment_kind, engine_call, active)')
    .eq('id', product.id)
    .single()
  console.log('seeded:', JSON.stringify(row, null, 2))
}
main()
