-- CFFS Rationale Summary (2026-07-11)
--
-- Phase 1, item 2 of the Coach-Facing Rationale Compression rollout
-- (started 2026-07-05 on the Training Program rationale). The CFFS
-- (Foundational Synthesis) renders 7 interpretive sections of 3-5 sentences
-- each on the client profile page - a wall of prose the coach doesn't read
-- when scanning a client cold.
--
-- Same design decision as programs.rationale_summary: keep every verbose
-- interpretive field untouched (downstream generators - Foundational
-- Reading, program/nutrition suggestion, CFWS baseline - read them for
-- signal), and ADD a parallel `rationale_summary` JSONB the generator
-- populates in the same call with:
--   - headline (2-3 line body-state position + the one binding reason)
--   - scan (pill row: body_state, resolution, binding_constraint, flags_count)
--   - operating_rules (3-5 one-line bullets the coach holds in mind)
--
-- Profile UI leads with the summary card; the 7 interpretive sections
-- collapse behind an "Open full interpretive analysis" toggle. Nothing lost.
--
-- Nullable so existing CFFS rows display gracefully (sections show inline
-- when the summary is absent).

alter table cffs
  add column if not exists rationale_summary jsonb;
