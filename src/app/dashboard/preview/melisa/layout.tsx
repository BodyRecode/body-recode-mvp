import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isCoachEmail } from '@/lib/coach-auth'
import { MelisaShell } from './_lib/shell'

/**
 * Wraps every /dashboard/preview/melisa/* page in the Melisa-branded
 * shell (sidebar + topbar). Coach-gated at the layout level so nested
 * pages don't repeat the auth check.
 *
 * This is a MOCK. No DB writes, no LLM calls anywhere under this route.
 * When Melisa's real tenant is provisioned, this whole `/melisa/`
 * subtree gets removed.
 */
export default async function MelisaPreviewLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isCoachEmail(user.email)) redirect('/dashboard')

  return <MelisaShell>{children}</MelisaShell>
}
