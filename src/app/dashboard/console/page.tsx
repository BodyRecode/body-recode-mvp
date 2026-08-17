import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isCoachEmail } from '@/lib/coach-auth'
import { brand, coach } from '@/config/tenant'
import ConsoleClient from './console-client'

export const metadata: Metadata = { title: 'Operator Console' }

/**
 * The Operator Console — a full page, not a bubble.
 *
 * The co-pilot bubble answers a question about the page you are already on.
 * This is the room you come to when the work IS the conversation: auditing what
 * fired, finding the leads who never moved, staging a re-engagement and reading
 * the list before it goes.
 */
export default async function ConsolePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Page-level gate as well as the route-level one. A non-coach hitting this
  // URL should get the dashboard, not an empty console that 403s on first use.
  if (!isCoachEmail(user.email)) redirect('/dashboard')

  return <ConsoleClient brandName={brand().name} coachFirstName={coach().firstName} />
}
