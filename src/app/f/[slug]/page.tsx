import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import FunnelCapturePage from './funnel-capture-page'

export default async function PublicFunnelPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: funnel } = await admin
    .from('be_funnels')
    .select('id, name, be_funnel_pages(content, type, position)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!funnel) notFound()

  const pages = (funnel.be_funnel_pages as Array<{
    content: Record<string, string>
    type: string
    position: number
  }>).sort((a, b) => a.position - b.position)

  const page = pages[0]
  const content = page?.content ?? {}

  return (
    <FunnelCapturePage
      funnelId={funnel.id}
      headline={content.headline || funnel.name}
      subheadline={content.subheadline || ''}
      body={content.body || ''}
      ctaLabel={content.cta_label || 'Book a Free Call'}
      redirectTo={content.redirect_to || 'book'}
    />
  )
}
