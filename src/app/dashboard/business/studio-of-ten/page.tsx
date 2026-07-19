import { redirect } from 'next/navigation'

// Studio of Ten retired as a brand (2026-07-08). The strategy dashboard now lives
// at /dashboard/business/collective ("The Body Recode Collective"). This route
// stays only to redirect any old bookmarks.
export default function StudioOfTenRedirect() {
  redirect('/dashboard/business/collective')
}
