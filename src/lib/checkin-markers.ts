// The 8 biological markers rated in Part 1 of the Body Decode Check-In.
// Single source of truth. Consumed by:
//   - src/app/challenge/[token]/body-decode-check-in.tsx (form rendering + result rendering)
//   - src/app/api/challenge/quiz/route.ts (Day 7 progress-feedback email per-marker breakdown)
//   - src/lib/inngest-functions.ts (Day 14 Body Decode Report email per-marker recap)

export type ProgressMarker = {
  id: string
  label: string
  sub: string
}

export const PROGRESS_MARKERS: ProgressMarker[] = [
  { id: 'morning_energy',   label: 'Morning energy',           sub: 'How you feel when you wake up' },
  { id: 'afternoon_energy', label: 'Afternoon energy',         sub: 'The 2-4pm window' },
  { id: 'puffiness',        label: 'Puffiness and bloating',   sub: 'Through the day' },
  { id: 'sleep',            label: 'Sleep quality',            sub: 'How rested you feel' },
  { id: 'cravings',         label: 'Food cravings and hunger', sub: 'Predictability and intensity' },
  { id: 'clarity',          label: 'Mental clarity and focus', sub: 'Sharpness across the day' },
  { id: 'mood',             label: 'Mood stability',           sub: 'Consistency and evenness' },
  { id: 'digestion',        label: 'Digestion',                sub: 'Comfort and regularity' },
]

// Display values for the three rating options participants choose from in Part 1.
// 'better' is the only value that increments the progress score (counted by
// the API route + Inngest step). Kept here so the form, the email, and any
// future surfaces all use the same labels and colour treatments.
export type MarkerRating = 'better' | 'same' | 'challenge'

export type MarkerRatingMeta = {
  label: string
  color: string
  background: string
  border: string
}

export const MARKER_RATING_META: Record<MarkerRating, MarkerRatingMeta> = {
  better:    { label: 'Improving',         color: '#1056D6', background: 'rgba(27,109,252,0.10)', border: 'rgba(27,109,252,0.25)' },
  same:      { label: 'About the same',    color: '#6B6B6B', background: '#F5F5F5',               border: '#E5E5E5' },
  challenge: { label: 'Still a challenge', color: '#B7791F', background: 'rgba(183,121,31,0.10)', border: 'rgba(183,121,31,0.25)' },
}
