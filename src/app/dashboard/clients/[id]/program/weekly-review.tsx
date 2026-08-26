import { createAdminClient } from '@/lib/supabase/admin'
import ReviewCoachNotes from './review-coach-notes'

const directionColour: Record<string, string> = {
  progress: 'text-green-400 bg-green-400/10 border-green-400/30',
  hold: 'text-[#A96A12] bg-[#FDF6E9] border-[#F1DEB8]',
  rebuild: 'text-[#C82626] bg-[#FDEDED] border-[#F5C9C9]',
  deload: 'text-[#1056D6] bg-[rgba(27,109,252,0.08)] border-[#B5CFFC]',
}

const directionLabel: Record<string, string> = {
  progress: 'Making progress',
  hold: 'Staying steady',
  rebuild: 'Struggling',
  deload: 'Deload',
}

const signalLabel: Record<string, string> = {
  performance_up: 'Feeling stronger',
  performance_down: 'Struggling with sessions',
  stalled: 'No change',
  recovery_constraint: 'Recovering poorly',
  neutral_stable: 'Ticking along',
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

export default async function ProgramWeeklyReview({
  programId,
  currentDirection,
  lastReviewAt,
}: {
  programId: string
  currentDirection: string | null
  lastReviewAt: string | null
}) {
  const admin = createAdminClient()
  const { data: reviews } = await admin
    .from('program_reviews')
    .select('id, direction, signal_category, signals_noted, adherence_confirmed, reviewed_at, coach_notes')
    .eq('program_id', programId)
    .order('reviewed_at', { ascending: false })
    .limit(5)

  return (
    <div className="bg-[#F4F6F9] br-card overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#E8EAEE]">
        <div>
          <p className="text-sm font-semibold text-[#141821]">Weekly Review</p>
          <div className="flex items-center gap-2 mt-1">
            {currentDirection ? (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${directionColour[currentDirection] || 'text-[#666D7A] bg-[#EFF1F4] border-[#E8EAEE]'}`}>
                {directionLabel[currentDirection] ?? currentDirection}
              </span>
            ) : (
              <span className="text-[12.5px] text-[#98A0AD]">No review yet</span>
            )}
            {lastReviewAt && (
              <span className="text-[12.5px] text-[#98A0AD]">
                Last reviewed {new Date(lastReviewAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>
        <p className="text-[10px] text-[#98A0AD]">Client submits via portal</p>
      </div>

      {reviews && reviews.length > 0 ? (
        <div className="divide-y divide-[#EFF1F4]/60">
          {(reviews as Review[]).map((review) => (
            <div key={review.id} className="px-5 py-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${directionColour[review.direction] || 'text-[#666D7A] bg-[#EFF1F4] border-[#E8EAEE]'}`}>
                  {directionLabel[review.direction] ?? review.direction}
                </span>
                <span className="text-[12.5px] text-[#98A0AD]">
                  {new Date(review.reviewed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <span className="text-[12.5px] text-[#98A0AD] w-36 shrink-0">Sessions completed</span>
                  <span className={`text-xs font-medium ${review.adherence_confirmed ? 'text-[#1B6DFC]' : 'text-[#C82626]'}`}>
                    {review.adherence_confirmed ? 'Yes' : 'No'}
                  </span>
                </div>
                {review.signal_category && (
                  <div className="flex gap-2">
                    <span className="text-[12.5px] text-[#98A0AD] w-36 shrink-0">How training felt</span>
                    <span className="text-[12.5px] text-[#141821]">{review.signal_category.split(',').map(s => signalLabel[s.trim()] ?? s.trim().replace(/_/g, ' ')).join(', ')}</span>
                  </div>
                )}
                {review.signals_noted && (
                  <div className="flex gap-2">
                    <span className="text-[12.5px] text-[#98A0AD] w-36 shrink-0">Notes</span>
                    <span className="text-[12.5px] text-[#141821] leading-relaxed">{review.signals_noted}</span>
                  </div>
                )}
              </div>
              <ReviewCoachNotes reviewId={review.id} existingNotes={review.coach_notes} />
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-[#98A0AD]">No reviews submitted yet.</p>
          <p className="text-[12.5px] text-[#141821] mt-1">Client submits their weekly training check-in via the portal.</p>
        </div>
      )}
    </div>
  )
}
