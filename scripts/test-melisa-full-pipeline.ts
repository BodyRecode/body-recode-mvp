/**
 * Full-pipeline test: insert Melisa tenant row + verify subdomain routing
 * returns her config end-to-end. Cleanup at the end.
 *
 * Steps:
 *   1. Create test auth.users row (test-melisa@bodyrecode.test)
 *   2. Insert tenant_config row for tenant_id='melisa' with Melisa branding
 *   3. Verify loadTenantFromDb('melisa') returns Melisa's config
 *   4. Verify BR row untouched
 *   5. Cleanup: delete tenant_config + auth.users rows
 *
 * Run: `npx tsx scripts/test-melisa-full-pipeline.ts`
 */

import { createClient } from '@supabase/supabase-js'
import { loadTenantFromDb, invalidateTenantCache } from '../src/lib/tenant-resolver'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE env vars. Load .env.local first.')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const MELISA_EMAIL = 'test-melisa@bodyrecode.test'
const MELISA_TENANT_ID = 'melisa'

async function main() {
  let melisaAuthId: string | null = null
  let brRowChecksum: unknown = null

  try {
    console.log('\n═══ Step 0: Snapshot BR row (baseline) ═══')
    const { data: brBefore } = await admin
      .from('tenant_config')
      .select('*')
      .eq('licence->>tenantId', 'body-recode')
      .maybeSingle()
    if (!brBefore) throw new Error('BR row missing — abort')
    brRowChecksum = JSON.stringify({
      brand: brBefore.brand,
      coach: brBefore.coach,
      products: brBefore.products,
      licence: brBefore.licence,
      modality: brBefore.modality,
    })
    console.log(`  ✓ BR row present. brand.name = "${brBefore.brand.name}"`)

    console.log('\n═══ Step 1: Create test auth user (Melisa) ═══')
    const { data: authRes, error: authErr } = await admin.auth.admin.createUser({
      email: MELISA_EMAIL,
      email_confirm: true,
      user_metadata: { test_row: true, purpose: 'multi-tenant-pipeline-test' },
    })
    if (authErr) throw new Error(`Create auth user failed: ${authErr.message}`)
    melisaAuthId = authRes.user.id
    console.log(`  ✓ Created auth user ${MELISA_EMAIL}, id = ${melisaAuthId}`)

    console.log('\n═══ Step 2: Insert tenant_config row for Melisa ═══')
    const { error: insertErr } = await admin.from('tenant_config').insert({
      coach_id: melisaAuthId,
      brand: {
        name: 'Melisa Coaching',
        nameWithMark: 'Melisa Coaching™',
        tagline: 'Yoga for the modern woman',
        logoUrlLight: '/logo-melisa.png',
        logoUrlDark: '/logo-melisa-dark.png',
        apexDomain: 'melisacoaching.com',
        marketingDomain: 'https://melisacoaching.com',
        performanceDomain: 'https://scorecard.melisacoaching.com',
        appDomain: 'https://app.melisacoaching.com',
        supportEmail: 'hello@melisacoaching.com',
        replyToEmail: 'melisa@replies.melisacoaching.com',
        fromEmail: 'melisa@send.melisacoaching.com',
        accentColor: '#E94A80',
      },
      coach: {
        firstName: 'Melisa',
        fullName: 'Melisa Example',
        email: 'melisa@melisacoaching.com',
        adminEmail: 'melisa@melisacoaching.com',
        photoUrl: 'https://melisacoaching.com/melisa.jpg',
        location: 'Sydney',
        credentials: 'Yoga Teacher · Movement Coach',
        instagramHandle: '@melisa_coach',
        personalInstagramHandle: '@melisa_example',
        whatsAppNumber: '61411222333',
      },
      products: {
        scorecardName: 'Yoga Body Scorecard',
        reportProductName: 'Yoga Body Report',
        reportPrice: 27,
        challengeName: '10-Day Yoga Reset',
        challengePrice: 0,
        blueprintName: '6-Week Yoga Blueprint',
        blueprintPrice: 77,
        membershipName: 'Melisa Membership',
        membershipPrice: 39,
        coachingPackage2xPrice: 180,
        coachingPackagePriceLabel: '$180 commencement fee',
      },
      licence: {
        tenantId: MELISA_TENANT_ID,
        poweredBy: true,
        version: '2026-07-02',
      },
      modality: {
        id: 'yoga',
        label: 'Yoga',
        doctrineMode: 'A',
      },
    })
    if (insertErr) throw new Error(`Insert tenant_config failed: ${insertErr.message}`)
    console.log(`  ✓ Inserted tenant_config row for tenant_id='${MELISA_TENANT_ID}'`)

    console.log('\n═══ Step 3: Verify loadTenantFromDb returns Melisa config ═══')
    invalidateTenantCache()
    const melisaConfig = await loadTenantFromDb(MELISA_TENANT_ID)
    if (!melisaConfig) throw new Error('loadTenantFromDb returned null for melisa')
    console.log(`  ✓ Loaded: brand.name = "${melisaConfig.brand.name}"`)
    console.log(`  ✓ Loaded: coach.firstName = "${melisaConfig.coach.firstName}"`)
    console.log(`  ✓ Loaded: modality.id = "${melisaConfig.modality.id}"`)
    console.log(`  ✓ Loaded: products.blueprintPrice = ${melisaConfig.products.blueprintPrice}`)
    if (melisaConfig.brand.name !== 'Melisa Coaching') throw new Error('brand.name mismatch')
    if (melisaConfig.modality.id !== 'yoga') throw new Error('modality mismatch')
    if (melisaConfig.licence.tenantId !== MELISA_TENANT_ID) throw new Error('tenantId mismatch')

    console.log('\n═══ Step 4: Verify BR row UNTOUCHED ═══')
    const { data: brAfter } = await admin
      .from('tenant_config')
      .select('*')
      .eq('licence->>tenantId', 'body-recode')
      .maybeSingle()
    if (!brAfter) throw new Error('BR row disappeared!')
    const brAfterChecksum = JSON.stringify({
      brand: brAfter.brand,
      coach: brAfter.coach,
      products: brAfter.products,
      licence: brAfter.licence,
      modality: brAfter.modality,
    })
    if (brAfterChecksum !== brRowChecksum) {
      throw new Error('BR row modified! ' + `Before: ${brRowChecksum}. After: ${brAfterChecksum}`)
    }
    console.log(`  ✓ BR row byte-identical before/after. brand.name still = "${brAfter.brand.name}"`)

    console.log('\n═══ Step 5: Verify both tenants coexist ═══')
    const { data: allTenants } = await admin
      .from('tenant_config')
      .select("brand->>'name' as brand_name, licence->>'tenantId' as tenant_id")
    console.log(`  ✓ ${allTenants?.length ?? 0} tenants in table:`)
    for (const t of allTenants ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = t as any
      console.log(`    - ${row.tenant_id} → ${row.brand_name}`)
    }
  } catch (err) {
    console.error('\n✗ FAIL:', (err as Error).message)
    process.exitCode = 1
  } finally {
    console.log('\n═══ Cleanup ═══')
    if (melisaAuthId) {
      // Delete tenant_config first (FK cascade would do it, but explicit is safer)
      const { error: delTenErr } = await admin
        .from('tenant_config')
        .delete()
        .eq('coach_id', melisaAuthId)
      if (delTenErr) {
        console.error(`  ✗ Delete tenant_config failed: ${delTenErr.message}`)
      } else {
        console.log('  ✓ Deleted Melisa tenant_config row')
      }

      // Delete auth user
      const { error: delAuthErr } = await admin.auth.admin.deleteUser(melisaAuthId)
      if (delAuthErr) {
        console.error(`  ✗ Delete auth user failed: ${delAuthErr.message}`)
      } else {
        console.log('  ✓ Deleted Melisa auth user')
      }
    }

    // Final verification: only BR should remain
    const { data: remaining } = await admin
      .from('tenant_config')
      .select("licence->>'tenantId' as tenant_id")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ids = (remaining ?? []).map((r: any) => r.tenant_id).sort()
    console.log(`  ✓ Final tenant_config rows: ${JSON.stringify(ids)}`)
    if (ids.length === 1 && ids[0] === 'body-recode') {
      console.log('  ✓ Cleanup complete. BR is the only remaining tenant.')
    } else {
      console.error('  ✗ WARNING: unexpected rows remain. Manual cleanup may be needed.')
      process.exitCode = 1
    }
  }
}

main()
