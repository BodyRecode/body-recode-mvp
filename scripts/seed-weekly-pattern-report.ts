import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
})
async function main() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const coverBytes = readFileSync('/tmp/weekly_pattern_report_cover.png')
  const { error: uErr } = await admin.storage.from('library-assets').upload('deep-dives/weekly-pattern-report-cover.png', coverBytes, { contentType: 'image/png', upsert: true })
  if (uErr) { console.error(uErr); process.exit(1) }
  console.log('uploaded cover')

  const { data: existing } = await admin.from('digital_asset_metadata').select('slug').eq('slug', 'weekly-pattern-report').maybeSingle()
  if (existing) { console.log('already seeded'); return }

  const { data: users } = await admin.auth.admin.listUsers()
  const kade = users.users.find(u => u.email === 'kade@bodyrecode.au')
  if (!kade) { console.error('kade not found'); process.exit(1) }

  const { data: product, error: pErr } = await admin.from('be_products').insert({
    coach_id: kade.id,
    name: 'Weekly Pattern Report',
    description: 'One personalised reading every Friday for four weeks. Three observations, one focus, one page. Designed for a Friday-afternoon read.',
    price: 19.00,
    type: 'one_time',
    category: 'body_recode',
    kind: 'bolt_on_ai',
  }).select('id').single()
  if (pErr || !product) { console.error(pErr); process.exit(1) }

  const { error: mErr } = await admin.from('digital_asset_metadata').insert({
    product_id: product.id,
    slug: 'weekly-pattern-report',
    state_match: null, pattern_match: null,
    source_path: 'deep-dives/weekly-pattern-report.pdf',
    fulfilment_kind: 'instant_engine',
    engine_call: 'weekly_pattern_report',
    ascension_cta_path: null,
    active: true,
  })
  if (mErr) { console.error(mErr); process.exit(1) }

  const { data: row } = await admin.from('be_products').select('id, name, kind, price, digital_asset_metadata(slug, fulfilment_kind, engine_call, active)').eq('id', product.id).single()
  console.log('seeded:', JSON.stringify(row, null, 2))
}
main()
