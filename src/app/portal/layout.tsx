import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/portal/login')

  // Verify this user is a client
  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('portal_user_id', user.id)
    .single()

  if (!client) {
    // Signed in but not a client — sign out and redirect
    await supabase.auth.signOut()
    redirect('/portal/login')
  }

  return <>{children}</>
}
