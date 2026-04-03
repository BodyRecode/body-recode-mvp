'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PortalSignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/portal/login')
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs text-stone-600 hover:text-stone-400 transition-colors"
    >
      Sign out
    </button>
  )
}
