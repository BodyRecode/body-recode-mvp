import { createAdminClient } from '@/lib/supabase/admin'
import NutritionReviewCoachNotes from './review-coach-notes'

const directionColour: Record<string, string> = {
  progress: 'text-green-400 bg-green-400/10 border-green-400/30',
  hold: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  rebuild: 'text-red-400 bg-red-400/10 border-red-400/30',
}

const directionLabel: Record<string, string> = {
  progress: 'Making progress',
  hold: 'Staying steady',
  rebuild: 'Struggling',
}

const signalLabel: Record<string, string> = {
  under_fuelling: 'Under-fuelled',
  over_fuelling: 'Over-fuelled',
  recovery_constraint: 'Recovery issues',
  adherence_constraint: 'Hard to stick to',
  neutral_stable: 'Feeling good',
}

interface Review {
  id: string
  direction: string
  signal_category: string | null
  signals_noted: string | null
  adherence_confirmed: boolean
  reviewed_at: string
  coach_notes: string | null
}

export default async function NutritionWeeklyReview({
  planId,
  currentDirection,
  lastReviewAt,
}: {
  planId: string
  currentDirection: string | null
  lastReviewAt: string | null
}) {
  const admin = createAdminClient()
  const { data: reviews } = await admin
    .from('nutrition_reviews')
    .select('id, direction, signal_category, signals_noted, adherence_confirmed, reviewed_at, coach_notes')
    .eq('nutrition_plan_id', planId)
    .order('reviewed_at', { ascending: false })
    .limit(5)

  const latest = reviews?.[0] ?? null

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-stone-800">
        <div>
          <p className="text-sm font-semibold text-stone-300">Weekly Review</p>
          <div className="flex items-center gap-2 mt-1">
            {currentDirection ? (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${directionColour[currentDirection] || 'text-stone-400 bg-stone-800 border-stone-700'}`}>
                {directionLabel[currentDirection] ?? currentDirection}
              </span>
            ) : (
              <span className="text-xs text-stone-600">No review yet</span>
            )}
            {lastReviewAt && (
              <span className="text-xs text-stone-600">
                Last reviewed {new Date(lastReviewAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>
        <p className="text-[10px] text-stone-600 uppercase tracking-wider">Client submits via portal</p>
      </div>

      {reviews && reviews.length > 0 ? (
        <div className="divide-y divide-stone-800/60">
          {(reviews as Review[]).map((review) => (
            <div key={review.id} className="px-5 py-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${directionColour[review.direction] || 'text-stone-400 bg-stone-800 border-stone-700'}`}>
                  {directionLabel[review.direction] ?? review.direction}
                </span>
                <span className="text-xs text-stone-600">
                  {new Date(review.reviewed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <span className="text-xs text-stone-600 w-36 shrink-0">Followed plan</span>
                  <span className={`text-xs font-medium ${review.adherence_confirmed ? 'text-teal-400' : 'text-red-400'}`}>
                    {review.adherence_confirmed ? 'Yes' : 'No'}
                  </span>
                </div>
                {review.signal_category && (
                  <div className="flex gap-2">
                    <span className="text-xs text-stone-600 w-36 shrink-0">What they noticed</span>
                    <span className="text-xs text-stone-300">{review.signal_category.split(',').map(s => signalLabel[s.trim()] ?? s.trim().replace(/_/g, ' ')).join(', ')}</span>
                  </div>
                )}
                {review.signals_noted && (
                  <div className="flex gap-2">
                    <span className="text-xs text-stone-600 w-36 shrink-0">Notes</span>
                    <span className="text-xs text-stone-300 leading-relaxed">{review.signals_noted}</span>
                  </div>
                )}
              </div>
              <NutritionReviewCoachNotes reviewId={review.id} existingNotes={review.coach_notes} />
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-stone-600">No reviews submitted yet.</p>
          <p className="text-xs text-stone-700 mt-1">Client submits their weekly nutrition check-in via the portal.</p>
        </div>
      )}
    </div>
  )
}
