-- CFWS Rationale Summary (2026-07-11)
--
-- Phase 1, item 3 of the Coach-Facing Rationale Compression rollout.
-- Same design as cffs.rationale_summary / programs.rationale_summary: keep
-- the verbose weekly interpretive fields untouched (downstream reads them),
-- and add a parallel `rationale_summary` JSONB the generator populates in the
-- same call (headline, scan pill row, operating_rules). Profile UI leads with
-- the summary card; the weekly sections collapse behind a toggle.
--
-- Nullable so existing CFWS rows display gracefully (sections inline).

alter table cfws
  add column if not exists rationale_summary jsonb;
