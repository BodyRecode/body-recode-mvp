-- Make a supplement shortlist reproducible.
--
-- The suggestion engine runs on AI_MODELS.clinical (Sonnet 5), where the
-- sampling parameters were removed: passing `temperature` returns a 400. So the
-- usual lever for determinism is not available and the same clinical picture can
-- return a different ranked shortlist on each run. Observed 8 Sep 2026: two runs
-- minutes apart on identical inputs, one returning Vitamin D3 + K2 (24 nmol/L
-- against a lab floor of 49) and the other dropping it for Creatine.
--
-- The answer already existed for the plan-side path: hash the CLINICAL picture
-- and reuse the previous answer when nothing in it has moved, so an unchanged
-- client cannot produce a different shortlist because the model is never asked
-- again. The coach's Generate button had no such check and re-ran every click.
--
-- This column lets that path carry forward too. Deliberately nullable: rows
-- written before this change have no fingerprint and will simply re-derive once.

alter table supplement_suggestions
  add column if not exists signal_fingerprint text;

comment on column supplement_suggestions.signal_fingerprint is
  'sha256 of the clinical inputs behind this shortlist (medications, medications analysis, latest blood panel, active assignments, recovery state). Unchanged fingerprint means reuse rather than re-run: the model cannot be asked twice about an unchanged client. See computeSupplementSignalFingerprint.';

create index if not exists supplement_suggestions_client_fingerprint_idx
  on supplement_suggestions (client_id, signal_fingerprint);
