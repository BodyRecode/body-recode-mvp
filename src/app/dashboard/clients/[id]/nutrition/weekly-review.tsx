import { createAdminClient } from '@/lib/supabase/admin'
import NutritionReviewCoachNotes from './review-coach-notes'

const directionColour: Record<string, string> = {
  progress: 'text-green-400 bg-green-400/10 border-green-400/30',
  hold: 'text-[#B06E1F] bg-[#FDF8F1] border-[#EADCC4]',
  rebuild: 'text-[#8F2D2D] bg-[#FBF1F1] border-[#E8C9C9]',
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
    <div className="bg-[#F2F2EF] br-card overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#E4E4E0]">
        <div>
          <p className="text-sm font-semibold text-[#0F1115]">Weekly Review</p>
          <div className="flex items-center gap-2 mt-1">
            {currentDirection ? (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${directionColour[currentDirection] || 'text-[#6E747D] bg-[#EDEDEA] border-[#E4E4E0]'}`}>
                {directionLabel[currentDirection] ?? currentDirection}
              </span>
            ) : (
              <span className="text-[12.5px] text-[#9CA2AB]">No review yet</span>
            )}
            {lastReviewAt && (
              <span className="text-[12.5px] text-[#9CA2AB]">
                Last reviewed {new Date(lastReviewAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>
        <p className="text-[10px] text-[#9CA2AB]">Client submits via portal</p>
      </div>

      {reviews && reviews.length > 0 ? (
        <div className="divide-y divide-[#EDEDEA]/60">
          {(reviews as Review[]).map((review) => (
            <div key={review.id} className="px-5 py-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${directionColour[review.direction] || 'text-[#6E747D] bg-[#EDEDEA] border-[#E4E4E0]'}`}>
                  {directionLabel[review.direction] ?? review.direction}
                </span>
                <span className="text-[12.5px] text-[#9CA2AB]">
                  {new Date(review.reviewed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <span className="text-[12.5px] text-[#9CA2AB] w-36 shrink-0">Followed plan</span>
                  <span className={`text-xs font-medium ${review.adherence_confirmed ? 'text-[#0F1115]' : 'text-[#8F2D2D]'}`}>
                    {review.adherence_confirmed ? 'Yes' : 'No'}
                  </span>
                </div>
                {review.signal_category && (
                  <div className="flex gap-2">
                    <span className="text-[12.5px] text-[#9CA2AB] w-36 shrink-0">What they noticed</span>
                    <span className="text-[12.5px] text-[#0F1115]">{review.signal_category.split(',').map(s => signalLabel[s.trim()] ?? s.trim().replace(/_/g, ' ')).join(', ')}</span>
                  </div>
                )}
                {review.signals_noted && (
                  <div className="flex gap-2">
                    <span className="text-[12.5px] text-[#9CA2AB] w-36 shrink-0">Notes</span>
                    <span className="text-[12.5px] text-[#0F1115] leading-relaxed">{review.signals_noted}</span>
                  </div>
                )}
              </div>
              <NutritionReviewCoachNotes reviewId={review.id} existingNotes={review.coach_notes} />
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-[#9CA2AB]">No reviews submitted yet.</p>
          {/* There is no standalone nutrition check-in any more. Nutrition is a
              section of the ONE weekly check-in, and submit-weekly-checkin still
              writes the nutrition_reviews rows this panel reads, so the panel is
              live even though the separate flow is gone. */}
          <p className="text-[12.5px] text-[#0F1115] mt-1">
            Fills in from the nutrition section of the weekly check-in. There is no separate nutrition check-in.
          </p>
        </div>
      )}
    </div>
  )
}
