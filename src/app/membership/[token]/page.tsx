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

async function pickFeaturedBoltOn(memberEmail: string): Promise<FeaturedBoltOn | null> {
  const admin = createAdminClient()

  // Bolt-on products active right now.
  const { data: products } = await admin
    .from('be_products')
    .select('id, name, price, kind, created_at, digital_asset_metadata!inner(slug, active)')
    .in('kind', ['protocol', 'bolt_on_ai'])
    .order('created_at', { ascending: false })

  if (!products?.length) return null

  // Pull purchases so we don't feature what they already own.
  const { data: purchases } = await admin
    .from('digital_asset_purchases')
    .select('product_id, status')
    .eq('email_at_purchase', memberEmail.toLowerCase())
    .in('status', ['paid', 'fulfilled'])
  const purchasedIds = new Set((purchases ?? []).map(p => p.product_id))

  for (const p of products) {
    const meta = Array.isArray(p.digital_asset_metadata) ? p.digital_asset_metadata[0] : p.digital_asset_metadata
    if (!meta?.active) continue
    if (purchasedIds.has(p.id)) continue
    const copy = BOLT_ON_AD_COPY[meta.slug]
    if (!copy) continue
    // Sign the cover URL
    const { data: signed } = await admin.storage
      .from('library-assets')
      .createSignedUrl(copy.cover_path, 60 * 60 * 24)
    if (!signed?.signedUrl) continue
    return {
      product_id: p.id,
      slug: meta.slug,
      name: p.name,
      price: Number(p.price) || 0,
      kind: p.kind,
      tagline: copy.tagline,
      hero_headline: copy.hero_headline,
      cover_signed_url: signed.signedUrl,
    }
  }
  return null
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

  const featuredBoltOn = enrollment.email
    ? await pickFeaturedBoltOn(enrollment.email)
    : null

  return (
    <MembershipPortalClient
      enrollment={enrollment}
      featuredBoltOn={featuredBoltOn}
      libraryToken={enrollment.token}
    />
  )
}
