import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FunnelEditor from '../funnel-editor'

export default async function FunnelEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: funnel } = await supabase
    .from('be_funnels')
    .select('*, be_funnel_pages(content, position)')
    .eq('id', id)
    .eq('coach_id', user!.id)
    .single()

  if (!funnel) notFound()

  const pages = (funnel.be_funnel_pages as Array<{ content: Record<string, string>; position: number }>)
    ?.sort((a, b) => a.position - b.position)
  const content = pages?.[0]?.content ?? {}

  return (
    <FunnelEditor
      funnel={{
        id: funnel.id,
        name: funnel.name,
        slug: funnel.slug,
        is_active: funnel.is_active,
        headline: content.headline ?? '',
        subheadline: content.subheadline ?? '',
        body: content.body ?? '',
        cta_label: content.cta_label ?? 'Book a Free Call',
        redirect_to: content.redirect_to ?? 'book',
      }}
    />
  )
}
