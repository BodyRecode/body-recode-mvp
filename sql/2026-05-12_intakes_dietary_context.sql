-- Adds four free-text columns to `intakes` capturing the client's actual
-- dietary context: what they cannot eat (clinical), what they will not eat
-- (personal / cultural / religious), what a typical day looks like, and any
-- contextual factors that shape adherence (cooking, family meals, travel).
--
-- The existing Section D nutrition_responses (jsonb of scale answers) captures
-- behavioural PATTERNS around eating. These new columns capture the actual
-- CONTENT, so the nutrition engine produces a plan the client can actually
-- adopt (not just doctrinally correct under their pattern profile).
--
-- All four are free text. Three are required by the intake form (restrictions,
-- preferences, typical_day); eating_context is optional. Submit-intake writes
-- whatever the client enters; null means the client wrote nothing.
--
-- Run in Supabase: SQL Editor -> paste -> Run.

ALTER TABLE intakes
  ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT,
  ADD COLUMN IF NOT EXISTS dietary_preferences  TEXT,
  ADD COLUMN IF NOT EXISTS typical_day_eating   TEXT,
  ADD COLUMN IF NOT EXISTS eating_context       TEXT;

COMMENT ON COLUMN intakes.dietary_restrictions IS
  'Allergies, intolerances, medical dietary restrictions. Free text. Required at intake. "None" or similar stored verbatim. Read by nutrition + CFFS prompts.';

COMMENT ON COLUMN intakes.dietary_preferences IS
  'Foods the client avoids for personal, cultural, or religious reasons (vegan, vegetarian, halal, kosher, specific dislikes). Free text. Required at intake. Read by nutrition + CFFS prompts.';

COMMENT ON COLUMN intakes.typical_day_eating IS
  '24-hour food recall. What the client typically eats across breakfast, lunch, dinner, snacks on an average day. Free text. Required at intake. Read by nutrition + CFFS prompts so the engine has a baseline to design against.';

COMMENT ON COLUMN intakes.eating_context IS
  'Optional context about the client''s eating environment: who cooks, family meals, work meals, frequent travel, takeaway frequency, etc. Free text. Read by nutrition prompt for adherence-realistic plan design.';
