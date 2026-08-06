/**
 * Set the category tag on a be_products row. Used by the inline dropdown on
 * the Payments Reconcile page.
 *
 * POST body: { product_id: string, category: string | null }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

const ALLOWED = new Set(['performance_coaching', 'body_recode', 'studio_of_ten', 'overhead', 'other'])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const body = await request.json().catch(() => null)
  const productId = body?.product_id
  const category = body?.category

  if (!productId || typeof productId !== 'string') {
    return NextResponse.json({ error: 'product_id required' }, { status: 400 })
  }
  if (category !== null && !ALLOWED.has(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: product } = await admin
    .from('be_products')
    .select('id, coach_id')
    .eq('id', productId)
    .single()
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  if (product.coach_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await admin
    .from('be_products')
    .update({ category })
    .eq('id', productId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
