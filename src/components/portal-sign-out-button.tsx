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
      className="text-xs text-[#999999] hover:text-[#6B6B6B] transition-colors"
    >
      Sign out
    </button>
  )
}
