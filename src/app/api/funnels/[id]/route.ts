import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  // Update funnel name/slug/active
  const funnelUpdates: Record<string, unknown> = {}
  if ('name' in body) funnelUpdates.name = body.name
  if ('slug' in body) funnelUpdates.slug = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  if ('is_active' in body) funnelUpdates.is_active = body.is_active

  if (Object.keys(funnelUpdates).length > 0) {
    const { error } = await supabase
      .from('be_funnels')
      .update(funnelUpdates)
      .eq('id', id)
      .eq('coach_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update page content if provided
  const pageContent: Record<string, unknown> = {}
  if ('headline' in body) pageContent.headline = body.headline
  if ('subheadline' in body) pageContent.subheadline = body.subheadline
  if ('body' in body) pageContent.body = body.body
  if ('cta_label' in body) pageContent.cta_label = body.cta_label
  if ('redirect_to' in body) pageContent.redirect_to = body.redirect_to

  if (Object.keys(pageContent).length > 0) {
    // Get existing page
    const { data: page } = await supabase
      .from('be_funnel_pages')
      .select('id, content')
      .eq('funnel_id', id)
      .eq('position', 1)
      .single()

    if (page) {
      await supabase
        .from('be_funnel_pages')
        .update({ content: { ...(page.content as object), ...pageContent } })
        .eq('id', page.id)
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  const { error } = await supabase
    .from('be_funnels')
    .delete()
    .eq('id', id)
    .eq('coach_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
