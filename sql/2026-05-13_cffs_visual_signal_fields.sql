-- CFFS Visual Signal Integration: surface photo input + Claude's dedicated
-- visual summary on the coach-facing panel.
--
-- 2026-05-13. Sibling to the multimodal CFFS generation shipped same day.
--
--   photos_used             -- 0..3, how many baseline photos were attached
--                              when this CFFS row was generated. NULL on
--                              older rows generated before the multimodal
--                              flow shipped. The coach panel shows a small
--                              "Photos: ✓ 3/3" or "Photos: ✗ Not provided"
--                              badge driven off this column.
--
--   visual_signal_summary   -- Claude's 2-4 sentence dedicated read of what
--                              the photos contributed, separate from the
--                              main narrative sections. Rendered as the
--                              first section on the CFFS panel when
--                              populated. NULL on older rows and on rows
--                              where no photos were attached (Claude is
--                              instructed to omit the field in that case).
--
-- Idempotent. Run in Supabase SQL editor.

ALTER TABLE cffs
  ADD COLUMN IF NOT EXISTS photos_used SMALLINT,
  ADD COLUMN IF NOT EXISTS visual_signal_summary TEXT;

COMMENT ON COLUMN cffs.photos_used IS
  'Count (0..3) of baseline photos attached to the prompt when this CFFS was generated. NULL on rows predating the 2026-05-13 multimodal flow.';
COMMENT ON COLUMN cffs.visual_signal_summary IS
  'Claude''s dedicated 2-4 sentence summary of what the baseline photos contributed to the interpretation, separate from the main narrative sections. Populated only when photos were attached.';
