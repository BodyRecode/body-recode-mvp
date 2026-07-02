/**
 * Test the multi-tenant pipeline end-to-end without touching BR data.
 *
 * Steps:
 *   1. resolver unit tests: verify host → tenant_id mapping
 *   2. loader tests: verify tenant_config lookup for known + unknown tenants
 *   3. cache tests: verify second call is faster (cache hit)
 *   4. cleanup: no persistent side effects
 *
 * Run: `npx tsx scripts/test-tenant-pipeline.ts`
 */

import { resolveTenantIdFromHost, loadTenantFromDb, invalidateTenantCache } from '../src/lib/tenant-resolver'

let passed = 0
let failed = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`)
    passed++
  } else {
    console.log(`  ✗ ${message}`)
    failed++
  }
}

async function main() {
  console.log('\n═══ Test 1: resolveTenantIdFromHost ═══')
  assert(resolveTenantIdFromHost('bodyrecode.au') === 'body-recode', "'bodyrecode.au' → 'body-recode'")
  assert(resolveTenantIdFromHost('www.bodyrecode.au') === 'body-recode', "'www.bodyrecode.au' → 'body-recode'")
  assert(resolveTenantIdFromHost('performance.bodyrecode.au') === 'body-recode', "'performance.bodyrecode.au' → 'body-recode'")
  assert(resolveTenantIdFromHost('app.bodyrecode.au') === 'body-recode', "'app.bodyrecode.au' → 'body-recode'")
  assert(resolveTenantIdFromHost('localhost') === 'body-recode', "'localhost' → 'body-recode'")
  assert(resolveTenantIdFromHost('localhost:3000') === 'body-recode', "'localhost:3000' → 'body-recode' (port stripped)")
  assert(resolveTenantIdFromHost('body-recode-abc123.vercel.app') === 'body-recode', "'*.vercel.app' → 'body-recode'")
  assert(resolveTenantIdFromHost('melisa.sot-platform.com') === 'melisa', "'melisa.sot-platform.com' → 'melisa'")
  assert(resolveTenantIdFromHost('sarah.sot-platform.com') === 'sarah', "'sarah.sot-platform.com' → 'sarah'")
  assert(resolveTenantIdFromHost(null) === 'body-recode', "null host → 'body-recode'")
  assert(resolveTenantIdFromHost('') === 'body-recode', "empty host → 'body-recode'")
  assert(resolveTenantIdFromHost('someunknowndomain.com') === 'body-recode', "2-part unknown → 'body-recode' safe default")

  console.log('\n═══ Test 2: loadTenantFromDb — BR (should exist) ═══')
  invalidateTenantCache()
  const brConfig = await loadTenantFromDb('body-recode')
  assert(brConfig !== null, 'BR config loaded from DB')
  if (brConfig) {
    assert(brConfig.brand.name === 'Body Recode', `brand.name = "${brConfig.brand.name}"`)
    assert(brConfig.coach.firstName === 'Kade', `coach.firstName = "${brConfig.coach.firstName}"`)
    assert(brConfig.modality.id === 'strength', `modality.id = "${brConfig.modality.id}"`)
    assert(brConfig.licence.tenantId === 'body-recode', `licence.tenantId = "${brConfig.licence.tenantId}"`)
    assert(brConfig.products.reportPrice === 37, `products.reportPrice = ${brConfig.products.reportPrice}`)
  }

  console.log('\n═══ Test 3: loadTenantFromDb — nonexistent tenant ═══')
  invalidateTenantCache()
  const nonExistent = await loadTenantFromDb('this-tenant-does-not-exist')
  assert(nonExistent === null, 'unknown tenant_id returns null (safe fallback trigger)')

  console.log('\n═══ Test 4: cache warm/cold behaviour ═══')
  invalidateTenantCache()
  const t1Start = Date.now()
  await loadTenantFromDb('body-recode')
  const t1Elapsed = Date.now() - t1Start

  const t2Start = Date.now()
  await loadTenantFromDb('body-recode')
  const t2Elapsed = Date.now() - t2Start

  console.log(`  Cold call: ${t1Elapsed}ms`)
  console.log(`  Warm call: ${t2Elapsed}ms`)
  assert(t2Elapsed < 10, `warm call < 10ms (was ${t2Elapsed}ms) — proves cache hit`)
  assert(t2Elapsed < t1Elapsed, `warm faster than cold (${t2Elapsed}ms < ${t1Elapsed}ms)`)

  console.log('\n═══ Test 5: cache invalidation ═══')
  invalidateTenantCache('body-recode')
  const t3Start = Date.now()
  await loadTenantFromDb('body-recode')
  const t3Elapsed = Date.now() - t3Start
  console.log(`  Post-invalidate call: ${t3Elapsed}ms`)
  assert(t3Elapsed > 5, `post-invalidate slower (${t3Elapsed}ms > 5ms) — proves cache was cleared`)

  console.log('\n═══════════════════════════════════════')
  console.log(`  Passed: ${passed}  Failed: ${failed}`)
  console.log('═══════════════════════════════════════\n')

  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
