-- Progress Read (Phase 2): state re-score fields on the block reading.
-- The block-end Trajectory Reading becomes the Progress Read: alongside the five
-- narrative tr_* sections it now carries a conservative body-state re-score from
-- the client's end-of-block Progress Check + the weekly arc. Pattern is HELD.
-- Uses the tr_ (block/trajectory reading) prefix; pr_ is the Program Reading.
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS tr_new_body_state text,
  ADD COLUMN IF NOT EXISTS tr_previous_body_state text,
  ADD COLUMN IF NOT EXISTS tr_state_direction text,          -- improved | held | regressed
  ADD COLUMN IF NOT EXISTS tr_state_rationale text,
  ADD COLUMN IF NOT EXISTS tr_pattern_confidence_note text,
  ADD COLUMN IF NOT EXISTS tr_progress_check_id uuid REFERENCES progress_checks(id) ON DELETE SET NULL;
