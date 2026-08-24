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

/**
 * The Body Decode — five daily lesson videos, keyed by day (1-5).
 *
 * Amanda fronts all five (Kade's decision 23 Aug 2026: Amanda teaches, Kade
 * reads). They are UNIVERSAL, not pattern-specific — the pattern-specific
 * content is the text underneath, pulled from CHECKIN_PATTERNS. Five videos,
 * not twenty.
 *
 * Not yet delivered. Until they are, the day pages render the lesson premise
 * and the pattern block with no player, which is a legible page rather than a
 * broken one. Scripts: 09_PARTNERSHIPS/Amanda_Contra/2026-08-23_FIVE_DAY_READ_SCRIPTS_v1.md
 */
export const DECODE_LESSON_VIDEOS: Record<number, string> = {
  1: videoUrl('decode-lesson-1-your-two-lowest.mp4'),
  2: videoUrl('decode-lesson-2-why-it-happens.mp4'),
  3: videoUrl('decode-lesson-3-where-it-shows.mp4'),
  4: videoUrl('decode-lesson-4-what-this-is-not.mp4'),
  5: videoUrl('decode-lesson-5-what-moves-it.mp4'),
}

/** Day 5, Kade delivering the full read. Replaces challenge-day-14.mp4. */
export const DECODE_READ_VIDEO = videoUrl('decode-day-5-the-read.mp4')

/**
 * The Body Decode landing page explainer. Kade.
 *
 * Replaces challenge-explainer.mp4, which cannot be re-cut: it argues FOR the
 * fourteen days ("you get 14 days of structure designed to bring it to the point
 * where it can be read properly"), so it is a new argument rather than an edit.
 * Script 1 in 09_PARTNERSHIPS/Amanda_Contra/2026-08-24_BODY_DECODE_SCRIPTS_v2.md.
 *
 * Not delivered yet. The page renders a branded placeholder until it lands.
 */
export const DECODE_EXPLAINER_VIDEO = videoUrl('decode-explainer.mp4')
export const DECODE_EXPLAINER_POSTER = videoUrl('poster-decode-explainer.jpg')
