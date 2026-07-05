import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isCoachEmail } from '@/lib/coach-auth'
import { HermonyShell } from './_lib/shell'

/**
 * Wraps every /dashboard/preview/melisa/* page in the Hermony-branded
 * shell (mirror of the real BR dashboard header + nav). Coach-gated at
 * the layout level so nested pages don't repeat the auth check.
 *
 * This is a WHITE-LABEL MOCK. No DB writes, no LLM calls. It exists to
 * show Melisa what her tenant will look like: the same familiar BR
 * platform, wearing her brand.
 */
export default async function MelisaPreviewLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isCoachEmail(user.email)) redirect('/dashboard')

  return <HermonyShell>{children}</HermonyShell>
}
