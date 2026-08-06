import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachUser, forbidden } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isCoachUser(user))) return forbidden()

  const { searchParams } = new URL(request.url)
  const equipment = searchParams.get('equipment')?.split(',').filter(Boolean) ?? []

  const admin = createAdminClient()
  let query = admin
    .from('exercises')
    .select('name, primary_pattern, secondary_pattern, mechanical_bias, primary_joint_stress, equipment, tier, stability_demand')
    .eq('is_active', true)
    .order('tier', { ascending: true })
    .order('name', { ascending: true })

  if (equipment.length > 0) {
    query = query.in('equipment', equipment)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ exercises: data ?? [] })
}
