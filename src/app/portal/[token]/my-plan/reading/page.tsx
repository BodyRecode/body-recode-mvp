import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import NutritionReadingLayout from '@/components/nutrition-reading-layout'

/**
 * Standalone client view of the Nutrition Reading.
 *
 * Cream-on-black premium document, same DNA as the Foundational Reading and
 * the Program Reading. The portal /my-plan page links here via the
 * "View as document" button. Auth-gated to the client whose token is in the URL.
 */
export default async function PortalNutritionReadingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email')
    .eq('onboarding_token', token)
    .single()

  if (!client) notFound()

  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase()) {
    redirect(`/portal/${token}`)
  }

  const { data: plan } = await admin
    .from('nutrition_plans')
    .select('id, plan_name, entry_state, pts_phase, nr_why_this_plan, nr_what_this_nutrition_is_doing, nr_how_well_know_its_working, nr_what_were_not_doing_yet, nr_coach_note, nutrition_reading_generated_at, nutrition_reading_published_at')
    .eq('client_id', client.id)
    .eq('is_active', true)
    .not('nutrition_reading_published_at', 'is', null)
    .maybeSingle()

  if (!plan) {
    return (
      <div className="min-h-screen bg-[#0c0a09] text-white flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-[#111110] border border-[#1c1917] rounded-2xl p-8 text-center">
          <p className="text-white text-lg font-semibold mb-2">Nutrition Reading not yet available</p>
          <p className="text-[#a8a29e] text-sm mb-6">
            Your Nutrition Reading will appear here once your coach has finalised the current plan.
          </p>
          <Link
            href={`/portal/${token}/my-plan`}
            className="inline-flex items-center gap-1.5 text-[12px] text-[#14b8a6] hover:text-[#5eead4] transition-colors"
          >
            <ChevronLeft size={13} /> Back to your nutrition plan
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Lightweight back affordance - the cream-on-black layout owns the rest */}
      <div className="no-print" style={{ position: 'fixed', top: 16, left: 16, zIndex: 50 }}>
        <Link
          href={`/portal/${token}/my-plan`}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-[#0c0a09]/80 backdrop-blur border border-[#1c1917] text-[#d4cfc9] hover:text-white hover:border-[#292524] transition-colors"
        >
          <ChevronLeft size={13} /> Back to plan
        </Link>
      </div>

      <NutritionReadingLayout
        reading={{
          nr_why_this_plan: plan.nr_why_this_plan,
          nr_what_this_nutrition_is_doing: plan.nr_what_this_nutrition_is_doing,
          nr_how_well_know_its_working: plan.nr_how_well_know_its_working,
          nr_what_were_not_doing_yet: plan.nr_what_were_not_doing_yet,
          nr_coach_note: plan.nr_coach_note,
          plan_name: plan.plan_name,
          entry_state: plan.entry_state,
          pts_phase: plan.pts_phase,
          generated_at: plan.nutrition_reading_generated_at!,
          nutrition_reading_published_at: plan.nutrition_reading_published_at,
        }}
        client={{ name: client.name }}
      />
    </>
  )
}
