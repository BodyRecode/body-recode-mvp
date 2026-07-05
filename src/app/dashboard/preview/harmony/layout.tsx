import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isCoachEmail } from '@/lib/coach-auth'
import { HarmonySite } from './_lib/site-shell'

/**
 * Coach-gated marketing site preview for Harmony (Melisa's business).
 * The Harmony brand + funnel structure mirroring BR's Hormozi money
 * model, wearing Melisa's yoga voice.
 *
 * White-label story: Harmony sells THEIR OWN scorecard, practice read,
 * discovery call, onboarding, and membership. The engine + doctrine
 * powering all of it is Body Recode. Footer surfaces the mark quietly.
 */
export default async function HarmonyPreviewLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isCoachEmail(user.email)) redirect('/dashboard')

  return <HarmonySite>{children}</HarmonySite>
}
