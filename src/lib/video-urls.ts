// Single source of truth for hosted video + poster URLs.
//
// Videos live in the public Supabase storage bucket `videos`, NOT in public/.
// Bundling them into the app pushed the repo past 450MB and slowed every
// deploy; storage serves them with range requests so clients can scrub, and
// swapping a video (Amanda ships a V5) is a storage replace with no redeploy.
//
// To swap a video: upload over the same object name in the `videos` bucket.
// Nothing in the app needs to change.

// These URLs are embedded in EMAILS, where a relative path is a broken image
// with no way to recover after send. If NEXT_PUBLIC_SUPABASE_URL is ever
// missing or blank at build time, fall back to the known project URL rather
// than emitting a relative path.
const FALLBACK_URL = 'https://klotlednmxhywimztozm.supabase.co'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL
const BUCKET = 'videos'

function videoUrl(name: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${name}`
}

/** Blueprint education lessons, keyed by programme week (1-5). */
export const BLUEPRINT_LESSON_VIDEOS: Record<number, string> = {
  1: videoUrl('blueprint-lesson-1-cortisol.mp4'),
  2: videoUrl('blueprint-lesson-2-insulin.mp4'),
  3: videoUrl('blueprint-lesson-3-testosterone.mp4'),
  4: videoUrl('blueprint-lesson-4-thyroid.mp4'),
  5: videoUrl('blueprint-lesson-5-sleep.mp4'),
}

// Pattern welcome videos are keyed by the INTERNAL pattern slug used in
// checkin-patterns.ts, which does not match the display label:
//   stress-stored   -> Stress-Stored Pattern
//   metabolic-drift -> Insulin-Drift Pattern
//   hormonal-shift  -> Estrogen-Shift Pattern
//   system-overload -> Androgen-Decline Pattern
// Amanda names her files by the display label, so the mapping is deliberate.
export const BLUEPRINT_WELCOME_VIDEOS: Record<string, string> = {
  'stress-stored': videoUrl('blueprint-welcome-stress-stored.mp4'),
  'metabolic-drift': videoUrl('blueprint-welcome-insulin-drift.mp4'),
  'hormonal-shift': videoUrl('blueprint-welcome-estrogen-shift.mp4'),
  'system-overload': videoUrl('blueprint-welcome-androgen-decline.mp4'),
}

export const BLUEPRINT_WELCOME_POSTERS: Record<string, string> = {
  'stress-stored': videoUrl('poster-welcome-stress-stored.jpg'),
  'metabolic-drift': videoUrl('poster-welcome-insulin-drift.jpg'),
  'hormonal-shift': videoUrl('poster-welcome-estrogen-shift.jpg'),
  'system-overload': videoUrl('poster-welcome-androgen-decline.jpg'),
}

/** Day 14 ascension reel - 9:16 vertical, sells Blueprint at Challenge end. */
export const DAY_14_ASCENSION_REEL = videoUrl('challenge-day-14-ascension-reel.mp4')
export const DAY_14_ASCENSION_POSTER = videoUrl('poster-day-14-ascension-reel.jpg')

// Week 6 ascension video is NOT yet delivered by Amanda. Its portal card and
// email still render the in-production placeholder. Add the entry here and
// swap the two placeholder call sites when it lands.
