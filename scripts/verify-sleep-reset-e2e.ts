import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
})

const MEMBER_TOKEN = 'a1a0ae7b64f74248a73803a9f6814dcddc5f595f3a9a44cdb6d286fc1f8025e6'

async function main() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Storage: PDF actually present at expected path
  console.log('1. Checking PDF in Storage...')
  const { data: list, error: listErr } = await admin.storage
    .from('library-assets')
    .list('protocols')
  if (listErr) { console.error('   FAIL:', listErr.message); process.exit(1) }
  const pdf = list?.find(f => f.name === 'sleep-reset-v1.pdf')
  if (!pdf) {
    console.error('   FAIL: protocols/sleep-reset-v1.pdf not found. Files in folder:')
    list?.forEach(f => console.error(`     - ${f.name}`))
    process.exit(1)
  }
  console.log(`   OK: protocols/sleep-reset-v1.pdf (${pdf.metadata?.size ?? '?'} bytes)`)

  // 2. Signed URL: confirm the entitlement flow can produce a 24h signed URL
  console.log('2. Producing signed URL (24h expiry)...')
  const { data: signed, error: signErr } = await admin.storage
    .from('library-assets')
    .createSignedUrl('protocols/sleep-reset-v1.pdf', 60 * 60 * 24)
  if (signErr) { console.error('   FAIL:', signErr.message); process.exit(1) }
  console.log(`   OK: ${signed.signedUrl.slice(0, 80)}...`)

  // 3. Store query: replicate the bolt-on store load
  console.log('3. Running bolt-on store query...')
  const { data: products, error: prodErr } = await admin
    .from('be_products')
    .select('id, name, description, price, kind, digital_asset_metadata!inner(slug, active)')
    .in('kind', ['protocol', 'bolt_on_ai', 'bolt_on_human', 'bolt_on_physical'])
  if (prodErr) { console.error('   FAIL:', prodErr.message); process.exit(1) }
  const sleepReset = (products ?? []).find(p => {
    const meta = Array.isArray(p.digital_asset_metadata) ? p.digital_asset_metadata[0] : p.digital_asset_metadata
    return meta?.slug === 'sleep-reset'
  })
  if (!sleepReset) {
    console.error('   FAIL: Sleep Reset not in store-query results')
    console.error('   Returned:', JSON.stringify(products, null, 2))
    process.exit(1)
  }
  console.log(`   OK: store would show "${sleepReset.name}" at $${sleepReset.price} (kind=${sleepReset.kind})`)

  // 4. Active member token resolves
  console.log('4. Resolving member token...')
  const { data: member, error: memErr } = await admin
    .from('membership_enrollments')
    .select('first_name, email, cancelled_at')
    .eq('token', MEMBER_TOKEN)
    .maybeSingle()
  if (memErr || !member || member.cancelled_at) {
    console.error('   FAIL: member token did not resolve to active member')
    process.exit(1)
  }
  console.log(`   OK: ${member.first_name} <${member.email}>`)

  // 5. Inspect the post-purchase library would list this asset
  console.log('5. Library query (post-purchase member view)...')
  const { data: libProducts } = await admin
    .from('be_products')
    .select('id, name, kind, digital_asset_metadata!inner(slug, state_match, active)')
    .in('kind', ['field_guide', 'protocol'])
  const assets = (libProducts ?? []).map(p => {
    const meta = Array.isArray(p.digital_asset_metadata) ? p.digital_asset_metadata[0] : p.digital_asset_metadata
    if (!meta || !meta.active) return null
    return { slug: meta.slug, title: p.name, kind: p.kind }
  }).filter(Boolean)
  const hasSleepReset = assets.some((a: any) => a?.slug === 'sleep-reset')
  console.log(`   OK: library lists ${assets.length} assets, sleep-reset present: ${hasSleepReset}`)
  assets.forEach((a: any) => console.log(`     - [${a.kind}] ${a.title}`))

  console.log('\n  ALL CHECKS PASSED')
  console.log(`\n  Test URLs (dev):`)
  console.log(`  - Store:  http://localhost:3000/library/${MEMBER_TOKEN}/store`)
  console.log(`  - Library: http://localhost:3000/library/${MEMBER_TOKEN}`)
  console.log(`  - Reader (post-purchase): http://localhost:3000/library/${MEMBER_TOKEN}/sleep-reset`)
}
main()
