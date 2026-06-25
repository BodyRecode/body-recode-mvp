-- ============================================================
-- Modality routing (yoga / strength). Additive + safe.
-- A program and a client carry a modality. Default 'strength' so all
-- existing rows and flows are unchanged. Yoga programs store their sequence
-- in programs.sessions JSONB (yoga shape) and set modality = 'yoga'.
-- ============================================================

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS modality text NOT NULL DEFAULT 'strength'
  CHECK (modality IN ('strength', 'yoga'));

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS modality text NOT NULL DEFAULT 'strength'
  CHECK (modality IN ('strength', 'yoga'));

-- Existing grants on programs/clients already cover the new columns.
