-- Foundational Reading: coach guidance
--
-- Adds a free-text field where the coach can give the AI standing instructions
-- for this client's reading. The guidance is saved on the artifact, fed into
-- every subsequent regeneration, and persists across regenerations until the
-- coach clears it.
--
-- This is the "teach the model" primitive that complements inline section
-- edits (which fix surface wording without informing future generations).

ALTER TABLE cffs
  ADD COLUMN IF NOT EXISTS cr_coach_guidance TEXT;
