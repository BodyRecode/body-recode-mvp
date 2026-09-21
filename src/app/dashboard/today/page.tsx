import { requireCoachScope, coachFilter } from '@/lib/coach-scope'
import { createAdminClient } from '@/lib/supabase/admin'
import { productTierForScope } from '@/lib/coach-tier'
import { tierAllows } from '@/lib/product-tier'
import { coachToday } from '@/lib/coach-today'
import CoachTodayView from './coach-today-view'
import OwnerToday from './owner-today'

export const metadata = { title: 'Today' }

/**
 * Two Todays, because there are two kinds of person signing in.
 *
 * 21 September 2026. This page was Kade's business in full: Instagram posts,
 * stories, lead follow-ups, leads still deciding, live metrics, decisions and
 * the build board. Every section of it. A pilot coach's front door, the first
 * thing they saw every morning, had nothing in it they could act on, and what
 * it did show was his.
 *
 * The owner keeps his page exactly as it was. A coach gets the read pipeline,
 * the weekly loop, and who has gone quiet, which is the whole of their week.
 */
export default async function TodayPage() {
  const scope = await requireCoachScope()
  const admin = createAdminClient()
  const tier = await productTierForScope(admin, scope)

  if (tierAllows(tier, 'owner')) return <OwnerToday />

  const today = await coachToday(admin, coachFilter(scope))
  const firstName = (scope.email.split('@')[0] ?? '').split(/[.+_-]/)[0]

  return (
    <CoachTodayView
      today={today}
      firstName={firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : ''}
    />
  )
}
