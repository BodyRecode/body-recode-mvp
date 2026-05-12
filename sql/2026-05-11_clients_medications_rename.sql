-- Rename clients.hormonal_support -> clients.medications
--
-- The original column captured TRT / GLP-1 / peptides only. Broadening the
-- scope to all medications (beta-blockers, SSRIs/SNRIs, NSAIDs, stimulants,
-- anticoagulants, corticosteroids, contraceptives, statins, etc.) so the
-- engine can interpret the full pharmacological context, not just hormonal-
-- class drugs.
--
-- The data preserves verbatim. Existing rows that contain TRT / GLP-1 / peptide
-- descriptions continue to flow into the hormonal modulation logic in the
-- program + nutrition prompts (the modulation reads the text, not the column
-- name). New rows can include any medication.
--
-- Run in Supabase: SQL Editor -> paste -> Run.

ALTER TABLE clients RENAME COLUMN hormonal_support TO medications;
ALTER TABLE clients RENAME COLUMN hormonal_support_updated_at TO medications_updated_at;

COMMENT ON COLUMN clients.medications IS
  'Free text describing current medications, hormonal therapy, and chronic over-the-counter use. Includes TRT, GLP-1, peptides, anabolic support, plus beta-blockers, SSRIs/SNRIs, NSAIDs (chronic), stimulants, anticoagulants, corticosteroids, contraceptives, statins, and similar. Drives prescription modulation in program + nutrition generation. Null = none reported.';

COMMENT ON COLUMN clients.medications_updated_at IS
  'Set on every edit of the medications field. Used to flag stale programs / nutrition plans that were generated before the latest medication change.';
