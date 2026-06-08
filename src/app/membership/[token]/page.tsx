import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import MembershipPortalClient from './membership-portal-client'
import { BOLT_ON_AD_COPY } from '@/lib/bolt-on-ad-copy'

export type FeaturedBoltOn = {
  product_id: string
  slug: string
  name: string
  price: number
  kind: string
  tagline: string
  hero_headline: string
  cover_signed_url: string
}

// Hidden from non-coaching members because their engines read coaching-only data.
const COACHING_ONLY_ENGINE_CALLS = new Set(['trajectory', 'cffs', 'fat_map', 'health_markers'])

async function pickFeaturedBoltOns(memberEmail: string, max = 3): Promise<FeaturedBoltOn[]> {
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id')
    .ilike('email', memberEmail)
    .maybeSingle()
  const isCoachingClient = !!client

  const { data: products } = await admin
    .from('be_products')
    .select('id, name, price, kind, created_at, digital_asset_metadata!inner(slug, active, engine_call)')
    .in('kind', ['protocol', 'bolt_on_ai'])
    .order('created_at', { ascending: false })

  if (!products?.length) return []

  // Pull purchases so we don't feature what they already own.
  const { data: purchases } = await admin
    .from('digital_asset_purchases')
    .select('product_id, status')
    .eq('email_at_purchase', memberEmail.toLowerCase())
    .in('status', ['paid', 'fulfilled'])
  const purchasedIds = new Set((purchases ?? []).map(p => p.product_id))

  const out: FeaturedBoltOn[] = []
  for (const p of products) {
    if (out.length >= max) break
    const meta = Array.isArray(p.digital_asset_metadata) ? p.digital_asset_metadata[0] : p.digital_asset_metadata
    if (!meta?.active) continue
    if (purchasedIds.has(p.id)) continue
    // Skip coaching-only AI deep-dives for non-coaching members.
    if (
      p.kind === 'bolt_on_ai'
      && meta.engine_call
      && COACHING_ONLY_ENGINE_CALLS.has(meta.engine_call)
      && !isCoachingClient
    ) continue
    const copy = BOLT_ON_AD_COPY[meta.slug]
    if (!copy) continue
    const { data: signed } = await admin.storage
      .from('library-assets')
      .createSignedUrl(copy.cover_path, 60 * 60 * 24)
    if (!signed?.signedUrl) continue
    out.push({
      product_id: p.id,
      slug: meta.slug,
      name: p.name,
      price: Number(p.price) || 0,
      kind: p.kind,
      tagline: copy.tagline,
      hero_headline: copy.hero_headline,
      cover_signed_url: signed.signedUrl,
    })
  }
  return out
}

export default async function MembershipPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: enrollment } = await admin
    .from('membership_enrollments')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!enrollment) return notFound()

  const featuredBoltOns = enrollment.email
    ? await pickFeaturedBoltOns(enrollment.email, 3)
    : []

  return (
    <MembershipPortalClient
      enrollment={enrollment}
      featuredBoltOns={featuredBoltOns}
      libraryToken={enrollment.token}
    />
  )
}
