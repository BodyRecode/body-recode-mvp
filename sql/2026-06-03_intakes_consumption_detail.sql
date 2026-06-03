-- Adds four free-text columns to `intakes` capturing the quantitative side of
-- the client's actual food intake, which the existing dietary-context columns
-- (2026-05-12) did not cover. The previous fields captured WHAT the client
-- eats (typical_day_eating) and what they cannot/will not eat; these capture
-- eating frequency and the drinks that move the energy and recovery picture:
--
--   meals_per_day   - how many times the client eats (meals + snacks). Feeds the
--                     appetite-suppression meal-count rules (>=4 meals on
--                     stimulant / GLP-1 / SSRI-SNRI) with a real baseline.
--   fluid_intake    - water and all other drinks, so caloric/sugary drinks are
--                     visible to the energy picture, not just solid food.
--   caffeine_intake - serves + timing. Sleep, appetite and stimulant interaction.
--   alcohol_intake  - drinks + frequency. Caloric load + sleep/recovery impact.
--
-- All four are free text and required by the intake form. Read by the nutrition
-- generation, nutrition suggestion, and CFFS prompts. Null means the client
-- wrote nothing (e.g. clients onboarded before this migration, until backfilled
-- via a supplementary intake).
--
-- Run in Supabase: SQL Editor -> paste -> Run.

ALTER TABLE intakes
  ADD COLUMN IF NOT EXISTS meals_per_day   TEXT,
  ADD COLUMN IF NOT EXISTS fluid_intake    TEXT,
  ADD COLUMN IF NOT EXISTS caffeine_intake TEXT,
  ADD COLUMN IF NOT EXISTS alcohol_intake  TEXT;

COMMENT ON COLUMN intakes.meals_per_day IS
  'How many times the client eats on a typical day (main meals + snacks). Free text. Required at intake. Read by nutrition + CFFS prompts; feeds appetite-suppression meal-count rules with a real frequency baseline.';

COMMENT ON COLUMN intakes.fluid_intake IS
  'What the client drinks across a typical day and roughly how much (water, tea, soft drink, juice, cordial, milk). Free text. Required at intake. Read by nutrition + CFFS prompts so caloric/sugary drinks enter the energy picture.';

COMMENT ON COLUMN intakes.caffeine_intake IS
  'Daily caffeine: coffee, tea, energy drinks, pre-workout, with serves and rough timing. "None" stored verbatim. Free text. Required at intake. Read by nutrition + CFFS prompts (sleep, appetite, stimulant interactions).';

COMMENT ON COLUMN intakes.alcohol_intake IS
  'Typical alcohol intake: what, how many standard drinks, days per week. "None" stored verbatim. Free text. Required at intake. Read by nutrition + CFFS prompts (caloric load, sleep and recovery impact).';
