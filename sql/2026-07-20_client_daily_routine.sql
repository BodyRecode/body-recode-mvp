-- Add daily_routine column for the coach-authored Morning Reset Sequence +
-- Evening Rhythm Sequence per client.
--
-- Naming matches the existing Challenge product (see
-- src/app/challenge/[token]/challenge-portal-client.tsx) so clients moving
-- from Challenge to Coaching hear the same brand language throughout.
--
-- Shape:
--   {
--     "morning": {
--       "title": "Morning Reset Sequence",
--       "tagline": "5 minutes every morning. Do this before caffeine.",
--       "steps": ["...", "...", ...],
--       "coach_note": "optional coach personalisation"
--     },
--     "evening": {
--       "title": "Evening Rhythm Sequence",
--       "tagline": "Wind down your nervous system before sleep.",
--       "steps": ["...", "...", ...],
--       "coach_note": "optional coach personalisation"
--     }
--   }
--
-- NULL means "use canonical defaults" (defined in src/lib/daily-routine-defaults.ts).
-- Any client whose value is null renders the same brand-standard routine on
-- their portal; the coach personalises by writing to this column.

alter table public.clients
  add column if not exists daily_routine jsonb;

comment on column public.clients.daily_routine is
  'Client-facing Morning Reset Sequence + Evening Rhythm Sequence. JSONB shape { morning: {title, tagline, steps[], coach_note}, evening: {...} }. NULL = fall back to canonical defaults in src/lib/daily-routine-defaults.ts.';
