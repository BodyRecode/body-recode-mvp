import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
})
async function main() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const coverBytes = readFileSync('/tmp/your_custom_block_cover.png')
  const { error: uploadErr } = await admin.storage
    .from('library-assets')
    .upload('deep-dives/your-custom-block-cover.png', coverBytes, { contentType: 'image/png', upsert: true })
  if (uploadErr) { console.error('upload', uploadErr); process.exit(1) }
  console.log('uploaded cover')

  const { data: existing } = await admin
    .from('digital_asset_metadata').select('slug').eq('slug', 'your-custom-block').maybeSingle()
  if (existing) { console.log('already seeded'); return }

  const { data: users } = await admin.auth.admin.listUsers()
  const kade = users.users.find(u => u.email === 'kade@bodyrecode.au')
  if (!kade) { console.error('kade not found'); process.exit(1) }

  const { data: product, error: pErr } = await admin.from('be_products').insert({
    coach_id: kade.id,
    name: 'Your Custom Block',
    description: 'Travel, injury, or constraint. A 2-week adapted training block designed around your pattern + situation. PDF in 10 minutes.',
    price: 39.00,
    type: 'one_time',
    category: 'body_recode',
    kind: 'bolt_on_ai',
  }).select('id').single()
  if (pErr || !product) { console.error('product', pErr); process.exit(1) }

  const { error: mErr } = await admin.from('digital_asset_metadata').insert({
    product_id: product.id,
    slug: 'your-custom-block',
    state_match: null, pattern_match: null,
    source_path: 'deep-dives/your-custom-block.pdf',
    fulfilment_kind: 'instant_engine',
    engine_call: 'member_custom_block',
    ascension_cta_path: null,
    active: true,
  })
  if (mErr) { console.error('metadata', mErr); process.exit(1) }

  const { data: row } = await admin
    .from('be_products')
    .select('id, name, kind, price, digital_asset_metadata(slug, fulfilment_kind, engine_call, active)')
    .eq('id', product.id).single()
  console.log('seeded:', JSON.stringify(row, null, 2))
}
main()
